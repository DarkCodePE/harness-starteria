# Starteria — Portfolio Entry Conversion Readiness Spec v0.1

Status: `HARNESS_ONLY_CANDIDATE`

This document defines an experimental continuation layer after Decision Readiness. It does not modify Decision Readiness cognition, productive runtime, routes, entities, schemas, backend, or frontend.

## Scope and separation

Decision Readiness remains authoritative for identifying material gaps, decision dependency and the appropriate conversational action. Conversion Readiness is a separate derived judgment:

> Is there enough context to create useful work and continue it in Starteria, even when material items remain open?

Internal `conversion_readiness` values are:

- `NOT_READY`: the need itself is not yet understandable enough for useful work.
- `READY`: the need and immediate direction are sufficiently understood; no material open item blocks continuation.
- `READY_WITH_OPEN_ITEMS`: useful work can continue, but one or more material items remain unresolved.

These labels are never visible to the public user.

## V2 change guardrail check

```text
Slice: PORTFOLIO_ENTRY_CONVERSION_READINESS_HARNESS
Authority: Portfolio Entry approved contract plus existing Decision Readiness evidence; this spec is experimental evidence, not product authority.
Manifest status: Portfolio Entry / Handoff candidate, testing.
Current route: harness artifacts only; no productive route changed.
Legacy dependencies: none introduced.
Semantic owner: V2 experimental harness; no legacy code defines behavior.
V1 assumptions detected: none.
Adapter required: no.
Tests protecting current behavior: existing Decision Readiness and conversational realization artifacts remain untouched.
Tests required for V2: focused and adversarial conversion fixtures, JSON schema checks, visible-language and non-invention gates.
Authority conflict: none for this harness-only experiment.
Proceed: YES
```

## Decision rules

1. Preserve the existing Decision Readiness result. Do not reopen or redesign it.
2. Mark `NOT_READY` only when the situation, desired result, or actionable need is still too unclear, or the input is unrelated.
3. Mark `READY` when the immediate direction is clear and unresolved detail belongs to later work rather than the current entry decision.
4. Mark `READY_WITH_OPEN_ITEMS` when the need is clear enough to work on and an unresolved item is material.
5. Missing organizational truth does not imply `NOT_READY` or STOP. Preserve it as an open item and describe useful work that can proceed meanwhile.
6. Ask at most one natural clarification question for an insufficient need. Do not ask for later-stage solution detail merely to reach completeness.
7. Never infer names, committees, sponsors, criteria, evidence, ownership or governance bodies.

## Internal handoff schema

```json
{
  "conversion_readiness": "NOT_READY | READY | READY_WITH_OPEN_ITEMS",
  "open_items": [
    {
      "description": "string",
      "why_it_matters": "string",
      "who_can_help_resolve_it": "string|null",
      "suggested_next_move": "string"
    }
  ],
  "conversion_handoff": {
    "understood_need": "string",
    "desired_outcome": "string|null",
    "known_context": ["string"],
    "open_items": ["same objects as above"],
    "suggested_next_moves": ["string"],
    "continuation_summary": "string"
  }
}
```

All handoff fields are evidence-backed. `null` or an empty array is required when the conversation does not support a value. The handoff is a continuation brief, not a strategic diagnosis and not a productive canonical entity.

## Visible-language contract

The visible response should naturally cover, as applicable: what is understood, what remains unresolved, what can proceed now, and how Starteria can continue helping. It must use plain human language. Internal labels, platform architecture, routes, modules, canonical entities and technical stage names are prohibited unless the user explicitly asks about platform operation.

Preferred continuation language includes: “seguir trabajándolo en Starteria”, “ordenar esto”, “preparar los siguientes pasos” and “seguir avanzando”.

## Evaluation

Each run scores 1–5 for `HUMAN_LANGUAGE`, `MOMENTUM_PRESERVATION`, `ACTIONABILITY`, `VALUE_VISIBILITY`, `JARGON_ABSENCE`, `NON_INVENTION`, and `CONTINUATION_CLARITY`. Failure flags are:

`PLATFORM_JARGON`, `PREMATURE_STOP`, `PREMATURE_PRODUCT_TECHNICALITY`, `INVENTED_AUTHORITY`, `INVENTED_GOVERNANCE`, `UNNECESSARY_QUESTION`, `PASSIVE_HANDOFF`, `OVER_EXPLANATION`.

The focused gate requires zero invention/jargon/premature-stop/unnecessary-question failures, the six expected states, and averages of at least 4.5 for Human Language, Momentum Preservation, Actionability, Value Visibility and Continuation Clarity. This deterministic evidence is not live-model validation.

