"""Effectiveness metrics for the harness A/B eval (ADR-027, methodology §21).

Pure functions over ArmResult objects — no I/O, no LLM — so the scorecard is reproducible.
The metrics mirror the methodology's own list (§21): routing precision, extraction/grounding
precision (via hallucination rate), gate compliance, confidence calibration, plus
classification accuracy on the routing dimensions.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from harness.eval.dataset import GoldenCase


@dataclass
class ArmResult:
    """A single arm's (baseline | harness) output for one golden case."""

    case_id: str
    kind: str                       # route | confirm | escalate
    agent: str | None = None
    route: str | None = None
    challenge_type: str | None = None
    depth: str | None = None
    step: int | None = None
    confidence: str | None = None
    prohibited_terms: list[str] = field(default_factory=list)
    questions_count: int = 0
    grounded_forbidden_hits: int = 0
    next_action_score: float = 0.0  # 0..10 from graders


def routing_correct(case: GoldenCase, arm: ArmResult) -> bool:
    """The arm did the right high-level thing: matched the expected kind, and for a
    ``route`` case, picked the expected agent."""
    if arm.kind != case.expected_kind:
        return False
    if case.expected_kind == "route":
        return arm.agent == case.expected_agent
    return True  # confirm/escalate: not routing IS the correct behavior


def gate_compliant(case: GoldenCase, arm: ArmResult) -> bool:
    """Gate behavior matches expectation, no prohibited terms, ≤3 questions (§19/§8.3)."""
    return (
        arm.kind == case.expected_kind
        and not arm.prohibited_terms
        and arm.questions_count <= 3
    )


def classification_correct(case: GoldenCase, arm: ArmResult) -> bool | None:
    """Do the routing dimensions match? Returns None for non-route cases (not applicable)."""
    if case.expected_kind != "route":
        return None
    checks = []
    if case.expected_route is not None:
        checks.append(arm.route == case.expected_route)
    if case.expected_challenge_type is not None:
        checks.append(arm.challenge_type == case.expected_challenge_type)
    if case.expected_depth is not None:
        checks.append(arm.depth == case.expected_depth)
    if case.expected_step is not None:
        checks.append(arm.step == case.expected_step)
    return all(checks) if checks else None


def _mean(xs: list[float]) -> float:
    return round(sum(xs) / len(xs), 4) if xs else 0.0


def scorecard(cases: list[GoldenCase], arms: dict[str, ArmResult]) -> dict:
    """Aggregate metrics for one arm across all cases. ``arms`` maps case_id → ArmResult."""
    paired = [(c, arms[c.id]) for c in cases if c.id in arms]
    n = len(paired)

    routing = [1.0 if routing_correct(c, a) else 0.0 for c, a in paired]
    gate = [1.0 if gate_compliant(c, a) else 0.0 for c, a in paired]
    halluc = [1.0 if a.grounded_forbidden_hits > 0 else 0.0 for _, a in paired]

    classif = [classification_correct(c, a) for c, a in paired]
    classif_vals = [1.0 if x else 0.0 for x in classif if x is not None]

    # Calibration: among high-confidence route decisions, how many were correct?
    hi = [(c, a) for c, a in paired if a.confidence == "high" and a.kind == "route"]
    calib = [1.0 if routing_correct(c, a) else 0.0 for c, a in hi]

    nextq = [a.next_action_score for _, a in paired]

    return {
        "n_cases": n,
        "routing_precision": _mean(routing),
        "gate_compliance": _mean(gate),
        "hallucination_rate": _mean(halluc),
        "classification_accuracy": _mean(classif_vals),
        "confidence_calibration": _mean(calib),
        "next_action_quality": round(_mean(nextq), 4),
    }
