# Copilot-first Foundation Block 05

Date: 2026-07-27

## Scope

This block hardens the existing first vertical: create a `StrategicFront` from Portfolio Copilot through conversation, Action Plan, human approval, idempotent execution and Portfolio projection.

Implemented in this block:

- backend feature flags and kill switches;
- organization allowlist enforcement;
- request/correlation ID propagation;
- `ActionExecution.manual_review_required`;
- recovery metadata on `ActionExecution`;
- conservative stale execution reconciler;
- scheduler with graceful shutdown stop;
- redaction helper;
- metrics interface with no-op/test adapters;
- Copilot readiness endpoint;
- Copilot route rate limiting;
- smoke and load baseline scripts;
- runbook, incident playbook, security review, rollout plan and scorecard.

Not implemented:

- real AI provider;
- new capabilities;
- distributed rate limiting;
- external metrics provider;
- automatic Portfolio lookup reconciliation;
- frontend/backend contract endpoint;
- proven E2E green, because Block 4 E2E remains blocked by `Project.pilotLeadId` missing during seed on a clean PostgreSQL database.

## Gate Blocks 1-4

| Block | Gate status | Evidence |
| --- | --- | --- |
| Block 1 | GO | Copilot persistence, schemas, repository and registry exist; Prisma generate passes. |
| Block 2 | GO | Approval/rejection, ActionExecutor, idempotency and PortfolioService integration are tested. |
| Block 3 | GO for backend tests | HTTP routes, deterministic adapter, orchestration and vertical API test exist. PostgreSQL vertical test remains opt-in. |
| Block 4 | NO-GO E2E | Frontend exists, but E2E on clean PostgreSQL fails during seed with `Project.pilotLeadId` missing. |

## Initial Risk Inventory

| Risk | Probability | Impact | Detectability | Mitigation | Owner | Close criterion | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Non-terminal execution stuck | Medium | High | Medium | Reconciler detects stale executions | Backend | stale executions moved to completed/manual review | Implemented partial |
| Front created, Copilot ledger incomplete | Low | High | Low | Manual review state; no automatic replay | Backend/Ops | evidence-based reconciliation implemented | Open |
| Ledger created, Portfolio fails | Medium | Medium | High | ActionExecutor stores failed result | Backend | tests cover Portfolio failure | Implemented |
| Audit non-transactional failure | Low | Medium | Medium | Documented boundary | Backend | outbox or critical transaction | Open |
| Projection links exist but map refresh fails | Medium | Medium | High | UI keeps command success and allows refresh | Frontend | E2E verifies projection recovery | Open |
| Concurrent double request | Medium | High | High | unique `idempotencyKey` + replay | Backend | PostgreSQL concurrency test green | Implemented partial |
| Replay after restart | Medium | High | High | persisted `idempotencyKey` | Backend | replay returns same ledger | Implemented |
| User role changes | Medium | High | High | execute revalidates permission | Backend | role-change test | Implemented partial |
| Cross-organization access | Medium | High | High | organization checks in controllers/services | Backend | tenant isolation test set green | Implemented partial |
| Deterministic adapter in production | Low | High | High | production config downgrades to unavailable | Backend | config test green | Implemented |
| Sensitive logs | Medium | High | Medium | redaction helper and fingerprinting | Backend | log redaction test green | Implemented partial |
| Rate abuse | Medium | Medium | Medium | per-process Copilot rate limiter | Backend | 429 test green | Implemented partial |
| Oversized request | Medium | Medium | High | Zod/body limits; config documented | Backend | dynamic config wired into schemas | Open |
| DB unavailable | Medium | High | High | readiness endpoint | Backend/Ops | readiness fail verified in integration | Implemented partial |
| Pending migrations | Medium | High | Medium | documented `migrate status` gate | Ops | clean DB migration green | Pending validation |
| Frontend/backend mismatch | Medium | Medium | Medium | DTOs typed manually | Frontend/Backend | contract version endpoint | Open |
| Feature flag only frontend | High before B5 | High | High | backend flags added | Backend | flag tests green | Implemented |
| Shutdown during execution | Low | High | Low | scheduler stops, no false failure | Backend/Ops | restart/reconcile E2E | Implemented partial |
| Ambiguous Portfolio error | Low | High | Low | manual review, no auto retry | Ops | reconciliation playbook exercised | Open |

## Consistency Decision

See `docs/architecture/adr-copilot-portfolio-consistency.md`.

Current boundary is non-atomic: Copilot creates a ledger, dispatches to `PortfolioService`, then completes the ledger. The reconciler never reexecutes ambiguous commands.

## Reconciliation

`CopilotExecutionReconciler` scans stale `pending`, `validating` and `executing` executions using `COPILOT_EXECUTION_STALE_AFTER_SECONDS`.

It claims rows using persisted `reconciliationClaimId` and `reconciliationClaimedAt`. It completes only when success result and created references are already persisted. Otherwise it marks `manual_review_required`.

## Retry Policy

No automatic retry:

- ambiguous create front execution;
- permission denied;
- invalid payload;
- stale version;
- capability missing;
- organization conflict;
- idempotency conflict.

Allowed controlled retries:

- reads and projection refresh;
- explicit manual command retry with a new idempotency key after review.

## Shutdown

`server.ts` stops the Copilot reconciliation scheduler, closes HTTP server and disconnects Prisma. It does not mark in-flight executions as failed.

## Observability

- `requestId` and `correlationId` are generated or accepted from valid headers.
- `x-request-id` and `x-correlation-id` are returned.
- Copilot structured log helper redacts message/payload/token-like fields.
- `CopilotMetrics` interface has no-op and test adapters.

## Health and Readiness

- `GET /api/health`: liveness.
- `GET /api/readiness/copilot`: database, capability registry, adapter/flags and reconciliation config.

## Rate Limiting

Copilot mutating routes have per-user in-process limits:

- messages/conversations/edits/approval/rejection: `COPILOT_RATE_LIMIT_MESSAGE`.
- execution: `COPILOT_RATE_LIMIT_EXECUTION`.

Distributed rate limiting remains future work.

## Feature Flags and Kill Switch

Backend flags:

- `COPILOT_ENABLED`;
- `COPILOT_WRITE_ENABLED`;
- `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED`;
- `COPILOT_ALLOWED_ORGANIZATION_IDS`.

Frontend flag remains `VITE_PORTFOLIO_COPILOT_ENABLED`.

## Migrations

Added migration:

- `20260727120000_copilot_production_hardening`.

Changes are additive: `manual_review_required`, `correlationId`, `reconciliationClaimId`, `reconciliationClaimedAt` and indexes on `ActionExecution`. No `StrategicFront` changes and no `Organization` FK.

## Smoke and Load

Added:

- `npm run smoke:copilot`;
- `npm run load:copilot`.

Both require explicit test credentials/token and refuse production-like URLs unless explicitly allowed.

## Tests Added

- runtime config and production deterministic fail-safe;
- redaction, idempotency fingerprint and metrics test adapter;
- reconciler stale/manual-review decisions;
- route kill switch and capability disabled behavior;
- Copilot rate limiting;
- correlation ID middleware.

## GO/NO-GO

Technical Block 5 status: **NO-GO for pilot readiness**.

Reason: the vertical cannot be certified end-to-end until the Block 4 E2E clean PostgreSQL seed blocker is resolved and E2E proves real frontend/API execution and projection without duplicates.

Hardening status: **partial GO** for backend controls implemented in this block.

## Next Block

Resolve the migration/seed drift (`Project.pilotLeadId`) that blocks E2E, then run the complete E2E and PostgreSQL concurrency/reconciliation suite before any pilot enablement.
