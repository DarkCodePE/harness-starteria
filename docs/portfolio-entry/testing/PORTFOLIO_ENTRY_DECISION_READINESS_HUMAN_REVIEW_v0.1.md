# HYP-005 — Human Review v0.1

**Scope:** 5 development fixtures + 3 frozen holdouts existentes  
**Adapter reviewed:** deterministic experimental adapter before adversarial expansion  
**Status:** experimental review; no fixture expectations changed

## Review method

The review checks the structured output already produced by the adapter. It
does not judge question wording. The questions are:

- whether the selected gap could most change the decision;
- whether a stronger competing gap was deferred;
- whether the result appears reasoned or keyword-driven;
- whether STOP and routing respect authority and stage boundaries.

Rubric for this first pass: `1 = clearly wrong`, `3 = acceptable but
questionable`, `5 = clearly decision-centred and stage-appropriate`.

## Per-case review

| Case | Selected gap/action | A–B: materiality | C: lexical risk | D: deferred gap | E: STOP | F: routing | G: authority/stage distinction |
|---|---|---|---|---|---|---|---|
| DR-01 | execution reality; final organizational input | Correct at final handoff; capacity/ownership can change implementation decision. | Medium: percentage/time signal can compete with readiness. | Business-value clarification may be deferred too late or asked once unnecessarily. | Final stop is appropriate after routing. | Organizational input is correct. | Ownership is not treated as technical benefit. |
| DR-02 | relevance/business-value; repeated before guard | Correct initial selection; value is not proven by accuracy/time. | High: technical metrics are the trigger for the relevance gap. | Organizational priority is correctly unresolved but the pre-guard run can over-ask. | Not early enough before guard. | Portfolio/org input plausible. | Unknown gerencia is distinguished only after explicit signal. |
| DR-03 | adoption/execution; route later stage | Correct; adoption is more material than technical maintenance. | Low–medium: adoption phrases are explicit. | Detailed workflow cause deferred. | Appropriate final route. | Later-stage route is correct. | Does not design rollout or training. |
| DR-04 | decision authority; organizational input | Correct once authority ambiguity appears; technical support is not accountability. | Medium: governance vocabulary helps detection, but final prioritization is authority-based. | Sponsor/leader distinction should not reopen indefinitely. | Initial STOP is acceptable; later authority evidence reopens routing. | Organizational input is correct. | Distinguishes decision authority from support. |
| DR-05 | decision then execution; organizational input | Correct cross-dimension shift: formal interpretation and capacity matter. | Medium–high: “Plan anual”, “flexible” and “presupuesto” are visible cues. | Mapping methodology and detailed compliance mechanics are deferred. | Appropriate after authority route is clear. | Org input/external evidence are appropriate. | Does not treat “flexible” as formal authorization. |
| H5-HO-A | execution reality after second response | Correct: coverage/capacity outrank absent KPI. | Medium: “turnos” and “responsabilidad” are direct cues. | Strategy/KPI is noncritical. | Not applicable as final STOP; question is justified. | Execution/portfolio is appropriate. | No strategy-first bias. |
| H5-HO-B | relevance then organizational input | Correct: unknown priority is not user-resolvable. | Medium: explicit “no sé” is required for safe routing. | Same organizational truth is not reopened. | Appropriate after unknown. | Organizational input is correct. | Separates uncertainty from authority. |
| H5-HO-C | STOP then later-stage route | Correct restraint; implementation detail is not needed now. | Low: “experimento/siguiente fase” are direct stage cues. | Technical experiment detail is deferred. | Appropriate and early. | Later-stage route is correct. | Separates sufficient context from later-stage detail. |

## Answers to review questions

### A–B — Did the adapter select the most decision-material gap?

Mostly, at the final state. The strongest concern is DR-02: the original
adapter can continue selecting the same relevance gap while the underlying
organizational authority remains unavailable. The local-depth guard now stops
that loop, but the review identifies this as a required adversarial test.

### C — Reasoning or lexical frequency?

The result is mixed. Explicit adoption, authority and later-stage cues are
useful, but technical metrics and governance vocabulary can dominate before
materiality is established. This is not evidence of failure by itself; it is a
clear lexical-bias risk to test with paired wording.

### D — Were material gaps deferred incorrectly?

No severe error is visible in the existing eight final results. The main
possible error is intermediate: a visible technical/value signal may receive
an ASK before capacity or authority is fully reassessed.

### E — Was STOP appropriate?

STOP is appropriate in H5-HO-C and after explicit unknown routing in H5-HO-B.
DR-03 correctly routes instead of stopping as if adoption were solved.

### F — Was routing correct?

Yes for the final outputs: organizational input for authority/priority,
later-stage routing for adoption/experiment detail, and Portfolio for current
decision framing.

### G — What distinctions remain fragile?

The adapter distinguishes them in the final output, but not yet robustly:

- uncertainty can be mistaken for materiality;
- a frequently mentioned governance word can be mistaken for unresolved
  authority;
- technical detail can be mistaken for current-stage decision need;
- a strong signal can be selected before a less-visible execution blocker.

## Initial human-review score (pre-adversarial)

These are review anchors, not automated truth scores:

| Dimension | Score | Rationale |
|---|---:|---|
| cross_dimension_prioritization | 4 | final states generally reassess correctly; intermediate bias remains |
| local_depth_control | 4 | guard works, but requires adversarial confirmation |
| explicit_unknown_handling | 5 | H5-HO-B routes without repeating ASK |
| routing_quality | 4 | final routes are appropriate |
| stop_quality | 4 | early STOP works in the restraint holdout |
| strategy_execution_balance | 4 | H5-HO-A supports it; broader lexical test pending |
| lexical_robustness | 3 | direct wording is still influential |
| materiality_over_uncertainty | 3 | not sufficiently challenged by existing cases |

