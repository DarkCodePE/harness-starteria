# R3-C1A DecisionReadiness Foundation

## 1. Scope

Implemented only DecisionReadiness foundation.

DecisionReadiness answers whether there is enough basis for a person to decide responsibly. It does not create or persist a DecisionRequest, Organizational Decision, DecisionEffects, ContinuationRoute, implementation handoff, scaling handoff, Derived Initiative lifecycle, or Decision Center UI.

Implementation is read-only and deterministic. No Prisma model/table was added because readiness snapshots should be persisted later with DecisionRequest / Decision.

## 2. Domain Types

Added:

- `DecisionType`: `continue_experimenting`, `implement`, `scale`, `pause`, `close_with_learning`.
- `DecisionReadinessStatus`: `not_ready`, `conditionally_ready`, `ready`.
- `DecisionReadinessDimensionStatus`: `insufficient`, `partial`, `sufficient`.
- `DecisionReadinessDimension`: `evidence`, `impact`, `execution`, `risk`, `governance`.
- `DecisionReadinessIssue`.
- `DecisionReadinessAssessment`.
- `DecisionReadinessInput`.

## 3. Canonical Inputs Used

Evidence:

- Persisted `TruthClaim`.
- Persisted `Evidence.truthStatus`.
- Persisted `TruthValidation.result`.

Impact:

- Persisted `ImpactAssertion.status`: `declared`, `estimated`, `validated`, `realized`.

Execution:

- Operational `InitiativeCycle.currentStep`.
- Current-cycle `AdaptiveStepOutput.outputJson` fields that already exist in R2/R3 flows: execution plan/design, selected bet, experiment/pilot plan, operational readiness, blockers/dependencies.
- Open `AttentionItem` entries with operational categories/reasons.

Risk:

- Open `AttentionItem` entries with risk/legal/regulatory/data/security/blocker signals.
- Existing risk fields in current-cycle outputs and `Project.step0Data.mainRisk`.

Governance:

- `Project.ownerId`.
- Active project team membership.
- Existing `InitiativePortfolioMeta` context.

Known limitation: there is no R3-C1A-specific persisted authority model for execution, risk, or governance. The resolver therefore treats missing facts as `insufficient` or `partial` and emits structured conditions/unresolved questions instead of fabricating readiness.

## 4. Policy Matrix

`continue_experimenting`:

- Can be `ready` with partial evidence and estimated/declared impact.
- Requires a meaningful unresolved question and minimal execution/governance operating context.
- Does not require validated impact.

`implement`:

- Requires sufficient evidence.
- Requires at least partial impact, execution, risk, and governance.
- Returns `conditionally_ready` when execution/risk/governance gaps are explicit conditions.
- Missing/partial evidence keeps it `not_ready`.

`scale`:

- Stricter than implement.
- Requires sufficient evidence, validated/realized impact, sufficient execution, sufficient risk understanding, and sufficient governance.
- Declared-only impact is `not_ready`.

`pause`:

- Does not require implementation readiness.
- Can be `ready` when there is enough reason/context to pause.

`close_with_learning`:

- Does not require implementation readiness or positive evidence.
- Can be `ready` when learning is captured or evidence contradicts the thesis.

## 5. Invariant Matrix

