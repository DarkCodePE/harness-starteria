"""Integration tests: /ai/diagnose endpoint + invoke_harnessed (ADR-027).

Hermetic: the LLM stage call is monkeypatched so the REAL pipeline + endpoint run without
network. Verifies the harness is wired into the router and the orchestrator.
"""

import pytest

from harness.contracts import (
    ConfirmationRequest,
    EpistemicStatus as E,
    GateVerdict,
    GroundedField,
    GroundedFieldList,
    RouteProfile,
)
from harness.trace import HarnessDecision, HarnessTrace
from schemas.requests import InvokeRequest

pytestmark = pytest.mark.unit


def _patch_stage_call(monkeypatch, ground_fields, **profile):
    monkeypatch.setenv("HARNESS_INTERPRET_BACKEND", "llm")
    base = dict(intent="validate", unit="initiative", challenge_type="growth",
                route="explore_validate", depth="standard", step=1, confidence="high")
    base.update(profile)

    def fake(system, human, model_cls, *, mock=None):
        if model_cls is GroundedFieldList:
            return GroundedFieldList(fields=ground_fields)
        if model_cls is RouteProfile:
            return RouteProfile(**base)
        raise AssertionError(f"unexpected model_cls {model_cls}")

    # Reset the harness singleton so a fresh one is built under the patch.
    import harness.harness as hmod
    hmod._instance = None
    monkeypatch.setattr("harness.stages.llm_stages.stage_structured_call", fake)


def test_diagnose_route_case(client, monkeypatch):
    _patch_stage_call(
        monkeypatch,
        [GroundedField(key="objective", value="aumentar ventas", status=E.DECLARED, critical=True)],
        challenge_type="growth", route="explore_validate", step=1, confidence="high",
    )
    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": "Queremos vender más"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["kind"] == "route"
    assert body["target_agent"] == "research-assistant"
    assert body["method_pack_id"] == "qualitative_research"
    assert body["trace"]["audit"]["config_version"] == "1.1.0"


def test_diagnose_confirm_case(client, monkeypatch):
    _patch_stage_call(
        monkeypatch,
        [GroundedField(key="audience", value=None, status=E.UNKNOWN, critical=True)],
        route="design_solution", step=2, confidence="low",
    )
    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": "Pasar de Excel a Power BI"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["kind"] == "confirm"
    assert body["target_agent"] is None
    assert len(body["confirmation"]["strategic_questions"]) <= 3


def test_diagnose_uses_jev_for_interpret_by_default(client, monkeypatch):
    from harness.llm import TokenUsage

    monkeypatch.delenv("HARNESS_INTERPRET_BACKEND", raising=False)
    monkeypatch.setenv("JEV_API_KEY", "test-key")
    seen = {}

    def fake_stage(system, human, model_cls, *, mock=None):
        assert model_cls is GroundedFieldList
        return GroundedFieldList(fields=[GroundedField(
            key="objective", value="mejorar ventas", status=E.DECLARED, critical=True)])

    def fake_jev(state, *, model):
        seen.update(state=state, model=model)
        return (RouteProfile(
            intent="validate", unit="initiative", challenge_type="growth",
            route="explore_validate", depth="standard", step=1,
            confidence="high", unit_confidence="low",
            confidence_scores={"route": 0.95, "unit": 0.20},
        ), TokenUsage(model_id=model, input_tokens=120, output_tokens=8, provider="typesafe"), [])

    monkeypatch.setattr("harness.stages.llm_stages.stage_structured_call", fake_stage)
    monkeypatch.setattr("harness.jev.interpret", fake_jev)
    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": "Mejorar ventas"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["kind"] == "confirm"
    assert body["route_profile"]["confidence_scores"] == {"route": 0.95, "unit": 0.20}
    assert body["trace"]["audit"]["model_provider"] == "openrouter+typesafe"
    interpret = next(s for s in body["trace"]["stages"] if s["stage"] == "interpret")
    assert (interpret["model_provider"], interpret["model_id"]) == ("typesafe", "jev-latest")
    assert (interpret["tokens_in"], interpret["tokens_out"]) == (120, 8)
    assert seen["model"] == "jev-latest"
    assert "Mejorar ventas" in seen["state"]


