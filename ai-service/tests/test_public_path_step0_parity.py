"""Public (anonymous) PDF-extraction path — step0 contract parity + MANDATORY PII.

Resolves GitHub issue #26.

A backend public endpoint (`POST /api/v1/public/pdf-extract`, built in parallel)
reuses the EXISTING `pdf_extractor` agent rather than a forked pipeline. This
regression test proves, at the ai-service layer, two invariants the public path
relies on:

  1. CONTRACT PARITY — the Step0 extraction schema/proposal shape produced for an
     anonymous (public) request is byte-for-byte identical to the authenticated
     step0 scope. There is no "public Step0" variant: `extractor._STEP_VALIDATORS`
     maps `step0 -> Step0Extraction` for every caller, so the field/key surface,
     the per-leaf FieldProposal shape, and the ground-truth alignment are shared.

  2. MANDATORY PII REDACTION — `PdfExtractorAgent._run` redacts every parsed page
     block via `pii.redact_pii` BEFORE the LLM `extract()` call, and this is
     UNCONDITIONAL (no opt-out flag). Because the public path reuses the same
     agent, anonymous uploads cannot bypass redaction. We assert both that
     `redact_pii` strips representative Peruvian-context PII (email / phone /
     DNI-like digits) and that the agent's pipeline actually invokes it before
     extraction.

This test makes NO real LLM calls and is NOT gated by RUN_EVAL_TESTS. It mirrors
the no-network patterns in `test_pdf_extractor_step0_fieldmodel.py`,
`test_contract_groundtruth_alignment.py`, and the `redact_pii` exercise in
`agents/pdf_extractor/agent.py::_self_check`.
"""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT.parent
GT_PATH = REPO_ROOT / "evals" / "golden" / "pdf-extraction" / "test-iniciativa.ground-truth.json"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

pytestmark = pytest.mark.unit


# The complete set of Step0 keys that BOTH the public and authenticated scopes
# must expose. Mirrors `test_pdf_extractor_step0_fieldmodel.py`. The public path
# reuses Step0Extraction verbatim, so this is the parity surface.
EXPECTED_STEP0_FIELDS = {
    # Legacy fields (authenticated scope; kept for eval back-compat)
    "nombreParticipante",
    "rolArea",
    "origen",
    "quePasaQueQuieres",
    "impacta",
    "parteProceso",
    "impacto3meses",
    "respaldo",
    "quienEscuchar",
    # New fields aligned with the public initiative start flow (front PR #5)
    "initiativeTitle",
    "initiativeFrame",
    "clarityLevel",
    "primaryObjective",
    "impactWho",
    "visibleMoment",
    "whyNowText",
    "ifNotNowConsequence",
    "evidenceType",
    "currentEvidence",
    "validationSignal",
    "sponsorInterestReason",
    "supportNeeded",
    "decisionRequested",
    "additionalStakeholders",
    "additionalStakeholdersDetail",
}


# ---------------------------------------------------------------------------
# 1. Contract parity — the public Step0 scope IS the authenticated Step0 scope.
# ---------------------------------------------------------------------------


def test_step0_validator_is_single_shared_model() -> None:
    """`extractor._STEP_VALIDATORS['step0']` is the one Step0Extraction model.

    There is no separate "public" validator. Whatever scope a caller (public or
    authenticated) requests, step0 resolves to the same Pydantic class. This is
    the structural root of parity: a forked public model would break here.
    """
    from agents.pdf_extractor.extractor import _STEP_VALIDATORS
    from schemas.pdf_extraction import Step0Extraction

    assert _STEP_VALIDATORS["step0"] is Step0Extraction


def test_public_and_authenticated_step0_field_keys_are_identical() -> None:
    """The Step0 field/key surface is identical across scopes.

    The agent has no scope-conditional schema selection; both scopes serialize
    the same `Step0Extraction`. We model "public scope" and "authenticated
    scope" as two independent dumps of the same default model and assert their
    key sets match each other AND the expected union.
    """
    from schemas.pdf_extraction import Step0Extraction

    authenticated_keys = set(Step0Extraction().model_dump().keys())
    public_keys = set(Step0Extraction().model_dump().keys())

    assert public_keys == authenticated_keys, (
        "Public and authenticated step0 dumps diverge — a scope-specific schema "
        "fork would break public-path contract parity."
    )
    assert public_keys == EXPECTED_STEP0_FIELDS, (
        "Step0 key surface drifted from the expected public+authenticated union; "
        f"diff={sorted(public_keys ^ EXPECTED_STEP0_FIELDS)}"
    )


