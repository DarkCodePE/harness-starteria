# R1 - Truth Foundation Implementation Result

## A. Baseline

- Baseline audited original: `5ff32f9`
- Starting SHA for this implementation run: `bf8596dc7d141c63ec186a815edbc63ce9306db9`
- Branch: `repair/mvp-r1-truth-foundation`
- R0 state: `R0 READY WITH PRODUCT FAILURES`
- Known baseline product failure preserved: `backend/shared/utils/__tests__/logger-redaction.test.ts` expects `LOG_REDACT_PATHS`, but `backend/shared/utils/logger` does not export it.

## B. Current-state Mapping

- Prisma `Evidence`: EXTEND. Existing object was upload/file lifecycle (`UPLOADED`, `VERIFIED`, `REJECTED`) with project/user/step references, but no durable source/provenance, target claim, or support/contradiction semantics.
- `PdfFieldProposal.provenance`: REUSE. Existing PDF proposal provenance remains intact; R1 adds `SourceRef`/Evidence fields that can reference that provenance without replacing proposal flow.
- `ContextSource`: REUSE. Existing source semantics for company/initiative context remain a provenance source candidate.
- Adaptive Core checkpoint responses/outputs/events: REUSE. Existing evidence refs and contradictions remain in Adaptive Core JSON; R1 does not replace checkpoint instances.
- `InitiativePortfolioMeta.mainBlocker`: EXTEND/DEPRECATE-AS-TRUTH. It remains a projection/string cache, but confirmed blockers now belong in durable `AttentionItem`.
- `syncInitiativeProgress`: REUSE. Not replaced; no contract change.
- Copilot ledger, `ProposedAction`, `ActionPlan`, `ActionExecutor`, `CreateStrategicFront`: REUSE. No replacement.
- Portfolio provider fixture fallback: EXTEND. Explicit demo data remains available through `enableDemoData`; authenticated primary hydration no longer swallows child API failures into fixture/local truth.
- Claim: BUILD as `TruthClaim`.
- Source/provenance: BUILD as `SourceRef`, while reusing PDF/Context source concepts.
- Validation: BUILD as `TruthValidation`.
- AttentionItem/Blocker: BUILD as `AttentionItem`.
- ImpactStatus: BUILD minimal as `ImpactAssertion.status`.

## C. Changes

- Modified:
  - `front/prisma/schema.prisma`
  - `backend/app.ts`
  - `front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx`
  - `front/src/features/portfolio-lead/context/__tests__/PortfolioLeadContext.hydration.test.tsx`
- Added:
  - `front/prisma/migrations/20260810090000_r1_truth_foundation/migration.sql`
  - `backend/modules/truth/truth.schemas.ts`
  - `backend/modules/truth/truth.service.ts`
  - `backend/modules/truth/truth.controller.ts`
  - `backend/modules/truth/truth.router.ts`
  - `backend/modules/truth/__tests__/truth.service.test.ts`
- Migration:
  - Adds enums: `SourceRefType`, `TruthClaimVerificationState`, `TruthEvidenceStatus`, `TruthValidationResult`, `TruthValidatorType`, `AttentionItemStatus`, `AttentionItemSeverity`, `ImpactStatus`.
  - Adds tables: `SourceRef`, `TruthClaim`, `TruthValidation`, `AttentionItem`, `ImpactAssertion`.
  - Extends `Evidence` with nullable `sourceRefId`, `targetClaimId`, `truthStatus`, `capturedAt`, `excerpt`, `provenance`, `metadataJson`.
  - Defaults/backfill: existing `Evidence` rows remain valid because new columns are nullable; new durable objects start empty.
- API/DTO:
  - Authenticated router mounted at `/api/v1/truth`.
  - Endpoints for source refs, claims, evidence, validations, claim readiness, attention items, and impact assertions.
- Business rules in service:
  - Claims are created `unvalidated`.
  - Evidence requires an existing `SourceRef`.
  - Validation is attributable by actor/type/role/timestamp/version.
  - AI cannot record `supported` validation.
  - Contradicted/insufficient claims do not satisfy validated-support readiness.
  - Attention item resolution requires explicit transition and resolution note.
  - Impact cannot transition directly from `declared`/`estimated` to `realized`.
- Projection/UI:
  - No visual redesign.
  - Portfolio provider no longer catches `listChallenges`/`listInitiatives` failures as empty child arrays during authenticated primary hydration.
  - On primary hydration failure with no explicit demo mode, portfolio state is cleared and logs explicit backend-unavailable state instead of substituting mock truth.

