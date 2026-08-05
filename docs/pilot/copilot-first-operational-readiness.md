# Copilot-first Operational Readiness

Canonical operational pending list for the controlled pilot.

| Item | Status | Blocking | Owner | Target date | Notes |
| --- | --- | --- | --- | --- | --- |
| Technical Block 5 E2E gate | confirmed | no | [PENDIENTE] | [PENDIENTE] | `starteria_e2e` applies 14 migrations; E2E full suite passed in Block 6B |
| Block 6C automated functional dry run DR-01..DR-10 | confirmed | no | [PENDIENTE] | [PENDIENTE] | `dry-run-1785277766521`, API/backend real against `starteria_pilot_dry_run` |
| Manual UI observation | pending | yes | [PENDIENTE] | [PENDIENTE] | Desktop, mobile, keyboard, focus, projection and recovery must be observed by a human |
| Capability disabled check | pending | yes | [PENDIENTE] | [PENDIENTE] | Run with `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false` outside test-default override |
| Write kill switch check | pending | yes | [PENDIENTE] | [PENDIENTE] | Run with `COPILOT_WRITE_ENABLED=false` and verify reads/mutations |
| Total kill switch check | pending | yes | [PENDIENTE] | [PENDIENTE] | Run with `COPILOT_ENABLED=false` and verify UI/backend behavior |
| Portfolio controlled error | pending | yes | [PENDIENTE] | [PENDIENTE] | No approved failure-injection mechanism found in 6C |
| Projection failure exercise | pending | yes | [PENDIENTE] | [PENDIENTE] | Requires observed UI/network scenario |
| Support simulated exercise | pending | yes | [PENDIENTE] | [PENDIENTE] | Use runbook with captured IDs and audit trail |
| Sensitive log redaction | confirmed | no | [PENDIENTE] | [PENDIENTE] | Global logger redaction added and verified in `pilot:dry-run:start -- --checks` |
| Pilot organization | pending | yes | [PENDIENTE] | [PENDIENTE] | Do not hardcode in source |
| Pilot users | pending | yes | [PENDIENTE] | [PENDIENTE] | 3 to 8 users |
| Roles | pending | yes | [PENDIENTE] | [PENDIENTE] | Existing roles only |
| Pilot owner | pending | yes | [PENDIENTE] | [PENDIENTE] | Business accountable owner |
| Technical owner | pending | yes | [PENDIENTE] | [PENDIENTE] | Engineering owner |
| Support owner | pending | yes | [PENDIENTE] | [PENDIENTE] | Support channel owner |
| Incident owner | pending | yes | [PENDIENTE] | [PENDIENTE] | Can activate kill switch |
| Dates | pending | yes | [PENDIENTE] | [PENDIENTE] | Start/end window |
| Allowed data | pending | yes | [PENDIENTE] | [PENDIENTE] | Approved categories |
| Consent | pending | yes | [PENDIENTE] | [PENDIENTE] | Notes/recording policy |
| Support channel | pending | yes | [PENDIENTE] | [PENDIENTE] | No 24/7 SLA implied |
| Scorecard approval | pending | yes | [PENDIENTE] | [PENDIENTE] | Cadence and owners |
| Dry run | partial | yes | [PENDIENTE] | [PENDIENTE] | Automated DR-01..DR-10 passed; DR-11..DR-16 and manual UX observation pending |

## Confirmed Technically

- Clean migrations on disposable PostgreSQL databases are working.
- E2E full suite was previously green on isolated `starteria_e2e`.
- Dry-run provisioning applies 14 migrations and seeds synthetic users/orgs.
- Automated functional dry run verified complete request, incomplete request, edit before approval, edit after approval, rejection, no-permission user, cross-organization denial, recovery by re-read, replay and double-click idempotency.
- Backend logger redaction now includes credential-bearing request/response headers and was verified by smoke logs showing `[REDACTED]`.

## Block 06D Readiness Update

Confirmed technically:

- DR-11 capability disabled passed automated against `starteria_pilot_dry_run`.
- DR-12 write kill switch passed automated against `starteria_pilot_dry_run`.
- DR-13 total kill switch passed automated against `starteria_pilot_dry_run`.
- DR-14 controlled Portfolio error passed automated with failed ledger and no StrategicFront.
- DR-15 projection read failure passed automated with no duplicate on replay.
- DR-16 traceability reconstruction passed automated.
- Post-resilience smoke and pilot report passed.

Still blocking GO tecnico:

- Manual UI observation by a person.
- Human support walkthrough using the runbook.

Still blocking GO operativo:

- Real pilot organization.
- Real pilot users and roles.
- Business owner.
- Technical owner.
- Support owner.
- Incident owner.
- Allowed data categories.
- Consent/recording policy.
- Start/end dates.
- Support channel.
- Scorecard approval and closure criteria.

## Pending Human/Operational

- Real pilot organization.
- Real pilot users and roles.
- Business owner.
- Technical owner.
- Support owner.
- Incident owner.
- Allowed data categories.
- Consent/recording policy.
- Start/end dates.
- Support channel.
- Scorecard approval and closure criteria.
