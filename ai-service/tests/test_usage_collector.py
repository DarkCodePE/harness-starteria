"""Token collection across a LangChain/LangGraph invocation (E9).

The orchestrator used to record `input_tokens=0, output_tokens=0`, so the daily budget
accumulated nothing regardless of what a request actually cost. These cover the handler
that replaces those zeros.
"""

import pytest
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, LLMResult

from services.usage_collector import UsageCollector

pytestmark = pytest.mark.unit


def _result(*usages):
    """One LLMResult carrying one generation per usage dict (None = no metadata)."""
    gens = [
        ChatGeneration(
            message=AIMessage(content="x", usage_metadata=u) if u else AIMessage(content="x")
        )
        for u in usages
    ]
    return LLMResult(generations=[gens])


def _usage(i, o):
    return {"input_tokens": i, "output_tokens": o, "total_tokens": i + o}


def test_accumulates_across_calls():
    """An agent loop makes several calls; all of them were billed."""
    c = UsageCollector()
    c.on_llm_end(_result(_usage(100, 20)))
    c.on_llm_end(_result(_usage(250, 45)))
    c.on_llm_end(_result(_usage(80, 5)))

    assert (c.input_tokens, c.output_tokens) == (430, 70)
    assert c.calls == 3
    assert c.complete


def test_missing_usage_metadata_is_counted_not_hidden():
    """A completion with no usage under-counts the budget; the counter makes it visible."""
    c = UsageCollector()
    c.on_llm_end(_result(_usage(10, 5)))
    c.on_llm_end(_result(None))

    assert (c.input_tokens, c.output_tokens) == (10, 5)
    assert c.calls == 2
    assert c.calls_without_usage == 1
    assert not c.complete


def test_a_collector_that_saw_nothing_is_not_complete():
    """Zero calls is not 'all calls reported' — it is no evidence at all."""
    c = UsageCollector()
    assert c.calls == 0
    assert not c.complete


def _loose_result(usage):
    """A duck-typed LLMResult.

    Both AIMessage and LLMResult validate their payloads, so a malformed or partial usage
    dict cannot be built through them — but a provider integration can still hand one to
    the handler at runtime. The handler reads attributes, so this is what it actually sees.
    """
    message = type("M", (), {"usage_metadata": usage})()
    generation = type("G", (), {"message": message})()
    return type("R", (), {"generations": [[generation]]})()


def test_partial_usage_fields_do_not_crash():
    """Providers vary; a missing field counts as 0 for that field, not an exception."""
    c = UsageCollector()
    c.on_llm_end(_loose_result({"input_tokens": 12}))
    assert (c.input_tokens, c.output_tokens) == (12, 0)
    assert c.calls == 1


def test_non_dict_usage_is_treated_as_missing():
    """A provider returning something unexpected must not be billed as zero silently."""
    c = UsageCollector()
    c.on_llm_end(_loose_result("not-a-dict"))
    assert (c.input_tokens, c.output_tokens) == (0, 0)
    assert c.calls_without_usage == 1
    assert not c.complete


def test_multiple_generations_in_one_result():
    """n>1 sampling bills every generation."""
    c = UsageCollector()
    c.on_llm_end(_result(_usage(10, 1), _usage(10, 2)))
    assert (c.input_tokens, c.output_tokens) == (20, 3)
    assert c.calls == 2


def test_collector_is_per_invocation_not_global():
    """Two requests must not see each other's tokens — the bug a module global would cause."""
    a, b = UsageCollector(), UsageCollector()
    a.on_llm_end(_result(_usage(1000, 100)))
    b.on_llm_end(_result(_usage(7, 3)))

    assert (a.input_tokens, a.output_tokens) == (1000, 100)
    assert (b.input_tokens, b.output_tokens) == (7, 3)


def test_cost_tracker_now_sees_a_real_number():
    """End of the chain: collected tokens priced by the E8 table, not silently zero."""
    from services.cost_tracker import CostTracker, _daily_cost

    c = UsageCollector()
    c.on_llm_end(_result(_usage(1_000_000, 1_000_000)))

    tracker = CostTracker()
    cost = tracker.record_usage("proj-e9", "feedback-ia", c.input_tokens, c.output_tokens)

    assert cost == pytest.approx(1.75)  # qwen: $0.25 in + $1.50 out per 1M
    assert _daily_cost["proj-e9"][max(_daily_cost["proj-e9"])] == pytest.approx(1.75)
