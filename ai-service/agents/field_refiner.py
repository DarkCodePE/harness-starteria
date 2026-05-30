"""Public field refinement — a STATELESS LangChain chain (ADR-006).

Unlike the 7 deepagents graphs registered in `langgraph.json`, this is a single
model call with structured output: it takes one proposal field + the draft
context and returns an improved value. No tools, no memory, no planning — so per
the framework-selection decision (ADR-006) it is plain LangChain, NOT LangGraph
or a Deep Agent, and is deliberately NOT registered as a graph.

Used by the public landing editor via the backend bridge
(`POST /api/v1/public/refine-field`, ADR-016). The backend enforces rate-limit +
cost caps; if this call fails/times out the frontend falls back to a local
heuristic, so this module keeps no retry/queue machinery of its own.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

_DEFAULT_MODEL = "openrouter:qwen/qwen3.6-flash".split(":", 1)[1]
_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"


class FieldRefinement(BaseModel):
    """Structured output contract for a single field refinement."""

    suggestedValue: str = Field(..., description="Versión mejorada del campo, en español.")
    rationale: str = Field(..., description="Una frase: por qué mejora claridad.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confianza 0..1.")


_SYSTEM = (
    "Eres un asistente que mejora la redacción de UN campo de una propuesta de "
    "iniciativa en español. Devuelve una versión más clara, concreta y accionable "
    "del campo, conservando el sentido del usuario. NO inventes datos, métricas ni "
    "hechos que no estén en el valor actual o el contexto. Si el valor ya está bien, "
    "haz mejoras mínimas. Sé breve y directo."
)

_HUMAN = (
    "Campo a mejorar: {field}\n"
    "Valor actual:\n{current_value}\n\n"
    "Contexto del borrador (no inventes fuera de esto):\n{draft_context}\n\n"
    "Devuelve la versión mejorada del campo, una frase de justificación y tu confianza."
)


def _build_llm() -> ChatOpenAI:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set. Configure it in ai-service/.env.")
    model = os.getenv("OPENROUTER_MODEL", _DEFAULT_MODEL)
    base_url = os.getenv("OPENROUTER_BASE_URL", _DEFAULT_BASE_URL)
    return ChatOpenAI(
        base_url=base_url,
        model=model,
        api_key=api_key,
        temperature=0.2,
        max_tokens=600,
        max_retries=2,
        model_kwargs={"extra_body": {"provider": {"allow_fallbacks": True, "sort": "throughput"}}},
    )


@lru_cache(maxsize=1)
def _get_chain():
    """Lazily build prompt | llm.with_structured_output(FieldRefinement)."""
    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM), ("human", _HUMAN)])
    llm = _build_llm()
    return prompt | llm.with_structured_output(FieldRefinement)


def _format_context(draft_context: dict[str, Any] | None) -> str:
    if not draft_context:
        return "(sin contexto adicional)"
    lines = [f"- {k}: {v}" for k, v in draft_context.items() if isinstance(v, (str, int, float)) and str(v).strip()]
    return "\n".join(lines) if lines else "(sin contexto adicional)"


def refine_field(field: str, current_value: str, draft_context: dict[str, Any] | None = None) -> FieldRefinement:
    """Refine a single field. Raises on misconfiguration / upstream failure;
    the backend bridge maps that to a 5xx/timeout and the frontend falls back."""
    chain = _get_chain()
    result = chain.invoke(
        {
            "field": field,
            "current_value": current_value or "(vacío)",
            "draft_context": _format_context(draft_context),
        }
    )
    # with_structured_output returns a FieldRefinement instance.
    if isinstance(result, FieldRefinement):
        return result
    return FieldRefinement(**dict(result))
