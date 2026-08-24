# Copilot-first Dry Run Resilience Evidence

Run ID: `resilience-1785336060725`

Timestamp: `2026-07-29T14:41:00.725Z`

Database: `starteria_pilot_dry_run`

Evidence file: `front/.pilot-dry-run/resilience-1785336060725.json` (ignored by Git).

The run used synthetic dry-run users and organizations only. Passwords, tokens, cookies and full idempotency keys were not stored in versioned documentation.

| Case | Status | Evidence type | Flags / mode | Key evidence |
| --- | --- | --- | --- | --- |
| DR-11 | passed | automated technical | `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false` | Action Plan and ProposedAction stayed visible through API; approval was denied with `COPILOT_CAPABILITY_DISABLED`; no StrategicFront was created; audit contains `copilot.feature_flag.denied.approve_action`. |
| DR-12 | passed | automated technical | `COPILOT_WRITE_ENABLED=false` | Existing conversation/plan reads returned 200; create, send, edit, approve, reject and execute returned 403; audit contains feature-flag denial events. |
| DR-13 | passed | automated technical | `COPILOT_ENABLED=false` | Copilot read/create operations returned 403; Portfolio read stayed available; after reactivation the existing Action Plan was readable. |
| DR-14 | passed | automated technical | `COPILOT_DRY_RUN_PORTFOLIO_FAILURE_MODE=before_create` | Execution ended `failed`; error code `COMMAND_EXECUTION_FAILED`; no StrategicFront was created; audit contains `copilot.execution.failed`. |
| DR-15 | passed | automated technical | `COPILOT_DRY_RUN_PROJECTION_FAILURE_MODE=strategic_fronts_read` | Command completed and created exactly one StrategicFront; projection read returned 503; replay with same key did not duplicate; after restoring reads the front appeared. |
| DR-16 | passed partial | automated support reconstruction | normal flags | Records were reconstructable from conversation, Action Plan, ProposedAction, ActionExecution and AuditLog. Human support simulation remains pending. |

## Manual Evidence

Manual UI observation was **not executed** in this session. The resilience evidence above must not be used as a substitute for a person reviewing the frontend experience.

Required manual checks still pending:

- Capability disabled UI state.
- Write kill switch UI state.
- Total kill switch UI state.
- Projection failure copy and retry behavior.
- Desktop/mobile/keyboard/focus/accessibility observation.
- Human support operator walkthrough using the runbook.

## Cleanup

The runner isolates cases and phases on separate local ports. It emitted immediate post-cleanup messages that endpoints still responded, but direct post-run listener verification found no listeners on the used ports:

```text
4200,4201,4202,4203,4204,4205,4301,4302,4304,4402,4404
5186,5187,5188,5189,5190,5191,5287,5288,5290,5388,5390
```

## Decision

Resilience technical evidence: **passed**.

Observed dry run: **not complete** until manual observation is captured.
