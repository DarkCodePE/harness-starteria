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
    assert body["trace"]["audit"]["config_version"] == "1.0.0"


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
