# R3-B Schema Alignment Audit

## 1. Verdict

FIX REQUIRED.

The clean disposable PostgreSQL database provisioned from migrations only does not match the current `schema.prisma`.

R3-B runtime/contractual behavior remains validated, but R3-B cannot receive clean FINAL GO until migration/schema drift is resolved or explicitly accepted with a documented corrective plan.

## 2. Reproduction Method

Disposable database:

- `postgresql://postgres:postgres@localhost:55433/starteria_e2e`

Clean reproduction steps:

1. `npm run db:e2e:provision`
   - Recreated only allowed disposable database `starteria_e2e`.
   - Applied 19 migrations from zero.
   - `migrate status` inside provision reported database schema up to date.
2. `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e npm run db:e2e:status`
   - Result: `Database schema is up to date!`
3. `npx prisma migrate diff --from-url postgresql://postgres:postgres@localhost:55433/starteria_e2e --to-schema-datamodel prisma/schema.prisma --script`
   - Result: non-empty drift.

Complete SQL drift:

```sql
-- DropIndex
DROP INDEX "AdaptiveProgressSignal_cycleId_idx";

-- DropIndex
DROP INDEX "PdfFieldProposal_runId_fieldPath_idx";

-- AlterTable
ALTER TABLE "AdaptiveAdaptationEvent" ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "payloadJson" SET NOT NULL;

-- AlterTable
ALTER TABLE "CriticalChange" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CycleStepState" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InitiativeCycle" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PilotLead" ADD COLUMN     "proposal" JSONB;

-- CreateTable
CREATE TABLE "PilotClaimToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pilotLeadId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotClaimToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PilotClaimToken_tokenHash_key" ON "PilotClaimToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PilotClaimToken_pilotLeadId_idx" ON "PilotClaimToken"("pilotLeadId");

-- CreateIndex
CREATE INDEX "PilotClaimToken_expiresAt_idx" ON "PilotClaimToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PdfFieldProposal_runId_fieldPath_key" ON "PdfFieldProposal"("runId", "fieldPath");

-- RenameIndex
ALTER INDEX "AdaptiveCheckpointInstance_cycleId_stepConfigurationId_checkpoi" RENAME TO "AdaptiveCheckpointInstance_cycleId_stepConfigurationId_chec_key";
```

Human-readable diff:

- Added table: `PilotClaimToken`
- Changed `AdaptiveAdaptationEvent.summary`: Required -> Nullable
- Changed `AdaptiveAdaptationEvent.payloadJson`: Nullable -> Required
- Renamed `AdaptiveCheckpointInstance` cycle/checkpoint unique index
- Removed `AdaptiveProgressSignal(cycleId)` index
- Changed `CriticalChange.updatedAt` default from `Some(Now)` to `None`
- Changed `CycleStepState.updatedAt` default from `Some(Now)` to `None`
- Changed `InitiativeCycle.updatedAt` default from `Some(Now)` to `None`
- Changed `PdfFieldProposal(runId, fieldPath)`: remove non-unique index, add unique index
- Added `PilotLead.proposal`

Clean DB reproduces the drift: YES.

## 3. Complete Drift Matrix