## D. Tests

- `npm run db:generate`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `TEST_ENVIRONMENT_FAILURE`
  - Evidence: PowerShell blocked `npm.ps1` execution policy.
- `npm.cmd run db:generate`
  - Exit code: `0`
  - Result: PASS
  - Evidence: Prisma Client generated with Prisma `6.19.2`.
- `npx.cmd vitest run --config vitest.backend.config.ts backend/modules/truth/__tests__/truth.service.test.ts`
  - Exit code: `0`
  - Result: PASS
  - Evidence: `1 passed`, `18 tests passed`.
- `npx.cmd vitest run --config vitest.backend.config.ts backend/modules/truth/__tests__/truth.persistence.integration.test.ts`
  - Exit code: `0`
  - Result: SKIPPED
  - Classification: `TEST_ENVIRONMENT_FAILURE` for DB-backed execution until `TRUTH_DB_INTEGRATION=1` can run against disposable PostgreSQL.
  - Evidence: `1 skipped`; test exists but was not executed against DB because the disposable DB was unavailable.
- `npx.cmd vitest run --config vitest.front.config.ts src/features/portfolio-lead/context/__tests__/PortfolioLeadContext.hydration.test.tsx`
  - Exit code: `0`
  - Result: PASS
  - Evidence: `1 passed`, `4 tests passed`.
- `npm.cmd run test:backend`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `PRODUCT_FAILURE` baseline, not R1 regression.
  - Evidence: `69 passed | 1 failed | 3 skipped`; `593 passed | 1 failed | 3 skipped`; failure remains `logger-redaction.test.ts`.
- `npm.cmd run test:front`
  - Exit code: `0`
  - Result: PASS
  - Evidence: full frontend suite completed successfully; warnings are existing noisy test warnings.
- `npx.cmd vitest run --config vitest.front.config.ts --reporter=dot`
  - Exit code: `0`
  - Result: PASS
  - Evidence: compact frontend re-run completed successfully; output remained noisy/truncated before final count.
- `npm.cmd run typecheck`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `PRODUCT_FAILURE` baseline, not R1 regression.
  - Evidence: only `TS2305: Module "../logger" has no exported member "LOG_REDACT_PATHS"`.
- `npm.cmd run build`
  - Exit code: `0`
  - Result: PASS
  - Evidence: Vite production build completed; chunk warnings remain.
- `npx.cmd prisma validate`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `TEST_ENVIRONMENT_FAILURE`
  - Evidence: no `DATABASE_URL` in environment.
- `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/starteria_schema_validate'; npx.cmd prisma validate`
  - Exit code: `0`
  - Result: PASS
  - Evidence: schema valid.
- `npm.cmd run db:e2e:migrate`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `TEST_ENVIRONMENT_FAILURE`
  - Evidence: disposable DB `localhost:55433/starteria_e2e` unavailable (`P1001`).
- `npm.cmd run db:e2e:provision`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `TEST_ENVIRONMENT_FAILURE`
  - Evidence: cannot reach database server at `localhost:55433`.
- `npm.cmd run db:e2e:status`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `TEST_ENVIRONMENT_FAILURE`
  - Evidence: disposable DB `localhost:55433/starteria_e2e` unavailable (`P1001`).
