# PORTFOLIO ENTRY — SERVER-OWNED CONTEXT AND INVITATION AUDIT v0.1

**Fecha:** 2026-09-25  
**Estado:** AUDIT ONLY — CONTRACT CLARIFICATION ONLY  
**Slice:** Portfolio Entry / Server-owned business context / invitation routing  
**Repositorio:** `DarkCodePE/harness-starteria`  

## 0. Repository guard

```text
root:   C:/Users/User/proyect-starteria/harness-starteria-clean
origin: https://github.com/DarkCodePE/harness-starteria.git
branch: feat/portfolio-entry-decision-readiness-harness
status: clean before this audit; this document is the only intended change
```

The requested canonical root and remote match. `Dashboardstarteria` was not
used as an authority. No backend, frontend, database, schema, route,
permission, invitation, runtime, harness, or E2E implementation was changed.

## 1. Authority and method

The audit read `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, the authority
map, Core Contract, relevant product ADRs, the Portfolio Entry continuation
and handoff audits, the security/auth documents, the Prisma schema, active
backend services/routers, and related tests. The Core Contract remains
candidate / requires re-test; ADR-003 remains proposed. Therefore findings
below are evidence of the current checkout, not approval of productive
behavior.

Primary evidence:

- `CURRENT_STATE.md`
- `STARTERIA_V2_MANIFEST.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`
- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`
- `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONTINUATION_OWNERSHIP_PROFILE_AUDIT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md`
- `front/prisma/schema.prisma`
- `backend/modules/auth/auth.service.ts`
- `backend/modules/auth/auth.middleware.ts`
- `backend/shared/authz/permissions.ts`
- `backend/modules/portfolio/portfolio.service.ts`
- `backend/modules/portfolio/portfolio.router.ts`
- `backend/modules/portfolio-entry-continuation/portfolio-entry-continuation.service.ts`
- `backend/modules/portfolio-entry-conversion/portfolio-entry-conversion.service.ts`
- `backend/modules/pilot-leads/pilot-claim.service.ts`
- `backend/modules/pilot-leads/pilot-lead.router.ts`

## 2. Identity, context, role, job, and authority separation

| Dimension | Current repository representation | Server-owned | User-editable | AI-inferred | Safe routing authority | Status |
|---|---|---:|---:|---:|---:|---|
| `USER_IDENTITY` | `User.id`, email, password/Google identity; access token `sub` | YES | NO | NO | YES, for ownership and authentication only | Current |
| Organization membership | `OrganizationMember(userId, organizationId, role)`; `User.organizationId` is explicitly a denormalized convenience pointer | YES when persisted | Not through the audited public entry | NO | YES only when queried and checked for the target organization | Current but partially integrated |
| Tenant / organization | `Organization`; some domain entities also carry `organizationId` | YES | NO through public entry | NO | YES for scoped access | Current; not consistently joined to Portfolio routes |
| Platform role/profile | `User.role`, `User.roles`; permissions derived server-side by `permissionsForRoles` | YES in storage / token issuance | Registration may self-select only `participante`; privileged roles require admin path | NO | YES for platform capability, not sufficient for contextual business destination | Current, mixed migration |
| Project / Initiative role | `TeamMember.role` (`OWNER`, `EDITOR`, `VIEWER`) and project membership | YES | NO directly | NO | YES for a specific Project | Current |
| Portfolio Entry profile | `PortfolioEntrySession.continuationProfile` enum: `PORTFOLIO_LEAD_ENTRY` or `INITIATIVE_ENTRY` | Persisted, but not established as canonical business authorization | User-confirmable workflow state may affect it | Agent/runtime can propose profile in session data | NO by itself; not equivalent to access or role | Candidate / pre-canonical |
| Portfolio Lead | `User.roles` may contain `portfolio_lead`; `portfolio:read/write` derived from that role | YES | NO through ordinary registration | NO | YES for platform Portfolio capability; organization/context scope still requires checking | Current role model, not a complete contextual profile |
| Initiative Owner | `Project.ownerId`, active `TeamMember(OWNER)`, and `InitiativeGovernance` owner/lead fields | YES | Not by conversational self-assertion | NO | YES only for the identified Project/Initiative | Current, Project-based |
| Sponsor | `User` platform role plus `SponsorCheckpoint.sponsorId`, `Challenge.sponsorId`, and legacy string fields | YES when assigned to a resource | Not safely self-selected as authority | NO | Only for assigned sponsor/checkpoint responsibilities | Current but multi-model / ambiguous |
| Current job | No single canonical server-owned `CURRENT_JOB` entity for Public Entry routing; jobs are represented indirectly by permissions, project/team membership, governance, or invitation fields | NO as a unified fact | User may describe it | AI may extract/suggest it | NO | Authority gap |
| Invitation / handoff authority | `ChallengeInvitation` schema fields and Portfolio Entry handoff/confirmation records; active invitation service wiring is incomplete | Partly | Recipient can accept/decline only where flow exists | NO | YES only after target, recipient, validity, acceptance, and permission checks | Partial / conflicted |

