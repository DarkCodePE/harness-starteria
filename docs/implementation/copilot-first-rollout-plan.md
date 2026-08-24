# Copilot-first Rollout Plan

## Phase 0 - Disabled

- Code deployed.
- Migrations applied.
- `COPILOT_ENABLED=false` or no allowlisted production organization.
- `VITE_PORTFOLIO_COPILOT_ENABLED=false`.
- Health/readiness monitored.
- Smoke test limited to non-production.

## Phase 1 - Internal Team

- Enable backend and frontend flags for internal organization only.
- Use deterministic adapter.
- Use synthetic data.
- Review logs, metrics and AuditLog daily.
- Keep kill switch procedure ready.

## Phase 2 - Design Partner Sandbox

- Add one sandbox organization to `COPILOT_ALLOWED_ORGANIZATION_IDS`.
- Limit users to defined Portfolio Lead and admin/mentor roles.
- Cap creation volume.
- Review every `ActionExecution`, replay and manual review case.

## Phase 3 - Limited Functional Pilot

- Use approved real or anonymized cases.
- Keep only `CreateStrategicFront` capability enabled.
- Support window and incident owner defined.
- Run scorecard weekly.
- No enterprise-wide activation.

## Phase 4 - Expansion

Only after technical GO and pilot GO:

- zero duplicate creations in concurrency evidence;
- validated tenant isolation;
- operational support assigned;
- restore drill completed;
- frontend/backend compatibility documented.

## Rollback

Roll forward operationally:

1. Disable `COPILOT_WRITE_ENABLED`.
2. Disable `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED` if only execution is risky.
3. Keep reads for audit and recovery.
4. Apply corrective migration or code patch.

## Block 06 Pilot Entry Gate

Phase 3 remains blocked until:

- Block 05 technical gate is GO, including clean PostgreSQL E2E;
- pilot organization is confirmed;
- 3 to 8 pilot users are confirmed;
- pilot owners and support/incident owners are named;
- data handling is approved;
- activation checklist is complete;
- dry run is executed and reviewed;
- kill switch is tested in the pilot environment.

Current status: **NO-GO** because the technical E2E blocker and operational placeholders remain open.

Recommended pilot configuration when GO:

```text
COPILOT_ENABLED=true
COPILOT_WRITE_ENABLED=true
COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=true
COPILOT_ALLOWED_ORGANIZATION_IDS=[confirmed pilot organization id]
VITE_PORTFOLIO_COPILOT_ENABLED=true
```

Never hardcode the organization in source code and never commit secrets. For pilot pause criteria, support flow and session procedures, see `docs/pilot/`.
