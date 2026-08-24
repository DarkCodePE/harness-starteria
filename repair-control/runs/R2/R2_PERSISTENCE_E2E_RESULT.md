# R2 Persistence / Integration E2E Result

## 1. Environment

- Worktree: `C:\Users\User\proyect-starteria\Dashboardstarteria-repair-r2`
- Branch: `repair/mvp-r2-steps-checkpoints`
- HEAD: `7568fe8`
- Frontend package root: `front/`
- Test runner: Vitest backend/frontend configs from `front/package.json`
- Prisma Client: generated with `npm.cmd run db:generate`

## 2. DB/harness used

- Harness: existing repo Vitest backend integration harness plus Prisma real client.
- New verification spec: `backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts`
- Existing DB scripts used:
  - `npm.cmd run db:e2e:provision`
  - `front/scripts/database/provision-e2e-database.ts`
  - `front/scripts/database/run-prisma-for-disposable-db.ts`
- DB: PostgreSQL disposable database `starteria_e2e`.
- URL: `postgresql://postgres:postgres@localhost:55433/starteria_e2e`
- Migrations: existing 17 migrations applied with `prisma migrate deploy`.
- Seed: existing `front/prisma/seed.e2e.ts`.
- No new migrations created.

## 3. Commit/base/worktree

- Base/HEAD: `7568fe8`
- Branch verified: `repair/mvp-r2-steps-checkpoints`
- Worktree contains accumulated Patch 1-4 changes plus verification-only additions for this gate.
- No commit, push or merge performed.

## 4. Test scenarios

- Created persistent test `User` and `Project` records.
- Initialized Adaptive Core through `AdaptiveCoreService.ensureInitialized`/checkpoint confirmation path.
- Persisted Step 0 completion, Step 1 activation, Step 1 Truth-gated checkpoint completion, Step 1 output draft, human Step 1 confirmation, Step 2 config and CP-2.1 materialization.
- Continued persisted progression through Step 2, Step 3 and Step 4 representative evidence checkpoints.
- Used `TruthService` to persist `SourceRef`, `TruthClaim`, `Evidence` and human `TruthValidation`.

## 5. Commands

- `npm.cmd run db:generate` PASS.
- `npm.cmd run db:e2e:provision` PASS.
- `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:55433/starteria_e2e'; $env:R2_PERSISTENCE_E2E='1'; npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts` PASS: 1 file, 4 tests.
- `npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/adaptive-core.service.test.ts ../backend/modules/adaptive-core/__tests__/checkpoint-evidence-policy.test.ts ../backend/modules/truth/__tests__/truth.service.test.ts` PASS: 3 files, 125 tests.
- `npm.cmd run test:front` PASS: full frontend suite.
- `npm.cmd run test:front -- --reporter=basic 2>&1 | Select-String -Pattern 'Test Files|Tests'` produced summary: 46 files, 297 tests passed; wrapper returned non-authoritative exit 1 due stream filtering, not test failure.
- `npm.cmd run typecheck:front` PASS.
- `npm.cmd run typecheck:backend` FAIL: known baseline `LOG_REDACT_PATHS` export missing.
- `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:55433/starteria_e2e'; $env:TRUTH_DB_INTEGRATION='1'; npm.cmd run test:backend -- ../backend/modules/truth/__tests__/truth.persistence.integration.test.ts` PASS: 1 file, 1 test.

## 6. Results

- R2 persistence E2E passed against real PostgreSQL.
- R2 backend regression suite passed.
- Frontend authority regression remained green in full frontend suite.
- R1 Truth persistence integration passed.
- Backend typecheck remains blocked by pre-existing unrelated `LOG_REDACT_PATHS` baseline.

## 7. DB assertions

- Negative CP-1.3 attempts left CP-1.3 `ready`/`in_progress`.
- Negative CP-1.3 attempts did not create `AdaptiveCheckpointResponse`.
- Negative CP-1.3 attempts did not materialize CP-1.4.
- Negative CP-1.3 attempts did not create Step 1 draft output.
- Positive CP-1.3 persisted canonical `truthBindings`.
- CP-1.4 materialized exactly once after supported Truth binding.
- Step 1 confirmed output persisted status `confirmed`.
- Step 2 configuration and CP-2.1 materialized exactly once.
- Step 2/4 negative evidence-reference attempts did not write response or next checkpoint.

