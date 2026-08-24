# R3-C2B Initiative Alignment + Completion Routing

## 1. Scope

Implemented R3-C2B foundation:

- Initiative alignment derivation.
- Methodological completion routing.
- Lifecycle projection for owner-completed vs portfolio-presented outcomes.
- Historical read-only guard for completed/superseded cycles.
- Read-only history endpoint.

Not implemented: DecisionRequest, Organizational Decision, DecisionEffects, final ContinuationRoute, Sponsor/Committee workflow, handoffs, Derived Initiative lifecycle, full UI, or resume-completed workflow.

## 2. Existing Origin / Alignment Sources

Canonical sources used:

- `InitiativePortfolioMeta.challengeId`: canonical challenge-assigned signal.
- `InitiativePortfolioMeta.strategicFrontId`: portfolio context reference when present.
- `InitiativeGovernance.mode`: explicit governance signal from R3-C2A.
- `Project.ownerId`: owner context, not portfolio alignment by itself.

Not used as alignment authority:

- global user role.
- frontend-provided route/state.
- `InitiativePortfolioMeta` generic dashboard fields without challenge linkage.

## 3. Alignment Semantics

Rules:

- `challenge_assigned`: `InitiativePortfolioMeta.challengeId` exists. Portfolio-aligned, governance resolves as `portfolio_governed`.
- `portfolio_initiative`: no challenge linkage, but `InitiativeGovernance.mode = portfolio_governed`. Portfolio-aligned.
- `self_initiated`: no challenge linkage and no explicit portfolio governance. Owner-governed.

Explicit portfolio governance prevents false `self_initiated` classification.

## 4. Methodological Completion Contract

Methodological completion is backend-derived from:

- current operational/latest cycle id.
- confirmed `AdaptiveStepOutput` for `stepNumber = 4`.
- `confirmedAt` present.

`currentStep = 4` alone is not completion.

## 5. Completion Routing

When methodological completion is false:

- lifecycle projection: `active`.
- no initiative completion.
- no portfolio review requirement.

When methodological completion is true:

- self-initiated route: `owner_completed`.
- portfolio-aligned route: `portfolio_presented`.

`portfolio_presented` means ready for later Portfolio Lead review. It does not create DecisionRequest or Decision.

## 6. Initiative Lifecycle Projection

No new schema was added for lifecycle in C2B.

Projection is derived from completion routing:

- `active`
- `completed`
- `presented`

Persistence effects:

- self-initiated completion sets `Project.status = COMPLETED`.
- portfolio-presented leaves `Project.status = IN_PROGRESS` and sets portfolio meta `status = lista_para_decision`.
- the methodological cycle becomes `completed`, not `superseded`.

## 7. Historical Read-Only Contract

Completed and superseded cycles are historical. Their confirmed contracts remain:

- readable.
- preserved.
- visible in history.
- immutable through normal checkpoint/output confirmation APIs.

The guard rejects new mutations on `completed` or `superseded` cycles with `HISTORICAL_CYCLE_READ_ONLY`.

## 8. History API / Read Model

Added read-only endpoints:

- `GET /projects/:id/adaptive-core/completion-routing`
- `GET /projects/:id/adaptive-core/history`

History returns:

- initiative summary.
- alignment.
- completion routing.
- lifecycle projection.
- cycles with parent/basedOn/trigger/status/currentStep.
- `CycleStepState` including inheritance provenance.
- confirmed step outputs.
- evidence metadata.
- source reference metadata.
- truth claim metadata.

It does not duplicate file contents.

## 9. Mutation Guards

Guarded:

- checkpoint confirmation.
- Step0 brief confirmation.
- Step1 output confirmation.
- Step2 output confirmation.
- Step3 output confirmation.
- Step4 output confirmation.

Idempotent retries with an already recorded idempotency key still return state.

Active current-cycle draft mutation remains available according to existing R2 rules.

