"""Unit tests for the LLM stages (ground/interpret) via mocks — no network (ADR-027)."""

import pytest

from harness.config_loader import load_methodology
from harness.contracts import (
    DiagnosisState,
    EpistemicStatus as E,
    GroundedField,
    GroundedFieldList,
    RouteProfile,
)
from harness.gates import GateLadder
from harness.prompts import StagePromptBuilder
from harness.stages import StageContext
from harness.stages.llm_stages import run_ground, run_interpret
from harness.trace import AuditRecord, TraceRecorder

pytestmark = pytest.mark.unit


def _ctx(mocks):
    cfg = load_methodology()
    return StageContext(
        config=cfg,
        prompt_builder=StagePromptBuilder(cfg),
        ladder=GateLadder(cfg.gates),
        recorder=TraceRecorder(AuditRecord()),
        mocks=mocks,
    )


def test_ground_sets_fields_detects_conflicts_and_unknowns():
    state = DiagnosisState(raw_input="algo")
    ctx = _ctx({"ground": lambda: GroundedFieldList(fields=[
        GroundedField(key="objective", value=None, status=E.UNKNOWN, critical=True),
        GroundedField(key="owner", value="Ana", status=E.DECLARED),
        GroundedField(key="owner", value="Beto", status=E.EXTRACTED),
    ])})
    run_ground(state, ctx)
    assert state.critical_unknowns == ["objective"]
    assert state.contradictions == ["owner"]
    assert ctx.recorder.audit.prompt_versions["ground"] == "1.0.0"


def test_ground_never_invents_beyond_model_output():
    state = DiagnosisState(raw_input="quiero mejorar ventas")
    ctx = _ctx({"ground": lambda: GroundedFieldList(fields=[
        GroundedField(key="objective", value="mejorar ventas", status=E.DECLARED, critical=True),
    ])})
    run_ground(state, ctx)
    keys = {f.key for f in state.fields}
    # No fabricated fields (e.g. a made-up baseline/metric) appear.
    assert keys == {"objective"}


def test_interpret_sets_route_profile():
    state = DiagnosisState(raw_input="algo", fields=[GroundedField(key="objective", value="x", status=E.DECLARED)])
    ctx = _ctx({"interpret": lambda: RouteProfile(
        intent="validate", unit="initiative", challenge_type="correction",
        route="explore_validate", depth="systemic", step=1, confidence="high")})
    run_interpret(state, ctx)
    assert state.route_profile.route == "explore_validate"
    assert state.route_profile.depth == "systemic"
    assert ctx.recorder.audit.prompt_versions["interpret"] == "1.0.0"
