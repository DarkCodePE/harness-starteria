# R3-C4A Organizational Decision Foundation

## 1. Scope

Implemented the backend foundation for a persisted, immutable Organizational Decision created from a pending portfolio DecisionRequest.

Out of scope remains: DecisionEffects, ContinuationRoute application, handoffs, new-cycle effects, Sponsor/Committee workflow, and Decision Center UI.

## 2. Decision Model

Added `DecisionOutcome` values aligned to backend `DecisionType`:

- `continue_experimenting`
- `implement`
- `scale`
- `pause`
- `close_with_learning`

Added `Decision` as a historical record with:

- `projectId`
- `sourceCycleId`
- `decisionRequestId`
- `outcome`
- `decidedById`
- `decidedAt`
- `rationale`
- `conditionsJson`
- decision-time authority/readiness snapshots
- request/package/presentation/recommendation snapshots
- `idempotencyKey`
- `createdAt`

No mutable update surface was added.

## 3. Decision Eligibility

A Decision can be created only from a `DecisionRequest` that:

- belongs to the project
- is `pending`
- points to a completed presented source cycle
- is not stale
- has not already produced a Decision

Self-initiated initiatives do not enter this flow because they cannot create DecisionRequests.

## 4. Authority Recheck

Authority is rechecked at decision time via backend `DecisionAuthority` using `authorityPurpose = portfolio_review`.

The request-time authority snapshot is historical context only. It is not trusted as current authority.

Only the currently resolved Portfolio Lead for the presented review context may decide.

## 5. Staleness

DecisionRequest is rejected as stale when:

- the source cycle is not completed
- a newer InitiativeCycle exists
- an active cycle exists after the presented source cycle
- recomputed completion routing no longer resolves to `portfolio_presented`
- presentation snapshot provenance no longer matches the source cycle

Stale requests are rejected with `DECISION_REQUEST_STALE`; no auto-supersede workflow was added.

## 6. Readiness at Decision Time

Readiness is re-evaluated at decision time for the selected outcome.

Policy:

- `ready`: allowed
- `conditionally_ready`: allowed only when all current conditions are explicitly accepted
- `not_ready`: rejected

Readiness remains advisory/factual support, not authority.

## 7. Recommendation / Rationale

Rationale is required for every Decision.

Recommendation snapshots are preserved as Starteria analysis. They are not rewritten to match the human outcome.

The Portfolio Lead may choose an outcome different from the recommendation, but the persisted rationale remains mandatory.

## 8. Conditions

For `conditionally_ready`, accepted condition codes are validated against the current readiness assessment.

Persisted `conditionsJson` stores accepted structured conditions:

- `code`
- `dimension`
- `message`
- `accepted: true`

No task management or follow-up execution was implemented.

## 9. Transaction / Idempotency / Concurrency

Decision creation is transactional.

Inside the transaction:

- the DecisionRequest row is locked on PostgreSQL with `FOR UPDATE`
- request state is reloaded
- existing Decision for the request is checked
- current authority/readiness/staleness are validated
- Decision is created
- DecisionRequest is marked `resolved`
- provenance event is emitted

Constraints:

- `Decision.idempotencyKey` unique
- `Decision.decisionRequestId` unique

Same idempotency key for the same project/request returns the same Decision. Reuse against another project/request is rejected as `DECISION_IDEMPOTENCY_CONFLICT`.

Concurrent distinct confirmations against the same request produce exactly one Decision; the losing request is rejected as already resolved.

## 10. Immutability

Decision is immutable by API design:

- no update endpoint
- no delete endpoint
- no route/effect application
- no lifecycle mutation

Later organizational direction changes must use a future valid decision flow and a new historical Decision.

## 11. Snapshot Semantics

Decision persists:

- decision-time `authoritySnapshotJson`
- decision-time `readinessSnapshotJson`
- request-time `recommendationSnapshotJson`
- request/package `packageSnapshotJson`
- presentation `presentationSnapshotJson`

DecisionRequest snapshots remain unchanged after Decision creation.

## 12. Invariant Matrix

