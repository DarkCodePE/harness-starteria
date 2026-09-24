# Portfolio Entry Harness Baseline vs Decision Readiness v0.1

Status: `STOPPED_BEFORE_COMPARISON`  
Hypothesis: `HYP-005 Decision Readiness`  
Product runtime modified: `NO`  
Evaluator: `PORTFOLIO_ENTRY_FIXTURE_EVALUATION_MODEL_v0.2`

## 1. Scope

This artifact records the required precondition run for a fair comparison
between:

- the previous Portfolio Entry baseline harness/planner;
- the experimental Decision Readiness candidate.

The comparison was not started because one of the two mandatory clarified
capacity fixtures did not satisfy its frozen decision-dependency metadata.

No productive runtime, prompt, contract, Core, Step, schema, or adapter
behavior was changed.

## 2. Evaluator freeze

The Fixture Evaluation Model v0.2 was treated as frozen. Existing fixtures,
expectations, severity rules, and the two newly added capacity variants were
not edited after execution.

## 3. Capacity fixture execution

### CAP-V02-BLOCKING

Expected:

- expectation mode: `STRICT_ACTION`;
- action: `ASK`;
- decision sensitivity: `HIGH`;
- current decision dependency: `BLOCKING`.

Observed:

```text
action: ASK
gap_id: execution-capacity-ownership
dimension: EXECUTION_REALITY
current_decision_dependency: CONSTRAINING
decision_sensitivity: MEDIUM
answer_shape: BOUNDED_FACT
selection_basis: ROUTING_IMPACT
reconsidered_dimensions: RELEVANCE, DECISION, EXECUTION_REALITY,
  EVIDENCE_AUTHORITY, ROUTING
```

Result: `FAIL — comparison STOPPED`.

The action matches `ASK`, but the trace does not establish the fixture's
required `BLOCKING`/`HIGH` classification. The candidate therefore does not
yet demonstrate the declared current-decision counterfactual. This is a
harness/evaluation mismatch to resolve before comparing systems; it is not
evidence to tune the adapter against this fixture in this slice.

### CAP-V02-LATER-STAGE

Expected:

- expectation mode: `INVARIANT_BASED`;
- acceptable actions: `ROUTE`, `STOP`.

Observed:

```text
action: STOP
reason: sufficient_context_or_noncritical_gaps
selected_gap: none
selection_basis: NONE
selection_reason: no unresolved ASK_NOW gap remains
reconsidered_dimensions: RELEVANCE, DECISION, EXECUTION_REALITY,
  EVIDENCE_AUTHORITY, ROUTING
```

Result: `PASS — acceptable action`.

The observed result preserves the later-stage boundary, does not introduce
implementation design, does not invent a blocker, and does not leak into
Steps. This case alone is not sufficient to unlock the comparison.

## 4. Comparison population

Not executed. The requested baseline and candidate comparison population is
therefore:

```text
BASELINE_COMPARISON_POPULATION: NOT_RUN
```

The intended population remains the eligible frozen set: original
development and holdouts, adversarial fixtures and `ADV-HO-01..03`, decision-
dependency fixtures, decision-sensitivity fixtures, STOP cases, semantic
pairs, and both clarified capacity fixtures.

## 5. Normalization method prepared

The planned baseline normalization remains observational and does not retrofit
Decision Readiness fields:

```text
BaselineNormalizedTrace {
  case_id
  selected_question_or_gap
  inferred_dimension
  action
  question_count
  consecutive_same_dimension_count
  explicit_unknown_reasked
  stop_state
  routing_state
  step_leakage
  authority_issue
  evidence_gap_preserved
}
```

The common comparison schema is also prepared:

```text
CommonHarnessEvaluation {
  case_id
  expectation_mode
  action_result
  invariant_result
  questions_to_sufficiency
  local_depth_issue
  unknown_loop
  premature_route
  unnecessary_question
  correct_stop
  authority_error
  step_leakage
  decision_loss_severity
}
```

No baseline values are fabricated. Unavailable baseline signals will remain
`NOT_AVAILABLE` when the comparison is resumed.

## 6. Strict-action comparison

Not run because the required capacity precondition failed. Baseline and
candidate strict-action counts are `NOT_AVAILABLE` for this audit.

## 7. Invariant-based comparison

Not run because the required capacity precondition failed. Baseline and
candidate invariant counts are `NOT_AVAILABLE` for this audit. The acceptable
`ROUTE`/`STOP` result for `CAP-V02-LATER-STAGE` is recorded above but is not a
comparative result.

## 8. Conversation efficiency

Not run. No question-count, median, premature-stop, or late-stop comparison is
claimed.

## 9. Failure-pattern comparison

