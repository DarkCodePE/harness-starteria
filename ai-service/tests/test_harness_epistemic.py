"""Unit tests for the epistemic tracker + §3 promotion rule (ADR-027)."""

import pytest

from harness.contracts import EpistemicStatus as E
from harness.contracts import GroundedField
from harness.epistemic import EpistemicTracker, PromotionError

pytestmark = pytest.mark.unit


def _tracker():
    return EpistemicTracker([
        GroundedField(key="objective", value=None, status=E.UNKNOWN, critical=True),
        GroundedField(key="baseline", value="10%", status=E.INFERRED),
        GroundedField(key="name", value="ACME", status=E.DECLARED),
    ])


def test_promote_requires_human_actor():
    tr = _tracker()
    with pytest.raises(PromotionError):
        tr.promote("baseline", actor=None)


def test_promote_rejects_non_promotable_status():
    tr = _tracker()
    # UNKNOWN and DECLARED are not promotable to CONFIRMED.
    with pytest.raises(PromotionError):
        tr.promote("objective", actor="mentor@corp")
    with pytest.raises(PromotionError):
        tr.promote("name", actor="mentor@corp")


def test_promote_inferred_with_actor_succeeds():
    tr = _tracker()
    field = tr.promote("baseline", actor="mentor@corp")
    assert field.status is E.CONFIRMED
    assert field.source == "mentor@corp"


def test_promote_unknown_field_raises():
    with pytest.raises(PromotionError):
        _tracker().promote("does-not-exist", actor="x")


def test_detect_conflicts_marks_conflicting():
    tr = EpistemicTracker([
        GroundedField(key="owner", value="Ana", status=E.DECLARED),
        GroundedField(key="owner", value="Beto", status=E.EXTRACTED),
    ])
    assert tr.detect_conflicts() == ["owner"]
    assert tr.has_conflicts()
    assert all(f.status is E.CONFLICTING for f in tr.fields)


def test_partition_and_critical_unknowns():
    tr = _tracker()
    buckets = tr.partition()
    assert {f.key for f in buckets["facts"]} == {"name"}
    assert {f.key for f in buckets["inferences"]} == {"baseline"}
    assert {f.key for f in buckets["unknowns"]} == {"objective"}
    assert tr.critical_unknowns() == ["objective"]
