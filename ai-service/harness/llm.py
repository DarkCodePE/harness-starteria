"""Per-stage structured-output LLM calls (ADR-027).

Mirrors the proven pattern in agents/initial_reviewer.py: ChatOpenAI pointed at
OpenRouter, `.with_structured_output(Model, method="json_schema")`, a 2-attempt retry
loop for provider JSON truncation, deepseek-v4-flash as the default (the model
initial_reviewer benchmarked as reliable for json_schema; qwen fails it).

Determinism hook: pass ``mock=<callable returning the model>`` to bypass the network
entirely — used by the eval runner (fixtures) and by hermetic tests. Without a mock and
without OPENROUTER_API_KEY, the call raises a clear configuration error rather than
inventing a diagnosis.

Token accounting: wrap calls in ``collect_usage()`` to capture per-call token counts. It is
a contextvar side-channel on purpose — ``stage_structured_call`` keeps returning the parsed
model, so neither its callers nor the test doubles that stand in for it have to grow a
telemetry parameter.
"""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from functools import lru_cache
from typing import Callable, Iterator, TypeVar

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from harness.config_loader import load_methodology
from harness.contracts import GroundedFieldList, RouteProfile

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TokenUsage:
    """Tokens billed by one provider call. Absent counts stay ``None``, never 0."""

    model_id: str
    input_tokens: int | None
    output_tokens: int | None
    provider: str = "openrouter"

    @property
    def total_tokens(self) -> int | None:
        if self.input_tokens is None or self.output_tokens is None:
            return None
        return self.input_tokens + self.output_tokens


# Active sink, or None when nobody is collecting. A contextvar (not a module global) so
# concurrent requests cannot bleed each other's counts.
_usage_sink: ContextVar[list[TokenUsage] | None] = ContextVar("harness_llm_usage", default=None)


@contextmanager
def collect_usage() -> Iterator[list[TokenUsage]]:
    """Collect the token usage of every stage call made inside this block.

    A mocked call records nothing, which is correct: no provider call, no tokens.
    """
    sink: list[TokenUsage] = []
    token = _usage_sink.set(sink)
    try:
        yield sink
    finally:
        _usage_sink.reset(token)


def record_usage(usage: TokenUsage) -> None:
    """Record usage from a non-OpenRouter stage in the active trace collector."""
    sink = _usage_sink.get()
    if sink is not None:
        sink.append(usage)


def _record_usage(raw: object, model_id: str) -> None:
    """Append one call's usage to the active sink, if any."""
    sink = _usage_sink.get()
    if sink is None:
        return
    meta = getattr(raw, "usage_metadata", None) or {}
    # A provider that reports no usage yields None, not 0: "unknown" and "free" are not
    # the same claim, and the scorecard renders them differently.
    sink.append(
        TokenUsage(
            model_id=model_id,
            input_tokens=meta.get("input_tokens") if isinstance(meta, dict) else None,
            output_tokens=meta.get("output_tokens") if isinstance(meta, dict) else None,
        )
    )

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
    # include_raw keeps the AIMessage (and its usage_metadata) reachable. It also changes
    # error handling: parsing failures stop raising and come back as `parsing_error`, so
    # stage_structured_call has to check that field or the truncation retry dies silently.
    return llm.with_structured_output(model_cls, method="json_schema", include_raw=True)


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

    model_id = _model_id()
    chain = _structured_llm(model_id, model_cls)
    messages = [SystemMessage(content=system), HumanMessage(content=human)]
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            envelope = chain.invoke(messages)
            # Usage is recorded even when parsing fails: a truncated response was still
            # billed, and a cost figure that hides retries understates what a run costs.
            _record_usage(envelope.get("raw"), model_id)

            parsing_error = envelope.get("parsing_error")
            if parsing_error is not None:
                raise parsing_error
            result = envelope.get("parsed")
            if result is None:
                raise ValueError("Structured output returned no parsed value.")
            return result if isinstance(result, model_cls) else model_cls(**dict(result))
        except Exception as exc:  # noqa: BLE001 — provider may truncate JSON; retry once
            last_exc = exc
            logger.warning("harness stage call attempt %d failed: %s", attempt + 1, exc)
    raise last_exc  # type: ignore[misc]
