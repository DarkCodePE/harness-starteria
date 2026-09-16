"""Tests for the public field-refinement chain + endpoint (ADR-006 / ADR-016).

Hermetic: the LLM chain is never built — `routers.ai.refine_field` is
monkeypatched so no OpenRouter call is made. Locks:
  - POST /api/v1/ai/refine-field returns the structured shape on success
  - upstream failure surfaces as 503 (frontend then falls back to heuristic)
  - _format_context drops empty/non-scalar values and never crashes
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from agents.field_refiner import FieldRefinement, _format_context


@pytest.mark.unit
def test_refine_field_returns_structured_shape(client: TestClient, monkeypatch) -> None:
    def fake_refine(field, current_value, draft_context=None):
        assert field == "whatToMove"
        return FieldRefinement(
            suggestedValue="Ordenar la gestión de proyectos simultáneos entre áreas.",
            rationale="Más concreto y accionable.",
            confidence=0.82,
        )

    monkeypatch.setattr("routers.ai.refine_field", fake_refine)

    res = client.post(
        "/api/v1/ai/refine-field",
        json={
            "field": "whatToMove",
            "currentValue": "ordenar proyectos",
            "draftContext": {"suggestedChallengeType": "correction"},
        },
    )

    assert res.status_code == 200, res.text
    body = res.json()
    assert body["suggestedValue"].startswith("Ordenar")
    assert body["rationale"]
    assert 0.0 <= body["confidence"] <= 1.0


@pytest.mark.unit
def test_refine_field_upstream_failure_is_503(client: TestClient, monkeypatch) -> None:
    def boom(*_args, **_kwargs):
        raise RuntimeError("OPENROUTER_API_KEY not set.")

    monkeypatch.setattr("routers.ai.refine_field", boom)

    res = client.post(
        "/api/v1/ai/refine-field",
        json={"field": "whyNow", "currentValue": "", "draftContext": None},
    )
    assert res.status_code == 503, res.text


@pytest.mark.unit
def test_refine_field_validation_rejects_empty_field(client: TestClient) -> None:
    res = client.post(
        "/api/v1/ai/refine-field",
        json={"field": "", "currentValue": "x"},
    )
    assert res.status_code == 422, res.text


@pytest.mark.unit
def test_format_context_drops_empty_and_nonscalar() -> None:
    out = _format_context(
        {"a": "hola", "b": "", "c": None, "d": 3, "e": {"nested": 1}, "f": "  "}
    )
    assert "a: hola" in out
    assert "d: 3" in out
    assert "b:" not in out
    assert "nested" not in out
    assert _format_context(None) == "(sin contexto adicional)"
    assert _format_context({}) == "(sin contexto adicional)"
