# R3-C3A DecisionRequest Foundation

## 1. Scope

Implemented `DecisionRequest` as the explicit portfolio review bridge between `portfolio_presented` and a future Portfolio Lead Decision.

Not implemented: Organizational Decision, DecisionEffects, final ContinuationRoute, handoffs, Sponsor/Committee workflow, Decision Center UI, or resume completed initiative.

## 2. Eligibility Contract

A request can be created only when:

- the initiative is portfolio-aligned (`challenge_assigned` or `portfolio_initiative`);
- completion routing is `portfolio_presented`;
- methodological completion is true;
- the latest operational/read cycle is `completed`;
- portfolio review is required;
- no pending request already exists for the same `projectId + sourceCycleId`;
- current user has `currentUserCanSubmit` from DecisionAuthority;
- DecisionAuthority is resolved with an assigned authority user.

Self-initiated `owner_completed` initiatives are rejected with `DECISION_REQUEST_NOT_REQUIRED`.

## 3. DecisionRequest Model

Added persisted `DecisionRequest` with:

- `projectId`
- `sourceCycleId`
- `requestedById`
- `requestedAt`
- `status`
- `authorityType`
- nullable `authorityUserId`
- readiness, authority, decision package, recommendation, and presentation snapshots
- `requestVersion`
- unique `idempotencyKey`
- timestamps

Added enum:

- `DecisionRequestStatus`: `pending`, `resolved`, `cancelled`, `superseded`

Status starts as `pending`. `resolved` is reserved for future Decision linkage.

## 4. Snapshot Semantics

DecisionRequest freezes what Starteria knew when the request was submitted:

- readiness snapshot from backend DecisionReadiness;
- authority snapshot from backend DecisionAuthority;
- Step4/presentation package snapshot from confirmed Step4 output;
- presentation/routing snapshot from canonical alignment and completion routing;
- recommendation snapshot from Step4 package and readiness.

Snapshots are historical records. They do not become mutable Initiative lifecycle authority.

## 5. Authority Integration

DecisionRequest uses C2A DecisionAuthority resolution. Frontend cannot provide `authorityType`, `authorityUserId`, `status`, snapshots, `requestedById`, `requestedAt`, or a requested organizational outcome.

For `portfolio_presented` review, authority is resolved with `authorityPurpose = portfolio_review`. This is not tied to `implement` or any team-selected outcome. The Portfolio Lead is the review authority for all future organizational outcomes after presentation.

If Portfolio Lead is unassigned or authority is otherwise unresolved, creation fails with `DECISION_AUTHORITY_UNRESOLVED`.

## 6. Submission Semantics

Creation is explicit:

- `POST /projects/:id/adaptive-core/decision-requests`
- body: `idempotencyKey`

Read endpoints:

- `GET /projects/:id/adaptive-core/decision-requests`
- `GET /projects/:id/adaptive-core/decision-requests/:requestId`

Step4 confirmation/presentation does not automatically create a DecisionRequest.

## 7. Idempotency / Uniqueness

Same `idempotencyKey` returns the same request.

A second request with a different idempotency key against the same active presentation/current completed cycle returns the existing pending request and does not create a duplicate.

Database constraints:

- unique `idempotencyKey`;
- PostgreSQL partial unique index on `projectId + sourceCycleId` where `status = 'pending'`;
- non-unique lookup index on `projectId + sourceCycleId + status`.

## 8. Self-Initiated Guard

Self-initiated completed initiatives do not require Portfolio review and cannot create DecisionRequest. History remains readable.

## 9. Portfolio-Aligned Flow

Portfolio-aligned completion remains:

`methodological completion -> portfolio_presented -> explicit DecisionRequest -> future Portfolio Lead Decision`

DecisionRequest creation does not create Decision, DecisionEffects, or ContinuationRoute.

## 10. Staleness Foundation

Each request binds to `sourceCycleId` and stores presentation snapshots. Future Decision logic must reject or supersede requests tied to an old presentation/cycle if a new cycle or material change appears.

## 11. Invariant Matrix

| Invariant | Status | Evidence |
| --- | --- | --- |
| RQ-01 DecisionRequest != Decision | PASS | No Decision model/path added. |
| RQ-02 Presented != DecisionRequest | PASS | Step4 presentation does not auto-create request. |
| RQ-03 Self-initiated does not require DecisionRequest | PASS | Guard tests/E2E. |
| RQ-04 Only portfolio-aligned can create | PASS | Alignment/routing guard. |
| RQ-05 Methodological completion required | PASS | Completion routing guard. |
| RQ-06 Source Cycle must be completed | PASS | `cycle.status === completed` and `completedAt`. |
| RQ-07 Authority backend-resolved | PASS | Uses C2A service resolver. |
| RQ-08 Frontend cannot choose authority | PASS | Strict create schema. |
| RQ-09 Unresolved authority blocks creation | PASS | Unit/E2E. |
| RQ-10 currentUserCanSubmit required | PASS | Service guard. |
| RQ-11 Access alone does not imply submit | PASS | C2A capability used. |
| RQ-12 Readiness snapshot historical | PASS | Persisted JSON snapshot. |
| RQ-13 Authority snapshot historical | PASS | Persisted JSON snapshot. |
| RQ-14 Presentation/package snapshot historical | PASS | Persisted Step4/routing snapshots. |
| RQ-15 Creation does not mutate Step4 | PASS | Unit/E2E assertions. |
| RQ-16 Creation does not mutate Cycle | PASS | Unit/E2E assertions. |
| RQ-17 Creation does not mutate Truth/Evidence | PASS | Unit/E2E assertions. |
| RQ-18 Creation is idempotent | PASS | Unit/E2E same key. |
| RQ-19 Duplicate pending prevented | PASS | Unit/E2E second key returns existing. |
| RQ-20 Request binds to sourceCycleId | PASS | Model/tests. |
| RQ-21 Historical Step4 immutable | PASS | C2B guard preserved. |
| RQ-22 Status starts pending | PASS | Model default and tests. |
| RQ-23 Pending does not mean approval | PASS | No approval/decision fields. |
| RQ-24 Resolved reserved for future Decision | PASS | Enum only. |
| RQ-25 Request readable after reload | PASS | PostgreSQL fresh client test. |
| RQ-26 AI cannot create authority | PASS | No AI path/input. |
| RQ-27 AI cannot create final Decision | PASS | No Decision path. |
| RQ-28 Portfolio Lead remains MVP decision actor | PASS | C2A authority snapshot. |
| RQ-29 Sponsor/Committee out of workflow | PASS | Not implemented. |
| RQ-30 Supports future backlog/aging metrics | PASS | `status`, `requestedAt`, `authorityUserId`, `sourceCycleId`. |

