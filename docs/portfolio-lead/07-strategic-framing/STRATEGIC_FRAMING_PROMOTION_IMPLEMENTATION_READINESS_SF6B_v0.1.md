# Strategic Framing — SF-6B Implementation Readiness / Promotion Transaction Design v0.1

**Estado:** `GO_WITH_GAPS` — auditoría y diseño técnico; no implementa runtime.

**Slice:** SF-6B / KAN-21. **Parent:** KAN-19. **Functional gate:** KAN-20.

**Branch:** `design/KAN-21-sf6b-promotion-implementation-readiness`
**Base lineage:** `8b7ddd323b57c706c151ae28c77a024b1e8e276e` (ancestor check: PASS)

## Scope and authority

This document closes implementation readiness only. It does not modify Core, product
semantics, Prisma, migrations, routes, services, tests, UI, or lifecycle behavior.
SF-6A is treated as human-approved and frozen. The current factual Core remains v0.2.

The design preserves: explicit human promotion; `portfolio:write` plus effective
`portfolio_lead`; the current main scoped Portfolio authority; a canonical,
organization-scoped Strategic Front; a draft Challenge; one promotion per
`(stateId, challengeCandidateId)`; no automatic Front, Challenge, Invitation,
Initiative, Project, Step, publication, or activation.

## Verified current state

- `StrategicFramingProvisionalState` owns durable SF state, has nullable
  `organizationId`, optimistic `version`, nullable JSON `prioritizationState`, and a
  cascading `StrategicFramingProvisionalStateHistory` relation.
- Prioritization candidates are noncanonical JSON snapshots. Their identity is currently
  `sf5:<kind>:<DerivedFramingItem.id>` and their relevant fields are
  `candidateId`, `kind`, `statementSnapshot`, `sourceCandidateRef`, `sourceVersion`,
  `sourceRefs`, `provenance`, `confidence`, `uncertainty`, `humanDisposition`, and
  `humanDecision`.
- Existing SF mutations use interactive Prisma `$transaction`, write history first,
  then perform a version-conditioned update. A `P2002` on the history version is treated
  as stale.
- The current strategic-framing router gates writes only with
  `requirePermission('portfolio:write')`; it has no promotion command.
- `PortfolioService.createChallenge` checks that the Front exists and then calls
  `prisma.challenge.create`; it does not enforce domain role, organization scope,
  expected version, candidate eligibility, idempotency, or a shared transaction.
- `Challenge.strategicFrontId` is required, `Challenge.type` has Prisma default
  `crecimiento`, and `Challenge.status` defaults to `draft`. The promotion path must
  explicitly write both `type` and `status`.
- `ROLE_PERMISSIONS` gives both `admin` and `portfolio_lead` `portfolio:write`; effective
  roles are the union returned by `rolesForUser`. Therefore permission alone is
  insufficient for SF-6A.
- `User.organizationId` is documented as a denormalized convenience pointer. The current
  main authority additionally requires `OrganizationPortfolioAccessGrant` through
  `ScopedPortfolioAccessService`; membership alone is insufficient. Both
  `StrategicFront` and `StrategicFramingProvisionalState.organizationId` are nullable.
- The current SF branch does not contain that main authority primitive. SF-6C must first
  reconcile `backend/shared/authz/scoped-portfolio-access.service.ts`, its grant model,
  migration and authority document into the implementation base, or wait for the final
  integration branch. It must not create a second scope resolver.

## A. Exact `StrategicFramingPromotion` shape

The following is the SF-6C schema target. It is additive and is not being applied in
SF-6B:

