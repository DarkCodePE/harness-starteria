"""Deterministic gate evaluation (ADR-027, methodology §14/§19).

Ported from ECC's `compute_risk → SuggestedAction::from_score` ladder: gate conditions
produce a weighted risk score which maps to Allow / Review / RequireConfirmation / Block.
Any triggered HARD gate additionally forces at least RequireConfirmation (hard gates are
categorical, not merely additive).

Config safety: a gate's condition is a NAMED predicate resolved from the PREDICATES
registry below — never a free-text expression, so config can never execute code.
"""

from __future__ import annotations

from collections.abc import Callable

from harness.config_models import GateRule, GatesConfig
from harness.contracts import DiagnosisState, EpistemicStatus, GateVerdict

# A predicate answers "does this gate condition hold for the current diagnosis state?"
Predicate = Callable[[DiagnosisState, GateRule], bool]


def _field_status(state: DiagnosisState, key: str) -> EpistemicStatus | None:
    f = state.field(key)
    return f.status if f else None


def _pred_any_critical_unknown(state: DiagnosisState, rule: GateRule) -> bool:
    return any(f.critical and f.status is EpistemicStatus.UNKNOWN for f in state.fields)


def _pred_any_conflicting(state: DiagnosisState, rule: GateRule) -> bool:
    return any(f.status is EpistemicStatus.CONFLICTING for f in state.fields)


def _pred_confidence_low(state: DiagnosisState, rule: GateRule) -> bool:
    rp = state.route_profile
    return rp is None or rp.confidence in ("low", "not_evaluable")


def _pred_field_flag(state: DiagnosisState, rule: GateRule) -> bool:
    f = state.field(rule.field or "")
    return bool(f and f.value is True)


def _pred_field_status_in(state: DiagnosisState, rule: GateRule) -> bool:
    status = _field_status(state, rule.field or "")
    return status is not None and status.value in set(rule.values)


def _pred_field_status_not(state: DiagnosisState, rule: GateRule) -> bool:
    status = _field_status(state, rule.field or "")
    return status is None or status.value != rule.value


def _pred_unit_status_not(state: DiagnosisState, rule: GateRule) -> bool:
    rp = state.route_profile
    return rp is None or rp.unit_status.value != rule.value


def _pred_horizon_is(state: DiagnosisState, rule: GateRule) -> bool:
    rp = state.route_profile
    horizon = rp.horizon if rp else "unconfirmed"
    return horizon == rule.value


PREDICATES: dict[str, Predicate] = {
    "any_critical_unknown": _pred_any_critical_unknown,
    "any_conflicting": _pred_any_conflicting,
    "confidence_low": _pred_confidence_low,
    "field_flag": _pred_field_flag,
    "field_status_in": _pred_field_status_in,
    "field_status_not": _pred_field_status_not,
    "unit_status_not": _pred_unit_status_not,
    "horizon_is": _pred_horizon_is,
}


class UnknownPredicateError(ValueError):
    """Raised when a gate references a predicate not in the registry (config guard)."""


def evaluate_rule(state: DiagnosisState, rule: GateRule) -> bool:
    pred = PREDICATES.get(rule.predicate)
    if pred is None:
        raise UnknownPredicateError(
            f"Gate {rule.id!r} uses unknown predicate {rule.predicate!r}; "
            f"known: {sorted(PREDICATES)}"
        )
    return pred(state, rule)


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


class GateLadder:
    """Evaluates all gates against a DiagnosisState → a GateVerdict."""

    def __init__(self, gates: GatesConfig) -> None:
        self._gates = gates

    def evaluate(self, state: DiagnosisState) -> GateVerdict:
        score = 0.0
        reasons: list[str] = []
        failed_hard: list[str] = []
        failed_soft: list[str] = []

        for rule in self._gates.hard:
            if evaluate_rule(state, rule):
                failed_hard.append(rule.id)
                score += rule.weight
                reasons.append(rule.message or rule.id)
        for rule in self._gates.soft:
            if evaluate_rule(state, rule):
                failed_soft.append(rule.id)
                score += rule.weight
                reasons.append(rule.message or rule.id)

        score = _clamp(score)
        t = self._gates.thresholds
        # Hard-gate action is CATEGORICAL (not score-driven): a hard gate marked
        # severity=block escalates; any other hard gate requires confirmation. Soft
        # gates only accumulate score, which can independently reach the confirm/review
        # bands. This prevents two benign-but-related hard signals from stacking to Block.
        hard_block = any(r.severity == "block" for r in self._gates.hard if r.id in failed_hard)
        hard_confirm = bool(failed_hard)
        if hard_block:
            action = "Block"
        elif hard_confirm or score >= t.confirm:
            action = "RequireConfirmation"
        elif score >= t.review:
            action = "Review"
        else:
            action = "Allow"

        return GateVerdict(
            action=action,
            score=round(score, 4),
            reasons=reasons,
            failed_hard_gates=failed_hard,
            failed_soft_gates=failed_soft,
        )

    # -- §19 prohibited terms + question cap ------------------------------------
    def check_prohibited_terms(self, *texts: str) -> list[str]:
        """Return any prohibited terms found (case-insensitive) across the given texts."""
        haystack = " \n ".join(t for t in texts if t).lower()
        return [term for term in self._gates.prohibited_terms if term.lower() in haystack]

    def enforce_question_cap(self, questions: list[str]) -> list[str]:
        """Truncate a strategic-question list to the configured maximum (§8.3)."""
        return questions[: self._gates.max_strategic_questions]
