# Copilot-first Pilot Activation Checklist

Do not activate the productive allowlist until every required item is GO.

| Area | Check | Status | Evidence / Owner |
| --- | --- | --- | --- |
| Block 5 gate | Clean PostgreSQL E2E blocker resolved | NO-GO | `Project.pilotLeadId` drift documented in Block 05 |
| Migrations | `npx prisma migrate deploy` from clean DB | pending | [PENDIENTE] |
| Migrations | `npx prisma migrate status` clean | pending | [PENDIENTE] |
| Build | backend typecheck/build green | pending | [PENDIENTE] |
| Build | frontend typecheck/build green | pending | [PENDIENTE] |
| Tests | backend tests green | pending | [PENDIENTE] |
| Tests | frontend tests green | pending | [PENDIENTE] |
| E2E | vertical dry run E2E green | pending | [PENDIENTE] |
| Health | `/api/health` healthy | pending | [PENDIENTE] |
| Readiness | `/api/readiness/copilot` healthy | pending | [PENDIENTE] |
| Feature flags | `COPILOT_ENABLED=true` only in pilot env | pending | [PENDIENTE] |
| Feature flags | `COPILOT_WRITE_ENABLED=true` only after GO | pending | [PENDIENTE] |
| Feature flags | `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=true` only for pilot | pending | [PENDIENTE] |
| Frontend | `VITE_PORTFOLIO_COPILOT_ENABLED=true` only after backend ready | pending | [PENDIENTE] |
| Allowlist | `COPILOT_ALLOWED_ORGANIZATION_IDS` configured with confirmed org only | pending | [PENDIENTE] |
| Users | 3 to 8 pilot users confirmed | pending | [PENDIENTE] |
| Permissions | roles are existing roles and scoped correctly | pending | [PENDIENTE] |
| Data | allowed/prohibited data confirmed | pending | [PENDIENTE] |
| Support | support channel and owner confirmed | pending | [PENDIENTE] |
| Smoke | `npm run smoke:copilot` against pilot env | pending | [PENDIENTE] |
| Backup | backup/restore plan confirmed | pending | [PENDIENTE] |
| Kill switch | write and capability disable tested | pending | [PENDIENTE] |
| Communication | pilot notice and user guide sent | pending | [PENDIENTE] |
| Observability | logs, AuditLog, metrics and report checked | pending | [PENDIENTE] |
| Scorecard | scorecard owners and cadence confirmed | pending | [PENDIENTE] |
| Dry run | internal dry run completed | not executed | See dry-run report |

## Flags

```text
COPILOT_ENABLED=false
COPILOT_WRITE_ENABLED=false
COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false
COPILOT_ALLOWED_ORGANIZATION_IDS=
VITE_PORTFOLIO_COPILOT_ENABLED=false
```

Initial safe default is disabled. Enable read/write only in a pilot environment after GO.
