"""Deterministic stages: INTAKE, CONFIRM, CLASSIFY_ROUTE, METHOD_HINT, GATE, EMIT (ADR-027).

These contain no LLM calls — they are pure functions of the DiagnosisState plus the
methodology config, so they are fully unit-testable and reproducible.
"""

from __future__ import annotations

from harness.config_models import RoutingRule
from harness.contracts import (
    ConfirmationRequest,
    DiagnosisState,
    EpistemicStatus,
    GateVerdict,
)
from harness.stages import StageContext
from harness.state_machine import HarnessStage
from harness.trace import HarnessDecision, HarnessTrace

# Human-friendly labels for strategic questions built from field keys.
_FRIENDLY: dict[str, str] = {
    "objective": "el objetivo concreto",
    "audience": "la audiencia / usuarios",
    "owner": "el responsable (owner)",
    "baseline": "la línea base actual",
    "deadline": "el plazo o ventana",
    "data_governance": "la gobernanza de datos",
    "evidence": "la evidencia disponible",
    "constraints": "las restricciones",
}


def _friendly(key: str) -> str:
    return _FRIENDLY.get(key, key)


# ---------------------------------------------------------------------------
# INTAKE
# ---------------------------------------------------------------------------


def run_intake(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Normalize the request into the working state (deterministic)."""
    payload = state.request_ref.get("payload") or {}
    if not state.raw_input:
        state.raw_input = str(
            payload.get("originalInput")
            or payload.get("descripcion")
            or payload.get("description")
            or state.request_ref.get("raw_input")
            or ""
        )
    if state.project_id == "unknown":
        state.project_id = str(payload.get("projectId") or state.request_ref.get("projectId") or "unknown")
    return None


# ---------------------------------------------------------------------------
# CONFIRM  — §9 hard gate; short-circuits to EMIT when a human is required.
# ---------------------------------------------------------------------------


def _strategic_questions(state: DiagnosisState, ctx: StageContext) -> list[str]:
    questions: list[str] = []
    for key in state.critical_unknowns:
        questions.append(f"¿Puedes precisar {_friendly(key)}?")
    for key in state.contradictions:
        questions.append(f"Hay valores en conflicto para {_friendly(key)}; ¿cuál es el correcto?")
    if not questions and state.route_profile and state.route_profile.confidence in ("low", "not_evaluable"):
        questions.append("¿Cuál es el resultado concreto que debe haber cambiado al terminar?")
    return ctx.ladder.enforce_question_cap(questions)


def _build_confirmation(state: DiagnosisState, ctx: StageContext) -> ConfirmationRequest:
    tracker = ctx.tracker
    buckets = tracker.partition() if tracker else {"facts": [], "inferences": [], "unknowns": []}
    rp = state.route_profile
    suggested: dict[str, str] = {}
    if rp:
        suggested = {
            "unit": rp.unit,
            "challenge_type": rp.challenge_type,
            "route": rp.route,
            "depth": rp.depth,
            "horizon": rp.horizon,
        }
    objective = state.field("objective")
    understood = (
        str(objective.value) if objective and objective.value else (state.raw_input[:200] or "(no está claro aún)")
    )
    return ConfirmationRequest(
        understood_goal=understood,
        explicit_information=[f"{f.key}: {f.value}" for f in buckets["facts"] if f.value is not None],
        inferred_information=[f"{f.key}: {f.value}" for f in buckets["inferences"]],
        unknown_critical_information=[_friendly(k) for k in state.critical_unknowns],
        contradictions=[_friendly(k) for k in state.contradictions],
        suggested=suggested,
        strategic_questions=_strategic_questions(state, ctx),
    )


def run_confirm(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Evaluate the gate ladder; if routing is blocked, build a confirmation/escalation.

    Returns HarnessStage.EMIT to short-circuit (skip routing) when a human is required.
    """
    verdict = ctx.ladder.evaluate(state)
    state.gate = verdict
    if verdict.blocks_routing:
        if verdict.action == "RequireConfirmation":
            state.confirmation = _build_confirmation(state, ctx)
        # For Block (red-line) we escalate to a role — no user-facing clarification form.
        return HarnessStage.EMIT
    return None


# ---------------------------------------------------------------------------
# CLASSIFY_ROUTE  — §10 routing table (supersedes get_agent_routing_hint).
# ---------------------------------------------------------------------------


def _rule_matches(rule: RoutingRule, profile_dict: dict) -> bool:
    for key, expected in rule.match.items():
        actual = profile_dict.get(key)
        if isinstance(expected, list):
            if actual not in expected:
                return False
        elif actual != expected:
            return False
    return True


def run_classify_route(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Map the RouteProfile to a target step agent + method pack via the routing table."""
    table = ctx.config.routing_table
    rp = state.route_profile
    profile_dict = rp.model_dump() if rp else {}

    target = table.default
    for rule in table.rules:
        if _rule_matches(rule, profile_dict):
            target = rule  # type: ignore[assignment]
            break

    state.target_agent = target.agent
    state.method_pack_id = target.method_pack
    if rp is not None:
        rp.step = target.step  # the routing table's step is authoritative for agent selection
    return None


# ---------------------------------------------------------------------------
# METHOD_HINT  — §11 attach/validate the selected method pack.
# ---------------------------------------------------------------------------


def run_method_hint(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Validate the chosen method pack exists; record required evidence in the trace notes."""
    pack = ctx.config.method_pack(state.method_pack_id or "")
    if pack is None:
        # Unknown pack → fall back to the default target's pack, note it, keep routing.
        default_pack_id = ctx.config.routing_table.default.method_pack
        state.method_pack_id = default_pack_id
        pack = ctx.config.method_pack(default_pack_id)
    if pack is not None:
        ctx.recorder.audit.method_pack_versions.append(f"{state.method_pack_id}:{pack.version}")
    return None


# ---------------------------------------------------------------------------
# GATE  — §14/§19 final verdict + prohibited-terms enforcement.
# ---------------------------------------------------------------------------


def run_gate(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Finalize the gate verdict on the routing path and scan for prohibited terms (§19)."""
    verdict = state.gate or GateVerdict(action="Allow")
    rp = state.route_profile
    texts: list[str] = []
    if rp:
        texts.extend(rp.rationale)
        texts.extend(rp.conditions_that_would_change)
    found = ctx.ladder.check_prohibited_terms(*texts)
    if found:
        verdict.prohibited_terms_found = found
        verdict.reasons.append("Se detectaron términos prohibidos en el texto emitido (§19).")
    state.gate = verdict
    return None


# ---------------------------------------------------------------------------
# EMIT  — assemble the HarnessDecision + finalize the audit trace.
# ---------------------------------------------------------------------------


def run_emit(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Build the top-level HarnessDecision and finalize the trace."""
    verdict = state.gate or GateVerdict(action="Allow")

    # Fill the audit record's epistemic disposition.
    audit = ctx.recorder.audit
    audit.project_id = state.project_id
    audit.inferred_fields = [
        f.key for f in state.fields if f.status in (EpistemicStatus.INFERRED, EpistemicStatus.SUGGESTED)
    ]
    audit.confirmed_fields = [f.key for f in state.fields if f.status is EpistemicStatus.CONFIRMED]
    audit.source_refs = [f.source for f in state.fields if f.source]
    if state.route_profile:
        audit.confidence = state.route_profile.confidence
    audit.requires_human_confirmation = verdict.blocks_routing
    ctx.recorder.set_grounded(state.fields)

    if state.confirmation is not None:
        kind = "confirm"
    elif verdict.action == "Block":
        kind = "escalate"
    else:
        kind = "route"

    # Trace is attached by the driver AFTER it records this EMIT stage, so the final
    # trace includes the emit stage itself. Placeholder here keeps the model valid.
    ctx.decision = HarnessDecision(
        kind=kind,
        route_profile=state.route_profile,
        target_agent=state.target_agent if kind == "route" else None,
        method_pack_id=state.method_pack_id if kind == "route" else None,
        confirmation=state.confirmation,
        gate=verdict,
        trace=HarnessTrace(audit=audit),
    )
    return None
