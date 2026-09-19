# Portfolio Home to Initiative Handoff Traceability v0.1

**Estado:** PH-0 frozen traceability; runtime mapping pending

**Authority split:** The separation of Invitation, Accept, Start and Step
activation is compatible with Core v0.2. `pre_start`, exact ownership and
Activation Readiness transitions, Challenge coverage/cardinality and Decision
Authority semantics are `CANDIDATE DEPENDENCY / ADR-RETEST REQUIRED`.

## End-to-end boundary

| Source / state | Portfolio Home may show | Authoritative action owner | Runtime claim in PH-0 |
| --- | --- | --- | --- |
| Challenge / Portfolio context | why the work matters and lineage | Portfolio Governance | target only |
| Invitation `sent/viewed` | pending invitation and recipient context | Activation/Handoff | contract present; runtime not certified |
| Invitation `accepted` | accepted responsibility | Activation/Handoff | contract present; runtime not certified |
| `pre_start` | accepted Initiative awaiting explicit Start | Activation/Handoff | candidate-dependent target semantics; technical representation unresolved |
| Initiative Overview | inherited context and next action | Initiative Overview / Handoff | target only |
| `started` | active Initiative reference and traceability | Initiative Core boundary | Start remains explicit; Steps out of PH-0 |

## Required traceability

For each Home card or action, retain:

- source reference(s);
- Portfolio/Challenge lineage when applicable;
- invitation and Initiative identity without conflating them;
- lifecycle state and last material transition;
- actor/channel context where relevant;
- link to the authoritative command/read surface;
- whether the value is provisional, confirmed or canonical.

## Forbidden collapses

```text
Invitation ≠ Initiative
Accept ≠ Start
Start ≠ Step 0 activation details
Portfolio Home ≠ Initiative workspace
Projection ≠ second source of truth
```

## Handoff contract references

- [Activation Experience Contract](../05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md)
- [Activation Acceptance Checklist](../05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md)
- [Current State Audit](../05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md) — evidence only

The current-state audit identifies a material gap: the observed
`createProject(challengeLink)` path collapses acceptance, ownership, Start and
Step initialization. It must not be treated as the target Home-to-Handoff
implementation.
