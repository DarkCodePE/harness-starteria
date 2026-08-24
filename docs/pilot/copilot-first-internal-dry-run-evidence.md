# Copilot-first Internal Dry Run Evidence

Run ID: `dry-run-1785277766521`

Timestamp: `2026-07-28T22:29:26.523Z`

Database: `starteria_pilot_dry_run`

Environment:

- Backend: `http://127.0.0.1:4200/api/v1`
- Frontend: `http://127.0.0.1:5186`
- Adapter: deterministic
- Organization: synthetic `org-pilot-dry-run`
- Users: synthetic only

Local evidence file:

```text
front/.pilot-dry-run/dry-run-1785277766521.json
```

The file is ignored by Git and must not include passwords, tokens, cookies or full sensitive messages.

## Evidence Type

| Category | Status | Notes |
| --- | --- | --- |
| Automated API evidence | captured | DR-01 through DR-10 |
| Automated smoke/report evidence | previously captured and repeatable | `pilot:dry-run:start -- --checks` |
| Manual UX observation | not captured | Required before technical GO |
| Support simulation | not captured | Required before technical GO |
| Kill switch observation | not captured | Required before technical GO |

## Key Traceability

- DR-01 conversation: `cms58adaq0007vxv44vbifdux`
- DR-01 assessment: `cms58adbm000fvxv4kgplckwv`
- DR-01 action plan: `cms58adbw000lvxv4wffnk07k`
- DR-01 proposed action: `cms58adc7000pvxv4wz4bbays`
- DR-01 execution: `cms58adej0013vxv4xcqcm5jc`
- DR-01 StrategicFront: `cms58adf3001avxv4aui1gizm`
- DR-01 correlationId: `1ab7eb28-ba3f-48f6-83ba-b66b4a70ef31`

Additional case IDs are recorded in `docs/pilot/copilot-first-evidence-traceability.md`.

## Findings From Evidence

- `finding-6c-001`: sensitive HTTP headers were visible in logs before the logger redaction fix.
- `finding-6c-002`: concurrent idempotency race is functionally safe but logs a Prisma unique constraint error.
- `finding-6c-003`: controlled Portfolio failure has no approved dry-run failure injection path.
- `finding-6c-004`: flag/kill-switch cases remain unexecuted.
- `finding-6c-005`: manual UI observation remains unexecuted.

## Integrity Notes

- No duplicate StrategicFront was created in DR-09 or DR-10.
- Rejected action in DR-05 did not create a StrategicFront.
- Viewer user in DR-06 authenticated but received HTTP 403 before Copilot mutation.
- Other organization user in DR-07 could not read or approve objects from the allowlisted organization.

## Limits

This evidence does not validate value, comprehension or usability with real users. It also does not complete the pilot dry run because mandatory manual and failure-mode exercises remain pending.

## Block 06D Resilience Evidence

Run ID: `resilience-1785301958758`

Local evidence file:

```text
front/.pilot-dry-run/resilience-1785301958758.json
```

Summary:

- DR-11 capability disabled: passed automated.
- DR-12 write kill switch: passed automated.
- DR-13 total kill switch: passed automated.
- DR-14 controlled Portfolio error: passed automated.
- DR-15 projection read failure: passed automated.
- DR-16 support reconstruction: passed automated, human walkthrough pending.

Additional findings:

- `finding-6d-001`: human support simulation remains pending after automated reconstruction.
- `finding-6d-002`: Windows cleanup emits warnings during runner shutdown even though ports are released afterward.

This evidence still does not validate manual comprehension, confidence, navigation, accessibility, support behavior or value.
