"""LLM-backed stages: GROUND and INTERPRET (ADR-027).

Both use structured output via harness.llm.stage_structured_call. In deterministic mode
(eval/tests) a per-stage mock supplies the output and no network call happens. The GROUND
stage additionally runs conflict detection so contradictions surface as ``conflicting``.
"""

from __future__ import annotations

from harness.contracts import DiagnosisState, GroundedFieldList, RouteProfile
from harness.epistemic import EpistemicTracker
from harness.llm import stage_structured_call
from harness.stages import StageContext
from harness.state_machine import HarnessStage


def run_ground(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Extract grounded fields (never invent) and detect contradictions."""
    system, human, version = ctx.prompt_builder.build("ground", state)
    ctx.recorder.audit.prompt_versions["ground"] = version

    result: GroundedFieldList = stage_structured_call(
        system, human, GroundedFieldList, mock=ctx.mock_for("ground")
    )
    state.fields = list(result.fields)

    tracker = EpistemicTracker(state.fields, ctx.config.epistemic.promotion_rule)
    state.contradictions = tracker.detect_conflicts()
    state.critical_unknowns = tracker.critical_unknowns()
    ctx.tracker = tracker
    return None


def run_interpret(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Produce the multidimensional RouteProfile from the grounded facts."""
    system, human, version = ctx.prompt_builder.build("interpret", state)
    ctx.recorder.audit.prompt_versions["interpret"] = version

    profile: RouteProfile = stage_structured_call(
        system, human, RouteProfile, mock=ctx.mock_for("interpret")
    )
    state.route_profile = profile
    return None
