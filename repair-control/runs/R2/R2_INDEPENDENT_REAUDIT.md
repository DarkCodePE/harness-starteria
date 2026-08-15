# R2 Independent Reaudit

## 1. Audit scope

Scope: R2 Steps / Checkpoints only, against worktree `C:\Users\User\proyect-starteria\Dashboardstarteria-repair-r2`.

Out of scope by instruction: R3 Decision Center, R4 Import/Portfolio except scope leakage, MVP GO declaration, product repairs, commits, push, merge.

## 2. Inputs reviewed

- `repair-control/R2_STEPS_CHECKPOINTS.md`
- `repair-control/R2_CODEX_IMPLEMENTATION_PROMPT.md`
- `repair-control/runs/R2/R2_PERSISTENCE_E2E_RESULT.md`
- Full worktree diff against base `7568fe8afe152212b30910af0eb5b019f3b31bdb`
- Backend Adaptive Core, Truth service, checkpoint policy, R2 unit tests, R2 persistence E2E spec
- Frontend Adaptive authority files and Step 0 through Step 4 pages

## 3. Base/branch/worktree

- Expected branch: `repair/mvp-r2-steps-checkpoints`
- Observed branch: `repair/mvp-r2-steps-checkpoints`
- Base original R1: `7568fe8afe152212b30910af0eb5b019f3b31bdb`
- Observed `HEAD`: `7568fe8afe152212b30910af0eb5b019f3b31bdb`
- Worktree contains uncommitted tracked and untracked R2 patch files.
- Git emitted warnings reading `C:\Users\User/.config/git/ignore`; this did not prevent diff/status inspection.

## 4. Diff reviewed

Reviewed tracked diff stat against base:

```text
13 files changed, 2026 insertions(+), 192 deletions(-)
```

Tracked modified areas include Adaptive Core service/schema/tests, Truth service/tests, frontend Adaptive authority pages/tests, and Adaptive journey domain. Untracked R2 files include the checkpoint evidence policy, policy test, persistence E2E spec, R2 control docs, R2 run reports, and frontend Adaptive authority page tests.

## 5. Root cause verdicts

- RC-STEP-01: Backend checkpoint validation is no longer merely structural for evidence-sensitive checkpoints. Backend closure evidence is strong.
- RC-STEP-02: Not fully closed. Frontend still has productive legacy/AppContext progression paths that can unlock or mark steps complete independent of persisted backend Adaptive Core.
- RC-EVID-02: Backend Evidence/Truth governance is materially closed for checked backend paths.
- GP-B: Backend path reaches L3-style persistence/gating, but end-to-end product closure is blocked by frontend authority bypasses.

## 6. Truth invariants

Backend audit result: PASS for service-level invariants.

Evidence:

- `backend/modules/truth/truth.service.ts` keeps Claim, Evidence, SourceRef, and Validation as separate persisted concepts.
- `evaluateValidatedSupportBinding(projectId, input)` requires real `claimId`, `evidenceIds`, and `sourceRefIds`.
- Cross-project Claim/Evidence/SourceRef IDs are rejected through same-project Prisma lookups.
- Supported readiness requires `verificationState === 'supported'`.
- Contradicted, insufficient, missing, or unvalidated claims do not satisfy CP-1.3 validated support.
- Evidence for supported claim must target the bound claim, include a bound SourceRef, and have `truthStatus === 'supports'`.
- No new parallel Truth authority was found.

## 7. Checkpoint policy audit

Backend audit result: PASS.

`backend/modules/adaptive-core/checkpoint-evidence-policy.ts` defines:

- `CP-1.3`: `validated_support_required` plus evidence reference and human confirmation.
- Evidence-reference checkpoints: `CP-2.2`, `CP-2.3`, `CP-3.2`, `CP-3.3`, `CP-3.4`, `CP-4.2`, `CP-4.4`.
- Structural-only checkpoints: `CP-2.1`, `CP-2.4`, `CP-2.5`, `CP-3.1`, `CP-3.5`, `CP-4.1`, `CP-4.3`, `CP-4.5`.

`CP-3.3` does not require global validated support. Contradicted or insufficient persisted evidence references can pass reference integrity where policy only requires persistent evidence references.

## 8. Persistence/no-write audit

Backend audit result: PASS for `confirmCheckpoint()`.