Not run. The failure-code population remains `NOT_AVAILABLE`; no unsupported
failure codes are assigned from this stopped execution.

## 10. Decision-loss comparison

Not run. No `NONE`, `MINOR`, `MATERIAL`, or `SEVERE` comparative profile is
reported.

## 11. Complexity cost

Not assessed comparatively. The Decision Readiness concepts and trace fields
are documented, but behavioral benefit cannot be weighed fairly while the
clarified blocker fixture is unresolved.

## 12. Why the comparison is stopped

The blocking variant was specifically added to remove the ambiguity in the
historical capacity pair. Its purpose is to establish that different capacity
answers materially change the current decision. The adapter selected the
correct action but exposed only a medium constraining classification. Running
a baseline comparison now would mix an unresolved fixture interpretation with
system performance and would not be fair.

No decision-loss comparison, efficiency comparison, failure-pattern count, or
complexity conclusion is reported as a result of this stopped run.

## 13. Comparative conclusion

Overall comparison: `INCONCLUSIVE`.

No area can be classified as `BASELINE_BETTER`, `EQUIVALENT`, or
`DECISION_READINESS_BETTER` from this stopped run.

## 14. Required next step

Resolve the harness-only mismatch by choosing and documenting one of these
paths in a future slice:

1. clarify the fixture text/metadata so `CONSTRAINING`/`MEDIUM` is the intended
   interpretation; or
2. add a general evaluator trace/fixture rule that establishes why this
   counterfactual is `BLOCKING`/`HIGH`.

Do not make a fixture-specific adapter change. After that decision, rerun both
capacity cases first, freeze the evaluator again, and only then perform the
baseline-versus-candidate comparison.

Hypothesis status remains `ITERATE`.

Recommendation: `INCONCLUSIVE`.

Ready for live candidate: `NO`.

## 15. Clarified fixture rerun

The clarified fixture was executed without changing the adapter or evaluator.

### CAP-V02-BLOCKING-v0.2.1

Expected:

```text
action: ASK
current_decision_dependency: BLOCKING
decision_sensitivity: HIGH
answerability: USER_CAN_ANSWER
```

Observed:

```text
action: ASK
gap_id: execution-capacity-ownership
current_decision_dependency: CONSTRAINING
decision_sensitivity: MEDIUM
answerability: USER_CAN_ANSWER
selection_basis: ROUTING_IMPACT
```

Result: `FAIL — adapter issue under the stated precondition rule`.

The clarified counterfactual explicitly says that absent operating
responsibility prevents formal implementation and changes the route, yet the
adapter still emits `CONSTRAINING`/`MEDIUM`. The expected fixture is preserved;
no fixture-specific correction was made.

### CAP-V02-LATER-STAGE

Expected actions: `ROUTE` or `STOP`.

Observed:

```text
action: STOP
reason: sufficient_context_or_noncritical_gaps
selected_gap: none
```

Result: `PASS`.

The result does not ask for implementation design and shows no Step leakage.

## 16. Updated gate status

The clarified blocking fixture did not pass. The Fixture Evaluation Model is
not frozen for comparison, and the baseline-versus-candidate comparison
remains stopped.

```text
EVALUATOR_FREEZE_READY: NO
BASELINE_COMPARISON_READY: NO
ADAPTER_CHANGE_REQUIRED: YES, as a future general rule; not performed here
```

## 17. HYP-005.3 closure amendment

The stopped result above is preserved as historical evidence from before the
general counterfactual adapter correction. The current rerun used the same CAP
fixtures and did not edit fixture expectations:

```text
CAP-V02-BLOCKING-v0.2.1: PASS
  action: ASK
  branch: ROUTE_CHANGE
  dependency: BLOCKING
  sensitivity: HIGH
  answerability: USER_CAN_ANSWER

CAP-V02-LATER-STAGE: PASS
  action: STOP (acceptable ROUTE/STOP)
  branch: NO_MATERIAL_CHANGE
  dependency: NON_BLOCKING
  sensitivity: LOW
  Step leakage: NO

EVALUATOR_FREEZE_READY: YES
BASELINE_COMPARISON_READY: YES
```

The normalized baseline-versus-candidate comparative audit is unblocked, but
has not been claimed as executed by this slice. Product runtime remains
unmodified.

---

# Baseline vs Decision Readiness Comparative Audit v0.1

## 1. Executive summary

The Decision Readiness candidate and evaluator were frozen before comparison.
The candidate was normalized successfully, but the historical baseline could
not be replayed: this checkout contains no runnable baseline runner or stored
observable traces for the HYP-005 populations. Baseline cases are therefore
marked `BASELINE_NOT_EXECUTABLE`, never scored as failures.

