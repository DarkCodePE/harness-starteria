# Starteria — Decision Readiness Live Candidate Quality Report v0.1

Status: `ITERATE`

This is an evaluation-only report. The authoritative hardened 60/60 JSON was not modified. Productive runtime, candidate prompt, schema, fixtures, evaluator rules, provider and model were not modified for this evaluation.

## Population

Valid runs evaluated: 60/60
Cases evaluated: 12/12
Missing or duplicate runs: none; every case has exactly five repetitions.

## Stability

STABLE: 7
MOSTLY_STABLE: 2
UNSTABLE: 3

| Case | Classification | High-level actions | Divergent runs |
|---|---|---|---|
| CF-01 | MOSTLY_STABLE | REQUIRE_ORGANIZATIONAL_INPUT=1, ASK=4 | r1:REQUIRE_ORGANIZATIONAL_INPUT |
| CF-02 | UNSTABLE | ASK=2, REQUIRE_ORGANIZATIONAL_INPUT=3 | r1:ASK, r2:ASK |
| CF-03 | STABLE | REQUIRE_ORGANIZATIONAL_INPUT=5 | none |
| CF-04 | STABLE | ASK=5 | none |
| CF-05 | UNSTABLE | ASK=2, REQUIRE_ORGANIZATIONAL_INPUT=3 | r1:ASK, r3:ASK |
| CF-06 | STABLE | ASK=5 | none |
| CF-07 | STABLE | REQUIRE_ORGANIZATIONAL_INPUT=5 | none |
| CF-08 | MOSTLY_STABLE | ROUTE=4, REQUIRE_ORGANIZATIONAL_INPUT=1 | r5:REQUIRE_ORGANIZATIONAL_INPUT |
| CF-09 | STABLE | ASK=5 | none |
| CF-10 | STABLE | ASK=5 | none |
| CF-11 | UNSTABLE | STOP=3, ROUTE=2 | r2:ROUTE, r4:ROUTE |
| CF-12 | STABLE | REQUIRE_ORGANIZATIONAL_INPUT=5 | none |

High-level field comparison: all cases preserve the same material-gap theme across repetitions, with wording variation. CF-11 consistently identifies no immediate gap. Routing targets vary in wording but stay within the same authority/stage theme when the action aligns. STOP appears only in CF-11 (3/5); CF-11 repetitions r2 and r4 route to the subsequent experiment instead. Visible-question intent remains case-appropriate: capacity, adoption, authority, value, scope or missing context.

The stability gate requires at least 10/12 cases STABLE or MOSTLY_STABLE. Result: **FAIL (9/12)**. No severe routing divergence was observed, but CF-02, CF-05 and CF-11 show material high-level action variation.

## Aggregate conversational metrics

| Metric | Average | Median | Minimum | Gate |
|---|---:|---:|---:|---|
| NATURALNESS | 3.22 | 3.00 | 2 | FAIL (>=4.2) |
| USER_JOB_ALIGNMENT | 5.00 | 5.00 | 5 | PASS (>=4.5) |
| QUESTION_USEFULNESS | 4.47 | 4.00 | 4 | PASS (>=4.3) |
| COGNITIVE_INVISIBILITY | 5.00 | 5.00 | 5 | PASS (>=4.7) |
| FLEXIBILITY | 3.50 | 3.50 | 2 | FAIL (>=4.2) |
| ACTION_CLARITY | 5.00 | 5.00 | 5 | PASS (>=4.3) |
| AMBIGUITY_REDUCTION | 4.67 | 5.00 | 3 | PASS (>=4.3) |
| DECISION_PROGRESS | 4.33 | 4.00 | 3 | PASS (>=4.3) |

Weakest aggregate dimension: NATURALNESS (3.22). Strongest aggregate dimension: USER_JOB_ALIGNMENT (5.00).

## Question behavior

Total visible question-bearing runs: 30/60 (50.00%).
Cases with zero question-bearing runs: CF-03, CF-07, CF-08, CF-11, CF-12.
Cases with one question in all five repetitions: CF-04, CF-06, CF-09, CF-10. Mixed question behavior: CF-01, CF-02 and CF-05.
Runs with more than one distinct visible question: 0. The one-question behavior is adaptive by case, not mechanically universal: several cases route or stop without asking.
Unnecessary-question rate: 0/60 (0.00%).

## Failure detection

| Failure | NONE | MINOR | MATERIAL | SEVERE |
|---|---:|---:|---:|---:|
| overstructured | 30 | 30 | 0 | 0 |
| unnecessary_question | 60 | 0 | 0 | 0 |
| user_job_drift | 60 | 0 | 0 | 0 |
| framework_leakage | 60 | 0 | 0 | 0 |
| unknown_loop | 60 | 0 | 0 | 0 |
| premature_route | 60 | 0 | 0 | 0 |
| late_stop | 60 | 0 | 0 | 0 |
| material_gap_missed | 60 | 0 | 0 | 0 |
| authority_invented | 60 | 0 | 0 | 0 |
| evidence_overstated | 60 | 0 | 0 | 0 |

Framework leakage, user-job drift, unknown loops, premature routing, late STOP, material-gap misses, authority invention and evidence overstatement were not observed in the visible-output review.

## Compression and consulting-tone review

CF-09 preserves the presence of metrics, budget, sponsor, team, pilots, dependencies and three scopes, but repeatedly asks for the exact decision and scope definitions. This is decision-relevant, though the duplicated question field makes the response feel more consultative and structured than necessary. No material context loss was found. CF-10 is the weakest naturalness case: its generic prompt is appropriate to sparse context but reads formulaically across repetitions.

## Independent blind review

The blind artifact is recorded in `PORTFOLIO_ENTRY_DECISION_READINESS_BLIND_REVIEW_v0.1.md`. This is a recorded blind visible-output review, not a fabricated human score. It found generally clear job alignment and no framework exposure, with a recurring duplication/consulting-tone issue in question-bearing responses.

## Gates and hypothesis

Conversational quality gate: **FAIL**. NATURALNESS, FLEXIBILITY and the stability gate are below target; the remaining dimensions meet or exceed their thresholds in this review.
Severe framework leakage: 0. Severe user-job drift: 0. Material unknown loops: 0. Severe authority invention: 0. Severe evidence overstatement: 0. Severe material-gap misses: 0.

Hypothesis status: `ITERATE`.
LIVE_VALIDATED: NO. This real-LLM harness run is technically valid, but the requested quality thresholds and stability gate are not met. Productive-ready: NO.

Recommended next step: review the duplicated visible-question/visible-response presentation boundary and the three divergent cases (CF-02, CF-05, CF-11) in a separate authorized iteration. Do not change this candidate or its evidence retroactively.
