# R3-B Implementation Result

## R3-B1 - Critical Change Assessment Foundation

### Files

- `front/prisma/schema.prisma`
- `front/prisma/migrations/20260817120000_r3b1_critical_change_assessment/migration.sql`
- `backend/modules/adaptive-core/adaptive-core.types.ts`
- `backend/modules/adaptive-core/adaptive-core.service.ts`
- `backend/modules/adaptive-core/critical-change-dependency.resolver.ts`
- `backend/modules/adaptive-core/critical-change-impact.resolver.ts`
- `backend/modules/adaptive-core/critical-change-user-outcome.ts`
- `backend/modules/adaptive-core/__tests__/critical-change-assessment.test.ts`
- `backend/modules/adaptive-core/__tests__/critical-change-user-outcome.test.ts`
- `backend/modules/adaptive-core/__tests__/critical-change-idempotency.test.ts`
- `backend/modules/adaptive-core/__tests__/adaptive-core.service.test.ts`
- `backend/modules/adaptive-core/__tests__/cycle-test-utils.ts`

### Schema / migration

Added `CriticalChangeScope`, `CriticalChangeStatus`, and `CriticalChange`.

`CriticalChange` is project-scoped, source-cycle scoped, idempotent by `idempotencyKey`, stores previous/next values and persists `impactJson` with `assessmentVersion = 1`.

Cycle relations added:

- `CriticalChangeSourceCycle`
- `CriticalChangeResultingCycle`
- `CriticalChangeBasedOnCycle`

No FK to `User` was added; `proposedById` and `confirmedById` remain scalar strings.

### Canonical authority

`CriticalChange` is now the persistent authority for critical changes.

`AdaptiveAdaptationEvent` remains audit/provenance only. The provenance event payload includes `criticalChangeId`.

### Resolver split

Added `CriticalChangeDependencyResolver`:

- maps legacy fields to canonical critical-change scope
- returns potentially affected steps/checkpoints/outputs
- does not mark invalidation
- uses `StepNumber`, not display strings
- documents conservative handling of contextual fields

Added `CriticalChangeImpactResolver`:

- inspects source-cycle `CycleStepState` and `AdaptiveStepOutput`
- separates draft/unconfirmed, confirmed affected, and material invalidation
- recommends transition only
- never creates a new cycle
- never mutates Initiative identity

### Legacy compatibility

The legacy endpoint still accepts:

- `idempotencyKey`
- `field`
- `previousValue`
- `nextValue`
- `reason`
- `confirmed`
- `action`

`confirmed=true` only means the user confirms the change is real and wants assessment. It does not apply a system transition.

### User-facing projection

Added `buildCriticalChangeUserOutcome()` as a pure mapper for future frontend use.

It explains:

- preserved steps
- review steps
- downstream steps
- recommended action
- recommended step

It is not transition authority.

### Tests

Added focused coverage for:

- Step 2 draft `selected_bet` change stays same cycle
- Step 2 confirmed `selected_bet` change recommends new cycle, reentry Step 2, preserving Steps 0/1
- `target_date` remains operational/non-material
- confirmed hypothesis change uses earliest confirmed affected dependency, not hardcoded Step 0
- challenge identity change recommends derived initiative
- idempotency creates one canonical `CriticalChange`
- `AdaptiveAdaptationEvent` exists only as provenance with `criticalChangeId`
- user-facing outcome for new-cycle Step 2
- no global `requiresReview` update in R3-B1

Updated legacy Adaptive Core expectations that previously asserted immediate reconfiguration on critical change.

### Tests executed

- `npx.cmd prisma format --schema prisma/schema.prisma`: PASS
- `npx.cmd prisma generate --schema prisma/schema.prisma`: PASS
- `npx.cmd prisma validate --schema prisma/schema.prisma` with explicit `DATABASE_URL`: PASS
- Focused R3-B1 tests: 3 files, 7 tests PASS
- R3-A cycle tests: 4 files, 7 tests PASS
- Adaptive Core regression set: 8 files, 105 tests PASS
- `npm.cmd test`: backend ran; 682 passed, 9 skipped, 1 unrelated failure in `backend/shared/utils/__tests__/logger-redaction.test.ts`
- `npm.cmd run test:front`: PASS

### Known remaining work

- R3-B2 transitions: create/apply new `InitiativeCycle` after explicit human confirmation.
- R3-B3 return/history: implement `return_to_prior_direction`, history navigation, and derived initiative workflow.
- Decision Center and governance/DecisionAuthority remain unimplemented by contract.