The result is **`INCONCLUSIVE`**. The candidate shows an observable harness
capability advantage in cross-dimension prioritization, explicit dependency,
sensitivity and counterfactual explainability, but a comparative behavioral
improvement cannot be established without executable baseline observations.

`READY_FOR_LIVE_CANDIDATE: NO`.

## 2. Systems compared

### A — Previous baseline

```text
source_commit: 7b82f14cfa4bbfe886b53de55dba932ff5ef79b0
source_ref: origin/main at audit time
planner: portfolio-entry-experimental-v0.1
adapter: DeterministicSessionAdapter → ExperimentalPortfolioEntryAgent
historical implementation commit: d00d5e6
interaction assumptions: single/multi-turn planner, up to 3 questions,
  lexical intent/context/reverse-alignment planning
```

The source is recoverable from Git history, but no replayable runner,
normalized output, or frozen baseline traces are present in this checkout.

### B — Decision Readiness

```text
adapter: test/portfolio-entry-decision-readiness/decision-readiness-adapter.ts
status: frozen deterministic experimental candidate
evaluator: Fixture Evaluation Model v0.2, frozen
```

## 3. Normalization methodology

Added the harness-only layer:

`test/portfolio-entry-v02-isolated-validation/baseline-normalization.ts`

It maps only observable baseline fields and uses `NOT_AVAILABLE` for absent
signals. It does not infer `DecisionReadinessMap`, dependency, sensitivity or
counterfactuals for the baseline. The candidate projects to the same common
action/invariant fields while retaining candidate-specific fields separately.

## 4. Comparison population

| Population | Raw cases | Candidate eligible | Baseline executable |
|---|---:|---:|---:|
| Original development + holdouts | 8 | 8 | 0 |
| Adversarial + ADV-HO + STOP | 21 | 19 eligible; 2 historical insufficient | 0 |
| Decision Dependency | 10 | 10 | 0 |
| Decision Sensitivity | 14 | 14 | 0 |
| Counterfactual Branch | 11 | 11 | 0 |
| Clarified capacity | 2 | 2 | 0 |
| **Total** | **66** | **64** | **0** |

The two historical capacity-pair cases remain insufficient for strict scoring
and are not silently converted into failures. STOP cases are included in the
adversarial population and are not double-counted.

## 5. Strict-action results

| System | Eligible strict cases | Passes | Failures | Pass rate |
|---|---:|---:|---:|---:|
| Baseline | 0 | 0 | 0 | `NOT_AVAILABLE` |
| Decision Readiness | 51 | 51 | 0 | 100% |

Decision Readiness strict population: 39 existing normalized strict cases,
1 clarified blocking capacity case and 11 branch cases. This is not a
comparative win because the baseline denominator is zero.

Candidate strict failures by severity: `MINOR=0`, `MATERIAL=0`, `SEVERE=0`.

## 6. Invariant-based results

| System | Cases evaluated | Invariants preserved | Failures | Acceptable variations |
|---|---:|---:|---:|---|
| Baseline | 0 | 0 | 0 | `NOT_AVAILABLE` |
| Decision Readiness | 13 | 13 | 0 | ASK/ROUTE/STOP where declared |

The candidate invariant set includes the original 8 cases, 4 eligible
adversarial invariant cases and the clarified later-stage capacity case.

## 7. Question efficiency

No valid baseline delta can be computed. Baseline question counts and
question-to-sufficiency traces are unavailable. Candidate action traces expose
ASK/STOP/ROUTE behavior, but converting those into a comparative mean or
median without a baseline would overstate evidence.

```text
mean / median / min / max delta: NOT_COMPARABLE
unnecessary-question delta: NOT_COMPARABLE
late-stop delta: NOT_COMPARABLE
premature-stop delta: NOT_COMPARABLE
```

## 8. Cross-dimension behavior

Decision Readiness exposes five-dimension reassessment on every evaluated turn
and records selection basis/tradeoff. The baseline source plans from intent,
context and reverse alignment but has no equivalent observable cross-dimension
trace in this audit. Candidate capability: **OBSERVED ADVANTAGE**; behavioral
comparative verdict: `INCONCLUSIVE`.

## 9. Explicit-unknown handling

Decision Readiness preserves unresolved unknowns and routes authority-owned
answers to organizational input in the original/holdout evidence. Baseline
unknown-loop and authority outputs are not replayable here. Verdict:
`INCONCLUSIVE`; candidate architectural observability is better.

## 10. Routing

Decision Readiness preserves later-stage detail as ROUTE/STOP and keeps the
clarified current blocker as ASK/BLOCKING/HIGH. Existing candidate evidence
still contains the frozen adversarial holdout findings around dominant-gap and
routing timing. Baseline route timing is unavailable. Verdict:
`INCONCLUSIVE`.