def test_diagnose_falls_open_to_llm_without_jev_key(client, monkeypatch):
    """Without a Jev key the diagnosis DEGRADES; it does not 503.

    This replaces `test_diagnose_fails_closed_without_jev_key`. That test encoded a real
    trade-off: abort early so the paid GROUND stage is not spent on a run that cannot
    finish. Once INTERPRET can fall back to the LLM backend the run DOES finish, so that
    spend buys a complete diagnosis — and an unreachable third party stops being able to
    take the endpoint down. GROUND is expected to run here, which is the point.
    """
    monkeypatch.delenv("HARNESS_INTERPRET_BACKEND", raising=False)
    monkeypatch.delenv("JEV_API_KEY", raising=False)
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)

    profile = dict(intent="validate", unit="initiative", unit_status="inferred",
                   challenge_type="growth", route="explore_validate", depth="standard",
                   step=1, confidence="high")

    def llm_stub(_system, _human, model_cls, **kw):
        if kw.get("mock"):
            return kw["mock"]()
        if model_cls is GroundedFieldList:
            return GroundedFieldList(fields=[GroundedField(
                key="objective", value="mejorar ventas", status=E.DECLARED,
                source="user_declaration", critical=True)])
        return model_cls(**profile)

    monkeypatch.setattr("harness.stages.llm_stages.stage_structured_call", llm_stub)

    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": "Mejorar ventas"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["kind"] in ("route", "confirm", "escalate")
    # The audit trail must not claim Jev classified this run.
    assert "+typesafe:" not in body["trace"]["audit"]["model_id"]


def test_invalid_interpret_backend_fails_without_provider_call(client, monkeypatch):
    monkeypatch.setenv("HARNESS_INTERPRET_BACKEND", "invalid")
    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": "Mejorar ventas"})
    assert resp.status_code == 503
    assert "HARNESS_INTERPRET_BACKEND" in resp.json()["detail"]["error"]


def test_jev_profile_with_unit_ambiguity_confirms_even_when_route_is_high():
    from harness.harness import get_harness

    profile = RouteProfile(
        intent="validate", unit="initiative", challenge_type="growth",
        route="explore_validate", depth="standard", step=1,
        confidence="high", unit_confidence="low",
        confidence_scores={"route": 0.95, "unit": 0.20},
    )
    decision = get_harness().diagnose(
        {"payload": {"originalInput": "Mejorar ventas"}},
        raw_input="Mejorar ventas",
        mocks={
            "ground": lambda: GroundedFieldList(fields=[GroundedField(
                key="objective", value="mejorar ventas", status=E.DECLARED, critical=True)]),
            "interpret": lambda: profile,
        },
    )
    assert decision.kind == "confirm"
    assert decision.target_agent is None
    assert decision.route_profile.confidence == "high"
    assert decision.route_profile.unit_confidence == "low"
    assert "ambiguous_classification" in decision.gate.failed_hard_gates
    assert any("unidad de trabajo" in q for q in decision.confirmation.strategic_questions)


def test_diagnose_requires_token_when_configured(client, monkeypatch):
    monkeypatch.setenv("AI_SERVICE_INTERNAL_TOKEN", "secret-token")
    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": "algo"},
                       headers={"X-Internal-Token": "wrong"})
    assert resp.status_code == 401


def test_diagnose_empty_input_422(client):
    resp = client.post("/api/v1/ai/diagnose", json={"originalInput": ""})
    assert resp.status_code == 422


async def test_invoke_harnessed_confirm_skips_step_agent(monkeypatch):
    """A confirm decision must NOT invoke a Step agent (cost saved)."""
    import agents.orchestrator as orch

    decision = HarnessDecision(
        kind="confirm",
        gate=GateVerdict(action="RequireConfirmation"),
        confirmation=ConfirmationRequest(understood_goal="x"),
        trace=HarnessTrace(),
    )

    class _FakeHarness:
        ground_model_ref = "openrouter:deepseek/deepseek-v4-flash"
        interpret_model_ref = "typesafe:jev-latest"

        def diagnose(self, *a, **k):
            return decision

        def _model_id(self):
            return "deepseek/deepseek-v4-flash"

    monkeypatch.setattr("harness.harness.get_harness", lambda: _FakeHarness())

    def _boom(self, request):
        raise AssertionError("step agent must not be invoked on a confirm decision")

    monkeypatch.setattr(orch.OrchestratorAgent, "_run_deepagent", _boom)

    agent = orch.OrchestratorAgent.__new__(orch.OrchestratorAgent)  # skip heavy __init__
    req = InvokeRequest(step=0, action="assist", mode="harness",
                        payload={"projectId": "p1", "originalInput": "algo"})
    resp = await agent.invoke_harnessed(req)
    assert resp.agent == "methodology-harness"
    assert resp.data["kind"] == "confirm"


async def test_invoke_harnessed_propagates_cost_error(monkeypatch):
    import agents.orchestrator as orch
    from services.cost_tracker import CostLimitExceededError

    def _raise(*a, **k):
        raise CostLimitExceededError("budget exhausted")

    monkeypatch.setattr(orch._cost_tracker, "check_project_daily_budget", _raise)
    agent = orch.OrchestratorAgent.__new__(orch.OrchestratorAgent)
    req = InvokeRequest(step=0, action="assist", mode="harness",
                        payload={"projectId": "p1", "originalInput": "algo"})
    with pytest.raises(CostLimitExceededError):
        await agent.invoke_harnessed(req)
