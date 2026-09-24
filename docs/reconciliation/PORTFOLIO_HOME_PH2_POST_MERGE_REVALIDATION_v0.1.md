# Portfolio Home PH-2 Post-Merge Revalidation v0.1

**Status:** `EVIDENCE / REVALIDATION REPORT`  
**Decision:** `GO_WITH_GAPS`  
**Date:** 2026-09-24  
**Scope:** REC-2 validation evidence only; this document does not define product authority.

## 1. Refs / branch state

- Branch: `docs/portfolio-home-v2-authority`
- Main baseline: `44c2307d72ef9beb10fd730d0fae254f4ecdf8ef`
- Pre-merge branch: `b36f6743de10f51ff77491866843efb261aa3198`
- Merge base: `7b82f14cfa4bbfe886b53de55dba932ff5ef79b0`
- Merge commit: not created
- Push: not performed
- Six pre-existing untracked Strategic Framing documents: untouched and not staged.

## 2. Scope

Validated the reconciled PH-2 read model against current `main` without
implementing PH-3B, Strategic Framing, Enterprise Direct, clustering,
Activation/Handoff, new schema, new permissions, or new product behavior.

## 3. Authority baseline

- Core authority remains `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`,
  factual status `v0.2 / Base fundacional revisada / Por validar`.
- Core v0.3 remains an external reconciliation candidate only.
- The approved Portfolio Entry Experience Contract remains
  `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
- PH-0 remains a frozen target pack; PH-2 is implementation evidence and PH-3A
  is design/evidence only. PH-3B is not implemented.

## 4. Test commands and results

Executed from `front/`:

```text
npm run test:backend -- ../backend/modules/portfolio/__tests__/portfolio-home.read-service.test.ts ../backend/modules/portfolio/__tests__/portfolio.router.authz.test.ts
Result: PASS — 2 files, 13 tests

npm run typecheck:backend
Result: PASS

git diff --check
Result: PASS

conflict marker scan
Result: PASS — no unresolved merge markers
```

No browser E2E was run; it is outside REC-2 scope.

## 5. Source classification

| Source | Classification | Finding |
| --- | --- | --- |
| `StrategicFront` | CANONICAL READ | Read through `findMany`; used as the strategic-unit root. |
| `Challenge` | CANONICAL READ | Read through the StrategicFront relation; no mutation. |
| `selectedPeople` / invitations | CANONICAL READ when `invitationStatus` exists; otherwise LEGACY-DERIVED | Status and target are mapped without creating or advancing lifecycle. |
| `InitiativePortfolioMeta` | LEGACY-DERIVED | Existing metadata supplies alignment, expected contribution and recommendation fields; it is not promoted to canonical domain state. |
| `Project` | CANONICAL READ / current practical Initiative identity | Existing project identity, execution status, owner, evidence and decision relations are read. |
| `AttentionItem` | CANONICAL READ for project attention; LEGACY-DERIVED for metadata blockers | Open attention is mapped; metadata blockers retain their legacy provenance. |
| `DecisionRequest` | CANONICAL READ | Only open requests without an associated Decision enter `pendingDecisions`. |
| `Decision` | CANONICAL READ as resolution relation | Resolved requests are excluded from pending decisions. |
| latest Portfolio Reading | DERIVED persisted snapshot | Read from the latest bootstrap-session reading; absence remains explicitly unavailable. |

## 6. Contract → implementation mapping

| Frozen Home contract area | PH-2 implementation | Result |
| --- | --- | --- |
| Portfolio Reading | `portfolioReading` maps summary, counts, home state, generated time and source | Implemented, with nullable/partial counts where no source exists |
| Governance | `governance` exposes portfolio lead, sponsors, owners and authorities | Implemented; portfolio lead may be null; sponsor remains separate from authority |
| Strategic units | `strategicUnits[]` maps front → challenge → initiative | Implemented; initiative and invitation visibility remain distinct |
| Attention | `attention[]` combines reading signals and initiative blockers | Implemented; provenance is retained |
| Pending decisions | `pendingDecisions[]` maps unresolved requests and authority when known | Implemented; resolved decisions excluded |
| Recommendations | `recommendations[]` maps reading and existing metadata suggestions | Implemented as advisory and `requiresHumanConfirmation: true` |
| `generatedAt` | Request-time ISO timestamp | Implemented |

Nullable or target-only areas remain explicit: portfolio lead resolution,
observed/attributed contribution, coverage/evidence gap counts, and richer
Activation Readiness are not invented by PH-2.

## 7. Authorization finding

`GET /api/v1/portfolio/home` is behind the router-level `authenticate`
middleware and has no additional permission gate. The targeted authz test
confirms an authenticated `participante` can read it. This matches the current
portfolio read architecture and is a documented authorization debt; no new
permission policy was introduced in REC-2.

## 8. Lifecycle finding

PH-2 preserves the distinctions required by the frozen contract:

- invitations are mapped from `selectedPeople` and do not create initiatives;
- an existing `Project` maps to `initiative_exists` or `initiative_active`
  based on existing execution state;
- accepted/pre-start/started are not synthesized into a new canonical state;
- existing project identity is reused rather than duplicated;
- expected contribution comes from legacy metadata, while observed and
  attributed contribution remain null when unavailable;
- Sponsor is mapped under `governance.sponsors` and is never copied into
  `decisionAuthorities`.

No current-main lifecycle change was found that invalidates PH-2.

## 9. Read-only finding

`getHome` performs only two reads: `StrategicFront.findMany` and the latest
bootstrap-session reading lookup. The service contains no create, update,
delete or upsert operation. It does not activate Challenges, Initiatives or
Steps, assign ownership, execute decisions, mutate invitations, or canonicalize
AI-derived values. The read-service test explicitly guards these properties.

## 10. Known gaps

- The route remains available to any authenticated user; tightening it requires
  an explicit authorization decision.
- PH-2 does not provide observed or attributed contribution values when no
  authoritative source is available.
- `InitiativePortfolioMeta` remains legacy-derived and requires a future
  contract-level decision before any promotion.
- Portfolio Home frontend consumption of PH-2 is deferred to PH-3B.
- Activation/Handoff semantics and richer readiness states remain outside this
  slice.

## 11. PH-3B readiness

PH-2 remains valid as the backend read-model boundary for a later PH-3B slice,
subject to the documented gaps, frontend mapping review, and a future targeted
E2E/retest. No PH-3B implementation was performed here.

## 12. Decision

`GO_WITH_GAPS`: affected code typechecks, targeted tests pass, read-only and
authorization behavior are understood, and no blocking domain/schema conflict
was found. Remaining items are non-blocking follow-ups for PH-3B, SF-7 and
Activation/Handoff review.
