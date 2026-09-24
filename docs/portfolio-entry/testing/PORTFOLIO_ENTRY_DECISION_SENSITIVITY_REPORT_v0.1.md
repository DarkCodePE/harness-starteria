# HYP-005.2 — Decision Sensitivity Gate Report

**Status:** `ITERATE`  
**Scope:** harness-only deterministic adapter  
**Product runtime modified:** `NO`

## Decision before implementation

The four HYP-005.1 changed actions were reviewed before modifying the adapter:

| Case | Classification | Reason |
|---|---|---|
| ADV-01 | TRUE_OVERASK | adoption issue needed open exploration, not a bounded current-turn question |
| ADV-03 | LEGACY_EXPECTATION_POSSIBLY_WRONG | weak evidence can change a scale decision |
| PAIR-CAPACITY-KEYWORDS | AMBIGUOUS | capacity may change conditions while route remains stable |
| PAIR-CAPACITY-PLAIN | AMBIGUOUS | same semantics, independent wording control |

Fixtures and expected outcomes were not changed.

## HYP-005.2 rule

`CandidateGap` now records:

```text
decision_sensitivity
counterfactual_decision_test
answer_shape
```

The selection gate is:

```text
BLOCKING + USER_CAN_ANSWER → ASK
CONSTRAINING + HIGH → ASK
CONSTRAINING + MEDIUM + bounded answer + material handoff effect → ASK
CONSTRAINING + LOW → DEFER / ROUTE
OPEN_EXPLORATION → ROUTE / DEFER unless BLOCKING
```

The counterfactual trace remains concise and records only two plausible answer
branches and whether they materially branch the decision.

## Frozen regression results

Unchanged suites:

- original development: **5/5**;
- original frozen holdouts: **3/3**;
- ADV-HO-01: **ASK**, `BLOCKING`, `HIGH`;
- ADV-HO-02: **ASK**, `CONSTRAINING`, `MEDIUM`;
- ADV-HO-03: **ROUTE**, `NON_BLOCKING`, `LOW`;
- DD fixtures: **6/6**;
- decision-dependency paired controls: **2/2**;
- STOP fixtures: preserved.

The combined deterministic suite passed **14 tests**.

## Adversarial regression

The unchanged adversarial development set is now **15/18 strict expected-action
matches**, up from 14/18 under HYP-005.1. The remaining three changed actions
are:

- ADV-03: ASK instead of legacy ROUTE;
- PAIR-CAPACITY-KEYWORDS: ASK instead of legacy ROUTE;
- PAIR-CAPACITY-PLAIN: ASK instead of legacy ROUTE.

ADV-01 returned to ROUTE because its adoption gap is open exploration without a
bounded answer shape. This is the intended sensitivity correction.

Anti-keyword semantic parity remains **3/3**. The capacity pair still matches
semantically; its action is ASK under the new gate.

## New sensitivity fixtures

Eight new development fixtures passed: **8/8**.

| Fixture group | Result |
|---|---|
| DS-01, DS-04, DS-07: high sensitivity | ASK |
| DS-02: medium sensitivity, bounded scope condition | ASK |
| DS-03, DS-06, DS-08: low sensitivity/later stage | ROUTE |
| DS-05: blocking organizational authority | REQUIRE_ORGANIZATIONAL_INPUT |

Three semantic pairs passed: **3/3**.

- explicit vs implicit high-sensitivity blocker: same `HIGH` + ASK;
- dramatic vs neutral low-sensitivity detail: same `LOW` + ROUTE;
- numeric vs indirect capacity: same `MEDIUM` + ASK.

All blocking/constraining gaps expose a two-branch counterfactual test.

## Over-asking and under-asking delta

| Measure | HYP-005.1 | HYP-005.2 | Delta |
|---|---:|---:|---:|
| Changed adversarial actions | 4 | 3 | -1 |
| New sensitivity cases asking unnecessarily | not available | 0/8 | no new over-ask observed |
| New sensitivity cases under-asking | not available | 0/8 | no new under-ask observed |
| Frozen holdout failures | 0/3 | 0/3 | unchanged |

The improvement is real but incomplete: evidence and capacity remain
potentially over-asked when their legacy expected route is permissive.

## STOP and routing behavior

STOP behavior did not regress. Low-sensitivity technical detail, open
exploration and later-stage discovery route without a user-facing question.
Blocking gaps still ask or require organizational input before routing.

Routing now considers sensitivity and answer shape rather than uncertainty or
keyword frequency alone. No systematic under-routing was observed in the new
sensitivity set.

## Human review extension

The human-review artifact adds:

- `decision_sensitivity_accuracy`;
- `counterfactual_branch_quality`;
- `last_mile_value`;
- `bounded_question_quality`.

Provisional review anchors are 4/5 for each dimension. Independent human
review remains required before any live candidate decision.

## Failure codes

Added experimentally:

```text
F-SENSITIVITY-OVERSTATED
F-SENSITIVITY-UNDERSTATED
F-NONBRANCHING-QUESTION
F-OPEN-ENDED-LAST-MILE
F-COUNTERFACTUAL-MISREAD
```

Existing routing, last-mile and lexical failure codes remain active.

## Hypothesis decision

HYP-005 remains **`ITERATE`**. The sensitivity gate improves adversarial action
stability and preserves all frozen holdouts, but three legacy action changes
remain and the evidence is deterministic only.

## Recommendation

Do not promote to productive runtime or active contracts. A future live-candidate
decision requires independent human review of the three remaining changed
actions and evidence that capacity/evidence questions are not systematically
over-asked when routing is already sufficient.

## HYP-005.3 rerun

The adapter now derives dependency and sensitivity from coherent counterfactual
consequences before lexical or gap-dimension heuristics. The evaluator and all
existing fixture expectations remain frozen.

- `CAP-V02-BLOCKING-v0.2.1`: **PASS**, `ASK`, `ROUTE_CHANGE`, `BLOCKING`,
  `HIGH`, `USER_CAN_ANSWER`.
- `CAP-V02-LATER-STAGE`: **PASS**, observed `STOP`; `NO_MATERIAL_CHANGE`,
  `NON_BLOCKING`, `LOW`; no Step leakage.
- New branch fixtures: **11/11 PASS** — 8 branch cases and 3
  anti-overcorrection cases.
- Anti-overcorrection: **3/3 PASS**.
- `F-BLOCKER-DOWNGRADED`: **0**; `F-COUNTERFACTUAL-OVERUPGRADE`: **0**.

HYP-005 remains **`ITERATE`**. The baseline comparison gate is now satisfied,
while promotion to product remains out of scope.
