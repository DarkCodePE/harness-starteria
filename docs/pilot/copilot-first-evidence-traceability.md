# Copilot-first Pilot Evidence Traceability

Use this table internally after each executed case. Do not expose these IDs in public analytics.

| caseId | conversationId | IntentAssessment | ActionPlan | ProposedAction versions | Approval/Rejection | ActionExecution | StrategicFront | AuditLog | Metrics | Observation | Findings |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DR-01 | cms58adaq0007vxv44vbifdux | cms58adbm000fvxv4kgplckwv | cms58adbw000lvxv4wffnk07k | cms58adc7000pvxv4wz4bbays v1 | approved | cms58adej0013vxv4xcqcm5jc | cms58adf3001avxv4aui1gizm | reviewed actions present | dry-run report | API automated, no manual UI observation | none |
| DR-02 | cms58adg1001ivxv4faky9c6r | cms58adhb0024vxv4se2cxli8 | cms58adhk002avxv470rt4jn0 | generated after clarification | n/a | n/a | n/a | not fully reviewed | dry-run report | API automated, no manual UI observation | none |
| DR-03 | cms58adid002ovxv43585tl1r | recorded in local dry-run JSON | recorded in local dry-run JSON | cms58adj70036vxv4yxzfjmu0 v1 -> v2 | approved v2 | cms58adkw003ovxv4a1ivxcwc | recorded in execution reference | not fully reviewed | dry-run report | API automated, no manual UI observation | none |
| DR-04 | recorded in local dry-run JSON | recorded in local dry-run JSON | recorded in local dry-run JSON | cms58admv004lvxv4o373gckc approval invalidated after edit | approved -> invalidated -> approved | cms58adpc0059vxv4g6ion3l5 | recorded in execution reference | not fully reviewed | dry-run report | API automated, no manual UI observation | none |
| DR-05 | cms58adqg005ovxv4z6asi1k8 | recorded in local dry-run JSON | recorded in local dry-run JSON | cms58adr70066vxv4ub4l69uj v1 | rejected | execution denied | none | not fully reviewed | dry-run report | API automated, no manual UI observation | none |
| DR-06 | n/a | n/a | n/a | n/a | denied before mutation | n/a | none | authorization denial expected | dry-run report | API automated, no manual UI observation | none |
| DR-07 | cms58adso006mvxv4feemeu5m | recorded in local dry-run JSON | recorded in local dry-run JSON | cms58adtg0074vxv4syn4jwk5 v1 | cross-org denied | n/a | none | organization access denied | dry-run report | API automated, no manual UI observation | none |
| DR-08 | cms58adub007ivxv46va1ev98 | recorded in local dry-run JSON | recorded in local dry-run JSON | cms58adv30080vxv4pvuzgk3r | approved/executed | cms58adwj008ivxv4y0b70kkg | recorded in execution reference | not fully reviewed | dry-run report | API automated refresh-by-read, no browser refresh observation | none |
| DR-09 | recorded in local dry-run JSON | recorded in local dry-run JSON | recorded in local dry-run JSON | recorded in local dry-run JSON | approved | cms58adzm009vvxv48cqspjq1 | one row by name | replay audit expected | dry-run report | API automated replay | none |
| DR-10 | recorded in local dry-run JSON | recorded in local dry-run JSON | recorded in local dry-run JSON | recorded in local dry-run JSON | approved | one ledger row after concurrent requests | one row by name | idempotency conflict handled | dry-run report | API automated double-click simulation | finding-6c-002 |
| DR-11 | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [PENDIENTE] | Requires backend restart with capability disabled plus UI review | pending |
| DR-12 | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [PENDIENTE] | Requires write kill switch test | pending |
| DR-13 | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [PENDIENTE] | Requires total kill switch test | pending |
| DR-14 | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [PENDIENTE] | No approved Portfolio failure injection found | finding-6c-003 |
| DR-15 | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [PENDIENTE] | Requires observed UI/network projection failure | pending |
| DR-16 | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [NO EJECUTADO] | [PENDIENTE] | Requires operator support exercise | pending |

Local evidence file, intentionally ignored by Git: `front/.pilot-dry-run/dry-run-1785277766521.json`.

Rules:

- Store only internal IDs needed for traceability.
- Keep message content out of analytics tags.
- Link observation notes by anonymized session ID.
- Link findings by `Finding ID`.
- Review this table during post-session checklist.

## Block 06D Traceability Addendum

Run ID: `resilience-1785301958758`

| caseId | conversationId | IntentAssessment | ActionPlan | ProposedAction versions | Approval/Rejection | ActionExecution | StrategicFront | AuditLog | Metrics | Observation | Findings |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DR-11 | cms5mox330003vxewv12gp4jd | recorded in local resilience JSON | cms5mox46000hvxew1ebbd1k7 | cms5mox4g000lvxewprwkty54 v1 | capability disabled denial | n/a | none | `copilot.feature_flag.denied.approve_action` | report | API automated, no manual UI observation | none |
| DR-12 | cms5mp0ca0003vxxoltompx7o | recorded in local resilience JSON | cms5mp0de000hvxxo0xdje3pq | cms5mp0dm000lvxxoqp1bf1hm v1 | write disabled denials | n/a | none | feature flag denial actions present | report | API automated, no manual UI observation | none |
| DR-13 | cms5mp6n80003vxx87bmvg36z | recorded in local resilience JSON | cms5mp6ob000hvxx8ucrdm1mo | cms5mp6oj000lvxx8srdu6399 v1 | total disabled denials | n/a | none | correlation IDs recorded | report | API automated, no manual UI observation | none |
| DR-14 | cms5mpgfw0003vx68d3kau17t | recorded in local resilience JSON | cms5mpgh8000hvx68weaf8z0g | cms5mpghk000lvx68h65kcool v1 | approved | cms5mpgj9000zvx68cca24ycz failed | none | `copilot.execution.failed` | report shows failed execution | API automated, no manual UI observation | finding-6c-003 closed |
| DR-15 | cms5mpjnm0003vxnstrby4x6z | recorded in local resilience JSON | cms5mpjov000hvxnst116989z | cms5mpjp5000lvxnsfsq0ejpw v1 | approved | cms5mpjr3000zvxnsew6ka4uu completed | cms5mpjrr0016vxns4oet4rm8 | replay/projection evidence recorded | report | API automated projection failure, no manual UI observation | none |
| DR-16 | cms5mptrd0003vx3gts8jj9rg | recorded in local resilience JSON | cms5mptsq000hvx3gby0n07x9 | cms5mptsz000lvx3g74j6juxh v1 | approved | cms5mptuh000zvx3gumzhr4l7 completed | reference in execution | audit trail reconstructable | report | automated support reconstruction; human walkthrough pending | finding-6d-001 |
