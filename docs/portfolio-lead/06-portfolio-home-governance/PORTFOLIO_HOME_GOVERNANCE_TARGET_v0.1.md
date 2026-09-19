# Portfolio Home Governance Target v0.1

**Estado:** PH-0 frozen target / Experience-level candidate for implementation planning

**Authority split:** Core v0.2 is factual current. The external Core v0.3
candidate is not authoritative. Rules below are compatible with v0.2 unless
marked `CANDIDATE DEPENDENCY / ADR-RETEST REQUIRED`.

## Purpose

Portfolio Home helps a Portfolio Lead answer:

```text
What needs attention, why does it matter, and what is the next governed action?
```

It reads Portfolio governance state, connects it to strategic context, and
exposes traceability toward Initiative activation. It does not perform
Initiative execution.

## Invariants

- Portfolio governance and Initiative Core remain separate bounded contexts.
- `AI_SUGGESTED` and `AI_INFERRED` never become canonical without human/domain
  confirmation.
- A pending invitation is not an active Initiative.
- Accept is not Start; Start is not a Step implementation detail.
- Portfolio Home does not create Projects, Initiatives, Challenges, Strategic
  Fronts or Steps as a side effect of reading.
- A projection is derived, versioned and explainable from governed sources.
- Channel and presentation do not change authority or permissions.

## Home responsibilities

Home may present:

- current Portfolio anchor and its provenance;
- confirmed and provisional work with their review status;
- attention items, dependencies, missing signals and decision paths;
- invitations and activation states;
- initiative coverage only with semantically correct lifecycle labels;
- one contextual next action;
- a traceable path to Initiative Overview and, only after Start, Initiative
  Core.

Home must not present a derived score as a canonical readiness decision or
collapse `invited`, `accepted`, `pre_start` and `started` into one count.

## Target states

```text
HOME_A  context / anchor needs clarification
HOME_B  anchor understood, no governed work yet
HOME_C  provisional work or mutations await review
HOME_D  first Portfolio Reading available
HOME_E  attention or blocking governance signal exists
HOME_F  decision-ready Portfolio signal
```

These are read-model states, not new Core lifecycle states.

## Boundary with Activation/Handoff

Portfolio Home may link to the invitation or Initiative Overview and display
the lifecycle state. It may not infer that an Initiative is active merely from
an invitation, and it may not start Core. The explicit boundary remains:

```text
Portfolio / Challenge
→ Invitation
→ Accept
→ pre_start
→ Initiative Overview
→ Start
→ Initiative Core
```

The separation `Invitation != Initiative`, `Accept != Start`, `Accept != Step
active` and the no-silent-activation rule are compatible with Core v0.2.
Activation Readiness, exact `pre_start`, ownership transition semantics,
expanded Decision Authority semantics, Challenge coverage/cardinality, and
the exact moment of Step materialization are `CANDIDATE DEPENDENCY /
ADR-RETEST REQUIRED`.

## Non-goals

This target does not authorize UI redesign, schema changes, backend changes,
Step changes, auth changes, or activation runtime. Those require a later slice,
its own guardrail check, and validation evidence.