```prisma
enum StrategicFramingPromotionStatus {
  completed
  requires_review
}

model StrategicFramingPromotion {
  id                         String                                  @id @default(cuid())
  stateId                    String
  challengeCandidateId       String
  sourceStateVersion         Int
  sourceCandidateIds         Json
  structuralRecommendationRef String?
  structuralRecommendationVersion String?
  strategicFrontId           String
  challengeId                String                                  @unique
  actorUserId                String
  actorSnapshot              Json
  promotedAt                 DateTime
  candidateSnapshot          Json
  confirmedChallengeSnapshot Json
  sourceRefs                 Json
  provenance                 Json
  status                     StrategicFramingPromotionStatus         @default(completed)
  createdAt                  DateTime                                @default(now())
  updatedAt                  DateTime                                @updatedAt

  // The SF state is owned by this bounded context. Restrict preserves the source
  // record and makes any future state deletion an explicit governed operation.
  state StrategicFramingProvisionalState @relation(fields: [stateId], references: [id], onDelete: Restrict)

  @@unique([stateId, challengeCandidateId])
  @@index([stateId])
  @@index([strategicFrontId])
  @@index([actorUserId])
  @@index([promotedAt])
  @@index([sourceStateVersion])
}
```

Field classification:

| Field | Classification | Type / rule |
|---|---|---|
| `id` | REQUIRED | `String @id @default(cuid())` |
| `stateId` | REQUIRED | `String`; SF state identity |
| `challengeCandidateId` | REQUIRED | `String`; human-confirmed noncanonical ChallengeCandidate identity |
| `sourceStateVersion` | REQUIRED | `Int`; version successfully promoted |
| `sourceCandidateIds` | REQUIRED | `Json` array; one or more SF-5 source candidate ids |
| `structuralRecommendationRef/version` | OPTIONAL | advisory structural decision reference when one was confirmed |
| `strategicFrontId` | REQUIRED | `String`; canonical validated Front |
| `challengeId` | REQUIRED | `String @unique`; canonical lineage |
| `actorUserId` | REQUIRED | `String`; server-authenticated actor |
| `actorSnapshot` | REQUIRED | `Json`; immutable actor identity snapshot for audit |
| `promotedAt` | REQUIRED | `DateTime`; successful promotion time |
| `candidateSnapshot` | REQUIRED | `Json`; immutable eligibility/evidence snapshot |
| `confirmedChallengeSnapshot` | REQUIRED | `Json`; exact confirmed write payload |
| `sourceRefs` | REQUIRED | `Json`; array/object preserving provenance refs |
| `provenance` | REQUIRED | `Json`; source and human-confirmation provenance |
| `status` | OPTIONAL | `completed` initially; `requires_review` only for a later material correction |
| `createdAt`, `updatedAt` | REQUIRED | standard audit timestamps |
| request idempotency key | REDUNDANT for the domain row | optional request-level control, not a replacement for domain identity |
| actor role / permission | DERIVED | authorize at command time; do not snapshot as authority |
| organizationId | DERIVED / reject | derive from trusted state, scoped authority and Front; never duplicate browser input |
| Challenge status, invitation, owner, sponsor, activation | REDUNDANT / reject | not SF-6B promotion data |

`candidateSnapshot` must include the confirmed ChallengeCandidate id, the sorted source
candidate ids, every source candidate snapshot, source refs, provenance, confidence and
human decision evidence. `confirmedChallengeSnapshot` must include the exact confirmed
`strategicFrontId`, title, statement, type, optional accepted Challenge fields, actor id,
source state version, structural recommendation reference/version when applicable, and a
stable payload fingerprint used for exact retry comparison. It must not contain browser
organization, inferred owner, or lifecycle side effects.

Only `stateId` has a relation FK. `strategicFrontId`, `challengeId` and `actorUserId` are
indexed audit scalars, intentionally retained with immutable snapshots but without FKs.
This preserves the existing canonical deletion semantics: `Challenge.strategicFront` keeps
`onDelete: Cascade`, and the exposed StrategicFront deletion path is not turned into a new
trace-enforced lifecycle gate. A Front deletion may therefore leave an audit trace with a
historical Front id/snapshot and a Challenge id/snapshot; that is preferable to silently
changing canonical behavior. Actor deletion likewise does not erase actor identity from
the trace. If a future requirement needs referential joins, it requires an explicit
decision; do not add Restrict FKs in SF-6C.

