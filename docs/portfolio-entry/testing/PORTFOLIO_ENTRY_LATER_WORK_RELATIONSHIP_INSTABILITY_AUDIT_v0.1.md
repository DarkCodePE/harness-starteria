# Starteria — Later Work Relationship Instability Audit v0.1

Status: `AUDIT_ONLY`

Scope: inspection of preserved Later Work relationship evidence only. No live
call, prompt, cognition, threshold, fixture, projection rule or grounding was
changed or rerun.

## 1. Evidence preservation

| Label | Evidence available | Detail |
|---|---|---|
| `ATTEMPT_1` | Console summary only | 35/35 live, 35/35 schema-valid, CR-ADV-05 LATER_WORK 9/10, READY 8/10, controls 19/25. The first detailed JSON/report was not found in this checkout; its detailed repetitions cannot be reconstructed. |
| `ATTEMPT_2` | Detailed JSON and generated report | `PORTFOLIO_ENTRY_LATER_WORK_RELATIONSHIP_RUNS_v0.1.json`; 35/35 live, 35/35 schema-valid, CR-ADV-05 LATER_WORK 6/10, READY 6/10, controls 16/25. |

The existing detailed artifacts were not overwritten. The untracked run file is
treated as `ATTEMPT_2` by its metrics; no duplicate evidence file was created.

## 2. Detailed failed repetitions available

The Later Work JSON schema does not contain `current_decision_dependency`,
`decision_sensitivity`, `decision_branch_type`, `answerability`, or a named
Decision Readiness action. Those fields are therefore reported as
`NOT_AVAILABLE` below, not inferred from the live prose. `current_open_items`
and `later_work_items` are reported as relations/items; the full generated
descriptions remain in the preserved JSON artifact.

| Attempt | case_id | repeat | expected item relation | produced item relation | need_sufficient | current_open_items | later_work_items | conversion_readiness | continuation_mode | Decision Readiness action | DR metadata |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| 2 | CR-ADV-05 | 1 | LATER_WORK | CURRENT_DECISION_BLOCKER | false | architecture/provider — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | CR-ADV-05 | 3 | LATER_WORK | CURRENT_DECISION_BLOCKER | false | architecture/provider — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | CR-ADV-05 | 8 | LATER_WORK | CURRENT_DECISION_BLOCKER | false | architecture/provider — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | CR-ADV-05 | 10 | LATER_WORK | CURRENT_DECISION_BLOCKER | false | architecture/provider — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-01 | 5 | LATER_WORK | LATER_WORK | false | none | architecture — later | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-02 | 2 | CURRENT_DECISION_BLOCKER | CURRENT_DECISION_CONDITION | false | regulatory proof — condition | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-02 | 3 | CURRENT_DECISION_BLOCKER | CURRENT_DECISION_CONDITION | true | regulatory proof — condition | none | READY_WITH_OPEN_ITEMS | CONTINUE_WITH_OPEN_ITEM | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-04 | 1 | CURRENT_DECISION_CONDITION | CURRENT_DECISION_BLOCKER | false | provider cost — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-04 | 2 | CURRENT_DECISION_CONDITION | CURRENT_DECISION_BLOCKER | true | provider cost — blocker | none | READY_WITH_OPEN_ITEMS | CONTINUE_WITH_OPEN_ITEM | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-04 | 4 | CURRENT_DECISION_CONDITION | CURRENT_DECISION_BLOCKER | false | provider cost — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-04 | 5 | CURRENT_DECISION_CONDITION | CURRENT_DECISION_BLOCKER | false | provider cost — blocker | none | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-05 | 1 | LATER_WORK | LATER_WORK | false | none | next experiment — later | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |
| 2 | LW-CTRL-05 | 4 | LATER_WORK | LATER_WORK | false | none | next experiment — later | NOT_READY | CLARIFY | NOT_AVAILABLE | all NOT_AVAILABLE |

The 10 relationship mismatches are four `FALSE_CURRENT_ITEM` cases on
CR-ADV-05 and six `FALSE_LATER_WORK` cases across LW-CTRL-02 and LW-CTRL-04.
The three additional failed control repetitions above have the correct item
relation but incorrect realization/projection (`PREMATURE_STOP`).

