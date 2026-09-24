# Portfolio Entry Fixture Evaluation Model v0.2

Status: `TESTING`  
Scope: experimental harness evaluation only  
Product runtime modified: `NO`

## Purpose

This model separates a materially required action from cases where more than
one action is safe if the decision boundary, authority boundary, and stage
boundary remain explicit.

The deterministic Decision Readiness adapter is not changed by this model.
Historical fixture text and frozen expectations remain unchanged. Additive
metadata is maintained in:

`PORTFOLIO_ENTRY_FIXTURE_EXPECTATION_METADATA_v0.2.json`

## Expectation modes

### `STRICT_ACTION`

Use only when one action is materially required by the fixture facts.

Examples:

- `BLOCKING` + `USER_CAN_ANSWER` + bounded answer changes the current
  decision → `ASK`.
- formal authority is required → `REQUIRE_ORGANIZATIONAL_INPUT`.
- the remaining work is explicitly later-stage and cannot change the current
  decision → `ROUTE` or `STOP`, according to the fixture's strict action.

A strict case fails when the candidate takes another action, subject to the
decision-loss severity classification.

### `INVARIANT_BASED`

Use when multiple actions can be defensible without losing decision integrity.
The fixture must declare `acceptable_actions` and `required_invariants`.

Example:

```json
{
  "expectation_mode": "INVARIANT_BASED",
  "acceptable_actions": ["ASK", "ROUTE"],
  "required_invariants": [
    "evidence gap remains explicit",
    "no false sufficiency",
    "no authority invention"
  ]
}
```

`INVARIANT_BASED` does not mean every action passes. `STOP`, `ASK`, and
`ROUTE` remain invalid when they violate the declared invariants or erase a
current decision blocker.

## Decision counterfactual metadata

Fixture-only metadata uses:

```text
decision_counterfactual {
  answer_a
  consequence_a
  answer_b
  consequence_b
  materially_different: YES | NO | AMBIGUOUS
}
```

The counterfactual must be short and decision-centred. It should state whether
the plausible answers change enablement, material conditions, routing, or only
later implementation detail. It must not become a numeric score.

## Decision-loss severity

Every failed expectation is classified for reporting only:

| Severity | Meaning |
|---|---|
| `NONE` | No decision-integrity loss; action is accepted or the case is quarantined as insufficient. |
| `MINOR` | One bounded, unnecessary question or equivalent small interaction cost. |
| `MATERIAL` | Premature routing or asking loses material current-decision context. |
| `SEVERE` | Missed blocker, invented authority, false evidence sufficiency, or Step leakage that changes product semantics. |

This is not productive scoring and is not emitted by Portfolio Entry runtime.

## Classification rules

1. Classify the fixture from its stated decision counterfactual, not from the
   adapter's current action.
2. Do not convert an ambiguous fixture into strict merely because the legacy
   expected action is explicit.
3. Preserve an insufficient frozen case as evidence; do not rewrite it to
   improve a result.
4. Use `INVARIANT_BASED` only when each accepted action preserves the stated
   uncertainty and routing boundary.
5. If the fixture does not establish whether answers change the current
   decision, scope/conditions, or only later detail, classify it as
   `INSUFFICIENT_CASE` in the report and add a clarified fixture instead.

## Normalized comparison schema

The same schema is used for the previous baseline and the Decision Readiness
candidate:

```text
FixtureEvaluation {
  fixture_id
  suite
  expectation_mode
  selected_gap
  selected_dimension
  action
  question_count
  explicit_unknown_handling
  local_depth_behavior
  routing_timing
  stop_quality
  authority_handling
  step_leakage
  decision_loss_severity
  invariant_results
  notes
}
```

For `STRICT_ACTION`, compare `action` with the required action. For
`INVARIANT_BASED`, evaluate `invariant_results` and permit only the declared
`acceptable_actions`.

## Current fixture classification

The complete ID-to-mode mapping is in the additive metadata sidecar. Summary:

| Suite | Strict | Invariant-based | Insufficient preserved |
|---|---:|---:|---:|
| Original DR development + holdouts | 0 | 8 | 0 |
| Adversarial development + new holdouts | 15 | 6 | 2 |
| Decision-dependency fixtures + controls | 10 | 0 | 0 |
| Decision-sensitivity fixtures + controls | 14 | 0 | 0 |
| **Existing total** | **39** | **14** | **2** |
| Clarified v0.2 capacity additions | 1 | 1 | 0 |

The two preserved insufficient cases are the original capacity pair. They are
not removed from the historical suite and do not count as candidate failures
until their decision counterfactual is specified.

## Clarified capacity variants

`PORTFOLIO_ENTRY_DECISION_READINESS_CAPACITY_FIXTURES_v0.2.json` adds:

- `CAP- V02-BLOCKING`: capacity exists versus no capacity changes whether the
  current decision can continue. It is `STRICT_ACTION` with `HIGH` sensitivity
  and expected `ASK`.
- `CAP-V02-LATER-STAGE`: capacity answers change planning detail but not the
  current decision or route. It is `INVARIANT_BASED`, `LOW` sensitivity, and
  accepts `ROUTE` or `STOP` while preserving the later-stage boundary.

No arbitrary hour threshold is required by either variant.