The state `Restrict` FK is safe because SF state is the owning bounded-context record and
there is no current state-deletion route. It protects the source of a promotion trace. If
state deletion becomes a requirement, the deletion policy must be decided explicitly
(retention/archive or trace detachment); it cannot be inferred from this slice.

The required uniques are exactly `@@unique([stateId, challengeCandidateId])` and
`challengeId @unique`. Indexes cover state, Front, actor, promotion time, and source state
version. There is no `candidateKind` index because grouped ChallengeCandidates may contain
both gaps and opportunities.

## B. History versus dedicated trace

`StrategicFramingProvisionalStateHistory` remains the versioned state-correction record.
SF-6C should add one history action such as `promotion_completed` only if the state
version itself changes as part of promotion; SF-6A does not require promotion to mutate
the state. It must not be used as the promotion identity because it lacks a unique
challenge lineage and a candidate-level idempotency key. `StrategicFramingPromotion` is
the dedicated, queryable, immutable-at-success trace.

Source candidates remain in `prioritizationState`; their dispositions remain unchanged.
A later material correction marks the promotion `requires_review` and creates an
alignment-review path; it never silently creates a second Challenge.

## C. Transaction boundary and race behavior

The boundary owner is a new Strategic Framing application command/service, not the HTTP
CRUD route and not the existing public Portfolio CRUD controller. It receives the
authenticated actor identity, effective roles, state id, ChallengeCandidate id, expected
version, Front id and confirmed payload.

Use an interactive Prisma `$transaction(async (tx) => ...)`, following the existing SF
mutation pattern. The array form is insufficient because the command has dependent
reads, retry comparison, conditional validation and a race recovery path.

Ordering:

1. Read an existing promotion by `(stateId, challengeCandidateId)` inside the transaction.
2. If it exists, compare the request's immutable identity and confirmed payload
   fingerprint. An exact match returns the existing Challenge and trace as a successful
   retry, even when the caller's `expectedVersion` is now stale. A changed payload,
   Front, type or candidate identity returns `PROMOTION_CONFLICT`.
3. If no promotion exists, read the current state and fail `STATE_NOT_FOUND` if absent.
4. Validate effective `portfolio_lead` role and `portfolio:write`.
5. Read the human-confirmed ChallengeCandidate from the current state's additive
   noncanonical candidate shape; never trust a browser recommendation snapshot. Validate
   `expectedVersion === state.version` and return `STALE_STATE` on mismatch.
6. Validate the candidate identity, non-empty source candidate set, current source
   candidate evidence, `address_now`, non-null human confirmation, and not-already-
   promoted status. A grouped candidate must not be reduced to a primary source id.
7. Call the reconciled `ScopedPortfolioAccessService.canUserAccessPortfolio({ userId:
   actor.id, organizationId: state.organizationId, capability: 'portfolio:write' })`.
   Require a non-null state organization and a non-null canonical Front with
   `front.organizationId === state.organizationId`. Browser `organizationId` is ignored.
8. Validate title, statement and explicit type (`correccion`, `crecimiento` or
   `exploracion`). Reject empty or unconfirmed values; never use the Prisma default.
9. Create the Challenge with explicit `strategicFrontId`, `title`, `description` equal
   to the confirmed statement, explicit `type`, and explicit `status: draft`. No other
   lifecycle write is performed.
10. Create `StrategicFramingPromotion` with the snapshots, refs, provenance and created
    Challenge id.
11. Commit and return the Challenge plus trace.

The database uniques are the final concurrency guard. If two transactions race, one
commits; the other catches `P2002`, re-reads the promotion and returns the result only if
the payload fingerprint is exact. If the losing transaction cannot find the row after
the collision, return `PROMOTION_CONFLICT` rather than retrying an unverified write.
The interactive transaction guarantees no committed Challenge exists without its trace;
failure of either create rolls back both.

