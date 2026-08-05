# Copilot-first Runbook

## Block 06D Dry Run Resilience

Use this command for controlled technical verification of resilience cases against `starteria_pilot_dry_run`:

```bash
npm run pilot:dry-run:resilience
```

Run a single case:

```bash
npm run pilot:dry-run:resilience -- --case=DR-11
```

For manual observation, run:

```bash
npm run pilot:dry-run:resilience -- --case=DR-11 --pause-for-manual
```

Cases:

- DR-11: `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false`.
- DR-12: `COPILOT_WRITE_ENABLED=false`.
- DR-13: `COPILOT_ENABLED=false`.
- DR-14: `COPILOT_DRY_RUN_PORTFOLIO_FAILURE_MODE=before_create`.
- DR-15: `COPILOT_DRY_RUN_PROJECTION_FAILURE_MODE=strategic_fronts_read`.
- DR-16: automated support traceability reconstruction.

Failure injection is allowed only in test/development dry-run contexts and requires:

```text
COPILOT_DRY_RUN_FAILURE_INJECTION_ENABLED=true
```

Never enable dry-run failure injection in production.

After each run, verify that local dry-run ports are free. Cleanup warnings on Windows are non-blocking only when post-run port checks show no listeners.

## Architecture

Portfolio Copilot is a backend-orchestrated vertical. React sends messages and action requests to `/api/v1/copilot`; Copilot persists conversation, assessment, Action Plan, approval and `ActionExecution`; `ActionExecutor` dispatches only approved `CreateStrategicFrontCommand` to `PortfolioService`.

## Variables

- `COPILOT_ENABLED`: global backend gate.
- `COPILOT_WRITE_ENABLED`: disables Copilot writes while preserving reads.
- `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED`: capability kill switch.
- `COPILOT_ALLOWED_ORGANIZATION_IDS`: comma-separated rollout allowlist.
- `COPILOT_ASSESSMENT_ADAPTER`: `deterministic` in test/sandbox only.
- `COPILOT_EXECUTION_STALE_AFTER_SECONDS`: stale execution threshold. Default: 900.
- `COPILOT_RECONCILIATION_ENABLED`: starts the reconciler.
- `COPILOT_RECONCILIATION_INTERVAL_SECONDS`: scheduler interval. Default: 60.
- `COPILOT_RATE_LIMIT_MESSAGE`, `COPILOT_RATE_LIMIT_EXECUTION`: per-user/minute pilot limits.
- `COPILOT_MAX_MESSAGE_LENGTH`, `COPILOT_MAX_PAYLOAD_BYTES`: configured limits.
- `VITE_PORTFOLIO_COPILOT_ENABLED`: frontend visibility flag.

## Health Checks

- Liveness: `GET /api/health`.
- Copilot readiness: `GET /api/readiness/copilot`.

Readiness verifies database reachability, `CreateStrategicFront` registration, adapter/flags and reconciliation configuration. It does not expose secrets.

## Deployment

1. Apply migrations with `npx prisma migrate deploy`.
2. Run `npx prisma migrate status`.
3. Keep backend flags disabled in phase 0.
4. Enable frontend flag only after backend flags and allowlist are configured.
5. Run `npm run smoke:copilot` against a test organization.

## Rollback

Prefer roll-forward:

1. Set `COPILOT_WRITE_ENABLED=false`.
2. If command execution must stop only for this vertical, set `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false`.
3. Keep reads available for audit and recovery.
4. Do not delete Copilot tables or audit logs.

## Kill Switch

- All Copilot writes: `COPILOT_WRITE_ENABLED=false`.
- CreateStrategicFront only: `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false`.
- Full product visibility: backend `COPILOT_ENABLED=false` and frontend `VITE_PORTFOLIO_COPILOT_ENABLED=false`.

## Reconciliation

The reconciler claims stale `pending`, `validating` or `executing` executions using persisted claim fields. It completes only when success result and created references already exist. Ambiguous executions become `manual_review_required` and are not reexecuted.

## Manual Review

For `manual_review_required`:

1. Inspect `ActionExecution`, `AuditLog`, `correlationId` and `idempotencyKey`.
2. Verify whether a `StrategicFront` exists in the same organization.
3. If the front exists, reconcile with a new code path or migration only after evidence is clear.
4. If no front exists and the business owner approves, execute a deliberate retry with a new idempotency key.

## Common Incidents

- `IDEMPOTENCY_CONFLICT`: compare existing and requested action; do not reuse the key for another action.
- `PERMISSION_DENIED`: verify current user role and organization membership.
- DB unavailable: readiness fails; keep writes disabled until migration/status and connectivity are healthy.
- Projection failure: command result may still be valid; refresh Portfolio from source API before retrying UI projection.

## Metrics

Initial implementation exposes a `CopilotMetrics` interface with no-op/test adapters. Provider integration is pending.

## Owners

- Product owner: TBD.
- Backend owner: TBD.
- Frontend owner: TBD.
- Operations owner: TBD.
- Security reviewer: TBD.

## Pilot Operations - Block 06

Before any real user session:

1. Complete `docs/pilot/copilot-first-pilot-activation-checklist.md`.
2. Confirm organization, users, owners, support channel and allowed data.
3. Run health and readiness checks.
4. Execute smoke test against the pilot environment.
5. Execute dry run and record `docs/pilot/copilot-first-dry-run-report.md`.
6. Confirm kill switch by disabling write/capability flags and observing safe failure.

During the pilot:

- Review `ActionExecution` rows after each session.
- Review `AuditLog` for approvals, rejections, executions, replays and denied access.
- Confirm no duplicate `StrategicFront` rows for replay cases.
- Confirm no cross-organization access.
- Update findings in `docs/pilot/copilot-first-findings-register.md`.

Pilot report:

```bash
npm run pilot:report -- --from=YYYY-MM-DD --to=YYYY-MM-DD
npm run pilot:report -- --from=YYYY-MM-DD --to=YYYY-MM-DD --format=json
npm run pilot:report -- --from=YYYY-MM-DD --to=YYYY-MM-DD --format=csv
```

The report is read-only and avoids exporting full conversation text.

## Disposable Databases

Never run E2E or pilot dry run against `starteria_db`.

Use:

```bash
npm run db:e2e:provision
npm run db:e2e:status
npm run test:e2e
npm run db:pilot:provision
npm run smoke:copilot
npm run pilot:report:preflight
```

`E2E_KEEP_DATABASE=true` preserves the disposable database for diagnosis. It does not authorize destructive operations on any other database.

## Block 06C Dry-run Commands

Automated functional dry run:

```bash
npm run db:pilot:provision
npm run pilot:dry-run:start -- --functional
```

This covers DR-01 through DR-10 only. It does not replace manual UI observation, flag/kill-switch checks, controlled Portfolio failure, projection failure or support simulation.

Post-run checks:

```bash
npm run smoke:copilot
npm run pilot:report:preflight
npm run pilot:report -- --from=2026-07-01 --to=2026-07-31
```

When reviewing logs, confirm credential-bearing fields are redacted as `[REDACTED]`. If bearer tokens, refresh cookies or passwords appear in logs, follow the Sensitive Data in Logs incident procedure.
