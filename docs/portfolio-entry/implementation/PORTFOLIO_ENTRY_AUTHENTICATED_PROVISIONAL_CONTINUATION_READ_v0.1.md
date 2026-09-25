# Portfolio Entry — Authenticated Provisional Continuation Read v0.1

**Estado:** IMPLEMENTED / VERIFIED  
**Scope:** authenticated read and minimal continuity UI  
**Authority:** Core v0.3, ADR-003, ADR-004, frozen Portfolio Entry candidate,
`PORTFOLIO_ENTRY_AUTHENTICATED_PROVISIONAL_HANDOFF_CONTRACT_v0.1`, and the
authenticated provisional claim implementation.

## Endpoint

```text
GET /api/v1/public/portfolio-entry/sessions/:sessionId/provisional-continuation
```

The endpoint uses the existing authenticated middleware and returns the
persisted provisional projection. The generic public session read remains
separate; this endpoint makes the authenticated continuation boundary explicit.

## Authorization

The request must have an authenticated user. The session must be active,
`ownershipState = CLAIMED`, and `ownerUserId` must equal the authenticated
`User.id`. Anonymous requests and other users are denied without a projection.

## Projection

The response reuses the existing session, handoff, confirmation, revision, and
provenance data. It returns the same safe
`AUTHENTICATED_PROVISIONAL_CONTINUATION` projection created by claim:

- session and handoff identity/version;
- revision and owner;
- understood need and desired outcome;
- known context and provenance-safe context;
- current open items, later work, organizational unknowns;
- continuation summary and selected gap where available;
- user confirmation remains represented by the existing confirmation object.

It does not return tokens, prompts, secrets, inferred roles, client permissions,
Project authority, Initiative authority, or Steps authority.

## Frontend route

```text
/public/provisional-continuation
```

After a successful authenticated claim, `AuthPage` navigates to this route. The
page reads the claimed session reference from existing browser storage and
fetches the authenticated read endpoint. It renders human language such as
“Esto es lo que entendimos”, useful context, unresolved items, and the next
preparation movement.

The “Revisar contexto” and “Continuar” actions are visibly deferred. They do
not fake persistence, create Portfolio membership, create Project/Initiative,
or enter Steps.

## No-repeat evidence

The UI displays the same session identifier returned by claim and calls the
read endpoint with that identifier. It explicitly tells the user that the
conversation is being resumed and does not render the initial intake form.

## Cognition and entity guards

The read path only loads the persisted session and turns. It does not invoke
the model adapter or handoff materializer. It does not call conversion,
`createProjectFromPublicDraft`, pilot claim conversion, ProjectService, or
Steps entry.

## Executable evidence

Backend router tests cover owner read, anonymous denial, cross-user denial,
same-session projection, zero adapter calls, and no canonical entity fields.
Frontend tests cover the human-readable heading, understood need, open item,
organizational unknown, later work, no-repeat copy, and absence of internal
terms.

## Remaining boundary

Correction and continuation actions remain deferred until a separately
authorized slice defines a safe authenticated correction command and the
minimum Portfolio context-establishment flow. Initiative invitation authority
and direct Initiative/Steps routing remain disabled.
