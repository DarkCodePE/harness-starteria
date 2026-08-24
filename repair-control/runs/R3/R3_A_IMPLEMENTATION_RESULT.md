# R3-A Implementation Result

## 1. Summary

Implemented R3-A Cycle Foundation as a backend/persistence change. R2 remains the contractual authority for confirmations, checkpoints, evidence policy, Truth readiness, and versioned step outputs. `InitiativeCycle` now contextualizes the current R2 journey.

No Decision Center, canonical Decision domain, CriticalChange canonical entity, derived initiatives, handoff workflow, or frontend cycle authority was implemented.

## 2. Files changed

- `front/prisma/schema.prisma`
- `front/prisma/migrations/20260816120000_r3a_cycle_foundation/migration.sql`
- `backend/modules/adaptive-core/cycle.service.ts`
- `backend/modules/adaptive-core/adaptive-core.service.ts`
- `backend/modules/adaptive-core/adaptive-core.types.ts`
- `backend/modules/adaptive-core/__tests__/cycle.service.test.ts`
- `backend/modules/adaptive-core/__tests__/cycle-initialization.test.ts`
- `backend/modules/adaptive-core/__tests__/cycle-projection.test.ts`
- `backend/modules/adaptive-core/__tests__/cycle-state-loading.test.ts`
- `backend/modules/adaptive-core/__tests__/cycle-database-invariants.e2e.test.ts`
- `backend/modules/adaptive-core/__tests__/cycle-test-utils.ts`
- `backend/modules/adaptive-core/__tests__/adaptive-core.service.test.ts`
- `backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts`
- `backend/shared/utils/logger.ts`

Note: `front/package-lock.json` changed during `npm install` in this workspace; no dependency was intentionally added.

## 3. Prisma changes

Added:

- `CycleStatus`: `active`, `completed`, `superseded`
- `CycleTriggerType`: `initial`, `critical_change`, `decision`, `return_to_prior_direction`
- `CycleStepStateValue`: `inherited`, `confirmed`, `active`, `reopened`, `pending`, `historical_only`
- `InitiativeCycle`
- `CycleStepState`

Made cycle-aware:

- `AdaptiveStepConfiguration.cycleId`
- `AdaptiveCheckpointInstance.cycleId`
- `AdaptiveStepOutput.cycleId`
- `AdaptiveProgressSignal.cycleId?`

## 4. Migration strategy

The migration creates cycle tables/enums first, adds nullable `cycleId` columns, creates/backfills Cycle 1 for existing projects with Adaptive Core state, backfills existing R2 rows, initializes `CycleStepState`, then makes required cycle FKs non-null for configs/checkpoints/outputs.

Uniqueness moved from project-scoped versioning to cycle-scoped versioning:

- `AdaptiveStepConfiguration`: `cycleId + stepNumber + version`
- `AdaptiveStepOutput`: `cycleId + stepNumber + version`
- `AdaptiveCheckpointInstance`: `cycleId + stepConfigurationId + checkpointKey`

PostgreSQL partial unique index enforces one active cycle per project:

- `InitiativeCycle_one_active_per_project_key` where `status = 'active'`

## 5. Backfill result

Cycle 1 backfill preserves existing R2 records and only assigns `cycleId`.

Cycle 1 completion source is backend-contractual:

- Prefer confirmed Step 4 `AdaptiveStepOutput` with `confirmedAt`.
- Otherwise use `Project.status = COMPLETED`.
- Do not use frontend `currentStep` or legacy AppContext as authority.

## 6. Cycle invariants

Implemented:

- One active cycle per project enforced by DB partial unique index.
- `InitiativeCycle.projectId + cycleNumber` unique.
- `CycleStepState.cycleId + stepNumber` unique.
- New Step configurations, checkpoint instances, and outputs require cycle context.
- `AdaptiveStepOutput.version` remains output version inside `cycleId + stepNumber`; it is not cycle number.

`CycleStepStateValue.confirmed` was added because Cycle 1 needs to represent steps confirmed in the same cycle. Using `inherited` for Cycle 1 would incorrectly imply inheritance from a prior cycle.

## 7. R2 compatibility

Preserved:

- Step confirmation methods and output confirmation fields.
- Versioned outputs.
- Checkpoint evidence policy.
- Truth readiness.
- Existing frontend state shape, with optional `cycle` metadata added.
- `Project.currentStep` as projection of active cycle `currentStep`.
- `InitiativePortfolioMeta.currentStep` and `AdaptiveProgressSignal.stepNumber` through the shared projection/update path.

## 8. Tests executed

- `npx.cmd prisma validate`: PASS
- `npm.cmd run typecheck:backend`: PASS
- `npm.cmd run typecheck`: PASS
- Focused R3-A + evidence tests: 5 files, 11 tests PASS
- `adaptive-core.service.test.ts`: 91 tests PASS
- `r2-persistence.e2e.test.ts` with PostgreSQL and `R2_PERSISTENCE_E2E=1`: 4 tests PASS
- `cycle-database-invariants.e2e.test.ts` with PostgreSQL and `R2_PERSISTENCE_E2E=1`: 2 tests PASS
- `npm.cmd test`: PASS after restoring logger redaction export; backend and frontend suites completed.

## 9. PostgreSQL evidence

Using `docker-compose.e2e.yml` on localhost port `55433`:

- PostgreSQL container started successfully.
- `npm.cmd run db:e2e:provision` applied all 18 migrations, including `20260816120000_r3a_cycle_foundation`.
- Prisma migration status reported: database schema is up to date.
- E2E seed completed.
- R2 persistence E2E passed against `postgresql://postgres:postgres@localhost:55433/starteria_e2e`.
- DB invariant E2E confirmed duplicate active cycle, duplicate `cycleNumber`, and duplicate `CycleStepState` are rejected with `P2002`.

## 10. Regressions

No R2 Adaptive Core regression found in executed tests.

One unrelated existing logger redaction contract was failing because `LOG_REDACT_PATHS` was not exported/configured. Fixed minimally by exporting the redact paths and wiring them into Pino.

## 11. Known debt

- `AdaptiveAdaptationEvent` was not made cycle-authoritative. R3-A keeps it project-scoped to avoid widening Critical Change/Event scope; adding `cycleId?` or `resultingCycleId?` remains an R3-B candidate.
- Historical cycle UX is not implemented.
- Critical Change remains compatibility-scoped and cycle-aware inside the active cycle; it does not create new cycles yet.
- `front/package-lock.json` has npm install metadata churn from dependency installation in this workspace.

## 12. GO / NO-GO recommendation for R3-B

GO for R3-B.

R3-A persisted cycles, made R2 operational state cycle-aware, preserved R2 compatibility, passed PostgreSQL migration and persistence E2E, and enforced the active-cycle DB invariant.