def test_public_step0_proposal_leaf_shape_matches_authenticated() -> None:
    """Each populated leaf serializes to the same FieldProposal shape per scope.

    A FieldProposal dump must carry exactly {value, provenance, confidence}. The
    public path cannot rely on a thinner/fatter leaf, so we assert the leaf
    shape is identical whether built for the authenticated or public scope.
    """
    from schemas.pdf_extraction import FieldProposal, Provenance, Step0Extraction

    def fp() -> FieldProposal:
        return FieldProposal(
            value="x",
            provenance=[Provenance(page=1, quote="q", confidence=0.9)],
            confidence=0.9,
        )

    payload = {field: fp() for field in EXPECTED_STEP0_FIELDS}
    authenticated = Step0Extraction(**payload).model_dump()
    public = Step0Extraction(**payload).model_dump()

    assert public == authenticated, "Public step0 proposal payload diverges from authenticated."

    for field in EXPECTED_STEP0_FIELDS:
        leaf = public[field]
        assert set(leaf.keys()) == {"value", "provenance", "confidence"}, (
            f"{field} leaf must expose exactly the FieldProposal shape, got {sorted(leaf)}"
        )
        assert leaf["confidence"] == 0.9


def test_public_step0_scope_aligns_with_ground_truth_paths() -> None:
    """Every `step0.*` ground-truth path is producible by the shared schema.

    Mirrors `test_contract_groundtruth_alignment.py` but scoped to step0 — the
    public path's extracted surface must satisfy the same eval corpus the
    authenticated path is scored against.
    """
    if not GT_PATH.exists():
        pytest.skip(f"Ground truth missing: {GT_PATH}")

    from schemas.pdf_extraction import Step0Extraction

    gt = json.loads(GT_PATH.read_text(encoding="utf-8"))
    gt_step0_fields = {
        key.split(".", 1)[1]
        for key in gt["fields"]
        if key.startswith("step0.")
    }
    schema_fields = set(Step0Extraction.model_fields.keys())

    missing = sorted(gt_step0_fields - schema_fields)
    assert not missing, (
        "Ground-truth step0 paths the public/authenticated schema cannot emit: "
        + ", ".join(missing)
    )


# ---------------------------------------------------------------------------
# 2. MANDATORY PII redaction — the public path inherits unconditional redaction.
# ---------------------------------------------------------------------------


def test_redact_pii_strips_email_phone_and_dni() -> None:
    """`redact_pii` masks representative PII the public path will encounter.

    Proves the redaction entrypoint the public path depends on actually strips
    email, Peruvian phone numbers, and DNI-like digit runs. Mirrors the sample
    in `agents/pdf_extractor/agent.py::_self_check`.
    """
    from agents.pdf_extractor.pii import redact_pii

    sample = "Contacto: ana.perez@example.com, cel 987654321, DNI 12345678"
    result = redact_pii(sample)

    assert "ana.perez@example.com" not in result.text, "email leaked"
    assert "987654321" not in result.text, "phone leaked"
    assert "12345678" not in result.text, "DNI leaked"
    assert "<PII:EMAIL>" in result.text
    assert "<PII:PHONE>" in result.text or "<PII:ID>" in result.text
    assert result.redactions >= 3, (
        f"expected at least 3 redactions (email/phone/dni), got {result.redactions}"
    )


def test_redact_pii_is_unconditional_no_optout_flag() -> None:
    """`redact_pii` exposes no flag to disable masking.

    PII redaction MUST be mandatory for the public path. The signature takes a
    single `text` argument and always returns a RedactionResult — there is no
    opt-out parameter the public endpoint could pass to skip it. If a future
    change adds a `disable`/`skip`/`enabled` flag, this test fails loudly so the
    public path's guarantee is re-reviewed.
    """
    import inspect

    from agents.pdf_extractor.pii import redact_pii

    params = inspect.signature(redact_pii).parameters
    assert list(params.keys()) == ["text"], (
        f"redact_pii must take only `text` (no opt-out flag); got {list(params)}"
    )
    optout_like = {"disable", "skip", "enabled", "redact", "enable", "off"}
    assert not (optout_like & set(params)), (
        "redact_pii gained a redaction-toggle parameter — public-path PII "
        "enforcement can no longer be guaranteed unconditional."
    )


