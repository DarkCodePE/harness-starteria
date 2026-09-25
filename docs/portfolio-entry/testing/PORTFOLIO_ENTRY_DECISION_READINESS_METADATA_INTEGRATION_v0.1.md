# Starteria — Decision Readiness Metadata Integration for Conversion Projection v0.1

Status: `HARNESS_ONLY / DETERMINISTIC_ONLY`

Decision Readiness cognition and prompt were not modified. No new LLM call was
added. This slice wires the existing structured `DecisionReadinessRun.final`
result into the authoritative current/later projection.

## Pipeline

```text
DecisionReadinessRun.final
  -> extractDecisionReadinessMetadata()
  -> current_relevance projection
  -> item collections / unresolved diagnostics
  -> conversion_readiness
  -> continuation_mode
  -> visible realization
```

The adapter preserves `selected_material_gap`, `next_action`, dependency,
sensitivity, branch type and answerability. `selected_material_gap` is taken
from the structured selected gap; it is never reconstructed from visible text.
An absent selected gap remains explicit `null`.

## Integration behavior

- `CURRENT` is placed only in `current_open_items`.
- `LATER` is placed only in `later_work_items`.
- `UNRESOLVED` is placed in `unresolved_relationship_items` and sets
  `relationship_resolution_required: true`.
- Conversion and continuation are derived from the projected current
  collection.
- A raw model `STOP`/`ROUTE` does not terminate the public journey when the
  authoritative projection is `LATER` and conversion is `READY`.

Implementation:

`test/portfolio-entry-v02-isolated-validation/decision-readiness-metadata-integration.ts`

## Deterministic status

- Authoritative six-control projection: **6/6**.
- New integration assertions A–H plus frozen-adapter source check: **5/5 tests passed**.
- New projection + integration tests: **9/9 passed**.
- Live calls in this slice: **0/35**.

The historical ATTEMPT_2 replay remains **35/35 UNRESOLVED** because those
stored outputs predate this metadata wiring and do not contain the structured
Decision Readiness metadata. Historical evidence was not rewritten.
