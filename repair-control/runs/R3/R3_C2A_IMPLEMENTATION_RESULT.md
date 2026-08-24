# R3-C2A Governance + DecisionAuthority Foundation

## 1. Scope

Implemented the read-only DecisionAuthority foundation for R3-C2A.

This work answers:

> For this Initiative, for this DecisionType, who currently has authority to finalize the decision, and what may the current user do?

It does not create DecisionRequest, Organizational Decision, DecisionEffects, ContinuationRoute, handoff flows, derived initiatives, committee governance, sponsor authority, business owner authority, Decision Center UI, or frontend redesign.

DecisionReadiness remains separate, read-only, decision-specific, backend-owned, and not DecisionAuthority.

## 2. Existing Governance Sources Found

- `Project.ownerId`: canonical initiative owner identity used for `initiative_owner` authority.
- `TeamMember`: access/team participation context only; not authority.
- `InitiativePortfolioMeta`: portfolio/progress projection context only; not authority and not a Portfolio Lead assignment.
- `StrategicFront.ownerId` / `Challenge.ownerId`: persisted ownership-like context exists, but it is not a canonical per-initiative Portfolio Lead assignment for R3-C2A.

No existing canonical persisted relation was found for "Portfolio Lead responsible for this Initiative". Therefore R3-C2A adds a minimal project-scoped governance configuration.

## 3. Persistence Decision

Added minimal persistence:

- `GovernanceMode` enum.
- `InitiativeGovernance` model with:
  - `projectId`
  - `mode`
  - optional `portfolioLeadUserId`
  - timestamps.

Reason: `portfolio_governed` authority cannot be derived safely from global user roles, team membership, or portfolio projection metadata. The model is intentionally small and read by the authority service; no write/API management flow was added in C2A.

Migration added:

- `front/prisma/migrations/20260819120000_r3c2a_governance_foundation/migration.sql`

The migration is additive and does not modify R3-A, R3-B, or older migrations.

## 4. Governance Mode

Governance modes:

- `owner_governed`
- `portfolio_governed`

Backward compatibility:

- If no `InitiativeGovernance` row exists and `Project.ownerId` exists, the initiative resolves as `owner_governed`.
- If owner context is missing, authority returns `insufficient_context`.
- Existing projects are not silently marked `portfolio_governed`.

## 5. Decision Authority Policy Matrix

OWNER_GOVERNED:

| DecisionType | Authority |
| --- | --- |
| continue_experimenting | initiative_owner |
| implement | initiative_owner |
| scale | initiative_owner |
| pause | initiative_owner |
| close_with_learning | initiative_owner |

PORTFOLIO_GOVERNED:

| DecisionType | Authority |
| --- | --- |
| continue_experimenting | initiative_owner |
| pause | initiative_owner |
| implement | portfolio_lead |
| scale | portfolio_lead |
| close_with_learning | portfolio_lead |

Policy lives in `decision-authority.resolver.ts`, not in frontend/controller code.

## 6. Authority Resolution

Owner identity:

- Resolved from `Project.ownerId`.

Portfolio Lead identity:

- Resolved only from `InitiativeGovernance.portfolioLeadUserId`.
- A global role string such as `portfolio_lead` does not grant authority.
- If portfolio governance requires a Portfolio Lead and none is assigned, result is `authorityStatus = unassigned`.

Operational context:

- The service resolves the operational `InitiativeCycle` backend-side.
- Historical cycles do not control current authority.

Current user capabilities:

- `currentUserCanDecide = true` only when the user is the resolved authority user and `authorityStatus = resolved`.
- `currentUserCanSubmit = true` when the user can decide, is the canonical initiative owner, or is the assigned Portfolio Lead.
- Team membership or project access alone does not imply `canDecide`.

The route verifies project access first, but access is not DecisionAuthority.

## 7. Backward Compatibility

Existing initiatives with no governance row continue as `owner_governed` when `Project.ownerId` exists.

No Portfolio Lead is invented for existing projects.

No data migration creates governance rows for existing projects.

## 8. Invariant Matrix