Important distinction: the repository explicitly says `User.roles` is the
authorization source and that role permissions are the union. It also has a
primary `role` for compatibility. Neither is proof that a user is the owner
of a particular Initiative, Challenge, Strategic Front, or organization.

## 3. Server-owned continuation facts

The following are safe candidates for future routing **when read from the
server and scoped to the target**:

- authenticated `userId` from the verified token;
- membership in the target `Organization`, including the membership role;
- effective server-derived permission, preferably capability-based;
- a canonical existing Project/Initiative id;
- `Project.ownerId` or active Project `TeamMember` membership;
- canonical Initiative/Project governance assignment;
- invitation id, target type, target entity, intended recipient, assigned
  role, issuer, status, expiration/revocation, and acceptance record;
- a versioned handoff id/payload whose server-side session belongs to the
  authenticated user;
- explicit idempotent confirmation/acceptance records;
- the handoff/contract version, provided it is validated by the server.

The following are **not** routing authority:

- conversational language, apparent expertise, or an AI-extracted role;
- public-entry wording or `rawEntry`;
- registration itself;
- the primary JWT role alone for contextual destination;
- a Sponsor label without resource assignment;
- a Challenge/Strategic Front string field such as `challengeOwner` or
  `StrategicFront.sponsor`;
- a legacy pilot code alone, except for the explicitly compatibility-bound
  claim flow.

## 4. Business profile audit

### 4.1 Profiles found

`PORTFOLIO_LEAD_ENTRY` and `INITIATIVE_ENTRY` are canonical enum values in
the pre-canonical `PortfolioEntrySession` persistence boundary. They describe
an Entry continuation profile, not an organization membership or permission.
The session is owned by `ownerUserId` after claim and is protected by
`ownershipState`, lifecycle, revision, handoff, and confirmation records.

`portfolio_lead` is a real platform role added by ADR-028 and carried in
`User.roles`; its permissions are `portfolio:read` and `portfolio:write`.
The model supports a user holding `participante` and `portfolio_lead`
simultaneously. This supports non-global-persona behavior at the authorization
level, but there is no complete per-organization Portfolio Lead assignment
model in the audited continuation path.

`Project.ownerId`, active `TeamMember(OWNER)`, and `InitiativeGovernance`
provide server-owned Initiative ownership/governance for an existing Project.
They are contextual and therefore safer than a global role.

Sponsor exists in several forms: platform `Role.sponsor`, project-scoped
`SponsorCheckpoint.sponsorId`, `Challenge.sponsorId`, and legacy string fields
on Strategic Front / Initiative metadata. These are not one canonical Sponsor
authority model.

### 4.2 Profile field treatment

