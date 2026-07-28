"""Methodology diagnostic harness for the Starteria multi-agent orchestrator (ADR-027).

An "Agent = Model + Harness" scaffolding that turns the orchestrator's mechanical
`(step, action) → agent` routing into a methodology-grounded diagnosis: it grounds the
request (epistemic status), interprets it into a RouteProfile, gates it (IA propone /
humano confirma), and routes to the correct Step 0–4 agent — or returns a confirmation
request instead of guessing. Primitives are ported from ECC (loop, state machine,
risk→verdict ladder, prompt builder, rubric grader); ECC itself is not a dependency.

Light contract/trace symbols are re-exported eagerly. The LLM-backed facade is imported
lazily so `import harness` stays cheap and key-free (useful for backend/contract consumers).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from harness.contracts import (
    ConfirmationRequest,
    DiagnosisState,
    EpistemicStatus,
    GateVerdict,
    GroundedField,
    RouteProfile,
)
from harness.trace import AuditRecord, HarnessDecision, HarnessTrace, StageTrace

if TYPE_CHECKING:  # avoid importing langchain at package import time
    from harness.harness import MethodologyHarness

__all__ = [
    "EpistemicStatus",
    "GroundedField",
    "RouteProfile",
    "DiagnosisState",
    "GateVerdict",
    "ConfirmationRequest",
    "HarnessDecision",
    "HarnessTrace",
    "StageTrace",
    "AuditRecord",
    "MethodologyHarness",
    "get_harness",
]


def get_harness() -> "MethodologyHarness":
    """Lazily construct the singleton MethodologyHarness (defers heavy imports)."""
    from harness.harness import get_harness as _get

    return _get()


def __getattr__(name: str) -> Any:  # PEP 562 lazy attribute for MethodologyHarness
    if name == "MethodologyHarness":
        from harness.harness import MethodologyHarness

        return MethodologyHarness
    raise AttributeError(f"module 'harness' has no attribute {name!r}")
