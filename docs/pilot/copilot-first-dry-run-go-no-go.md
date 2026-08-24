# Copilot-first Dry Run GO/NO-GO

Decision date: 2026-07-28

## Technical Decision

Result: **NO-GO tecnico**

This is not a regression of the automated path. It means the complete dry run required by Block 6C is not finished.

## Evidence Supporting Partial GO

- Clean dry-run database provisioning works on `starteria_pilot_dry_run`.
- Synthetic users and organizations are seeded deterministically.
- DR-01 through DR-10 passed through backend/API against real PostgreSQL.
- Rejection, no-permission user, cross-organization denial, refresh-by-read, replay and double-click idempotency were verified automatically.
- Backend typecheck passed after changes.
- Backend tests passed: 68 files, 539 tests passed, 2 pre-existing skipped.
- Windows cleanup no longer emitted `Acceso denegado` in the latest `pilot:dry-run:start -- --checks` run before this decision.

## Technical Blockers

| Blocker | Severity | Blocks GO | Evidence |
| --- | --- | --- | --- |
| Manual UI observation not executed | S2 | yes | No human desktop/mobile/keyboard/focus/projection review was captured |
| Capability disabled not executed | S2 | yes | DR-11 pending |
| Write kill switch not executed | S2 | yes | DR-12 pending |
| Total kill switch not executed | S2 | yes | DR-13 pending |
| Controlled Portfolio error not executed | S2 | yes | DR-14 pending; no approved failure injection found |
| Projection failure not executed | S2 | yes | DR-15 pending |
| Support simulation not executed | S2 | yes | DR-16 pending |
| Sensitive log redaction | closed | no | `finding-6c-001` fixed and verified by `pilot:dry-run:start -- --checks`; credential headers appeared as `[REDACTED]` |

## Operational Decision

Result: **NO-GO operativo**

Pending human/operational decisions:

- Real pilot organization.
- Real users.
- Roles.
- Business owner.
- Technical owner.
- Support owner.
- Incident owner.
- Allowed data.
- Consent.
- Dates.
- Support channel.
- Scorecard approval.
- Closure criteria.

## Next Required Step

Run an observed internal dry run session with the UI open and execute DR-11 through DR-16, including explicit flag/kill-switch restarts, controlled Portfolio failure/projection exercises and support simulation.

## Block 06D Update

Result after `resilience-1785301958758`: **NO-GO tecnico parcial**.

Automated technical evidence now exists for DR-11 through DR-15, and automated traceability reconstruction exists for DR-16:

- DR-11 capability disabled: passed automated.
- DR-12 write kill switch: passed automated.
- DR-13 total kill switch: passed automated.
- DR-14 controlled Portfolio error: passed automated with failed ledger and no StrategicFront.
- DR-15 projection read failure: passed automated with no replay duplicate.
- DR-16 support reconstruction: passed automated, but no human operator walkthrough.

Remaining technical blocker:

- Manual UI observation was not executed by a person, so complete dry run GO cannot be declared.

Next required step:

- Run an observed internal dry run session with the UI open. Use `npm run pilot:dry-run:resilience -- --pause-for-manual` or individual `--case=DR-11` through `--case=DR-15` runs to present each state to the observer, then complete the human support walkthrough for DR-16.

## Block 06D Latest Update

Result after `dry-run-1785303330334` and `resilience-1785336060725`: **NO-GO tecnico parcial**.

Automated evidence now covers DR-01 through DR-16 against `starteria_pilot_dry_run`.

- DR-10 double-click replay: passed after idempotency serialization correction; one StrategicFront, second request returned replay.
- DR-11 capability disabled: passed automated.
- DR-12 write kill switch: passed automated.
- DR-13 total kill switch: passed automated.
- DR-14 controlled Portfolio error: passed automated; failed ledger, no StrategicFront.
- DR-15 projection failure: passed automated; command completed, projection read failed safely, replay did not duplicate.
- DR-16 support reconstruction: passed automated traceability reconstruction only.

Remaining GO blockers:

- Manual UI observation by a person has not been executed.
- Human support operator walkthrough for DR-16 has not been executed.
- Windows cleanup still emits `taskkill` `Acceso denegado` warnings in `pilot:dry-run:start -- --checks`; post-run port checks show no persistent listeners.

Operational decision remains **NO-GO operativo** until real organization, users, roles, owners, support, consent, dates, allowed data and scorecard approval are confirmed.
