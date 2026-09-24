# HYP-005 — Independent Ambiguity Review v0.1

Status: `ITERATE`

Scope: independent review of the three remaining adversarial action
differences reported by `PORTFOLIO_ENTRY_DECISION_SENSITIVITY_REPORT_v0.1.md`.

This review does not modify the deterministic adapter, fixtures, expected
actions, productive runtime, prompts, contracts, Core, or Steps 0–4.

## Review method

The review reconstructs the frozen adapter traces and evaluates the gap
against the current decision, not against action equality alone. The relevant
test is whether asking or routing safely preserves the decision boundary,
authority boundary, and stage boundary.

The three cases reviewed are:

- `ADV-03` — evidence-related difference
- `PAIR-CAPACITY-KEYWORDS` — explicit capacity wording
- `PAIR-CAPACITY-PLAIN` — implicit capacity wording

## Case reconstruction

| Case | Current decision | Selected gap / dimension | Competing gap | Dependency | Answerability | Sensitivity | Answer shape | Stage | Current action | Legacy expected |
|---|---|---|---|---|---|---|---|---|---|---|
| `ADV-03` | Whether to scale the pilot | `evidence-sufficiency` / `EVIDENCE_AUTHORITY` | None in final trace | `CONSTRAINING` | `USER_CAN_ANSWER` | `HIGH` | `BOUNDED_FACT` | `PORTFOLIO` | `ASK` | `ROUTE` |
| `PAIR-CAPACITY-KEYWORDS` | Whether the solution can be sustained | `execution-capacity-ownership` / `EXECUTION_REALITY` | None in final trace | `CONSTRAINING` | `USER_CAN_ANSWER` | `MEDIUM` | `BOUNDED_FACT` | `PORTFOLIO` | `ASK` | `ROUTE` |
| `PAIR-CAPACITY-PLAIN` | Whether the solution can be sustained | `execution-capacity-ownership` / `EXECUTION_REALITY` | None in final trace | `BLOCKING` | `USER_CAN_ANSWER` | `HIGH` | `BOUNDED_FACT` | `PORTFOLIO` | `ASK` | `ROUTE` |

### ADV-03 — evidence-related difference

The governance, sponsor, accountable person, decision authority, budget, and
team are described as established. The remaining evidence is one anecdotal
case while the pending decision is scale.

The frozen counterfactual is:

- A: the evidence gap is resolved sufficiently;
- B: the gap remains open;
- branching: `YES`;
- reason: the answers can change the scale decision or its material
  conditions.

The selected gap is therefore not a governance gap. A bounded question about
representativeness or the evidence threshold for scale is answerable inside
Portfolio Entry, although the organization may still need external evidence
to validate the claim.

### PAIR-CAPACITY-KEYWORDS — explicit wording

The case states that the team has little capacity, few hours, and limited
resources, and asks whether the solution can be sustained. The trace classifies
the gap as a current decision constraint, but its counterfactual branching is
`UNCLEAR`.

The missing fact is a decision threshold: it is not stated whether additional
capacity would enable the current decision, merely change timing/scope, or
route the work elsewhere. The capacity issue is plausibly material, but the
fixture does not establish the branch strongly enough for a strict action
expectation.

### PAIR-CAPACITY-PLAIN — implicit wording

The case says the team ends each week with unfinished work and cannot take on
another responsibility, followed by the same sustainability decision. The
trace classifies this as a current decision blocker with `HIGH` sensitivity
and `YES` counterfactual branching.

This is a stronger execution signal than the explicit pair, but it still does
not state whether the answer changes the enablement decision, imposes a
condition, or only changes implementation timing. The fixture supports an
`ASK` as a safe last-mile action, but does not support a rigid conclusion that
`ROUTE` is always wrong.

## Independent decision test

### ADV-03

| Test | Finding |
|---|---|
| A. Could answer A vs B change the current decision? | Yes. Sufficient representative evidence versus an anecdote can change scale. |
| B. Could it only change scope/timing? | Yes, if the organization chooses a staged or conditional scale; this is a possible secondary branch. |
| C. Could it change neither decision nor route? | Not safely established for a scale decision. |
| D. Can the user answer now? | Partly. The user can state whether evidence is representative or what is known; formal validation may require evidence outside the user. |
| E. Is it inside Portfolio Entry? | Yes, as a decision-readiness gap and evidence route, not as a full validation study. |
| F. Is one bounded question sufficient? | Yes, if bounded to representativeness or the minimum evidence condition for scale. |
| G. Would routing now preserve uncertainty safely? | Yes, if the route explicitly preserves the weak-evidence condition and does not imply scale readiness. |

Classification: `BOTH_ACCEPTABLE`.

The candidate `ASK` is decision-centred and supported by the `HIGH`
sensitivity trace. The legacy `ROUTE` is also safe if it means “external or
organizational evidence is required before scale,” rather than silently
accepting the anecdote. The legacy action is not a strong enough basis to call
the candidate wrong, but strict equality is not justified.

### PAIR-CAPACITY-KEYWORDS

