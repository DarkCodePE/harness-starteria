"""Golden dataset for the harness A/B eval (ADR-027).

Encodes the methodology's success cases: §26 concretes (ventas, orden de compra,
Excel→Power BI, piloto) and the §21 15-case taxonomy (idea ambigua, solución disfrazada
de objetivo, tarea ligera, proyecto de seis meses, datos contradictorios, readiness bajo,
información sensible, dependencia de TI, …).

Each case carries the *expected* diagnosis plus the deterministic stage fixtures (``ground``
and ``interpret``) that the HARNESS arm replays in hermetic mode — these represent a
correct extraction/interpretation of the raw input, so the eval measures the harness's
routing + gating logic, not the LLM's raw accuracy (that is what live mode measures).

Baseline model: at the diagnostic entry point (a NEW initiative) the caller cannot know the
step, so the naive baseline sends everything to Step 0 → mentor-virtual, never confirms and
never escalates. That is exactly the gap the harness closes; ``baseline_step``/``baseline_action``
are configurable per case but default to that honest naive behavior.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class GoldenCase(BaseModel):
    id: str
    title: str
    raw_input: str

    # Deterministic HARNESS-arm fixtures (replayed instead of calling the LLM).
    ground: list[dict[str, Any]] = Field(default_factory=list)   # GroundedField kwargs
    interpret: dict[str, Any] = Field(default_factory=dict)      # RouteProfile kwargs

    # Naive BASELINE-arm inputs (what a caller would mechanically pass).
    baseline_step: int = 0
    baseline_action: str = "assist"
    baseline_module: str | None = None

    # Expectations.
    expected_kind: Literal["route", "confirm", "escalate"]
    expected_agent: str | None = None       # None for confirm/escalate
    expected_route: str | None = None
    expected_challenge_type: str | None = None
    expected_depth: str | None = None
    expected_horizon: str | None = None
    expected_step: int | None = None
    forbidden_facts: list[str] = Field(default_factory=list)
    notes: str = ""


def _rp(**kw: Any) -> dict[str, Any]:
    base: dict[str, Any] = dict(
        intent="validate", unit="initiative", unit_status="inferred",
        challenge_type="growth", route="explore_validate", depth="standard",
        uncertainty="mixed", horizon="H1", step=1, confidence="high",
    )
    base.update(kw)
    return base


GOLDEN: list[GoldenCase] = [
    # ---- §26 concretes -----------------------------------------------------
    GoldenCase(
        id="ventas-growth",
        title="Aumentar ventas de un producto",
        raw_input="Queremos vender más de nuestro producto estrella este trimestre.",
        # §26 is explicit: "Debe confirmar si busca ingresos, rotación o demanda." The growth
        # objective is present but its LEVER is under-specified and route-determining → confirm,
        # not route. (The live eval surfaced that the model's 'confirm' here matched §26 better
        # than an earlier 'route' label — a dataset correction, cited to §26.)
        ground=[{"key": "objective", "value": "vender más del producto estrella", "status": "declared", "critical": False},
                {"key": "growth_lever", "value": None, "status": "unknown", "critical": True}],
        interpret=_rp(challenge_type="growth", route="explore_validate", horizon="H1", depth="standard", step=1, confidence="low"),
        expected_kind="confirm", expected_agent=None,
        notes="§26: growth, pero debe confirmar si busca ingresos, rotación o demanda antes de enrutar.",
    ),
    GoldenCase(
        id="orden-compra",
        title="Errores en el proceso de orden de compra",
        raw_input="El proceso de órdenes de compra tiene muchos errores y retrasos.",
        ground=[{"key": "objective", "value": "reducir errores en OC", "status": "declared", "critical": True},
                {"key": "baseline", "value": None, "status": "unknown", "critical": False}],
        interpret=_rp(challenge_type="correction", route="explore_validate", depth="systemic", horizon="H1", step=1, confidence="high"),
        expected_kind="route", expected_agent="research-assistant",
        expected_route="explore_validate", expected_challenge_type="correction", expected_depth="systemic", expected_step=1,
        notes="§26: correction H1 systemic explore_validate → process_discovery_iceberg.",
    ),
    GoldenCase(
        id="excel-powerbi-ambiguo",
        title="Migrar reportes de Excel a Power BI",
        raw_input="Queremos pasar nuestros reportes de Excel a Power BI.",
        ground=[{"key": "objective", "value": "migrar reportes a Power BI", "status": "declared", "critical": True},
                {"key": "audience", "value": None, "status": "unknown", "critical": True},
                {"key": "data_governance", "value": None, "status": "unknown", "critical": True}],
        interpret=_rp(challenge_type="exploration", route="design_solution", depth="standard", horizon="unconfirmed", step=2, confidence="low"),
        expected_kind="confirm", expected_agent=None,
        notes="§26: la tecnología no determina la ruta; audiencia/gobernanza desconocidas → confirmar.",
    ),
    GoldenCase(
        id="piloto-reconstruct",
        title="Piloto ya ejecutado",
        raw_input="Ya corrimos un piloto el mes pasado y queremos ordenarlo y documentarlo.",
        ground=[{"key": "objective", "value": "ordenar y documentar un piloto ejecutado", "status": "declared", "critical": True},
                {"key": "evidence", "value": "resultados del piloto", "status": "extracted", "source": "user_declaration"}],
        interpret=_rp(challenge_type="exploration", route="reconstruct_existing", depth="standard", horizon="H1", step=1, confidence="high"),
        expected_kind="route", expected_agent="research-assistant",
        expected_route="reconstruct_existing", expected_step=1,
        notes="§26: reconstruct_existing → source_mapping_gap; no aprobar retroactivamente.",
    ),
    # ---- §21 taxonomy ------------------------------------------------------
    GoldenCase(
        id="idea-ambigua",
        title="Idea ambigua",
        raw_input="Tengo una idea para mejorar cosas en el área.",
        ground=[{"key": "objective", "value": None, "status": "unknown", "critical": True}],
        interpret=_rp(intent="design", challenge_type="exploration", route="explore_validate", horizon="unconfirmed", step=1, confidence="low"),
        expected_kind="confirm", expected_agent=None,
        notes="§21: idea ambigua → objetivo desconocido crítico → confirmar.",
    ),
    GoldenCase(
        id="solucion-disfrazada",
        title="Solución disfrazada de objetivo",
        raw_input="Nuestro objetivo es implementar un chatbot.",
        ground=[{"key": "objective", "value": None, "status": "unknown", "critical": True},
                {"key": "proposed_solution", "value": "chatbot", "status": "declared", "critical": False}],
        interpret=_rp(intent="design", challenge_type="exploration", route="explore_validate", horizon="unconfirmed", step=1, confidence="low"),
        expected_kind="confirm", expected_agent=None,
        notes="§19/§21: una solución no es un objetivo; falta el problema → confirmar.",
    ),
    GoldenCase(
        id="tarea-ligera",
        title="Tarea ligera",
        raw_input="Necesito armar un tablero simple con 3 métricas para el lunes.",
        ground=[{"key": "objective", "value": "tablero con 3 métricas", "status": "declared", "critical": True},
                {"key": "deadline", "value": "lunes", "status": "declared", "critical": False}],
        interpret=_rp(intent="deliver", unit="task", challenge_type="correction", route="lightweight_plan", depth="light", horizon="H1", step=0, confidence="high"),
        expected_kind="route", expected_agent="mentor-virtual",
        expected_route="lightweight_plan", expected_depth="light", expected_step=0,
        notes="§21: no forzar el core completo en una necesidad pequeña.",
    ),
    GoldenCase(
        id="proyecto-6-meses",
        title="Proyecto de seis meses con deadline",
        raw_input="Tenemos un proyecto de 6 meses para coordinar entre 3 áreas con un deadline fijo.",
        ground=[{"key": "objective", "value": "coordinar proyecto multi-área", "status": "declared", "critical": True},
                {"key": "deadline", "value": "6 meses", "status": "declared", "critical": False}],
        interpret=_rp(intent="plan", unit="project", challenge_type="growth", route="plan_coordinate", depth="standard", horizon="H1", step=0, confidence="high"),
        expected_kind="route", expected_agent="mentor-virtual",
        expected_route="plan_coordinate", expected_step=0,
        notes="§21: proyecto con deadline → plan_coordinate → scope_workstreams.",
    ),
    GoldenCase(
        id="datos-contradictorios",
        title="Datos contradictorios",
        raw_input="El owner es Ana según el acta, pero el sistema dice que el owner es Beto.",
        ground=[{"key": "objective", "value": "definir responsable", "status": "declared", "critical": True},
                {"key": "owner", "value": "Ana", "status": "declared", "critical": True},
                {"key": "owner", "value": "Beto", "status": "extracted", "source": "system", "critical": True}],
        interpret=_rp(intent="decide", challenge_type="correction", route="explore_validate", horizon="H1", step=1, confidence="high"),
        expected_kind="confirm", expected_agent=None,
        notes="§4/§14: contradicción → no resolver en silencio; confirmar con actor autorizado.",
    ),
    GoldenCase(
        id="readiness-bajo",
        title="Implementación decidida con readiness bajo",
        raw_input="Ya elegimos la solución, queremos implementarla aunque el equipo aún no está listo.",
        ground=[{"key": "objective", "value": "implementar solución elegida", "status": "declared", "critical": True},
                {"key": "baseline", "value": "readiness bajo", "status": "inferred", "critical": False}],
        interpret=_rp(intent="implement", challenge_type="growth", route="implement_handoff", depth="standard", horizon="H1", step=3, confidence="high"),
        expected_kind="route", expected_agent="experiment-coach",
        expected_route="implement_handoff", expected_step=3,
        notes="§21: readiness bajo → implement_handoff → readiness_roadmap (con soft gate baseline).",
    ),
    GoldenCase(
        id="info-sensible",
        title="Información sensible / línea roja",
        raw_input="Queremos cruzar datos personales de clientes con la base de RRHH.",
        ground=[{"key": "objective", "value": "cruce de datos personales", "status": "declared", "critical": True},
                {"key": "sensitive", "value": True, "status": "declared", "critical": True}],
        interpret=_rp(intent="decide", challenge_type="exploration", route="explore_validate", horizon="H1", step=1, confidence="high"),
        expected_kind="escalate", expected_agent=None,
        notes="§19: información sensible → línea roja → escalate a rol autorizado.",
    ),
    GoldenCase(
        id="dependencia-ti",
        title="Dependencia de TI",
        raw_input="Para reducir el tiempo de cierre necesitamos que TI exponga un API del ERP.",
        ground=[{"key": "objective", "value": "reducir tiempo de cierre", "status": "declared", "critical": True},
                {"key": "constraints", "value": "depende de un API de TI", "status": "declared", "critical": False}],
        interpret=_rp(intent="validate", challenge_type="correction", route="explore_validate", depth="standard", horizon="H1", step=1, confidence="high"),
        expected_kind="route", expected_agent="research-assistant",
        expected_route="explore_validate", expected_challenge_type="correction", expected_step=1,
        notes="§21: dependencia de TI es una restricción, no cambia la ruta base.",
    ),
]


def golden_by_id(case_id: str) -> GoldenCase:
    case = next((c for c in GOLDEN if c.id == case_id), None)
    if case is None:
        raise KeyError(f"Unknown golden case {case_id!r}")
    return case
