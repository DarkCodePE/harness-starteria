# Portfolio Handoff Assignment Persistence — H-TECH-02

**Jira:** KAN-52  
**Branch:** `feat/KAN-52-handoff-assignment-persistence`  
**Status:** IMPLEMENTED — bounded persistence and creation-time invariants only

## 1. Scope

Implemented `PortfolioHandoffAssignment` persistence, target-kind validation, explicit owner/execution-team invariants, unresolved invited identity representation, read/create repository boundaries, version initialization, and negative protection against creating Initiative Core state for an Assigned Challenge.

Not implemented: invitation claim/authentication, delivery, Accept, Reject, Portfolio response, Handoff Shell, Activation Overview, Start, projections, semantic events, and legacy-route retirement/quarantine beyond this service boundary.

## 2. Authority read

Read before implementation:

- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` (not materialized in this checkout; `CURRENT_STATE.md` identifies the factual Core contract at `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`)
- product ADR-003, ADR-004, and ADR-005 under `doc/product-adr/`
- `PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md`
- `PORTFOLIO_TO_INITIATIVE_HANDOFF_ACCEPTANCE_CHECKLIST_v0.1.md`
- `PORTFOLIO_TO_INITIATIVE_HANDOFF_INTEGRATION_CONTRACT_v0.1.md`
- `PORTFOLIO_TO_INITIATIVE_HANDOFF_TECHNICAL_DESIGN_v0.1.md`
- `AGENTS.md`, `CURRENT_STATE.md`, and `STARTERIA_V2_MANIFEST.md`

## 3. Files changed

- `front/prisma/schema.prisma`
- `front/prisma/migrations/20260928120000_add_portfolio_handoff_assignment/migration.sql`
- `backend/modules/portfolio-handoff/domain/portfolio-handoff-assignment.types.ts`
- `backend/modules/portfolio-handoff/application/portfolio-handoff-assignment.errors.ts`
- `backend/modules/portfolio-handoff/application/portfolio-handoff-assignment.service.ts`
- `backend/modules/portfolio-handoff/infrastructure/in-memory-portfolio-handoff-assignment.repository.ts`
- `backend/modules/portfolio-handoff/infrastructure/prisma-portfolio-handoff-assignment.repository.ts`
- `backend/modules/portfolio-handoff/index.ts`
- `backend/modules/portfolio-handoff/__tests__/portfolio-handoff-assignment.service.test.ts`

## 4. Schema/migration changes

Added bounded `PortfolioHandoffAssignment` and `PortfolioHandoffMember` tables, three bounded enums, references to existing `Challenge`, existing `Project` (the current canonical Initiative identity), and `User` where resolved. `userId` on a handoff member is nullable; `identityKey` and invited normalized email preserve an unresolved owner identity without creating a fake User.

No Project, Step, TeamMember, InitiativePortfolioMeta, or canonical Initiative schema was modified.

## 5. Persistence model

The assignment stores challenge reference, optional existing Project reference, target kind, scope, invited identity, state, creator, timestamps, and `version` defaulting to `1`. Member rows store identity, optional resolved user, role (`OWNER`, `EXECUTOR`, `OBSERVER`), and optional label/email. The only persisted creation state is `CREATED`.

## 6. Service/repository changes

`PortfolioHandoffAssignmentService` exposes the narrow boundary:

- `createHandoffAssignment(input)`
- `getHandoffAssignment(id)`

The Prisma repository performs only assignment/member persistence and reference reads. The in-memory repository supports deterministic unit tests. There is no generic CRUD surface and no lifecycle mutation command.

## 7. Team invariants

- exactly one explicit `OWNER` is required;
- zero or multiple owners fail;
- at most three non-observer members are allowed;
- observers do not count toward the execution cap;
- duplicate or blank identity keys fail after case-insensitive normalization;
- owner identity can remain unresolved (`userId = null`).

## 8. Target-kind invariants

- `EXISTING_INITIATIVE` requires an existing `Project` reference;
- `CHALLENGE` requires `initiativeId = null`;
- challenge and existing initiative references must exist;
- supplied organization scope is checked against both references when source data provides scope.

## 9. No-premature-Initiative protections

The H-TECH-02 service has no dependency on `ProjectService.createProject`, `TeamMember`, `Step`, Step 0 initialization, or `InitiativePortfolioMeta`. Assigned Challenge creation writes only the bounded handoff assignment and members, with `initiativeId = null`. Existing Project identity is referenced, never duplicated.

## 10. Tests added

The focused suite covers: existing-initiative reference requirements and preservation; challenge-only null initiative; missing references; scope mismatch; zero/multiple owner rejection; owner-only and owner-plus-one/two executor validity; fourth-executor rejection; observer exclusion; duplicate identity rejection; unresolved owner identity; deterministic `CREATED` state/version; read-back; and absence of Core creation paths in the service boundary.

## 11. Tests executed/results

- H-TECH-02 focused suite: **8 tests passed**.
- Relevant baseline suites (Project team, Project Step materialization, Challenge team, permissions, Step service): **53 tests passed** across 5 files.
- Backend TypeScript check: **passed**.
- Prisma schema validation with a local placeholder `DATABASE_URL`: **passed**.
- Prisma client generation: **blocked by Windows `EPERM` rename** of the existing query-engine file; no source failure was reported.

## 12. BR/AC traceability

Covered by implementation/tests:

| Checklist IDs | Evidence |
|---|---|
| BR-HO-001, BR-HO-004–007 / AC-HO-004–008 | target-kind/reference checks; no Project creation for Challenge |
| BR-HO-008–011 / AC-HO-009–012 | owner cardinality, execution maximum, observers, duplicate identity tests |
| BR-HO-012 / AC-HO-013 | nullable member `userId` plus explicit invited identity persistence |
| BR-HO-002–003 / AC-HO-001–003 | no lifecycle-after-creation commands, no Step/downstream behavior |

Accept/Reject, identity matching, delivery, Start, projection, and event criteria remain intentionally uncovered for later H-TECH slices.

## 13. Deviations from Technical Design

The Technical Design leaves exact Prisma names as implementation detail. This implementation uses `PortfolioHandoffAssignment` and `PortfolioHandoffMember`, stores unresolved identity in `identityKey`/email fields, and persists only `CREATED` for this slice. No other deviation was required.

## 14. Conflicts discovered

**RESOLVED**

ADR-005 is now formally marked `ACCEPTED ? ADR DESIGN ONLY` in the repository and is also listed as accepted in `ADR-INDEX.md`.

The authority mismatch observed during the initial H-TECH-02 implementation no longer exists.

There is no remaining authority conflict or ADR blocker for this slice.

## 15. ADR required?

**No new ADR required for this implementation.** ADR-005 already defines the bounded persistence decision in the requested authority set; its repository status is now aligned with the accepted authority state.

## 16. Next-slice dependencies

H-TECH-03/04 must add invitation identity claim/authentication and delivery/authority integration. Later slices own Accept/Reject, Handoff Shell/Overview, Start, projection/events, and downstream Initiative correlation. No H-TECH-03 behavior was added here.

## 17. Implementation status

**Implemented and locally verified within H-TECH-02 scope.** Safe to review after the Prisma client-generation environment lock is cleared.