`expectedVersion` refers only to `StrategicFramingProvisionalState.version`. The
recommendation's `inputStateVersion` is evidence and must match the current state when a
candidate decision was made, but it is not a second optimistic-concurrency token for the
promotion command. The server re-reads both state and candidate.

## D. Idempotency contract

- **Domain identity:** `(stateId, challengeCandidateId)`; mandatory and database-enforced.
- **Request idempotency key:** not required for SF-6C correctness. It may be accepted as
  an optional transport optimization, but it must not replace either unique constraint.
- **First success:** one `draft` Challenge and one `completed` trace; candidate retained.
- **Exact retry:** return the same Challenge/trace, with HTTP `200` and no new writes.
- **Changed-payload retry:** `409 PROMOTION_CONFLICT`; never update the Challenge silently.
- **Concurrent same candidate:** one commit; the other exact request returns the same
  result after unique-collision recovery.
- **Already promoted after a later state version:** exact original payload is a valid
  retry; any changed payload is `PROMOTION_CONFLICT`.
- **Stale expected version before promotion:** `409 STALE_STATE`; no Challenge or trace.

## E. Authorization and scope

The router may retain `authenticate` and `requirePermission('portfolio:write')` as a
coarse gate, but the promotion command must enforce all three layers:

```text
can(req.user.permissions, 'portfolio:write')
AND req.user.roles.includes('portfolio_lead')
AND ScopedPortfolioAccessService.canUserAccessPortfolio({
  userId: req.user.id,
  organizationId: state.organizationId,
  capability: 'portfolio:write'
})
```

Use `req.user.roles`, not scalar `req.user.role`; `rolesForUser` already preserves the
legacy-token fallback while `buildRequestUser` derives the effective permission union.
Expected negatives are admin-only → `PROMOTION_FORBIDDEN`, sponsor-only →
`PROMOTION_FORBIDDEN`, and admin + portfolio_lead → pass. The domain guard belongs in
the application service as an invariant, with a thin router adapter; a middleware-only
check would be bypassable by another caller.

The scoped resolver is the current main authority primitive. It verifies user existence,
`OrganizationMember`, and the matching `OrganizationPortfolioAccessGrant`; membership
alone is insufficient, and global role/permission alone is insufficient for target scope.
SF-6C must reconcile this exact service and authority into its base (or wait for the final
integration branch) before implementation. It must not duplicate or wrap it with a second
scope resolver. The state's `organizationId` is not a browser field; it is a server-created
SF boundary. For a safe first implementation:

- `state.organizationId == null` → block (`FRONT_SCOPE_MISMATCH` or a documented
  `PROMOTION_FORBIDDEN` detail), because scope cannot be proved;
- `StrategicFront.organizationId == null` → block;
- both non-null and unequal → `FRONT_SCOPE_MISMATCH`;
- both non-null and equal, with scoped `portfolio:write` authority → pass;
- provisional/unresolved parent context or Front-like label → block;
- `existing_portfolio` has no semantic exception: it follows the same scope rule.

This is conservative, does not invent personal-organization semantics, and avoids
authorizing a null-to-null match. Scoped authority reconciliation is an SF-6C integration
dependency, not permission to implement a second resolver.

## F. Promotion input and HTTP command

Proposed semantic command (not implemented in SF-6B):

```http
POST /api/v1/strategic-framing/states/:stateId/promotions
```

Request body:

```json
{
  "challengeCandidateId": "sfcandidate:01J...",
  "expectedVersion": 4,
  "strategicFrontId": "front-1",
  "title": "Título confirmado",
  "statement": "Problema u oportunidad confirmada",
  "type": "correccion",
  "objective": "optional",
  "whyNow": "optional",
  "successCriteria": "optional",
  "rationale": "optional"
}
```

