# R0 — Validation Result

**Repair ID:** `R0`  
**Verdict:** `R0 READY WITH PRODUCT FAILURES`  
**Baseline commit:** `5ff32f9`  
**Branch:** `repair/mvp-r1-truth-foundation`  
**Environment:** Windows PowerShell  
**Node:** `v24.12.0`  
**npm:** `11.6.2`

---

## A. Snapshot

- Starting SHA: `5ff32f9`
- Branch: `repair/mvp-r1-truth-foundation`
- Expected untracked content before validation: `repair-control/`
- Product code was not modified as part of R0.

---

## B. Dependency State

### Command

```powershell
npm ci
```

### Result

- Exit code: `0`
- 772 packages installed
- `node_modules` present
- Installation reproducible from repository lockfile

### Notes

`npm ci` reported dependency audit warnings, including high/critical vulnerabilities.

No `npm audit fix` or dependency upgrade was performed in R0 because dependency remediation is outside R0 scope.

---

## C. Prisma Client

### Command

```powershell
npm run db:generate
```

### Result

- Exit code: `0`
- Prisma Client generated successfully using Prisma `6.19.2`

### Environment issue resolved

The first backend test run failed in multiple suites because `@prisma/client` had not been generated.

Classification:

`TEST_ENVIRONMENT_FAILURE → RESOLVED`

---

## D. Backend Tests

### Command

```powershell
npm run test:backend
```

### Final result after Prisma generation

- Test Files: `1 failed | 68 passed | 2 skipped (71)`
- Tests: `1 failed | 575 passed | 2 skipped (578)`
- Exit code: `1`

### Remaining failure

`backend/shared/utils/__tests__/logger-redaction.test.ts`

Failure contract:

`LOG_REDACT_PATHS` is imported by the test but is not exported by `backend/shared/utils/logger`.

Type observed:

`PRODUCT_FAILURE`

This failure must not be repaired inside R0.

### Additional non-blocking observations

`deriveTeamCache` produced repeated non-fatal errors in portfolio/adaptive-core tests when mocked Prisma capabilities were incomplete.

These did not prevent the related suites from passing and are recorded as baseline technical debt for later repair analysis.

---

## E. Frontend Tests

### Command

```powershell
npm run test:front
```

### Result

- Test Files: `45 passed (45)`
- Tests: `287 passed (287)`
- Exit code: `0`

### Warnings observed

Non-fatal warnings included:

- React state updates not wrapped in `act(...)`
- some missing MSW handlers
- component ref warnings

They did not fail the frontend test suite.

---

## F. Typecheck

### Command

```powershell
npm run typecheck
```

### Result

- Exit code: `2`
- Frontend typecheck passed
- Backend typecheck failed with one error

### Error

`backend/shared/utils/__tests__/logger-redaction.test.ts`

`TS2305: Module "../logger" has no exported member "LOG_REDACT_PATHS".`

Classification:

`PRODUCT_FAILURE`

This is the same baseline defect observed in backend tests.

---

## G. Production Build

### Command

```powershell
npm run build
```

### Result

- Exit code: `0`
- Vite production build completed successfully

### Non-blocking warnings

- dynamic/static import overlap for `api.ts`
- generated JS chunk larger than 500 kB

These are not R0 blockers.

---

## H. Boot Smoke Test

### Command

```powershell
npm run dev:all
```

### First attempt

Frontend:

`PASS`

Backend:

`TEST_ENVIRONMENT_FAILURE`

Cause:

Port `3001` was already occupied by another Starteria backend process from:

`C:\Users\User\proyect-starteria\Dashboardstarteria`

The conflicting process was stopped and the port was verified as free.

### Final attempt

Frontend:

```text
VITE v6.3.5 ready
Local: http://localhost:5173/
```

Backend:

```text
Server running on port 3001 [development]
```

Final classification:

- Frontend boot: `PASS`
- Backend boot: `PASS`
- Full dev smoke boot: `PASS`

### Environment warnings

The backend reported:

- `JWT_SECRET not set — using insecure fallback (development only)`
- `DATABASE_URL not set`

These warnings did not prevent development boot.

They must not be interpreted as production-ready configuration.

---

## I. Environment Blockers

No unresolved R0 environment blocker remains.

Resolved:

1. missing Prisma Client generation;
2. port `3001` collision with another Starteria worktree.

---

## J. Product Failures Discovered

### PF-R0-001 — Logger redaction contract

Evidence:

- backend test failure;
- backend typecheck failure;
- missing `LOG_REDACT_PATHS` export.

Status:

`OPEN`

Classification:

`PRODUCT_FAILURE`

R0 does not authorize fixing this defect.

---

## K. R0 Verdict

# `R0 READY WITH PRODUCT FAILURES`

The repair worktree now supports:

- reproducible dependency installation;
- Prisma Client generation;
- backend test execution;
- frontend test execution;
- typecheck execution;
- production build;
- frontend/backend development boot.

The remaining known failure is a product baseline defect rather than an environment or harness blocker.

R1 implementation may begin, subject to the `R1_TRUTH_FOUNDATION.md` Repair Contract.

R0 must remain an immutable validation baseline; any product changes from this point forward belong to R1 or later repair blocks.