### R3-B1 result

R3-B1 GO.

Do not declare full R3-B GO yet.

## R3-B1 Review Fix

Corrected the frozen `CriticalChange` lifecycle semantics:

- `assessment_ready` means the backend evaluated impact and produced a recommendation.
- `assessment_ready` does not represent human approval of the recommended transition.
- `confirmed` is reserved for explicit human acceptance of the evaluated transition.
- legacy `input.confirmed === true` only means the user confirms the change is real and wants assessment.

R3-B1 assessment now explicitly persists:

- `status = assessment_ready`
- `confirmedById = null`
- `confirmedAt = null`
- `confirmedReentryStep = null`
- `resultingCycleId = null`
- `appliedAt = null`

The legacy confirmation remains provenance-only as assessment intent through:

- `payloadJson.userActionConfirmedChange`

No new columns were added. No cycle is created. No configuration is superseded. No global `requiresReview` is changed.

The Prisma schema was reviewed manually and did not require cleanup for this review fix.

### Review-fix validation

- R3-B1 focused tests: 3 files, 7 tests PASS
- Adaptive Core/R3-A regression set: 8 files, 105 tests PASS
- `prisma validate` with explicit `DATABASE_URL`: PASS
- `prisma generate`: PASS
- `npm test`: backend ran; 682 passed, 9 skipped, 1 unrelated out-of-scope failure in `backend/shared/utils/__tests__/logger-redaction.test.ts`

Logger redaction remains out of scope for this review fix.

R3-B1 final GO.

Do not declare full R3-B GO yet.

## R3-B2A — Human Confirmation + Cycle Transition

Added explicit transition confirmation operation:

- `confirmCriticalChangeTransition(projectId, userId, role, criticalChangeId, input)`
- HTTP: `POST /projects/:id/adaptive-core/critical-change/:criticalChangeId/transition/confirm`
- input: `idempotencyKey`, `confirmed`, optional `confirmedReentryStep`

`registerCriticalChange()` remains assessment-only and does not apply transitions.

### Atomic transition design

The operation validates the `CriticalChange`, project ownership, source cycle, assessment payload, supported transition, and reentry step before applying side effects.

Within one transaction it:

- records human confirmation (`status = confirmed`, `confirmedById`, `confirmedAt`, `confirmedReentryStep`)
- applies the supported transition
- records final application (`status = applied`, `appliedAt`, `resultingCycleId` when applicable)
- writes provenance events:
  - `critical_change_transition_confirmed`
  - `critical_change_applied`

`AdaptiveAdaptationEvent` remains provenance only.

### same_cycle behavior

For `impact.transition = same_cycle`:

- no new `InitiativeCycle` is created
- confirmed history is not altered
- no global `requiresReview` update is made
- `CriticalChange.resultingCycleId` remains `null`
- `CriticalChange.appliedAt` is set
- progress/audit projection is updated for the current cycle

### new_cycle behavior

For `impact.transition = new_cycle`:

- validates the source cycle belongs to the project and is the operational active cycle
- supersedes the source cycle before creating the next active cycle
- creates exactly one next `InitiativeCycle` with:
  - `cycleNumber = max + 1`
  - `parentCycleId = sourceCycle.id`
  - `basedOnCycleId = null`
  - `triggerType = critical_change`
  - `triggerRefId = CriticalChange.id`
  - `startStep/currentStep = confirmed reentryStep`
  - `status = active`
- does not reactivate historical cycles
- does not copy historical `AdaptiveStepOutput` rows into the new cycle

### CycleStepState semantics

R3-B2A creates the new cycle states explicitly instead of using `ensureStepStatesTx()`.

- steps before reentry that remain valid become `inherited`
- inherited states record `inheritedFromCycleId` and, when available, `inheritedFromOutputId`
- reentry step becomes `active`
- downstream invalidated confirmed steps can become `reopened`
- downstream unconfirmed steps become `pending`
- `historical_only` is not used in R3-B2A

### Reentry configuration and projections

The new cycle creates an `AdaptiveStepConfiguration` scoped to `cycleId + stepNumber`, with version starting inside that scope, and materializes only the initial checkpoint for the reentry step.

After new-cycle application:

- `InitiativeCycle.currentStep = reentryStep`
- `Project.currentStep = reentryStep`
- `InitiativePortfolioMeta.currentStep = Step N`
- `AdaptiveProgressSignal.cycleId = newCycle.id`
- `AdaptiveProgressSignal.stepNumber = reentryStep`