Required: `challengeCandidateId`, `expectedVersion`, `strategicFrontId`, nonblank confirmed
`title`, nonblank confirmed `statement`, and explicit `type`. Optional fields are only
the existing Challenge fields `objective`, `whyNow`, `successCriteria` and a promotion
rationale; they remain human-provided and are stored in the confirmed snapshot.

Forbidden as client authority: `actorUserId`, `organizationId`, `sourceCandidateIds`, `sourceRefs`,
`provenance`, `status`, `openCallStatus`, visibility, activation/invitation/owner fields,
Challenge id, and any candidate snapshot. The server derives or validates all of them.

The statement maps to existing `Challenge.description`; it is not silently duplicated
into `objective` or `whatWeWantToMove`. If a future product decision requires a different
mapping, that is an ADR/product clarification, not an SF-6C inference.

Success response: HTTP `201` on first success and HTTP `200` on exact retry:

```json
{
  "promotion": { "id": "...", "stateId": "...", "challengeCandidateId": "...", "status": "completed" },
  "challenge": { "id": "...", "strategicFrontId": "...", "title": "...", "description": "...", "type": "correccion", "status": "draft" },
  "retry": false
}
```

## G. Error taxonomy

Use existing `AppError` status/code envelopes with these exact domain codes:

| Code | HTTP | Meaning |
|---|---:|---|
| `STATE_NOT_FOUND` | 404 | state id does not exist |
| `CANDIDATE_NOT_FOUND` | 404 | ChallengeCandidate is absent from current state |
| `STALE_STATE` | 409 | expected state version is not current |
| `PROMOTION_NOT_ELIGIBLE` | 409 | disposition, decision, evidence, kind or parent eligibility fails |
| `PROMOTION_ALREADY_EXISTS` | 409 | reserved for a non-retry duplicate when result cannot be safely compared |
| `FRONT_NOT_FOUND` | 404 | requested Front does not exist |
| `FRONT_SCOPE_MISMATCH` | 409 | null, mismatched or unprovable organization scope |
| `PROMOTION_FORBIDDEN` | 403 | missing `portfolio:write` or `portfolio_lead` |
| `INVALID_PROMOTION_PAYLOAD` | 400 | missing/blank/unconfirmed title, statement or type |
| `PROMOTION_CONFLICT` | 409 | changed retry, unique collision with differing payload, or lineage conflict |

## H. Reuse matrix

| Component | Current behavior | Target role | Classification | Change needed |
|---|---|---|---|---|
| `StrategicFramingProvisionalState` | Durable SF state, version and JSON prioritization | authoritative read source for state/ChallengeCandidate | ADAPT | add noncanonical human-confirmed candidate shape in SF-6C/SF-6D |
| `prioritizationState` | Noncanonical gap/opportunity snapshots and human dispositions | source evidence plus human-confirmed ChallengeCandidate input | ADAPT | preserve source candidates; add candidate wrapper without canonical entity |
| `StrategicFramingProvisionalStateHistory` | Versioned correction/prioritization snapshots | state history only | KEEP | optional promotion action if state version changes; never promotion identity |
| Strategic Framing router/controller | auth + read/write SF state routes; no promotion | thin HTTP adapter for semantic command | ADAPT | add route only in SF-6C; preserve service guard |
| auth middleware | effective permission union; `roles` available | coarse permission gate and actor context | ADAPT | add no generic role semantics; command checks role + permission |
| `PortfolioService.createChallenge` | checks Front then direct Challenge create | existing CRUD remains separate | DO_NOT_REUSE | extract no route orchestration; use transaction-aware promotion writer |
| `Challenge` Prisma model | required Front, default type/status, lifecycle fields | canonical draft target | KEEP | explicit type/status write; no nullable FK or lifecycle change |
| `StrategicFront` Prisma model | nullable organization id, challenges relation and existing delete cascade | canonical validated parent | ADAPT | require non-null matching org for promotion; no auto-create or trace FK |
| `AppError` conventions | factories with HTTP status and code | exact promotion error envelope | KEEP | use existing factories with listed codes |

