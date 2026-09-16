"""Unit tests for the harness stage state machine (ADR-027)."""

import pytest

from harness.state_machine import (
    STAGE_ORDER,
    HarnessStage,
    InvalidTransition,
    advance,
    can_transition,
    is_terminal,
)

pytestmark = pytest.mark.unit


def test_linear_path_is_legal():
    for a, b in zip(STAGE_ORDER, STAGE_ORDER[1:]):
        # The linear neighbor is always a legal transition except the CONFIRM→CLASSIFY edge,
        # which is legal, and the confirm→emit shortcut handled separately.
        assert can_transition(a, b) or a is HarnessStage.CONFIRM


def test_confirm_may_shortcut_to_emit():
    assert can_transition(HarnessStage.CONFIRM, HarnessStage.EMIT)
    assert can_transition(HarnessStage.CONFIRM, HarnessStage.CLASSIFY_ROUTE)


def test_illegal_transition_raises():
    with pytest.raises(InvalidTransition):
        advance(HarnessStage.INTAKE, HarnessStage.EMIT)
    with pytest.raises(InvalidTransition):
        advance(HarnessStage.GATE, HarnessStage.GROUND)


def test_advance_returns_next_on_legal():
    assert advance(HarnessStage.GROUND, HarnessStage.INTERPRET) is HarnessStage.INTERPRET


def test_emit_is_terminal():
    assert is_terminal(HarnessStage.EMIT)
    assert not is_terminal(HarnessStage.INTAKE)