| # | Difference | Object/table | DB state | schema.prisma state | Migration that created DB state | Git origin if determinable | R3-related? | Intentional? | Class | Action required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Drop index requested by diff | `AdaptiveProgressSignal_cycleId_idx` | DB has index on `cycleId` | Schema has `cycleId` relation but no `@@index([cycleId])` on `AdaptiveProgressSignal` | `20260816120000_r3a_cycle_foundation` | Current R3 work; schema diff shows R3 added `cycleId` but not index | Yes | Likely intentional/useful in migration | A | Schema-only fix: add `@@index([cycleId])` or document DB-only index; prefer schema alignment |
| 2 | Rename unique index requested by diff | `AdaptiveCheckpointInstance` | DB index name is PostgreSQL-truncated `AdaptiveCheckpointInstance_cycleId_stepConfigurationId_checkpoi` | Prisma expects `AdaptiveCheckpointInstance_cycleId_stepConfigurationId_chec_key` | `20260816120000_r3a_cycle_foundation` | Current R3 work | Yes | Accidental manual long index-name mismatch | A/C | Prefer schema map to DB name or additive migration to rename index; no runtime semantic change |
| 3 | Drop default requested by diff | `InitiativeCycle.updatedAt` | DB column has `DEFAULT CURRENT_TIMESTAMP` | `updatedAt DateTime @updatedAt`, no DB default | `20260816120000_r3a_cycle_foundation` | Current R3 work | Yes | Probably accidental from manual SQL template | A | Additive migration to drop DB default, or schema add `@default(now())`; prefer align with repo convention |
| 4 | Drop default requested by diff | `CycleStepState.updatedAt` | DB column has `DEFAULT CURRENT_TIMESTAMP` | `updatedAt DateTime @updatedAt`, no DB default | `20260816120000_r3a_cycle_foundation` | Current R3 work | Yes | Probably accidental from manual SQL template | A | Same as #3 |
| 5 | Drop default requested by diff | `CriticalChange.updatedAt` | DB column has `DEFAULT CURRENT_TIMESTAMP` | `updatedAt DateTime @updatedAt`, no DB default | `20260817120000_r3b1_critical_change_assessment` | Current R3 work | Yes | Probably accidental from manual SQL template | A | Same as #3 |
| 6 | Alter nullability | `AdaptiveAdaptationEvent.summary` | DB `summary TEXT NOT NULL` | Schema `summary String?` | `20260729120000_adaptive_core_step0_cycle` | Not in current `git diff`; pre-existing before R3 changes | No | Unknown | B | Separate legacy cleanup; either schema required or additive migration nullable |
| 7 | Alter nullability | `AdaptiveAdaptationEvent.payloadJson` | DB `payloadJson JSONB` nullable | Schema `payloadJson Json` required | `20260729120000_adaptive_core_step0_cycle` | Not in current `git diff`; pre-existing before R3 changes | No | Unknown | B | Separate legacy cleanup; choose DB/schema authority |
| 8 | Add column requested by diff | `PilotLead.proposal` | DB lacks column | Schema has `proposal Json?` | `20260529120000_add_pilot_lead` created table without proposal; no later migration found | Not in current `git diff`; git history points to pilot-leads/public-pilot era | No | Schema intent appears documented in comments | B/D | Separate legacy additive migration for `PilotLead.proposal` |
| 9 | Create table requested by diff | `PilotClaimToken` | DB lacks table | Schema has model | No migration found | Not in current `git diff`; comments reference ADR-018 | No | Schema intent appears documented | B/D | Separate legacy additive migration for table |
| 10 | Create unique index requested by diff | `PilotClaimToken.tokenHash` | DB lacks table/index | Schema has `@unique` | No migration found | Same as #9 | No | Intentional if table is kept | B/D | Same migration as #9 |
| 11 | Create index requested by diff | `PilotClaimToken.pilotLeadId` | DB lacks table/index | Schema has `@@index([pilotLeadId])` | No migration found | Same as #9 | No | Intentional if table is kept | B/D | Same migration as #9 |
| 12 | Create index requested by diff | `PilotClaimToken.expiresAt` | DB lacks table/index | Schema has `@@index([expiresAt])` | No migration found | Same as #9 | No | Intentional if table is kept | B/D | Same migration as #9 |
| 13 | Drop non-unique index requested by diff | `PdfFieldProposal_runId_fieldPath_idx` | DB has non-unique index | Schema does not declare it | `20260519000000_pdf_autofill` | Not in current `git diff`; pre-existing PDF autofill drift | No | Unknown | B | Separate legacy cleanup |
| 14 | Add unique index requested by diff | `PdfFieldProposal(runId, fieldPath)` | DB lacks unique constraint | Schema has `@@unique([runId, fieldPath])` | No matching migration found after PDF autofill | Not in current `git diff`; pre-existing PDF autofill drift | No | Schema intent likely idempotency/uniqueness | B/D | Separate legacy additive migration after data duplicate audit |

## 4. R3-Specific Drift

