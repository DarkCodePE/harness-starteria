# Portfolio Entry — Authenticated Provisional Confirmation v0.1

**Estado:** IMPLEMENTED / VERIFIED IN-MEMORY ROUTER AND UI TESTS  
**Slice:** Authenticated provisional correction + confirmation  
**Authority:** Core v0.3, accepted ADR-003/ADR-004, authenticated provisional handoff contract v0.1, authenticated claim and continuation-read slices.

## Endpoint and command

The existing endpoint is reused:

```text
POST /api/v1/public/portfolio-entry/sessions/:sessionId/handoff/confirmation
```

The route now requires authentication. The command remains explicit:

- `action: confirm` confirms the user-owned interpretation;
- `action: correct` records an authenticated correction and returns the updated provisional continuation.

## Persistence

`PortfolioEntryConfirmation` is reused. No Prisma model, schema, or migration was added. The existing session revision and idempotency repositories are used.

The correction is stored in `correctedFields`; the response projection applies that correction without rewriting the frozen handoff or rerunning cognition.

## Allowed fields

The v0.1 command permits only:

- `understood_need` — text;
- `desired_outcome` — text;
- `known_context` — explicit list of `{ key, value }` user-owned context items.

`acceptedFields` is normalized to the same explicit names. Empty correction commands, unknown fields, and organizational fields are rejected. No unrestricted JSON patch is accepted.

## Ownership and revision

Every write requires:

- authenticated `User.id`;
- a claimed session;
- `ownerUserId === authenticated User.id`;
- the current `expectedRevision`;
- an `Idempotency-Key`.

Cross-user and anonymous writes are denied. A stale revision returns conflict. Repeating the same command with the same idempotency key returns the stored result without creating another confirmation.

## Provenance and authority protection

An accepted user-owned claim is represented in the returned projection with `review_disposition: USER_CONFIRMED`. A correction is represented as `USER_DECLARED` with the same user-confirmed review disposition and source path pointing to the confirmation command.

Organizational authority fields — including sponsor, management priority, organizational role, ownership, permissions, KPI/approval, organization/Portfolio membership, initiative/project/Steps and unresolved organizational context — are rejected. `ORGANIZATIONAL_UNKNOWN` remains unchanged and is never upgraded by confirmation.

Confirmation does not create authority, Portfolio membership, Project, Initiative, Steps, or any canonical entity.

## Cognition boundary

The command only validates, persists, and projects user-confirmable state. It does not instantiate or call the agent adapter or handoff materializer. The router test records the adapter call count before and after confirmation/correction and verifies no increase.

## Test evidence

- Backend router tests cover owner confirmation, owner correction, anonymous denial, cross-user denial, stale revision conflict, same-key idempotency, provenance projection, organizational-unknown preservation, authority-field rejection, and zero cognition/canonical entity fields.
- Existing NEG-01–NEG-04 claim guards remain passing.
- UI tests cover understood context, correction affordance, updated value after save, unresolved organizational unknown, absence of internal jargon, and no return to intake. The page renders `Está bien, continuar` and `Corregir` without exposing internal state names.

Verification commands:

```text
npm.cmd run typecheck:backend
npm.cmd run typecheck:front
npm.cmd run test:backend -- backend/modules/portfolio-entry/__tests__/portfolio-entry.router.test.ts backend/modules/portfolio-entry-sessions/__tests__/portfolio-entry-session.service.test.ts
npm.cmd run test:front -- src/app/pages/public/__tests__/AuthenticatedProvisionalContinuationPage.test.tsx
```

## Next boundary

The next slice is authenticated Portfolio context establishment. It must remain separate from this provisional confirmation and must define organization/Portfolio scope and authority before any canonical Portfolio or Initiative mutation.