- `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
  - Exit code: `1`
  - Result: FAIL
  - Classification: `TEST_ENVIRONMENT_FAILURE`
  - Evidence: access denied loading Docker config / permission denied connecting to Docker API.

## E. E2E Evidence

- Scenario A - User claim without evidence: `TruthService.createClaim` stores `verificationState: unvalidated`; `getClaimReadiness` returns `satisfiesValidatedSupport: false`.
- Scenario B - Supporting evidence: `attachEvidence` requires `sourceRefId`; `recordValidation` stores validator id/type/role/rationale/version and updates claim to `supported`.
- Scenario C - Contradiction: contradicted evidence keeps `truthStatus: contradicts`; validation result `contradicted` makes readiness false.
- Scenario D - Confirmed blocker: `createAttentionItem` persists blocker; `listAttentionItems` reloads it; `resolveAttentionItem` requires explicit `resolutionNote` and refuses double-close.
- Scenario E - Backend failure in pilot mode: `PortfolioLeadProvider` test verifies backend child-call failure leaves primary portfolio counts at `0/0/0` and does not call downstream/fixture substitution.

## F. TRUTH Mapping

- TRUTH-001: IMPLEMENTED. Claims are `TruthClaim`; creation never marks validated.
- TRUTH-002: IMPLEMENTED. Evidence requires `SourceRef` and stores provenance fields.
- TRUTH-003: IMPLEMENTED. `TruthValidation` stores `validatedById`, `validatorType`, `validatorRole`, `validatedAt`, `version`, `rationale`.
- TRUTH-004: IMPLEMENTED. Service rejects AI `supported` validation.
- TRUTH-005: IMPLEMENTED. `getClaimReadiness` only returns true for `supported`; contradicted/insufficient remain false.
- TRUTH-006: IMPLEMENTED. Evidence creation requires existing source; portfolio primary failure does not invent mock truth.
- TRUTH-007: IMPLEMENTED. `AttentionItem` is persisted and queryable by project.
- TRUTH-008: IMPLEMENTED. Closing attention item requires explicit resolve/cancel transition with note.
- TRUTH-009: PARTIAL. R1-relevant portfolio primary hydration no longer silently falls back on child failure; other pilot surfaces still require later audit.
- TRUTH-010: IMPLEMENTED. `ImpactStatus` separates declared/estimated/validated/realized and service blocks direct realized promotion.

## G. Regressions

- New regressions detected: none in executed tests.
- Baseline failures that remain:
  - `backend/shared/utils/__tests__/logger-redaction.test.ts`
  - Backend typecheck import error for `LOG_REDACT_PATHS`
- Baseline failures resolved incidentally: none.

## H. Remaining Gaps

- Migration deploy was not exercised because disposable PostgreSQL was unavailable.
- R1 does not wire Adaptive Core gates to `TruthClaim` readiness yet; that belongs to R2/R3.
- Existing Adaptive Core evidence refs remain JSON references; R1 provides the durable target layer but does not backfill historic refs.
- `InitiativePortfolioMeta.mainBlocker` still exists as projection/cache text; future blocks should consume `AttentionItem`.
- Other mock/fallback surfaces outside the touched portfolio primary hydration need independent audit before any guardrail is declared PASS.

## I. Deviations

- Used `npm.cmd` for required npm commands after direct `npm` was blocked by Windows PowerShell execution policy. Command intent is equivalent; failures are documented.
- Could not prove `migrate deploy` against disposable DB because `localhost:55433` was not running. Schema validation and client generation passed.
- No UI redesign was performed; only fallback behavior and tests changed.

## J. Reaudit Targets

- `CTRL-EVID-001`
- `CTRL-DATA-001`
- `CTRL-AI-004`
- `CTRL-AI-005`
- `CTRL-BLOCK-001`
- `CTRL-IMPACT-001`
- `EVID-001`
- `EVID-002`
- `EVID-003`
- `EVID-004`
- `EVID-005`

These IDs are impacted and require independent reaudit. They are not declared PASS here.

## K. Review Fix Pass

### Scope statement

This pass fixes only post-implementation R1 integrity gaps. It does not expand R1 into R2/R3/R4 and does not declare audit IDs PASS.

### REVIEW-01 - Referential integrity of TruthValidation

- What was wrong: `TruthValidation.projectId` and `TruthValidation.evidenceId` were scalar fields without Prisma relations/FKs. The service resolved some IDs, but the database could still store orphan validations.
- What changed:
  - Added Prisma relation `TruthValidation.project -> Project`.
  - Added Prisma relation `TruthValidation.evidence -> Evidence`.
  - Added migration `20260810120000_r1_truth_integrity_review_fix` to add FKs and remove invalid pre-existing R1 validation rows before constraints are applied.
  - Service now resolves evidence with source and target claim before recording validation.
- Files:
  - `front/prisma/schema.prisma`
  - `front/prisma/migrations/20260810120000_r1_truth_integrity_review_fix/migration.sql`
  - `backend/modules/truth/truth.service.ts`
  - `backend/modules/truth/__tests__/truth.service.test.ts`
- Evidence:
  - `npx.cmd vitest run --config vitest.backend.config.ts backend/modules/truth/__tests__/truth.service.test.ts` passed 18/18.
  - `npx.cmd prisma validate` passed with dummy `DATABASE_URL`.
- Blocker:
  - FK behavior was not proven by `migrate deploy` on disposable PostgreSQL because `localhost:55433` was unavailable.

### REVIEW-02 - supported requires coherent evidence

- What was wrong: `supported` could be recorded when IDs existed, without enforcing real evidence/source/claim coherence.
- What changed:
  - `supported` now requires a real project Claim, real Evidence in the same project, Evidence linked to the Claim, real SourceRef/provenance, Evidence status `supports`, and an authorized human/system_rule validator.
  - Validation source is derived from the Evidence SourceRef; mismatched explicit `sourceRefId` is rejected.
- Tests added:
  - supported without evidence -> reject.
  - supported with evidence from another claim -> reject.
  - supported with evidence from another project -> reject.
  - supported with `contradicts` evidence -> reject.
  - supported with missing SourceRef -> reject.

### REVIEW-03 - AI is not validation authority

- What was wrong: only AI `supported` was rejected; AI could still record final `contradicted` or `insufficient` states and update `TruthClaim.verificationState`.
- What changed:
  - AI validator operations are rejected for all final states: `supported`, `contradicted`, `insufficient`.
  - AI may only persist non-authoritative assessment-like records through `result: unvalidated`; final truth transitions require `human` or `system_rule`.
- Decision:
  - R1 keeps `TruthValidatorType.ai` to represent analysis/provenance, but not final authorized claim truth.
- Test added:
  - AI `contradicted` final validation -> reject.

### REVIEW-04 - ImpactStatus cannot validate with arbitrary ID

- What was wrong: `transitionImpact(... validated ...)` required a string `validationId`, but did not resolve a real coherent `TruthValidation`.
- What changed:
  - Transition to `validated` resolves a real `TruthValidation` in the same project.
  - The validation must be `supported`.
  - When `ImpactAssertion.claimId` exists, the validation must target the same Claim.
  - The validation must still have real Claim, Evidence, SourceRef and supporting Evidence.
  - Transition to `realized` requires previous `validated` state and revalidates the persisted/current validation.
  - Added Prisma relations/FKs for `ImpactAssertion.claimId`, `sourceRefId`, and `validationId`.
- Tests added:
  - random validationId -> reject.
  - validation from another project -> reject.
  - contradicted validation -> reject.
  - coherent supported validation -> allow.
  - realized with missing persisted validation -> reject.

### REVIEW-05 - Weak references

- `TruthClaim.currentValidationId`: changed to RELATION/FK to `TruthValidation`, with `onDelete: SetNull` because it is a current-state pointer, not the validation history owner.
- `TruthClaim.sourceRefsJson`: kept as explicit snapshot JSON only; added `TruthClaimSourceRef` relational join table for validated source references and backfill from valid existing JSON values.
- `ImpactAssertion.claimId`: changed to RELATION/FK to `TruthClaim`, `onDelete: Restrict`.
- `ImpactAssertion.sourceRefId`: changed to RELATION/FK to `SourceRef`, `onDelete: Restrict`.
- `ImpactAssertion.validationId`: changed to RELATION/FK to `TruthValidation`, `onDelete: Restrict`, plus service coherence checks.
- `Evidence.sourceRefId`, `TruthValidation.sourceRefId`, and `TruthValidation.evidenceId`: changed to restrictive FK behavior for truth/provenance references so deleting source/evidence cannot silently remove traceability from an apparently validated record.
- Justification for remaining JSON: `sourceRefsJson` is retained as a historical snapshot/audit payload, not as the authoritative relation.

### REVIEW-06 - Real migration

- Existing scripts inspected:
  - `db:e2e:provision` -> `scripts/database/provision-e2e-database.ts`
  - `db:e2e:migrate` -> `scripts/database/run-prisma-for-disposable-db.ts e2e migrate deploy`
  - `db:e2e:status` -> `scripts/database/run-prisma-for-disposable-db.ts e2e migrate status`
- Commands executed:
  - `npm.cmd run db:e2e:provision` -> FAIL, `TEST_ENVIRONMENT_FAILURE`, cannot reach `localhost:55433`.
  - `npm.cmd run db:e2e:migrate` -> FAIL, `TEST_ENVIRONMENT_FAILURE`, Prisma `P1001`.
  - `npm.cmd run db:e2e:status` -> FAIL, `TEST_ENVIRONMENT_FAILURE`, Prisma `P1001`.
  - `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"` -> FAIL, `TEST_ENVIRONMENT_FAILURE`, Docker config/API permission denied.
