# Starteria — Conversion Sufficiency Grounding v0.1

Status: `HARNESS_ONLY_EXPERIMENTAL`

This slice grounds conversion sufficiency in user-provided evidence. It does not modify Decision Readiness cognition, item relations, current/later separation, conversion semantics, continuation modes or visible realization strategy.

## Grounding metadata

For `understood_need`, `desired_outcome` and `current_decision_or_action`, the harness records:

- `USER_SUPPORTED`: the user's actual message contains a concrete situation, problem, desired result, decision, change, requirement or opportunity.
- `REASONABLE_INFERENCE`: the model supplied a plausible interpretation not established by the user's message.
- `NOT_AVAILABLE`: no usable content is present.

These labels are internal only.

## Sufficiency projection

`need_sufficient` is true only when at least one meaningful conversion anchor is `USER_SUPPORTED`. A non-empty model field is never evidence by itself. A KPI, sponsor, budget, initiative name, strategic objective or formal owner is not required.

```text
need_sufficient = false
  -> conversion_readiness = NOT_READY
  -> continuation_mode = CLARIFY

need_sufficient = true + current_open_items.length > 0
  -> READY_WITH_OPEN_ITEMS / CONTINUE_WITH_OPEN_ITEM

need_sufficient = true + current_open_items.length = 0
  -> READY / CONTINUE_TO_NEXT_WORK
```

The source grounding check is semantic and generalized: it requires concrete non-vague content plus an actionable problem/result/decision/change/requirement/opportunity anchor. It does not special-case “Necesito ordenar esto” or any single literal input, and it rejects solution-only ideas without a problem or outcome.

## Validator additions

- `SC-07`: need marked sufficient without a `USER_SUPPORTED` anchor.
- `SC-08`: readiness is not `NOT_READY` when sufficiency is false.
- `SC-09`: `REASONABLE_INFERENCE` is treated as `USER_SUPPORTED`.

Existing semantic invariants remain active. The model action is preserved for audit; the harness does not reinterpret it as public STOP.

## Prior failure classification

The prior v0.2 artifact recorded five failed adversarial repetitions, not five distinct fixture IDs:

- `CR-ADV-03` failed 3/3: category **A — false sufficiency from model-generated description**.
- `CR-ADV-05` failed 2/3: category **A — false sufficiency from model-generated description**.
- `CR-ADV-01`, `CR-ADV-02` and `CR-ADV-04` had no failed repetitions in the prior artifact.

For the focused rerun, the five unchanged adversarial fixtures are retained to preserve the requested 35-call population; no replacement fixture is created.

