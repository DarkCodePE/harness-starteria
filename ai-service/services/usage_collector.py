"""Token accounting for LangChain/LangGraph invocations (E9).

`agents/orchestrator.py` recorded usage as `input_tokens=0, output_tokens=0` with the note
"deepagents does not expose token counts directly". The counts are in fact reachable: every
AIMessage carries `usage_metadata`, and a callback handler sees each one as it completes.

Why a callback and not a sweep of `result["messages"]`: the orchestrator invokes with
`thread_id=project_id`, so the returned state carries the WHOLE conversation, not just this
turn. Summing it would re-bill every previous turn on every call. A handler only observes
the calls made inside the invocation it was passed to.

This is the deepagents counterpart to `harness.llm.collect_usage()`, which solves the same
problem for the harness stages with a contextvar.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult

logger = logging.getLogger(__name__)


class UsageCollector(BaseCallbackHandler):
    """Accumulates token usage across every model call in one invocation.

    An agent loop makes several calls; all of them were billed, so all of them count.
    `calls_without_usage` records how many completions reported no usage metadata — those
    contribute 0, which UNDER-counts, and the counter is what makes that visible instead
    of silent.
    """

    def __init__(self) -> None:
        self.input_tokens = 0
        self.output_tokens = 0
        self.calls = 0
        self.calls_without_usage = 0

    def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: UUID | None = None,
        parent_run_id: UUID | None = None,
        **kwargs: Any,
    ) -> None:
        for generation_list in response.generations:
            for generation in generation_list:
                self.calls += 1
                message = getattr(generation, "message", None)
                usage = getattr(message, "usage_metadata", None)
                if not isinstance(usage, dict):
                    self.calls_without_usage += 1
                    continue
                self.input_tokens += usage.get("input_tokens") or 0
                self.output_tokens += usage.get("output_tokens") or 0

    @property
    def complete(self) -> bool:
        """True when every observed call reported its usage."""
        return self.calls > 0 and self.calls_without_usage == 0

    def __repr__(self) -> str:  # pragma: no cover — debugging aid
        return (
            f"UsageCollector(in={self.input_tokens}, out={self.output_tokens}, "
            f"calls={self.calls}, without_usage={self.calls_without_usage})"
        )
