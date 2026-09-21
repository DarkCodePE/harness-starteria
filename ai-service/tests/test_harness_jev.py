"""Jev backend for INTERPRET (E7) — assembly, confidence mapping, client.

Hermetic: httpx.MockTransport stands in for the API, so the whole path is exercised without
a network call or a token spent.
"""

import json

import httpx
import pytest

from harness.contracts import EpistemicStatus, RouteProfile
from harness.jev import (
    INTERPRET_QUESTIONS,
    JevError,
    ask,
    build_route_profile,
    interpret,
)

pytestmark = pytest.mark.unit


def _choice(value, confidence=0.9, probs=None):
    return {"type": "choice", "choice": value, "confidence": confidence,
            "probabilities": probs or {value: confidence}}


def _score(value, confidence=0.9):
    return {"type": "score", "score": value, "confidence": confidence}


def _answers(**overrides):
    base = {
        "intent": _choice("validate"),
        "unit": _choice("initiative"),
        "unit_status": _choice("inferred"),
        "challenge_type": _choice("growth"),
        "route": _choice("explore_validate"),
        "depth": _score(1.0),
        "uncertainty": _choice("mixed"),
        "horizon": _choice("unconfirmed"),
        "step": _score(1.0),
    }
    base.update(overrides)
    return base


# --- questions -------------------------------------------------------------------------


def test_unit_status_cannot_emit_confirmed():
    """epistemic.py guards CONFIRMED from inside; the answer space must guard it from outside."""
    options = set(INTERPRET_QUESTIONS["unit_status"]["criteria"])
    assert EpistemicStatus.CONFIRMED.value not in options
    assert EpistemicStatus.DECLARED.value not in options
    assert EpistemicStatus.EXTRACTED.value not in options


@pytest.mark.parametrize("qid", sorted(INTERPRET_QUESTIONS))
def test_every_question_declares_criteria(qid):
    """A Choice without criteria is the model guessing from a bare label."""
    q = INTERPRET_QUESTIONS[qid]
    assert q["criteria"], f"{qid} has no criteria"
    assert q["instructions"].strip()


def test_questions_cover_every_closed_field_of_the_contract():
    """If RouteProfile grows an enum, this fails until the question set catches up."""
    asked = set(INTERPRET_QUESTIONS)
    expected = {"intent", "unit", "unit_status", "challenge_type",
                "route", "depth", "uncertainty", "horizon", "step"}
    assert asked == expected


# --- assembly --------------------------------------------------------------------------


def test_builds_a_valid_route_profile():
    profile, contested = build_route_profile(_answers())
    assert isinstance(profile, RouteProfile)
    assert (profile.intent, profile.unit, profile.route) == (
        "validate", "initiative", "explore_validate")
    assert profile.depth == "standard"   # score 1.0 → index 1
    assert profile.step == 1
    assert contested == []


def test_score_is_rounded_and_clamped():
    """A provider score outside the legend must not produce an invalid contract."""
    profile, _ = build_route_profile(_answers(depth=_score(9.0), step=_score(-3.0)))
    assert profile.depth == "systemic"
    assert profile.step == 0


@pytest.mark.parametrize(
    "route_conf,unit_conf,route_expected,unit_expected",
    [(0.95, 0.90, "high", "high"), (0.95, 0.60, "high", "medium"),
     (0.75, 0.50, "high", "medium"),
     (0.95, 0.20, "high", "low"), (0.40, 0.99, "low", "high")],
)
def test_route_and_unit_keep_separate_confidence(route_conf, unit_conf, route_expected, unit_expected):
    """The route score is not dragged down by a different question's confidence."""
    profile, _ = build_route_profile(_answers(
        route=_choice("explore_validate", route_conf),
        unit=_choice("initiative", unit_conf),
    ))
    assert profile.confidence == route_expected
    assert profile.unit_confidence == unit_expected
    assert profile.confidence_scores == {"route": route_conf, "unit": unit_conf}


def test_a_close_runner_up_becomes_a_condition_that_would_change():
    profile, contested = build_route_profile(_answers(
        route=_choice("explore_validate", 0.9,
                      {"explore_validate": 0.45, "design_solution": 0.40}),
    ))
    assert "route" in contested
    assert any("design_solution" in c for c in profile.conditions_that_would_change)