### Idempotency and validation

Retrying an already applied transition returns the current persisted state without creating duplicate cycles, transitions, active cycles, or `CriticalChange` rows.

Rejected in R3-B2A:

- cross-project `CriticalChange`
- non-confirmable `CriticalChange` status
- reentry step mismatch
- source cycle not operational
- second active cycle conflict
- `derived_initiative_recommended`
- `return_to_prior_direction`

### Tests

Added:

- `critical-change-same-cycle.test.ts`
- `critical-change-new-cycle.test.ts`
- `critical-change-transition-idempotency.test.ts`

Validation run:

- R3-B2A focused tests: 3 files, 5 tests PASS
- R3-B1 + R3-B2A focused tests: 6 files, 12 tests PASS
- Adaptive Core/R3-A/R2 persistence regression set: 11 files PASS, 110 tests PASS, R2 persistence e2e skipped by env
- `prisma validate` with explicit `DATABASE_URL`: PASS
- `prisma generate`: PASS
- `typecheck:backend`: blocked by existing out-of-scope `LOG_REDACT_PATHS` logger-redaction issue
- `npm test`: backend ran; 687 passed, 9 skipped, 1 unrelated out-of-scope failure in `backend/shared/utils/__tests__/logger-redaction.test.ts`

### Known remaining work

- R3-B2B: `return_to_prior_direction`
- R3-B3: return/history and derived initiative lifecycle
- Decision Center
- governance/DecisionAuthority
- frontend redesign

R3-B2A GO.

Do not declare full R3-B GO yet.

## R3-B2B — Persistence + Transition Integrity

### Same-cycle reentry semantics fix

Corrected the R3-B2A reentry interpretation:

- affected step is not treated as reentry step
- `same_cycle` no longer falls back to `earliestAffectedStep`
- `same_cycle` no longer falls back to Step 0
- when `impact.reentryStep = null`, `confirmedReentryStep` stays `null`
- `input.confirmedReentryStep` is rejected for same-cycle assessments without explicit reentry
- `new_cycle` still requires an assessed reentry step and the confirmed value must match it

### PostgreSQL E2E

Added real PostgreSQL coverage:

- `backend/modules/adaptive-core/__tests__/critical-change-transition.e2e.test.ts`

The test uses the existing `R2_PERSISTENCE_E2E=1` gate and the disposable E2E database on:

- `postgresql://postgres:postgres@localhost:55433/starteria_e2e`

The E2E database was provisioned through the existing harness:

- `npm run db:e2e:provision`

### Persistent reload

The E2E creates a new `AdaptiveCoreService` with a fresh `PrismaClient` after transition application.

Verified after reload:

- same-cycle keeps the same operational cycle
- new-cycle resolves Cycle2 as operational
- `currentStep = 2`
- Cycle1 configurations/checkpoints/outputs are not loaded as current state
- no Cycle1 outputs are mixed into Cycle2 state

### Selective inheritance

Verified for new-cycle Step 2 reentry:

- Step0 `inherited`
- Step1 `inherited`
- Step2 `active`
- Step3 `pending`
- Step4 `pending`
- inherited states persist `inheritedFromCycleId`
- inherited states persist `inheritedFromOutputId` when the source confirmed output exists

### Selective reopened

Added DB coverage where source Cycle1 has Step3 confirmed and a Step2 material change invalidates downstream work.

Verified Cycle2:

- Step0 `inherited`
- Step1 `inherited`
- Step2 `active`
- Step3 `reopened`
- Step4 `pending`

Step4 is not automatically reopened without a confirmed source/invalidation condition.

### Concurrent idempotency

Hardened transition application with PostgreSQL row locking on `CriticalChange`:

- `SELECT id FROM "CriticalChange" WHERE id = $1 FOR UPDATE`

This keeps `CriticalChange` as the aggregate/authority that serializes transition application.

Concurrent E2E result:

- both confirmation calls fulfilled
- exactly 2 cycles total: Cycle1 + Cycle2
- exactly 1 active cycle
- exactly 1 cycle with `triggerRefId = CriticalChange.id`
- `CriticalChange.resultingCycleId` points to that Cycle2
- no duplicate reentry configuration
- no duplicate reentry checkpoint

### Projection integrity

Verified after new-cycle transition and reload:

- `Project.currentStep = 2`
- `InitiativeCycle.currentStep = 2`
- `InitiativePortfolioMeta.currentStep = "Step 2"`
- `AdaptiveProgressSignal.cycleId = Cycle2.id`
- `AdaptiveProgressSignal.stepNumber = 2`