The selected reuse strategy is `DO_NOT_REUSE` for the public `createChallenge` method.
SF-6C should use a small low-level transaction-aware writer or direct `tx.challenge.create`
inside the promotion service. This avoids a second transaction, keeps promotion-specific
validation together, and prevents future public CRUD changes from silently becoming
promotion behavior.

## I. Additive migration safety

Migration is additive only: create the new table, add the status enum, add the state FK
only, add the two unique constraints, and justified indexes. `strategicFrontId`,
`challengeId` and `actorUserId` remain audit scalars; no new FK may alter existing
deletion behavior. No existing row requires
backfill; there is no destructive update and no canonical data rewrite. Deploy the table
and constraints before enabling a promotion command in code. Then deploy the command and
tests. Existing state, Front and Challenge rows are untouched.

Rollback concern: dropping the table/enum after any promotion data exists would destroy
audit lineage. Operational rollback must first disable the command and preserve/export the
trace; do not provide an automatic destructive down migration. The sole state `Restrict`
FK may block future SF state deletion, which is intentional and must be documented. The
existing StrategicFront → Challenge cascade remains unchanged. No `db push`-style
data-loss override is acceptable.

## J. SF-6C test matrix

Required tests are:

- **Happy path:** gap and opportunity in `ADDRESS NOW` produce one draft Challenge and one
  trace; repeat for `public_entry`, `enterprise_direct`, and `existing_portfolio`.
- **Authority:** portfolio lead passes; admin-only fails; admin + portfolio lead passes;
  sponsor-only fails.
- **Scope:** matching non-null organization passes; mismatched org fails; missing Front
  fails; null state/front org fails; provisional/unresolved parent fails; browser org is
  ignored.
- **Candidate:** observe, discard, undecided, missing human confirmation, missing
  ChallengeCandidate, empty source set, stale version and already-promoted candidate fail.
- **Payload:** missing/blank title, statement or type fails; invalid type fails; Challenge
  type is always explicitly written and Prisma default is never relied on.
- **Idempotency/concurrency:** exact retry returns same result; changed payload conflicts;
  concurrent requests produce one Challenge and one trace; later stale exact retry returns
  the original result.
- **Atomicity:** trace failure rolls back Challenge; Challenge failure creates no trace;
  unique collision recovery never returns a mismatched payload.
- **Boundaries:** no Invitation, Project/Initiative, Step, publication, open-call
  activation, owner assignment or Initiative Core; candidate and `address_now` remain.

## K. Structural recommendation boundary

`KEEP_PROVISIONAL`, `LIGHTWEIGHT_CHALLENGE`, `ONE_CHALLENGE` and `MULTIPLE_CHALLENGES`
remain advisory structural outputs. They are not persisted as canonical promotion data.
The promotion input is one human-confirmed noncanonical ChallengeCandidate plus a selected
canonical Front and confirmed Challenge payload. `LIGHTWEIGHT_CHALLENGE` does not make
Challenge optional in Core.

For the conceptual case `Gap A + Gap B + Opportunity C → ONE_CHALLENGE`, SF must not pick
one source candidate as the identity. Human confirmation creates a stable
`challengeCandidateId` containing:

```json
{
  "challengeCandidateId": "sfcandidate:01J...",
  "sourceCandidateIds": ["sf5:gap:A", "sf5:gap:B", "sf5:opportunity:C"],
  "relatedWorkRefs": ["work-1"],
  "confirmedTitle": "...",
  "confirmedStatement": "...",
  "confirmedType": "correccion",
  "structuralRecommendationRef": "sf6a-structural-1",
  "structuralRecommendationVersion": "v1",
  "confirmedBy": "user-1",
  "confirmedAt": "..."
}
```

`sourceCandidateIds` are sorted provenance, not identity. The durable promotion identity is
`(stateId, challengeCandidateId)`. A single-source promotion is represented by the same
wrapper with one source id. Each candidate in `MULTIPLE_CHALLENGES` gets its own wrapper;
AI grouping, similarity and recommendation never create a split, merge or second Challenge
automatically.

