# ADR: Consistency between Copilot and Portfolio

Date: 2026-07-27

## Context

The first Copilot-first vertical creates `StrategicFront` from an approved `ProposedAction`. Copilot owns conversation, assessment, plan, approval and execution ledger. Portfolio remains the owner of `StrategicFront` creation and validation.

## Options

1. Shared transaction across Copilot ledger and Portfolio creation.
2. Non-atomic boundary with persisted idempotency ledger and reconciliation.

## Decision

Use option 2 for the current implementation.

Although both modules use the same Prisma Client, `PortfolioService.createStrategicFront` is currently a domain service method that owns its write and does not accept a transaction client. Copilot therefore records the execution ledger before dispatch, calls the Portfolio owner service, then records the result. The boundary is explicit and recoverable, but it is not declared exactly-once atomic.

## Consequences

- Copilot never writes `StrategicFront` directly.
- The persisted `idempotencyKey` prevents replay with the same key.
- Stale non-terminal executions are reconciled conservatively.
- Ambiguous executions are marked `manual_review_required` and are not reexecuted automatically.
- Future work can introduce a transaction-capable Portfolio port without moving business rules into Copilot.

## Limitations

- A process interruption after Portfolio creates a front and before Copilot completes the ledger can leave an ambiguous execution.
- Current reconciliation can complete only when result data is already present in the ledger. Otherwise it requires manual review.
- No outbox table exists yet for cross-module event delivery.