def test_a_decisive_answer_produces_no_condition():
    profile, contested = build_route_profile(_answers(
        route=_choice("explore_validate", 0.9,
                      {"explore_validate": 0.95, "design_solution": 0.02}),
    ))
    assert "route" not in contested
    assert not any("design_solution" in c for c in profile.conditions_that_would_change)


def test_rationale_carries_the_probability_that_produced_each_field():
    """The reason IS what fired and how strongly — no second model call needed."""
    profile, _ = build_route_profile(_answers())
    assert any(r.startswith("route=explore_validate (p=") for r in profile.rationale)


@pytest.mark.parametrize("missing", ["intent", "route", "depth", "step"])
def test_a_missing_answer_raises_instead_of_defaulting(missing):
    """A silently defaulted dimension would be indistinguishable from a real classification."""
    answers = _answers()
    del answers[missing]
    with pytest.raises(JevError, match=missing):
        build_route_profile(answers)


# --- client ----------------------------------------------------------------------------


def _client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_ask_sends_the_documented_body_and_returns_usage(monkeypatch):
    monkeypatch.setenv("JEV_API_KEY", "test-key")
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers["Authorization"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json={
            "model": "jev-latest", "answers": _answers(),
            "usage": {"input_tokens": 312, "output_tokens": 48},
        })

    with _client(handler) as c:
        answers, usage = ask("un estado", client=c)

    assert seen["auth"] == "Bearer test-key"
    assert seen["body"]["model"] == "jev-latest"
    assert seen["body"]["state"] == "un estado"
    assert set(seen["body"]["questions"]) == set(INTERPRET_QUESTIONS)
    assert answers["route"]["choice"] == "explore_validate"
    assert (usage.input_tokens, usage.output_tokens) == (312, 48)
    assert usage.total_tokens == 360


def test_missing_usage_is_none_not_zero(monkeypatch):
    """Same convention as E6/E9: unreported is not free."""
    monkeypatch.setenv("JEV_API_KEY", "k")
    handler = lambda _r: httpx.Response(200, json={"answers": _answers()})  # noqa: E731
    with _client(handler) as c:
        _, usage = ask("s", client=c)
    assert usage.input_tokens is None and usage.output_tokens is None


def test_http_error_raises_jev_error(monkeypatch):
    monkeypatch.setenv("JEV_API_KEY", "k")
    handler = lambda _r: httpx.Response(429, text="rate limited")  # noqa: E731
    with _client(handler) as c, pytest.raises(JevError, match="429"):
        ask("s", client=c)


def test_body_without_answers_raises(monkeypatch):
    monkeypatch.setenv("JEV_API_KEY", "k")
    handler = lambda _r: httpx.Response(200, json={"model": "jev-latest"})  # noqa: E731
    with _client(handler) as c, pytest.raises(JevError, match="no answers"):
        ask("s", client=c)


def test_a_missing_key_says_so_instead_of_failing_obscurely(monkeypatch):
    monkeypatch.delenv("JEV_API_KEY", raising=False)
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)
    with pytest.raises(JevError, match="JEV_API_KEY"):
        ask("s", client=_client(lambda _r: httpx.Response(200, json={})))


def test_interpret_end_to_end(monkeypatch):
    monkeypatch.setenv("JEV_API_KEY", "k")
    handler = lambda _r: httpx.Response(200, json={  # noqa: E731
        "answers": _answers(), "usage": {"input_tokens": 100, "output_tokens": 10}})
    with _client(handler) as c:
        profile, usage, contested = interpret("estado", client=c)
    assert profile.route == "explore_validate"
    assert usage.input_tokens == 100
    assert contested == []


# --- the eval arm ----------------------------------------------------------------------


def test_jev_arm_runs_the_pipeline_and_carries_real_usage(monkeypatch):
    """The trace sees a mocked INTERPRET; the arm must still report the real System One call."""
    from harness.eval.dataset import golden_by_id
    from harness.eval.runner import jev_arm

    monkeypatch.setenv("JEV_API_KEY", "k")
    case = golden_by_id("orden-compra")

    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["state"] = json.loads(request.content)["state"]
        return httpx.Response(200, json={
            "answers": _answers(
                route=_choice(case.expected_route or "explore_validate"),
                challenge_type=_choice(case.expected_challenge_type or "growth"),
            ),
            "usage": {"input_tokens": 700, "output_tokens": 30},
        })

    with _client(handler) as c:
        arm = jev_arm(case, client=c)

    # Jev classified from the same human message the LLM stage would receive.
    assert case.raw_input[:30] in captured["state"]
    assert (arm.tokens_in, arm.tokens_out) == (700, 30)
    assert arm.llm_calls == 1
    assert arm.latency_scope == "end_to_end"
    assert arm.kind in ("route", "confirm", "escalate")
    assert arm.confidence_scores == {"route": 0.9, "unit": 0.9}
    assert arm.unit_confidence == "high"