| Invariant | Status | Evidence |
|---|---:|---|
| DR-01 Readiness is decision-specific | PASS | `decision-readiness.resolver.test.ts` T1 |
| DR-02 Readiness != Organizational Decision | PASS | No decision model/write; assessment has no organizational decision |
| DR-03 Readiness != System Recommendation | PASS | Assessment has no recommendedAction/final recommendation authority |
| DR-04 not_ready may coexist with ready | PASS | T1, T7 |
| DR-05 Hard blockers != conditions | PASS | Separate arrays in type and policy |
| DR-06 Evidence derives from persisted Truth/Evidence | PASS | Service loader reads `TruthClaim`, `Evidence`, `TruthValidation` |
| DR-07 Missing evidence remains missing | PASS | T2 |
| DR-08 Contradicted/insufficient evidence cannot count as validated support | PASS | T3 |
| DR-09 Impact states remain distinct | PASS | Loader counts declared/estimated/validated/realized separately |
| DR-10 Execution readiness cannot fabricate feasibility | PASS | Missing execution stays insufficient/conditional, T6 |
| DR-11 Risk readiness means understood enough, not zero risk | PASS | Known risk can be sufficient; critical open risk blocks |
| DR-12 Governance readiness != DecisionAuthority | PASS | T9; no authority grant output |
| DR-13 AI cannot override backend facts | PASS | No AI input path; pure backend resolver |
| DR-14 Assessment reproducible and snapshot-able | PASS | Deterministic resolver over normalized input plus evaluatedAt |
| DR-15 scale threshold higher than implement | PASS | T1, T4, T5 |
| DR-16 pause/close do not require implementation readiness | PASS | T7, T8 |
| DR-17 conditions are explicit structured outputs | PASS | `DecisionReadinessIssue[]` conditions |
| DR-18 Human may later decide differently | PASS | No Decision/DecisionRequest mutation or authority grant |
| DR-19 Frontend cannot set overallStatus | PASS | T10; GET query only accepts `decisionType` |
| DR-20 Readiness policy backend-owned | PASS | `decision-readiness.resolver.ts` |

## 6. Tests

Added:

- `backend/modules/adaptive-core/__tests__/decision-readiness.resolver.test.ts`
- `backend/modules/adaptive-core/__tests__/decision-readiness.service.test.ts`

Coverage:

- Decision-specific readiness.
- Missing evidence.
- Contradicted evidence.
- Declared-only impact.
- Scale threshold.
- Missing execution.
- Pause independent from implement.
- Close with learning on contradicted thesis.
- Governance readiness not authority.
- Raw/client overall status ignored.
- Operational cycle resolved server-side.
- No mutation to CriticalChange, InitiativeCycle, CycleStepState, AdaptiveStepOutput, TruthClaim, Evidence, TruthValidation.

## 7. Known Data Gaps

Execution:

- No dedicated execution readiness aggregate exists yet. C1A derives conservative signals from operational cycle position, current-cycle outputs, and AttentionItem blockers.

Risk:

- No dedicated risk register exists yet. C1A derives conservative signals from AttentionItem severity and existing risk fields.

Governance:

- No DecisionAuthority or governance model exists yet by design. C1A uses owner/team/portfolio context only as readiness context, not as authority.

## 8. Explicitly Not Implemented

- DecisionRequest
- Organizational Decision
- DecisionEffects
- ContinuationRoute
- implementation_handoff
- scaling_handoff
- Derived Initiative lifecycle
- Decision Center UI
- comité/sponsor/business owner authority
- broad frontend redesign

## 9. Regression Result

Focused C1A:

- `npm run test:backend -- ../backend/modules/adaptive-core/__tests__/decision-readiness.resolver.test.ts ../backend/modules/adaptive-core/__tests__/decision-readiness.service.test.ts`: PASS, 2 files, 12 tests.

R3-B focused unit set:

- `critical-change-assessment.test.ts`
- `critical-change-idempotency.test.ts`
- `critical-change-user-outcome.test.ts`
- `critical-change-same-cycle.test.ts`
- `critical-change-new-cycle.test.ts`
- `critical-change-transition-idempotency.test.ts`
- `cycle-initialization.test.ts`
- `cycle-projection.test.ts`
- `cycle-state-loading.test.ts`
- `cycle.service.test.ts`

Result: PASS, 10 files, 22 tests.

PostgreSQL regression:

- `critical-change-transition.e2e.test.ts`: PASS, 8 tests.
- `r2-persistence.e2e.test.ts`: PASS, 4 tests.
- `cycle-database-invariants.e2e.test.ts`: PASS, 2 tests.

Prisma:

- `npx prisma validate --schema prisma/schema.prisma` with explicit E2E `DATABASE_URL`: PASS.
- `npx prisma generate --schema prisma/schema.prisma`: PASS.

