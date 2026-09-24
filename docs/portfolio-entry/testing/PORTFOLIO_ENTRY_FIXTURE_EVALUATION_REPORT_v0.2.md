# Portfolio Entry Fixture Evaluation Report v0.2

Status: `TESTING`  
Hypothesis: `HYP-005 Decision Readiness`  
Product runtime modified: `NO`

## Scope and evidence handling

This report evaluates the existing frozen suites with the additive v0.2
expectation model. Original fixture text, legacy expected actions, and frozen
holdouts were not rewritten. The three cases identified by the independent
ambiguity review remain historical evidence; the two capacity cases are
classified as `INVARIANT_BASED` and insufficient for strict action equality.

The adapter was not changed. Results below are normalized from the existing
deterministic suite reports and frozen traces; no live LLM or productive
Portfolio Entry validation is implied.

## Fixture inventory

| Population | Count | `STRICT_ACTION` | `INVARIANT_BASED` | Preserved insufficient |
|---|---:|---:|---:|---:|
| Original development + original holdouts | 8 | 0 | 8 | 0 |
| Adversarial development + new holdouts | 21 | 15 | 4 | 2 |
| Decision-dependency development + controls | 10 | 10 | 0 | 0 |
| Decision-sensitivity development + controls | 14 | 14 | 0 | 0 |
| **Existing total** | **53** | **39** | **14** | **2** |
| New clarified capacity v0.2 | 2 | 1 | 1 | 0 |

The metadata sidecar is the authoritative ID-to-mode index for this
experimental evaluator.

## Current candidate results

### Strict-action results

| Suite | Result |
|---|---:|
| Original development | Not applicable: invariant-based |
| Original holdouts | Not applicable: invariant-based |
| Adversarial strict subset | 15/15 action matches |
| Decision-dependency fixtures and controls | 10/10 |
| Decision-sensitivity fixtures and controls | 14/14 |
| **Existing strict total** | **39/39** |

The prior adversarial result of 15/18 strict legacy action matches is
normalized to 15/15 after removing the three cases that the independent
review determined should not be strict (`ADV-03` and the capacity pair).

The clarified blocking capacity variant is expected to be 1/1 strict once
executed against the adapter. It is not counted as an existing-suite result.

### Invariant-based results

| Population | Result | Interpretation |
|---|---:|---|
| Original development + holdouts | 8/8 | Existing behavioral invariants preserved. |
| Reviewed adversarial invariant cases | 4/4 accepted | `ADV-03`, `ADV-04`, `ADV-07`, and `ADV-09` preserve the relevant uncertainty and authority boundaries. |
| Capacity ambiguity pair | 0/2 pass/fail classification | Both remain `INSUFFICIENT_CASE`, not candidate failures. |
| **Eligible existing invariant total** | **12/12** | Insufficient cases excluded from pass denominator and retained as evidence. |

The clarified later-stage capacity variant is expected to be acceptable under
`ROUTE` or `STOP`; it is pending execution and is not counted above.

## Decision-loss severity

| Severity | Existing failures |
|---|---:|
| `NONE` | 0 evaluated failures; 2 insufficient cases quarantined |
| `MINOR` | 0 |
| `MATERIAL` | 0 |
| `SEVERE` | 0 |

The three ambiguity-review differences do not produce a severe failure. The
capacity pair is not scored as a failure because its current decision
counterfactual was not defined tightly enough to support strict evaluation.

## Baseline comparison schema

The normalized schema is ready for both:

- the previous Portfolio Entry harness/planner baseline;
- the Decision Readiness candidate.

Each run should emit or record:

`selected_gap`, `selected_dimension`, `action`, `question_count`,
`explicit_unknown_handling`, `local_depth_behavior`, `routing_timing`,
`stop_quality`, `authority_handling`, `step_leakage`, and
`decision_loss_severity`.

Current baseline comparison result: `READY_FOR_COMPARATIVE_RUN`.
No baseline live replay is claimed in this slice because the prior planner
does not expose a normalized trace for all fixture populations.

## New v0.2 capacity fixtures

- `CAP-V02-BLOCKING`: strict `ASK`; capacity exists versus no capacity
  materially changes whether the decision can continue; sensitivity `HIGH`.
- `CAP-V02-LATER-STAGE`: invariant-based `ROUTE` or `STOP`; capacity answers
  change initiative planning only; sensitivity `LOW`.

These variants clarify the missing counterfactual without adding arbitrary
numeric hour thresholds and without modifying the original pair.

## Hypothesis status and next step

HYP-005 remains `ITERATE`. This slice improves evaluator quality and does not
promote the candidate.

Recommended next step: execute the two clarified capacity variants and then
run the normalized baseline-versus-candidate comparison. Only after that
comparison should the project decide whether a live candidate review is
warranted.
