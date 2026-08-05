# Copilot-first Foundation Block 06C

Status: **NO-GO tecnico for complete pilot readiness; partial automated dry run completed**.

Date: 2026-07-28

## Scope

Block 06C focused on the first Copilot-first vertical only:

```text
Portfolio Copilot conversation -> Action Plan -> edit -> human approval -> idempotent execution -> Portfolio Lead projection
```

No new capabilities, real AI provider, Portfolio redesign, SSO, admin dashboard or StrategicFront structural changes were implemented.

## Automated Evidence

Confirmed in this block:

- `db:pilot:provision` applies 14 migrations to `starteria_pilot_dry_run`.
- Synthetic dry-run seed creates allowlisted organization, authorized portfolio lead, viewer without permission and a user in another organization.
- `pilot:dry-run:start -- --functional` starts backend/frontend and executes API checks against real backend, real PostgreSQL and deterministic Copilot adapter.
- Functional dry run `dry-run-1785277766521` passed DR-01 through DR-10.
- Backend unit suite passes after log redaction correction: 68 files, 539 tests passed, 2 pre-existing skipped.

## Functional Results

| Case | Result | Notes |
| --- | --- | --- |
| DR-01 complete request | passed | One StrategicFront created after approval/execution |
| DR-02 incomplete request | passed | Missing information returned before plan generation |
| DR-03 edit before approval | passed | Version incremented; created front matched edited payload |
| DR-04 edit after approval | passed | Approval invalidated; reapproval required |
| DR-05 rejection | passed | Rejected action did not execute |
| DR-06 user without permission | passed | Viewer authenticated but mutation was denied with HTTP 403 |
| DR-07 other organization | passed | Cross-org read/approval denied |
| DR-08 refresh/recovery | passed | API re-read recovered plan states |
| DR-09 replay | passed | Same idempotency key did not duplicate |
| DR-10 double click | passed | Concurrent requests produced one front |

## Not Executed

- DR-11 capability disabled.
- DR-12 write kill switch.
- DR-13 total kill switch.
- DR-14 controlled Portfolio failure.
- DR-15 projection visual failure.
- DR-16 support simulation.
- Manual UI observation for desktop, mobile, keyboard, focus, disabled states and projection.

## Corrections

- Hardened `front/scripts/run-pilot-dry-run.ts` cleanup by preferring graceful termination before `taskkill`, avoiding `taskkill` against already closed child processes.
- Added `PILOT_DRY_RUN_NODE_ENV` support so flag checks can run outside `NODE_ENV=test` defaults.
- Added `front/scripts/copilot-dry-run-functional.ts` and `npm run pilot:dry-run:functional`.
- Added another synthetic organization/user in `front/prisma/seed.pilot-dry-run.ts`.
- Added global logger redaction for bearer tokens, cookies, internal tokens, idempotency keys and token/password-like fields.

## Decision

Technical decision: **NO-GO for complete pilot readiness**.

Reason: automated DR-01..DR-10 passed, but mandatory manual observation, kill switch/capability flag exercises, controlled Portfolio error, projection failure and support simulation remain incomplete. Also, sensitive log redaction was fixed in code but still needs smoke-log verification before closing `finding-6c-001`.

Operational decision: **NO-GO operativo**.

Reason: real organization, users, owners, support model, consent, dates and allowed data remain pending.