R3-related drift count: 5.

### InitiativeCycle

Schema:

- `updatedAt DateTime @updatedAt`
- `@@unique([projectId, cycleNumber])`
- `@@index([projectId])`
- `@@index([projectId, status])`

Migration:

- Creates `updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
- Creates unique `InitiativeCycle_projectId_cycleNumber_key`
- Creates partial unique `InitiativeCycle_one_active_per_project_key`
- Creates indexes on `projectId` and `projectId,status`
- FK `projectId` cascade; parent/basedOn set null

Drift:

- DB default on `updatedAt` is extra relative to Prisma schema.
- Partial unique one-active index is intentional DB-only because Prisma cannot express PostgreSQL partial unique indexes.

### CycleStepState

Schema:

- `updatedAt DateTime @updatedAt`
- `@@unique([cycleId, stepNumber])`
- `@@index([cycleId])`
- `@@index([cycleId, stepNumber])`

Migration:

- Creates `updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
- Creates same unique/indexes.

Drift:

- DB default on `updatedAt` is extra relative to Prisma schema.

### CriticalChange

Schema:

- `updatedAt DateTime @updatedAt`
- `idempotencyKey String @unique`
- indexes on project/source/result/basedOn/status

Migration:

- Creates `updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
- Creates same idempotency unique and indexes.
- Source FK restrict, result/basedOn set null.

Drift:

- DB default on `updatedAt` is extra relative to Prisma schema.

### AdaptiveStepConfiguration

Schema and R3-A migration agree on:

- required `cycleId`
- cycle FK cascade
- `@@unique([cycleId, stepNumber, version])`
- indexes on projectId, cycleId, cycleId+stepNumber, projectId+stepNumber+status

No drift item reported.

### AdaptiveCheckpointInstance

Schema and migration agree semantically on:

- required `cycleId`
- cycle FK cascade
- uniqueness over cycleId + stepConfigurationId + checkpointKey
- indexes on projectId, cycleId, cycleId+stepNumber, projectId+status

Drift:

- Index name differs because the manual migration name exceeds PostgreSQL identifier limits and the live DB stores a truncated name. The difference is naming-only, but reproducible.

### AdaptiveStepOutput

Schema and R3-A migration agree on:

- required `cycleId`
- cycle FK cascade
- `@@unique([cycleId, stepNumber, version])`
- indexes on projectId, cycleId, cycleId+stepNumber, projectId+stepNumber+status

No drift item reported.

### AdaptiveProgressSignal

Schema:

- nullable `cycleId`
- cycle relation set null
- no `@@index([cycleId])`

Migration:

- adds nullable `cycleId`
- FK set null
- creates `AdaptiveProgressSignal_cycleId_idx`

Drift:

- DB has useful lookup index not represented in Prisma schema.

## 5. Pre-existing Drift

Pre-existing/non-R3 drift count: 9 drift items.

Evidence:

- None of these objects appear in the current `git diff -- front/prisma/schema.prisma`.
- They are present in the working schema before current R3 additions or in older migration eras.

Items:

- `AdaptiveAdaptationEvent.summary` nullable in schema but required in DB.
- `AdaptiveAdaptationEvent.payloadJson` required in schema but nullable in DB.
- `PilotLead.proposal` exists in schema but has no applied migration.
- `PilotClaimToken` model exists in schema but has no applied migration.
- `PilotClaimToken` unique/indexes derive from missing table.
- `PdfFieldProposal(runId, fieldPath)` is unique in schema but only non-unique indexed in DB.
- The old `PdfFieldProposal_runId_fieldPath_idx` exists in DB but schema expects a unique index.

These should not be bundled into R3 repair unless the release process requires global schema cleanliness.

## 6. Prisma @updatedAt Analysis

Prisma semantics:

- `@updatedAt` is Prisma Client managed.
- It updates the field when Prisma performs an update.
- It is not equivalent to a database-level `DEFAULT CURRENT_TIMESTAMP`.

Observed convention:

- The schema consistently uses `updatedAt DateTime @updatedAt` without `@default(now())` across many models.
- Earlier SQL migrations often create `updatedAt TIMESTAMP(3) NOT NULL` without default.
- The R3 manual migrations created `updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` on new R3 tables.

Verdict:

- This is real schema/migration drift, not merely an expected Prisma representation difference.
- It is low runtime risk because inserts through Prisma provide values, but it keeps `migrate diff` non-empty.

Recommended remediation:

- Prefer additive corrective migration to drop defaults from R3 `updatedAt` columns, matching established schema convention.
- Alternative schema-only fix would add `@default(now()) @updatedAt`, but that would deviate from the repo convention and should be chosen only deliberately.

## 7. Index Analysis

### AdaptiveProgressSignal(cycleId)

Migration creates:

- `CREATE INDEX "AdaptiveProgressSignal_cycleId_idx" ON "AdaptiveProgressSignal"("cycleId");`

Schema has:

- `cycleId String?`
- relation to `InitiativeCycle`
- no `@@index([cycleId])`

Verdict:

- The index is intentional/useful because R3-B projections assert and query progress by operational cycle.
- Do not drop the DB index as the diff script suggests.
- Preferred fix: schema-only alignment by adding `@@index([cycleId])` to `AdaptiveProgressSignal`.

### AdaptiveCheckpointInstance unique index name

Migration attempted:

- `AdaptiveCheckpointInstance_cycleId_stepConfigurationId_checkpointKey_key`

Live DB reports:

- `AdaptiveCheckpointInstance_cycleId_stepConfigurationId_checkpoi`

Prisma diff expects:

- `AdaptiveCheckpointInstance_cycleId_stepConfigurationId_chec_key`

Verdict:

- Naming drift only; uniqueness semantics are intact.
- Cause is PostgreSQL identifier length truncation from a manually named long index.
- Preferred fix: add a Prisma `map:` name matching the live DB, or use an additive migration to rename the index to Prisma's expected shorter name. This should be decided once naming policy is chosen.

## 8. Migration Immutability

Commands:

- `git diff -- front/prisma/migrations/20260816120000_r3a_cycle_foundation/migration.sql front/prisma/migrations/20260817120000_r3b1_critical_change_assessment/migration.sql`
- Result: no tracked diff output.

Important nuance:

- Both R3 migration files are currently untracked in this worktree.
- Git cannot prove post-creation immutability until they are tracked.
- The files were not edited during this audit.

## 9. Minimal Remediation Plan

Recommended sequence:

1. R3 schema-only fix:
   - Add `@@index([cycleId])` to `AdaptiveProgressSignal`.

2. R3 additive corrective migration:
   - Drop DB defaults from:
     - `InitiativeCycle.updatedAt`
     - `CycleStepState.updatedAt`
     - `CriticalChange.updatedAt`
   - Resolve `AdaptiveCheckpointInstance` index name either by:
     - schema `map:` to live DB name, or
     - additive `ALTER INDEX ... RENAME TO ...`.

3. Separate legacy drift remediation:
   - `PilotLead.proposal` additive migration.
   - `PilotClaimToken` additive migration.
   - `PdfFieldProposal(runId, fieldPath)` duplicate-data audit, then unique index migration.
   - `AdaptiveAdaptationEvent` nullability decision and additive migration/schema correction.

Do not edit historical migrations unless the team explicitly decides these untracked R3 migrations are still in draft and should be regenerated before commit. Once tracked/shared, use additive corrections.

## 10. Recommendation

R3-B can receive FINAL GO after option C plus a limited schema-only alignment:

- B) schema-only fix for `AdaptiveProgressSignal @@index([cycleId])`, and possibly index `map:` if that naming route is chosen.
- C) additive migration for R3 `updatedAt` defaults and/or index rename.

Legacy drift should be handled separately unless release policy requires global `migrate diff` cleanliness before R3-B close.

If the release gate is only R3 contractual runtime behavior, R3-B behavior is already green. If the release gate requires clean migration/schema diff, R3-B remains GO WITH FIXES until the alignment pass is implemented.

## 11. R3 Alignment Fix Result

Verdict: R3-specific schema/migration alignment is CLEAN.

The fix was intentionally limited to R3-owned objects. The R3-A and R3-B1 migration files are still untracked draft migrations in this worktree, so this pre-commit alignment pass corrected those draft migrations in place instead of adding a corrective migration that would only undo unshared draft mistakes. No older tracked migration was edited.

Exact R3 corrections:

- `AdaptiveProgressSignal(cycleId)` index: kept the intentional DB index from R3-A and added `@@index([cycleId])` to `schema.prisma`.
- `AdaptiveCheckpointInstance` unique index: gave the existing unique constraint a stable short mapped name, `ACI_cycle_config_checkpoint_key`, in both schema and the R3-A draft migration. Columns remain `cycleId`, `stepConfigurationId`, `checkpointKey`.
- `InitiativeCycle.updatedAt`: removed accidental `DEFAULT CURRENT_TIMESTAMP` from the R3-A draft migration; schema remains `updatedAt DateTime @updatedAt`.
- `CycleStepState.updatedAt`: removed accidental `DEFAULT CURRENT_TIMESTAMP` from the R3-A draft migration; schema remains `updatedAt DateTime @updatedAt`.
- `CriticalChange.updatedAt`: removed accidental `DEFAULT CURRENT_TIMESTAMP` from the R3-B1 draft migration; schema remains `updatedAt DateTime @updatedAt`.

Drift counts:

- Before: 14 total / 5 R3-related / 9 legacy.
- After clean reprovision: 9 total / 0 R3-related / 9 legacy.

Clean reprovision method:

- `npm run db:e2e:provision`: PASS. The disposable `starteria_e2e` database was recreated from migrations and seeded.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e npm run db:e2e:status`: PASS. Prisma reports 19 migrations applied and database schema up to date.
- `npx prisma migrate diff --from-url postgresql://postgres:postgres@localhost:55433/starteria_e2e --to-schema-datamodel prisma/schema.prisma --script`: PASS. Remaining diff contains only legacy/non-R3 objects.

