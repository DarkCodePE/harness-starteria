"""System One (Jev) backend for the INTERPRET stage (ADR-031).

INTERPRET produces a RouteProfile whose 9 classification fields are closed enums. This
module asks Jev those 9 questions against the same state the LLM receives, and assembles
the same contract. The harness uses it by default; `harness/eval/` retains its comparison arm.

Two deliberate choices, both about keeping the experiment interpretable:

1. `route` is ASKED, not derived. Deriving it from intent/unit/challenge_type is a better
   design (see docs/analisis-jev/01) but it is a DIFFERENT change. Bundling both into one
   arm would make a delta impossible to attribute.
2. `rationale` and `conditions_that_would_change` are derived from the answers themselves —
   no second model call. What fired, and how close the runner-up was, IS the reason.

The criteria below are lifted verbatim from `config/prompts/interpret.system.md` wherever
the methodology defines a dimension. It does NOT define `intent` or `unit` — the prompt only
lists their labels — so those glosses were written here. That gap is real: today the LLM is
inferring them from the label alone.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

from harness.contracts import RouteProfile
from harness.llm import TokenUsage

logger = logging.getLogger(__name__)

_API_URL = "https://api.typesafe.ai/v1/systemone"
_DEFAULT_MODEL = "jev-latest"
_TIMEOUT_S = 30.0

# Unvalidated defaults. E4 (labelled cases) + E5 (a live run) are what turn these into
# calibrated numbers; until then they are a starting point, not a finding.
_CONFIDENCE_HIGH = 0.75
_CONFIDENCE_MEDIUM = 0.50
# Two options within this margin means the classification was close, which is what
# `conditions_that_would_change` is supposed to report.
_CONTESTED_MARGIN = 0.15


class JevError(RuntimeError):
    """A Jev call failed or returned something the contract cannot use."""


# --- The 9 questions -------------------------------------------------------------------

# NOT defined by the methodology prompt; written here so Jev has criteria at all.
_INTENT_CRITERIA = {
    "decide": "Necesita tomar una decisión de continuidad, inversión o cierre",
    "validate": "Necesita generar evidencia para saber si algo funciona",
    "design": "Necesita diseñar o definir una solución que todavía no está definida",
    "implement": "Necesita ejecutar o implementar algo que ya fue decidido",
    "deliver": "Necesita entregar o poner en producción un resultado",
    "plan": "Necesita planificar o coordinar trabajo con plazos",
    "present": "Necesita presentar o comunicar estado a terceros",
    "manage_portfolio": "Necesita mirar el conjunto de iniciativas, no una sola",
}

_UNIT_CRITERIA = {
    "task": "Una tarea puntual",
    "initiative": "Una iniciativa: una respuesta concreta a un problema de negocio",
    "project": "Un proyecto con alcance y plazo definidos",
    "challenge": "Un reto: un espacio de intervención que agrupa varias respuestas",
    "strategic_objective": "Una prioridad estratégica o resultado de negocio a mover",
    "program": "Un programa que coordina varios proyectos",
    "portfolio": "El portafolio completo de iniciativas",
}

# `confirmed`, `declared` and `extracted` are EXCLUDED on purpose: epistemic.py guarantees
# CONFIRMED only ever arrives through an authorized human action, and a model that can emit
# it walks in through the back door.
_UNIT_STATUS_CRITERIA = {
    "inferred": "La unidad fue inferida por el sistema (caso normal)",
    "suggested": "La unidad fue sugerida pero no confirmada",
    "conflicting": "Hay información contradictoria sobre cuál es la unidad",
    "unknown": "No hay información suficiente para determinar la unidad",
}

INTERPRET_QUESTIONS: dict[str, dict[str, Any]] = {
    "intent": {
        "type": "choice",
        "instructions": "Qué intención de negocio tiene este pedido",
        "criteria": _INTENT_CRITERIA,
    },
    "unit": {
        "type": "choice",
        "instructions": "Sobre qué unidad organizativa opera este pedido",
        "criteria": _UNIT_CRITERIA,
    },
    "unit_status": {
        "type": "choice",
        "instructions": "Qué estatus epistémico tiene la unidad identificada",
        "criteria": _UNIT_STATUS_CRITERIA,
    },
    "challenge_type": {
        "type": "choice",
        "instructions": "Qué tipo de reto es",
        "criteria": {
            "correction": "Arreglar algo roto",
            "growth": "Escalar algo que funciona",
            "exploration": "Reducir incertidumbre",
        },
    },
    "route": {
        "type": "choice",
        "instructions": "Qué ruta metodológica corresponde. La TECNOLOGÍA no determina la ruta",
        "criteria": {
            "explore_validate": "Necesita evidencia",
            "design_solution": "Está definido, falta diseñar",
            "implement_handoff": "Solución elegida, falta readiness o adopción",
            "plan_coordinate": "Proyecto con deadline",
            "reconstruct_existing": "Algo ya ejecutado que se reconstruye",
            "lightweight_plan": "Necesidad pequeña",
        },
    },
    "depth": {
        "type": "score",
        "instructions": "Qué profundidad metodológica corresponde, proporcional al riesgo y la incertidumbre",
        "criteria": [
            "light — riesgo e incertidumbre bajos",
            "standard — riesgo o incertidumbre moderados",
            "systemic — riesgo alto o incertidumbre sistémica",
        ],
    },
    "uncertainty": {
        "type": "choice",
        "instructions": "Qué tipo de incertidumbre domina",
        "criteria": {
            "algorithmic": "Problema conocido",
            "mystery": "Alta incertidumbre causal",
            "mixed": "Una mezcla de ambos",
        },
    },
    "horizon": {
        "type": "choice",
        "instructions": "Qué horizonte estratégico corresponde",
        "criteria": {
            "H1": "Negocio actual, retorno cercano",
            "H2": "Expansión de lo existente, retorno medio",
            "H3": "Apuesta exploratoria, retorno lejano",
            "unconfirmed": "No hay contexto corporativo suficiente para determinarlo (§10.5)",
        },
    },
    "step": {
        "type": "score",
        "instructions": "Qué paso metodológico corresponde a la ruta",
        "criteria": [
            "Step 0 — enmarcar el ciclo",
            "Step 1 — establecer verdad y foco",
            "Step 2 — diseñar o preparar lo ejecutable",
            "Step 3 — ejecutar, observar y aprender",
            "Step 4 — cerrar el ciclo y preparar decisión",
        ],
    },
}

_DEPTH_LEVELS = ("light", "standard", "systemic")


# --- Answer → contract -----------------------------------------------------------------


def _choice(answers: dict[str, Any], key: str) -> tuple[str, float, dict[str, float]]:
    a = answers.get(key)
    if not isinstance(a, dict) or "choice" not in a:
        raise JevError(f"Jev returned no usable choice for {key!r}: {a!r}")
    probs = a.get("probabilities") or {}
    return a["choice"], float(a.get("confidence") or 0.0), probs


def _score_index(answers: dict[str, Any], key: str, levels: int) -> tuple[int, float]:
    a = answers.get(key)
    if not isinstance(a, dict) or "score" not in a:
        raise JevError(f"Jev returned no usable score for {key!r}: {a!r}")
    idx = round(float(a["score"]))
    return max(0, min(levels - 1, idx)), float(a.get("confidence") or 0.0)


def _confidence_label(score: float) -> str:
    """Map one Jev confidence statistic to a label; this is not P(correct)."""
    if score >= _CONFIDENCE_HIGH:
        return "high"
    if score >= _CONFIDENCE_MEDIUM:
        return "medium"
    return "low"


def _contested(probs: dict[str, float], chosen: str) -> str | None:
    """The runner-up, when it was close enough to have plausibly won."""
    others = sorted(
        ((k, v) for k, v in probs.items() if k != chosen), key=lambda kv: kv[1], reverse=True
    )
    if not others:
        return None
    top_p = float(probs.get(chosen) or 0.0)
    name, p = others[0]
    return name if (top_p - float(p)) <= _CONTESTED_MARGIN else None


def build_route_profile(answers: dict[str, Any]) -> tuple[RouteProfile, list[str]]:
    """Assemble a RouteProfile from Jev's answers. Returns (profile, contested dimensions)."""
    intent, _, intent_p = _choice(answers, "intent")
    unit, unit_conf, unit_p = _choice(answers, "unit")
    unit_status, _, _ = _choice(answers, "unit_status")
    challenge_type, _, ct_p = _choice(answers, "challenge_type")
    route, route_conf, route_p = _choice(answers, "route")
    uncertainty, _, _ = _choice(answers, "uncertainty")
    horizon, _, _ = _choice(answers, "horizon")
    depth_idx, _ = _score_index(answers, "depth", len(_DEPTH_LEVELS))
    step_idx, _ = _score_index(answers, "step", 5)

    rationale = [
        f"{name}={value} (p={float(probs.get(value) or 0.0):.2f})"
        for name, value, probs in (
            ("intent", intent, intent_p),
            ("unit", unit, unit_p),
            ("challenge_type", challenge_type, ct_p),
            ("route", route, route_p),
        )
    ]

    contested: list[str] = []
    conditions: list[str] = []
    for name, value, probs in (
        ("intent", intent, intent_p),
        ("unit", unit, unit_p),
        ("challenge_type", challenge_type, ct_p),
        ("route", route, route_p),
    ):
        runner_up = _contested(probs, value)
        if runner_up:
            contested.append(name)
            conditions.append(f"{name} podría ser {runner_up} en vez de {value}")

    profile = RouteProfile(
        intent=intent,
        unit=unit,
        unit_status=unit_status,
        challenge_type=challenge_type,
        route=route,
        depth=_DEPTH_LEVELS[depth_idx],
        uncertainty=uncertainty,
        horizon=horizon,
        step=step_idx,
        confidence=_confidence_label(route_conf),
        unit_confidence=_confidence_label(unit_conf),
        # P of the winning option — what RLCD calibrates, and what a user should be shown.
        selected_probabilities={
            "route": float(route_p.get(route) or 0.0),
            "unit": float(unit_p.get(unit) or 0.0),
        },
        # The shape statistic the gate thresholds on. Not P(correct).
        confidence_scores={"route": route_conf, "unit": unit_conf},
        probability_distributions={"route": dict(route_p), "unit": dict(unit_p)},
        rationale=rationale,
        conditions_that_would_change=conditions,
    )
    return profile, contested


