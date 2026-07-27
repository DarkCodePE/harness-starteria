"""Diagnostic pipeline stages (ADR-027).

Each stage is a callable ``run(state, ctx) -> HarnessStage | None``. Returning a
HarnessStage overrides the next stage (only CONFIRM uses this, to short-circuit to
EMIT); returning None follows the linear STAGE_ORDER. Stages mutate ``state`` and the
shared ``StageContext`` in place.

Stages are grouped by kind for cohesion: LLM stages (ground, interpret) in
``llm_stages.py``; deterministic stages (intake, confirm, classify_route, method_hint,
gate, emit) in ``deterministic.py``.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from harness.config_models import MethodologyConfig
from harness.contracts import DiagnosisState
from harness.gates import GateLadder
from harness.prompts import StagePromptBuilder
from harness.state_machine import HarnessStage
from harness.trace import HarnessDecision, TraceRecorder

if TYPE_CHECKING:
    from harness.epistemic import EpistemicTracker

# A per-stage mock: called with no args, returns the structured output the stage expects.
StageMock = Callable[[], object]


@dataclass
class StageContext:
    """Shared services + accumulators threaded through the pipeline."""

    config: MethodologyConfig
    prompt_builder: StagePromptBuilder
    ladder: GateLadder
    recorder: TraceRecorder
    mocks: dict[str, StageMock] = field(default_factory=dict)
    tracker: "EpistemicTracker | None" = None
    decision: HarnessDecision | None = None

    def mock_for(self, stage_id: str) -> StageMock | None:
        return self.mocks.get(stage_id)


StageFn = Callable[[DiagnosisState, StageContext], "HarnessStage | None"]


def build_registry() -> dict[HarnessStage, StageFn]:
    """Assemble the stage registry (imported here to avoid circular imports)."""
    from harness.stages.deterministic import (
        run_classify_route,
        run_confirm,
        run_emit,
        run_gate,
        run_intake,
        run_method_hint,
    )
    from harness.stages.llm_stages import run_ground, run_interpret

    return {
        HarnessStage.INTAKE: run_intake,
        HarnessStage.GROUND: run_ground,
        HarnessStage.INTERPRET: run_interpret,
        HarnessStage.CONFIRM: run_confirm,
        HarnessStage.CLASSIFY_ROUTE: run_classify_route,
        HarnessStage.METHOD_HINT: run_method_hint,
        HarnessStage.GATE: run_gate,
        HarnessStage.EMIT: run_emit,
    }