| Invariant | Status | Evidence |
| --- | --- | --- |
| OD-01 DecisionRequest != Decision | PASS | Separate `DecisionRequest` and `Decision` models/routes. |
| OD-02 pending != approval | PASS | DecisionRequest only transitions to `resolved` after Decision creation. |
| OD-03 Authorized human required | PASS | `currentUserCanDecide` required. |
| OD-04 Authority rechecked at decision time | PASS | Current authority resolver called during transaction. |
| OD-05 Decision immutable historical record | PASS | No PATCH/DELETE route; no `updatedAt`. |
| OD-06 Later direction change creates new Decision | PASS | Existing Decision cannot be overwritten. Future flow documented. |
| OD-07 Recommendation snapshot not rewritten | PASS | Decision copies request recommendation snapshot unchanged. |
| OD-08 Decision-time readiness snapshot persisted | PASS | `readinessSnapshotJson` from current evaluation. |
| OD-09 Package/presentation snapshot persisted | PASS | `packageSnapshotJson` and `presentationSnapshotJson` persisted. |
| OD-10 Against recommendation requires rationale | PASS | Rationale required for all Decisions. |
| OD-11 Conditions persisted | PASS | `conditionsJson` stores accepted readiness conditions. |
| OD-12 Outcome != lifecycle projection | PASS | No Project/Portfolio lifecycle write in Decision creation. |
| OD-13 Outcome != ContinuationRoute | PASS | No ContinuationRoute model/effect added. |
| OD-14 Stale request cannot be decided | PASS | `DECISION_REQUEST_STALE` tests. |
| OD-15 Resolved request cannot create second Decision | PASS | Unique `decisionRequestId` plus service guard. |
| OD-16 Creation idempotent | PASS | Same key returns same Decision. |
| OD-17 Concurrent double decision produces one | PASS | PostgreSQL concurrency E2E. |
| OD-18 Frontend cannot write decidedBy/authority | PASS | Create schema accepts only idempotency, outcome, rationale, accepted conditions. |
| OD-19 AI cannot create final Decision | PASS | Human service/API path only; no AI route. |
| OD-20 Historical Decision cannot be overwritten/deleted | PASS | No update/delete endpoint. |
| OD-21 Portfolio Lead is decision actor | PASS | `portfolio_review` authority purpose. |
| OD-22 Self-initiated no Decision flow | PASS | Guard is inherited from DecisionRequest eligibility. |
| OD-23 Readiness re-evaluated at decision time | PASS | Service reloads facts and evaluates selected outcome. |
| OD-24 not_ready cannot be confirmed | PASS | `DECISION_READINESS_NOT_READY`. |
| OD-25 conditionally_ready requires conditions | PASS | `DECISION_CONDITIONS_REQUIRED`. |
| OD-26 ready needs no fabricated conditions | PASS | `close_with_learning` ready path stores null conditions. |
| OD-27 Request snapshots unchanged | PASS | Unit and E2E assertions. |
| OD-28 Decision creation does not mutate Step4 | PASS | Unit and E2E assertions. |
| OD-29 Decision creation does not mutate Truth/Evidence | PASS | Unit and E2E assertions. |
| OD-30 No route/effects applied | PASS | No cycle/project lifecycle/effect mutation in service. |

## 13. Tests

Added:

- `backend/modules/adaptive-core/__tests__/organizational-decision.service.test.ts`
- `backend/modules/adaptive-core/__tests__/organizational-decision.e2e.test.ts`

Focused unit coverage:

- authorized Portfolio Lead creates Decision
- owner/non-authorized user rejected
- global role-like user not assigned is rejected
- authority changed after request uses current authority
- non-pending requests rejected
- stale newer cycle rejected
- `not_ready` outcome rejected
- `conditionally_ready` requires accepted conditions
- same idempotency key returns same Decision
- cross-project/request idempotency key reuse rejected
- request snapshots, Step4, Cycle, Truth, Evidence unchanged

## 14. PostgreSQL E2E

PostgreSQL E2E validates:

- Decision persistence and reload
- one request to one Decision
- request status becomes `resolved`
- idempotent retry returns same Decision
- distinct second decision key is rejected after resolution
- stale request rejected
- authority rechecked after Portfolio Lead change
- concurrency produces one Decision
- source cycle, Step4 output, TruthClaim and Evidence remain unchanged
- no new InitiativeCycle is created

## 15. Schema / Migration Alignment

Added migration:

- `front/prisma/migrations/20260820150000_r3c4a_organizational_decision_foundation/migration.sql`

Clean E2E provisioning applied 22 migrations successfully.

`prisma migrate status`: database schema is up to date.

`prisma migrate diff` after clean provisioning shows only documented legacy drift:

- `PdfFieldProposal_runId_fieldPath_idx` drop
- `AdaptiveAdaptationEvent.summary` / `payloadJson` nullability
- `PilotLead.proposal`
- `PilotClaimToken`
- `PdfFieldProposal_runId_fieldPath_key`

No Decision / R3-C4A drift remains.

## 16. Explicitly Not Implemented

- DecisionEffects
- ContinuationRoute application
- implementation_handoff
- scaling_handoff
- resume/new-cycle effect
- Sponsor/Committee workflow
- Decision Center UI

## 17. Regression

Commands run:

- `npm run test:backend -- ../backend/modules/adaptive-core/__tests__/organizational-decision.service.test.ts`
- `R2_PERSISTENCE_E2E=1 DATABASE_URL=postgresql://postgres:postgres@localhost:55433/starteria_e2e npm.cmd run test:backend -- ../backend/modules/adaptive-core/__tests__/organizational-decision.e2e.test.ts`
- C4A/C3A/C2B/C2A/C1A/R3-B focused unit set: 11 files, 67 tests passed
- PostgreSQL package: 7 files, 26 tests passed
- `npm run db:e2e:provision`
- `npm run db:e2e:status`
- `prisma migrate diff`
- `prisma validate`
- `prisma generate`
- `npm test` informational

`npm test` informational result:

- backend: 88 files passed, 10 skipped; 751 tests passed, 29 skipped
- 1 known out-of-scope failure: `backend/shared/utils/__tests__/logger-redaction.test.ts` / `LOG_REDACT_PATHS`
- frontend was not reached because `npm test` stops after backend failure

## 18. R3-C4A GO / NO-GO

R3-C4A GO.

Organizational Decision foundation is implemented as a persisted, immutable, human-authorized historical record tied to DecisionRequest and backed by authority/readiness/snapshot validation. No DecisionEffects or ContinuationRoute application were implemented.