Informational:

- `npm test`: FAIL only in known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts`; 82 files passed, 6 skipped, 1 failed; 702 tests passed, 17 skipped, 1 failed.

## 10. R3-C1A GO / NO-GO

R3-C1A GO.

DecisionReadiness foundation is implemented as a read-only backend-owned assessment. R3-B/R2/R3-A regressions remain green. Full R3-C is not declared.

## 11. C1A Review Fix — Fact Authority

Findings fixed:

- Persistence errors no longer become missing facts. The canonical readiness loader no longer uses generic `.catch(() => [])` around `TruthClaim`, `Evidence`, `TruthValidation`, `ImpactAssertion`, `AttentionItem`, or `AdaptiveStepOutput` reads. A DB/query/schema failure now propagates and no readiness assessment is fabricated from empty arrays.
- Evidence sufficiency now follows R1 Truth authority. `Evidence.truthStatus = supports` alone does not make evidence sufficient. `TruthValidation.result` alone does not create support when disconnected from claim authority. Strong evidence readiness requires persisted `TruthClaim.verificationState = supported`.
- Contradicted and insufficient claims remain non-support. They can inform learning or closure, but do not count as validated support.
- Execution/risk output fields and keyword-derived AttentionItem matches are treated as conservative signals only. They can improve `insufficient` to `partial`, but they cannot prove `sufficient` readiness in C1A.
- Governance remains context only. `ownerId`, active team membership, and `InitiativePortfolioMeta` do not create DecisionAuthority.

Canonical R1 Truth support semantics after fix:

- `claimCount`: persisted `TruthClaim` rows.
- raw evidence: persisted `Evidence` rows and `truthStatus` counts.
- canonical support: persisted `TruthClaim.verificationState = supported`.
- contradicted/insufficient support: persisted `TruthClaim.verificationState = contradicted|insufficient`.
- validations remain visible context, but are not independently elevated into sufficient readiness without claim authority.

Execution/risk signal semantics after fix:

- `hasExecutionSignal` and `hasOperationalReadinessSignal` are heuristic signals from current-cycle outputs.
- `hasRiskSignal` and `knownRiskCount` are heuristic signals from outputs, AttentionItem, and existing Step0 risk text.
- `hasProvenExecutionReadiness` and `hasProvenRiskReadiness` are false in C1A because no canonical persisted source exists yet.
- Therefore, execution/risk can be `partial`, not `sufficient`, from current heuristic signals.

Scale behavior after fix:

- `scale` remains stricter than `implement`.
- Validated impact and sufficient evidence are not enough for full `ready` if execution/risk are only heuristic partial signals.
- With current C1A sources, scale normally remains `not_ready` until a later R3-C source can prove execution/risk/governance readiness.

Additional/adjusted tests:

- DB query failure propagates and does not return fake `not_ready`.
- Raw supporting Evidence without supported Claim is not sufficient.
- Supported Claim contributes canonical sufficient evidence.
- Contradicted/insufficient Claims are non-support.
- Operational field existence cannot prove execution sufficient.
- Risk field existence cannot prove risk sufficient.
- Scale does not become ready from weak heuristic signals.
- Implement may remain `conditionally_ready` from partial execution/risk/governance signals.
- No mutation and backend operational-cycle resolution remain covered.

Regression evidence after review fix:

- C1A focused tests: PASS, 2 files, 18 tests.
- R3-B focused unit set: PASS, 10 files, 22 tests.
- PostgreSQL `critical-change-transition.e2e.test.ts`, `r2-persistence.e2e.test.ts`, `cycle-database-invariants.e2e.test.ts`: PASS, 3 files, 14 tests.
- `prisma validate` with explicit E2E `DATABASE_URL`: PASS.
- `prisma generate`: PASS.
- `npm test`: informational FAIL only in known out-of-scope `backend/shared/utils/__tests__/logger-redaction.test.ts`; 82 files passed, 6 skipped, 1 failed; 708 tests passed, 17 skipped, 1 failed.

R3-C1A FINAL GO.
