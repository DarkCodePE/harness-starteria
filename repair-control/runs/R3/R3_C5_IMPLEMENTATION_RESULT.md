# R3-C5 DecisionEffects + ContinuationRoute

## 1. Scope

Implemented backend-owned DecisionEffects and ContinuationRoute foundation.

Decision remains the immutable human-authorized record. Effects are a separate internal application step that translates a persisted Decision into one traceable route and the minimal system records needed for that route.

No full UI, portfolio metrics dashboard, Sponsor/Committee workflow, project-management handoff system, or self-initiated resume UI was implemented.

## 2. Outcome -> Route Policy

Backend-owned mapping:

- `continue_experimenting` -> `new_cycle`
- `implement` -> `implementation_handoff`
- `scale` -> `scaling_handoff`
- `pause` -> `paused`
- `close_with_learning` -> `closed`

Frontend cannot provide `routeType`.

## 3. ContinuationRoute Model

Added `ContinuationRoute`:

- `projectId`
- `decisionId`
- `routeType`
- `resultingCycleId`
- `handoffId`
- `appliedAt`
- `idempotencyKey`
- `createdAt`

One Decision has at most one route through `decisionId @unique`.

## 4. Effect Transaction

`applyDecisionEffects(projectId, userId, role, decisionId, input?)` is an internal backend service operation.

There is no public POST apply route. The only public route added is read-only:

- `GET /projects/:id/adaptive-core/continuation-routes`

Transaction behavior:

- load persisted Decision
- lock Decision row on PostgreSQL when available
- return existing ContinuationRoute if already applied
- derive route from `Decision.outcome`
- apply one internal effect
- persist ContinuationRoute
- update top-level lifecycle projection
- emit provenance events

## 5. Continue Experimenting / New Cycle

`continue_experimenting` creates a new active InitiativeCycle:

- `triggerType = decision`
- `triggerRefId = Decision.id`
- `parentCycleId = source completed cycle`
- source cycle remains `completed`
- no historical cycle is reactivated
- no historical outputs are copied

MVP reentry policy:

- evidence/impact gaps -> Step 2
- execution/risk gaps -> Step 3
- governance gaps -> Step 4
- fallback -> Step 3

For previous confirmed steps before reentry, new CycleStepState is `inherited` with `inheritedFromCycleId` and `inheritedFromOutputId`.

## 6. Implementation Handoff

`implement` creates:

- `ContinuationRoute.routeType = implementation_handoff`
- `ImplementationHandoff`

No new methodological cycle is created.

The handoff stores lightweight historical carry-forward data:

- approved scope
- accepted conditions
- metrics
- evidence snapshot
- risks

It is not a task board or project management subsystem.

## 7. Scaling Handoff

`scale` creates:

- `ContinuationRoute.routeType = scaling_handoff`
- `ScalingHandoff`

No new methodological cycle is created.

Scaling handoff stores:

- validated scope
- scaling conditions
- impact snapshot
- dependencies
- risks
- unvalidated segments / extrapolation note

Pilot validation is not treated as universal validation.

## 8. Pause

`pause` creates:

- `ContinuationRoute.routeType = paused`

No cycle is created or superseded. Methodological history remains intact.

Top-level projection becomes `PAUSED` / portfolio `paused`.

## 9. Close With Learning

`close_with_learning` creates:

- `ContinuationRoute.routeType = closed`
- `ClosureSummary`

ClosureSummary is separate from Decision and stores:

- closure reason
- learning summary
- validated-claim references when available
- evidence references
- reusable learning
- future considerations

Truth, Evidence, SourceRefs, Step outputs, cycles, DecisionRequest and Decision remain preserved.

## 10. Top-Level Lifecycle

Added minimal lifecycle projection support:

- `ProjectStatus.IMPLEMENTATION_APPROVED`
- `ProjectStatus.SCALING_APPROVED`
- `ProjectStatus.PAUSED`
- `ProjectStatus.CLOSED`

Added portfolio projection statuses:

- `implementation_approved`
- `scaling_approved`
- `paused`
- `closed`

Cycle status remains methodological (`active`, `completed`, `superseded`) and is not overloaded.

## 11. Idempotency / Concurrency

One Decision can produce at most one effective route.

Idempotency:

- same Decision applied twice returns the existing route
- route-level `idempotencyKey` is unique when supplied
- duplicate effect application does not create duplicate cycles, handoffs or closure summaries

Concurrency:

- PostgreSQL row locking plus unique `decisionId` route invariant serializes application
- concurrent apply resolves to one route/effect

## 12. Historical Integrity

Effects never rewrite:

- Decision
- DecisionRequest snapshots
- Step4 output
- historical AdaptiveStepOutput
- TruthClaim
- Evidence
- SourceRef
- source Cycle

For close/pause/implement/scale, no new methodological cycle is created.

## 13. Invariant Matrix

