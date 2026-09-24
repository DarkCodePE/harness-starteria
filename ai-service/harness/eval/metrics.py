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
    horizon: str | None = None
    step: int | None = None
    confidence: str | None = None
    unit_confidence: str | None = None
    confidence_scores: dict[str, float] = field(default_factory=dict)
    method_pack: str | None = None
    hard_gates: list[str] = field(default_factory=list)
    soft_gates: list[str] = field(default_factory=list)
    prohibited_terms: list[str] = field(default_factory=list)
    questions_count: int = 0
    grounded_forbidden_hits: int = 0
    grounding_observed: bool = False
    next_action_score: float = 0.0  # 0..10 from graders

    # Timing. `latency_scope` keeps a deterministic number from being read as a live one:
    # "harness_overhead" excludes any LLM round-trip, "end_to_end" includes it.
    latency_ms: float | None = None
    llm_calls: int = 0
    latency_scope: str | None = None
    tokens_in: int | None = None
    tokens_out: int | None = None


def routing_correct(case: GoldenCase, arm: ArmResult) -> bool:
    """The arm did the right high-level thing: matched the expected kind, and for a
    ``route`` case, picked the expected agent and step. Route/pack are scored
    separately by classification_by_field."""
    if arm.kind != case.expected_kind:
        return False
    if case.expected_kind == "route":
        return arm.agent == case.expected_agent and (
            case.expected_step is None or arm.step == case.expected_step
        )
    return arm.agent is None


def gate_compliant(case: GoldenCase, arm: ArmResult) -> bool:
    """Gate behavior matches expectation, no prohibited terms, ≤3 questions (§19/§8.3)."""
    return (
        arm.kind == case.expected_kind
        and (arm.kind == "route" or arm.agent is None)
        and not arm.prohibited_terms
        and 0 <= arm.questions_count <= 3
        and (arm.kind != "confirm" or arm.questions_count >= 1)
        and set(case.expected_hard_gates).issubset(arm.hard_gates)
        and set(case.expected_soft_gates).issubset(arm.soft_gates)
    )


# Routing dimensions compared per case: ArmResult attribute → GoldenCase expectation.
# Adding a dimension here is the only change needed to start scoring it.
CLASSIFICATION_FIELDS: tuple[tuple[str, str], ...] = (
    ("route", "expected_route"),
    ("challenge_type", "expected_challenge_type"),
    ("depth", "expected_depth"),
    ("horizon", "expected_horizon"),
    ("step", "expected_step"),
    ("method_pack", "expected_method_pack"),
)


def classification_by_field(case: GoldenCase, arm: ArmResult) -> dict[str, bool]:
    """Per-dimension agreement, so a gain on one dimension cannot hide a loss on another.

    Only dimensions the case actually declares an expectation for are returned: a case that
    leaves ``expected_depth`` as None simply does not vote on depth. Non-route cases return
    an empty dict — classification is not applicable to confirm/escalate.
    """
    if case.expected_kind != "route":
        return {}
    out: dict[str, bool] = {}
    for arm_attr, case_attr in CLASSIFICATION_FIELDS:
        expected = getattr(case, case_attr, None)
        if expected is None:
            continue
        out[arm_attr] = getattr(arm, arm_attr, None) == expected
    return out


def classification_correct(case: GoldenCase, arm: ArmResult) -> bool | None:
    """Do ALL declared routing dimensions match? None for non-route cases.

    This is the strict aggregate; ``classification_by_field`` is what tells you *which*
    dimension moved when the aggregate changes — or, worse, when it does not.
    """
    per_field = classification_by_field(case, arm)
    return all(per_field.values()) if per_field else None


def _total(xs) -> int | None:
    """Sum, or None when nothing was measured — same convention as ``_mean``."""
    vals = [x for x in xs if x is not None]
    return sum(vals) if vals else None


def _mean(xs: list[float]) -> float | None:
    """Mean, or ``None`` when there is nothing to average.

    Returning 0.0 for an empty sample was a bug with teeth: a metric whose denominator is
    empty (e.g. calibration over an arm that never reports confidence) printed as 0.0 and
    read as "calibrated 0% of the time" — indistinguishable from a genuinely terrible
    score, and it manufactured a fake improvement in the delta column.
    """
    return round(sum(xs) / len(xs), 4) if xs else None


def scorecard(cases: list[GoldenCase], arms: dict[str, ArmResult]) -> dict:
    """Aggregate metrics for one arm across all cases. ``arms`` maps case_id → ArmResult.

    Any metric can come back as ``None``, meaning "not measurable on this sample" rather
    than zero. Callers must not treat ``None`` as 0.
    """
    paired = [(c, arms[c.id]) for c in cases if c.id in arms]
    n = len(paired)

    routing = [1.0 if routing_correct(c, a) else 0.0 for c, a in paired]
    gate = [1.0 if gate_compliant(c, a) else 0.0 for c, a in paired]
    # A substring sentinel test is measurable only with grounding AND sentinels.
    # Zero hits is not a general estimate of hallucination/extraction accuracy.
    halluc = [1.0 if a.grounded_forbidden_hits > 0 else 0.0 for c, a in paired
              if a.grounding_observed and c.forbidden_facts]

    classif = [classification_correct(c, a) for c, a in paired]
    classif_vals = [1.0 if x else 0.0 for x in classif if x is not None]

    # Per-dimension accuracy. An arm that gains on `step` while regressing on `route` looks
    # flat in the aggregate above; this is what makes that visible.
    by_field: dict[str, list[float]] = {}
    for c, a in paired:
        for fname, ok in classification_by_field(c, a).items():
            by_field.setdefault(fname, []).append(1.0 if ok else 0.0)

    # Calibration: among high-confidence route decisions, how many were correct?
    hi = [(c, a) for c, a in paired if a.confidence == "high" and a.kind == "route"]
    calib = [1.0 if routing_correct(c, a) and classification_correct(c, a) is not False
             else 0.0 for c, a in hi]

    nextq = [a.next_action_score for _, a in paired]

    # Latency. p50 + max rather than p95: on a sample this small a "p95" is just the second
    # highest value dressed up as a percentile.
    lat = sorted(round(a.latency_ms, 3) for _, a in paired if a.latency_ms is not None)
    scopes = {a.latency_scope for _, a in paired if a.latency_scope}
    scope = scopes.pop() if len(scopes) == 1 else ("mixed" if scopes else None)

    # Metrics computed over a SUBSET of the cases carry their own denominator. A 1.0 over
    # two cases and a 1.0 over fifty are not the same claim, and the value alone hides that.
    return {
        "n_cases": n,
        "routing_precision": _mean(routing),
        "gate_compliance": _mean(gate),
        "hallucination_rate": _mean(halluc),
        "hallucination_n": len(halluc),
        "classification_accuracy": _mean(classif_vals),
        "classification_n": len(classif_vals),
        "classification_by_field": {k: _mean(v) for k, v in sorted(by_field.items())},
        "classification_by_field_n": {k: len(v) for k, v in sorted(by_field.items())},
        "confidence_calibration": _mean(calib),
        "confidence_calibration_n": len(calib),
        "next_action_quality": _mean(nextq),
        "latency_ms_p50": lat[len(lat) // 2] if lat else None,
        "latency_ms_max": lat[-1] if lat else None,
        "latency_scope": scope,
        "llm_calls_total": sum(a.llm_calls for _, a in paired),
        "tokens_in_total": _total(a.tokens_in for _, a in paired),
        "tokens_out_total": _total(a.tokens_out for _, a in paired),
    }