| Field / concept | Created or set by | Self-selectable | Server validated | Scoped | Safe to route? |
|---|---|---:|---:|---:|---:|
| `PortfolioEntrySession.continuationProfile` | Entry/session runtime persistence | Not a trusted self-assertion | Session lifecycle validates ownership/transition, but not full business authorization | Session | Only as provisional context |
| `User.role` / `User.roles` | Registration/admin/auth service | Registration only permits `participante`; other roles are admin-controlled | YES for role enum and permission derivation | Platform/user, not target resource | Platform permission only |
| `OrganizationMember.role` | Organization membership flow / persistence | Not shown as public-entry self-selection | Membership table is server-owned; full issuer workflow not found | Organization | YES after target-org lookup |
| `Project.ownerId` / `TeamMember.role` | Project creation/team service | No | YES by persistence and project access guards | Project | YES for that Project |
| `InitiativeGovernance.portfolioLeadUserId` | Governance persistence/service | No | Partial | Initiative | YES for governance, not public entry alone |
| `ChallengeInvitation.role` | Invitation record | No | Schema supports it; active service currently does not populate it | Challenge / optional Project | Only if full invitation lifecycle is live |
| `ChallengeInvitation.ownerCanInvite` | Invitation record | No | Schema supports it; active issuer guard not found | Invitation / challenge | Not currently sufficient |
| `Challenge.challengeOwner` | Challenge service input / string field | Effectively writable as text by authorized Portfolio write path | No identity relation or recipient binding | Challenge | NO |
| `StrategicFront.ownerId` / `sponsor` | Strategic Front service input | Not trusted | `ownerId` is scalar; `sponsor` is a string | Strategic Front | `ownerId` only after authorization; `sponsor` NO |

Conclusion: the repository has server-owned building blocks but no single
complete, canonical, contextual business-profile model that can safely answer
all post-authentication continuation decisions.

## 5. Unknown-role invariant

**Target invariant:** authenticated identity exists, but authoritative business
context does not.

**Result: `SUPPORTED` as a product target, `NEEDS_REFINEMENT` for productive
implementation.**

Supported by ADR-003, the continuation ownership/profile audit, and the
Portfolio Entry continuation service boundary:

- retain the claimed session/provisional Public Entry context;
- do not infer or assign a business role from language;
- do not create Project or enter Steps merely because authentication exists;
- continue toward Portfolio-oriented context confirmation.

The implementation needs refinement because the current global permission
model does not define the minimum Portfolio context/membership for an
authenticated user with no Portfolio role, and the candidate Entry profile is
not itself an access grant. The current conversion service is a separate path
that explicitly creates a Project after confirmed conversion; it cannot be
treated as proof that unknown-role continuation is already implemented.

## 6. Invitation audit

### 6.1 Portfolio / Initiative invitation model

`ChallengeInvitation` has a relatively complete candidate schema:

- issuer: `inviterUserId` nullable;
- recipient: `recipientEmail`, normalized email, optional `claimedByUserId`;
- target: `targetType` (`challenge_only` or `existing_initiative`) and
  `existingProjectId`;
- assigned role: `TeamRole`, default `OWNER`;
- organization: no direct `organizationId` on the invitation; organization is
  only indirectly reachable through other entities where present;
- permission/issuer policy: `ownerCanInvite` exists as a boolean field;
- lifecycle: created, sent, viewed, accepted, declined, revoked, expired;
- validity: `expiresAt`, timestamps, revocation/acceptance fields;
- idempotency: no explicit invitation idempotency key or unique recipient/target
  constraint is present in the schema;
- payload/version: no dedicated invitation handoff version/payload field;
- post-accept route: no active canonical accept/continue controller was found.

The active `PortfolioService.addInvitation` currently creates only
`challengeId` and legacy `value`. `updateInvitation` updates only legacy
`status`. The Portfolio router protects create/update with authenticated
`portfolio:write`, but it does not prove the caller owns the specific
Challenge/Strategic Front or is the Initiative Owner. Therefore this is a
schema candidate, not a complete live invitation contract.

### 6.2 Project team invitations

`TeamMember` is the project-scoped membership/role mechanism. The repository
contains a project team invite route in legacy documentation and team service
patterns, but no single audited invitation lifecycle tying it to the new
Portfolio → Initiative handoff. It is compatible infrastructure for existing
Project access, not proof of a canonical Public Entry route.

### 6.3 Pilot claim

