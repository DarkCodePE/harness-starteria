# HYP-005.3 — Counterfactual Branch Classification Report

Status: `ITERATE`

Scope: deterministic Portfolio Entry decision-readiness adapter only.

Product runtime modified: `NO`

Evaluator modified: `NO`

## Rule implemented

When fixture-only counterfactual metadata contains coherent A/B consequences,
the adapter classifies the consequence branch before lexical cues, gap
dimension, or stage defaults. `UNKNOWN` retains evidence-based behavior.

| Branch | Dependency | Sensitivity |
|---|---|---|
| `ENABLEMENT_CHANGE` | `BLOCKING` | `HIGH` |
| `ROUTE_CHANGE` | `BLOCKING` | `HIGH` |
| `CONDITION_CHANGE` | `CONSTRAINING` | `MEDIUM`, or `HIGH` when material |
| `SCOPE_CHANGE` | `CONSTRAINING` | `MEDIUM` by default |
| `DETAIL_CHANGE` | `NON_BLOCKING` | `LOW` |
| `NO_MATERIAL_CHANGE` | `NON_BLOCKING` | `LOW` |
| `UNKNOWN` | evidence-based fallback | evidence-based fallback |

## Required CAP rerun

`CAP-V02-BLOCKING-v0.2.1`: **PASS**

```text
action: ASK
decision_branch_type: ROUTE_CHANGE
dependency: BLOCKING
sensitivity: HIGH
answerability: USER_CAN_ANSWER
```

`CAP-V02-LATER-STAGE`: **PASS**

```text
action: STOP (acceptable ROUTE/STOP)
decision_branch_type: NO_MATERIAL_CHANGE
dependency: NON_BLOCKING
sensitivity: LOW
Step leakage: NO
```

## New fixtures

`PORTFOLIO_ENTRY_COUNTERFACTUAL_BRANCH_FIXTURES_v0.1.json`: **11/11 PASS**.

- CB-01..CB-08: branch classification and consequence-driven mapping pass.
- CB-07/CB-08: same execution/capacity wording changes classification only
  because the counterfactual consequences change.
- CB-09..CB-11: anti-overcorrection **3/3 PASS**.

Failure counts:

```text
F-BRANCH-TYPE-MISCLASSIFIED: 0
F-BLOCKER-DOWNGRADED: 0
F-COUNTERFACTUAL-OVERUPGRADE: 0
```

## Regression

The unchanged HYP-005 suite passed: **5 files / 14 tests**. No fixture
expectations were edited, and no productive contract, route, schema, backend,
frontend, prompt, or runtime behavior was changed.

## Gate

```text
HYP-005: ITERATE
EVALUATOR_FREEZE_READY: YES
BASELINE_COMPARISON_READY: YES
```

The normalized baseline comparison may resume as a separate audit. Promotion
to product remains out of scope.
