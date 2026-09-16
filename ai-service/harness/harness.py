"""MethodologyHarness facade (ADR-027).

The single entry point the orchestrator calls. `diagnose()` runs the 8-stage pipeline and
returns a HarnessDecision (route / confirm / escalate) plus its audit trace. It does NOT
invoke a step agent — that stays the orchestrator's job (agents/orchestrator.py), so the
harness remains a pure diagnostic/routing brain and is trivially testable.

Deterministic mode: pass ``mocks={"ground": fn, "interpret": fn}`` to supply stage outputs
without any network call (used by the eval runner and tests).
"""

from __future__ import annotations

import os
from typing import Any

from harness.config_loader import load_methodology
from harness.contracts import DiagnosisState
from harness.driver import StageDriver
from harness.gates import GateLadder
from harness.prompts import StagePromptBuilder
from harness.stages import StageContext, StageMock
from harness.trace import AuditRecord, HarnessDecision, TraceRecorder


class MethodologyHarness:
    """Runs a methodology-grounded diagnosis of an incoming request."""

    def __init__(self) -> None:
        self._config = load_methodology()
        self._prompt_builder = StagePromptBuilder(self._config)
        self._ladder = GateLadder(self._config.gates)
        self._driver = StageDriver()

    @property
    def config_version(self) -> str:
        return self._config.version

    def _model_id(self) -> str:
        override = os.getenv("OPENROUTER_MODEL")
        if override:
            return override
        sm = self._config.model.stage_model
        return sm.split(":", 1)[1] if ":" in sm else sm

    def diagnose(
        self,
        request_ref: dict[str, Any],
        *,
        raw_input: str | None = None,
        project_id: str | None = None,
        mocks: dict[str, StageMock] | None = None,
    ) -> HarnessDecision:
        """Diagnose a request and return the routing/confirmation decision + trace."""
        state = DiagnosisState(
            request_ref=request_ref or {},
            raw_input=raw_input or "",
            project_id=project_id or "unknown",
        )
        recorder = TraceRecorder(
            AuditRecord(
                config_version=self._config.version,
                model_provider="openrouter",
                model_id=self._model_id(),
            )
        )
        ctx = StageContext(
            config=self._config,
            prompt_builder=self._prompt_builder,
            ladder=self._ladder,
            recorder=recorder,
            mocks=mocks or {},
        )
        return self._driver.run(state, ctx)


_instance: MethodologyHarness | None = None


def get_harness() -> MethodologyHarness:
    """Return the process-wide singleton MethodologyHarness."""
    global _instance
    if _instance is None:
        _instance = MethodologyHarness()
    return _instance
