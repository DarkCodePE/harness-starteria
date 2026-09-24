"""Stage-driver control loop (ADR-027).

Ported from ECC's ReActAgent.run: walk the stages following the state machine, capping
total iterations as a runaway backstop, recording a StageTrace per stage. The only branch
is CONFIRM → EMIT (short-circuit when a human confirmation is required).
"""

from __future__ import annotations

import time

from harness.contracts import DiagnosisState
from harness.llm import collect_usage
from harness.stages import StageContext, build_registry
from harness.state_machine import STAGE_ORDER, HarnessStage, advance
from harness.trace import HarnessDecision, StageTrace


class StageDriver:
    """Executes the diagnostic pipeline over a DiagnosisState."""

    def __init__(self) -> None:
        self._registry = build_registry()
        self._max_iterations = len(STAGE_ORDER) + 2

    def _next_linear(self, current: HarnessStage) -> HarnessStage | None:
        idx = STAGE_ORDER.index(current)
        return STAGE_ORDER[idx + 1] if idx + 1 < len(STAGE_ORDER) else None

    def run(self, state: DiagnosisState, ctx: StageContext) -> HarnessDecision:
        current = HarnessStage.INTAKE
        for _ in range(self._max_iterations):
            state.stage = current.value
            fn = self._registry[current]

            started = time.monotonic()
            with collect_usage() as usage:
                override = fn(state, ctx)
            duration_ms = int((time.monotonic() - started) * 1000)

            # Sum across calls: a stage that retried a truncated response was billed twice.
            _tin = [u.input_tokens for u in usage if u.input_tokens is not None]
            _tout = [u.output_tokens for u in usage if u.output_tokens is not None]

            ctx.recorder.record(
                StageTrace(
                    stage=current.value,
                    duration_ms=duration_ms,
                    # An LLM stage that was served from a mock did NOT call an LLM. Reporting
                    # the stage's *type* here made deterministic runs look like live ones.
                    llm_used=(
                        current in (HarnessStage.GROUND, HarnessStage.INTERPRET)
                        and ctx.mock_for(current.value) is None
                    ),
                    model_provider=usage[0].provider if usage else None,
                    model_id=usage[0].model_id if usage else None,
                    tokens_in=sum(_tin) if _tin else None,
                    tokens_out=sum(_tout) if _tout else None,
                    epistemic_tags=sorted({f.status.value for f in state.fields}),
                    gate=state.gate if current in (HarnessStage.CONFIRM, HarnessStage.GATE) else None,
                    notes=[f"→ {override.value}"] if override else [],
                )
            )

            if current is HarnessStage.EMIT:
                break
            nxt = override or self._next_linear(current)
            if nxt is None:
                break
            current = advance(current, nxt)

        if ctx.decision is None:  # pragma: no cover — EMIT always sets a decision
            raise RuntimeError("Pipeline finished without emitting a decision.")
        # Finalize the trace here so it includes the EMIT stage just recorded.
        ctx.decision.trace = ctx.recorder.finalize(ctx.decision.gate)
        return ctx.decision