## 12. Tests

Added:

- `decision-request.service.test.ts`: 8 tests.

Covered:

- portfolio-presented creation;
- self-initiated rejection;
- not complete/not presented rejection;
- unresolved Portfolio Lead rejection;
- strict input boundary;
- idempotency and duplicate pending prevention;
- no mutation to Step4/Cycle/Truth/Evidence;
- list/get read model.

## 13. PostgreSQL E2E

Added:

- `decision-request.e2e.test.ts`: 3 tests.

Validated:

- request persistence;
- idempotency;
- one pending request per presentation/source cycle;
- FK-backed persisted source cycle and users;
- fresh reload;
- readiness/authority/package/presentation snapshots;
- self-initiated rejection;
- unresolved authority rejection;
- no Organizational Decision event.

## 14. Schema / Migration Alignment

Added migration:

- `front/prisma/migrations/20260820120000_r3c3a_decision_request_foundation/migration.sql`

Clean E2E DB provision applied all 21 migrations successfully.

`migrate status`: database schema is up to date.

`migrate diff`: no R3-C3A drift remains. Remaining diff is pre-existing legacy drift:

- `PdfFieldProposal_runId_fieldPath_idx` / unique mismatch.
- `AdaptiveAdaptationEvent.summary` / `payloadJson` nullability.
- `PilotLead.proposal`.
- `PilotClaimToken`.

## 15. Explicitly Not Implemented

- Organizational Decision.
- DecisionEffects.
- ContinuationRoute final.
- implementation_handoff.
- scaling_handoff.
- Sponsor / Committee workflow.
- Decision Center UI.
- resume completed initiative.

## 16. Regression

Executed:

- C3A focused unit: PASS, 9 tests.
- C3A PostgreSQL E2E: PASS, 3 tests.
- C2B/C2A/C1A focused: PASS, 46 tests.
- R3-B focused: PASS, 22 tests.
- R2/R3-A/R3-B PostgreSQL package: PASS, 20 tests.
- `prisma validate`: PASS.
- `prisma generate`: PASS.
- clean DB provision: PASS.
- `migrate status`: PASS.
- `migrate diff`: no R3-C3A drift; legacy drift remains.
- `npm test`: informational FAIL only on known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts` / `LOG_REDACT_PATHS`; 745 tests passed.

## 17. R3-C3A GO / NO-GO

R3-C3A GO.

Full R3-C is not declared.

## 18. Domain Review Fix — Portfolio Review Semantics

DecisionRequest is now explicitly a review request:

> Please review this presented initiative and determine what happens next.

It is not a team proposal for `implement`, `scale`, `pause`, or any other organizational outcome.

Changes:

- removed `requestedDecisionType` from the creation input;
- removed `requestedDecisionType` from the persisted model/migration;
- removed the null-to-`implement` authority workaround;
- added `authorityPurpose = portfolio_review` for post-presentation review authority;
- Portfolio Lead is the authority for all five future organizational outcomes after `portfolio_presented`;
- active-cycle methodological iteration remains separate from post-presentation organizational outcome authority;
- readiness snapshot now always includes all five `DecisionType` assessments;
- raw/team input cannot restrict readiness snapshot to one outcome;
- pending uniqueness is enforced by partial SQL invariant only for `status = 'pending'`;
- historical `cancelled` / `resolved` / `superseded` rows are not blocked by broad `projectId + sourceCycleId + status` uniqueness;
- recommendation snapshot is Starteria analysis/provenance, not team authority.

Review-fix validation:

- C3A focused unit + C2A authority resolver: PASS, 20 tests.
- C3A PostgreSQL E2E: PASS, 3 tests.
- C2B/C2A/C1A focused: PASS, 46 tests.
- R3-B focused: PASS, 22 tests.
- R2/R3-A/R3-B PostgreSQL package: PASS, 20 tests.
- clean DB provision: PASS.
- `migrate status`: PASS.
- `migrate diff`: no R3-C3A drift; legacy drift remains.
- `prisma validate`: PASS.
- `prisma generate`: PASS after isolated rerun.

R3-C3A FINAL GO.
