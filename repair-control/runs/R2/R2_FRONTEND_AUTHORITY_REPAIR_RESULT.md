# R2 Frontend Authority Repair Result

## 1. Findings repaired

- `R2-AUDIT-P1-001`: Step1 local mentor approval no longer marks Step1 approved, advances `currentStep`, or unlocks Step2 before backend Adaptive confirmation succeeds.
- `R2-AUDIT-P1-002`: Step2, Step3, and Step4 local/demo transition paths no longer authorize next-step unlock/navigation/final completion before backend Step output confirmation and refreshed Adaptive Core state.

## 2. Step1 authority behavior

Step1 mentor/local approval now only records descriptive mentor-session state. It does not:

- set Step1 to `Aprobado`;
- elevate `currentStep`;
- unlock Step2;
- navigate forward.

The only Step1 mirror update to legacy AppContext happens after:

1. backend checkpoint progression;
2. `confirmStep1Output(...)`;
3. `getAdaptiveCore(...)`;
4. refreshed Core authorizes Step2.

CP-1.3 still does not fabricate Truth bindings from strings. If the current UI cannot provide persistent Claim/Evidence/SourceRef bindings, backend rejection leaves Step1/Step2 progression blocked.

## 3. Step2 authority behavior

Step2 now loads persisted Adaptive Core and blocks the page while Step2 is not authorized by backend state.

The former mentor/demo path no longer mutates Step2 to approved or Step3 to in-progress directly. It calls `confirmStep2Output(...)`, reloads Adaptive Core, and only mirrors/navigates to Step3 if refreshed Core authorizes Step3.

Backend failure leaves the user on Step2 and shows an error.

## 4. Step3 authority behavior

Step3 now loads persisted Adaptive Core and blocks direct access if backend state is still before Step3.

The former local/demo `aprobarStep3EnContexto` path was removed. Step4 becomes reachable only after `confirmStep3Output(...)` succeeds and refreshed Adaptive Core authorizes Step4.

Backend failure leaves the user on Step3 and shows an error.

## 5. Step4 authority behavior

Step4 now blocks direct access unless persisted Adaptive Core authorizes Step4.

Local Step4 finalization and initiative completion are disabled until `confirmStep4Output(...)` succeeds. After successful backend confirmation, the page reloads Adaptive Core and then allows local completion mirrors where the existing UI still needs them.

## 6. ProjectHome access behavior

ProjectHome no longer uses `project.steps[].status` as operational Step unlock authority.

Operational clickability and navigation now depend on loaded server Adaptive Core via `canNavigateToAdaptiveStep(...)`. Legacy project statuses may still be displayed, but stale local `Aprobado` or `En progreso` states do not authorize next-step navigation.

## 7. Direct URL protection

Added/updated local guards:

- Step2 blocks when backend Core does not authorize Step2.
- Step3 blocks when backend Core does not authorize Step3.
- Step4 blocks when backend Core does not authorize Step4.

Representative direct-route test added: URL Step3 while server Core is still Step2 stays blocked even if legacy AppContext says Step3 is available.

## 8. Legacy AppContext treatment

Legacy AppContext remains for compatibility, display, and descriptive work state.

It may be updated only as a mirror after backend confirmation plus refreshed Core authorization. It no longer authorizes:

- Step completion;
- next-Step unlock;
- current-Step progression;
- forward navigation;
- initiative completion.

## 9. Error/retry behavior

Existing Patch 4 loading/error/retry behavior is preserved for ProjectHome/Step0.

Step2, Step3, and Step4 now show:

- loading while persisted Adaptive Core is loading;
- blocked/error state when backend Core is unavailable or does not authorize the requested Step;
- retry where backend Core loading failed.

## 10. Tests added

Added:

- `front/src/features/adaptive-core/domain/adaptiveAuthority.ts`
- `front/src/features/adaptive-core/domain/__tests__/adaptiveAuthority.test.ts`

Changed:

- `front/src/app/pages/__tests__/AdaptiveAuthorityPages.test.tsx`

Coverage added:

- server active step is the navigation authority;
- confirmed Step outputs authorize only the next boundary;
- ProjectHome blocks Step2 when legacy says unlocked but server Core remains Step1;
- ProjectHome allows Step2 when server Core says Step2 even if legacy is stale;
- direct Step3 route blocks when server Core remains Step2.

## 11. Exact test results

```text
npm.cmd run test:front -- src/app/pages/__tests__/AdaptiveAuthorityPages.test.tsx --reporter=basic
PASS: 1 file, 7 tests
```

```text
npm.cmd run test:front -- src/features/adaptive-core/domain/__tests__/adaptiveAuthority.test.ts src/app/pages/__tests__/AdaptiveAuthorityPages.test.tsx --reporter=basic
PASS: 2 files, 10 tests
```

```text
npm.cmd run typecheck:front
PASS
```

```text
npm.cmd run test:front -- --reporter=dot --silent
First run: all test files passed but Vitest exited with one transient unhandled fs read error.
Second run: PASS, 47 files, 303 tests
```

```text
npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/adaptive-core.service.test.ts ../backend/modules/adaptive-core/__tests__/checkpoint-evidence-policy.test.ts ../backend/modules/truth/__tests__/truth.service.test.ts
PASS: 3 files, 125 tests
```

## 12. Persistence regression

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e R2_PERSISTENCE_E2E=1 npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/r2-persistence.e2e.test.ts
PASS: 1 file, 4 tests
```

## 13. Remaining R2 defects

No remaining defect found in the repaired frontend authority paths.

Known dependency: Step1 UI still cannot complete CP-1.3 unless it can provide real persistent Truth bindings. This repair intentionally does not create a new Evidence/Truth selection subsystem and does not fabricate IDs. Result: no false advance.

Known unrelated baseline remains outside this patch: backend `LOG_REDACT_PATHS` typecheck debt was not touched.

## 14. Scope guard

Confirmed:

- no backend Truth semantic changes;
- no checkpoint policy expansion;
- no Portfolio changes;
- no R3/R4 changes;
- no migrations;
- no commit, push, or merge.

## 15. Verdict

R2 FRONTEND AUTHORITY REPAIR PASS
