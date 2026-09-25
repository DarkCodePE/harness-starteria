# Portfolio Entry — Authenticated Provisional Claim v0.1

**Estado:** IMPLEMENTED / VERIFIED IN-MEMORY ROUTER TESTS  
**Scope:** first productive integration slice  
**Authority:** Core v0.3, accepted ADR-003, accepted ADR-004, frozen Portfolio Entry candidate, `PORTFOLIO_ENTRY_AUTHENTICATED_PROVISIONAL_HANDOFF_CONTRACT_v0.1`

## Result

The existing authenticated claim endpoint is the productive transition:

```text
POST /api/v1/public/portfolio-entry/sessions/:sessionId/claim
```

It claims the existing Public Entry session and returns an
`AUTHENTICATED_PROVISIONAL_CONTINUATION` projection. It does not convert the
session to Portfolio membership and does not enter Project, Initiative, or
Steps.

## Persistence reused

No schema, Prisma model, migration, or parallel persistence was added. The
slice reuses:

- `PortfolioEntrySession.id`
- `publicAccessTokenHash`
- `ownerUserId`
- `ownershipState`
- `revision` and the existing expected-revision CAS
- existing `PortfolioEntryHandoff` and `PortfolioEntryConfirmation` records
- existing claim idempotency/recovery records

## Claim and ownership rules

- First claim requires an authenticated `User.id`, a valid active Public Entry
  token, and an exact `expectedRevision`.
- The existing CAS changes `ownerUserId` and `ownershipState` to `CLAIMED` and
  increments the revision.
- A same-user retry returns the already claimed provisional projection without
  another CAS or entity creation.
- A different user receives owner denial and no provisional context.
- Authentication does not confirm, correct, canonicalize, or re-run cognition.

## Projection

The claim response adds `provisionalContinuation` with:

- session and handoff identity/version;
- current revision and authenticated owner;
- `PROVISIONAL_ONLY` Portfolio access and organizational scope unknown;
- raw public context, understanding, desired outcome, known context,
  provenance, open items, later work, organizational unknowns, continuation
  summary, selected gap, and decision metadata;
- explicit `conversionEligible: false` and
  `initiativeProfileSelected: false`.

No prompts, auth tokens, inferred roles, tenant authority, or Project/
Initiative/Steps authority are projected.

## Legacy isolation

The claim path does not call `createProjectFromPublicDraft`, pilot claim
conversion, `ProjectService.createProject`, Steps entry, or
`/continuar-piloto`. It does not call the separate Portfolio continuation
service, which requires canonical access and creates a conversion record.

## Executable evidence

The router test suite verifies:

- `CLAIM-01`: anonymous active session plus authenticated owner succeeds;
- `CLAIM-02`: same-user retry returns the same session/revision/projection;
- `CLAIM-03`: different-user retry is denied;
- `CLAIM-04`: stale revision conflicts without changing ownership;
- `CLAIM-05`: handoff/context/provenance are preserved;
- `CLAIM-06`: open and organizational unknowns are preserved;
- `CLAIM-07`: adapter call count does not change during claim;
- `CLAIM-08`: no canonical entity fields are produced;
- `NEG-01`: provenance/confirmation semantics remain unchanged;
- `NEG-02`: no Project is created;
- `NEG-03`: no Initiative is created;
- `NEG-04`: no Steps state or entry is created.

Verification command:

```text
npm run typecheck:backend
npm run test:backend -- backend/modules/portfolio-entry/__tests__/portfolio-entry.router.test.ts
```

## Known follow-ups

- Add production integration coverage against the Prisma repository and the
  real authentication middleware before broad rollout.
- Add an explicit authenticated provisional continuation read endpoint/UI in a
  subsequent slice if needed; this slice only exposes the claim response.
- Initiative invitation authority remains governed by ADR-004 and is not
  enabled by this claim.