The pilot flow is materially different:

1. anonymous `POST /api/v1/public/pilot-leads/:pilotCode/claim` mints a
   short-lived hashed `PilotClaimToken`;
2. authenticated `POST /api/v1/public/pilot-leads/consume-claim` binds the
   claim to the authenticated user and calls `ProjectService.createProject`;
3. proposal data may be mapped to Step 0;
4. `PilotClaimToken.consumedAt` and `createdProjectId` provide single-use and
   idempotent reuse; `expiresAt` provides expiry.

This proves a legacy/compatibility transition from pilot lead to Project, not
an Initiative invitation or Portfolio-first handoff.

### 6.4 Handoff records

Portfolio Entry has server-side session ownership, handoff, confirmation,
revision, idempotency, and conversion/continuation records. The continuation
service checks authenticated ownership and Portfolio permission. The conversion
service checks claimed ownership, confirmed lifecycle, session revision,
idempotency, and user identity before creating Project/Step 0. These are
stronger than conversational claims, but the candidate handoff contract does
not yet establish Initiative invitation authority.

## 7. Initiative continuation authority

Candidate invariant:

1. canonical Initiative exists;
2. authenticated user is eligible for it;
3. explicit role/handoff exists;
4. invitation/handoff is valid;
5. acceptance/confirmation exists where required;
6. server permissions authorize continuation.

**Result: `NEEDS_REFINEMENT` overall; no direct Initiative/Steps route is
authorized by this audit.**

The invariant is supported as a required negative boundary by ADR-003 and the
Portfolio → Initiative handoff audit. Existing Project ownership and team
membership support conditions 1, 2, 3, and 6 for already materialized
Projects. The candidate `ChallengeInvitation` schema supports much of 3–5.
However, the active invitation service does not populate or enforce the rich
fields, no canonical accept/start route was found, and legacy challenge-linked
creation can materialize Project, OWNER, and Step state too early. Therefore:

```text
If any required condition is absent:
    do not route directly to Initiative / Steps.
```

## 8. Initiative invitation issuer

**Resolved: NO. Classification: `AUTHORITY_GAP`.**

Evidence establishes that Portfolio writes are gated by `portfolio:write`,
which is currently derived from `portfolio_lead` and `admin`. It does not
establish a canonical, resource-scoped issuer rule for an Initiative
invitation. The candidate schema contains `inviterUserId` and
`ownerCanInvite`, but the active service ignores them. Existing handoff
documentation says Portfolio Lead decides `owner_can_invite`, while the
implementation audit does not show a live accepted contract for whether the
issuer can be Portfolio Lead, Initiative Owner, Sponsor, organization admin,
or a system transition.

An additional authority decision is required before productive invitation
routing. Do not infer issuer authority from role names or existing write
permission.

## 9. Sponsor boundary

| Responsibility | Repository evidence | Result |
|---|---|---|
| Invite an Initiative | No canonical sponsor-scoped issuer check; Sponsor is not included in `portfolio:write` by role mapping | NO authority established |
| Approve | `sponsor:decide` exists for Sponsor checkpoint responses; sponsor checkpoint is project-scoped | YES only for assigned checkpoint semantics, not universal approval |
| Be notified | Sponsor metadata/touchpoint fields and executive output concepts exist; no single audited notification contract | Possible contextual notification, not authority |
| Own Portfolio continuation | No evidence; Portfolio continuation uses authenticated user plus Portfolio permission | NO |
| Be destination of Public Entry | ADR-003/ownership audit explicitly reject Sponsor as automatic destination | FORBIDDEN as default |

Sponsor is a contextual executive stakeholder/checkpoint actor, not a
universal routing authority.

## 10. Challenge Owner and Strategic Front Owner

| Label | Classification | Evidence |
|---|---|---|
| Challenge Owner | `AMBIGUOUS` (not a canonical role) | `Challenge.challengeOwner` is a nullable string and `challengeOwnerStatus` is a stakeholder status; no User relation or permission binding. `Challenge.ownerId` exists as a scalar but is not an established role/issuer contract. |
| Strategic Front Owner | `AMBIGUOUS` (not a canonical role) | `StrategicFront.ownerId` is a nullable scalar, but no relation/assignment workflow or route authority contract was found. `StrategicFront.sponsor` is a string and is not ownership authority. |

