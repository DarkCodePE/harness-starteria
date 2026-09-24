# Portfolio Lead Value Gaps Register v0.1

**Status:** `EVIDENCE / PLANNING REGISTER â€” NOT AUTHORITY`
**Date:** 2026-09-24
**Scope:** known gaps recorded during REC-1 through REC-3; no fixes are authorized by this register.

| ID | Gap | Current evidence | Treatment |
| --- | --- | --- | --- |
| PL-GAP-01 | Direct Portfolio entry bypasses governed setup | Direct login can reach Home without an equivalent governed Bootstrap/Strategic Interpretation path. | Future bounded slice; do not implement in REC-3. |
| PL-GAP-02 | Strategic Front persistence mismatch | Front UI fields are not all persisted consistently through the current adapter/API path. | Reconcile UI, API, persistence and read adapter. |
| PL-GAP-03 | Imported owner is not confirmed ownership | Imported owner names remain candidate context. | Require resolution, human confirmation, invitation and acceptance. |
| PL-GAP-04 | Portfolio clustering is not implemented | Current Bootstrap does not productively cluster work into candidate Fronts/Challenges. | Future capability with provenance and human confirmation. |
| PL-GAP-05 | Copilot capability coverage is incomplete | Guarded `CreateStrategicFront` exists; equivalent challenge, initiative, assignment and clustering capabilities are not complete. | Future capability review; no new Copilot capability in REC-3. |
| PL-GAP-06 | Activation/Handoff target is not implemented | Invitation, acceptance, Initiative/pre-start, Start and Step activation remain distinct target boundaries. | Future Activation/Handoff slice and E2E. |
| PL-GAP-07 | Home frontend does not consume PH-2 | PH-2 backend is revalidated; PH-3B frontend integration is not implemented. | Pause until SF-7/PH-3B reconciliation. |
| PL-GAP-08 | Portfolio Home authorization debt | `/api/v1/portfolio/home` requires authentication but no additional permission gate. | Requires explicit authorization decision; unchanged in REC-3. |
| PL-GAP-09 | Contribution observation/attribution incomplete | PH-2 preserves expected contribution and leaves observed/attributed values unavailable when no authoritative source exists. | Future source/contract decision. |
| PL-GAP-10 | Legacy-derived Portfolio metadata | `InitiativePortfolioMeta` supplies useful read fields but is not promoted to canonical state. | Preserve provenance; require future contract/ADR before promotion. |
