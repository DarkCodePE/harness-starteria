"""Next-action quality grader (ADR-027).

Ported from ECC's gan-evaluator weighted-rubric pattern: a set of weighted criteria produce
a 0..10 score with a PASS/FAIL threshold. Kept deterministic (code-based, not LLM) so eval
runs are reproducible in both modes. This is a structural proxy, not human assessment
of question relevance, escalation ownership or downstream answer quality.
"""

from __future__ import annotations

from dataclasses import dataclass

from harness.eval.dataset import GoldenCase
from harness.eval.metrics import classification_correct, gate_compliant, routing_correct

PASS_THRESHOLD = 7.0

# Weighted criteria (sum of weights = 1.0).
_WEIGHTS = {
    "correct_disposition": 0.4,   # routed vs confirmed vs escalated as expected
    "specificity": 0.3,           # concrete target (agent+pack) or targeted questions
    "proportionality": 0.3,       # no prohibited terms, ≤3 questions, grounded
}


@dataclass
class Grade:
    score: float          # 0..10
    verdict: str          # PASS | FAIL
    breakdown: dict[str, float]


def grade_next_action(case: GoldenCase, arm) -> Grade:  # arm: ArmResult (avoid import cycle)
    disposition = 1.0 if arm.kind == case.expected_kind else 0.0

    if arm.kind == "route":
        specificity = 1.0 if (arm.agent and arm.route) else 0.3
    elif arm.kind == "confirm":
        specificity = 1.0 if 1 <= arm.questions_count <= 3 else 0.3
    else:  # escalate
        specificity = 1.0

    proportionality = 1.0
    if arm.prohibited_terms:
        proportionality -= 0.6
    if arm.questions_count > 3:
        proportionality -= 0.4
    if arm.grounded_forbidden_hits > 0:
        proportionality -= 0.6
    proportionality = max(0.0, proportionality)

    breakdown = {
        "correct_disposition": disposition,
        "specificity": specificity,
        "proportionality": proportionality,
    }
    score10 = round(10.0 * sum(_WEIGHTS[k] * v for k, v in breakdown.items()), 3)
    correct = (routing_correct(case, arm) and gate_compliant(case, arm)
               and classification_correct(case, arm) is not False
               and arm.grounded_forbidden_hits == 0)
    # A polished but wrong disposition/route cannot pass on style points.
    return Grade(score=score10, verdict="PASS" if correct and score10 >= PASS_THRESHOLD else "FAIL",
                 breakdown=breakdown)
