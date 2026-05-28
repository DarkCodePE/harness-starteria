"""Step0Extraction schema regression test — verifies that legacy + new fields
introduced by the public initiative start flow (front PR #5) are exposed by
the pydantic model.

If a field is dropped or renamed, the corresponding `evals/golden/.../*.json`
ground-truth key will be silently un-extracted in production. This test fails
loudly in that case.
"""

from __future__ import annotations

from schemas.pdf_extraction import FieldProposal, Step0Extraction


EXPECTED_LEGACY_FIELDS = {
    "nombreParticipante",
    "rolArea",
    "origen",
    "quePasaQueQuieres",
    "impacta",
    "parteProceso",
    "impacto3meses",
    "respaldo",
    "quienEscuchar",
}

EXPECTED_NEW_FIELDS = {
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


def test_step0_extraction_exposes_legacy_fields() -> None:
    fields = set(Step0Extraction.model_fields.keys())
    missing = EXPECTED_LEGACY_FIELDS - fields
    assert not missing, f"Step0Extraction lost legacy fields: {sorted(missing)}"


def test_step0_extraction_exposes_new_public_flow_fields() -> None:
    fields = set(Step0Extraction.model_fields.keys())
    missing = EXPECTED_NEW_FIELDS - fields
    assert not missing, (
        "Step0Extraction is missing fields required by the public initiative "
        f"start flow (front PR #5): {sorted(missing)}"
    )


def test_step0_extraction_accepts_a_full_field_proposal_payload() -> None:
    fp = FieldProposal(value="example", provenance=[], confidence=0.8)
    payload = {field: fp for field in (EXPECTED_LEGACY_FIELDS | EXPECTED_NEW_FIELDS)}
    parsed = Step0Extraction.model_validate({k: v.model_dump() for k, v in payload.items()})

    for field in EXPECTED_LEGACY_FIELDS | EXPECTED_NEW_FIELDS:
        leaf = getattr(parsed, field)
        assert leaf is not None, f"{field} should hydrate when supplied"
        assert leaf.confidence == 0.8


def test_step0_extraction_defaults_all_fields_to_none() -> None:
    parsed = Step0Extraction()
    for field in EXPECTED_LEGACY_FIELDS | EXPECTED_NEW_FIELDS:
        assert getattr(parsed, field) is None, f"{field} default should be None"
