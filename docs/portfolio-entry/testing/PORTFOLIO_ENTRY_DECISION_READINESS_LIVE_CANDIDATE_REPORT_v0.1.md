# Starteria — Decision Readiness Live Candidate v0.1

Status: `BLOCKED_AFTER_BATCH_VALIDATION`

Product runtime modified: `NO`

Product prompts/contracts/Core/Steps modified: `NO`

## 1. Candidate definition

```text
candidate_id: portfolio-entry-decision-readiness-live-v0.1
adapter_mode: live_llm_candidate
provider: openai_responses
model: gpt-5.6-luna
credential variable: `PORTFOLIO_ENTRY_API_KEY` (fallback: `PORTFOLIO_ENTRY_HARNESS_API_KEY`)
prompt: test/portfolio-entry-v02-isolated-validation/decision-readiness-live-prompt.v0.1.md
fixture set: CF-01..CF-12, frozen
repetitions: 5 per case
requested population: 60
```

The candidate used a harness-only prompt and schema. Internal fields were kept
separate from visible synthesis/question/response fields.

## 2. Execution result

```text
technical smoke: PASS (one provider call, before batch)
attempts: 60
completed runs: 60
completed valid LLM runs: 10
failed provider calls: 0
schema-validation failures: 50
provider response: no provider errors in rerun

The smoke used the live candidate provider/model configuration and failed fast
would have prevented the batch if authentication had been invalid. The exact
frozen population was then executed: `CF-01…CF-12 × 5`.

The 50 invalid runs failed local output validation with:

```text
routing_target: Required
```

No prompt, fixture, schema, evaluator, or candidate behavior was changed for
this rerun. The existing runner now gates the batch on the one-call technical
smoke and does not log the credential.
```

The first sandbox attempt produced transport failures. The approved external
retry reached the provider and confirmed the credential failure. No model
output was available for evaluation.

Raw run metadata is preserved in:

`PORTFOLIO_ENTRY_DECISION_READINESS_LIVE_RUNS_v0.1.json`

No API key or secret value is written to that artifact.

## 3. Stability metrics

The batch is not complete at the valid-output level: 50/60 runs failed schema
validation, so full-population stability classifications are not assigned.
The 10 valid outputs are retained as partial evidence only.

| Classification | Cases |
|---|---:|
| STABLE | NOT_ASSIGNED |
| MOSTLY_STABLE | NOT_ASSIGNED |
| UNSTABLE | NOT_ASSIGNED |
| NOT_EVALUABLE | 12 |

Selected-gap, action, route, question-count and STOP consistency are all
`NOT_AVAILABLE`.

## 4. Conversational evaluation

Ten valid visible LLM turns were produced. The following partial averages are
not a full-population evaluation:

| Dimension | Average |
|---|---:|
| NATURALNESS | `3.8` (10 valid runs) |
| USER_JOB_ALIGNMENT | `3.2` (10 valid runs) |
| QUESTION_USEFULNESS | `4.0` (10 valid runs) |
| COGNITIVE_INVISIBILITY | `5.0` (10 valid runs) |
| FLEXIBILITY | `3.8` (10 valid runs) |
| ACTION_CLARITY | `3.2` (10 valid runs) |

Failure counts from the partial valid subset are not promoted to full-batch
metrics:

```text
unnecessary_question: NOT_PROMOTED
framework_leakage: NOT_PROMOTED
user_job_drift: NOT_PROMOTED
unknown_loop: NOT_PROMOTED
premature_route: NOT_PROMOTED
late_stop: NOT_PROMOTED
material_gap_missed: NOT_PROMOTED
```

The prior deterministic review remains the only valid conversational evidence;
it is not relabeled as live evidence.

## 5. Independent human review

Not executable. There were no live outputs for an independent reviewer to
judge. No human-review score is fabricated from deterministic fixtures.

## 6. Gate

The live-candidate gate cannot be evaluated for the requested 60 valid runs.
It is therefore closed:

