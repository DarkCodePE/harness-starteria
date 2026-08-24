# Copilot-first Pilot Scorecard

## Block 06D Measurement Note

Post-resilience report generated from `starteria_pilot_dry_run`:

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

These are dry-run technical counts, not pilot user results. They can validate report plumbing and audit coverage, but must not be used as evidence of user value, comprehension or adoption.

## Usage

- authorized users;
- conversations started;
- complete requests;
- clarification requests;
- Action Plans generated;
- fronts proposed;
- fronts created.

## Understanding

- Action Plans understood without external explanation;
- edit rate;
- rejection rate;
- approval rate;
- time to approval.

## Quality

- correct intent;
- fields extracted correctly;
- fields corrected;
- invented data detected;
- match between message, Action Plan and created front.

## Reliability

- execution success rate;
- execution failed rate;
- idempotent replay rate;
- duplicate creation count;
- stale execution count;
- reconciliation success rate;
- manual review count;
- projection refresh failures.

## Security

- permission denials;
- cross-organization attempts;
- rate limit events;
- sensitive data in logs;
- incidents.

## Experience

- time to first Action Plan;
- time to created front;
- recovery after refresh;
- perceived clarity;
- confidence to use real data.

## Provisional Technical Thresholds

These thresholds are pilot calibration values, not contractual SLAs:

- duplicate creation count: 0;
- execution without approval: 0;
- cross-organization data exposure: 0;
- manual review reviewed within one business day;
- smoke test green before enabling a new organization;
- all stale executions visible in daily review.

## Pilot Decisions Required

- pilot organization ID;
- users and roles;
- support owner;
- incident escalation path;
- approved data sensitivity;
- pilot start/end window;
- scorecard review cadence.

## Block 06 Executable Scorecard

Status: prepared, no real pilot results captured.

All thresholds are provisional pilot calibration values. They are not SLAs and must not be presented as validated benchmarks.

### Automatic Metrics

| Metric | Definition | Source | Formula | Frequency | Owner | Baseline | Provisional threshold | Result | Interpretation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| conversations | Copilot conversations created | AuditLog `copilot.conversation.created` | count | per session / weekly | [PENDIENTE] | none | >= 1 per active case | [PENDIENTE] | Adoption into funnel |
| messages | User messages saved | AuditLog `copilot.message.saved` | count | per session / weekly | [PENDIENTE] | none | observe only | [PENDIENTE] | Input activity |
| assessments | Intent assessments created | AuditLog `copilot.intent.assessed` | count | per session / weekly | [PENDIENTE] | none | complete cases assessed | [PENDIENTE] | Routing coverage |
| plans | Action Plans generated | AuditLog `copilot.action_plan.generated` | count | per session / weekly | [PENDIENTE] | none | generated for complete valid cases | [PENDIENTE] | Plan conversion |
| clarifications | Missing information requests | AuditLog `copilot.missing_information.requested` | count / messages | weekly | [PENDIENTE] | none | expected for incomplete cases | [PENDIENTE] | Input completeness |
| edits | Proposed actions edited | AuditLog details `copilot_action_edited` | count / plans | weekly | [PENDIENTE] | none | observe, not penalize alone | [PENDIENTE] | Correction need |
| approvals | Proposed actions approved | AuditLog details `copilot_action_approved` | count / plans | weekly | [PENDIENTE] | none | valid cases approved after review | [PENDIENTE] | Trust and readiness |
| rejections | Proposed actions rejected | AuditLog details `copilot_action_rejected` | count / plans | weekly | [PENDIENTE] | none | expected in rejection case | [PENDIENTE] | Control boundary |
| executions | Execution requests | AuditLog details `copilot_execution_requested` and ActionExecution | count | weekly | [PENDIENTE] | none | only approved actions | [PENDIENTE] | Command use |
| errors | Failed executions | ActionExecution status `failed` | count / executions | daily | [PENDIENTE] | none | investigate repeated pattern | [PENDIENTE] | Reliability |
| replays | Idempotent replay events | AuditLog `copilot.execution.idempotent_replay` | count | weekly | [PENDIENTE] | none | replay case produces no duplicate | [PENDIENTE] | Idempotency |
| fronts created | StrategicFront references created by execution | ActionExecution createdObjectReferences | count | weekly | [PENDIENTE] | none | matches approved successful executions | [PENDIENTE] | Business output |
| latencies | Time to plan, approval and created front | AuditLog timestamps and ActionExecution timestamps | average / p50 / p95 where available | weekly | [PENDIENTE] | none | observe; no SLA | [PENDIENTE] | Friction |

### Observational Metrics

