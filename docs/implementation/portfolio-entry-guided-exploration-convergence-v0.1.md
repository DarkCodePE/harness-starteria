# Portfolio Entry — Guided Exploration convergence v0.1

## Scope

Slice: Portfolio Entry clarification orchestration. This change does not modify Portfolio Home, Core, Steps, Prisma, or Handoff visual design. The previous Quick zero-question fix is included as the branch baseline.

## Current behavior

- Quick Clarification allowed up to 3 user-facing questions.
- Guided Exploration used a hardcoded budget of 3 questions per round.
- Guided completion could enter `ended_with_uncertainty` or go directly to `ready_for_handoff`.
- There was no distinct second checkpoint or second proposal CTA.
- The controller could reapply the same `accept` choice after a Guided turn, allowing another exploration transition.

## Target behavior

```text
Quick Clarification: 0..3 questions
Checkpoint 1: proposal or Guided opt-in
Guided Exploration: one round, 0..2 additional questions
Checkpoint 2: proposal only
Total before proposal: 0..5 questions
```

Guided completion by sufficient context, no new material question, or budget exhaustion converges to Checkpoint 2. The normal completion path does not use `ended_with_uncertainty`.

## Contract changes

Updated candidate/testing contracts:

- `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`
- `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
- `entry-04-question-planner/SKILL_v0.2.md`
- `PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md`

They now formalize Quick max 3, one Guided round, Guided max 2, total max 5, and a second checkpoint with only `Ver mi propuesta de abordaje`. No ADR was added or modified.

## State transitions

Checkpoint identity is derived without a new persisted model:

```text
exploration_offered + interaction_mode=quick_clarification
  → Checkpoint 1; accept is available

exploration_offered + interaction_mode=guided_exploration
  → Checkpoint 2; only provisional_route is available
```

The DTO exposes `clarification.checkpoint` as `quick` or `guided`. The API rejects `accept` from the Guided checkpoint, and the controller has a defensive one-round guard.

## Budget semantics

- Quick budget remains cumulative and is never reset.
- Guided budget is `GUIDED_QUESTION_BUDGET = 2`.
- Guided `questions_asked_current_round` resets only when entering the single Guided round.
- The live adapter receives the same remaining budget.
- A question plan still emits at most one user-facing question per turn.

## Second checkpoint and CTA sequencing

Guided questions use Guided-specific labels and copy. On completion the UI shows:

`Con lo que acabamos de profundizar, ya puedo convertir esta lectura en una propuesta de abordaje.`

The only action is `Ver mi propuesta de abordaje`. It sends `provisional_route`, transitions to `ready_for_handoff`, and leaves analysis/materialization, review, and downstream CTA sequencing unchanged.

## Tests

Added or updated coverage for:

- Guided sufficient context after one turn.
- Guided budget exhaustion after two questions.
- zero emitted Guided question.
- Quick budget preservation.
- second checkpoint provisional route.
- no third Guided round.
- second checkpoint without Guided CTA.
- Guided-specific frontend copy and active composer.
- E2E assertions for max 5 questions, max 2 Guided questions, second checkpoint, history, and no empty composer.

## Remaining risks

- Full E2E depends on the configured Docker/PostgreSQL and native bcrypt environment.
- Contracts remain candidate/testing artifacts; this slice does not promote them to stable product authority.
- The existing `ended_with_uncertainty` status remains available for technical/safety or future insufficient-input cases, but is no longer the normal Guided budget completion path.

## Validation

- PASS — backend focal tests: session controller and Portfolio Entry router, 39 tests.
- PASS — frontend focal tests: Portfolio Entry experience, 18 tests.
- PASS — typecheck for frontend and backend.
- PASS — `git diff --check`.
- NOT RUN — directed E2E could not reach Playwright because E2E provisioning fails before startup when the local native `bcrypt` binding is missing (`bcrypt_lib.node`). Database migrations completed successfully before that pre-existing environment failure.
