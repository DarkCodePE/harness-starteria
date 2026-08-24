# R3-B Final Audit

## 1. Executive Result

GO WITH FIXES.

R3-B contractual behavior is GO: CriticalChange assessment, human confirmation, same_cycle, new_cycle, return_to_prior_direction, persistence, reload, concurrency, and projection boundaries are covered and passing.

The audit is not a clean final GO because Prisma migration/schema diff is not empty. The diff includes R3-adjacent differences on cycle tables/indexes/defaults and broader pre-existing schema drift. No code fix was applied during this audit.

## 2. Scope Audited

- CriticalChange lifecycle and transition authority.
- Dependency resolver and impact resolver.
- same_cycle, new_cycle, and return_to_prior_direction service paths.
- Selective CycleStepState inheritance/reopen/pending semantics.
- PostgreSQL persistence, reload, and concurrent confirmation behavior.
- API schemas, controller, and project router.
- Prisma schema plus R3-A and R3-B1 migrations.
- R1/R2/R3-A/R3-B regression evidence.

Out of scope was kept out of scope: R3-C, Decision Center, Derived Initiative lifecycle, governance, frontend redesign.

## 3. Invariant Matrix

| Invariant | Status | Evidence | Test/file | Finding |
|---|---|---|---|---|
| I-01 Confirmed historical AdaptiveStepOutput is never overwritten. | PASS | Step outputs are updated only in active-cycle step confirmation; transition tests assert historical A and B outputs unchanged. | `critical-change-transition.e2e.test.ts`; `adaptive-core.service.ts` | None |
| I-02 Historical output is never copied to a new cycle. | PASS | New-cycle and return E2E assert zero outputs in resulting cycle. | `critical-change-transition.e2e.test.ts` | None |
| I-03 version != cycleNumber. | PASS | Config version scoped by `cycleId+stepNumber`; cycleNumber independently increments by project. | `adaptive-core.service.ts`; `critical-change-transition.e2e.test.ts` | None |
| I-04 Only one active InitiativeCycle per Project. | PASS | Partial unique index exists and E2E rejects second active cycle. | R3-A migration; `cycle-database-invariants.e2e.test.ts` | None |
| I-05 Retry/concurrent confirmation cannot create duplicate resulting cycle. | PASS | CriticalChange row lock; concurrent new-cycle and return tests produce one resulting cycle. | `critical-change-transition.e2e.test.ts` | None |
| I-06 CriticalChange is canonical transition authority. | PASS | Confirm operation loads CriticalChange, impactJson, sourceCycle, and writes resultingCycleId/status. | `adaptive-core.service.ts` | None |
| I-07 AdaptiveAdaptationEvent is provenance only. | PASS | Events are written after authority state decisions; no transition reads event as authority. | `adaptive-core.service.ts` | None |
| I-08 assessment_ready != confirmed. | PASS | register persists assessment_ready with null confirmation fields. | `critical-change-idempotency.test.ts`; `adaptive-core.service.ts` | None |
| I-09 confirmed human action occurs before applied. | PASS | confirm operation writes confirmed, records event, applies side effects, then writes applied in same transaction. | `adaptive-core.service.ts`; transition tests | None |
| I-10 same_cycle does not invent reentry. | PASS | same_cycle target_date E2E and unit assert confirmedReentryStep null. | `critical-change-same-cycle.test.ts`; `critical-change-transition.e2e.test.ts` | None |
| I-11 new_cycle starts at earliest invalid confirmed contract. | PASS | selected_bet confirmed Step2 change reenters Step2. | `critical-change-assessment.test.ts`; `critical-change-new-cycle.test.ts`; E2E | None |
| I-12 unaffected valid prior steps become inherited. | PASS | Step0/Step1 inherited before Step2 reentry. | `critical-change-new-cycle.test.ts`; E2E | None |
| I-13 inherited != confirmed. | PASS | New cycle states persist `inherited`, not `confirmed`. | `critical-change-new-cycle.test.ts`; E2E | None |
| I-14 reopened is selective, not global downstream behavior. | PASS | Step3 reopened only when confirmed and invalidated; Step4 remains pending. | `critical-change-transition.e2e.test.ts` | None |
| I-15 pending remains pending when not previously confirmed/invalidated. | PASS | Step3/Step4 pending in default Step2 reentry case. | `critical-change-new-cycle.test.ts`; E2E | None |
| I-16 return creates A', not literal A. | PASS | Review fix applies CriticalChange value over historical context; E2E asserts Cycle3 config/context contains A'. | `adaptive-core.service.ts`; `critical-change-transition.e2e.test.ts` | None |
| I-17 parentCycleId != basedOnCycleId semantics are preserved. | PASS | Return E2E asserts parent=Cycle2 and basedOn=Cycle1. | `critical-change-transition.e2e.test.ts` | None |
| I-18 cross-project source/basedOn inheritance is rejected. | PASS | Cross-project CriticalChange and basedOnCycleId tests reject before mutation. | `critical-change-transition-idempotency.test.ts`; E2E | None |
| I-19 Project.currentStep / Cycle.currentStep / PortfolioMeta.currentStep remain coherent. | PASS | Projection tests and transition E2E assert Step2 coherence. | `cycle-projection.test.ts`; `critical-change-new-cycle.test.ts`; E2E | None |
| I-20 AdaptiveProgressSignal points to operational cycle. | PASS | New-cycle E2E asserts cycleId and stepNumber; upsert uses operational cycle. | `critical-change-transition.e2e.test.ts`; `adaptive-core.service.ts` | None |
| I-21 fresh reload resolves only operational-cycle configs/checkpoints/outputs as current. | PASS | getState filters by operational cycle; E2E reload verifies Cycle2/Cycle3 state isolation. | `cycle-state-loading.test.ts`; `critical-change-transition.e2e.test.ts` | None |
| I-22 R1 Truth semantics untouched. | PASS | R2 persistence E2E and focused unit regression pass. | `r2-persistence.e2e.test.ts`; `adaptive-core.service.test.ts` | None |
| I-23 R2 checkpoint evidence policy untouched. | PASS | Evidence-reference negative paths pass in PostgreSQL. | `r2-persistence.e2e.test.ts`; `checkpoint-evidence-policy.test.ts` | None |
| I-24 R2 Step confirmation authority untouched. | PASS | Step confirmation persistence/reload remains green. | `r2-persistence.e2e.test.ts` | None |
| I-25 AI cannot auto-confirm a material transition. | PASS | register only creates assessment; confirm route requires `confirmed=true`. | `adaptive-core.service.ts`; `critical-change-idempotency.test.ts` | None |
| I-26 frontend cannot authorize/create transition state. | PASS | Router exposes assessment and explicit confirm only; service validates impact and source. | `project.router.ts`; `adaptive-core.controller.ts`; `adaptive-core.service.ts` | None |
| I-27 ensureInitialized does not recreate Step0 on reentry cycle. | PASS | Review regression covers Step2-only active config. | `cycle-initialization.test.ts` | None |
| I-28 ordinary initial Cycle1 still initializes Step0 correctly. | PASS | Cycle1 initialization tests pass. | `cycle-initialization.test.ts` | None |
| I-29 derived_initiative_recommended cannot silently become new_cycle. | PASS | Confirm rejects derived recommendation. | `critical-change-transition-idempotency.test.ts`; `adaptive-core.service.ts` | None |
| I-30 return_to_prior_direction requires explicit human-selected historical cycle. | PASS | basedOn required, current/other/missing rejected. | `critical-change-transition.e2e.test.ts`; `adaptive-core.service.ts` | None |