- Integration test added:
  - `backend/modules/truth/__tests__/truth.persistence.integration.test.ts`
  - It verifies refresh/read of Claim/Evidence/Validation/AttentionItem against real Prisma when `TRUTH_DB_INTEGRATION=1`.
- Blocker:
  - No DB-backed proof exists in this environment. Any prior wording implying R1 E2E DB persistence proof should be read as unit/mock service evidence unless a disposable PostgreSQL run is later completed.

### REVIEW-07 - No Prisma model casts with as any

- What was wrong: `TruthService` used `(this.prisma as any).truthClaim`, `.truthValidation`, `.attentionItem`, `.impactAssertion`, and `.sourceRef`.
- What changed:
  - Removed R1 model-level `as any` from `backend/modules/truth/truth.service.ts`.
  - Prisma Client now typechecks model names, relation includes, creates and updates.
  - Remaining casts in the service are limited to Prisma JSON payload boundaries using `Prisma.InputJsonValue`; no model access is hidden behind `any`.
- Evidence:
  - `rg -n "this\\.prisma as any|\\(this\\.prisma as any\\)|as any" backend/modules/truth/truth.service.ts` returns no matches.
  - `npm.cmd run typecheck:backend` now only fails on the known baseline `LOG_REDACT_PATHS` issue.