| Invariant | Status | Evidence |
| --- | --- | --- |
| DE-01 Decision outcome != ContinuationRoute | PASS | Separate Decision and ContinuationRoute models. |
| DE-02 Effects backend-owned | PASS | Internal service derives effects. |
| DE-03 Frontend cannot choose route | PASS | No public apply endpoint; no routeType input. |
| DE-04 Persisted valid Decision required | PASS | Service loads Decision by project/id. |
| DE-05 Effect application idempotent | PASS | Existing route returned. |
| DE-06 Effects transactionally consistent | PASS | Single transaction per application. |
| DE-07 continue_experimenting creates new Cycle | PASS | Unit/E2E. |
| DE-08 new Cycle triggerType = decision | PASS | Unit/E2E. |
| DE-09 new Cycle triggerRefId = Decision.id | PASS | Unit/E2E. |
| DE-10 does not restart Step0 | PASS | MVP fallback Step3; tests assert Step3. |
| DE-11 R3-B inheritance/reopen preserved | PASS | Selective inherited states; no output copy. |
| DE-12 source Cycle remains completed | PASS | Unit/E2E. |
| DE-13 historical outputs immutable | PASS | Snapshot assertions. |
| DE-14 implement no methodological Cycle | PASS | Unit/E2E. |
| DE-15 scale no methodological Cycle by default | PASS | Unit/E2E. |
| DE-16 implement creates handoff | PASS | Unit/E2E. |
| DE-17 scale creates handoff | PASS | Unit/E2E. |
| DE-18 handoff lightweight | PASS | JSON snapshots only; no task system. |
| DE-19 pause preserves history | PASS | Unit/E2E. |
| DE-20 pause no create/supersede Cycle | PASS | Unit/E2E. |
| DE-21 close preserves learning/history | PASS | ClosureSummary plus snapshot preservation. |
| DE-22 close never deletes Truth/Evidence | PASS | Unit/E2E. |
| DE-23 ClosureSummary != Decision | PASS | Separate model. |
| DE-24 ContinuationRoute traceable to Decision | PASS | FK `decisionId`. |
| DE-25 one Decision max one route | PASS | `decisionId @unique`. |
| DE-26 same Decision twice no duplicates | PASS | Unit/E2E. |
| DE-27 Decision immutable after effects | PASS | Snapshot assertions. |
| DE-28 lifecycle != Cycle.status | PASS | Project/Portfolio status separate. |
| DE-29 portfolio status not inferred from currentStep | PASS | Explicit status updates. |
| DE-30 future different direction requires new Decision | PASS | Existing route/Decision not overwritten. |

## 14. Tests

Added:

- `backend/modules/adaptive-core/__tests__/decision-effects.service.test.ts`
- `backend/modules/adaptive-core/__tests__/decision-effects.e2e.test.ts`

Focused C5 unit coverage:

- all five outcome mappings
- continue-experimenting new cycle
- inherited states and no output copy
- implement/scale handoff creation
- pause/close route behavior
- ClosureSummary creation
- idempotent re-apply
- frontend route fields ignored in service input
- no new Decision created by effects

## 15. PostgreSQL E2E

Real PostgreSQL coverage:

- all five outcome mappings
- route persistence and reload
- one Decision -> one route
- idempotency
- concurrency
- new Cycle provenance for `continue_experimenting`
- no Cycle for implement/scale/pause/close
- implementation/scaling handoff persistence
- ClosureSummary persistence
- Truth/Evidence/SourceRef/history preservation
- lifecycle projection persistence

## 16. Schema / Migration Alignment

Added migration:

- `front/prisma/migrations/20260820170000_r3c5_decision_effects_continuation_route/migration.sql`

Clean E2E provision:

- 23 migrations applied successfully
- migrate status: database schema is up to date

Prisma diff after clean provisioning shows only known legacy drift:

- `PdfFieldProposal_runId_fieldPath_idx`
- `AdaptiveAdaptationEvent.summary` / `payloadJson`
- `PilotLead.proposal`
- `PilotClaimToken`
- `PdfFieldProposal_runId_fieldPath_key`

No R3-C5 drift remains.

## 17. Explicitly Not Implemented

- full Decision Center UI
- portfolio metrics dashboard
- Sponsor/Committee workflow
- full implementation project management
- Jira/Monday-like task tracking
- resume self-initiated completed initiative UI
- broad frontend redesign

## 18. Regression

Commands run:

- `npm run test:backend -- ../backend/modules/adaptive-core/__tests__/decision-effects.service.test.ts`
- `R2_PERSISTENCE_E2E=1 DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/decision-effects.e2e.test.ts`
- C5/C4A/C3A/C2B/C2A/C1A/R3-B focused unit set: 12 files, 71 tests passed
- PostgreSQL regression package: 8 files, 28 tests passed
- `npm run db:e2e:provision`
- `npm run db:e2e:status`
- `prisma migrate diff`
- `prisma validate`
- `prisma generate`
- `npm test` informational

`npm test` informational result:

- backend: 89 files passed, 11 skipped; 755 tests passed, 31 skipped
- 1 known out-of-scope failure: `backend/shared/utils/__tests__/logger-redaction.test.ts` / `LOG_REDACT_PATHS`
- frontend was not reached because `npm test` stops after backend failure

## 19. R3-C5 GO / NO-GO

R3-C5 GO.

DecisionEffects and ContinuationRoute are implemented as backend-owned, idempotent, transactionally persisted effects derived only from valid persisted Decisions. Full R3-C GO is not declared here.
