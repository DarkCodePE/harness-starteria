# Portfolio Entry — Clarification Convergence Runtime v0.1

# V2_CHANGE_GUARDRAIL_CHECK

slice:
Portfolio Entry → Active Question Clarification Convergence

authority:
ADR-002 ACCEPTED; `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`; clarification/handoff and harness acceptance contracts.

core_change: NO  
steps_change: NO  
portfolio_home_change: NO  
prisma_change: NO  
canonical_domain_change: NO

## Root causes fixed

- The planner/provider could return a batch and the runtime counted the batch as user-facing questions.
- API submissions were not deterministically bound to the current active question.
- `respondedResolves` was accepted without checking the active question, and was not merged into reconstructed runtime context.
- The frontend searched backward through history and could reactivate a stale question.
- A repeated question could survive wording/ID checks when its resolve target was equivalent.
- An answer with no usable information did not have an explicit distinction from a resolved gap.

## Runtime changes

- Productive clarification normalizes every provider output to at most one emitted question, selecting lowest priority number and preserving `questions[]` for compatibility.
- A provider batch is recorded as a violation, but only the normalized question consumes one budget slot.
- Quick Clarification budget remains three presented questions maximum.
- Repetition protection covers ID, normalized wording, and equal non-empty resolve targets.
- The planner prompt explicitly requests zero or one question and prohibits batching.
- API request validation accepts at most one `matchedQuestionIds` value.
- The service derives the active question only from the latest turn; legacy multi-question turns are reduced deterministically for matching and remain unchanged in history.
- DTOs expose matched IDs and resolved targets for traceability without exposing internal model metadata.

## Answer-resolution semantics

`QUESTION ANSWERED != GAP RESOLVED`.

- A valid answer carries exactly the active question ID.
- `respondedResolves` is intersected with that question's `resolves` list.
- Only that validated intersection is unioned into `answered_gaps`.
- “No lo sé todavía” keeps the active question's ID as answered/retired but produces no `respondedResolves` and does not update `answered_gaps`.
- Context reconstruction carries `answered_gaps` into the next planner call, so resolved gaps are not re-asked.

## Legacy compatibility

Persisted turns with multiple `emittedQuestions` remain readable and are not rewritten. ConversationTrace continues to render them as historical evidence. For active derivation, only the latest turn is considered and at most one deterministic question is selected. If the latest turn has zero questions, no older question becomes active. New productive turns conform to the one-question rule.

No Prisma model or migration was added.

## Tests

Added/updated coverage for provider batch normalization, one-slot budget consumption, unknown answers, answered-gap persistence/reconstruction, active-question submission identity, no-stale frontend rendering, and updated API compatibility expectations.

## Remaining risks

- Live provider behavior still needs an environment-backed E2E run with the configured model/provider.
- The requested historical audit path `docs/implementation/portfolio-entry-active-question-loop-audit-v0.1.md` is absent from this checkout; this is documented as an authority/documentation conflict and was not recreated.
- Full CI may include unrelated suites requiring external services or databases.

## Manual test checklist

- Start with “Tengo 5 desafíos internos detectados por una auditoría y no sé cuál abordar primero.”
- Confirm one active card at a time and a distinct question after each usable answer.
- Confirm the request payload contains one `matchedQuestionIds` value and only active-question resolves.
- Use “No lo sé todavía”; confirm the question disappears, the gap remains unresolved, and it is not re-asked.
- Confirm no fourth Quick Clarification question appears.
- Confirm `Ver conversación` retains historical questions without activating them.
- Confirm the checkpoint offers “Ver mi propuesta de abordaje” and “Seguir aterrizando mi necesidad”.
- Confirm provisional route reaches handoff readiness and Guided Exploration remains opt-in.