Neither should be added or treated as a new role in this slice. A future
decision must choose whether these are resource-scoped canonical assignments,
derived responsibilities, or documentation-only labels.

## 11. Minimum Portfolio continuation permission

**Result: `D — current architecture does not yet define this safely`.**

Evidence for options A–C is incomplete:

- organization membership exists, but Portfolio routes are authenticated and
  their read surface is not consistently gated by `portfolio:read`;
- Portfolio write permission is role-derived, not a demonstrated per-org
  Portfolio membership/access grant;
- the continuation service calls its scope a
  `platform_portfolio_permission` and checks `portfolio:read`, but there is no
  approved rule stating that this is the minimum for an unknown-role user or
  how organization scope is selected;
- a provisional Entry context is persisted, but it is not an access grant.

Therefore no production route should assume that organization membership,
`portfolio_lead`, or provisional context alone is the minimum without a
separate authority decision.

## 12. Legacy consumers and route trace

| Consumer / route | Caller | Server-owned context | Actor assumption | Destination | Classification | Migration risk |
|---|---|---|---|---|---|---|
| `/auth/continue/:draftId` | Historical public-draft landing/auth flow documented in ADR-015; no active backend route found in current `app.ts` | Historical draft id; current active implementation not verified | Authenticated user treated as draft owner | Historical pilot/project continuation | Deprecated target / unresolved live consumer | High: caller retirement not proven |
| `/public/continuar` | Pilot confirmation notifier links; frontend/public landing consumer referenced by tests/docs | Pilot code/lead token, then authenticated user | Pilot claimant | Resume pilot flow | Compatibility / legacy | Medium-high: still referenced by notifier/tests |
| `/continuar-piloto` | Named in current-state/legacy documentation; no current backend route found | Pilot/public draft context if any | Pilot claimant | Project + Step 0 in legacy flow | Deprecated target / unresolved route | High if external links remain |
| Pilot claim issue | `POST /api/v1/public/pilot-leads/:pilotCode/claim` | Server-hashed `PilotClaimToken`, lead, expiry | Anonymous claimant before auth | Claim token | Compatibility | Medium |
| Pilot claim consume | `POST /api/v1/public/pilot-leads/consume-claim` | Authenticated user, unexpired token, lead, idempotent created Project | Authenticated claimant becomes Project owner | Project, optionally Step 0 | Compatibility-only; direct Product Entry → Project is deprecated target | High semantic conflict |
| `ProjectService.createProject` | Pilot claim, initial review route, other project routes | Authenticated user id and project input | Caller is owner | Project + Step structures | Active legacy infrastructure; not Public Entry authority | High if reused for new routing |
| Portfolio Entry continuation | Authenticated controller/service | Claimed session owner, confirmed handoff, revision, permission | Session owner | Portfolio-oriented continuation | Candidate V2 / pre-canonical | Medium; profile/access authority unresolved |
| Portfolio Entry conversion | Authenticated conversion route | Claimed session, confirmation, revision, idempotency, user id | User confirms conversion | Project + Step 0 | Candidate/experimental; not default continuation | High if used as generic routing |
| Invitation recipient route | No canonical active recipient/accept route found | Candidate schema can hold recipient/claim/target | Recipient acceptance not wired as a full contract | Unresolved; handoff audit target is Initiative Overview then Start | Unresolved / not implemented | High |
| Initiative handoff route | Existing Project/Initiative Overview and legacy challenge-link creation | Project/team/meta after materialization | Authenticated Project owner/member | Initiative Overview / Steps | Compatibility / target requires adaptation | High: Accept and Start are collapsed in legacy path |

No live active consumer of `/auth/continue/:draftId` or
`/continuar-piloto` was proven in the current backend router. Because
historical frontend/notifier/docs references remain, retirement cannot be
declared; they remain `UNRESOLVED` or `DEPRECATED_TARGET` until repository-wide
consumer evidence is complete.