# --- Client ----------------------------------------------------------------------------


def _api_key() -> str:
    key = os.getenv("JEV_API_KEY") or os.getenv("TYPESAFE_API_KEY")
    if not key:
        raise JevError(
            "Jev needs JEV_API_KEY (or TYPESAFE_API_KEY). Set it in the environment or .env."
        )
    return key


def require_api_key() -> None:
    """Fail before the paid GROUND stage when Jev cannot be called."""
    _api_key()


def ask(
    state: str,
    questions: dict[str, Any] | None = None,
    *,
    model: str = _DEFAULT_MODEL,
    client: httpx.Client | None = None,
) -> tuple[dict[str, Any], TokenUsage]:
    """One System One call. Returns (answers, usage)."""
    payload = {"state": state, "model": model, "questions": questions or INTERPRET_QUESTIONS}
    owned = client is None
    http = client or httpx.Client(timeout=_TIMEOUT_S)
    try:
        response = http.post(
            _API_URL,
            headers={"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"},
            content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        )
    finally:
        if owned:
            http.close()

    if response.status_code != 200:
        raise JevError(f"Jev returned HTTP {response.status_code}: {response.text[:300]}")
    body = response.json()
    answers = body.get("answers")
    if not isinstance(answers, dict):
        raise JevError(f"Jev response had no answers map: {str(body)[:300]}")

    raw_usage = body.get("usage") or {}
    usage = TokenUsage(
        model_id=body.get("model") or model,
        input_tokens=raw_usage.get("input_tokens"),
        output_tokens=raw_usage.get("output_tokens"),
        provider="typesafe",
    )
    return answers, usage


def interpret(
    state: str, *, model: str = _DEFAULT_MODEL, client: httpx.Client | None = None
) -> tuple[RouteProfile, TokenUsage, list[str]]:
    """Run the INTERPRET classification through Jev. Returns (profile, usage, contested)."""
    answers, usage = ask(state, INTERPRET_QUESTIONS, model=model, client=client)
    profile, contested = build_route_profile(answers)
    if contested:
        logger.info("jev_interpret contested dimensions: %s", ", ".join(contested))
    return profile, usage, contested
