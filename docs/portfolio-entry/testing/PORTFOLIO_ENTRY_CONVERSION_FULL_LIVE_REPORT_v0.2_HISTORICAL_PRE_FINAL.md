# Starteria — Conversion Readiness Full Live Rerun Report v0.2

Status: **LIVE_COMPLETED / HARNESS_ONLY**

Provider/model: openai_responses / gpt-5.6-luna; provider-reported model(s): gpt-5.6-luna. Schema mode: strict JSON Schema.

Decision Readiness cognition, fixtures, prompts, thresholds and projection rules were not modified during the run.

## Execution

- Total calls: **66/66**
- Schema-valid A: **33/33**
- Schema-valid B: **33/33**
- Semantic consistency B: **33/33**

## Condition B case results

- CR-01: **3/3** expected READY_WITH_OPEN_ITEMS
- CR-02: **3/3** expected READY_WITH_OPEN_ITEMS
- CR-03: **3/3** expected READY
- CR-04: **3/3** expected READY
- CR-05: **3/3** expected READY_WITH_OPEN_ITEMS
- CR-06: **0/3** expected NOT_READY
- Adversarial: **10/15**

## A/B averages

| Metric | A | B |
|---|---:|---:|
| HUMAN_LANGUAGE | 4.48 | 4.85 |
| MOMENTUM_PRESERVATION | 3.39 | 5.00 |
| ACTIONABILITY | 5.00 | 5.00 |
| VALUE_VISIBILITY | 4.00 | 5.00 |
| CONTINUATION_CLARITY | 3.00 | 5.00 |
| AMBIGUITY_REDUCTION | 5.00 | 5.00 |
| DECISION_PROGRESS | 3.39 | 5.00 |

## Pairwise

- BETTER_WITH_CONVERSION: **33**
- EQUIVALENT: **0**
- BETTER_WITHOUT_CONVERSION: **0**
- BOTH_BAD: **0**

## Failures

| Failure | A | B |
|---|---:|---:|
| PLATFORM_JARGON | 0 | 0 |
| INVENTED_AUTHORITY | 0 | 0 |
| INVENTED_GOVERNANCE | 0 | 0 |
| PREMATURE_PUBLIC_STOP | 3 | 0 |
| FORCED_CONVERSION | 0 | 0 |
| UNNECESSARY_QUESTION | 0 | 0 |
| LATER_WORK_QUESTION | 0 | 0 |
| DECISION_READINESS_REGRESSION | 0 | 0 |

Internal STOP/ROUTE actions are preserved in each run. For B, public realization follows the derived continuation mode; an internal STOP or ROUTE is not itself a public stop or regression.

Ready for product-design integration: **NO**

Recommended next step: if the gate passes, use this evidence for product-design integration review; do not modify productive runtime in this harness slice.
