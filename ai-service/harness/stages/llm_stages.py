"""Model-backed stages: GROUND and INTERPRET (ADR-027, ADR-031).

GROUND uses structured output through harness.llm.stage_structured_call. INTERPRET
uses Jev by default, with an explicit LLM rollback. In deterministic mode
(eval/tests) a per-stage mock supplies the output and no network call happens.
GROUND also detects contradictions so they surface as ``conflicting``.
"""

from __future__ import annotations

import logging

from harness.backend_selection import selected_interpret_backend
from harness.contracts import DiagnosisState, GroundedFieldList, RouteProfile
from harness.epistemic import EpistemicTracker
from harness.llm import record_usage, stage_structured_call
from harness.stages import StageContext
from harness.state_machine import HarnessStage

logger = logging.getLogger(__name__)


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


def _interpret_via_llm(system: str, human: str) -> RouteProfile:
    """The LLM backend. Also the fallback path when Jev is unreachable."""
    profile = stage_structured_call(system, human, RouteProfile)
    # The LLM prompt does not ask for independent unit confidence. Ignore any
    # optional schema fields it might nevertheless return on rollback.
    profile.unit_confidence = None
    profile.confidence_scores = {}
    return profile


def run_interpret(state: DiagnosisState, ctx: StageContext) -> HarnessStage | None:
    """Produce the RouteProfile with Jev, or the explicit LLM rollback backend."""
    system, human, version = ctx.prompt_builder.build("interpret", state)
    ctx.recorder.audit.prompt_versions["interpret"] = version

    mock = ctx.mock_for("interpret")
    if mock is not None:
        profile: RouteProfile = stage_structured_call(system, human, RouteProfile, mock=mock)
    elif selected_interpret_backend(ctx.config) == "jev":
        from harness.jev import JevError
        from harness.jev import interpret as jev_interpret

        try:
            profile, usage, _contested = jev_interpret(human, model=ctx.config.model.jev_model)
        except JevError as exc:
            # Fail OPEN to the LLM backend. Jev is an external dependency on the critical
            # path of every diagnosis: a missing key, a timeout or a 429 must degrade the
            # classifier, not take the endpoint down. The rollback backend is the same code
            # that ran before ADR-031, so the fallback is a known-good path, not a stub.
            logger.warning(
                "jev_interpret_failed backend=jev falling_back_to=llm error=%s", exc
            )
            # No audit note is written here on purpose: AuditRecord has no notes field, and
            # the record already distinguishes the backends — on this path model_provider and
            # model_id keep their LLM values instead of gaining the "+typesafe:" marker.
            profile = _interpret_via_llm(system, human)
        else:
            record_usage(usage)
            ctx.recorder.audit.model_provider = "openrouter+typesafe"
            ground_model = ctx.recorder.audit.model_id.split("+typesafe:", 1)[0]
            ctx.recorder.audit.model_id = f"{ground_model}+typesafe:{usage.model_id}"
    else:
        profile = _interpret_via_llm(system, human)
    state.route_profile = profile
    return None
