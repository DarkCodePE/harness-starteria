"""Agent 1: Orchestrator — enruta solicitudes a agentes trabajadores con create_deep_agent().

Routing logic:
  step=0                         -> mentor-virtual
  action=feedback (any step)     -> feedback-ia
  step=1, module=B               -> research-assistant
  step=2, action=hmw-generate    -> solution-design
  step=2, action=ideate          -> solution-design
  step=2, action=experiment-routes -> solution-design
  step=3, action=prototype-suggest -> experiment-coach
  step=3, action=experiment-analyze -> experiment-coach
  step=4                         -> narrative-builder
  action=pdf_extract (any step)  -> pdf-extractor  (TASK-008, ADR-002 routing table)
  agentHint overrides step/module logic when set

TODO(ADR-002): once the orchestrator owns a first-class routing table, replace the
prompt-based routing above with a structured `(step, action) -> agent_id` map. The
pdf-extractor entry is currently handled directly via `/ai/pdf-extract` (TASK-008),
bypassing the orchestrator because the worker is async + binary-heavy. The hook
below is the placeholder so the routing table is complete on paper.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any

from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore

from agents.experiment_coach import create_experiment_coach_agent
from agents.feedback_ia import create_feedback_ia_agent
from agents.mentor_virtual import create_mentor_virtual_agent
from agents.narrative_builder import create_narrative_builder_agent
from agents.research_assistant import create_research_assistant_agent
from agents.solution_design import create_solution_design_agent
from schemas.requests import InvokeRequest
from schemas.responses import InvokeResponse
from services.context_assembler import ContextAssembler
from services.cost_tracker import CostTracker
from services.usage_collector import UsageCollector
from tools.context_tools import get_agent_routing_hint, get_step_description

logger = logging.getLogger(__name__)

AGENT_ID = "orchestrator"
MODEL = "openrouter:qwen/qwen3.6-flash"
SKILLS_DIR = str(Path(__file__).parent.parent / "skills")

_SYSTEM_PROMPT = """Eres el Orquestador del sistema multi-agente de Starteria.

Recibes solicitudes del backend y las enrutas al agente especializado correcto
usando el tool `task` para delegar al subagente:

- step=0: delegar a mentor-virtual
- action=feedback: delegar a feedback-ia
- step=1 y module=B: delegar a research-assistant
- step=2 con action=hmw-generate, ideate o experiment-routes: delegar a solution-design
- step=3 con action=prototype-suggest o experiment-analyze: delegar a experiment-coach
- step=4: delegar a narrative-builder

Usa get_agent_routing_hint para confirmar el agente correcto si no estas seguro.

