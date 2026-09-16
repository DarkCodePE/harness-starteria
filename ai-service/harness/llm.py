"""Per-stage structured-output LLM calls (ADR-027).

Mirrors the proven pattern in agents/initial_reviewer.py: ChatOpenAI pointed at
OpenRouter, `.with_structured_output(Model, method="json_schema")`, a 2-attempt retry
loop for provider JSON truncation, deepseek-v4-flash as the default (the model
initial_reviewer benchmarked as reliable for json_schema; qwen fails it).

Determinism hook: pass ``mock=<callable returning the model>`` to bypass the network
entirely — used by the eval runner (fixtures) and by hermetic tests. Without a mock and
without OPENROUTER_API_KEY, the call raises a clear configuration error rather than
inventing a diagnosis.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Callable, TypeVar

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from harness.config_loader import load_methodology
from harness.contracts import GroundedFieldList, RouteProfile

logger = logging.getLogger(__name__)

_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"

# Resolve an output_contract name (from methodology.yaml stages) to a model class.
CONTRACT_REGISTRY: dict[str, type[BaseModel]] = {
    "GroundedFieldList": GroundedFieldList,
    "RouteProfile": RouteProfile,
}

T = TypeVar("T", bound=BaseModel)


def resolve_contract(name: str) -> type[BaseModel]:
    cls = CONTRACT_REGISTRY.get(name)
    if cls is None:
        raise ValueError(f"Unknown output_contract {name!r}; known: {sorted(CONTRACT_REGISTRY)}")
    return cls


def _model_id() -> str:
    """OPENROUTER_MODEL override wins, else the config default (strip 'openrouter:' prefix)."""
    override = os.getenv("OPENROUTER_MODEL")
    if override:
        return override
    stage_model = load_methodology().model.stage_model
    return stage_model.split(":", 1)[1] if ":" in stage_model else stage_model


@lru_cache(maxsize=8)
def _structured_llm(model_id: str, model_cls: type[BaseModel]):
    cfg = load_methodology().model
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set. Configure it in ai-service/.env.")
    llm = ChatOpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL", _DEFAULT_BASE_URL),
        model=model_id,
        api_key=api_key,
        temperature=cfg.temperature,
        max_tokens=cfg.max_tokens,
        max_retries=2,
        model_kwargs={"extra_body": {"provider": {"allow_fallbacks": True, "sort": "throughput"}}},
    )
    return llm.with_structured_output(model_cls, method="json_schema")


def stage_structured_call(
    system: str,
    human: str,
    model_cls: type[T],
    *,
    mock: Callable[[], T] | None = None,
) -> T:
    """Run one structured-output stage call and return a validated ``model_cls`` instance.

    ``mock`` short-circuits the network (deterministic eval + tests). Otherwise the call
    goes to OpenRouter with a 2-attempt truncation retry, exactly like initial_reviewer.
    """
    if mock is not None:
        result = mock()
        return result if isinstance(result, model_cls) else model_cls(**dict(result))

    chain = _structured_llm(_model_id(), model_cls)
    messages = [SystemMessage(content=system), HumanMessage(content=human)]
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            result = chain.invoke(messages)
            return result if isinstance(result, model_cls) else model_cls(**dict(result))
        except Exception as exc:  # noqa: BLE001 — provider may truncate JSON; retry once
            last_exc = exc
            logger.warning("harness stage call attempt %d failed: %s", attempt + 1, exc)
    raise last_exc  # type: ignore[misc]