Complete remaining drift:

```sql
-- DropIndex
DROP INDEX "PdfFieldProposal_runId_fieldPath_idx";

-- AlterTable
ALTER TABLE "AdaptiveAdaptationEvent" ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "payloadJson" SET NOT NULL;

-- AlterTable
ALTER TABLE "PilotLead" ADD COLUMN     "proposal" JSONB;

-- CreateTable
CREATE TABLE "PilotClaimToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pilotLeadId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotClaimToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PilotClaimToken_tokenHash_key" ON "PilotClaimToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PilotClaimToken_pilotLeadId_idx" ON "PilotClaimToken"("pilotLeadId");

-- CreateIndex
CREATE INDEX "PilotClaimToken_expiresAt_idx" ON "PilotClaimToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PdfFieldProposal_runId_fieldPath_key" ON "PdfFieldProposal"("runId", "fieldPath");
```

Confirmation: no legacy drift was modified in this pass. `AdaptiveAdaptationEvent`, `PilotLead`, `PilotClaimToken`, and `PdfFieldProposal` remain a separate repository-wide legacy alignment problem.

Regression evidence after clean reprovision:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm run test:backend -- ../backend/modules/adaptive-core/__tests__/critical-change-transition.e2e.test.ts`: PASS, 1 file, 8 tests.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm run test:backend -- ../backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts`: PASS, 1 file, 4 tests.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm run test:backend -- ../backend/modules/adaptive-core/__tests__/cycle-database-invariants.e2e.test.ts`: PASS, 1 file, 2 tests.
- R3-B focused unit set: PASS, 10 files, 22 tests.
- `npx prisma validate --schema prisma/schema.prisma`: PASS.
- `npx prisma generate --schema prisma/schema.prisma`: PASS.
- `npm test`: informational FAIL only in known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts`; 80 files passed, 6 skipped, 1 failed; 690 tests passed, 17 skipped, 1 failed.

Recommendation: R3-B can receive FINAL GO on R3-specific schema/migration alignment. Do not label the repository-wide Prisma state globally clean until the documented legacy drift is remediated separately.
