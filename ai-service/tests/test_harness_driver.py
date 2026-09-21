"""End-to-end pipeline tests via MethodologyHarness with mocked stages (ADR-027)."""

import pytest

from harness.contracts import EpistemicStatus as E, GroundedField, GroundedFieldList, RouteProfile
from harness.harness import MethodologyHarness

pytestmark = pytest.mark.unit


def _mocks(ground_fields, **rp):
    base = dict(intent="validate", unit="initiative", challenge_type="growth",
                route="explore_validate", depth="standard", step=1, confidence="high")
    base.update(rp)
    return {
        "ground": lambda: GroundedFieldList(fields=ground_fields),
        "interpret": lambda: RouteProfile(**base),
    }


def test_route_case_reaches_all_stages_and_routes():
    h = MethodologyHarness()
    d = h.diagnose({}, raw_input="Aumentar ventas", mocks=_mocks(
        [GroundedField(key="objective", value="ventas", status=E.DECLARED, critical=True)],
        challenge_type="growth", route="explore_validate", step=1, confidence="high"))
    assert d.kind == "route"
    assert d.target_agent == "research-assistant"
    assert d.method_pack_id == "qualitative_research"
    stages = [s.stage for s in d.trace.stages]
    assert stages[-1] == "emit"
    assert "classify_route" in stages and "gate" in stages


def test_confirm_case_short_circuits_and_sets_no_agent():
    h = MethodologyHarness()
    d = h.diagnose({}, raw_input="Excel a Power BI", mocks=_mocks(
        [GroundedField(key="audience", value=None, status=E.UNKNOWN, critical=True)],
        route="design_solution", step=2, confidence="low"))
    assert d.kind == "confirm"
    assert d.target_agent is None
    assert d.confirmation is not None
    assert len(d.confirmation.strategic_questions) <= 3
    stages = [s.stage for s in d.trace.stages]
    assert "classify_route" not in stages  # CONFIRM short-circuits to EMIT
    assert stages[-1] == "emit"


def test_red_line_escalates():
    h = MethodologyHarness()
    d = h.diagnose({}, raw_input="Cruzar datos personales", mocks=_mocks(
        [GroundedField(key="sensitive", value=True, status=E.DECLARED)],
        route="explore_validate", step=1, confidence="high"))
    assert d.kind == "escalate"
    assert d.gate.action == "Block"
    assert d.target_agent is None


def test_trace_audit_records_provenance():
    h = MethodologyHarness()
    d = h.diagnose({}, raw_input="algo", mocks=_mocks(
        [GroundedField(key="baseline", value="10%", status=E.INFERRED)],
        confidence="high"))
    audit = d.trace.audit
    assert audit.config_version == "1.1.0"
    assert audit.prompt_versions == {"ground": "1.0.0", "interpret": "1.0.0"}
    assert "baseline" in audit.inferred_fields
    assert audit.timestamp is not None
    assert d.trace.grounded  # provenance captured