## 11. STOP behavior

Candidate STOP cases execute without structural violations and preserve stage
boundaries. Baseline STOP traces are unavailable. Verdict:
`INCONCLUSIVE`.

## 12. Decision-loss analysis

| Severity | Baseline | Decision Readiness |
|---|---:|---:|
| NONE | `NOT_AVAILABLE` | 64 eligible cases / no observed loss in frozen evaluation |
| MINOR | `NOT_AVAILABLE` | 0 |
| MATERIAL | `NOT_AVAILABLE` | 0 |
| SEVERE | `NOT_AVAILABLE` | 0 |

This is not a claim that the candidate has zero future decision loss; it is the
frozen harness result. The candidate's new branch run specifically recorded no
blocker downgrade and no blocker over-upgrade.

## 13. Failure patterns

| Failure code | Baseline | Decision Readiness |
|---|---:|---:|
| F-LOCAL-DEPTH | N/A | no new failure observed |
| F-UNKNOWN-LOOP | N/A | no new failure observed |
| F-CROSS-DIMENSION | N/A | 0 in frozen regression |
| F-PREMATURE-ROUTE | N/A | retained historical holdout findings where applicable |
| F-UNNECESSARY-QUESTION | N/A | retained historical adversarial findings where applicable |
| F-BLOCKER-DOWNGRADED | N/A | 0 |
| F-COUNTERFACTUAL-OVERUPGRADE | N/A | 0 |

Codes are assigned only from observable candidate evidence. No baseline code
is invented from the historical source.

## 14. Complexity cost

Decision Readiness adds dependency, answerability, sensitivity, branch type,
counterfactual metadata and rationale trace. The cost is fixture metadata,
additional evaluator rules and a larger trace surface. The benefit is explicit
material-gap prioritization, protection against category-based softening and
an auditable explanation for ASK versus ROUTE/STOP. The benefit is plausible
and observed in the candidate harness, but not yet comparative.

## 15. Explainability

| Question | Baseline | Decision Readiness |
|---|---|---|
| Why was this question asked? | `NOT_AVAILABLE` | rationale trace / selection basis |
| Why was a gap deferred? | `NOT_AVAILABLE` | `why_not_ask` and stage/dependency fields |
| Why did routing happen? | `NOT_AVAILABLE` | action, stage and counterfactual branch |
| Why did STOP happen? | `NOT_AVAILABLE` | stop action plus trace reason |

Verdict: `DECISION_READINESS_BETTER` as an architectural capability,
`INCONCLUSIVE` as a behavioral comparison.

## 16. Dimension-by-dimension verdict

| Dimension | Verdict | Evidence |
|---|---|---|
| Material-gap prioritization | INCONCLUSIVE | baseline not executable; candidate has explicit dependency gate |
| Cross-dimension reassessment | INCONCLUSIVE | candidate 5/5 reassessment traces; baseline trace unavailable |
| Question efficiency | INCONCLUSIVE | no comparable baseline counts |
| Explicit-unknown handling | INCONCLUSIVE | candidate preserves/routs unknowns; baseline unavailable |
| Routing timing | INCONCLUSIVE | candidate has preserved holdout findings; baseline unavailable |
| STOP quality | INCONCLUSIVE | candidate STOP suite passes; baseline unavailable |
| Evidence handling | INCONCLUSIVE | candidate keeps evidence/value uncertainty explicit; no baseline replay |
| Organizational-authority handling | INCONCLUSIVE | candidate has authority boundary; baseline unavailable |
| Step-boundary protection | INCONCLUSIVE | candidate has no observed Step leakage; baseline unavailable |
| Decision-loss prevention | INCONCLUSIVE | candidate has no eligible loss observed; baseline denominator absent |
| Lexical robustness | INCONCLUSIVE | candidate semantic pairs pass; baseline unavailable |
| Explainability | DECISION_READINESS_BETTER | candidate exposes rationale/why-not-ask; baseline lacks comparable trace |
| Maintainability / complexity | INCONCLUSIVE | added complexity has explicit benefit, but no outcome delta |

## 17. Overall recommendation

```text
OVERALL: INCONCLUSIVE
READY_FOR_LIVE_CANDIDATE: NO
```

The candidate remains `ITERATE`. The next valid step is to recover or build a
replayable harness-only baseline runner from the historical source, freeze its
observable output, and rerun this same normalized population. That work must
not retrofit Decision Readiness semantics into the baseline.

## 18. Limitations

- No historical baseline runner or stored traces exist in this checkout.
- Baseline source code is identified but was not reimplemented as a substitute.
- Candidate metrics are not treated as comparative wins when baseline data is
  absent.
- No live LLM, production runtime, prompt, contract, schema or route was
  changed.
