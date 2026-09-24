# Starteria — Current Decision / Later Work Boundary Report v0.1

Status: **LIVE_COMPLETED / HARNESS_ONLY**

Provider/model: openai_responses / gpt-5.6-luna; provider-reported model(s): gpt-5.6-luna. Schema mode: strict JSON Schema.

Decision Readiness cognition was not modified. Previous A/B artifacts were not overwritten.

## Execution

- Target calls: **45**
- Completed calls: **45**
- Schema-valid: **45/45**
- Adversarial correct: **5/25**

## Boundary gates

- CR-03 READY: **0/10**
- CR-04 READY: **4/10**
- CR-04 invented governance: **0**
- CR-04 invented authority: **0**
- Unnecessary questions: **7**
- Forced conversion: **0**
- Premature stop: **23**
- Decision Readiness regressions: **0**

## Blind adversarial question review

- CR-ADV-01: NONE, NONE, NONE, UNNECESSARY, NONE; questions classified against current-job necessity.
- CR-ADV-02: NONE, NONE, NONE, NONE, NONE; questions classified against current-job necessity.
- CR-ADV-03: NECESSARY, NECESSARY, NECESSARY, NECESSARY, NECESSARY; questions classified against current-job necessity.
- CR-ADV-04: UNNECESSARY, UNNECESSARY, UNNECESSARY, UNNECESSARY, UNNECESSARY; questions classified against current-job necessity.
- CR-ADV-05: NONE, UNNECESSARY, NONE, NONE, NONE; questions classified against current-job necessity.

## Scores

| Metric | Average | Gate |
|---|---:|---|
| HUMAN_LANGUAGE | 2.89 | FAIL |
| MOMENTUM_PRESERVATION | 3.11 | FAIL |
| ACTIONABILITY | 5.00 | PASS |
| VALUE_VISIBILITY | 4.71 | PASS |
| CONTINUATION_CLARITY | 3.58 | FAIL |

## Outcome

The boundary experiment is not promoted automatically. CR-03 and CR-04 are evaluated directly against the current-decision/later-work rule; adversarial questions are reviewed without treating later work as an Entry blocker.

Ready for full conversion rerun: **NO**

Recommended next step: if any gate fails, run a focused blind review of the failing cases before changing the boundary instruction; do not rerun the full 66-output benchmark yet.
