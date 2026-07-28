"""Pydantic v2 contracts for the methodology diagnostic harness (ADR-027).

These are the value objects that flow through the 8-stage diagnostic pipeline
(INTAKE → GROUND → INTERPRET → CONFIRM → CLASSIFY_ROUTE → METHOD_HINT → GATE → EMIT).
They encode the methodology's fixed vocabulary (Starteria_Agent_Methodology_OS_v1.md
§3 epistemic states, §8 diagnostic enums, §10 routing, §9 interpretation review, §14 gates)
so that classification is data-validated, not free text.

Import hygiene: this module must NOT import from `harness.trace` (trace.py imports
GateVerdict/ConfirmationRequest from here). The aggregate `HarnessDecision` — which needs
`HarnessTrace` — lives in trace.py to keep the dependency acyclic.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# §3 Epistemic status — the certainty label every grounded fact carries.
# ---------------------------------------------------------------------------


class EpistemicStatus(str, Enum):
    """Certainty of a piece of information (methodology §3).

    Promotion to ``confirmed`` is governed by EpistemicTracker.promote() and may
    only originate from an authorized human action (§3 "Regla promocion").
    """

    DECLARED = "declared"          # the user stated it (unverified)
    EXTRACTED = "extracted"        # pulled verbatim from a provided source
    INFERRED = "inferred"          # the AI deduced it
    SUGGESTED = "suggested"        # the AI proposes it as an option
    UNKNOWN = "unknown"            # explicitly missing / not evaluable
    CONFLICTING = "conflicting"    # incompatible values seen for the same fact
    CONFIRMED = "confirmed"        # validated by an authorized actor
    OUTDATED = "outdated"          # information without current validity (§3)


# Statuses that may be promoted to CONFIRMED, and only via a human action (§3).
PROMOTABLE_FROM: frozenset[EpistemicStatus] = frozenset(
    {EpistemicStatus.INFERRED, EpistemicStatus.SUGGESTED, EpistemicStatus.CONFLICTING}
)


# ---------------------------------------------------------------------------
# Grounded fact — GROUND stage output; the unit the gates reason over.
# ---------------------------------------------------------------------------


class GroundedField(BaseModel):
    """A single piece of grounded information with its epistemic provenance.

    The GROUND stage must never invent a value: if information is absent it is
    emitted with ``status=unknown`` and ``value=None``, never fabricated.
    """

    key: str = Field(..., description="Stable field name, e.g. 'objective', 'baseline', 'owner'.")
    value: Any | None = Field(None, description="The value, or None when unknown.")
    status: EpistemicStatus = Field(..., description="Certainty label (§3).")
    source: str | None = Field(
        None,
        description="Provenance: 'user_declaration', a document ref, or None. Required to be non-null for CONFIRMED/EXTRACTED.",
    )
    critical: bool = Field(
        False,
        description="Whether this field is critical to the decision; a critical UNKNOWN triggers a hard gate.",
    )
    rationale: str | None = Field(None, description="Why the AI assigned this status (for INFERRED/SUGGESTED).")


class GroundedFieldList(BaseModel):
    """Wrapper so the GROUND stage can emit a list via structured output.

    (OpenRouter ``json_schema`` structured output binds to an object; a bare list is
    not a valid top-level schema, so the extracted fields are wrapped here.)
    """

    fields: list[GroundedField] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# §8/§10 Multidimensional diagnosis — INTERPRET stage output.
# ---------------------------------------------------------------------------

Intent = Literal[
    "decide", "validate", "design", "implement", "deliver", "plan", "present", "manage_portfolio"
]
Unit = Literal[
    "task", "initiative", "project", "challenge", "strategic_objective", "program", "portfolio"
]
ChallengeType = Literal["correction", "growth", "exploration"]
Route = Literal[
    "explore_validate", "design_solution", "implement_handoff",
    "plan_coordinate", "reconstruct_existing", "lightweight_plan",
]
Depth = Literal["light", "standard", "systemic"]
Uncertainty = Literal["algorithmic", "mystery", "mixed"]
Horizon = Literal["H1", "H2", "H3", "unconfirmed"]
Confidence = Literal["low", "medium", "high", "not_evaluable"]


class RouteProfile(BaseModel):
    """The multidimensional diagnosis (§8.2, §10, Ecosistema §4).

    This is what the harness produces that the raw orchestrator never did: an
    explicit, validated classification of what work the request actually needs.
    """

    intent: Intent
    unit: Unit
    unit_status: EpistemicStatus = Field(
        EpistemicStatus.INFERRED, description="Whether the unit is confirmed by a human or merely inferred."
    )
    challenge_type: ChallengeType
    route: Route
    depth: Depth
    uncertainty: Uncertainty = "mixed"
    horizon: Horizon = "unconfirmed"
    step: int = Field(..., ge=0, le=4, description="Methodological step 0-4 the request belongs to.")
    confidence: Confidence = "medium"
    rationale: list[str] = Field(default_factory=list, description="Short reasons for the classification.")
    conditions_that_would_change: list[str] = Field(
        default_factory=list, description="§9: conditions under which this classification would change."
    )


# ---------------------------------------------------------------------------
# §14 Gate verdict — the GATE stage output (ECC risk→action ladder).
# ---------------------------------------------------------------------------

GateAction = Literal["Allow", "Review", "RequireConfirmation", "Block"]


class GateVerdict(BaseModel):
    """Deterministic gate outcome, modeled on ECC's SuggestedAction ladder.

    ``score`` is the clamped 0..1 weighted sum of triggered gates; ``action`` is
    the ladder mapping. Any triggered HARD gate forces at least RequireConfirmation
    regardless of score (hard gates are categorical, not merely additive).
    """

    action: GateAction
    score: float = Field(0.0, ge=0.0, le=1.0)
    reasons: list[str] = Field(default_factory=list)
    failed_hard_gates: list[str] = Field(default_factory=list)
    failed_soft_gates: list[str] = Field(default_factory=list)
    prohibited_terms_found: list[str] = Field(default_factory=list)

    @property
    def blocks_routing(self) -> bool:
        """True when the request must not proceed to a step agent without a human."""
        return self.action in ("RequireConfirmation", "Block")


# ---------------------------------------------------------------------------
# §9 Interpretation review — returned instead of guessing when the CONFIRM gate fires.
# ---------------------------------------------------------------------------


class ConfirmationRequest(BaseModel):
    """The "IA propone, humano confirma" contract (§9).

    Emitted (instead of routing to a step agent) when the CONFIRM hard gate fires:
    critical unknowns, contradictions, or an unconfirmed objective/unit.
    """

    understood_goal: str = Field(..., description="What the harness understood the user wants (may be partial).")
    explicit_information: list[str] = Field(default_factory=list, description="Facts the user stated (declared/extracted).")
    inferred_information: list[str] = Field(default_factory=list, description="What the AI inferred — NOT confirmed.")
    unknown_critical_information: list[str] = Field(default_factory=list, description="Critical gaps blocking a confident route.")
    contradictions: list[str] = Field(default_factory=list, description="Detected conflicts to be resolved by a human.")
    suggested: dict[str, str] = Field(
        default_factory=dict,
        description="Tentative unit/challenge_type/route/depth/horizon — presented as proposals, not facts.",
    )
    strategic_questions: list[str] = Field(
        default_factory=list, max_length=3, description="At most 3 questions that most reduce uncertainty (§8.3)."
    )
    confirmation_options: list[str] = Field(
        default_factory=lambda: ["confirm", "partially_correct", "edit", "add_context", "not_clear_yet"]
    )


# ---------------------------------------------------------------------------
# Diagnosis state — the mutable object the StageDriver threads through the pipeline.
# ---------------------------------------------------------------------------


class DiagnosisState(BaseModel):
    """Mutable working state carried across the diagnostic stages."""

    request_ref: dict[str, Any] = Field(default_factory=dict, description="Snapshot of the incoming request (step/action/payload).")
    project_id: str = "unknown"
    raw_input: str = Field("", description="The user's original free-text intent.")
    stage: str = Field("intake", description="Current HarnessStage value.")
    fields: list[GroundedField] = Field(default_factory=list)
    route_profile: RouteProfile | None = None
    contradictions: list[str] = Field(default_factory=list)
    critical_unknowns: list[str] = Field(default_factory=list)
    method_pack_id: str | None = None
    target_agent: str | None = None
    confirmation: ConfirmationRequest | None = None
    gate: GateVerdict | None = None

    def field(self, key: str) -> GroundedField | None:
        """Return the first grounded field with the given key, or None."""
        return next((f for f in self.fields if f.key == key), None)