## 13. Routing authority matrix

| Continuation case | Server-owned evidence required | Role/context | Invitation? | Permission? | Default destination | Fallback | Forbidden | Legacy compatibility |
|---|---|---|---:|---:|---|---|---|---|
| New Public Entry | Entry session + provisional session state; no business canonicalization | Provisional only | No | No Product permission yet | Public Entry clarification/handoff | Remain in session | Project, Initiative, Steps, Sponsor | None |
| Returning Public Entry | Session ownership/claim, valid lifecycle, revision, authenticated `userId` | Same user/session | No | Session endpoint auth; destination depends on confirmed context | Restore Public Entry then Portfolio-oriented confirmation | Re-auth/reclaim safely | Direct Initiative/Steps without evidence | Historical draft routes not authority |
| Existing Portfolio member | Org/Portfolio membership or server-granted Portfolio capability, target scope | Portfolio context | No | `portfolio:read` / relevant scoped permission | Portfolio Home / Portfolio context | Context confirmation | Steps absent Initiative authority | None |
| Explicit Initiative invitee | Existing canonical Initiative/Project, intended recipient match, valid non-expired/non-revoked invitation, accepted state, role/team membership, permission | Initiative role / handoff | YES | Project/Initiative access | Initiative Overview; Steps only after Start gate | Portfolio/context confirmation | Direct Steps before Start | Candidate only; not live canonical |
| Existing Initiative Owner | `Project.ownerId` or active OWNER membership plus Project existence and permission | Initiative Owner for that Project | Not necessarily | Project access / transition permission | Initiative Overview or authorized next state | Portfolio review if ownership absent | Any unrelated Initiative | Existing Project routes are compatibility/current |
| Sponsor | Assigned SponsorCheckpoint or explicit resource assignment | Sponsor only for assigned checkpoint/context | Not by role alone | `sponsor:decide` only for allowed checkpoint action | Assigned review/checkpoint surface | Portfolio/initiative context | Sponsor as default Public Entry destination or universal inviter | Existing sponsor routes are scoped |
| Unknown authenticated role | Authenticated `userId`, no authoritative business context | Unknown; do not invent | No | Existing session auth; Portfolio minimum is unresolved | Portfolio-oriented confirmation/context establishment | Preserve provisional Entry session | Project creation, Steps, Initiative direct, Sponsor | None |
| Legacy pilot claimant | Valid server PilotClaimToken, unexpired, unconsumed/idempotent, authenticated user | Pilot claimant; compatibility actor | Claim token, not Initiative invitation | Authenticated consume route | Compatibility Project creation | Re-enter public pilot flow | Treat as canonical Portfolio/Initiative handoff | KEEP_COMPAT until replacement/retirement evidence |

The matrix is complete for the requested cases, but the underlying
Portfolio-access and invitation-issuer decisions remain unresolved.

## 14. Handoff Contract implications

This is a field classification, not a full schema.

### `SERVER_AUTHORITY`

- authenticated `userId` from verified auth;
- session `ownerUserId` and ownership state;
- organization id only when obtained from a server-validated membership;
- effective permission/capability derived on the server;
- canonical Project/Initiative id;
- Project owner/team membership/governance assignment;
- invitation id, target entity/type, recipient binding, issuer, role,
  lifecycle, expiry/revocation, acceptance, and version — once the future
  invitation contract is actually implemented;
- confirmed handoff id, confirmation id, session revision, mapping/contract
  version;
- explicit Start/acceptance status, if defined by the approved handoff
  contract.

### `PROVISIONAL_CONTEXT`

- raw Public Entry text and entry origin;
- `semanticState`, latest analysis, pending items, and extracted context;
- provisional `continuationProfile`;
- user-declared desired outcome, current situation, and operating context;
- unresolved Initiative/Portfolio ambiguity;
- public wording suggesting a role, expertise, Sponsor, owner, or job.

### `USER_CONFIRMABLE`

