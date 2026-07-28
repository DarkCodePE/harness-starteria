"""Harness stage state machine (ADR-027).

Ported from ECC's SessionState.can_transition_to pattern: an explicit transition
matrix that makes illegal stage moves raise instead of silently misbehaving. The only
non-linear edge is CONFIRM → EMIT, the "IA propone, humano confirma" short-circuit that
skips routing when a confirmation is required.
"""

from __future__ import annotations

from enum import Enum


class HarnessStage(str, Enum):
    INTAKE = "intake"
    GROUND = "ground"
    INTERPRET = "interpret"
    CONFIRM = "confirm"
    CLASSIFY_ROUTE = "classify_route"
    METHOD_HINT = "method_hint"
    GATE = "gate"
    EMIT = "emit"


# Legal forward transitions. CONFIRM may short-circuit straight to EMIT.
TRANSITIONS: dict[HarnessStage, frozenset[HarnessStage]] = {
    HarnessStage.INTAKE: frozenset({HarnessStage.GROUND}),
    HarnessStage.GROUND: frozenset({HarnessStage.INTERPRET}),
    HarnessStage.INTERPRET: frozenset({HarnessStage.CONFIRM}),
    HarnessStage.CONFIRM: frozenset({HarnessStage.CLASSIFY_ROUTE, HarnessStage.EMIT}),
    HarnessStage.CLASSIFY_ROUTE: frozenset({HarnessStage.METHOD_HINT}),
    HarnessStage.METHOD_HINT: frozenset({HarnessStage.GATE}),
    HarnessStage.GATE: frozenset({HarnessStage.EMIT}),
    HarnessStage.EMIT: frozenset(),
}

# Canonical linear order (used by the driver to walk the happy path).
STAGE_ORDER: tuple[HarnessStage, ...] = (
    HarnessStage.INTAKE,
    HarnessStage.GROUND,
    HarnessStage.INTERPRET,
    HarnessStage.CONFIRM,
    HarnessStage.CLASSIFY_ROUTE,
    HarnessStage.METHOD_HINT,
    HarnessStage.GATE,
    HarnessStage.EMIT,
)


class InvalidTransition(RuntimeError):
    """Raised when a stage transition violates the TRANSITIONS matrix."""


def can_transition(current: HarnessStage, nxt: HarnessStage) -> bool:
    return nxt in TRANSITIONS.get(current, frozenset())


def advance(current: HarnessStage, nxt: HarnessStage) -> HarnessStage:
    """Return ``nxt`` if the transition is legal, else raise InvalidTransition."""
    if not can_transition(current, nxt):
        allowed = sorted(s.value for s in TRANSITIONS.get(current, frozenset()))
        raise InvalidTransition(
            f"Illegal transition {current.value} → {nxt.value}; allowed: {allowed or ['<terminal>']}"
        )
    return nxt


def is_terminal(stage: HarnessStage) -> bool:
    return not TRANSITIONS.get(stage)