| Invariant | Status | Evidence |
| --- | --- | --- |
| DA-01 Access != DecisionAuthority | PASS | Service verifies access separately; resolver does not use access as authority. |
| DA-02 GovernanceMode != DecisionAuthority | PASS | Mode selects policy; authority is separately resolved. |
| DA-03 Authority is decision-specific | PASS | Same initiative can resolve owner for continue and Portfolio Lead for implement. |
| DA-04 Authority is resolved backend-side | PASS | Endpoint accepts only `decisionType`; service loads project/governance/cycle. |
| DA-05 Global role alone cannot grant authority | PASS | Tests prove `role='portfolio_lead'` without assignment cannot decide. |
| DA-06 Authority must belong to Initiative governance context | PASS | Portfolio Lead is only `InitiativeGovernance.portfolioLeadUserId`. |
| DA-07 owner_governed permits canonical owner decisions | PASS | Owner implement test. |
| DA-08 portfolio_governed escalates configured decision types | PASS | Implement/scale resolve to Portfolio Lead. |
| DA-09 Missing required authority reports unresolved status | PASS | Missing Portfolio Lead returns `unassigned`. |
| DA-10 AI cannot grant DecisionAuthority | PASS | No AI input/path is used. |
| DA-11 Frontend cannot grant DecisionAuthority | PASS | Route query validates only `decisionType`. |
| DA-12 Result does not create Decision | PASS | Read-only service, no Decision model writes. |
| DA-13 Result does not create DecisionRequest | PASS | No DecisionRequest writes or model. |
| DA-14 canDecide != canSubmit | PASS | Owner can submit but cannot decide portfolio-governed implement. |
| DA-15 Project access alone does not imply canDecide | PASS | Non-owner participant cannot decide. |
| DA-16 Portfolio context alone does not identify Portfolio Lead | PASS | `InitiativePortfolioMeta` is not used as authority. |
| DA-17 Historical cycle does not control current authority | PASS | Service resolves operational cycle. |
| DA-18 Authority resolution is read-only/idempotent | PASS | Service read-only test verifies no mutations. |
| DA-19 DecisionReadiness governance does not grant authority | PASS | Separate API/result; no readiness data grants authority. |
| DA-20 Authority policy is backend-owned | PASS | Resolver/service own policy. |

## 9. Tests

Focused unit tests:

- `decision-authority.resolver.test.ts`: 10 tests.
- `decision-authority.service.test.ts`: 7 tests.

PostgreSQL E2E:

- `decision-authority.e2e.test.ts`: 3 tests.
  - owner-governed backward compatibility without governance row.
  - configured portfolio-governed authority without global role shortcuts.
  - one governance config per project DB invariant.

## 10. Known Gaps

Intentional future work:

- committee governance.
- sponsor authority.
- business owner authority.
- multi-stage approval.
- governance management/write API or admin UI.
- richer portfolio ownership model.

## 11. Explicitly Not Implemented

- DecisionRequest.
- Organizational Decision.
- DecisionEffects.
- ContinuationRoute.
- implementation_handoff.
- scaling_handoff.
- Derived Initiative lifecycle.
- Decision Center UI.
- frontend redesign.

## 12. Regression

Validation executed:

- C2A focused unit tests: PASS, 17 tests.
- C2A PostgreSQL E2E: PASS, 3 tests.
- C1A focused tests: PASS, 18 tests.
- R3-B focused unit set: PASS, 22 tests.
- PostgreSQL R2/R3-A/R3-B regressions:
  - `critical-change-transition.e2e.test.ts`: PASS.
  - `r2-persistence.e2e.test.ts`: PASS.
  - `cycle-database-invariants.e2e.test.ts`: PASS.
  - Combined: PASS, 14 tests.
- `npm run db:e2e:provision`: PASS from clean disposable DB.
- `npm run db:e2e:status`: PASS, database is up to date.
- Prisma migrate diff: no R3-C2A drift. Remaining drift is documented legacy repository drift only.
- `prisma validate`: PASS with E2E `DATABASE_URL`.
- `prisma generate`: PASS.
- `npm test`: informational FAIL only on known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts` / `LOG_REDACT_PATHS`.

## 13. R3-C2A GO / NO-GO

R3-C2A GO.

R3-C2A DecisionAuthority is implemented as a read-only, backend-owned, decision-specific authority resolver. It preserves access/team/governance/authority/decision separation and does not implement DecisionRequest or Organizational Decision.

## 14. C3A Review Fix Note — Portfolio Review Authority

C2A active-cycle methodological authority remains decision-specific:

- portfolio-governed `continue_experimenting` and `pause` stay with the initiative owner during active methodological work;
- portfolio-governed `implement`, `scale`, and `close_with_learning` escalate to Portfolio Lead.

C3A added a distinct authority purpose:

- `authorityPurpose = portfolio_review`

When an initiative is already methodologically completed and `portfolio_presented`, Portfolio Lead is the review authority for all five future organizational outcomes:

- `continue_experimenting`
- `implement`
- `scale`
- `pause`
- `close_with_learning`

This separates active-cycle methodological iteration from post-presentation organizational outcome determination. It does not create DecisionRequest, Decision, DecisionEffects, Sponsor/Committee workflow, or UI in C2A.