## 3. Failure classification

Primary classification is assigned once per failed detailed repetition; a
failure is not counted twice. `ATTEMPT_1` cannot be classified at repetition
level because its detailed output was not preserved.

| Primary cause | Count in detailed ATTEMPT_2 | Cases | Finding |
|---|---:|---|---|
| `CURRENT_JOB_SCOPE_MISREAD` | 0 | — | CR-ADV-05 could be read this way, but the available run explicitly supplied `current_decision_complete_hint: true`; the stronger finding is a repeated semantic re-judgment. |
| `CONSEQUENCE_MISREAD` | 6 | LW-CTRL-02 x2; LW-CTRL-04 x4 | The model recognized the unresolved item but placed it on the wrong side of blocker vs condition. |
| `DUPLICATE_SEMANTIC_JUDGMENT` | 4 | CR-ADV-05 x4 | The relationship layer re-decided whether architecture/provider work blocks the current job despite the current-decision-complete hint and validated later-stage Decision Readiness patterns. |
| `FIXTURE_AMBIGUITY` | 0 | — | The control wording is explicit enough for the stated expected relation. |
| `REALIZATION_ONLY` | 3 | LW-CTRL-01 x1; LW-CTRL-05 x2 | Internal relation is LATER_WORK, but `need_sufficient=false` caused NOT_READY/CLARIFY. This is not a relationship-label error. |
| `OTHER` | 0 | — | — |

The classification is conservative: CR-ADV-05 also exposes a job-scope
boundary, but the auditable defect in this slice is that a second evaluator
overrode an already supplied completion signal rather than consuming it.

## 4. Decision Readiness comparison

Existing validated Decision Readiness evidence provides the following useful
patterns:

- later technical detail: `NON_BLOCKING` + `LOW` + `DETAIL_CHANGE` or
  `NO_MATERIAL_CHANGE` + `LATER_STAGE_DISCOVERY`;
- material current decision change: `BLOCKING` + `HIGH`, commonly
  `ENABLEMENT_CHANGE` or `ROUTE_CHANGE`;
- material condition/scope change: `CONSTRAINING` + `MEDIUM` (or `HIGH` when
  explicitly material) with `CONDITION_CHANGE` or `SCOPE_CHANGE`.

The decision-dependency, sensitivity and counterfactual fixtures support this
distinction. `answerability` helps choose the next action (`ASK`, route, or
organizational input), but by itself does not define CURRENT versus
LATER_WORK.

The live Later Work runner does not carry any of those frozen fields in its
output schema or input payload. Therefore the metadata is not available per
live repetition, and this audit does not pretend that it was. The evidence is
`PARTIAL` for direct derivation: sufficient for the tested branch patterns,
not yet sufficient as a complete universal mapping for every unknown branch or
fixture.

Conceptually valid deterministic derivation, subject to the frozen metadata
being present, is:

```text
BLOCKING -> CURRENT_DECISION_BLOCKER
CONSTRAINING + material current-decision consequence
  -> CURRENT_DECISION_CONDITION
NON_BLOCKING + DETAIL_CHANGE or NO_MATERIAL_CHANGE
  -> LATER_WORK
```

`answerability` should remain an action/routing signal. `UNKNOWN` branch or
dependency must remain unresolved rather than being silently promoted to
LATER_WORK. This is analysis only; no mapping was implemented.

## 5. Duplicated reasoning

Yes. The two layers ask materially overlapping questions:

- Decision Readiness: would unresolved information change the current
  decision, route, enablement, scope, or condition?
- Later Work relationship: does unresolved information prevent the current job
  from moving forward?

CR-ADV-05 is the clearest evidence: the relationship layer produced a blocker
four times even though its input included `current_decision_complete_hint:
true` and existing validated technical-later patterns classify equivalent work
as non-blocking/later-stage. Decision Readiness should be authoritative for
the semantic judgment; the relationship layer should deterministically project
that result into item buckets and continuation behavior.

## 6. Control-by-control findings