## 4. Architecture Review

### CriticalChange

CriticalChange is the aggregate and authority for R3-B transitions. `registerCriticalChange()` creates `assessment_ready` only; confirmation fields remain null. `confirmCriticalChangeTransition()` is the only path that moves a CriticalChange through human confirmation and applied state.

### DependencyResolver

`critical-change-dependency.resolver.ts` cleanly separates potentially affected steps from invalidation. It maps legacy fields as required:

- `selected_bet -> solution`
- `hypothesis -> hypothesis`
- `scope -> focus`
- `challenge_type -> challenge`
- `target_date -> execution`

Contextual fields are conservative and do not regress to the legacy `selected_bet ? Step2 : Step0` behavior.

### ImpactResolver

`critical-change-impact.resolver.ts` separates affected, confirmed affected, material, and transition recommendation. Draft/unconfirmed changes stay `same_cycle`. `target_date` stays same-cycle by default. Identity changes produce `derived_initiative_recommended` only.

### Cycle Transition

Material transition side effects occur inside a transaction. The operation locks the CriticalChange row before rereading and applying side effects. same_cycle updates audit/projection only; new_cycle and return create a new active cycle and supersede the source cycle.

### Selective Reentry

CycleStepState creation is explicit. Before reentry, valid preserved steps become inherited. Reentry is active. Downstream states are reopened only when impact says so and the source had a confirmed contract; otherwise they remain pending.