### Unit/mock tests vs real persistence

- Unit/mock evidence:
  - `truth.service.test.ts` proves service rules and adversarial behavior with an in-memory Prisma-shaped mock.
  - These tests do not prove PostgreSQL FK enforcement or migration deploy.
- Real persistence evidence:
  - Not available in this environment because disposable PostgreSQL/Docker is unavailable.
  - `truth.persistence.integration.test.ts` is present and should be run with:
    - `npm.cmd run db:e2e:provision`
    - `npm.cmd run db:e2e:migrate`
    - `$env:DATABASE_URL=$env:E2E_DATABASE_URL; $env:TRUTH_DB_INTEGRATION='1'; npx.cmd vitest run --config vitest.backend.config.ts backend/modules/truth/__tests__/truth.persistence.integration.test.ts`

### Review result for this pass

- REVIEW-01: implemented in schema/service/tests; DB deploy proof blocked.
- REVIEW-02: implemented and unit-tested.
- REVIEW-03: implemented and unit-tested.
- REVIEW-04: implemented and unit-tested.
- REVIEW-05: implemented/documented with relation vs snapshot decisions.
- REVIEW-06: not fully proven; `TEST_ENVIRONMENT_FAILURE` due unavailable disposable PostgreSQL/Docker.
- REVIEW-07: implemented; no R1 Prisma model access remains hidden by `as any`.

## L. DB-backed Closure Evidence

This section supersedes the earlier REVIEW-06 environment blocker.

### Disposable PostgreSQL

Docker Desktop became available and the repository-owned E2E PostgreSQL environment was started using:

`docker-compose.e2e.yml`

Target:

`postgresql://postgres:postgres@localhost:55433/starteria_e2e`

The normal Starteria database on port `5433` was not reused or modified.

### Clean migration proof

Command:

`npm.cmd run db:e2e:provision`

Result:

`PASS`

Evidence:

- disposable database `starteria_e2e` recreated successfully;
- 17 migrations discovered;
- all 17 migrations applied successfully from a clean database;
- `20260810090000_r1_truth_foundation` applied successfully;
- `20260810120000_r1_truth_integrity_review_fix` applied successfully;
- Prisma reported `Database schema is up to date!`;
- E2E seed completed successfully;
- repository table verification completed successfully;
- final harness result: `[db:e2e] OK: starteria_e2e is migrated and seeded.`

### Real persistence integration proof

Environment:

`DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e`

`E2E_DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e`

`TRUTH_DB_INTEGRATION=1`

Command:

`npx.cmd vitest run --config vitest.backend.config.ts backend/modules/truth/__tests__/truth.persistence.integration.test.ts`

Result:

`PASS`

Evidence:

- Test Files: `1 passed (1)`
- Tests: `1 passed (1)`
- No skip
- Test: `persists and refreshes Claim, Evidence, Validation and AttentionItem with coherent relations`

This provides DB-backed evidence that R1 can persist and reload its core truth objects through real Prisma/PostgreSQL relations after applying the complete migration chain.

### REVIEW-06 final status

`REVIEW-06: IMPLEMENTED AND DB-BACKED PROOF PASS`

The previous `TEST_ENVIRONMENT_FAILURE` for disposable PostgreSQL is resolved.

### Final implementation gate

- Domain model: PASS
- Service integrity rules: PASS
- Adversarial unit tests: PASS
- Prisma schema validation: PASS
- Prisma typed model access: PASS
- Clean migration chain: PASS
- Disposable DB seed: PASS
- Real persistence integration: PASS
- Known baseline `LOG_REDACT_PATHS` defect remains outside R1
- No new R1 regression identified in executed suites

Implementation status:

`R1 READY FOR HUMAN DIFF REVIEW`

This is not an audit acceptance and does not declare any audit requirement PASS.
