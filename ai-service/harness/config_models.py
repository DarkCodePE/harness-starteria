"""Typed models mirroring `config/methodology.yaml` (ADR-027).

Loading the methodology as typed models (not a raw dict) means drift or typos in
the YAML fail loudly at startup instead of silently misrouting. This is the
"configuración, no prompts monolíticos" requirement: all methodology knowledge is
data, validated at the boundary.

Gate conditions are expressed as *named structured predicates* (predicate + params),
NOT free-text expressions — a fixed predicate registry (see gates.py) is evaluated,
so config can never inject executable code (no eval()).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ModelConfig(BaseModel):
    stage_model: str = "openrouter:deepseek/deepseek-v4-flash"
    interpret_backend: Literal["jev", "llm"] = "jev"
    jev_model: str = "jev-latest"
    temperature: float = 0.2
    max_tokens: int = 4000


class PromotionRule(BaseModel):
    promotable_from: list[str] = Field(default_factory=lambda: ["inferred", "suggested", "conflicting"])
    promotable_to: str = "confirmed"
    requires_human_action: bool = True


class EpistemicConfig(BaseModel):
    statuses: list[str] = Field(default_factory=list)
    promotion_rule: PromotionRule = Field(default_factory=PromotionRule)
    authority_hierarchy: list[str] = Field(default_factory=list)


class StageConfig(BaseModel):
    id: str
    prompt: str | None = None            # relative path under config/ for LLM stages
    output_contract: str | None = None   # name of the Pydantic contract the stage emits


class GateThresholds(BaseModel):
    review: float = 0.34
    confirm: float = 0.60
    block: float = 0.85


class GateRule(BaseModel):
    """A single gate condition (§14).

    ``predicate`` names a function in the gates.py PREDICATES registry; the optional
    ``field``/``value``/``values`` are its parameters. ``weight`` contributes to the
    additive risk score (used for the Review threshold + reporting). ``severity``
    (hard gates only) is categorical: ``confirm`` forces ≥RequireConfirmation,
    ``block`` forces Block/escalate — so a hard gate's action does NOT depend on how
    many other gates stacked.
    """

    id: str
    predicate: str
    weight: float = 0.5
    severity: Literal["confirm", "block"] = "confirm"
    field: str | None = None
    value: str | None = None
    values: list[str] = Field(default_factory=list)
    message: str | None = None


class GatesConfig(BaseModel):
    thresholds: GateThresholds = Field(default_factory=GateThresholds)
    hard: list[GateRule] = Field(default_factory=list)
    soft: list[GateRule] = Field(default_factory=list)
    prohibited_terms: list[str] = Field(default_factory=list)
    max_strategic_questions: int = 3


class RoutingTarget(BaseModel):
    step: int = Field(..., ge=0, le=4)
    agent: str
    method_pack: str


class RoutingRule(BaseModel):
    """Match partial RouteProfile dimensions → a routing target.

    Each key in ``match`` is a RouteProfile field; the value is either a scalar or a
    list of acceptable scalars. A rule matches when ALL its keys match. Rules are
    evaluated in order; the first match wins, else ``routing_table.default``.
    """

    match: dict[str, object] = Field(default_factory=dict)
    step: int = Field(..., ge=0, le=4)
    agent: str
    method_pack: str


class RoutingTable(BaseModel):
    rules: list[RoutingRule] = Field(default_factory=list)
    default: RoutingTarget


class MethodPack(BaseModel):
    """§11.3 method_pack contract (subset persisted here)."""

    version: str = "1.0"
    applicable_routes: list[str] = Field(default_factory=list)
    applicable_steps: list[int] = Field(default_factory=list)
    required_evidence: list[str] = Field(default_factory=list)
    quality_rubric_ref: str | None = None   # bridges to tools.context_tools.get_step_rubric
    hard_gates: list[str] = Field(default_factory=list)
    soft_gates: list[str] = Field(default_factory=list)


class MethodologyConfig(BaseModel):
    """Root config object — the whole methodology-as-data bundle."""

    version: str
    model: ModelConfig = Field(default_factory=ModelConfig)
    epistemic: EpistemicConfig = Field(default_factory=EpistemicConfig)
    stages: list[StageConfig] = Field(default_factory=list)
    gates: GatesConfig = Field(default_factory=GatesConfig)
    routing_table: RoutingTable
    method_packs: dict[str, MethodPack] = Field(default_factory=dict)

    def stage_ids(self) -> list[str]:
        return [s.id for s in self.stages]

    def stage(self, stage_id: str) -> StageConfig | None:
        return next((s for s in self.stages if s.id == stage_id), None)

    def method_pack(self, pack_id: str) -> MethodPack | None:
        return self.method_packs.get(pack_id)