### Return A -> B -> A'

Return never reactivates or restores the historical cycle. Cycle3 has parentCycleId=Cycle2 and basedOnCycleId=Cycle1. Review fix verified Cycle3 applies the explicit current change over the historical basis, so configuration represents A'.

### Persistence / Reload

`getState()` resolves operational cycle and filters configs, checkpoints, and outputs by cycleId. PostgreSQL E2E reload verifies historical cycle data is not loaded as current state.

### Concurrency

Concurrent transition confirmation serializes on CriticalChange with PostgreSQL row locking. Retried/applied transitions return persisted current state.

### UX Projection Boundary

User-facing outcome projection is non-authoritative. Events and projection payloads explain the transition, but service state and CriticalChange remain authority.

## 5. Prisma / Migration Review

Validated:

- R3-A one-active-cycle partial unique index is present in migration.
- `InitiativeCycle(projectId, cycleNumber)` uniqueness is present.
- `CycleStepState(cycleId, stepNumber)` uniqueness is present.
- Config/checkpoint/output uniqueness is cycle-scoped.
- `CriticalChange.idempotencyKey` uniqueness is present.
- Source CriticalChange FK is `ON DELETE RESTRICT`; resulting/basedOn are `SET NULL`.
- R3-A migration file has no tracked diff in this worktree.

Finding:

- Prisma migrate diff from the provisioned E2E database to the current schema is not empty. R3-adjacent drift includes `updatedAt` default differences for `CriticalChange`, `CycleStepState`, `InitiativeCycle`, and an `AdaptiveProgressSignal.cycleId` index present in migration/DB but not represented in Prisma schema. The diff also reports broader non-R3 schema drift: `PilotClaimToken`, `PilotLead.proposal`, `PdfFieldProposal` uniqueness, and `AdaptiveAdaptationEvent` nullability.

Verdict: schema validates and generated client succeeds, but migration/schema alignment needs review before a clean final release close.

## 6. API Authority Review

- `POST /:id/adaptive-core/critical-change` remains assessment-only.
- `POST /:id/adaptive-core/critical-change/:criticalChangeId/transition/confirm` is the only explicit transition confirmation route.
- No direct route creates InitiativeCycle.
- `basedOnCycleId` is schema-accepted but service-valid only for return.
- Return requires explicit basedOn and reentry step.
- Non-return with basedOn is rejected.
- No client input can force a transition inconsistent with `impactJson`; service validates the persisted impact transition.

## 7. Regression Evidence

Commands executed:

- `npm run test:backend -- ../backend/modules/adaptive-core/__tests__/critical-change-assessment.test.ts ../backend/modules/adaptive-core/__tests__/critical-change-idempotency.test.ts ../backend/modules/adaptive-core/__tests__/critical-change-user-outcome.test.ts ../backend/modules/adaptive-core/__tests__/critical-change-same-cycle.test.ts ../backend/modules/adaptive-core/__tests__/critical-change-new-cycle.test.ts ../backend/modules/adaptive-core/__tests__/critical-change-transition-idempotency.test.ts ../backend/modules/adaptive-core/__tests__/cycle-initialization.test.ts ../backend/modules/adaptive-core/__tests__/cycle-projection.test.ts ../backend/modules/adaptive-core/__tests__/cycle-state-loading.test.ts ../backend/modules/adaptive-core/__tests__/cycle.service.test.ts`: PASS, 10 files, 22 tests.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm run test:backend -- ../backend/modules/adaptive-core/__tests__/critical-change-transition.e2e.test.ts`: PASS, 1 file, 8 tests.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm run test:backend -- ../backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts`: PASS, 1 file, 4 tests.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm run test:backend -- ../backend/modules/adaptive-core/__tests__/cycle-database-invariants.e2e.test.ts`: PASS, 1 file, 2 tests.
- `npx prisma validate --schema prisma/schema.prisma`: PASS.
- `npx prisma generate --schema prisma/schema.prisma`: PASS.
- `npm test`: informational FAIL only in known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts`; 690 passed, 17 skipped, 1 failed.

