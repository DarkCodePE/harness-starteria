# R0 — Validation Environment Contract

**Repair ID:** `R0`  
**Status:** Ready  
**Baseline commit:** `5ff32f9`  
**Branch:** `repair/mvp-r1-truth-foundation`

---

## 1. Objective

Establish a reproducible validation environment for the Starteria repair worktree before any product remediation begins.

R0 must determine whether failures come from:
- the product;
- the local/test environment;
- missing dependencies;
- test harness/configuration.

R0 must not change product behavior.

---

## 2. Scope

R0 may:
- inspect Node/npm versions;
- inspect package scripts;
- install dependencies using the repository lockfile;
- verify environment prerequisites;
- run existing backend tests;
- run existing frontend tests;
- run existing typecheck/build commands;
- attempt application boot;
- document failures and classify them.

R0 must not:
- modify product code;
- modify tests to make them pass;
- change Prisma/domain behavior;
- add features;
- repair R1 findings;
- suppress failures;
- commit dependency artifacts unless already tracked by repository policy.

---

## 3. Required Checks

### ENV-001 — Repository identity

Confirm:
- branch = `repair/mvp-r1-truth-foundation`
- starting SHA = `5ff32f9`
- working tree contains only expected `repair-control/` additions before environment setup

### ENV-002 — Runtime

Record:
- `node --version`
- `npm --version`
- operating system / shell when useful

### ENV-003 — Package structure

Confirm:
- primary app directory
- lockfile present
- relevant package scripts
- backend/frontend test commands
- build/typecheck commands

### ENV-004 — Dependency installation

Use the repository's lockfile-preserving installation method.

Preferred:
- `npm ci` when a compatible lockfile exists.

Do not use dependency upgrades as part of R0.

### ENV-005 — Backend tests

Run the repository's existing backend test command.

Classify failures as:
- PRODUCT_FAILURE
- TEST_ENVIRONMENT_FAILURE
- HARNESS_FAILURE

### ENV-006 — Frontend tests

Run the repository's existing frontend test command.

Use the same failure classification.

### ENV-007 — Typecheck / build

Run existing repository typecheck/build commands where available.

Do not fix errors in R0.

### ENV-008 — Boot smoke test

Attempt the documented application startup path only long enough to determine whether backend/frontend can boot.

Do not alter configuration merely to hide a failure.

---

## 4. Evidence Required

Write:

`repair-control/runs/R0/R0_VALIDATION_RESULT.md`

Include:

### A. Snapshot
- branch
- SHA
- git status

### B. Runtime
- Node version
- npm version

### C. Dependency state
- install command
- result
- warnings/errors

### D. Tests
For each command:
- exact command
- exit code
- PASS/FAIL
- failure classification
- short evidence

### E. Build/typecheck
Same structure.

### F. Boot smoke test
- command
- result
- ports/services reached if applicable
- blocker if any

### G. Environment blockers
List only true environment blockers.

### H. Product failures discovered
Record but do not repair.

### I. R0 verdict
One of:
- `R0 READY`
- `R0 READY WITH PRODUCT FAILURES`
- `R0 BLOCKED BY TEST_ENVIRONMENT`
- `R0 BLOCKED BY HARNESS`

---

## 5. Definition of Done

R0 is complete when:

- dependencies can be installed reproducibly or a concrete environment blocker is documented;
- backend/frontend tests can be executed or their environment blocker is proven;
- build/typecheck state is known;
- the boot path is known;
- failures are classified rather than silently bypassed;
- `R0_VALIDATION_RESULT.md` exists;
- no product repair was performed.

Only after R0 is `READY` or `READY WITH PRODUCT FAILURES` may R1 implementation begin.