| Metric | Definition | Source | Formula | Frequency | Owner | Baseline | Provisional threshold | Result | Interpretation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| doubts | Explicit user doubts | Observation template | count by type | per session | [PENDIENTE] | none | fewer repeated critical doubts over time | [PENDIENTE] | Comprehension |
| interventions | Facilitator help | Observation template | count | per session | [PENDIENTE] | none | <= 2 non-safety interventions | [PENDIENTE] | Self-service |
| navigation | Ability to find created front | Observation template | success/fail | per relevant case | [PENDIENTE] | none | success in recovery/projection cases | [PENDIENTE] | Projection clarity |
| confidence | Confidence before approve | Survey | average 1-5 | per session / weekly | [PENDIENTE] | none | >= 4 provisional | [PENDIENTE] | Trust |
| human errors | Mis-clicks or wrong assumptions | Observation template | count and severity | per session | [PENDIENTE] | none | no S0/S1 | [PENDIENTE] | UX risk |
| recovery | Return after refresh | Case evidence | success/fail | per recovery case | [PENDIENTE] | none | 100% in controlled case | [PENDIENTE] | Continuity |

### Qualitative Metrics

| Metric | Definition | Source | Formula | Frequency | Owner | Baseline | Provisional threshold | Result | Interpretation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| perceived value | User describes concrete improvement | Interview | thematic coding | midpoint/final | [PENDIENTE] | none | at least one repeated value theme | [PENDIENTE] | Product value |
| relevance | Task matters in real process | Interview/case selection | evidence count | midpoint/final | [PENDIENTE] | none | >= 5 controlled real cases identified | [PENDIENTE] | Problem strength |
| reuse intent | User would use again | Survey/interview | score and quote | midpoint/final | [PENDIENTE] | none | >= 4/5 in majority provisional | [PENDIENTE] | Adoption signal |
| adoption conditions | Requirements to continue | Interview | list | final | [PENDIENTE] | none | concrete blockers identified | [PENDIENTE] | Roadmap input |
| risks | User-perceived risks | Interview/findings | severity count | weekly/final | [PENDIENTE] | none | no unresolved S0/S1 | [PENDIENTE] | Pilot control |
| willingness signal | Commercial interest signal | Commercial learning template | qualitative only | final | [PENDIENTE] | none | do not infer commitment | [PENDIENTE] | Commercial learning |

### Integrity Metrics

| Metric | Definition | Source | Formula | Frequency | Owner | Baseline | Provisional threshold | Result | Interpretation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| message-plan match | Plan corresponds to user request | Case review | pass/fail | per case | [PENDIENTE] | none | no critical mismatch | [PENDIENTE] | Interpretation fidelity |
| approved-plan-front match | Created front matches approved version | ActionExecution + StrategicFront review | pass/fail | per execution | [PENDIENTE] | none | 100% for successful executions | [PENDIENTE] | Execution fidelity |
| invented fields | Fields not supported by source or user edit | Case review | count | per case | [PENDIENTE] | none | 0 critical accepted fields | [PENDIENTE] | Trust |
| corrected fields | Fields user changed | ProposedAction versions | count | per case | [PENDIENTE] | none | observe | [PENDIENTE] | Proposal quality |
| duplicates | Duplicate StrategicFront creations | DB review / replay case | count | daily | [PENDIENTE] | none | 0 | [PENDIENTE] | Idempotency |
| improper access | Cross-org or role violation | AuditLog/tests | count | daily | [PENDIENTE] | none | 0 | [PENDIENTE] | Security |

## Block 06C Dry-run Calibration

The following values come from the internal automated dry run only. They are not pilot results and must not be used as user-validation evidence.

| Metric | Dry-run evidence | Interpretation |
| --- | --- | --- |
| Complete request execution | DR-01 passed | Backend/API path can create one StrategicFront after approval |
| Clarification | DR-02 passed | Incomplete request is not executed before required data is completed |
| Edit before approval | DR-03 passed | Versioning and edited payload execution work in API path |
| Edit after approval | DR-04 passed | Approval invalidation works in API path |
| Rejection | DR-05 passed | Rejected action cannot execute |
| Permission denial | DR-06 passed | Viewer was denied before mutation |
| Cross-organization denial | DR-07 passed | Other organization could not read/approve |
| Recovery by re-read | DR-08 passed | Persisted state can be reconstructed by API reads |
| Replay | DR-09 passed | Same idempotency key did not duplicate |
| Double click | DR-10 passed | Concurrent requests produced one front |
| Manual comprehension | not measured | Requires observed user session |
| Kill switch behavior | not measured | DR-11..DR-13 pending |
| Support diagnosis | not measured | DR-16 pending |