| Control | Expected relation | Observed stability | Dominant failure mode | Fixture sufficiently explicit? | Existing DR metadata resolves conflict? |
|---|---|---|---|---|---|
| CR-ADV-05 | LATER_WORK | 6/10 in ATTEMPT_2; 9/10 in ATTEMPT_1 summary | Duplicate semantic judgment, with current-job framing pressure | Yes for the frozen expected boundary; the user wording asks for solution detail, so authority must come from the current decision state | PARTIAL: validated non-blocking technical-detail patterns support it, but metadata was not attached to these calls |
| LW-CTRL-01 | LATER_WORK | Relation 4/5; 1 realization/projection failure | REALIZATION_ONLY / premature stop | Yes | Yes for the analogous non-blocking later-detail pattern; direct per-call metadata unavailable |
| LW-CTRL-02 | CURRENT_DECISION_BLOCKER | 3/5 relation-correct; 2 downgraded to CONDITION | CONSEQUENCE_MISREAD | Yes | PARTIAL: BLOCKING/HIGH would resolve it, but no exact frozen DR record for this regulatory fixture was attached |
| LW-CTRL-03 | LATER_WORK | 5/5 relation-correct | Stable | Yes | Yes by the non-blocking later-stage pattern; direct per-call metadata unavailable |
| LW-CTRL-04 | CURRENT_DECISION_CONDITION | 1/5 relation-correct; 4 upgraded to BLOCKER | CONSEQUENCE_MISREAD | Yes | PARTIAL: CONSTRAINING plus material condition would resolve it, but exact metadata was not attached |
| LW-CTRL-05 | LATER_WORK | 3/5 relation-correct; 2 realization/projection failures | REALIZATION_ONLY / premature stop | Yes | Yes by the validated later-stage/early-stop pattern; direct per-call metadata unavailable |

## 7. Conclusions

- Decision Readiness metadata already sufficient: **PARTIAL**.
- Duplicate semantic judgment exists: **YES**.
- Deterministic derivation from existing cognition feasible: **PARTIAL**.
- Cognition change required: **NO** based on this audit.
- Relationship-layer redesign required: **YES**, conceptually: consume frozen
  Decision Readiness outputs rather than independently asking the model for the
  same blocker/later judgment. This audit does not implement that redesign.

Recommended next step: preserve the Decision Readiness output, including
dependency, sensitivity, branch type and answerability, as the authoritative
input to a future deterministic relationship projection; then run a frozen
deterministic audit over all six controls before requesting any new live
benchmark. Do not change prompts, cognition, fixtures, thresholds or
projection rules in this slice.

## 8. Requested final summary

1. Live attempts available for detailed analysis: **1 (`ATTEMPT_2`)**; `ATTEMPT_1` summary only.
2. Failed relationship classifications inspected: **10 relation mismatches + 3 realization-only failures in ATTEMPT_2**.
3. `CURRENT_JOB_SCOPE_MISREAD`: **0**.
4. `CONSEQUENCE_MISREAD`: **6**.
5. `DUPLICATE_SEMANTIC_JUDGMENT`: **4**.
6. `FIXTURE_AMBIGUITY`: **0**.
7. `REALIZATION_ONLY`: **3**.
8. Other: **0**.
9. Decision Readiness metadata already sufficient: **PARTIAL**.
10. Duplicate semantic judgment exists: **YES**.
11. Deterministic derivation feasible: **PARTIAL**.
12. CR-ADV-05: **unstable; later-work boundary is semantically supported, but the independent classifier overrides it in 4/10 detailed repetitions**.
13. LW-CTRL-01: **relation mostly stable; one realization-only premature stop**.
14. LW-CTRL-02: **unstable blocker/condition boundary; downgraded in 2/5**.
15. LW-CTRL-03: **stable, 5/5 correct**.
16. LW-CTRL-04: **unstable condition/blocker boundary; upgraded in 4/5**.
17. LW-CTRL-05: **relation stable, but realization/projection failed in 2/5**.
18. Cognition change required: **NO**.
19. Relationship-layer redesign required: **YES**.
20. Recommended next step: **deterministic projection from authoritative Decision Readiness metadata, followed by deterministic validation before any live rerun**.