## 8. Negative-path evidence

- CP-1.3 no `truthBindings`: blocked with `CHECKPOINT_TRUTH_BINDING_REQUIRED`.
- CP-1.3 fake `evidence-1`: blocked; no response/progression persisted.
- CP-1.3 fake SourceRef URL/string: blocked; no response/progression persisted.
- CP-1.3 cross-project binding: blocked as non-local Truth object.
- CP-1.3 contradicted claim: blocked with `CHECKPOINT_CLAIM_CONTRADICTED`.
- CP-1.3 insufficient claim: blocked with `CHECKPOINT_CLAIM_INSUFFICIENT`.
- CP-2.2 fake evidence/source refs: blocked with `TRUTH_REFERENCE_EVIDENCE_NOT_FOUND`.
- CP-4.2 fake evidence/source refs: blocked with `TRUTH_REFERENCE_EVIDENCE_NOT_FOUND`.
- Edited Step 1 `brief` could not elevate stored `truthReadiness` or contractual `sufficiency`.

## 9. Positive-path evidence

- Persistent `SourceRef -> TruthClaim -> Evidence -> human TruthValidation supported` allowed CP-1.3.
- CP-1.4 draft output preserved real `claimId`, `evidenceIds`, `sourceRefIds`, `verificationState: supported`, `satisfiesValidatedSupport: true`.
- Step 2 evidence-reference checkpoint accepted persistent Evidence/SourceRef.
- CP-3.3 accepted persistent contradicted Evidence/SourceRef as evidence reference, without requiring validated support.
- Step 4 evidence-reference checkpoint accepted persistent Evidence/SourceRef.

## 10. Reload evidence

- Fresh `PrismaClient` reload after CP-1.3 returned active CP-1.4.
- Fresh reload after CP-1.4 retained Step 1 draft and Truth provenance.
- Fresh reload after Step 1 confirmation returned active CP-2.1 and progress signal carrying persisted Truth readiness.
- Fresh reload after CP-3.3 returned active CP-3.4 and CP-3.3 status `completed`.
- Fresh reload after CP-4.2 returned active CP-4.3.

## 11. Idempotency evidence

- Repeated `confirmStep1Output()` with the same idempotency key did not duplicate Step 2 configuration.
- Repeated `confirmStep1Output()` with the same idempotency key did not duplicate CP-2.1.
- Repeated `confirmStep1Output()` with the same idempotency key did not duplicate the step completion event.

## 12. Step-transition evidence

- CP-1.4 completion produced a Step 1 draft but did not activate Step 2.
- Step 2 activated only after human `confirmStep1Output()`.
- Step 2 final checkpoint produced Step 2 draft but did not activate Step 3.
- Step 3 activated only after human `confirmStep2Output()`.
- Step 3 final checkpoint produced Step 3 draft but did not activate Step 4.
- Step 4 activated only after human `confirmStep3Output()`.

## 13. Frontend-authority regression

- Full frontend suite passed.
- Patch 4 authority tests remained green:
  - backend Adaptive GET success uses server Core.
  - backend Adaptive GET failure does not promote reconstructed local core to operational authority.
  - retry promotes loaded server Core to authoritative journey.

## 14. Known unrelated baseline failures

- `npm.cmd run typecheck:backend` fails at `backend/shared/utils/__tests__/logger-redaction.test.ts(2,10)` because `LOG_REDACT_PATHS` is not exported from `../logger`.
- This is the known unrelated baseline and was not fixed in this gate.
- Frontend tests emit existing React `act(...)` and ref warnings in unrelated Initiative Review/autofill areas; tests pass.
- `docker compose ... up -d postgres` initially failed because port `55433` was already allocated; `Test-NetConnection localhost:55433` succeeded and `db:e2e:provision` worked against the existing disposable DB listener.

## 15. Open R2 defects, if any

- No R2 persistence/integration defect found by this gate.

## 16. Gate verdict

R2 PERSISTENCE E2E PASS
