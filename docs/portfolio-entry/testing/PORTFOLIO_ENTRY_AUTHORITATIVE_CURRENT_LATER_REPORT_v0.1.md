# Starteria — Authoritative Current/Later Projection Report v0.1

Status: `DETERMINISTIC_ONLY`

## Scope

This report covers the deterministic projection implementation and a read-only
replay of the latest detailed Later Work artifact. No live calls were made.

## Frozen fixture gate

| Case | Expected | Projected | Result |
|---|---|---|---|
| CR-ADV-05 | LATER | LATER | PASS |
| LW-CTRL-01 | LATER | LATER | PASS |
| LW-CTRL-02 | CURRENT | CURRENT | PASS |
| LW-CTRL-03 | LATER | LATER | PASS |
| LW-CTRL-04 | CURRENT | CURRENT | PASS |
| LW-CTRL-05 | LATER | LATER | PASS |

Deterministic result: **6/6**. The metadata vectors used for this gate are
existing frozen Decision Readiness semantics (the dependency/sensitivity/
branch patterns already validated by the Decision Dependency, Sensitivity and
Counterfactual Branch fixtures); they are not recovered or invented from the
historical live outputs, and no existing fixture was edited.

For LW-CTRL-02 the authoritative metadata is a blocking/material enablement
branch. For LW-CTRL-04 it is a constraining/material condition branch. Both
project to CURRENT without requiring a new blocker-vs-condition judgment.

## ATTEMPT_2 replay

Stored outputs replayed: **35/35**.

The stored Later Work schema contains output relations, but it does not contain
`current_decision_dependency`, `decision_sensitivity`,
`decision_branch_type`, or `answerability`. The replay therefore returns
`UNRESOLVED` for every stored output. This is intentional: raw model relations
cannot be promoted to authoritative projections and unavailable fields are not
inferred.

| Projection | Count |
|---|---:|
| CURRENT | 0 |
| LATER | 0 |
| UNRESOLVED | 35 |
| relationship_resolution_required | 35 |

Consequently, no historical false CURRENT/LATER classification is claimed as
corrected. The prior 10 relation mismatches remain historical evidence, while
the replay explicitly identifies the missing metadata needed for a decisive
correction.

## Semantic validator

| Failure | Count |
|---|---:|
| AR-01 | 0 |
| AR-02 | 0 |
| AR-03 | 0 |
| AR-04 | 0 |
| AR-05 | 0 |
| AR-06 | 0 |

## Final gate

```text
Decision Readiness modified: NO
New LLM relationship judgment added: NO
Authoritative projection implemented: YES
current_relevance implemented: YES
Deterministic fixtures: 6/6
Historical ATTEMPT_2 replayed: 35/35
Ready for focused live confirmation: NO
```

Focused live confirmation is not ready because the stored live output schema
does not preserve the authoritative metadata needed for replay. The next step
is a deterministic integration that supplies the already-existing Decision
Readiness result to this projection, followed by another deterministic gate;
only then should a live confirmation be considered.
