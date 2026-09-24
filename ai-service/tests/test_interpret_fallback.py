"""INTERPRET falls open to the LLM backend when Jev is unreachable (ADR-031).

Jev sits on the critical path of every diagnosis. A missing key, a timeout or a 429 must
degrade the classifier, not take the endpoint down — the same fail-open stance the cost
gate and the model router already take.
"""

import pytest

from harness.contracts import EpistemicStatus, GroundedField, RouteProfile
from harness.jev import JevError

pytestmark = pytest.mark.unit

_PROFILE = dict(
    intent="validate", unit="initiative", unit_status="inferred", challenge_type="growth",
    route="explore_validate", depth="standard", step=1, confidence="high",
)


def _diagnose(monkeypatch, *, jev_raises=None):
    """Run a real diagnosis with GROUND mocked and INTERPRET's Jev call controlled."""
    import harness.harness as hmod
    from harness.contracts import GroundedFieldList

    if jev_raises is not None:
        def _boom(*_a, **_k):
            raise jev_raises
        monkeypatch.setattr("harness.jev.interpret", _boom)

    # The LLM rollback path must produce something; stand in for the provider call.
    monkeypatch.setattr(
        "harness.stages.llm_stages.stage_structured_call",
        lambda system, human, model_cls, **kw: (
            kw["mock"]() if kw.get("mock") else model_cls(**_PROFILE)
        ),
    )
    monkeypatch.setattr(hmod, "_instance", None)
    ground = GroundedFieldList(fields=[GroundedField(
        key="objective", value="aumentar ventas", status=EpistemicStatus.DECLARED,
        source="user_declaration", critical=True)])
    decision = hmod.get_harness().diagnose(
        {"payload": {"originalInput": "x", "projectId": "p"}},
        raw_input="Queremos aumentar ventas 20%", project_id="p",
        mocks={"ground": lambda: ground},
    )
    monkeypatch.setattr(hmod, "_instance", None)
    return decision


@pytest.mark.parametrize("failure", [
    JevError("Jev needs JEV_API_KEY (or TYPESAFE_API_KEY)."),
    JevError("Jev returned HTTP 429: rate limited"),
    JevError("Jev response had no answers map"),
])
def test_a_jev_failure_does_not_take_the_diagnosis_down(monkeypatch, failure):
    """Missing key, rate limit, malformed body — none of them may raise to the caller."""
    decision = _diagnose(monkeypatch, jev_raises=failure)
    assert decision.kind in ("route", "confirm", "escalate")
    assert isinstance(decision.route_profile, RouteProfile)


def test_the_fallback_is_visible_in_the_audit_record(monkeypatch):
    """A run classified by the LLM must not claim Jev did it."""
    fell_back = _diagnose(monkeypatch, jev_raises=JevError("down"))
    assert "+typesafe:" not in fell_back.trace.audit.model_id
    assert fell_back.trace.audit.model_provider != "openrouter+typesafe"


def test_the_fallback_logs_a_warning(monkeypatch, caplog):
    """Silent degradation is the failure mode this guards against."""
    with caplog.at_level("WARNING"):
        _diagnose(monkeypatch, jev_raises=JevError("boom"))
    messages = [r.getMessage() for r in caplog.records]
    assert any("jev_interpret_failed" in m for m in messages), messages


def test_the_llm_rollback_clears_jev_only_fields(monkeypatch):
    """unit_confidence is a Jev concept; the LLM prompt never asks for it."""
    decision = _diagnose(monkeypatch, jev_raises=JevError("down"))
    assert decision.route_profile.unit_confidence is None
    assert decision.route_profile.confidence_scores == {}


def test_a_non_jev_exception_still_propagates(monkeypatch):
    """Fail-open covers Jev being unreachable, not bugs in our own assembly code.

    A ValueError from the profile builder is a defect to fix, not an outage to absorb;
    swallowing it would hide the bug behind a silently degraded classifier.
    """
    with pytest.raises(ValueError, match="a real bug"):
        _diagnose(monkeypatch, jev_raises=ValueError("a real bug, not a dependency outage"))
