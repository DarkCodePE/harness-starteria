# Starteria — Conversational Realization Boundary Report v0.1

Status: `HARNESS_ONLY_CANDIDATE_VALIDATED_FOR_REALIZATION`

The authoritative 60/60 source artifact was not modified. No productive runtime,
Decision Readiness reasoning, fixture, provider/model, or evaluator rule was
modified.

## 1. Root cause

The prior quality loss was primarily a realization-boundary problem:

- 30/60 runs contained a visible question and a synthesis that restated the
  same question intent.
- The visible response also commonly repeated the question, amplifying the
  duplication when fields are composed for display.
- This explains the low NATURALNESS/FLEXIBILITY scores without evidence of
  framework leakage, user-job drift, unnecessary questions, or missed gaps.

The instability in CF-02, CF-05 and CF-11 is separate: their internal
high-level actions vary across repetitions. The realization layer does not
change that cognition.

## 2. Duplication source

For the synthesis/question boundary, the source is
`MODEL_GENERATED_DUPLICATION`: the synthesis already contains the question's
material intent. The visible response adds composition-level amplification.
There is no evidence that a renderer alone created the duplication; the
duplicated content is already present in the model output fields.

Counts:

| Finding | Runs | Cases |
|---|---:|---|
| QUESTION_DUPLICATED_IN_SYNTHESIS | 30 | CF-01, CF-02, CF-04, CF-05, CF-06, CF-09, CF-10 |
| SYNTHESIS_UNNECESSARY | 30 | CF-01, CF-02, CF-04, CF-05, CF-06, CF-09, CF-10 |
| SYNTHESIS_TOO_LONG | 5 | CF-09 |
| CONSULTING_TONE | 30 | CF-01, CF-02, CF-04, CF-05, CF-06, CF-09, CF-10 |
| GENERIC_ABSTRACTION | 5 | CF-10 |
| OVER_COMPRESSION | 0 material | none |

## 3. Unstable cases

| Case | Classification | Internal comparison |
|---|---|---|
| CF-02 | COGNITIVE_INSTABILITY | Same priority gap theme, but ASK=2 versus REQUIRE_ORGANIZATIONAL_INPUT=3 with different routing targets. |
| CF-05 | COGNITIVE_INSTABILITY | Same authority gap theme, but ASK=2 versus REQUIRE_ORGANIZATIONAL_INPUT=3. |
| CF-11 | COGNITIVE_INSTABILITY | Same no-immediate-gap reading, but STOP=3 versus ROUTE=2 toward the later experiment. |

Wording variation within the same action is realization variability, but the
action/route divergence is material enough to retain the cognitive-instability
classification. No cognition was changed.

## 4. HARNESS-only presentation candidate

Candidate: `portfolio-entry-conversational-realization-v0.1`.

It adds a derived `presentation_mode` after model execution:

- `DIRECT_QUESTION` for ASK: suppresses redundant synthesis and keeps one
  bounded question.
- `SYNTHESIS_ONLY` for STOP.
- `ROUTE_MESSAGE` for ROUTE and REQUIRE_ORGANIZATIONAL_INPUT.
- `SYNTHESIS_PLUS_QUESTION` remains available for cases where synthesis adds
  material framing; it is not used when it merely repeats the question.

The candidate does not alter selected gap, next action, route, deferred gaps,
stop rationale, or any Decision Readiness reasoning.

## 5. 18-run pilot

Population: CF-02, CF-05, CF-09, CF-10, CF-11, CF-12 × 3 = 18.

| Metric | Result |
|---|---:|
| Valid runs | 18/18 |
| NATURALNESS | 4.78 |
| FLEXIBILITY | 5.00 |
| QUESTION_USEFULNESS | 4.56 |
| ACTION_CLARITY | 5.00 |
| Question duplication | 0/18 |
| Reasoning regressions | 0 |
| Unnecessary questions | 0 |
| Framework leakage | 0 |
| User-job drift | 0 |

Pilot gate: **PASS**.

## 6. Full rerun

The eligible full rerun completed as 12 cases × 5 = 60 valid runs in:

`PORTFOLIO_ENTRY_CONVERSATIONAL_REALIZATION_FULL_RERUN_v0.1.json`

| Metric | Result |
|---|---:|
| Valid runs | 60/60 |
| NATURALNESS | 4.92 |
| FLEXIBILITY | 5.00 |
| QUESTION_USEFULNESS | 4.40 |
| ACTION_CLARITY | 5.00 |
| Question duplication | 0/60 |
| Provider errors | 0 |
| Semantic envelope failures | 0 |

The full rerun validates the realization-layer improvement. It does not
eliminate the separately observed action variability in CF-02, CF-05 or CF-11.

## 7. Conclusion

Decision Readiness cognition modified: **NO**.

Presentation layer modified: **YES, HARNESS-only**.

The evidence supports B for the naturalness/flexibility failure and supports a
separate cognitive-instability finding for three cases. The realization
candidate is ready for further isolated live validation, but it is not a
productive-runtime promotion and does not close the cognitive-instability
question.

Recommended next step: keep this realization candidate isolated and audit
CF-02, CF-05 and CF-11 as a separate cognition-stability experiment before
considering any production-facing change.
