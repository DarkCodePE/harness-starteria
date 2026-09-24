# Starteria — Conversion Readiness Semantic Projection v0.1

Status: `HARNESS_ONLY_EXPERIMENTAL`

This slice stabilizes semantic consistency between classified item relations, conversion readiness and public continuation. It does not change Decision Readiness cognition and does not add a broad cognition dimension.

## Model / harness boundary

The model determines known facts, understood need, desired outcome, Decision Readiness action, unresolved items and each item's relation. The harness derives conversion state and public continuation from those fields.

The model does **not** independently decide `conversion_readiness` or `continuation_mode`.

## Derived projection

```text
need not sufficiently understood
  -> conversion_readiness = NOT_READY
  -> continuation_mode = CLARIFY

need understood + current_open_items.length > 0
  -> conversion_readiness = READY_WITH_OPEN_ITEMS
  -> continuation_mode = CONTINUE_WITH_OPEN_ITEM

need understood + current_open_items.length = 0
  -> conversion_readiness = READY
  -> continuation_mode = CONTINUE_TO_NEXT_WORK
```

`current_open_items` may contain only `CURRENT_DECISION_BLOCKER` and `CURRENT_DECISION_CONDITION`. `later_work_items` may contain only `LATER_WORK` and `OPTIONAL_ENRICHMENT`. Later work and optional enrichment never degrade `READY`.

The original `decision_readiness_action` is preserved exactly. A `STOP` or `ROUTE` action may coexist internally with `READY`; it does not terminate public continuation.

## Deterministic continuation modes

- `CLARIFY`: one useful human clarification; no conversion CTA.
- `CONTINUE_WITH_OPEN_ITEM`: state what is clear, what genuinely needs confirmation, what can proceed and how to continue.
- `CONTINUE_TO_NEXT_WORK`: acknowledge the resolved current decision and describe later work without reopening it.

If a model question concerns later work or optional enrichment while projected state is `READY`, the harness suppresses it from public realization and records the diagnostic.

## Semantic consistency validator

The validator records, never hides, these failures:

- `SC-01`: later work appears in current open items.
- `SC-02`: optional enrichment degrades readiness.
- `SC-03`: understood need plus no current open items is not `READY`.
- `SC-04`: `READY` does not project to `CONTINUE_TO_NEXT_WORK`.
- `SC-05`: `NOT_READY` does not project to `CLARIFY`.
- `SC-06`: a READY public realization asks for later work.

## Scope guardrail

```text
Decision Readiness modified: NO
Model conversion cognition expanded: NO
Deterministic projection implemented: YES (harness-only)
Productive runtime / frontend / DB / entities modified: NO
Historical A/B and boundary runs preserved: YES
```

