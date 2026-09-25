# Starteria — Later Work Relationship Stabilization v0.1

Status: `HARNESS_ONLY_EXPERIMENTAL`

This isolated slice stabilizes only the relationship between current decision items and later work. It does not modify Decision Readiness cognition, conversion state definitions, grounding/sufficiency, deterministic semantic projection, continuation mode, visible language, productive runtime, frontend, database or Portfolio Lead runtime.

## Rule under test

For every unresolved item, ask whether leaving it unresolved today prevents the user's current job from responsibly moving forward. If yes, classify it as `CURRENT_DECISION_BLOCKER` or `CURRENT_DECISION_CONDITION`. If no, and it belongs to work that follows the current decision, classify it as `LATER_WORK`.

Importance, initiative membership, eventual implementation relevance and user mention are not sufficient grounds for current classification.

## Frozen boundary

CR-ADV-05 is consumed from `PORTFOLIO_ENTRY_CONVERSION_READINESS_FIXTURES_v0.1.json` without rewriting. The expected relation is `LATER_WORK`: the objective is understood and architecture/provider selection follows the current decision.

## Controls

| Fixture | Scenario | Expected relation |
|---|---|---|
| LW-CTRL-01 | decision complete; architecture design remains | `LATER_WORK` |
| LW-CTRL-02 | mandatory regulatory architecture proof is needed now | `CURRENT_DECISION_BLOCKER` |
| LW-CTRL-03 | provider selection is not needed to decide continuation | `LATER_WORK` |
| LW-CTRL-04 | provider cost determines approved-budget viability | `CURRENT_DECISION_CONDITION` |
| LW-CTRL-05 | initiative approved; next experiment remains to be designed | `LATER_WORK` |

## Deterministic invariant

`current_open_items` may contain only current-decision blockers or conditions. When the need is sufficient and `current_open_items` is empty, later work does not prevent `READY` and `CONTINUE_TO_NEXT_WORK`.

## Validation population

The runner requires 6/6 deterministic passes before starting live execution. It then runs the frozen CR-ADV-05 ten times and each control five times, for 35 live calls, using the explicitly configured provider/model.

Failures are recorded using the requested taxonomy and are not repaired during a live run.
