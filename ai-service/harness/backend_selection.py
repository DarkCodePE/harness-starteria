"""Resolve the INTERPRET backend for the approved ADR-031 slice."""

from __future__ import annotations

import os
from typing import Literal

from harness.config_models import MethodologyConfig

InterpretBackend = Literal["jev", "llm"]


def selected_interpret_backend(config: MethodologyConfig) -> InterpretBackend:
    """Config selects Jev; an explicit env override supports rollback to the prior LLM."""
    value = os.getenv("HARNESS_INTERPRET_BACKEND", config.model.interpret_backend)
    if value not in ("jev", "llm"):
        raise ValueError("HARNESS_INTERPRET_BACKEND must be 'jev' or 'llm'.")
    return value
