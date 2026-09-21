"""Evaluation integrity and counterexamples; no network or product-rule changes.

Classification: HYPOTHESIS / ADR-027 diagnostic regression, not V2 certification.
"""

from copy import deepcopy
from dataclasses import replace
from pathlib import Path

import pytest

from harness.contracts import GroundedField, RouteProfile
from harness.eval.dataset import GOLDEN, TAXONOMY, golden_by_id
from harness.eval.graders import grade_next_action
from harness.eval.metrics import (
    ArmResult, classification_correct, gate_compliant, routing_correct, scorecard,
)
from harness.eval.runner import _forbidden_hits, _mocks_for, harness_arm, run_eval, to_markdown
from harness.harness import get_harness

pytestmark = pytest.mark.unit


@pytest.fixture(autouse=True)
def no_live_model(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("A hermetic evaluation attempted to construct a live model")
    monkeypatch.setattr("harness.llm._structured_llm", forbidden)


def test_dataset_is_traceable_and_covers_taxonomy_and_routes():
    root = Path(__file__).resolve().parents[2]
    ids = {c.id for c in GOLDEN}
    assert len(ids) == len(GOLDEN)
    assert {tag for c in GOLDEN for tag in c.taxonomy} == set(TAXONOMY)
    assert {c.expected_route for c in GOLDEN if c.expected_kind == "route"} == {
        "explore_validate", "design_solution", "implement_handoff", "plan_coordinate",
        "reconstruct_existing", "lightweight_plan",
    }
    for case in GOLDEN:
        assert case.source_refs, case.id
        for ref in case.source_refs:
            assert (root / ref.split("#", 1)[0]).is_file(), (case.id, ref)
        assert case.contrast_with is None or case.contrast_with in ids
        RouteProfile(**case.interpret)
        for data in case.ground:
            f = GroundedField(**data)
            if f.status.value == "unknown":
                assert f.value is None, case.id
            if f.status.value in {"extracted", "confirmed"}:
                assert f.source, case.id
            # These are raw-input-only cases, without authorized confirmation actions.
            assert f.status.value != "confirmed", case.id
        if case.expected_kind != "route":
            assert case.expected_agent is None and case.expected_method_pack is None


@pytest.mark.parametrize("case", GOLDEN, ids=lambda c: c.id)
def test_each_case_checks_the_actual_decision_trace(case):
    before = deepcopy(case.model_dump())
    decision = get_harness().diagnose({}, raw_input=case.raw_input, mocks=_mocks_for(case))
    assert case.model_dump() == before  # the runtime may mutate its own profile/fields
    assert decision.kind == case.expected_kind
    assert not any(s.llm_used for s in decision.trace.stages)
    assert not decision.trace.audit.confirmed_fields
    if decision.kind == "route":
        assert decision.target_agent == case.expected_agent
        if case.expected_method_pack:
            assert decision.method_pack_id == case.expected_method_pack
        assert decision.confirmation is None
    else:
        assert decision.target_agent is None and decision.method_pack_id is None
        assert "classify_route" not in [s.stage for s in decision.trace.stages]
        if decision.kind == "confirm":
            assert decision.confirmation is not None
            assert 1 <= len(decision.confirmation.strategic_questions) <= 3
    assert set(case.expected_hard_gates) <= set(decision.gate.failed_hard_gates)
    assert set(case.expected_soft_gates) <= set(decision.gate.failed_soft_gates)
    assert _forbidden_hits(case, decision.trace.grounded) == 0


def test_multiple_unknowns_confirm_but_red_line_escalates():
    gaps = harness_arm(golden_by_id("multiples-gaps"), live=False)
    sensitive = harness_arm(golden_by_id("sensible-con-gaps"), live=False)
    assert gaps.kind == "confirm" and gaps.questions_count == 3
    assert sensitive.kind == "escalate" and sensitive.agent is None


def test_soft_review_continues_and_readiness_is_not_baseline():
    case = golden_by_id("baseline-estimado")
    decision = get_harness().diagnose({}, raw_input=case.raw_input, mocks=_mocks_for(case))
    assert decision.gate.action == "Review"
    assert decision.kind == "route"
    readiness = harness_arm(golden_by_id("readiness-bajo"), live=False)
    assert "baseline_estimated" not in readiness.soft_gates


def test_shared_agent_does_not_hide_wrong_route_or_method_pack():
    case = golden_by_id("proceso-sistemico")
    right = harness_arm(case, live=False)
    for wrong in (replace(right, route="reconstruct_existing"),
                  replace(right, method_pack="qualitative_research")):
        assert routing_correct(case, wrong)  # agent + step alone are insufficient
        assert classification_correct(case, wrong) is False
        assert grade_next_action(case, wrong).verdict == "FAIL"
        metrics = scorecard([case], {case.id: wrong})
        assert metrics["confidence_calibration"] == 0.0
        assert metrics["classification_accuracy"] == 0.0
    assert not routing_correct(case, replace(right, step=0))


def test_confirmation_cannot_pass_with_an_agent_no_questions_or_wrong_gate():
    case = golden_by_id("idea-ambigua")
    right = harness_arm(case, live=False)
    for wrong in (replace(right, agent="mentor-virtual"),
                  replace(right, questions_count=0), replace(right, hard_gates=[])):
        assert not gate_compliant(case, wrong)
        assert grade_next_action(case, wrong).verdict == "FAIL"
    assert not routing_correct(case, replace(right, agent="mentor-virtual"))


def test_hallucination_sentinels_have_a_real_denominator():
    case = golden_by_id("piloto-reconstruct")
    clean = harness_arm(case, live=False)
    hit = GroundedField(key="evidence", value="resultados del piloto", status="declared")
    assert _forbidden_hits(case, [hit]) == 1
    assert _forbidden_hits(case, [hit.model_copy(update={"status": "unknown", "value": None})]) == 0
    assert scorecard([case], {case.id: clean})["hallucination_rate"] == 0.0
    bad = replace(clean, grounded_forbidden_hits=1)
    assert scorecard([case], {case.id: bad})["hallucination_rate"] == 1.0
    assert grade_next_action(case, bad).verdict == "FAIL"
    baseline = ArmResult(case_id=case.id, kind="route", agent="mentor-virtual")
    metrics = scorecard([case], {case.id: baseline})
    assert metrics["hallucination_rate"] is None and metrics["hallucination_n"] == 0
    no_sentinels = golden_by_id("tarea-ligera")
    metrics = scorecard([no_sentinels], {no_sentinels.id: harness_arm(no_sentinels, live=False)})
    assert metrics["hallucination_rate"] is None


def test_report_separates_provisional_labels_and_partial_sample_coverage():
    report = run_eval(sample=1)
    assert report["measurement_scope"] == "fixture_conditional"
    assert report["by_calibration_status"]["provisional"]["harness"]["n_cases"] == 1
    assert report["by_calibration_status"]["supported"]["harness"]["n_cases"] == 0
    assert not report["taxonomy_coverage"]["decision_cerrar"]
    assert report["deltas"]["hallucination_rate"] is None
    assert "hallucination_n" not in report["deltas"]
    assert "provisional" in to_markdown(report)


def test_render_does_not_hide_a_classification_failure():
    report = run_eval(sample=1)
    report["per_case"][0]["harness"]["classification"]["route"] = False
    line = next(line for line in to_markdown(report).splitlines() if "| ventas-growth |" in line)
    assert "✗ route:research-assistant" in line


@pytest.mark.parametrize("kwargs", [{"mode": "typo"}, {"sample": 0}, {"sample": -1}])
def test_invalid_eval_selection_is_rejected(kwargs):
    with pytest.raises(ValueError):
        run_eval(**kwargs)
