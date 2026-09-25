# Starteria — Authoritative Current/Later Projection v0.1

Status: `HARNESS_ONLY / DETERMINISTIC_ONLY`

Decision Readiness cognition, prompts, grounding, sufficiency, conversion
semantics, fixtures, thresholds and productive runtime were not modified.
No new LLM relationship judgment was added.

## Authority

The relationship layer now has a deterministic projection contract:

```text
Decision Readiness metadata
  -> current_relevance: CURRENT | LATER | UNRESOLVED
  -> item placement / diagnostics / visible realization
```

`current_relevance` is internal and is not exposed publicly.

## Projection rules

`BLOCKING` is decisive `CURRENT` evidence unless the branch metadata is
contradictory. `CONSTRAINING` is `CURRENT` when its branch is a supported
material consequence (`ENABLEMENT_CHANGE`, `ROUTE_CHANGE`, `CONDITION_CHANGE`,
or `SCOPE_CHANGE`) with `HIGH` or `MEDIUM` sensitivity.

`NON_BLOCKING` is `LATER` only when the branch is `DETAIL_CHANGE` or
`NO_MATERIAL_CHANGE` and sensitivity is `LOW`.

Missing, contradictory, or unsupported combinations produce `UNRESOLVED`.
`answerability` and `next_action` remain preserved metadata/action signals;
they do not independently decide CURRENT versus LATER.

## Placement and realization

- `CURRENT` goes to `current_open_items` and preserves the existing blocker vs
  condition metadata when available.
- `LATER` goes to `later_work_items` only and cannot lower `READY`.
- `UNRESOLVED` goes to neither collection and sets
  `relationship_resolution_required: true`.
- Visible realization is checked against the projected state. A projected
  LATER item with `READY` must continue without a blocking question.

The conversion readiness formulas remain unchanged:

```text
need_sufficient = false                         -> NOT_READY
need_sufficient = true and current items > 0     -> READY_WITH_OPEN_ITEMS
need_sufficient = true and current items = 0     -> READY
```

## Semantic validator

The harness validator reports:

```text
AR-01 projected LATER appears in current_open_items
AR-02 projected CURRENT absent from current_open_items
AR-03 raw model relation overrides projected relation
AR-04 visible realization contradicts projected relation
AR-05 conversion state contradicts projected current items
AR-06 UNRESOLVED silently converted to CURRENT or LATER
```

Implementation: `test/portfolio-entry-v02-isolated-validation/authoritative-current-later-projection.ts`.

## Deterministic result

The six frozen relationship cases project correctly: **6/6**.
LW-CTRL-02 and LW-CTRL-04 both remain `CURRENT`; blocker vs condition is not
used as an additional conversion gate.

The latest detailed historical ATTEMPT_2 contains 35 outputs, but none stores
the four authoritative Decision Readiness metadata fields. Per the audit rule,
all 35 historical projections are therefore `UNRESOLVED`; raw historical
relationships are not reused as authoritative input. No historical output is
overwritten.