- correction of extracted context;
- confirmation that the Entry reflects the user's intent;
- confirmation of a proposed Portfolio-oriented continuation;
- confirmation of a legitimate handoff/participation where the server has
  already established the eligible target and recipient relationship;
- explicit accept/decline of a valid invitation;
- explicit Start after the handoff boundary, when the future contract defines
  it.

User confirmation cannot manufacture an organization membership, role,
Initiative owner assignment, invitation issuer authority, or permission.

### `ORGANIZATIONAL_AUTHORITY_REQUIRED`

- assigning Portfolio Lead or Initiative Owner responsibility;
- granting Portfolio access or membership in an organization;
- selecting/assigning Sponsor, Challenge Owner, or Strategic Front Owner;
- issuing an Initiative invitation;
- approving owner-can-invite policy;
- binding a person to an existing Initiative or Challenge team;
- changing resource-scoped permissions;
- converting provisional context into canonical Portfolio/Initiative truth;
- authorizing direct Steps continuation.

## 15. Unresolved authority gaps

1. No approved server-owned contextual continuation-profile model exists for
   every Public Entry session.
2. Minimum Portfolio access for an authenticated unknown-role user is not
   defined safely.
3. Initiative invitation issuer authority is unresolved.
4. The rich `ChallengeInvitation` schema is ahead of the active service and
   has no complete acceptance/start route.
5. Invitation organization binding, payload/version, and idempotency are not
   fully defined.
6. Challenge Owner and Strategic Front Owner are ambiguous scalar concepts,
   not canonical roles.
7. Sponsor has scoped checkpoint semantics but no universal invitation or
   continuation authority.
8. The retirement/live-consumer state of historical `/auth/continue/:draftId`
   and `/continuar-piloto` is not proven.
9. Legacy pilot claim, initial review conversion, and Portfolio Entry
   conversion all create Project/Step state with different semantics; their
   compatibility boundaries need explicit retirement conditions.

## 16. Additional ADR decision

**Classification: `MULTIPLE_AUTHORITY_GAPS`.**

At minimum, an ADR is required for Initiative invitation authority. A separate
Portfolio access decision is also required unless ADR-003 is amended to make
the current platform permission model authoritative for that case. Role model
clarification is required if the repository intends `PORTFOLIO_LEAD_ENTRY`,
`INITIATIVE_ENTRY`, Sponsor, Challenge Owner, or Strategic Front Owner to be
canonical contextual roles rather than labels/assignments.

This audit does not create those ADRs and does not choose an issuer.

## 17. Handoff Contract readiness

**`READY_WITH_EXPLICIT_EXCEPTIONS`**, inherited from the prior continuation /
ownership audit, with the following explicit exceptions:

- Portfolio-first handoff can rely on authenticated session ownership,
  confirmed handoff, revision/idempotency, and server-derived permission;
- Initiative direct continuation cannot be treated as generally ready until
  invitation issuer, recipient acceptance, target existence, organization
  scope, and permission semantics are approved and wired;
- Sponsor and owner labels cannot act as generic routing authorities;
- the candidate handoff must preserve provisional fields separately from
  server authority fields.

## 18. Productive integration readiness

**NOT READY.** The requested audit confirms a useful contract boundary but
does not authorize productive routing. Authority conflicts and live legacy
consumers remain; invitation issuer and Portfolio access are unresolved; ADR-003
is still proposed.

## 19. Files changed

```text
docs/portfolio-entry/testing/PORTFOLIO_ENTRY_SERVER_OWNED_CONTEXT_AND_INVITATION_AUDIT_v0.1.md
```

No productive file was changed.

## 20. Recommended next slice

`ADR-003 acceptance + invitation authority decision + minimum Portfolio access
contract + repository-wide legacy consumer audit`.

The next slice should first decide who may issue an Initiative invitation and
what organization/resource evidence grants Portfolio continuation. It should
then reconcile the candidate `ChallengeInvitation` schema with an explicit
accept/Start boundary and document retirement conditions for pilot/public-draft
consumers. It must remain contract/audit work until those authority decisions
are approved.