Retorna SIEMPRE la respuesta del subagente sin modificarla.
Sé directo y eficiente. Responde en espanol."""


_context_assembler = ContextAssembler()
_cost_tracker = CostTracker()

# Shared InMemoryStore for cross-thread memory
_shared_store = InMemoryStore()


_SUBAGENT_DESCRIPTIONS: dict[str, str] = {
    "mentor-virtual": (
        "Coaching formativo del Step 0: revisa la descripcion inicial del problema "
        "y devuelve feedback estructurado (claro, faltaPrecisar, preguntas, siguienteAccion)."
    ),
    "feedback-ia": (
        "Evaluacion formativa por modulo con rubrica: emite veredicto Aprobado/Iterar/Bloqueado "
        "con justificacion."
    ),
    "research-assistant": (
        "Genera plan de investigacion cualitativa (objetivo, temas, perfiles, guia de preguntas) "
        "a partir del analisis AS-IS del Modulo A en Step 1."
    ),
    "solution-design": (
        "Diseno de soluciones del Step 2: genera HMWs, ideacion divergente y rutas de experimento."
    ),
    "experiment-coach": (
        "Coach del Step 3: sugiere prototipos y analiza resultados Go/No-Go de experimentos."
    ),
    "narrative-builder": (
        "Constructor de narrativa del Step 4: storytelling de innovacion y presentaciones de impacto."
    ),
    # TASK-008: pdf_extract is async (ADR-008) and handled directly via the
    # router endpoint; the orchestrator surfaces it only as a routing target so
    # the ADR-002 table stays complete.
    "pdf-extractor": (
        "Extrae propuestas de campos por Step (0-4) a partir de un PDF de iniciativa, "
        "con provenance por página y costo controlado. Async: el endpoint devuelve runId."
    ),
}


# TASK-008 §13 — ADR-002 routing-table hook. Used by future structured routing.
# For V1 the endpoint `/ai/pdf-extract` bypasses the deepagents prompt-based router.
ACTION_ROUTING_TABLE: dict[str, str] = {
    "pdf_extract": "pdf-extractor",
}


class _UnconfiguredOrchestrator:
    """Stub returned when OPENROUTER_API_KEY is missing. Lets uvicorn start so the
    other endpoints (notably /ai/pdf-extract, which has its own LLM init) stay up.
    Any invocation raises a clear configuration error mapped to a 503 by the router.
    """

    def __init__(self, reason: str) -> None:
        self._reason = reason

    def invoke(self, *_args: Any, **_kwargs: Any) -> Any:  # noqa: ANN401
        raise RuntimeError(f"Orchestrator unavailable: {self._reason}")

    async def ainvoke(self, *_args: Any, **_kwargs: Any) -> Any:  # noqa: ANN401
        raise RuntimeError(f"Orchestrator unavailable: {self._reason}")


def _build_orchestrator() -> Any:
    """Construye el agente orquestador con todos los subagentes.

    Si `OPENROUTER_API_KEY` no está configurada, devuelve un stub que falla con
    error claro en cada invocación. Esto permite que uvicorn arranque y que otros
    endpoints (p.ej. `/ai/pdf-extract`, que tiene su propio init de LLM) sigan
    funcionando. Sin este fallback, un container sin la key crashea al startup.
    """
    import os

    if not os.getenv("OPENROUTER_API_KEY"):
        msg = "OPENROUTER_API_KEY not set; deepagents-based subagents disabled until configured."
        logger.warning(msg)
        return _UnconfiguredOrchestrator(reason=msg)

    subagent_factories = [
        ("mentor-virtual", create_mentor_virtual_agent),
        ("feedback-ia", create_feedback_ia_agent),
        ("research-assistant", create_research_assistant_agent),
        ("solution-design", create_solution_design_agent),
        ("experiment-coach", create_experiment_coach_agent),
        ("narrative-builder", create_narrative_builder_agent),
    ]

    # Build each subagent defensively — a single bad factory must not kill startup
    # for the whole orchestrator. If any factory raises (e.g. transient ChatOpenRouter
    # init issue), log + skip that subagent. The orchestrator runs with what survives.
    subagents = []
    for name, factory in subagent_factories:
        try:
            runnable = factory()
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to build subagent %r: %s — skipping", name, exc)
            continue
        subagents.append({
            "name": name,
            "description": _SUBAGENT_DESCRIPTIONS[name],
            "runnable": runnable,
        })

    if not subagents:
        msg = "All deepagents-based subagent factories failed; orchestrator disabled."
        logger.error(msg)
        return _UnconfiguredOrchestrator(reason=msg)

    try:
        return create_deep_agent(
            name=AGENT_ID,
            model=MODEL,
            tools=[get_agent_routing_hint, get_step_description],
            system_prompt=_SYSTEM_PROMPT,
            subagents=subagents,
            backend=FilesystemBackend(
                root_dir=str(Path(__file__).parent.parent),
                virtual_mode=True,
            ),
            skills=[SKILLS_DIR],
            checkpointer=MemorySaver(),
            store=_shared_store,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("create_deep_agent failed: %s — orchestrator disabled", exc)
        return _UnconfiguredOrchestrator(reason=f"create_deep_agent failed: {exc}")


# Singleton — initialized once per process
_orchestrator_instance: Any = None


def get_orchestrator() -> Any:
    """Retorna la instancia singleton del orquestador, creandola si es necesario."""
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = _build_orchestrator()
    return _orchestrator_instance


class OrchestratorAgent:
    """Public facade that runs the deepagents orchestration pipeline.

    Maintains backward compatibility with the existing router interface.
    """

    def __init__(self) -> None:
        self._orchestrator = get_orchestrator()

    async def invoke(self, request: InvokeRequest) -> InvokeResponse:
        """Process an InvokeRequest.

        mode="baseline" (default) → the existing prompt-based deepagents routing, unchanged.
        mode="harness" (ADR-027) → run the methodology diagnostic pipeline first, then route.

        Raises:
            CostLimitExceededError: If cost ceilings are exceeded.
        """
        if getattr(request, "mode", "baseline") == "harness":
            return await self.invoke_harnessed(request)
        return await self._run_deepagent(request)

    async def invoke_harnessed(self, request: InvokeRequest) -> InvokeResponse:
        """ADR-027 path: diagnose the request, then route (or ask for confirmation).

        On a ``route`` decision the chosen Step agent is invoked via the existing deepagents
        pipeline with the harness-selected agentHint. On ``confirm``/``escalate`` NO step agent
        is invoked (cost saved) — the confirmation/escalation + trace are returned directly.
        """
        # Lazy import keeps package import cheap and avoids a hard dep at module load.
        from harness.harness import get_harness

        start = time.monotonic()
        project_id: str = request.payload.get("projectId", "unknown")  # type: ignore[union-attr]
        harness = get_harness()
        _cost_tracker.check_project_daily_budget(project_id)
        _cost_tracker.check_request_cost(
            agent_id="methodology-harness",
            models=(harness.ground_model_ref, harness.interpret_model_ref),
        )

        request_ref = {
            "step": request.step,
            "module": request.module,
            "action": request.action,
            "agentHint": request.agentHint,
            "payload": request.payload,
            "companyContext": request.payload.get("companyContext"),
            "addedContext": request.payload.get("addedContext"),
            "confirmationResponse": request.confirmationResponse,
        }
        raw_input = str(
            request.payload.get("originalInput")
            or request.payload.get("descripcion")
            or request.payload.get("description")
            or ""
        )
        decision = harness.diagnose(request_ref, raw_input=raw_input, project_id=project_id)

        # E6 records per-stage tokens on the trace; without this they never reach the budget.
        # Charged separately from any step agent invoked below: different call, different model.
        harness_in = sum(s.tokens_in or 0 for s in decision.trace.stages)
        harness_out = sum(s.tokens_out or 0 for s in decision.trace.stages)
        for stage in decision.trace.stages:
            if stage.llm_used:
                model = (f"{stage.model_provider}:{stage.model_id}"
                         if stage.model_provider and stage.model_id else None)
                _cost_tracker.record_usage(
                    project_id=project_id,
                    agent_id="methodology-harness",
                    input_tokens=stage.tokens_in,
                    output_tokens=stage.tokens_out,
                    model=model,
                )

        diagnosis_payload = {
            "kind": decision.kind,
            "route_profile": decision.route_profile.model_dump() if decision.route_profile else None,
            "method_pack_id": decision.method_pack_id,
            "gate": decision.gate.model_dump(),
            "confirmation": decision.confirmation.model_dump() if decision.confirmation else None,
            "trace": decision.trace.model_dump(mode="json"),
        }

        if decision.kind == "route":
            routed = request.model_copy(
                update={
                    "mode": "baseline",
                    "agentHint": decision.target_agent,
                    "step": decision.route_profile.step if decision.route_profile else request.step,
                }
            )
            resp = await self._run_deepagent(routed)
            data = dict(resp.data) if isinstance(resp.data, dict) else {"response": resp.data}
            data["_diagnosis"] = diagnosis_payload
            return InvokeResponse(
                data=data,
                agent=f"harness→{decision.target_agent}",
                model=resp.model,
                tokensUsed=resp.tokensUsed,
                latencyMs=int((time.monotonic() - start) * 1000),
            )

        # confirm / escalate → return without invoking a step agent.
        return InvokeResponse(
            data=diagnosis_payload,
            agent="methodology-harness",
            model=harness._model_id(),  # noqa: SLF001 — model id for audit surface
            tokensUsed=harness_in + harness_out,
            latencyMs=int((time.monotonic() - start) * 1000),
        )

    async def _run_deepagent(self, request: InvokeRequest) -> InvokeResponse:
        """The baseline prompt-based deepagents orchestration (unchanged behavior)."""
        start = time.monotonic()
        project_id: str = request.payload.get("projectId", "unknown")  # type: ignore[union-attr]

        # Pre-flight cost checks
        _cost_tracker.check_project_daily_budget(project_id)
        _cost_tracker.check_request_cost(agent_id=request.agentHint or "feedback-ia")

        user_content = json.dumps(
            {
                "step": request.step,
                "module": request.module,
                "action": request.action,
                "agentHint": request.agentHint,
                "payload": request.payload,
            },
            ensure_ascii=False,
        )

        # The handler observes only the calls made inside THIS invocation. Sweeping
        # result["messages"] would re-bill the whole thread, which thread_id persists.
        usage = UsageCollector()
        config = {"configurable": {"thread_id": project_id}, "callbacks": [usage]}

        result = self._orchestrator.invoke(
            {"messages": [{"role": "user", "content": user_content}]},
            config=config,
        )

        total_ms = int((time.monotonic() - start) * 1000)

        # Extract last AI message from result
        messages = result.get("messages", [])
        raw_content = ""
        if messages:
            last_msg = messages[-1]
            raw_content = (
                last_msg.content
                if hasattr(last_msg, "content")
                else str(last_msg)
            )

        # Try to parse the response as JSON data
        try:
            data = json.loads(raw_content)
        except (json.JSONDecodeError, TypeError):
            data = {"response": raw_content}

        if not usage.complete:
            logger.warning(
                "usage_incomplete project=%s agent=%s calls=%d without_usage=%d — the "
                "daily budget is under-counted for this request",
                project_id,
                AGENT_ID,
                usage.calls,
                usage.calls_without_usage,
            )
        _cost_tracker.record_usage(
            project_id=project_id,
            agent_id=AGENT_ID,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
        )

        return InvokeResponse(
            data=data,
            agent=AGENT_ID,
            model=MODEL,
            tokensUsed=0,
            latencyMs=total_ms,
        )
