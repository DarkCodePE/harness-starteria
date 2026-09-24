# HYP-005 — Adversarial Expansion Report v0.1

**Status:** `ITERATE`  
**Runtime productivo modificado:** `NO`  
**Adapter:** deterministic experimental, harness-only  
**Original evidence:** 5/5 development, 3/3 frozen holdouts

## Scope and preservation

The original DR-01…DR-05 fixtures and H5-HO-A…C holdouts were not edited. The
new adversarial JSON contains 18 development cases:

- ADV-01…ADV-09: 9 cross-dimensional cases;
- STOP-01…STOP-03: 3 restraint cases;
- PAIR-GOV, PAIR-VALUE, PAIR-CAPACITY: 6 anti-keyword pair members.

Three new holdouts were frozen after the first adversarial evaluation:
`ADV-HO-01`, `ADV-HO-02`, `ADV-HO-03`.

## Adapter changes

The adapter was changed only after the existing-case human review and initial
adversarial run. Changes are general rules:

- distinguish established governance from governance vocabulary;
- treat evidence weakness separately from relevance uncertainty;
- detect implicit capacity signals such as overload and unavailable coverage;
- route technical architecture/provider/pipeline detail to a later stage;
- let formal authority boundaries override an otherwise askable gap;
- record `selection_basis`, `dominant_competing_gap` and
  `selection_tradeoff` in the experimental trace.

No fixture ID, productive prompt, contract, schema or runtime route is used by
the adapter.

## Results

### Original fixtures

The original isolated suite remains green: **7/7 tests passed** (5 adapter
tests plus 2 existing baseline tests). The original 5 development fixtures and
3 frozen holdouts remain acceptable under their existing invariants.

### Adversarial development

The HYP-005.2 sensitivity rule was applied without changing the adversarial
fixtures. **15/18 strict legacy expected-action cases remain matched.** All
runs retain five-dimension reassessment traces and zero existing structural
violations. The four changed results are documented as regressions below.

Highlights:

- ADV-01 routes adoption/ execution instead of continuing technical validation.
- ADV-02 moves from established value to capacity.
- ADV-03 selects weak evidence while governance remains sufficient.
- ADV-04 does not reopen governance after accountability is established.
- ADV-05 avoids strategy-first bias.
- ADV-06 routes architecture/provider uncertainty to the initiative stage.
- STOP-01…03 stop or route without filling implementation detail.

### Anti-keyword pairs

**3/3 pairs preserved semantic parity.** Each pair preserved the same selected
dimension and final action despite different wording. The capacity pair now
asks under the dependency rule; this changed action remains recorded as a
regression rather than a fixture update:

| Pair | Result |
|---|---|
| Governance keywords vs plain governance | PASS: RELEVANCE / ASK |
| Explicit value terms vs plain value terms | PASS: RELEVANCE / ASK |
| Capacity keywords vs implicit overload | PASS: EXECUTION_REALITY / ASK under sensitivity gate |

This is evidence of improved robustness, not proof of semantic generalization.

### New holdouts

The new holdouts executed without structural violations, but only **1/3 met
the frozen expected final action**:

| Holdout | Observed | Frozen expectation | Result | Failure |
|---|---|---|---|---|
| ADV-HO-01 | ROUTE later stage after execution/adoption signal | ASK | FAIL | `F-WRONG-DOMINANT-GAP` / `F-STOP-TOO-LATE` |
| ADV-HO-02 | ROUTE Portfolio after implicit execution signal | ASK | FAIL | `F-LEXICAL-BIAS` / `F-UNCERTAINTY-OVER-MATERIALITY` |
| ADV-HO-03 | STOP | ROUTE | PASS-equivalent restraint | none; STOP is allowed by the invariant |

The two failures remain frozen evidence. They were not rewritten to improve
the score.

## HYP-005.1/HYP-005.2 regression notes

The unchanged adversarial expectations that remain changed are:

- `ADV-03`: ROUTE → ASK because weak evidence remains user-answerable before
  the scale decision;
- `PAIR-CAPACITY-KEYWORDS` and `PAIR-CAPACITY-PLAIN`: ROUTE → ASK because the
  capacity gap is current-decision constraining with bounded answer shape.

ADV-01 returned to ROUTE after sensitivity classified open adoption
exploration as insufficiently bounded for the current turn. The remaining
three are observable regressions against previous adapter behavior and remain
evidence for possible `F-SENSITIVITY-OVERSTATED` / `F-LAST-MILE-OVERASK`.

## Human review rubric

All original, adversarial development and holdout cases are reviewable from
their structured traces. The dimensions are scored 1–5:

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| cross_dimension_prioritization | clearly follows last/visible signal | competing gaps noticed but weakly ranked | material decision gap clearly outranks alternatives |
| local_depth_control | repeats or loops | stops some repetition | only asks again with new material evidence |
| explicit_unknown_handling | invents/repeats unknown | records uncertainty ambiguously | routes to authority without asking the user to guess |
| routing_quality | wrong stage/source | plausible but imprecise | correct Portfolio/Initiative/Later-stage/Org input route |
| stop_quality | keeps asking or stops prematurely | acceptable but questionable | stops exactly at sufficiency/boundary |
| strategy_execution_balance | always strategy-first | notices execution late | operational constraint wins when decision-critical |
| lexical_robustness | wording changes outcome | some wording sensitivity | paired wording yields same result |
| materiality_over_uncertainty | asks because unknown is large | mixed | asks only when uncertainty can change decision/route |

Provisional adversarial human-review averages before independent reviewer
scoring:

```text
cross_dimension_prioritization  4
local_depth_control             4
explicit_unknown_handling       4
routing_quality                 4
stop_quality                    4
strategy_execution_balance      4
lexical_robustness              4
materiality_over_uncertainty    3
```

These are not automated hypothesis scores and do not replace reviewer notes.

## Comparison

| Measure | Baseline deterministic adapter | Adversarially adjusted adapter |
|---|---:|---:|
| Original development | 5/5 | 5/5 |
| Original frozen holdouts | 3/3 | 3/3 |
| Adversarial development | not implemented | 15/18 strict; 3 changed actions |
| Anti-keyword pairs | not implemented | 3/3 |
| New holdouts | not implemented | 1/3 strict; 3/3 executed |
| Human review coverage | original 8 only | original 8 + 21 new cases |
| Structural regressions | 0 observed | 0 observed |

## Failure codes

Existing codes are retained. This round adds/uses:

```text
F-LEXICAL-BIAS
F-UNCERTAINTY-OVER-MATERIALITY
F-ESTABLISHED-GAP-REOPENED
F-WRONG-DOMINANT-GAP
F-STOP-TOO-LATE
F-STOP-TOO-EARLY
```

The new holdout failures indicate a remaining tradeoff: once execution is
identified, the adapter can route too early instead of asking the one question
that distinguishes “blocked now” from “later-stage work.” This is a real
materiality/routing weakness, not a fixture issue.

## Hypothesis decision

HYP-005 remains **`ITERATE`**. It is not ready for a live candidate because
the new holdout pass rate is 1/3 and the remaining failures concern dominant
gap selection and lexical/uncertainty interaction.

## Recommended next step

Add a second deterministic iteration with a general distinction between:

```text
execution gap unresolved and decision-blocking
vs
execution gap identified but already routed to later-stage work
```

Then rerun the frozen new holdouts unchanged and perform independent human
review. A live candidate should remain blocked until the holdout failures are
understood; no productive promotion is authorized.
