"""Token accounting and include_raw envelope handling in harness.llm (E6).

Hermetic: the chain is faked, so these exercise the LIVE code path — envelope unpacking,
parsing_error retry, usage capture — without a provider call. The deterministic eval run
cannot cover any of this, because it never reaches stage_structured_call's network branch.
"""

import pytest
from langchain_core.messages import AIMessage

from harness.contracts import RouteProfile
from harness.llm import collect_usage, stage_structured_call

pytestmark = pytest.mark.unit

_PROFILE = dict(
    intent="validate", unit="initiative", challenge_type="growth",
    route="explore_validate", depth="standard", step=1, confidence="high",
)


def _envelope(parsed=None, error=None, usage=None):
    raw = AIMessage(content="{}", usage_metadata=usage) if usage else AIMessage(content="{}")
    return {"raw": raw, "parsed": parsed, "parsing_error": error}


class _FakeChain:
    def __init__(self, *envelopes):
        self._queue = list(envelopes)
        self.calls = 0

    def invoke(self, _messages):
        self.calls += 1
        return self._queue.pop(0)


@pytest.fixture
def fake_chain(monkeypatch):
    def _install(*envelopes):
        chain = _FakeChain(*envelopes)
        monkeypatch.setattr("harness.llm._structured_llm", lambda *_a, **_k: chain)
        monkeypatch.setattr("harness.llm._model_id", lambda: "test/model")
        return chain
    return _install


def test_usage_is_captured_inside_collect_usage(fake_chain):
    fake_chain(_envelope(
        parsed=RouteProfile(**_PROFILE),
        usage={"input_tokens": 120, "output_tokens": 45, "total_tokens": 165},
    ))
    with collect_usage() as usage:
        out = stage_structured_call("sys", "human", RouteProfile)

    assert isinstance(out, RouteProfile)
    assert len(usage) == 1
    assert (usage[0].input_tokens, usage[0].output_tokens) == (120, 45)
    assert usage[0].total_tokens == 165
    assert usage[0].model_id == "test/model"


def test_no_usage_metadata_reports_none_not_zero(fake_chain):
    """A provider that reports nothing must not look like a free call."""
    fake_chain(_envelope(parsed=RouteProfile(**_PROFILE)))
    with collect_usage() as usage:
        stage_structured_call("sys", "human", RouteProfile)

    assert usage[0].input_tokens is None
    assert usage[0].output_tokens is None
    assert usage[0].total_tokens is None


def test_parsing_error_still_retries(fake_chain):
    """include_raw stops raising on parse failure; the retry must survive that."""
    chain = fake_chain(
        _envelope(error=ValueError("truncated JSON"),
                  usage={"input_tokens": 100, "output_tokens": 8, "total_tokens": 108}),
        _envelope(parsed=RouteProfile(**_PROFILE),
                  usage={"input_tokens": 100, "output_tokens": 40, "total_tokens": 140}),
    )
    with collect_usage() as usage:
        out = stage_structured_call("sys", "human", RouteProfile)

    assert isinstance(out, RouteProfile)
    assert chain.calls == 2, "a parsing_error envelope did not trigger the retry"
    # Both attempts were billed; a cost figure that hides retries understates the run.
    assert len(usage) == 2
    assert sum(u.output_tokens for u in usage) == 48


def test_exhausted_retries_raise_the_parsing_error(fake_chain):
    fake_chain(
        _envelope(error=ValueError("truncated once")),
        _envelope(error=ValueError("truncated twice")),
    )
    with pytest.raises(ValueError, match="truncated twice"):
        stage_structured_call("sys", "human", RouteProfile)


def test_parsed_none_without_error_is_rejected(fake_chain):
    """An envelope with neither a value nor an error must not yield a silent None."""
    fake_chain(_envelope(), _envelope())
    with pytest.raises(ValueError, match="no parsed value"):
        stage_structured_call("sys", "human", RouteProfile)


def test_mocked_call_records_no_usage():
    """No provider call, no tokens — the mock path must stay free and silent."""
    with collect_usage() as usage:
        out = stage_structured_call(
            "sys", "human", RouteProfile, mock=lambda: RouteProfile(**_PROFILE)
        )
    assert isinstance(out, RouteProfile)
    assert usage == []


def test_usage_outside_a_collector_is_dropped(fake_chain):
    """Without an active sink the call still works; telemetry is opt-in."""
    fake_chain(_envelope(
        parsed=RouteProfile(**_PROFILE),
        usage={"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
    ))
    assert isinstance(stage_structured_call("sys", "human", RouteProfile), RouteProfile)


def test_driver_lands_tokens_on_the_stage_trace(monkeypatch):
    """End-to-end: the driver's collect_usage() must deposit counts into StageTrace.

    The unit tests above stop at stage_structured_call. This is the seam that carries the
    numbers to the scorecard, and nothing else exercises it.
    """
    from harness.contracts import EpistemicStatus, GroundedField, GroundedFieldList
    import harness.harness as hmod
    monkeypatch.setenv("HARNESS_INTERPRET_BACKEND", "llm")

    class _Chain:
        def __init__(self, cls):
            self._cls = cls

        def invoke(self, _messages):
            parsed = (
                GroundedFieldList(fields=[GroundedField(
                    key="objective", value="aumentar ventas",
                    status=EpistemicStatus.DECLARED, source="user_declaration", critical=True)])
                if self._cls is GroundedFieldList
                else RouteProfile(**_PROFILE)
            )
            return _envelope(parsed=parsed, usage={
                "input_tokens": 900, "output_tokens": 60, "total_tokens": 960})

    monkeypatch.setattr("harness.llm._structured_llm", lambda _mid, cls: _Chain(cls))
    monkeypatch.setattr("harness.llm._model_id", lambda: "test/model")
    monkeypatch.setattr(hmod, "_instance", None)

    decision = hmod.get_harness().diagnose(
        {"payload": {"originalInput": "x", "projectId": "p"}},
        raw_input="Queremos aumentar ventas 20%", project_id="p",
    )
    by_stage = {s.stage: s for s in decision.trace.stages}

    # Exactly the two LLM stages are billed.
    billed = {name for name, s in by_stage.items() if s.tokens_in is not None}
    assert billed == {"ground", "interpret"}
    assert all(by_stage[n].llm_used for n in billed)

    # Non-LLM stages report None, never a 0 that would read as a measured zero.
    assert by_stage["gate"].tokens_in is None and by_stage["gate"].tokens_out is None
    assert not by_stage["gate"].llm_used

    assert sum(s.tokens_in or 0 for s in decision.trace.stages) == 1800
    assert sum(s.tokens_out or 0 for s in decision.trace.stages) == 120

    monkeypatch.setattr(hmod, "_instance", None)