No expected fixture was modified as a result of this review.

## Adversarial-round per-case review

The following table covers every new development case and new holdout. Scores
are provisional human-review anchors pending an independent reviewer; they are
not automated pass criteria.

| Case | Selected dimension / final action | Cross | Depth | Unknown | Routing | Stop | Strategy | Lexical | Materiality | Review note |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| ADV-01 | EXECUTION_REALITY / ROUTE | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | adoption outranks technical metrics |
| ADV-02 | EXECUTION_REALITY / ASK | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | value established; capacity becomes blocker |
| ADV-03 | EVIDENCE_AUTHORITY / ROUTE | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | governance not reopened |
| ADV-04 | RELEVANCE / ORG INPUT | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | repeated owner terms do not reopen authority |
| ADV-05 | EXECUTION_REALITY / ASK | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | no strategy-first bias |
| ADV-06 | ROUTING / ROUTE | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 5 | technical uncertainty is later-stage |
| ADV-07 | EXECUTION_REALITY / ROUTE | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | value/adoption tradeoff remains ambiguous |
| ADV-08 | DECISION / ORG INPUT | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | authority boundary wins over capacity question |
| ADV-09 | EVIDENCE_AUTHORITY / ASK | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | strategic fit does not prove evidence |
| STOP-01 | ROUTING / ROUTE | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 5 | correct restraint |
| STOP-02 | RELEVANCE / ORG INPUT | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | management-only gap |
| STOP-03 | ROUTING / ROUTE | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 5 | workflow belongs later |
| PAIR-GOV-KEYWORDS | RELEVANCE / ASK | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 5 | matches plain pair |
| PAIR-GOV-PLAIN | RELEVANCE / ASK | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 5 | matches keyword pair |
| PAIR-VALUE-KEYWORDS | RELEVANCE / ASK | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 4 | matches plain pair |
| PAIR-VALUE-PLAIN | RELEVANCE / ASK | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 4 | matches keyword pair |
| PAIR-CAPACITY-KEYWORDS | EXECUTION_REALITY / ROUTE | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | matches implicit pair |
| PAIR-CAPACITY-PLAIN | EXECUTION_REALITY / ROUTE | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | matches keyword pair |
| ADV-HO-01 | EXECUTION_REALITY / ROUTE | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 3 | route may be too early; frozen failure |
| ADV-HO-02 | EXECUTION_REALITY / ROUTE | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 3 | implicit overload detected, ASK not retained |
| ADV-HO-03 | NONE / STOP | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 5 | STOP is acceptable equivalent to route |

The two failed strict holdouts are recorded as failures, not reclassified as
passes. The third is a stop-quality pass under the invariant even though its
literal expected action is `ROUTE`.

## HYP-005.1 review extension

New dimensions added:

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| decision_dependency_accuracy | blocker/constraint classification clearly wrong | plausible but uncertain | dependency matches current decision impact |
| routing_timing | routes before last-mile question or never routes | timing debatable | routes only after blocking/constraining user gap is handled |
| last_mile_question_quality | unnecessary or misses blocker | useful but broad | one bounded question can change decision/route/handoff |

### Frozen holdout review

| Case | Was previous routing premature? | Is new ASK decision-critical? | Over-correction risk | Review |
|---|---|---|---|---|
| ADV-HO-01 | Yes | Yes; adoption/capacity constrains continue/pause | Medium | corrected; `BLOCKING`, `USER_CAN_ANSWER` |
| ADV-HO-02 | Yes | Yes; available operating capacity constrains responsible launch | Medium | corrected; `CONSTRAINING`, `USER_CAN_ANSWER` |
| ADV-HO-03 | No | No | Low | remains route to later technical stage |

### Provisional HYP-005.1 scores

```text
decision_dependency_accuracy  4
routing_timing                4
last_mile_question_quality    4
```

The new scores do not erase the three remaining changed adversarial actions.
Those remain regressions to investigate for `F-LAST-MILE-OVERASK`.

## HYP-005.2 sensitivity review

New dimensions:

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| decision_sensitivity_accuracy | sensitivity clearly overstated/understated | plausible but debatable | counterfactual branching matches current decision |
| counterfactual_branch_quality | no meaningful A/B branch | branch exists but weakly grounded | concise plausible answers show decision/routing divergence |
| last_mile_value | question adds little value | may improve handoff | one bounded answer materially changes decision/conditions/route |
| bounded_question_quality | open exploration disguised as question | partly bounded | BOOLEAN/CATEGORY/BOUNDED_FACT and Portfolio-appropriate |

### Four HYP-005.1 changed actions before sensitivity

| Case | Classification | Rationale |
|---|---|---|
| ADV-01 | TRUE_OVERASK | adoption issue was described, but resolving it required open exploration rather than one bounded Portfolio question |
| ADV-03 | LEGACY_EXPECTATION_POSSIBLY_WRONG | weak evidence can materially change a scale decision; the old ROUTE expectation may be too permissive |
| PAIR-CAPACITY-KEYWORDS | AMBIGUOUS | capacity may change launch conditions, but route may remain stable |
| PAIR-CAPACITY-PLAIN | AMBIGUOUS | same semantics as keyword pair; wording must not determine the gate |

HYP-005.2 changes the observed set to 3 legacy action differences: ADV-01
returns to ROUTE; ADV-03 and the capacity pair remain ASK. No fixture
expectation was changed.

### Provisional sensitivity scores

```text
decision_sensitivity_accuracy  4
counterfactual_branch_quality  4
last_mile_value                 4
bounded_question_quality        4
```
