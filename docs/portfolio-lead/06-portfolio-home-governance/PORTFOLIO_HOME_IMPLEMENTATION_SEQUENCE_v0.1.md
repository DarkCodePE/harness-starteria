# Portfolio Home Implementation Sequence v0.1

**Estado:** PH-0 sequence only; PH-1 not executed

**Authority split:** PH-0 may preserve v0.2-compatible Experience targets and
document candidate migration gaps. No candidate gap authorizes PH-1 or runtime
implementation. Candidate-dependent items require ADR, original evidence and
re-test first.

The sequence below is a planning boundary. No runtime work is included in
this PH-0 change.

## Preconditions

1. Resolve or explicitly carry the Core authority conflict.
2. Confirm the approved Portfolio Governance contract and its invariants.
3. Reconcile Activation/Handoff technical representation of `pre_start`
   (`CANDIDATE DEPENDENCY / ADR-RETEST REQUIRED`).
4. Define the source/event inventory and permission boundary.
5. Produce the V2 change guardrail check for the selected slice.

## Planned slices

### PH-1 — Read model contract tests

Define projection fixtures for HOME_A–HOME_F, provenance, lifecycle labels,
source references and negative cases. No UI or persistence change is implied.

### PH-2 — Projection integration

Connect governed Portfolio, Bootstrap and Handoff read sources through an
adapter/read service. Preserve the no-side-effect boundary and document any
legacy compatibility consumer.

### PH-3 — Home surface integration

Expose the projection in the existing Portfolio Home surface, keeping the
Initiative Overview and Steps outside the Home implementation slice.

### PH-4 — Activation/Handoff integration

Expose Accept and Start through the shared bounded-context commands. Validate
permissions, idempotency, audit events and traceability. Do not collapse these
commands into Home navigation.

### PH-5 — E2E and closure

Validate the journey:

```text
Portfolio / Challenge
→ Invitation
→ Accept
→ pre_start
→ Initiative Overview
→ Start
→ Initiative Core boundary
```

Close only when the acceptance checklist, negative tests, current-state report
and Manifest status agree. A visual Home update alone is not V2 migration.

## Stop conditions

Stop and raise an ADR if implementation requires deciding Project vs
Initiative identity, canonical `pre_start` representation, Challenge
cardinality/coverage, Step materialization timing, canonical ownership or
Decision Authority semantics.