| Test | Finding |
|---|---|
| A. Could answer A vs B change the current decision? | Plausibly, but the fixture does not define the capacity threshold or decision branch. |
| B. Could it only change scope/timing? | Plausibly. Reduced capacity could constrain rollout without rejecting enablement. |
| C. Could it change neither decision nor route? | Yes, if capacity is a later operating detail already covered by a separate owner. |
| D. Can the user answer now? | Likely yes at the level of available capacity or a sustainment condition. |
| E. Is it inside Portfolio Entry? | The current capacity constraint is; detailed operating design is not. |
| F. Is one bounded question sufficient? | Potentially, but the fixture does not state the bounded decision variable. |
| G. Would routing now preserve uncertainty safely? | Yes, provided the route records capacity as an unresolved condition rather than treating it as irrelevant. |

Classification: `INSUFFICIENT_CASE`.

This is not a finding that the candidate `ASK` is wrong. It is a finding that
the frozen case cannot independently distinguish a current decision constraint
from a later-stage operating detail. The `UNCLEAR` counterfactual confirms the
under-specification.

### PAIR-CAPACITY-PLAIN

| Test | Finding |
|---|---|
| A. Could answer A vs B change the current decision? | Plausibly yes: no available capacity could block sustainment, while confirmed capacity could enable continuation. |
| B. Could it only change scope/timing? | Yes, if the decision is already to proceed conditionally. |
| C. Could it change neither decision nor route? | Yes, if another established owner or later-stage plan resolves the overload. |
| D. Can the user answer now? | Yes, at the level of whether capacity can be committed or the decision must be conditional. |
| E. Is it inside Portfolio Entry? | Yes, as a current execution-readiness constraint; detailed workload redesign is later-stage. |
| F. Is one bounded question sufficient? | Potentially yes, but the fixture does not define the threshold. |
| G. Would routing now preserve uncertainty safely? | Yes, if routing retains the explicit overload as a condition and does not imply readiness. |

Classification: `INSUFFICIENT_CASE`.

The current `ASK` is defensible and safer than silently treating the overload
as non-material. However, the case does not establish enough decision context
to prove that `ROUTE` would materially misroute the user. The difference from
the explicit pair is therefore evidence of fixture-model ambiguity, not a
generalizable reason to add another lexical or deterministic rule.

## Severe-failure test

| Case | Missed blocker | Later-stage detail asked | Authority invented | Unknown repeated | Material misroute | Step leakage | Result |
|---|---|---|---|---|---|---|---|
| `ADV-03` | No | No | No | No | No | No | `NO_SEVERE_FAILURE` |
| `PAIR-CAPACITY-KEYWORDS` | No established miss | No | No | No | No | No | `NO_SEVERE_FAILURE` |
| `PAIR-CAPACITY-PLAIN` | No | No | No | No | No | No | `NO_SEVERE_FAILURE` |

The candidate does not invent organizational authority, repeat an explicit
unknown, or leak into Steps. Its conservative `ASK` behavior may be more
interactive than the legacy route, but the frozen traces do not show a severe
or materially unsafe failure.

## Strict-action suitability

| Case | Assessment |
|---|---|
| `ADV-03` | `INVARIANT_BASED_EXPECTATION_BETTER` — both a bounded evidence question and an explicit evidence route can preserve the scale uncertainty. |
| `PAIR-CAPACITY-KEYWORDS` | `INVARIANT_BASED_EXPECTATION_BETTER` — the case lacks the threshold needed to require `ASK` or `ROUTE` strictly. |
| `PAIR-CAPACITY-PLAIN` | `INVARIANT_BASED_EXPECTATION_BETTER` — `ASK` is defensible, but the fixture does not prove that routing would be unsafe. |

The required invariant should be: do not close or silently route away a gap
that could block or materially constrain the current decision; if asking,
keep the question bounded and current-stage appropriate; if routing, preserve
the uncertainty and authority boundary.

## Findings by difference

### Evidence gap

The evidence difference does not demonstrate a candidate defect. For a scale
decision, weak anecdotal evidence can justify a bounded question. A route to
external or organizational evidence can also be correct if it preserves the
uncertainty. The legacy `ROUTE` expectation is too rigid to distinguish those
safe variants.

### Capacity-explicit pair

The explicit capacity wording exposes an under-specified decision threshold.
The case says capacity is scarce but not whether a different capacity answer
changes enablement, conditions, timing, or only later operations. It should not
drive another adapter rule until that distinction is represented in the
fixture model.

### Capacity-implicit pair

The implicit overload wording makes the blocker more salient, but salience is
not proof of decision branching. The candidate `ASK` is reasonable; the main
finding is that the pair needs a shared semantic invariant and an explicit
counterfactual threshold, not keyword-specific handling.

## Overall recommendation

Recommendation: `REVISE_FIXTURE_MODEL_FIRST`.

No additional deterministic adapter iteration is justified by these three
differences. There is no `CANDIDATE_WRONG` severe or generalizable failure.
However, the two capacity cases cannot support a reliable strict action
judgment because their current-decision dependency is not fully specified,
and the explicit/implicit pair does not establish the same counterfactual
branch in its frozen evidence.

Before a live candidate is considered, add fixture-level fields or prose that
state:

- the current enablement decision and the threshold for proceeding;
- whether the capacity answer changes enablement, conditions, timing, or only
  later execution;
- the bounded answer available to the user;
- whether an organizational or external authority is required;
- the invariant expected when both `ASK` and `ROUTE` safely preserve the gap.

Hypothesis status remains `ITERATE`.

Ready for live candidate: `NO` for this review round, because the capacity
pair requires a better fixture model before the remaining action differences
can be used as promotion evidence. This is an evidence-quality gate, not a
product-runtime blocker and not a request to change the adapter.