## 10. Self-Initiated Flow

Flow:

Steps complete -> Summary -> Initiative completed.

Effects:

- route `owner_completed`.
- `initiativeCompleted = true`.
- `portfolioReviewRequired = false`.
- cycle status `completed`.
- project status `COMPLETED`.
- history remains visible/read-only.

## 11. Portfolio-Aligned Flow

Flow:

Steps complete -> Summary -> Presented / ready for Portfolio review.

Effects:

- route `portfolio_presented`.
- `initiativeCompleted = false`.
- `portfolioReviewRequired = true`.
- cycle status `completed`.
- project remains not closed.
- portfolio meta status `lista_para_decision`.
- no DecisionRequest.
- no Organizational Decision.

## 12. Invariant Matrix

| Invariant | Status | Evidence |
| --- | --- | --- |
| IC-01 Methodological completion != Initiative closure | PASS | Portfolio route completes cycle but does not close project. |
| IC-02 Self-initiated completion does not require Portfolio review | PASS | Resolver/service/E2E owner route. |
| IC-03 Portfolio-aligned completion does not close Initiative | PASS | E2E project stays `IN_PROGRESS`. |
| IC-04 Portfolio-aligned completion produces presented state | PASS | `portfolio_presented`, `lista_para_decision`. |
| IC-05 Completion route is backend-owned | PASS | Resolver/service only; no client route input. |
| IC-06 Alignment is derived from persisted context | PASS | Uses `InitiativePortfolioMeta` and `InitiativeGovernance`. |
| IC-07 Global role does not determine alignment | PASS | No role input in alignment resolver. |
| IC-08 Explicit portfolio governance prevents false self classification | PASS | Resolver/service tests. |
| IC-09 Challenge-assigned Initiative is portfolio-aligned | PASS | Resolver/service/E2E tests. |
| IC-10 Completed history remains readable | PASS | History service and E2E reload. |
| IC-11 Completed history is not deleted | PASS | E2E verifies outputs/evidence/source/truth remain. |
| IC-12 Confirmed historical contracts are immutable | PASS | Guard tests. |
| IC-13 Frontend cannot bypass historical immutability | PASS | Backend service guard before writes. |
| IC-14 Historical mutation rejection is backend-enforced | PASS | `HISTORICAL_CYCLE_READ_ONLY`. |
| IC-15 Draft/current-cycle editing remains available | PASS | Active draft confirmation service test. |
| IC-16 Later continuation must use new InitiativeCycle | PASS | Historical mutation is blocked; no reactivation path added. |
| IC-17 Historical Cycle is never reactivated | PASS | Completed/superseded cycles remain historical. |
| IC-18 Historical outputs are never overwritten | PASS | E2E mutation rejection preserves payload. |
| IC-19 Evidence/SourceRef/Truth preserved after completion | PASS | E2E history reload. |
| IC-20 Cycle completed != superseded | PASS | Completion uses `completed`; R3-B replacement uses `superseded`. |
| IC-21 Portfolio presentation != DecisionRequest | PASS | No DecisionRequest write/model/path. |
| IC-22 Portfolio presentation != Organizational Decision | PASS | Step4 no longer requires organizational decision. |
| IC-23 Self-initiated completed Initiative remains visible | PASS | History read model includes completed cycles/outputs. |
| IC-24 Historical Step provenance includes Cycle information | PASS | History returns cycles and `CycleStepState` provenance. |
| IC-25 Lifecycle supports future metrics without frontend truth | PASS | Derived from backend routing and persisted statuses. |

## 13. Tests

Focused tests:

- `initiative-completion.resolver.test.ts`: 5 tests.
- `initiative-completion.service.test.ts`: 5 tests.
- Updated legacy `adaptive-core.service.test.ts` Step4 expectations to C2B completion/presentation semantics.

## 14. PostgreSQL E2E

Added:

- `initiative-completion-routing.e2e.test.ts`: 3 tests.