Observed order in `backend/modules/adaptive-core/adaptive-core.service.ts`:

1. Load active checkpoint.
2. Run structural evaluation.
3. Run Truth/evidence readiness policy.
4. Normalize policy bindings.
5. Enter transaction and persist response/status/event/next checkpoint or step output.

No route was found in `confirmCheckpoint()` that writes `AdaptiveCheckpointResponse`, completes a checkpoint, creates the next checkpoint, or creates Step output before the readiness gate.

## 9. Step1 provenance audit

Backend audit result: PASS.

Evidence:

- CP-1.3 is located by `checkpointKey`, not response shape.
- Persisted CP-1.3 `truthBindings` are revalidated before Step1 output generation.
- Step1 draft includes real `claimId`, `evidenceIds`, `sourceRefIds`, `verificationState`, and `satisfiesValidatedSupport`.
- `input.brief` in `confirmStep1Output()` cannot elevate `truthReadiness` or contractual sufficiency over the persisted draft.
- Methodological sufficiency and Truth readiness are separated.

## 10. Step transition audit

Backend audit result: PASS for service boundaries, FAIL for product frontend boundaries.

Backend:

- CP-1.4 completion creates Step1 draft but does not activate Step2.
- Step2 activates only through human `confirmStep1Output()`.
- Step2 to Step3 and Step3 to Step4 use analogous human confirmation methods in backend service.

Frontend:

- Product UI still mutates local project step statuses and navigates across Step boundaries outside backend confirmation methods. See findings R2-AUDIT-P1-001 and R2-AUDIT-P1-002.

## 11. Steps 2-4 evidence audit

Backend audit result: PASS.

Evidence reference gates require persistent `evidenceIds` and `sourceRefIds`, same project, and each Evidence sourceRef must be included in the supplied SourceRefs. Free-text values such as `evidence-1`, URLs, filenames, labels, or descriptive text do not satisfy the backend gate.

`CP-3.3` correctly treats contradicted persisted evidence as a valid evidence reference when the policy requires reference integrity rather than validated support.

## 12. Frontend authority audit

Result: FAIL.

Positive observations:

- `front/src/features/adaptive-core/domain/adaptiveJourney.ts` now separates `resolveAuthoritativeAdaptiveCore(serverCore)` from `resolveLegacyAdaptivePreview(project)`.
- Productive `serverAdaptiveCore ?? ensureAdaptiveCoreForProject(...)` usage was not found.
- InitiativeOverview, ProjectHome, and Step0 now load server Adaptive Core with loading/error/retry states for the specific Patch 4 tested surfaces.

Blocking observations:

- `front/src/app/pages/Step1Page.tsx:739-755` updates local `currentStep`, marks Step 1 `Aprobado`, and unlocks Step 2 in AppContext before backend Adaptive confirmation is known to pass.
- `front/src/app/pages/Step1Page.tsx:825-833` attempts CP-1.3 without `truthBindings`; backend should reject under R2, but `front/src/app/pages/Step1Page.tsx:862-874` has already executed the local approval path.
- `front/src/app/pages/ProjectHomePage.tsx:843-847`, `:850-854`, and `:2140-2153` still use local project step status for access/clickability/navigation.
- Step2, Step3, and Step4 contain direct local progression/finalization paths without persisted Adaptive output confirmation. Details are in findings.

## 13. Persistence E2E audit

Report reviewed: `repair-control/runs/R2/R2_PERSISTENCE_E2E_RESULT.md`.

Spec reviewed: `backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts`.

The spec uses real `PrismaClient`, real `AdaptiveCoreService`, real `TruthService`, and PostgreSQL via `DATABASE_URL`; it is gated by `R2_PERSISTENCE_E2E=1` and is not a mock.

Coverage verified:

- CP-1.3 negative no-write paths.
- Supported positive path.
- Provenance persisted in Step1 draft.
- Fresh reload via new Prisma/service reads.
- Idempotent Step1 confirmation.
- Step transition boundaries.
- Evidence reference negatives for Steps 2 and 4.
- CP-3.3 contradicted evidence reference positive.
- Step1 brief spoof protection.

Independent reproduction result:

```text
R2_PERSISTENCE_E2E=1 npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts
PASS: 1 test file, 4 tests
```

## 14. Tests independently executed

