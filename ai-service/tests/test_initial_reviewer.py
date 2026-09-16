"""Tests for the initial-review chain + endpoint (ADR-025 / PRD §25, CC-01).

Hermetic: the LLM chain is never built — `routers.ai.generate_initial_review`
is monkeypatched so no OpenRouter call is made. Locks:
  - POST /api/v1/ai/initial-review returns the FLAT structured shape on success
    (no {data} wrapper — the Express bridge reads top-level fields)
  - upstream failure surfaces as 503 (backend then falls back to the mock)
  - wrong X-Internal-Token is 401 when AI_SERVICE_INTERNAL_TOKEN is set
  - format_company_context: labels inferred entries, clips oversized context,
    and never crashes on junk input
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from agents.initial_reviewer import (
    InitialReviewCritique,
    InitialReviewOutput,
    InitialReviewProposal,
    InitialReviewQuestion,
    _MAX_COMPANY_CONTEXT_CHARS,
    format_company_context,
)


def _canned_output() -> InitialReviewOutput:
    return InitialReviewOutput(
        understandingSummary="Quieres ordenar la gestión de proyectos simultáneos.",
        suggestedChallengeType="correction",
        challengeTypeReason="Hay un proceso existente que falla.",
        informationReadiness="low",
        critique=InitialReviewCritique(
            solid="El problema está identificado.",
            weak="No hay métricas del impacto actual.",
            risky="Se asume que la causa es la herramienta.",
            recommendedAdjustment="Medir el retrabajo actual antes de elegir solución.",
            mainRisk="Invertir en una solución sin evidencia de la causa.",
            missingEvidence=["Métricas de retrabajo", "Frecuencia del problema"],
        ),
        strategicQuestions=[
            InitialReviewQuestion(id="q1", question="¿Con qué frecuencia ocurre?", options=["Diario", "Semanal", "Mensual"]),
        ],
        improvedProposal=InitialReviewProposal(
            suggestedName="Ordenar gestión de proyectos",
            improvedDescription="Reducir el retrabajo por descoordinación entre áreas.",
            initialFocus="Mapear el flujo actual y sus quiebres.",
            expectedImpact="Hipótesis: reducir retrabajo si se centraliza el seguimiento.",
            nextRecommendedStep="Completar el Paso 0 con evidencia del problema.",
        ),
    )


@pytest.mark.unit
def test_initial_review_returns_flat_structured_shape(client: TestClient, monkeypatch) -> None:
    def fake_generate(original_input, added_context=None, company_context=None, focus_section=None):
        assert original_input == "Necesito ordenar mis proyectos"
        assert company_context and company_context["company"]["name"] == "Acme"
        return _canned_output()

    monkeypatch.setattr("routers.ai.generate_initial_review", fake_generate)

    res = client.post(
        "/api/v1/ai/initial-review",
        json={
            "originalInput": "Necesito ordenar mis proyectos",
            "addedContext": ["Somos 3 áreas"],
            "companyContext": {"company": {"name": "Acme"}},
        },
    )

    assert res.status_code == 200, res.text
    body = res.json()
    # Flat contract: top-level fields, no {data} wrapper, no routePreview.
    assert "data" not in body
    assert "routePreview" not in body
    assert body["understandingSummary"].startswith("Quieres")
    assert body["suggestedChallengeType"] == "correction"
    assert body["informationReadiness"] == "low"
    assert body["critique"]["missingEvidence"] == ["Métricas de retrabajo", "Frecuencia del problema"]
    assert len(body["strategicQuestions"]) == 1
    assert body["improvedProposal"]["suggestedName"]
    assert body["model"]


@pytest.mark.unit
def test_initial_review_upstream_failure_is_503(client: TestClient, monkeypatch) -> None:
    def boom(*_args, **_kwargs):
        raise RuntimeError("OPENROUTER_API_KEY not set.")

    monkeypatch.setattr("routers.ai.generate_initial_review", boom)

    res = client.post("/api/v1/ai/initial-review", json={"originalInput": "algo"})
    assert res.status_code == 503, res.text
    assert res.json()["detail"]["code"] == "SERVICE_UNAVAILABLE"


@pytest.mark.unit
def test_initial_review_wrong_token_is_401(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("AI_SERVICE_INTERNAL_TOKEN", "expected-secret")
    monkeypatch.setattr("routers.ai.generate_initial_review", lambda *a, **k: _canned_output())

    res = client.post(
        "/api/v1/ai/initial-review",
        json={"originalInput": "algo"},
        headers={"X-Internal-Token": "wrong"},
    )
    assert res.status_code == 401, res.text


@pytest.mark.unit
def test_initial_review_validates_input(client: TestClient) -> None:
    res = client.post("/api/v1/ai/initial-review", json={"originalInput": ""})
    assert res.status_code == 422


@pytest.mark.unit
def test_format_company_context_labels_inferred_and_confirmed() -> None:
    text = format_company_context(
        {
            "company": {"name": "Acme", "sector": "Salud", "country": "PE"},
            "area": {"name": "Operaciones", "description": "Gestión de citas"},
            "contextLevelLabel": "Contexto parcial",
            "missing": ["POLICIES"],
            "confirmedInformation": [
                {"dimension": "IDENTITY", "fieldKey": "mission", "value": "Atender rápido"},
            ],
            "inferredInformation": [
                {"dimension": "STRUCTURE", "fieldKey": "teams", "value": "3 equipos"},
            ],
        }
    )
    assert "Empresa: Acme · Salud · PE" in text
    assert "Área del usuario: Operaciones" in text
    assert "Contexto parcial" in text
    assert "POLICIES" in text
    assert "[IDENTITY] mission: Atender rápido" in text
    assert "(inferido) [STRUCTURE] teams: 3 equipos" in text


@pytest.mark.unit
def test_format_company_context_clips_oversized_input() -> None:
    huge = {
        "company": {"name": "Acme"},
        "confirmedInformation": [
            {"dimension": "IDENTITY", "fieldKey": f"k{i}", "value": "x" * 500} for i in range(100)
        ],
    }
    text = format_company_context(huge)
    assert len(text) <= _MAX_COMPANY_CONTEXT_CHARS + len("\n[contexto truncado]")
    assert text.endswith("[contexto truncado]")


@pytest.mark.unit
@pytest.mark.parametrize("junk", [None, {}, {"company": None}, {"confirmedInformation": "not-a-list"}, {"missing": 42}])
def test_format_company_context_never_crashes_on_junk(junk) -> None:
    assert isinstance(format_company_context(junk), str)


@pytest.mark.unit
def test_initial_review_forwards_focus_section(client: TestClient, monkeypatch) -> None:
    """ADR-026 v2: el endpoint reenvía focusSection a generate_initial_review."""
    seen = {}

    def fake_generate(original_input, added_context=None, company_context=None, focus_section=None):
        seen["focus"] = focus_section
        return _canned_output()

    monkeypatch.setattr("routers.ai.generate_initial_review", fake_generate)
    resp = client.post("/api/v1/ai/initial-review", json={"originalInput": "Necesito ordenar mis proyectos", "focusSection": "critique"})
    assert resp.status_code == 200
    assert seen["focus"] == "critique"
