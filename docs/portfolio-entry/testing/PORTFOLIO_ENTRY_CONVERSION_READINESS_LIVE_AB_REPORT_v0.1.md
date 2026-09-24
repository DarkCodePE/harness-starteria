# Starteria — Conversion Readiness Live A/B Report v0.1

Status: **LIVE_COMPLETED / HARNESS_ONLY**

Provider/model: openai_responses / gpt-5.6-luna; provider-reported model(s): gpt-5.6-luna. Schema mode: strict JSON Schema.

No prompts, fixtures, thresholds or Decision Readiness cognition were modified during execution.

## Execution

- Target calls: **66**
- Completed calls: **66**
- Condition A schema-valid: **33/33**
- Condition B schema-valid: **33/33**
- Adversarial B pass rate: **5/15**

## Condition B focused states

- CR-01: expected READY_WITH_OPEN_ITEMS; observed READY_WITH_OPEN_ITEMS; 3/3 correct
- CR-02: expected READY_WITH_OPEN_ITEMS; observed READY_WITH_OPEN_ITEMS; 3/3 correct
- CR-03: expected READY; observed READY_WITH_OPEN_ITEMS; 0/3 correct
- CR-04: expected READY; observed READY, READY_WITH_OPEN_ITEMS; 1/3 correct
- CR-05: expected READY_WITH_OPEN_ITEMS; observed READY_WITH_OPEN_ITEMS; 3/3 correct
- CR-06: expected NOT_READY; observed NOT_READY; 3/3 correct

## A/B averages

| Metric | A | B |
|---|---:|---:|
| HUMAN_LANGUAGE | 4.97 | 4.85 |
| MOMENTUM_PRESERVATION | 3.39 | 4.45 |
| ACTIONABILITY | 4.52 | 4.88 |
| VALUE_VISIBILITY | 4.00 | 4.30 |
| CONTINUATION_CLARITY | 3.00 | 4.21 |
| AMBIGUITY_REDUCTION | 5.00 | 5.00 |
| DECISION_PROGRESS | 4.52 | 4.88 |

## Pairwise

- BETTER_WITH_CONVERSION: **18**
- EQUIVALENT: **0**
- BETTER_WITHOUT_CONVERSION: **3**
- BOTH_BAD: **12**

## Failure summary

| Failure | A | B |
|---|---:|---:|
| PLATFORM_JARGON | 0 | 0 |
| INVENTED_AUTHORITY | 0 | 0 |
| INVENTED_GOVERNANCE | 0 | 0 |
| PREMATURE_STOP | 3 | 3 |
| UNNECESSARY_QUESTION | 9 | 9 |
| FORCED_CONVERSION | 0 | 2 |
| SALESY_LANGUAGE | 0 | 0 |
| DECISION_READINESS_REGRESSION | 0 | 0 |

The live evaluator records material/severe flags without tuning during the run. Condition B is ready for product-design integration only if its focused state gate, schema gate and visible-language failure gates are all satisfied; productive runtime integration remains out of scope.

## Conversion-specific gate

| Gate | Result |
|---|---|
| B schema-valid >= 32/33 | **PASS — 33/33** |
| Material/severe invented authority | **PASS — 0** |
| Material/severe invented governance | **PASS — 0** |
| Platform-jargon leakage | **PASS — 0** |
| Material premature stop | **FAIL — 1** |
| Material forced conversion | **FAIL — 2** |
| Material salesy language | **PASS — 0** |
| CR-01 / CR-02 / CR-05 expected state 3/3 | **PASS** |
| CR-03 expected READY 3/3 | **FAIL — 1/3** |
| CR-04 expected READY 3/3 | **FAIL — 0/3** |
| CR-06 expected NOT_READY 3/3 | **PASS** |
| B HUMAN_LANGUAGE >= 4.5 | **PASS — 4.91** |
| B MOMENTUM_PRESERVATION >= 4.5 | **FAIL — 4.45** |
| B ACTIONABILITY >= 4.5 | **PASS — 4.88** |
| B VALUE_VISIBILITY >= 4.5 | **FAIL — 4.30** |
| B CONTINUATION_CLARITY >= 4.5 | **FAIL — 4.39** |

Overall conversion gate: **FAIL**.

## Special review

- **CR-01:** 3/3 correct. The missing strategic criterion remains owned by direction, while comparison preparation can continue.
- **CR-02:** 3/3 correct. No decision owner is invented; the pilot can be prepared while authority is confirmed.
- **CR-04:** 0/3 correct. The model preserved non-invention, but incorrectly represented a later experiment as an open conversion item and once emitted a premature STOP. This is the most important focused failure.
- **CR-05:** 3/3 correct. The management confirmation requirement remains explicit and preparation can continue.
- **CR-06:** 3/3 correct. The model withholds conversion and asks a clarification question.

Adversarial B pass rate under the frozen evaluator: **5/15**. The main adversarial weakness was unnecessary Entry questioning on cases where a clear need or later-stage detail should have been enough to continue.

Decision Readiness regression: **0 recorded by the evaluator**. The live result still requires a focused rerun for CR-03 and CR-04 before any product-design promotion, because the conversion state is unstable or wrong even though the underlying Decision Readiness action remains plausible.

Ready for product-design integration: **NO**.

Recommended next step: manually blind-review CR-01, CR-02, CR-04, CR-05 and CR-06 across both conditions, then decide whether to promote the continuation contract as a product-design input.
