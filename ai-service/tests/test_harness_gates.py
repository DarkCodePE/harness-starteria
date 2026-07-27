"""Unit tests for the gate ladder + predicates (ADR-027 §14/§19)."""

import pytest

from harness.config_loader import load_methodology
from harness.config_models import GateRule
from harness.contracts import DiagnosisState, EpistemicStatus as E, GroundedField, RouteProfile
from harness.gates import GateLadder, UnknownPredicateError, evaluate_rule

pytestmark = pytest.mark.unit


def _ladder():
    return GateLadder(load_methodology().gates)


def _profile(**kw):
    base = dict(intent="validate", unit="initiative", challenge_type="growth",
                route="explore_validate", depth="standard", step=1, confidence="high")
    base.update(kw)
    return RouteProfile(**base)


def _state(fields, **rp):
    return DiagnosisState(fields=fields, route_profile=_profile(**rp))


def test_clean_state_allows_routing():
    v = _ladder().evaluate(_state([GroundedField(key="objective", value="x", status=E.DECLARED, critical=True)]))
    assert v.action in ("Allow", "Review")
    assert not v.blocks_routing


def test_critical_unknown_requires_confirmation():
    v = _ladder().evaluate(_state([GroundedField(key="audience", value=None, status=E.UNKNOWN, critical=True)],
                                   confidence="low"))
    assert v.action == "RequireConfirmation"
    assert "critical_unknown" in v.failed_hard_gates


def test_conflicting_field_requires_confirmation():
    v = _ladder().evaluate(_state([GroundedField(key="owner", value="A", status=E.CONFLICTING, critical=True)]))
    assert v.action == "RequireConfirmation"
    assert "contradiction" in v.failed_hard_gates


def test_red_line_blocks_categorically():
    v = _ladder().evaluate(_state([GroundedField(key="sensitive", value=True, status=E.DECLARED)]))
    assert v.action == "Block"
    assert "red_line" in v.failed_hard_gates


def test_soft_gate_accumulates_without_blocking():
    # Inferred baseline (soft) + inferred unit (soft) should NOT block routing.
    v = _ladder().evaluate(_state([GroundedField(key="baseline", value="10%", status=E.INFERRED)],
                                   unit_status=E.INFERRED, horizon="unconfirmed"))
    assert not v.blocks_routing
    assert set(v.failed_soft_gates) & {"baseline_estimated", "unit_inferred", "horizon_unconfirmed"}


def test_prohibited_terms_and_question_cap():
    ladder = _ladder()
    assert set(ladder.check_prohibited_terms("La propuesta queda validada y aprobada")) == {"validada", "aprobada"}
    assert ladder.enforce_question_cap(["a", "b", "c", "d", "e"]) == ["a", "b", "c"]


def test_unknown_predicate_raises():
    bad = GateRule(id="bad", predicate="does_not_exist", weight=0.5)
    with pytest.raises(UnknownPredicateError):
        evaluate_rule(DiagnosisState(), bad)
