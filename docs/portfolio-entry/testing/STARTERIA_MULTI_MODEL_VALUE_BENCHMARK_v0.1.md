# Starteria — Multi-Model Value Benchmark v0.1

Status: `TECHNICAL_EXECUTION_COMPLETE`

## Population

[
  {
    "provider": "openai_responses",
    "requested_model": "gpt-5.6-luna",
    "provider_reported_model": null,
    "structured_output_capability": "STRICT_JSON_SCHEMA",
    "temperature": null,
    "token_limits": "not_sent_by_existing_harness_adapter",
    "smoke": {
      "pass": true,
      "error": null
    },
    "config_source": "PORTFOLIO_ENTRY_BENCHMARK_CONFIGS or current explicit live config",
    "status": "COMPLETED"
  }
]

Primary outputs completed: 72. Target per completed model: 72. Boundary controls are recorded separately and excluded from primary conversational aggregates.

## Validity and metrics

```json
{
  "openai_responses|VANILLA": {
    "total": 36,
    "valid": 36,
    "averages": {
      "NATURALNESS": 3.39,
      "USER_JOB_ALIGNMENT": 5,
      "QUESTION_USEFULNESS": 4.61,
      "COGNITIVE_INVISIBILITY": 5,
      "FLEXIBILITY": 3.39,
      "ACTION_CLARITY": 5,
      "AMBIGUITY_REDUCTION": 4,
      "DECISION_PROGRESS": 4
    },
    "median_latency_ms": 4109,
    "mean_input_tokens": 131.42,
    "mean_output_tokens": 262.61
  },
  "openai_responses|STARTERIA": {
    "total": 36,
    "valid": 36,
    "averages": {
      "NATURALNESS": 5,
      "USER_JOB_ALIGNMENT": 5,
      "QUESTION_USEFULNESS": 5,
      "COGNITIVE_INVISIBILITY": 5,
      "FLEXIBILITY": 5,
      "ACTION_CLARITY": 5,
      "AMBIGUITY_REDUCTION": 4,
      "DECISION_PROGRESS": 4
    },
    "median_latency_ms": 4417,
    "mean_input_tokens": 681.42,
    "mean_output_tokens": 364.94
  }
}
```

Starteria aggregate heuristic metric snapshot: {"NATURALNESS":5,"FLEXIBILITY":5,"USER_JOB_ALIGNMENT":5,"QUESTION_USEFULNESS":5,"ACTION_CLARITY":5,"AMBIGUITY_REDUCTION":4,"DECISION_PROGRESS":4}. These are automated screening scores; no human blind review has been completed.

## Uplift by provider

For the completed OpenAI configuration, automated screening deltas (STARTERIA minus VANILLA) were:

| Metric | Delta |
|---|---:|
| USER_JOB_ALIGNMENT | +0.00 |
| QUESTION_USEFULNESS | +0.39 |
| ACTION_CLARITY | +0.00 |
| AMBIGUITY_REDUCTION | +0.00 |
| DECISION_PROGRESS | +0.00 |
| NATURALNESS | +1.61 |
| FLEXIBILITY | +1.61 |

These deltas are directional screening evidence only, not a final quality claim, because the human review queues remain unscored.

## Decision quality and boundary controls

Starteria primary action observations: CF-02 REQUIRE 3/3; CF-05 REQUIRE 3/3; CF-11 STOP 2/3 and ROUTE 1/3. The CF-11 result is compatible with its invariant-based STOP/ROUTE expectation. AUTH-CTRL-01 was ASK 3/3, AUTH-CTRL-02 was ASK 3/3, and AUTH-CTRL-03 was STOP 3/3. No provider errors, schema failures, or semantic envelope inconsistencies occurred.

Vanilla internal fields are `NOT_AVAILABLE`; no hidden reasoning was inferred. Starteria action fields are recorded where schema-valid. Strict/invariant scoring is therefore reported only for observable Starteria fields and requires separate human review for final quality claims.

## Stability

Starteria action stability across the 12 primary cases: STABLE 10/12, MOSTLY_STABLE 2/12, UNSTABLE 0/12. Vanilla has no action trace by design; a visible-question-count proxy classified 0/12 STABLE, 0/12 MOSTLY_STABLE and 12/12 UNSTABLE, which is not comparable to Starteria action stability and is reported only as a presentation proxy.

## Cost and latency

OpenAI median latency was 4,109 ms for VANILLA and 4,417 ms for STARTERIA; p95 latency was 6,322 ms and 5,877 ms respectively. Mean input/output tokens were 131.42/262.61 for VANILLA and 681.42/364.94 for STARTERIA. Incremental mean token usage was +550.00 input and +102.33 output tokens. Cost is `NOT_CONFIGURED`; no pricing table was supplied, so no estimated cost or cost-per-valid-output claim is made.

## Uplift, stability, cost and latency

Per-provider Starteria-minus-Vanilla metrics, repetition stability, latency, token usage, and cost are preserved in the JSON run artifact. Estimated cost is `NOT_CONFIGURED` because no benchmark pricing configuration was supplied. Token counts are `NOT_REPORTED` by providers that omit usage.

## Blind and pairwise review

An anonymized review queue and randomized pairwise queue were created. They contain no provider/model/condition labels in reviewer-facing records. No human judgments are included yet; conclusions are therefore limited to technical execution and automated observables.

## Model dependency findings

No strategic cross-model conclusion is valid until at least two model configurations complete and the blind/pairwise queues are reviewed. Unconfigured families are explicitly `NOT_EXECUTABLE`; no model was substituted.

## Limitations

- Only explicitly configured provider/model IDs were attempted.
- Existing adapter does not send token-limit controls and does not expose provider usage through metadata; raw usage is retained when present.
- Automated text heuristics are not a replacement for the required blind human review.
- Vanilla cannot be evaluated for hidden Decision Readiness fields without violating the condition.

## Recommended next experiment

Configure at least one approved non-OpenAI model through `PORTFOLIO_ENTRY_BENCHMARK_CONFIGS`, rerun the frozen benchmark without changing either condition, then complete the blind and pairwise reviews before making value or substitution claims.