PostgreSQL evidence includes same_cycle, new_cycle, selective reopened, A -> B -> A', persistent reload, concurrent transition, cross-project rejection, one active cycle, and R2 persistence.

## 8. Findings

### BLOCKING

None.

### HIGH

F-01 - Prisma migration/schema drift is not empty.

- File: `front/prisma/schema.prisma`; `front/prisma/migrations/*`
- Behavior: `prisma migrate diff --from-url postgresql://postgres:postgres@localhost:55433/starteria_e2e --to-schema-datamodel prisma/schema.prisma` reports differences between provisioned database and schema.
- Violated invariant: database/migration audit requirement, not one of I-01 through I-30.
- Minimal recommended fix: perform a dedicated migration/schema alignment pass. Decide whether DB-only indexes/defaults are intentional, add missing migrations for schema-only objects where needed, or update Prisma schema to represent intended DB state. Do not bundle that with R3-C.

### MEDIUM

None.

### LOW

None.

Known out-of-scope issue: global `npm test` still fails on `backend/shared/utils/__tests__/logger-redaction.test.ts` because `LOG_REDACT_PATHS` is undefined. This was explicitly excluded from the R3-B audit fix scope.

## 9. Remaining Intentional Scope

These are not R3-B gaps:

- Derived Initiative lifecycle
- organizational Decision
- DecisionReadiness
- DecisionAuthority
- governance
- Decision Center
- frontend redesign

## 10. Final Recommendation

R3-B contractual behavior is ready.

Final recommendation is GO WITH FIXES because the mandatory Prisma/migration audit found non-empty schema drift. Do not implement R3-C or product expansion before deciding how to handle the migration/schema alignment finding.

## 11. R3-Specific Schema Alignment Result

R3-specific migration/schema alignment = CLEAN.

The R3-only alignment pass corrected the untracked draft R3 migrations and schema representation for:

- `AdaptiveProgressSignal(cycleId)` index.
- `AdaptiveCheckpointInstance(cycleId, stepConfigurationId, checkpointKey)` unique index name.
- `InitiativeCycle.updatedAt`, `CycleStepState.updatedAt`, and `CriticalChange.updatedAt` DB defaults.

Clean reprovision from migrations now produces 9 remaining drift items, all legacy/non-R3:

- `AdaptiveAdaptationEvent.summary`
- `AdaptiveAdaptationEvent.payloadJson`
- `PilotLead.proposal`
- `PilotClaimToken`
- `PdfFieldProposal(runId, fieldPath)` index/unique mismatch

No remaining diff references R3-owned objects:

- `InitiativeCycle`
- `CycleStepState`
- `CriticalChange`
- `AdaptiveStepConfiguration`
- `AdaptiveCheckpointInstance`
- `AdaptiveStepOutput`
- `AdaptiveProgressSignal`

PostgreSQL regression after clean reprovision:

- `critical-change-transition.e2e.test.ts`: PASS, 8 tests.
- `r2-persistence.e2e.test.ts`: PASS, 4 tests.
- `cycle-database-invariants.e2e.test.ts`: PASS, 2 tests.

Prisma validation:

- `prisma validate`: PASS.
- `prisma generate`: PASS.

Final recommendation update: R3-B FINAL GO.

Precise schema statement: R3-specific schema/migration alignment is clean. Repository-wide legacy drift remains separate.
