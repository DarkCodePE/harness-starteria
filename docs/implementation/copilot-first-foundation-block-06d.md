# Copilot-first Foundation Block 06D

Status: **NO-GO tecnico parcial / NO-GO operativo**.

Block 6D added a controlled resilience dry-run path for the first Copilot-first vertical:

```text
conversation -> Action Plan -> approval -> idempotent execution -> Portfolio projection
```

## Automated Gate Evidence

Confirmed before and during this block:

- `npm run db:generate`: passed.
- `npm run typecheck`: passed before changes.
- `npm run build:backend`: passed before changes.
- `npm run build`: passed before changes, with existing Vite chunk warnings.
- `npm test`: passed before changes.
- `npm run test:front -- --reporter=dot --silent`: passed before changes.
- `npm run db:e2e:provision`: passed after starting isolated Docker PostgreSQL.
- `npm run test:e2e:all`: passed, 17 tests in 55.9s.
- `npm run db:pilot:provision`: passed, 14 migrations plus synthetic seed.
- `npm run pilot:dry-run:start -- --checks`: passed after DR-11..DR-16; smoke and report green.
- `npm run pilot:dry-run:resilience`: passed for DR-11..DR-16.

Post-change focused validation:

- `npm run typecheck:backend`: passed.
- `npm run typecheck:front`: passed.
- `npx vitest run --config vitest.backend.config.ts backend/modules/copilot/__tests__/create-strategic-front.command.test.ts backend/modules/copilot/__tests__/copilot-router.test.ts`: passed the matched `create-strategic-front.command` file, 4 tests.

Latest validation on 2026-07-29:

- `npm run typecheck`: passed.
- `npm run build:backend`: passed.
- `npm run build`: passed with existing Vite chunk/dynamic import warnings.
- `npm test`: passed; backend 68 files / 542 tests plus 2 pre-existing skipped Copilot integration tests, frontend tests also passed with existing React `act(...)` warnings.
- `npm run db:e2e:provision`: passed; 14 migrations applied/status up to date on `starteria_e2e`.
- `npm run test:e2e:all`: passed; 17 Playwright tests in 52.0s with Docker PostgreSQL isolated from `starteria_db`.
- `npm run db:pilot:provision`: passed; 14 migrations applied/status up to date on `starteria_pilot_dry_run`.
- `npm run pilot:dry-run:functional`: passed after the DR-10 idempotency correction; evidence `front/.pilot-dry-run/dry-run-1785303330334.json`.
- `npm run pilot:dry-run:resilience`: passed DR-11 through DR-16; evidence `front/.pilot-dry-run/resilience-1785336060725.json`.
- `npm run pilot:dry-run:start -- --checks`: passed; smoke and report green.

## Resilience Cases

Latest evidence file: `front/.pilot-dry-run/resilience-1785336060725.json` (ignored by Git).

| Case | Technical result | Manual observation |
| --- | --- | --- |
| DR-11 capability disabled | passed | pending |
| DR-12 write kill switch | passed | pending |
| DR-13 total kill switch | passed | pending |
| DR-14 controlled Portfolio error | passed | pending |
| DR-15 projection read failure | passed | pending |
| DR-16 support reconstruction | passed automated reconstruction | human support simulation pending |

## Corrections Applied

- Added dry-run-only failure injection helpers for `before_create` and `strategic_fronts_read`.
- The injection path is rejected in `NODE_ENV=production` and requires `COPILOT_DRY_RUN_FAILURE_INJECTION_ENABLED=true`.
- Added audit events for Copilot feature-flag denials on create, send, edit, approve, reject and execute paths.
- Added `npm run pilot:dry-run:resilience`.
- Made `npm run pilot:dry-run:functional` self-start the dry-run environment; the API-only command is now `pilot:dry-run:functional:api`.
- Hardened dry-run process cleanup and isolated resilience phases by port to avoid stale backend contamination.
- Closed the DR-10 regression observed during final validation by serializing same-process execution per `idempotencyKey` before dispatching Portfolio. The database unique constraint remains the durable ledger guard. Added a concurrent `ActionExecutor` unit test.

## Cleanup Status

The resilience runner emitted immediate post-cleanup messages that endpoints still responded, but a direct listener check immediately afterward showed no listeners on the dry-run ports used by the runner.

The base `pilot:dry-run:start -- --checks` runner still emitted Windows `taskkill` `Acceso denegado` warnings after a successful smoke/report run; ports were released afterward. This remains a non-blocking cleanup warning, not an integrity failure.

## Decision

Technical software gates are stronger after this block, but **GO tecnico is not declared** because the mandatory human UI observation has not happened in this session.

Operational status remains **NO-GO operativo** because organization, users, owners, support, consent, allowed data, dates and scorecard approval are still pending.
