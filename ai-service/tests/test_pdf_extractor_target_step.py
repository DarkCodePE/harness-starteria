"""Target-step filter regression tests for `extractor.extract` (issue #29).

The public PDF auto-fill flow only needs `step0`. Before the fix, `extract()`
ran all five steps (step0..step4) unconditionally, which made anonymous
uploads pay for 5 LLM calls and a ~3-5min wait when only one was needed.

These tests pin the new `target_step` parameter:

  1. `target_step='step_0'`        → `_call_step` runs exactly once with
                                     `step='step0'`; step1..step4 land in the
                                     returned `InitiativeExtraction` as default
                                     validator instances (parity with the
                                     cost-cap branch); `per_step_ms` only
                                     contains the executed step.
  2. `target_step=None`            → existing behavior: `_call_step` is invoked
                                     5 times, once per step.
  3. `target_step=''` / unknown    → treated as None (full sweep). A
                                     malformed override must never silently
                                     drop steps for the authenticated path.

No real LLM calls — `_call_step` is monkeypatched in every test. No real PDF
parsing — we feed pre-built `PageBlock`s straight into `extract`.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

pytestmark = pytest.mark.unit


def _blocks() -> list:
    """Build a minimal non-empty PageBlock list so `_build_full_text` returns text."""
    from agents.pdf_extractor.parser import PageBlock

    text = "Iniciativa de prueba — contenido suficiente para extraer."
    return [PageBlock(page=1, text=text, char_count=len(text))]


def _install_call_step_stub(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Replace `_call_step` with a recording stub that never touches the network.

    Returns the call-recorder dict (mutated in-place by the stub) so tests can
    assert on invocation count and per-step arguments.
    """
    from agents.pdf_extractor import extractor as ex_mod

    calls: dict[str, Any] = {"steps": [], "count": 0}

    def fake_call_step(llm: Any, step: str, full_text: str, language: str):
        calls["steps"].append(step)
        calls["count"] += 1
        validator = ex_mod._STEP_VALIDATORS[step]
        return validator(), 7, {"input": 0, "output": 0}

    monkeypatch.setattr(ex_mod, "_call_step", fake_call_step)
    # Avoid building a real ChatOpenAI (would need a live API key wiring).
    monkeypatch.setattr(ex_mod, "_build_llm", lambda: object())
    return calls


def test_target_step_step_0_runs_only_step0(monkeypatch: pytest.MonkeyPatch) -> None:
    """`target_step='step_0'` cuts the loop to a single `_call_step` invocation.

    Backend convention is `'step_0'` (underscored); the loop convention is
    `'step0'`. The mapping must dispatch to `step0` exactly once.
    """
    from agents.pdf_extractor.extractor import extract
    from schemas.pdf_extraction import (
        Step0Extraction,
        Step1Extraction,
        Step2Extraction,
        Step3Extraction,
        Step4Extraction,
    )

    calls = _install_call_step_stub(monkeypatch)

    result = extract(_blocks(), language="es", target_step="step_0")

    # 1 LLM call, on step0 only — the whole point of the fix.
    assert calls["count"] == 1, f"expected 1 _call_step invocation, got {calls['count']}"
    assert calls["steps"] == ["step0"], (
        f"expected only step0 to be called, got {calls['steps']}"
    )

    # The four skipped steps survive on the returned model as default instances
    # (mirrors the cost-cap branch at extractor.py:270-273).
    assert isinstance(result.step0, Step0Extraction)
    assert result.step1 == Step1Extraction()
    assert result.step2 == Step2Extraction()
    assert result.step3 == Step3Extraction()
    assert result.step4 == Step4Extraction()

    # Bonus: per_step_ms only carries the executed step.
    per_step_ms = result.extraction_metadata.per_step_ms
    assert set(per_step_ms.keys()) == {"step0"}, (
        f"per_step_ms must only contain the executed step, got {sorted(per_step_ms)}"
    )


def test_target_step_step0_no_underscore_also_runs_only_step0(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Either spelling (`step_0` or `step0`) must restrict to step0.

    Front/backend currently send `step_0`, but the loop already speaks `step0`;
    accepting both keeps the parameter robust against future caller drift.
    """
    from agents.pdf_extractor.extractor import extract

    calls = _install_call_step_stub(monkeypatch)

    extract(_blocks(), language="es", target_step="step0")

    assert calls["count"] == 1
    assert calls["steps"] == ["step0"]


def test_target_step_none_preserves_full_sweep(monkeypatch: pytest.MonkeyPatch) -> None:
    """`target_step=None` keeps the existing Step0..Step4 behavior.

    The authenticated path must NOT regress: when no override is supplied,
    every step still runs in order.
    """
    from agents.pdf_extractor.extractor import extract

    calls = _install_call_step_stub(monkeypatch)

    result = extract(_blocks(), language="es", target_step=None)

    assert calls["count"] == 5, f"expected 5 _call_step invocations, got {calls['count']}"
    assert calls["steps"] == ["step0", "step1", "step2", "step3", "step4"]
    # per_step_ms must record every step (vs. the targeted case).
    assert set(result.extraction_metadata.per_step_ms.keys()) == {
        "step0",
        "step1",
        "step2",
        "step3",
        "step4",
    }


def test_target_step_empty_or_unknown_falls_back_to_full_sweep(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An empty string or unknown step name behaves like None (full sweep).

    A malformed override must never silently suppress steps — that would be a
    silent data-loss bug for the authenticated path.
    """
    from agents.pdf_extractor.extractor import extract

    # Empty string.
    calls = _install_call_step_stub(monkeypatch)
    extract(_blocks(), language="es", target_step="")
    assert calls["count"] == 5
    assert calls["steps"] == ["step0", "step1", "step2", "step3", "step4"]

    # Unknown step name.
    calls2 = _install_call_step_stub(monkeypatch)
    extract(_blocks(), language="es", target_step="step_99")
    assert calls2["count"] == 5
    assert calls2["steps"] == ["step0", "step1", "step2", "step3", "step4"]