Frontend remains non-authoritative for projections.

### R2 persistence regression

Executed real PostgreSQL R2 persistence E2E:

- `r2-persistence.e2e.test.ts`: 4 tests PASS
- covers Claim/Evidence/Validation persistence, checkpoint evidence policy, step confirmation, persistent reload, and negative no-write paths

Executed real PostgreSQL R3-A DB invariant E2E:

- `cycle-database-invariants.e2e.test.ts`: 2 tests PASS
- DB invariant still rejects a second active cycle

### DB race discovered/fixed

Discovered risk: two concurrent confirmations could both observe `assessment_ready` before either transition completed.

Fix: lock the `CriticalChange` row inside the transaction before re-reading and applying side effects. If the first transaction has already applied the transition, the second returns idempotently from persisted state.

### Validation run

- R3-B2A/B2B unit focused tests: 3 files, 6 tests PASS
- R3-B1 + R3-B2A/B2B focused tests: 6 files, 13 tests PASS
- R3-B2B PostgreSQL E2E: 1 file, 5 tests PASS
- R2 persistence PostgreSQL E2E: 1 file, 4 tests PASS
- R3-A database invariants PostgreSQL E2E: 1 file, 2 tests PASS
- `prisma validate` with E2E `DATABASE_URL`: PASS
- `prisma generate` with E2E `DATABASE_URL`: PASS
- `typecheck:backend`: blocked by existing out-of-scope `LOG_REDACT_PATHS` logger-redaction issue
- `npm test`: backend ran; 688 passed, 14 skipped, 1 unrelated out-of-scope failure in `backend/shared/utils/__tests__/logger-redaction.test.ts`

### Known remaining R3-B3 work

- `return_to_prior_direction`
- derived initiative lifecycle
- Decision Center
- governance/DecisionAuthority
- frontend redesign

R3-B2B GO.

Do not declare full R3-B GO yet.

## R3-B3 - Return to Prior Direction

### Return is not rollback

Implemented `return_to_prior_direction` as a forward transition that always creates a new operational cycle.

The previous direction is never reactivated, restored as active, deleted, or treated as a literal rollback snapshot. Historical cycles remain historical.

### A -> B -> A'

The implemented lifecycle is:

- Cycle1 represents direction A
- Cycle2 represents direction B
- return confirmation creates Cycle3 as A'

Cycle3 is a new iteration based on a prior direction plus later learning. No historical `AdaptiveStepOutput` rows are copied into Cycle3.

### Parent vs basedOn semantics

For return transitions:

- `parentCycleId` is the cycle being superseded by the transition
- `basedOnCycleId` is the historical cycle whose direction is being revisited

Example:

- Cycle3.`parentCycleId` = Cycle2.id
- Cycle3.`basedOnCycleId` = Cycle1.id
- Cycle3.`triggerType` = `return_to_prior_direction`
- Cycle3.`triggerRefId` = CriticalChange.id

### Operation and input

Extended the existing explicit confirmation operation:

- `confirmCriticalChangeTransition(projectId, userId, role, criticalChangeId, input)`

Return input now accepts:

- `idempotencyKey`
- `confirmed`
- `basedOnCycleId`
- `confirmedReentryStep`

`basedOnCycleId` is required only for `return_to_prior_direction`. Supplying it for a non-return transition is rejected instead of silently reinterpreting the transition.

`registerCriticalChange()` can now create an assessment with:

- `transition = return_to_prior_direction`
- `basedOnCycleId`
- `reentryStep`

The backend validates the explicit historical cycle. It does not ask AI or frontend projection to invent one.

### Inheritance provenance

Cycle3 step states are created explicitly:

- steps before reentry are `inherited`
- reentry step is `active`
- downstream steps are `pending` or `reopened` according to the impact result and source confirmation state

`Cycle3.basedOnCycleId` is conceptual direction provenance.

`CycleStepState.inheritedFromCycleId` and `inheritedFromOutputId` are exact contract provenance. If the source state was already inherited, the previous provenance is carried forward instead of forcing every inherited contract to come from `basedOnCycleId`.

No output JSON is copied.

### Persistence and reload

PostgreSQL E2E verifies that after Cycle3 is created:

- exactly one active cycle remains
- fresh `PrismaClient` + fresh `AdaptiveCoreService` reload resolves Cycle3
- current step remains the confirmed reentry step
- Cycle1 and Cycle2 outputs remain historical and are not loaded as current outputs