The current SF-5 JSON shape does not safely represent this yet: its normalizer preserves
only the source candidate list and prioritization fields. SF-6C/SF-6D therefore need an
additive noncanonical `challengeCandidates[]` (or equivalently versioned
`promotionCandidates[]`) block inside the provisional state, with server-side validation
that every source id exists in the current source list. This is not a canonical domain
entity and does not change Core cardinality. Until that shape exists, SF-6C must not use
`stateId + SF-5 candidateId` as the promotion identity for grouped scenarios.

## L. STOP / ADR assessment

No SF-6A product stop condition is triggered by the scoped authority or candidate wrapper.
The trace deliberately has no Front/Challenge/User FKs, so it does not alter canonical
delete behavior. The state Restrict FK is bounded to SF-owned state retention.

SF-6C is blocked from implementation until it reconciles the current-main scoped
authority primitive and adds the provisional ChallengeCandidate shape. If preserving the
existing Front cascade and audit lineage is later deemed impossible without canonical
semantic change, stop and request an explicit ADR/decision; this document does not make
that change.

## Readiness decision

`GO_WITH_GAPS`: the transaction, model, scoped authorization, idempotency, payload,
migration and test design are implementable without reopening SF-6A. SF-6C remains
unimplemented and must first reconcile the main authority and additive
ChallengeCandidate state shape. None authorizes runtime work in this slice.

## SF-6B HUMAN REVIEW STATUS

SF-6B HUMAN REVIEW STATUS: GO_WITH_GAPS

SCOPED AUTHORITY:
- current main primitive: `ScopedPortfolioAccessService` backed by user existence, `OrganizationMember`, and `OrganizationPortfolioAccessGrant(userId, organizationId, capability)`
- membership alone sufficient: NO
- scoped write grant required: YES, `portfolio:write`
- SF-6C integration dependency: reconcile the current-main primitive, schema/migration and `PORTFOLIO_SCOPED_ACCESS_AUTHORITY_v0.1` into the implementation base or wait for the final integration branch; do not duplicate the resolver

TRACE DELETE SEMANTICS:
- state relation: FK `Restrict`; SF-owned state deletion is explicitly retained/protected
- Front relation: audit scalar, no FK; existing Front deletion behavior is preserved
- Challenge relation: audit scalar, no FK; existing Front → Challenge `Cascade` is preserved
- actor relation: audit scalar, no FK, plus immutable actor snapshot
- existing deletion behavior preserved: YES
- ADR/decision required: only if future retention/deletion policy or canonical FK lineage is changed

PROMOTION IDENTITY:
- SF-5 candidateId sufficient universally: NO
- human-confirmed ChallengeCandidate needed: YES, noncanonical provisional-state shape
- exact identity: `(stateId, challengeCandidateId)`
- source candidate representation: sorted `sourceCandidateIds[]` plus source snapshots, refs, related work refs and structural recommendation ref/version
- uniqueness: `@@unique([stateId, challengeCandidateId])` and `challengeId @unique`
- impact on SF-6C: reconcile scoped authority and implement/validate additive candidate wrapper before promotion runtime
- impact on SF-6D: UI/read model must support grouping, explicit human confirmation and stable candidate identity without selecting a primary source

FILES CHANGED:
docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_PROMOTION_IMPLEMENTATION_READINESS_SF6B_v0.1.md

git diff --check:
PASS

BLOCKING OPEN QUESTIONS:
- SF-6C must choose the integration base that contains `ScopedPortfolioAccessService` and its grant authority; blocking for SF-6C implementation, not for this document.
- SF-6C/SF-6D must add the noncanonical human-confirmed ChallengeCandidate shape before grouped promotion; blocking for grouped promotion, not a Core/ADR blocker.

READY TO COMMIT:
YES

READY FOR SF-6C:
NO
