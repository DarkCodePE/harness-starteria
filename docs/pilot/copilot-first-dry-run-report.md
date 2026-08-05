# Copilot-first Dry Run Report

Status: **partially executed - automated smoke/report plus API functional dry run**.

Do not mark this report as completed until an internal user actually runs the full route.

| Step | Status | Evidence |
| --- | --- | --- |
| Authorized user | done | `pilot.portfolio@starteria.test` from synthetic dry-run seed |
| Allowlisted organization | done | `org-pilot-dry-run` |
| Onboarding | pending | [PENDIENTE] |
| Complete case | partial | `smoke:copilot` created and executed one `CreateStrategicFront` action |
| Incomplete case | pending | [PENDIENTE] |
| Edit | pending | [PENDIENTE] |
| Approval | done | Smoke approved one ProposedAction |
| Execution | done | Smoke execution completed |
| Map/projection | partial | Smoke verified projection links in `ActionExecution`; UI projection not manually reviewed |
| Refresh recovery | pending | [PENDIENTE] |
| Replay | done | Smoke replay returned idempotent replay/completed without duplicate front |
| Rejection | pending | [PENDIENTE] |
| Insufficient permission | pending | [PENDIENTE] |
| Kill switch | pending | [PENDIENTE] |
| Support flow | pending | [PENDIENTE] |
| Findings register | pending | [PENDIENTE] |
| Report generation | done | `pilot:report:preflight` ok; `pilot:report` generated metrics from dry-run activity |

## Block 06C Functional Dry Run Evidence

Execution timestamp: `2026-07-28T22:29:26.523Z`

Environment:

- Database: `starteria_pilot_dry_run`
- Backend: `http://127.0.0.1:4200/api/v1`
- Frontend started by runner: `http://127.0.0.1:5186`
- Users: synthetic dry-run seed only
- Evidence file: `front/.pilot-dry-run/dry-run-1785277766521.json` (ignored by Git)

Automated API dry run result:

| Case | Status | Evidence |
| --- | --- | --- |
| DR-01 complete request | passed | Action Plan approved and executed; one StrategicFront created |
| DR-02 incomplete request | passed | Missing information returned; Action Plan generated after additional context |
| DR-03 edit before approval | passed | Version incremented and execution used edited payload |
| DR-04 edit after approval | passed | Approval invalidated; execution denied until reapproval |
| DR-05 rejection | passed | Rejected action could not execute and created no front |
| DR-06 user without permission | passed | Viewer authenticated but mutation was denied with HTTP 403; no front created |
| DR-07 other organization | passed | Conversation, plan and approval were denied cross-organization |
| DR-08 refresh/recovery | passed | API re-read recovered plan states before approval, after approval and after completion |
| DR-09 replay | passed | Same idempotency key returned existing execution; no duplicate front |
| DR-10 double click | passed | Concurrent execute requests produced one StrategicFront |
| DR-11 capability disabled | not executed | Requires controlled restart with `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false` |
| DR-12 write kill switch | not executed | Requires controlled restart with `COPILOT_WRITE_ENABLED=false` |
| DR-13 total kill switch | not executed | Requires controlled restart with `COPILOT_ENABLED=false` |
| DR-14 Portfolio error | not executed | No approved failure-injection mechanism found |
| DR-15 projection failure | not executed | Requires observed UI/network projection failure |
| DR-16 support simulated | not executed | Requires operator walkthrough against runbook |

Important correction from this run:

- `pino-http` was logging credential-bearing headers. Global logger redaction was added for `authorization`, cookies, internal tokens, idempotency keys and token/password-like fields. Backend tests pass after the correction.

Decision: **NO-GO for complete dry run** because manual UI observation, flag/kill-switch cases, Portfolio failure handling, projection failure and support simulation remain unexecuted.

## Post-fix Smoke And Report

Executed after logger redaction fix:

```text
npm run pilot:dry-run:start -- --checks
```

Result: passed.

Smoke evidence:

- conversation: `cms5jyp910003vxlk4wx2u252`
- execution: `cms5jypd30011vxlk43f0ri6s`
- one StrategicFront created by smoke
- replay completed without duplicate
- logs showed `authorization`, `set-cookie` and `idempotency-key` as `[REDACTED]`

Report excerpt after functional dry run plus smoke:

```text
conversations: 10
messages: 11
assessments: 11
actionPlans: 10
clarifications: 1
edits: 2
approvals: 8
rejections: 1
executionCompleted: 7
executionFailed: 0
replays: 3
strategicFrontsCreated: 7
projectionLinks: 14
```

Dry-run decision: NO-GO for full pilot activation until the remaining manual/operational steps are executed and reviewed.

## Block 06A Environment

Dry run must use `starteria_pilot_dry_run`, provisioned by:

```bash
npm run db:pilot:provision
```

Expected synthetic credentials:

```text
COPILOT_SMOKE_EMAIL=pilot.portfolio@starteria.test
COPILOT_SMOKE_PASSWORD=demo123
COPILOT_SMOKE_ORGANIZATION=org-pilot-dry-run
```

Do not mark dry run as executed until smoke, audit review, report preflight, report generation and kill switch test have actually completed.

## Automated 6B Evidence

Executed against `starteria_pilot_dry_run`:

```text
npm run db:pilot:provision
npm run pilot:dry-run:start -- --checks
```

Latest report excerpt:

```text
conversations: 2
messages: 2
assessments: 2
actionPlans: 2
approvals: 2
executionCompleted: 2
replays: 2
strategicFrontsCreated: 2
projectionLinks: 4
```

This evidence validates the automated smoke/report path only. It does not replace real pilot sessions or the full dry-run checklist.

## Block 06D Resilience Evidence

Execution timestamp: `2026-07-29T05:12:38.758Z`

Evidence file:

```text
front/.pilot-dry-run/resilience-1785301958758.json
```

Automated technical result:

| Case | Status | Evidence |
| --- | --- | --- |
| DR-11 capability disabled | passed automated | Approval denied with `COPILOT_CAPABILITY_DISABLED`; no StrategicFront created; audit denial recorded |
| DR-12 write kill switch | passed automated | Reads allowed; create/send/edit/approve/reject/execute blocked with 403; audit denials recorded |
| DR-13 total kill switch | passed automated | Copilot operations blocked; Portfolio read still available; Action Plan recovered after reactivation |
| DR-14 Portfolio error | passed automated | `before_create` failure injection produced failed execution and no StrategicFront |
| DR-15 projection failure | passed automated | Projection read failed after successful command; replay did not duplicate; restored read showed one front |
| DR-16 support simulation | partial automated | Traceability reconstruction passed; human support operator walkthrough pending |

Post-resilience smoke/report:

```text
conversations: 31
messages: 32
assessments: 32
actionPlans: 31
clarifications: 1
edits: 2
approvals: 17
rejections: 1
executionCompleted: 10
executionFailed: 2
replays: 5
strategicFrontsCreated: 10
projectionLinks: 20
```

Manual UI observation remains pending and cannot be inferred from these automated results.