### Concurrency

Return confirmation uses the same `CriticalChange` row lock strategy added in R3-B2B.

Concurrent confirmation over the same return CriticalChange resolves coherently:

- one Cycle3 only
- one active cycle
- one cycle with `triggerRefId = CriticalChange.id`
- stable `CriticalChange.resultingCycleId`

### Cross-project and invalid basedOn rejection

PostgreSQL E2E verifies rejection before mutation for:

- missing `basedOnCycleId`
- current active cycle as `basedOnCycleId`
- other-project cycle as `basedOnCycleId`
- nonexistent `basedOnCycleId`
- `basedOnCycleId` supplied to a non-return transition

Historical cycles are not reactivated or mutated to active.

### Tests

Extended:

- `critical-change-transition.e2e.test.ts`
- `critical-change-user-outcome.test.ts`

Validation run:

- R3-B focused unit tests: 6 files, 14 tests PASS
- R3-B3 PostgreSQL transition E2E: 1 file, 8 tests PASS
- R2 persistence PostgreSQL E2E: 1 file, 4 tests PASS
- R3-A database invariants PostgreSQL E2E: 1 file, 2 tests PASS
- R3-B2B transition PostgreSQL E2E rerun: 1 file, 8 tests PASS
- `prisma validate` with E2E `DATABASE_URL`: PASS
- `prisma generate` with E2E `DATABASE_URL`: PASS
- `typecheck:backend`: blocked by existing out-of-scope `LOG_REDACT_PATHS` logger-redaction issue
- `npm test`: backend ran; 689 passed, 17 skipped, 1 unrelated out-of-scope failure in `backend/shared/utils/__tests__/logger-redaction.test.ts`

### Remaining boundary

- derived initiative recommendation only remains outside R3-B3
- Derived Initiative lifecycle remains out of scope
- Decision Center remains out of scope
- governance/DecisionAuthority remains out of scope
- frontend redesign remains out of scope

R3-B3 GO.

Do not declare full R3-B GO automatically.

## R3-B3 Review Fix - A Prime Semantics

### Finding confirmation

Confirmed the blocking finding: the return transition created correct genealogy for A -> B -> A', but the Cycle3 reentry configuration was built from historical context plus provenance without explicitly applying the current CriticalChange value over that historical context.

That could represent a literal A restoration in configuration state even though cycle lineage said A'.

### Code fix

Updated `applyCriticalChangeReturnToPriorDirectionTx()` so Cycle3 context is built as:

- fallback configuration preferably from `basedOnCycle`
- historical `sourceContextJson`
- current `CriticalChange.field` and `CriticalChange.nextValueJson` applied over that historical context
- return provenance added afterward

Also normalized `selected_bet` critical-change application so `{ selectedBet: value }` updates the canonical `step2Output.selectedBet` value instead of nesting the whole object.

### A' configuration semantics

Cycle3 now represents:

- historical direction as input/basis
- explicit current user change applied over that basis
- return provenance referencing both the historical cycle and source cycle

Cycle3 is A', not literal A.

### Historical immutability

PostgreSQL E2E verifies:

- Cycle1 confirmed Step2 output remains A
- Cycle2 confirmed Step2 output remains B
- Cycle2 Step2 configuration remains B
- Cycle3 has no copied `AdaptiveStepOutput`
- Cycle3 Step2 `sourceContextJson.step2Output.selectedBet` is A'
- Cycle3 Step2 `configurationJson` contains the A' reentry context
- Cycle3 return provenance references Cycle1, Cycle2, and the CriticalChange

### ensureInitialized reentry-cycle regression

Added regression coverage for an operational cycle with:

- `startStep = 2`
- `currentStep = 2`
- only Step2 active configuration

`ensureInitialized()` now recognizes the cycle as initialized:

- no Step0 configuration is created
- no duplicate Step2 configuration is created
- currentStep remains 2
- active cycle remains unchanged

Ordinary Cycle1 initialization still creates/recognizes Step0 normally.

### Validation run

- R3-B3 PostgreSQL transition E2E: 1 file, 8 tests PASS
- R2 persistence PostgreSQL E2E: 1 file, 4 tests PASS
- R3-A database invariants PostgreSQL E2E: 1 file, 2 tests PASS
- ensureInitialized + user outcome unit tests: 2 files, 5 tests PASS
- R3-B2A/B2B transition unit tests: 3 files, 6 tests PASS

R3-B3 FINAL GO.

Do not declare full R3-B GO automatically.