Commands executed from `front/` unless noted:

```text
npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/adaptive-core.service.test.ts ../backend/modules/adaptive-core/__tests__/checkpoint-evidence-policy.test.ts ../backend/modules/truth/__tests__/truth.service.test.ts
Result: PASS, 3 files, 125 tests
```

```text
npm.cmd run test:front -- --reporter=dot --silent
Result: PASS, 46 files, 297 tests
```

```text
npm.cmd run typecheck:front
Result: PASS
```

```text
npm.cmd run typecheck:backend
Result: FAIL, ../backend/shared/utils/__tests__/logger-redaction.test.ts(2,10): Module '"../logger"' has no exported member 'LOG_REDACT_PATHS'
```

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts
Result: PASS, 1 file, 4 tests
```

## 15. Findings table

| ID | Severity | Area | Finding | Evidence | Closure impact |
| --- | --- | --- | --- | --- | --- |
| R2-AUDIT-P1-001 | P1 | Frontend authority | Step1 can locally approve and unlock Step2 before backend Adaptive confirmation succeeds. The backend CP-1.3 call from this UI does not send `truthBindings`, so R2 backend should reject it, but local AppContext progression has already been written. | `front/src/app/pages/Step1Page.tsx:739-755`, `:825-833`, `:862-874`; `front/src/app/pages/ProjectHomePage.tsx:843-854`, `:2140-2153` | Blocks R2 closure. Violates backend Adaptive Core as sole operational authority for unlock/progression/current step. |
| R2-AUDIT-P1-002 | P1 | Frontend transition boundary | Step2, Step3, and Step4 still contain local/demo progression paths that mark steps approved, unlock next steps, navigate forward, or finalize the initiative without backend Step output confirmation. | `front/src/app/pages/Step2Page.tsx:3489-3507`; `front/src/app/pages/Step3Page.tsx:803-812`, `:1440-1445`, `:1496-1501`; `front/src/app/pages/Step4Page.tsx:3101-3114` | Blocks R2 closure. Violates separation of checkpoint progression, human Step output confirmation, and next Step activation. |
| R2-AUDIT-P2-001 | P2 | Baseline typecheck debt | Backend typecheck fails on known unrelated logger redaction export drift. | `../backend/shared/utils/__tests__/logger-redaction.test.ts(2,10)` missing `LOG_REDACT_PATHS`; R2 instructions explicitly named this as known baseline candidate and R2 diff did not touch logger redaction. | Does not independently block R2 closure, but regression gate is not fully green. |

## 16. Known baseline debt

- `LOG_REDACT_PATHS` backend typecheck failure remains. I found no R2 product edit that introduced this logger export issue.
- Git warning: unable to access user global git ignore file. This is environment noise, not R2 logic.

## 17. Scope leakage assessment

- No new migrations found.
- No R3 Decision Center implementation changes were audited as in-scope or found as material R2 leakage.
- No R4 Import implementation changes were found as material R2 leakage.
- Portfolio service writes in Adaptive Core appear to be existing projection/sync behavior, not R4 semantic expansion.
- Material issue is not scope leakage; it is incomplete closure of frontend Adaptive authority.

## 18. Final verdict

R2 CLOSURE NO-GO

Reason: There are open P1 findings in product frontend authority and Step transition boundaries. Backend Truth/Evidence/persistence gates are strong and independently reproduced, but R2 cannot close while users can still progress/unlock/complete steps through local AppContext paths that bypass persisted Adaptive Core authority.

## 19. Conditions/debt after closure

Required before R2 closure:

- Remove or operationally disable local AppContext Step approval/unlock/navigation paths for Step1 through Step4.
- Make ProjectHome step access/clickability depend on persisted Adaptive Core authority, not legacy project step statuses.
- Ensure Step1 UI cannot mark Step1 approved or Step2 unlocked when backend CP-1.3/CP-1.4/Step1 confirmation fails.
- Ensure Step2 to Step3, Step3 to Step4, and Step4 finalization require backend Step output confirmation paths.
- Add targeted frontend tests that cover these bypass routes, not only backend-get failure states.

Debt that can remain separate if accepted by project policy:

- Known `LOG_REDACT_PATHS` backend typecheck failure.
- Cleanup of demo UI language and local preview remnants after authority closure.