Validated:

- self-initiated completion persistence.
- portfolio-presented completion persistence.
- challenge-assigned portfolio alignment.
- completed cycle reload/history.
- evidence/source/truth survive reload.
- historical output immutability after completion.
- no `decision_request_created` event.
- no `organizational_decision_created` event.

## 15. Schema / Migration Alignment

No schema or migration change was required for R3-C2B.

Used existing:

- `InitiativeGovernance` from R3-C2A.
- `InitiativePortfolioMeta.challengeId`.
- `InitiativePortfolioStatus.lista_para_decision`.
- `ProjectStatus.COMPLETED`.
- `CycleStatus.completed`.

Prisma validate/generate passed.

## 16. Explicitly Not Implemented

- DecisionRequest.
- Organizational Decision.
- DecisionEffects.
- ContinuationRoute final.
- Sponsor/Committee workflow.
- implementation_handoff.
- scaling_handoff.
- Derived Initiative lifecycle.
- full UI.
- resume-completed workflow.

## 17. Regression

Final executed validation:

- C2B focused tests: PASS, 10 tests.
- C2B PostgreSQL E2E: PASS, 3 tests.
- C2A focused tests: PASS, 17 tests.
- C1A focused tests: PASS, 18 tests.
- R3-B focused tests: PASS, 22 tests.
- PostgreSQL package:
  - `initiative-completion-routing.e2e.test.ts`
  - `decision-authority.e2e.test.ts`
  - `critical-change-transition.e2e.test.ts`
  - `r2-persistence.e2e.test.ts`
  - `cycle-database-invariants.e2e.test.ts`
  - PASS, 20 tests.
- `prisma validate`: PASS.
- `prisma generate`: PASS.
- `npm test`: informational FAIL only on known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts` / `LOG_REDACT_PATHS`; 735 tests passed.

## 18. R3-C2B GO / NO-GO

R3-C2B GO.

Full R3-C is not declared.

## 19. Lifecycle Authority Review Fix

Fixed the authority boundary between Step4 historical output and current Initiative lifecycle.

Step4 completion metadata in `AdaptiveStepOutput.outputJson` is treated only as a historical completion snapshot. It may preserve `lifecycleProjection`, `completionRoute`, `portfolioReviewRequired`, and related fields as provenance for the confirmed Step4 contract, but it is not the mutable/current lifecycle authority.

Current lifecycle resolution now depends on canonical backend state:

- `InitiativeCycle.status` and `InitiativeCycle.completedAt` for methodological completion.
- `Project.status` for self-initiated completion projection.
- `InitiativePortfolioMeta.status` for portfolio presentation projection.
- backend completion routing over canonical alignment plus confirmed Step4/cycle completion.

`getInitiativeCompletionRouting()` requires both a completed operational cycle and confirmed Step4 output before reporting methodological completion. A confirmed Step4 payload alone is insufficient. `getInitiativeHistory()` resolves the current lifecycle from backend routing/canonical state while still returning historical Step4 output payloads unchanged as readable provenance.

Self-initiated `Project.status = COMPLETED` remains readable. History, cycles, outputs, evidence, source references, and truth records remain available through the history read model.

Future resume/continuation remains intentionally unimplemented in C2B. The documented rule is that a later continuation of the same Initiative must create a new `InitiativeCycle` and may re-project the Project into an active state. It must never reactivate, reopen, or rewrite the completed cycle or its confirmed Step4 output.

Added regression coverage:

- Step4 completion metadata is preserved as historical snapshot.
- Completion/current lifecycle routing does not trust contradictory Step4 output metadata as authority.
- Portfolio-presented reload resolves presented from canonical higher-level state/routing.
- Self-initiated completed project history remains readable.
- Historical Step4 cannot be rewritten through normal mutation APIs.
- No DecisionRequest/Decision behavior was introduced.

R3-C2B FINAL GO.
