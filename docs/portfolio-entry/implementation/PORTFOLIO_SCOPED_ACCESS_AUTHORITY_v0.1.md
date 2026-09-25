# Portfolio Entry — Scoped Portfolio Access Authority v0.1

**Estado:** IMPLEMENTED / DB-BACKED VERIFICATION VERIFIED
**Slice:** organization-scoped Portfolio authority primitive
**Scope:** authenticated Public Entry → Portfolio continuation authorization

## Previous authority gap

The previous model had `OrganizationMember`, but `portfolio_lead` and
`portfolio:read` / `portfolio:write` were platform-wide role-derived
capabilities. `PortfolioEntryPortfolioContinuation.portfolioScope` was a
persisted context snapshot, not an authorization grant. The continuation path
also added `portfolio_lead` to `User.roles`.

## Persisted grant model

The additive `OrganizationPortfolioAccessGrant` relation expresses:

```text
userId + organizationId + capability
```

The composite key is unique. `capability` is constrained to the two supported
Portfolio capabilities: `portfolio:read` and `portfolio:write`. Optional
`grantedByUserId` preserves issuer provenance without creating an issuer UI or
command in this slice.

No Portfolio, workspace, or other parallel business entity was introduced.

## Authorization semantics

`ScopedPortfolioAccessService.canUserAccessPortfolio({ userId, organizationId,
capability })` returns true only when all of the following server-owned facts
exist:

1. the user exists;
2. `OrganizationMember(userId, organizationId)` exists;
3. a matching `OrganizationPortfolioAccessGrant` exists for the same user,
   organization, and capability.

Platform roles, client-provided permissions, Entry profile, `rawEntry`, AI
output, and `portfolioScope` JSON are not consulted as authority.

`portfolio:write` does not imply `portfolio:read`; each capability is granted
explicitly.

## Continuation change

Portfolio continuation now resolves the selected organization from the
server-owned `User.organizationId` pointer and validates membership plus the
matching `portfolio:read` grant before creating the continuation record.
Continuation reads revalidate the persisted organization scope against the
same resolver.

The old automatic `User.roles += portfolio_lead` mutation was removed.
Registration, claim, confirmation, and continuation create zero scoped grants
and do not manufacture platform roles.

The persisted `portfolioScope` remains a context record. It is written only
after scoped authorization succeeds and never grants access by itself.

## Schema and migration

Added:

- `front/prisma/schema.prisma`
- `front/prisma/migrations/20260925100000_add_scoped_portfolio_access_grants/migration.sql`

The migration is additive. Existing `User`, `OrganizationMember`,
`PortfolioEntrySession`, `Project`, and `StrategicFront` structures are not
destructively modified.

## Grant issuer boundary

`GRANT_ISSUER_UI_OR_COMMAND = OUT_OF_SCOPE`

This slice provides persistence and resolution only. No Public Entry route can
create a grant, and no self-service grant endpoint was added. Test fixtures or
an already-authorized server/admin mechanism must create grants until a
separate grant-issuer decision and implementation slice exists.

## Final DB-backed evidence

- Prisma schema validation: PASS.
- Scoped resolver tests: 7/7 PASS, covering AUTH-SCOPE-01–07 and
  AUTH-SCOPE-13.
- PostgreSQL E2E reachable: PASS.
- Migration `20260925100000_add_scoped_portfolio_access_grants`: applied; database up to date.
- Scoped authority unit tests: 7/7 PASS.
- Portfolio Entry conversion integration: 10/10 PASS.
- `PortfolioEntryExperience`: 23/23 PASS.
- `portfolioEntryPublicService`: 7/7 PASS.
- Backend typecheck: PASS.
- Frontend typecheck: PASS.
- Database used: `postgresql://postgres:postgres@localhost:55433/starteria_e2e`.
- Database reachable: PASS. `prisma migrate status` reports the database is
  up to date with migration `20260925100000_add_scoped_portfolio_access_grants`.
- `OrganizationPortfolioAccessGrant` exists in the Prisma schema and the
  generated Prisma Client was refreshed with `npm run db:generate`.
- AUTH-SCOPE-01–07 and AUTH-SCOPE-13: PASS (7 focused resolver tests).
- AUTH-SCOPE-08: PASS. In `backend/modules/portfolio-entry-conversion/__tests__/portfolio-entry-conversion.integration.test.ts`, the fixture records `grantsBeforeClaim` and asserts the `OrganizationPortfolioAccessGrant` count is unchanged after `claimOwnership`.
- AUTH-SCOPE-09: PASS. The same fixture asserts the count remains equal to `grantsBeforeClaim` after `saveConfirmation`.
- AUTH-SCOPE-10: PASS. The authorized continuation test records `grantsBeforeContinuation` and asserts the count is unchanged; authorization uses a pre-existing `portfolio:read` grant.
- AUTH-SCOPE-11: PASS. The unauthorized and authorized continuation paths both persist and assert the unchanged `User.role`/`User.roles` rows; no continuation adds `portfolio_lead`.
- AUTH-SCOPE-12: PASS. Existing manually assigned platform roles remain unchanged; the DB-backed assertions preserve `participante` and `portfolio_lead` role rows.
- The DB-backed fixture verifies grant counts before and after claim,
  confirmation, unauthorized continuation, and authorized continuation.
  Counts are unchanged in each operation unless the fixture deliberately
  inserts the pre-existing authority grant.
- The Prisma-backed fixture requires organization membership plus a
  pre-existing read grant for valid continuation, denies membership-only
  continuation, preserves the no-Project/no-Steps boundary, and verifies
  persisted continuation and user role rows.
- Cross-organization isolation, membership-without-grant denial, grant-
  without-membership denial, global `portfolio_lead` insufficiency, and
  global `portfolio:read` insufficiency are covered by AUTH-SCOPE-01–07.
- AUTH-SCOPE-13 confirms no model or LLM calls.
- Backend typecheck: PASS.
- Frontend typecheck: PASS.
- `git diff --check`: PASS.

## Requirement closure

```text
AUTH-SCOPE-08: PASS
AUTH-SCOPE-09: PASS
AUTH-SCOPE-10: PASS
AUTH-SCOPE-11: PASS
AUTH-SCOPE-12: PASS
DB-backed integration: PASS (PostgreSQL E2E; Portfolio Entry conversion 10/10)
Existing roles preserved: PASS
Automatic portfolio_lead escalation: PASS — absent
Scoped grant creation from Public Entry: PASS — zero grants from claim, confirmation, and continuation
Backend typecheck: PASS
Frontend typecheck: PASS
git diff --check: PASS
Tests added in final evidence step: NO
Ready to commit: YES
Ready to rerun Portfolio Context Establishment: YES
```

## Readiness

The missing scoped authority primitive is represented, enforced, and verified
against real PostgreSQL persistence. No Project, Initiative, or Step was
created by this verification, and no LLM call occurred. Authenticated
Portfolio Context Establishment v0.1 is ready to be rerun; it remains a
separate next slice and is not started here.
