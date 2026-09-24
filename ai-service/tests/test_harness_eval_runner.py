"""Tests for the A/B eval runner + metrics (ADR-027). Deterministic, hermetic."""

import pytest

from harness.eval.dataset import GOLDEN, golden_by_id
from harness.eval.graders import grade_next_action
from harness.eval.metrics import ArmResult, classification_correct, gate_compliant, routing_correct
from harness.eval.runner import baseline_arm, harness_arm, run_eval, to_markdown

pytestmark = pytest.mark.unit


def test_dataset_covers_all_decision_kinds():
    kinds = {c.expected_kind for c in GOLDEN}
    assert kinds == {"route", "confirm", "escalate"}
    assert len(GOLDEN) >= 12


def test_baseline_routes_everything_to_mentor_at_step0():
    case = golden_by_id("orden-compra")  # a genuine route:research-assistant case
    arm = baseline_arm(case)
    assert arm.kind == "route"
    assert arm.agent == "mentor-virtual"  # naive step-0 routing
    assert not routing_correct(case, arm)  # expected research-assistant, not mentor-virtual


def test_harness_arm_matches_expectations_deterministically():
    for case in GOLDEN:
        arm = harness_arm(case, live=False)
        assert routing_correct(case, arm), f"{case.id}: got kind={arm.kind} agent={arm.agent}"
        assert gate_compliant(case, arm), case.id
        assert classification_correct(case, arm) is not False, case.id


def test_run_eval_shows_harness_beats_baseline():
    report = run_eval(mode="deterministic")
    assert report["harness"]["routing_precision"] == 1.0
    assert report["harness"]["gate_compliance"] == 1.0
    assert report["harness"]["hallucination_rate"] == 0.0
    assert report["deltas"]["routing_precision"] > 0
    assert report["baseline"]["routing_precision"] < report["harness"]["routing_precision"]
    assert all("confidence_scores" in row["harness"] for row in report["per_case"])
    md = to_markdown(report)
    assert "routing_precision" in md and "Per-case" in md


def test_grader_rewards_correct_disposition():
    case = golden_by_id("excel-powerbi-ambiguo")  # expected confirm
    good = ArmResult(case_id=case.id, kind="confirm", questions_count=2,
                     hard_gates=["critical_unknown"])
    bad = ArmResult(case_id=case.id, kind="route", agent="mentor-virtual")
    assert grade_next_action(case, good).verdict == "PASS"
    assert grade_next_action(case, bad).score < grade_next_action(case, good).score


def test_metrics_helpers():
    case = golden_by_id("orden-compra")
    right = ArmResult(case_id=case.id, kind="route", agent="research-assistant", step=1)
    wrong = ArmResult(case_id=case.id, kind="route", agent="mentor-virtual", step=0)
    assert routing_correct(case, right) and not routing_correct(case, wrong)
    assert gate_compliant(case, right)
