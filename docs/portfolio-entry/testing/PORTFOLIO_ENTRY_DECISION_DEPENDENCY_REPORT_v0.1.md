# HYP-005.1 — Decision Dependency Before Routing

**Status:** `ITERATE`  
**Scope:** harness-only deterministic adapter  
**Product runtime modified:** `NO`

## Frozen holdouts first

Before adding DD fixtures, the unchanged new holdouts were rerun:

| Holdout | Before HYP-005.1 | After HYP-005.1 | Dependency / answerability |
|---|---|---|---|
| ADV-HO-01 | ROUTE, expected ASK | ASK | BLOCKING / USER_CAN_ANSWER |
| ADV-HO-02 | ROUTE, expected ASK | ASK | CONSTRAINING / USER_CAN_ANSWER |
| ADV-HO-03 | STOP, expected ROUTE | ROUTE | NON_BLOCKING / LATER_STAGE_DISCOVERY |

The known premature-routing failure is corrected without changing the frozen
fixtures.

## Experimental rule

`CandidateGap` now records:

```text
current_decision_dependency
answerability
execution_gap_classification
```

Selection order is dependency → answerability/authority → stage fit → route.
Before ROUTE/STOP, the last-mile guard asks once when a current,
user-answerable, materially decision-changing gap remains. It does not reopen
gaps classified as later-stage discovery or authority-owned.

## Regression results

The unchanged regression suite executed with **12 tests passed** across four
test files:

- original development: 5/5;
- original frozen holdouts: 3/3;
- adversarial development: 14/18 strict legacy expected actions;
- anti-keyword pairs: 3/3 semantic parity;
- STOP fixtures: unchanged and passing;
- four changed adversarial actions are recorded in the adversarial report as
  `F-LAST-MILE-OVERASK` candidates, not hidden by changing fixtures.

The adversarial action changes are `ADV-01`, `ADV-03` and the two capacity pair
members. They are a possible over-correction: the new rule treats their
execution/evidence gap as current-decision constraining and asks instead of
routing.

## Decision-dependency development fixtures

Six new DD fixtures passed:

| Case | Expected behavior | Observed |
|---|---|---|
| DD-01 | BLOCKING + user → ASK | PASS |
| DD-02 | BLOCKING + organization → REQUIRE_ORGANIZATIONAL_INPUT | PASS |
| DD-03 | NON_BLOCKING + later stage → ROUTE | PASS |
| DD-04 | CONSTRAINING + bounded user answer → ASK | PASS |
| DD-05 | blocker beats later detail → organizational input | PASS |
| DD-06 | technical uncertainty non-blocking → ROUTE | PASS |

Two semantic paired controls passed: explicit vs implicit blocker and strong
wording vs neutral later-stage detail. Both pairs preserved dependency,
answerability and action.

## Human review extension

The review artifact now includes:

- `decision_dependency_accuracy`;
- `routing_timing`;
- `last_mile_question_quality`;
- explicit review of ADV-HO-01…03;
- provisional scores of 4/5 for all three new dimensions.

The main review question is now whether the last-mile ASK is genuinely
decision-critical or merely a useful execution question.

## Failure codes

Added experimentally:

```text
F-PREMATURE-ROUTE
F-MISCLASSIFIED-BLOCKER
F-MISCLASSIFIED-LATER-STAGE
F-LAST-MILE-MISSED
F-LAST-MILE-OVERASK
```

## Hypothesis decision

HYP-005 remains `ITERATE`. The frozen holdouts now pass, but the adversarial
suite contains four unchanged expected-action regressions and therefore does
not meet the “no systematic over-asking” condition for a live candidate.

## Recommendation

Keep the adapter harness-only. Investigate a further general distinction
between a `CONSTRAINING` gap that changes the current decision and one that is
important but safely routeable. Do not modify productive runtime, prompts,
contracts, Core or Steps.