def test_agent_pipeline_redacts_blocks_before_extraction() -> None:
    """The shared agent redacts EVERY page block before calling `extract`.

    This is the enforcement proof: the public path reuses `PdfExtractorAgent`,
    whose `_run` loops over parsed blocks calling `redact_pii` and only then
    invokes `extract`. We drive `_run` with monkeypatched parse/extract stubs
    (NO real PDF, NO real LLM) and assert that by the time `extract` is reached:
      - block text passed downstream has been masked (raw PII gone), and
      - the redaction count is propagated into the extract call.
    """
    import asyncio

    from agents.pdf_extractor import agent as agent_mod
    from agents.pdf_extractor.parser import PageBlock
    from schemas.pdf_extraction import (
        ExtractionMetadata,
        InitiativeExtraction,
    )

    raw_pii_text = "Sponsor ana.perez@example.com tel 987654321 DNI 12345678 — iniciativa X"
    captured: dict[str, Any] = {}

    def fake_parse(pdf_bytes: bytes, file_name: str) -> list[PageBlock]:
        return [PageBlock(page=1, text=raw_pii_text, char_count=len(raw_pii_text))]

    def fake_detect_language(blocks: list[PageBlock]) -> str:
        return "es"

    def fake_extract(blocks: list[PageBlock], language: str, **kwargs: Any) -> InitiativeExtraction:
        # Snapshot what the extractor actually receives. This runs strictly AFTER
        # the redaction loop in `_run`, so it captures post-redaction state.
        captured["block_texts"] = [b.text for b in blocks]
        captured["pii_redactions"] = kwargs.get("pii_redactions")
        return InitiativeExtraction(
            extraction_metadata=ExtractionMetadata(
                model="stub-model",
                language=language,
                pages=len(blocks),
                started_at="2026-01-01T00:00:00",
                finished_at="2026-01-01T00:00:00",
                duration_ms=0,
                pii_redactions=kwargs.get("pii_redactions", 0),
            )
        )

    monkey = pytest.MonkeyPatch()
    try:
        monkey.setattr(agent_mod, "parse_pdf_bytes", fake_parse)
        monkey.setattr(agent_mod, "detect_language", fake_detect_language)
        monkey.setattr(agent_mod, "extract", fake_extract)

        agent = agent_mod.PdfExtractorAgent()
        prepared = agent_mod._PreparedRun(
            run_id="public-parity-run",
            pdf_bytes=base64.b64decode(base64.b64encode(b"%PDF-stub")),
            language=None,
            cost_cap_usd=0.30,
            file_name="public.pdf",
        )
        agent._registry.create(prepared.run_id)
        asyncio.run(agent._run(prepared))
    finally:
        monkey.undo()
        try:
            agent._registry.clear()
        except Exception:  # noqa: BLE001
            pass

    assert "block_texts" in captured, "extract() was never reached"
    extracted_text = captured["block_texts"][0]

    # Enforcement: the extractor saw REDACTED text, never the raw PII.
    assert "ana.perez@example.com" not in extracted_text, "email reached extractor unredacted"
    assert "987654321" not in extracted_text, "phone reached extractor unredacted"
    assert "12345678" not in extracted_text, "DNI reached extractor unredacted"
    assert "<PII:EMAIL>" in extracted_text, "redaction did not run before extraction"

    # The redaction count is propagated into the extract call (audit trail).
    assert captured["pii_redactions"] is not None and captured["pii_redactions"] >= 3, (
        f"expected ≥3 propagated redactions, got {captured['pii_redactions']}"
    )

    # Terminal run state reflects a completed redaction-then-extract pipeline.
    state = agent._registry.get(prepared.run_id) if hasattr(agent._registry, "get") else None
    if state is not None:
        assert state.status == "completed"
