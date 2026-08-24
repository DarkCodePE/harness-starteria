# Copilot-first Security Review

Date: 2026-07-27

## Available

- Authentication: Copilot HTTP routes use existing JWT `authenticate` middleware.
- Authorization: create/approve/execute uses current roles and organization access checks; no new RBAC system.
- Tenant isolation: reads and writes validate conversation/action organization against authenticated user organization.
- Idempotency: `ActionExecution.idempotencyKey` is unique and persisted.
- Human approval: execution requires `ProposedAction` status `approved` with current version.
- Backend feature flags: global enable, write kill switch, capability kill switch and organization allowlist.
- Request/correlation IDs: generated or accepted when valid and echoed in response headers.
- Redaction utility: central helper redacts authorization, cookies, messages and payloads before structured logging.
- Audit trail: Copilot writes AuditLog events for conversation, assessment, plan, approval, execution and denied access.
- No external AI: deterministic adapter only; production deterministic activation is fail-safe disabled.

## Partially Implemented

- Observability: structured logger and metrics interface exist, but no external metrics provider is wired.
- Reconciliation: stale executions are detected and claimed; ambiguous outcomes move to `manual_review_required`. Automatic evidence-based Portfolio lookup is not implemented.
- Rate limiting: in-process per-user limits exist for Copilot mutating routes. Distributed rate limiting is pending.
- Readiness: Copilot readiness endpoint checks DB, registry, adapter/flags and reconciler config; migration compatibility check is limited to operational `prisma migrate status`.
- Privacy: redaction policy is implemented for logs but retention/deletion policy is not automated.

## Pilot Workarounds

- Use allowlisted non-production or sandbox organizations.
- Run smoke tests only with controlled users.
- Review `manual_review_required` executions daily.
- Disable writes immediately if duplicate or cross-tenant risk appears.

## Roadmap

- Transaction-capable Portfolio command port or outbox.
- External metrics provider integration.
- Distributed rate limiting.
- Contract version endpoint consumed by frontend.
- Automated retention/export/delete policy.
- Formal backup/restore testing.
- SSO/SCIM and granular permissions.
- Pentest before enterprise rollout.

## Out of Scope

- Real AI provider.
- Data sent to third-party AI.
- Enterprise SLA.
- New admin dashboard.
- Generic RBAC platform.

## Evidence Gaps

- Encryption in transit/rest depends on deployment infrastructure and is not verifiable from this repository alone.
- Backups are infrastructure-owned; this repo documents expected tables but does not prove backup availability.
- E2E remains blocked by the existing clean PostgreSQL seed migration gap: `Project.pilotLeadId` missing.