def test_jev_mode_refuses_to_run_without_keys(monkeypatch):
    """A paid run must fail on a missing key, never fall back to something cheaper."""
    from harness.eval.runner import run_eval

    monkeypatch.delenv("HARNESS_EVAL_LIVE", raising=False)
    with pytest.raises(RuntimeError, match="HARNESS_EVAL_LIVE"):
        run_eval(mode="jev")

    monkeypatch.setenv("HARNESS_EVAL_LIVE", "1")
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    monkeypatch.delenv("JEV_API_KEY", raising=False)
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="JEV_API_KEY"):
        run_eval(mode="jev")


def test_llm_and_jev_arms_share_the_same_state_builder():
    """Both arms must classify from the same string, or the delta is not attributable."""
    from harness.eval.dataset import golden_by_id
    from harness.eval.runner import _interpret_state

    case = golden_by_id("orden-compra")
    state = _interpret_state(case)
    assert state.strip()
    assert case.raw_input[:30] in state


# --- probability vs confidence ---------------------------------------------------------


def test_selected_probability_is_not_the_confidence_statistic():
    """The confusion this separation exists to prevent.

    `probabilities[choice]` is P assigned to the winning option — what RLCD calibrates.
    `confidence` is a statistic DERIVED from the distribution's shape (docs/jev/confidence.md:
    "collapses that shape into a single number"). They are different numbers and only the
    first may ever be shown as "the probability Jev gives this route".
    """
    answers = _answers(route=_choice(
        "explore_validate", confidence=0.64,
        probs={"explore_validate": 0.72, "design_solution": 0.18, "plan_coordinate": 0.10},
    ))
    profile, _ = build_route_profile(answers)

    assert profile.selected_probabilities["route"] == pytest.approx(0.72)
    assert profile.confidence_scores["route"] == pytest.approx(0.64)
    assert profile.selected_probabilities["route"] != profile.confidence_scores["route"]


def test_the_full_distribution_survives_for_later_analysis():
    """Kept so a different measure can be computed without re-calling (and re-paying) Jev."""
    dist = {"explore_validate": 0.72, "design_solution": 0.18, "plan_coordinate": 0.10}
    profile, _ = build_route_profile(_answers(
        route=_choice("explore_validate", 0.64, dist)))

    assert profile.probability_distributions["route"] == dist
    assert sum(profile.probability_distributions["route"].values()) == pytest.approx(1.0)
    # Margin over the runner-up — one of the measures this field makes computable.
    ranked = sorted(profile.probability_distributions["route"].values(), reverse=True)
    assert ranked[0] - ranked[1] == pytest.approx(0.54)


def test_route_and_unit_are_recorded_separately():
    """They can calibrate differently; averaging them would hide that."""
    profile, _ = build_route_profile(_answers(
        route=_choice("explore_validate", 0.9, {"explore_validate": 0.95}),
        unit=_choice("initiative", 0.3, {"initiative": 0.41, "project": 0.39}),
    ))
    assert profile.selected_probabilities["route"] == pytest.approx(0.95)
    assert profile.selected_probabilities["unit"] == pytest.approx(0.41)


def test_the_gate_still_reads_confidence_not_probability():
    """Deliberate: `confidence` is TypeSafe's documented thresholding signal, and locally it
    ordered the 23 route cases correctly (both failures were its two lowest values).
    Switching the gate to probability needs its own evidence, which does not exist yet."""
    low_conf_high_prob = _answers(
        route=_choice("explore_validate", 0.30, {"explore_validate": 0.92}),
        unit=_choice("initiative", 0.30, {"initiative": 0.92}),
    )
    profile, _ = build_route_profile(low_conf_high_prob)
    assert profile.confidence == "low"          # gate fires on the shape statistic
    assert profile.selected_probabilities["route"] == pytest.approx(0.92)