```text
NATURALNESS >= 4.2: NOT_EVALUABLE
USER_JOB_ALIGNMENT >= 4.5: NOT_EVALUABLE
QUESTION_USEFULNESS >= 4.3: NOT_EVALUABLE
COGNITIVE_INVISIBILITY >= 4.7: NOT_EVALUABLE
FLEXIBILITY >= 4.2: NOT_EVALUABLE
ACTION_CLARITY >= 4.3: NOT_EVALUABLE

READY_FOR_NEXT_EXPERIMENTAL_PHASE: NO

## 9. Structured-output hardening checkpoint

The harness-only hardening added explicit field-presence instructions, nullable
non-applicable fields, and action-field semantic post-validation. Productive
schemas and runtime behavior were not modified.

Audit of the prior 50 invalid outputs:

```text
routing_target: Required  -> 38
visible_question: Required -> 15
```

These counts overlap. The stored artifact preserves validation errors but not
the invalid provider output bodies, so semantic usability of invalid outputs is
`NOT_ASSESSABLE` and no quality conclusion is drawn from them.

Semantic field treatment:

| Field | Semantic classification |
|---|---|
| selected_material_gap | ALWAYS_REQUIRED |
| next_action | ALWAYS_REQUIRED |
| deferred_gaps | OPTIONAL_DIAGNOSTIC; always-present array, empty when none |
| routing_target | CONDITIONALLY_MEANINGFUL; required for ROUTE and REQUIRE_ORGANIZATIONAL_INPUT |
| stop_rationale | CONDITIONALLY_MEANINGFUL; required for STOP, otherwise null |
| visible_synthesis | ALWAYS_REQUIRED |
| visible_question | CONDITIONALLY_MEANINGFUL; required for ASK, otherwise null |
| visible_response | ALWAYS_REQUIRED |

The post-hardening smoke used 10 representative live calls across ASK, STOP,
ROUTE and REQUIRE_ORGANIZATIONAL_INPUT. Result:

```text
schema-valid: 0/10
semantic-consistency failures: 0 evaluable
gate: FAIL
full frozen rerun after hardening: NOT RUN
```

The failed smoke gate blocks further evaluation and the 60-run rerun.

## 10. Latest hardening smoke attempt

The frozen 60-run JSON was preserved and not overwritten. After the harness
nullable-envelope and prompt alignment changes, the required 10-call smoke was
run again and failed closed:

```text
schema-valid: 0/10
missing routing_target: 5
missing stop_rationale: 8
missing visible_question: 7
semantic-consistency failures: 0 evaluable
full frozen rerun: NOT RUN
```

The smoke gate therefore remains failed. No productive schema, evaluator,
fixture, provider/model, or Decision Readiness reasoning was changed.
```

## 7. Hypothesis status

HYP-005 remains **`ITERATE`**. The deterministic candidate remains stable, but
the live candidate has no valid evidence because provider authentication failed.

## 11. Provider wiring audit and hardened rerun

The actual request was verified as:

```text
STRUCTURED_OUTPUT_MODE: STRICT_JSON_SCHEMA
endpoint: /v1/responses
format: json_schema
strict: true
root: object
additionalProperties: false
all properties in required: YES
```

The provider returned HTTP 200 and included the nullable envelope fields with
explicit `null` values. The shared adapter then removed those nulls with
`removeProviderNullOptionals` before local Zod validation. Root cause:
`TRANSFORM_DROPPED_FIELD` in the shared parser path.

A HARNESS-only null-preserving adapter was added. The minimal provider
reproduction passed `5/5`. The representative Decision Readiness smoke passed
`10/10`, with action coverage `ASK=3, STOP=2, ROUTE=1,
REQUIRE_ORGANIZATIONAL_INPUT=4` and zero semantic-consistency failures.

The hardened rerun passed:

```text
completed: 60/60
schema-valid: 60/60
provider errors: 0
semantic-consistency failures: 0
provider/model: openai_responses / gpt-5.6-luna
```

Its JSON is written to:

`PORTFOLIO_ENTRY_DECISION_READINESS_LIVE_RUNS_HARDENED_RERUN_v0.1.json`

The prior historical JSON path was overwritten by the existing runner during
the rerun before the output-path guard was added. Its previously reported
summary (10/60 valid, 50 schema failures) remains documented above, but the
original raw JSON cannot be recovered from this checkout.

## 8. Recommended next step

Correct or provision the isolated harness provider credential, verify the
provider/model configuration with one non-fixture smoke call, then rerun the
same frozen 60-run population. Do not change CF-01…CF-12, candidate behavior,
or evaluation thresholds before that rerun.
