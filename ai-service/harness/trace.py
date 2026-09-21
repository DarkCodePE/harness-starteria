"""Audit trace + top-level decision contracts for the harness (ADR-027 §20).

Every diagnostic run emits a HarnessTrace: a per-stage timeline plus an AuditRecord
capturing config/prompt/model versions and the epistemic disposition of the output.
This is the harness's answer to "por qué tomó este camino" — the correct-path evidence.

Depends only on `harness.contracts` (keeps the import graph acyclic).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

from harness.contracts import (
    ConfirmationRequest,
    GateVerdict,
    GroundedField,
    RouteProfile,
)


class StageTrace(BaseModel):
    """One entry in the per-stage timeline."""

    stage: str
    duration_ms: int = 0
    llm_used: bool = False
    model_provider: str | None = None
    model_id: str | None = None
    # None = not measured (no call, or a provider that reported no usage). Never 0 as a
    # stand-in for unknown: "free" and "unreported" are different claims.
    tokens_in: int | None = None
    tokens_out: int | None = None
    epistemic_tags: list[str] = Field(default_factory=list, description="Statuses observed at this stage.")
    gate: GateVerdict | None = None
    notes: list[str] = Field(default_factory=list)


class AuditRecord(BaseModel):
    """Provenance of a diagnosis (§20 audit_record).

    Records everything needed to reproduce and govern the decision: which config
    and prompt versions were used, which model, and which fields were inferred vs
    confirmed — so a human validator can see exactly what is and isn't grounded.
    """

    agent_id: str = "methodology-harness"
    config_version: str = "unknown"
    prompt_versions: dict[str, str] = Field(default_factory=dict)
    method_pack_versions: list[str] = Field(default_factory=list)
    model_provider: str = "openrouter"
    model_id: str = "unknown"
    timestamp: datetime | None = Field(None, description="Set by TraceRecorder.finalize().")
    project_id: str = "unknown"
    source_refs: list[str] = Field(default_factory=list)
    inferred_fields: list[str] = Field(default_factory=list)
    confirmed_fields: list[str] = Field(default_factory=list)
    confidence: str = "not_evaluable"
    requires_human_confirmation: bool = False
    human_action: Literal["accepted", "edited", "rejected", "pending"] = "pending"


class HarnessTrace(BaseModel):
    """The full audit trail of a diagnostic run."""

    stages: list[StageTrace] = Field(default_factory=list)
    audit: AuditRecord = Field(default_factory=AuditRecord)
    grounded: list[GroundedField] = Field(
        default_factory=list, description="The grounded fields the diagnosis was based on (provenance)."
    )
    final_verdict: GateVerdict | None = None


class HarnessDecision(BaseModel):
    """Top-level harness output.

    ``kind``:
      - ``route``    → proceed to ``target_agent`` with ``method_pack_id`` + ``route_profile``.
      - ``confirm``  → return ``confirmation`` to the human; do NOT invoke a step agent.
      - ``escalate`` → a hard block / red-line; needs a specific human role.
    """

    kind: Literal["route", "confirm", "escalate"]
    route_profile: RouteProfile | None = None
    target_agent: str | None = None
    method_pack_id: str | None = None
    confirmation: ConfirmationRequest | None = None
    gate: GateVerdict
    trace: HarnessTrace


class TraceRecorder:
    """Accumulates StageTrace entries and stamps the AuditRecord at the end.

    Kept out of the Pydantic models so the contracts stay side-effect-free.
    Timestamping lives here (not in a model default) so tests can freeze it.
    """

    def __init__(self, audit: AuditRecord | None = None) -> None:
        self._stages: list[StageTrace] = []
        self._audit = audit or AuditRecord()
        self._grounded: list[GroundedField] = []

    def record(self, stage: StageTrace) -> None:
        self._stages.append(stage)

    def set_grounded(self, fields: list[GroundedField]) -> None:
        self._grounded = list(fields)

    @property
    def audit(self) -> AuditRecord:
        return self._audit

    def finalize(self, final_verdict: GateVerdict | None) -> HarnessTrace:
        if self._audit.timestamp is None:
            self._audit.timestamp = datetime.now(timezone.utc)
        return HarnessTrace(
            stages=self._stages, audit=self._audit, grounded=self._grounded, final_verdict=final_verdict
        )
