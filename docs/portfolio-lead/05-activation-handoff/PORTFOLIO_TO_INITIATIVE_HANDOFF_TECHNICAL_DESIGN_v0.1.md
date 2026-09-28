# Portfolio to Initiative Handoff — Technical Design v0.1

**Modo:** AUDIT + TECHNICAL DESIGN ONLY  
**Bounded context:** Portfolio Lead → Initiative Owner Handoff  
**Boundary:** Portfolio Lead assigns a Challenge or an existing Initiative; the context ends immediately after a successful `Start / Empezar`.  
**Status:** design recommendation; not implementation authority for Core or Steps 0–4.

## 1. Executive summary

The repository has a partial invitation/activation foundation, but not the complete handoff bounded context. `ChallengeInvitation` already contains a useful lifecycle/token shape, while recipient-facing access, identity claim, Accept/Reject, Portfolio response, and Start application services are absent. The current challenge CTA still routes to `/projects/new?challengeId=...`; that path immediately creates a `Project`, all five `Step` rows, a `TeamMember`, and `InitiativePortfolioMeta`, and sets linked work to `step0Status=IN_PROGRESS`. It is not safe as the canonical handoff path.

Recommended direction:

- preserve `Project` as the current Initiative identity; do not create a new canonical `Initiative` table;
- treat `ChallengeInvitation` as invitation infrastructure, not as the assignment aggregate;
- compose `HandoffAssignment` from invitation + Challenge + optional existing Project/Initiative + assignment events/read model, unless implementation proves a durable assignment aggregate is required;
- introduce one backend-owned application service boundary for invitation access, Accept, Reject, Portfolio response, and `startAssignedWork(assignmentId, expectedVersion)`;
- use explicit `target_kind = existing_initiative | challenge`;
- keep Challenge assignments Initiative-free until the accepted workstream explicitly creates the later Initiative, and never manufacture one in this context;
- make `handoff_assignment_started` distinct from `initiative_started`;
- keep Step materialization and Step 0 activation behind the Start boundary and outside this design.

Implementation is **NO-GO now** because the requested v0.2/integration/visual-writing authority artifacts are absent or not materialized under the requested names, the lifecycle/access behavior is incomplete, and the current canonical route violates the boundary.

## 2. Authority read

Read, in repository order:

- `CURRENT_STATE.md` — mixed checkout; code presence is not product certification; legacy Project/Steps routes coexist with V2 candidates.
- `STARTERIA_V2_MANIFEST.md` — Activation/Invitation is a target contract with partial/pilot implementation; Initiative Overview and Steps remain unresolved/legacy.
- `docs/STARTERIA_AUTHORITY.md` — identifies Core v0.2 as factual authority and the activation contract as the bounded-context experience authority.
- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` — Core v0.2 factual authority, not the candidate `docs/core/...v0.3` artifact.
- `docs/portfolio-lead/04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md` — candidate channel-independent interaction contract; Portfolio consumes canonical state/events and never owns Step state.
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md` — active reference contract for this context.
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md` — H-0 acceptance constraints.
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md` — factual evidence only, not functional authority.
- Design System contract, Page Anatomy, E2E Visual Architecture, and DS-08 activation report.
- `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md` and `STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`.

Authority gaps found:

- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` exists as v0.3 candidate and is explicitly not promoted; the factual Core path is the Spanish v0.2 document.
- Requested `PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md` is absent; v0.1 is the repository-referenced contract.
- Requested `PORTFOLIO_TO_INITIATIVE_HANDOFF_ACCEPTANCE_CHECKLIST_v0.1.md` is absent; the present equivalent is `...ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md`.
- Requested visual-writing and integration contracts are absent by the searched repository paths.
- DS-08 is present at `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS08_ACTIVATION_INVITATION_REPORT.md`.

## 3. Scope / hard boundary

In scope: assignment creation, invitation delivery/access, identity claim, Accept/Reject, rejection response, pre-Start overview contract, team constraints, idempotency/concurrency, Start command boundary, audit/projection/event contracts, channel adapters, and future HandoffShell reuse.

Out of scope: Step 0–4 design or behavior, Adaptive Cycle changes, internal Initiative Core implementation, post-Start UI, Step materialization details, new Core cardinalities, and production code/schema/routes/tests in this audit.

Hard invariants:

```text
Invitation != Assignment
Invitation != Initiative
Accept != Start
handoff_assignment_started != initiative_started
Challenge Assignment != Initiative
```

## 4. Repository inventory

| Area | Current files | Finding |
|---|---|---|
| Authority/current state | `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, `docs/STARTERIA_AUTHORITY.md` | mixed checkout; Activation/Invitation partial/pilot |
| Core persistence | `front/prisma/schema.prisma` | `Project` is current Initiative identity; no separate canonical Initiative model |
| Portfolio backend | `backend/modules/portfolio/*` | direct CRUD for Challenges, invitations, teams, meta; broad `portfolio:write` guards |
| Project backend | `backend/modules/projects/project.service.ts` | creates Project + Steps + meta in one transaction |
| Auth | `backend/modules/auth/*`, `backend/shared/authz/*` | JWT/password/Google and role-derived permissions; no invitation identity claim |
| Mail | `backend/shared/mail/mailer.ts` | reusable SMTP transport; only pilot-lead notifier uses it |
| Portfolio read | `backend/modules/portfolio/portfolio-home.read-service.ts` | direct derived read, no persisted handoff projection |
| Frontend routes | `front/src/app/routes.ts` | `/retos/:challengeId`, `/projects/new`, Initiative Overview route |
| DS primitives/patterns | `front/src/app/components/design-system/{patterns,status,ui}` | reusable future HandoffShell candidates |
| Tests/E2E | `backend/modules/**/__tests__`, `front/src/app/pages/__tests__`, `front/e2e` | team/project/activation regressions; no complete handoff E2E |

## 5. Current handoff E2E

Observed current path:

```text
Portfolio Lead challenge authoring
  → selectedPeople / invitation CRUD
  → participant opens /retos/:challengeId
  → CTA “Crear iniciativa dentro del reto”
  → /projects/new?challengeId=...
  → CreateProjectPage
  → AppContext.createProject(... challengeLink)
  → POST /projects
  → ProjectService.createProject()
  → Project + TeamMember + Steps 1–4 + InitiativePortfolioMeta
  → linked Step 0 state IN_PROGRESS
  → /projects/:id
```

The current path is **REMOVE FROM CANONICAL PATH / DEPRECATE COMPATIBILITY**. It may remain only as an explicitly documented legacy route until consumers are migrated; it must not be used to implement Handoff.

## 6. Current domain/data models

| Model | Current responsibility | Target responsibility | Treatment | Files | Migration risk | ADR? |
|---|---|---|---|---|---|---|
| `Challenge` | Portfolio strategic challenge, selected people, challenge team, existing initiative metas | source reference for `target_kind=challenge` and assignment context | KEEP, ADAPT read/assignment boundary | `front/prisma/schema.prisma`, `backend/modules/portfolio/*` | medium | no unless Core relation changes |
| `ChallengeInvitation` | challenge-selected person plus transitional lifecycle/token fields | invitation/access record only; target and invited identity; no Initiative creation | ADAPT | schema, portfolio service | high: existing rows/status semantics | no for adapter; yes if lifecycle changes materially |
| `ChallengeSquadMember` | legacy free-text squad | compatibility read only | DO NOT REUSE for new behavior | schema, backfill script | medium | no |
| `ChallengeTeamMember` | challenge-scoped team, nullable user during transition | Portfolio-proposed execution team source, with explicit one Owner and max three core executors | ADAPT | schema, `portfolio.service.ts` | high: current service has no cardinality guard | no unless canonical team cardinality changes |
| `Project` | current Initiative identity and Step container | current Initiative ref for `existing_initiative`; no new identity | KEEP | schema, projects module | high due Step-coupled creation | yes if replaced as canonical Initiative |
| `TeamMember` | Project-level user membership | post-Start/current Initiative team; may be materialized only at authorized Start | ADAPT | schema, portfolio service | high | yes if ownership/cardinality semantics change |
| `InitiativePortfolioMeta` | challenge/project tracking and status fields; currently written at Project creation | post-Start projection input/compatibility source; never handoff source of truth | ADAPT | schema, portfolio service | high: `en_step_0` misrepresents pre-start | yes if it becomes canonical lifecycle |
| `AuditLog` | generic user/resource/action log | reusable audit sink for handoff decisions/events | KEEP, ADAPT envelope/redaction | schema, auth/project services | medium | no |
| `PortfolioHomeReadService` | direct Portfolio read derivation | consumer/compatibility adapter for a dedicated handoff projection | ADAPT | `portfolio-home.read-service.ts` | medium | no |
| mailer | SMTP transport | delivery adapter for invitation/rejection/response notifications | KEEP, ADAPT | `backend/shared/mail/mailer.ts` | low | no |
| permission/auth middleware | role-derived permission guards | backend actor/role + resource guards for handoff commands | KEEP, ADAPT | auth middleware/authz | high | no unless authority changes |

No `Initiative` model exists in this checkout. Do not add one for naming alone.

## 7. Current auth/invitation path

Current invitation storage has `recipientEmail`, normalized email, inviter, `targetType`, optional `existingProjectId`, `role`, `ownerCanInvite`, `invitationStatus`, `claimedByUserId`, unique `claimTokenHash`, sent/viewed/accepted/declined/revoked/expiry timestamps. This is the strongest reusable foundation.

Current gaps:

- `addInvitation` persists only `challengeId` and `value`; it does not normalize recipient email, set target, create token, set expiry, or send mail.
- `updateInvitation` writes only legacy `status`; it is a Portfolio Lead CRUD route and not recipient Accept/Reject.
- No recipient router/service was found for invitation token lookup, claim, identity verification, or continuation.
- No `claimTokenHash` consumer was found in the active invitation path.
- Auth supports existing login and new registration, but no return-to-same-invitation continuation contract exists.
- Mailer exists but no handoff invitation sender exists.
- No explicit revoke/expiry worker or replay/idempotent invitation command exists.

Required future flow:

```text
opaque invitation token
  → server lookup by hash
  → public read without mutation except viewed event
  → authenticate/register
  → returnTo invitation id/token
  → claim only when authenticated email == normalized recipient email
  → Accept or Reject guarded by claimed identity
```

Never treat authentication as a business lifecycle state. Claim is an access/authorization condition; lifecycle remains `created…started`.

## 8. Current Project/Initiative creation behavior

`CreateProjectPage` receives `challengeId`, prefills name/description and legacy squad email invites, then calls `AppContext.createProject`. The backend `ProjectService.createProject`:

1. resolves `challengeLink.challengeId`;
2. checks that the Challenge admits initiatives;
3. inherits Challenge context into `step0Data`;
4. creates `Project` with `currentStep=0`, `step0Status=IN_PROGRESS` for linked Challenge;
5. creates owner `TeamMember`;
6. creates `DEFAULT_STEPS` 1–4 and modules;
7. creates `InitiativePortfolioMeta` with `status=en_step_0`, Step 0 timeline, team metadata;
8. may inherit Challenge team members for legacy `challengeId` handling;
9. redirects to the Project surface.

This violates `Accept != Start`, `Challenge Assignment != Initiative`, and the no-Step-before-authorized-boundary rule. Classification: **REMOVE FROM CANONICAL PATH**. Keep only as legacy compatibility with an explicit retirement condition and negative tests blocking Handoff from calling it.

## 9. Current Portfolio projection/event behavior

`PortfolioHomeReadService` explicitly states it does not persist a projection. It queries Challenges, invitation rows, `InitiativePortfolioMeta`, Projects, attention items and decision requests, then derives activation visibility. It maps canonical invitation statuses when present and falls back to legacy `status` values (`pendiente`, `notificado`). It has no assignment id, rejection reason, started timestamp, last material event, or projection version.

`AuditLog` is the only durable generic audit mechanism found. No materialized domain-event/outbox/event-bus infrastructure was found. Existing domain-events documentation and adaptive-core projection tests are references, not a reusable handoff event store.

Recommendation: add a narrow handoff event/audit abstraction and a read model, not a full event bus. Emit durable handoff events transactionally with state changes, then project asynchronously or synchronously behind a versioned projector. Do not make Portfolio read from DOM, pathname, Step components, or client `currentStep`.

## 10. Current Design System implementation inventory

Present and suitable for future HandoffShell audit/reuse:

- `PageHeader`: KEEP; shell hierarchy and state-aware title/action region.
- `ContextSummary`: KEEP; Challenge/Initiative context summary.
- `AISuggestionPanel`: ADAPT/OPTIONAL; only for clearly marked AI suggestion, never authority or lifecycle decision.
- `NextAction`: KEEP; one state-specific action.
- `EmptyState`: KEEP; no invitation/no access/error states.
- `DomainStatusBadge`: KEEP; maps handoff states only after semantic mapping is defined.
- `Badge`, `Button`, `Progress`: KEEP; generic primitives.

`ChallengeActivationPanel` family is **ADAPT or DO NOT REUSE** for HandoffShell: it is Portfolio Lead authoring/activation UI and currently contains invitation/activation assumptions. `InitiativeWorkspacePage`/Initiative Overview is **DO NOT REUSE AS PRE-START SHELL BY DEFAULT** because it belongs to the unresolved Initiative/Steps surface and risks importing Step semantics. No new UI is designed in this audit.

## 11. KEEP / ADAPT / ADD / DO NOT REUSE matrix

| Item | Classification | Reason |
|---|---|---|
| `Project` as current Initiative identity | KEEP | avoids duplicate canonical identity |
| `Challenge` reference | KEEP | source of Challenge assignment |
| `ChallengeInvitation` storage base | ADAPT | fields exist, behavior does not |
| `TeamMember` | ADAPT | enforce one Owner/max three core members |
| `ChallengeTeamMember` | ADAPT | proposed team source; add server rules |
| `ChallengeSquadMember` | DO NOT REUSE | deprecated legacy free-text source |
| `InitiativePortfolioMeta` | ADAPT | compatibility/read input, not pre-start truth |
| SMTP `mailer` | KEEP/ADAPT | delivery adapter, not lifecycle owner |
| `AuditLog` | KEEP/ADAPT | audit sink with event envelope |
| `PortfolioHomeReadService` | ADAPT | consume projection through adapter |
| existing auth/password/Google | KEEP | continuation mechanism |
| `ProjectService.createProject` | DO NOT REUSE for Handoff Accept | creates Steps and Step 0 state |
| `/projects/new?challengeId` | REMOVE FROM CANONICAL PATH | violates hard boundary |
| `ChallengeActivationPanel` | ADAPT/DO NOT REUSE | wrong actor/surface semantics |
| `InitiativeWorkspacePage` | DO NOT REUSE pre-Start | Step/workspace coupling |
| full event bus | DO NOT ADD now | narrow durable events/outbox are sufficient |
| `PortfolioHandoffProjection` | ADD | required read shape is not present today |
| Handoff application services | ADD | no recipient/assignment/start boundary exists |

## 12. Target bounded-context architecture

```text
Web / Copilot / API / future adapter
              │
              ▼
Handoff application services
  accessInvitation
  claimInvitation
  acceptAssignment
  rejectAssignment
  recordPortfolioResponse
  startAssignedWork
              │
              ├── HandoffAssignment composition/aggregate boundary
              ├── Invitation access/token repository
              ├── permission + identity guards
              ├── transactional state + audit/event writer
              └── PortfolioHandoffProjection projector
                              │
                              ▼
                    Portfolio Lead read surface

Start(existing_initiative) ──► Initiative Core handoff
Start(challenge)             ──► assignment-started + later workstream
```

The bounded context owns assignment readiness and response semantics. Initiative Core owns Initiative lifecycle and Steps after Start. A Challenge assignment does not create a fictitious Initiative.

## 13. Handoff Assignment technical recommendation

Conceptual minimum:

```text
assignment_id
target_kind: existing_initiative | challenge
challenge_ref
initiative_ref?
initiative_owner
execution_team
invited_identity
handoff_state
accepted_at?
rejected_at?
rejection_reason?
started_at?
version
audit/event refs
```

Alternatives:

| Alternative | Assessment |
|---|---|
| Adapt `ChallengeInvitation` into full assignment | insufficient: invitation identity/lifecycle should not own assignment response, team, and Start semantics |
| New canonical `Initiative` table | reject: duplicate identity and material Core change |
| Composition of ChallengeInvitation + Challenge/Project + events + projection | recommended first; preserves current identity and separates invitation from assignment |
| New `HandoffAssignment` entity/table | viable fallback if composition cannot enforce uniqueness, history, response, and concurrency without ambiguity |
| Projection only | insufficient as source of truth; useful read model only |

Recommendation: implement an application-level `HandoffAssignment` view/port first, keyed by invitation/assignment identity. Add a durable assignment table only after a data audit proves that existing invitation rows cannot carry stable assignment identity, target references, response history, and uniqueness safely. A new canonical domain identity or relation/cardinality change is **ADR REQUIRED**.

## 14. Lifecycle/state machine

```text
created → sent → viewed → accepted → started
    │       │       │          │
    ├───────┴───────┴──────────┴── rejected
    ├───────────────────────────── revoked
    └───────────────────────────── expired
```

Rules:

- `created → sent` only after durable token + delivery attempt record.
- `sent/viewed` are non-terminal and retryable.
- `accepted → started` is the hard boundary; Accept cannot activate Core.
- `rejected` stores immutable first rejection plus optional later Portfolio response records.
- `revoked` and `expired` cannot Accept/Reject; reads may explain the terminal state.
- terminal transitions are idempotent when the same actor/command repeats.
- identity claim is not a lifecycle state.

Legacy mapping:

| Legacy status | Canonical mapping |
|---|---|
| `pendiente` | `created` or `sent` only after delivery evidence; do not infer sent solely from label |
| `notificado` | `sent` |
| `confirmado` | `accepted` pending audit verification; never infer `started` |
| `declinado` | `rejected` |

Unknown legacy rows require an audit/compatibility mapping, not silent conversion.

## 15. Identity claim/auth continuation design

Use an opaque one-time URL token. Persist only a cryptographic hash, recipient email normalized with the repository’s email normalization policy, expiry, claimed user id/time, and revocation metadata. Never put recipient PII or raw token in logs.

Existing-user flow: open token → inspect invitation → authenticate → return to same invitation → compare authenticated verified email to normalized invited email → claim atomically → Accept/Reject.

New-user flow: open token → preserve opaque continuation reference server-side or signed short-lived continuation → register/login → verify email as required by auth policy → same email match → claim atomically → Accept/Reject.

Reject mismatched identity even if the user knows the token. A claimed invitation cannot be transferred by login, and a Portfolio Lead response cannot alter Owner silently. Claim, expiry, revoke, replay, and concurrent claim require unique/compare-and-set guards.

## 16. Team enforcement design

Backend policy:

- exactly one active `OWNER` per assignment/execution team;
- at most two active non-viewer core members;
- at most three core executors total;
- `VIEWER`/observer rows excluded from this count only when explicitly marked non-executing;
- Portfolio Lead may propose the team, but must identify the Owner;
- Accept validates the invited identity is the assigned Owner or explicitly assigned role;
- Owner transfer is a separate authorized command and never implicit in Accept/Reject;
- all channel adapters call the same team validator.

Current gap: `ChallengeTeamMember` accepts roles and statuses without enforcing one Owner/max three, and `TeamMember` has no aggregate-level cardinality guard. `ChallengeSquadMember` is free-text and cannot enforce identity. This is ADAPT; it becomes ADR REQUIRED only if it changes a Core canonical relation/cardinality beyond the stated team rule.

## 17. Accept design

Conceptual command:

```text
acceptAssignment(assignmentId, actorIdentity, expectedVersion, idempotencyKey)
```

Guards: invitation not expired/revoked/rejected, authenticated identity matches recipient, actor is assigned Owner/role, Challenge/Initiative still exists, team policy valid, expected version matches, and no incompatible terminal state exists.

Transaction: verify/claim identity if needed, transition to `accepted`, record `accepted_at`, append `assignment_accepted`, write audit record, update projection, and return the same assignment/overview. It must not call `ProjectService.createProject`, materialize Steps, set Step 0 active, or create a Challenge Initiative.

For an existing Initiative, Accept preserves the referenced Project/Initiative and its history. For a Challenge assignment, Accept records responsibility acceptance only; later workstream formulation is outside this context.

## 18. Reject + Portfolio response design

```text
rejectAssignment(assignmentId, reason, expectedVersion, idempotencyKey)
recordPortfolioResponse(assignmentId, response, expectedVersion, idempotencyKey)
```

Reject requires a non-empty bounded reason, stores the actor/time/reason, emits `assignment_rejected`, and updates the Portfolio projection. The Portfolio Lead can read the rejection and reason and send a response/message linked to the assignment/event. A response may acknowledge, clarify, or propose a new authorized assignment, but cannot mutate `initiative_owner`, target, or accepted state implicitly.

Use a lightweight response record/event, not a ServiceNow/Jira-like workflow. Preserve audit history.

## 19. Start boundary design

Use:

```text
startAssignedWork(assignmentId, expectedVersion, idempotencyKey)
```

Guards: authenticated Initiative Owner (or explicitly authorized actor), state `accepted`, team valid, target reference valid, current assignment version, no revoke/expiry conflict, and target-specific readiness.

For `existing_initiative`: invoke the Initiative Core activation/handoff adapter and emit `handoff_assignment_started`. Only the downstream successful Core transition may emit `initiative_started`; this context must not conflate the two.

For `challenge`: persist `handoff_assignment_started` and return control to the later workstream. Do not create an Initiative, Project, Step, or Step 0 here.

Idempotent repeat returns the prior successful result. A failed downstream attempt must be retryable without duplicating events or creating duplicate objects. No post-Start behavior is designed here.

## 20. PortfolioHandoffProjection design

Recommend a dedicated read model/adapter named `PortfolioHandoffProjection`, distinct from `PortfolioInitiativeProjection` and not a source of truth. Minimum fields:

```text
assignment_id
target_kind
challenge_ref
initiative_ref?
initiative_owner
execution_team
handoff_state
accepted_at?
rejected_at?
rejection_reason?
started_at?
last_material_event
projection_version
```

It should be rebuilt from assignment state/events, be versioned, and expose only authorized Portfolio data. Existing `PortfolioHomeReadService` can consume it through an adapter while preserving current reads during migration. Do not overload `InitiativePortfolioMeta` with invitation lifecycle or use it as source of truth.

## 21. Event/integration design

Minimum durable events:

```text
assignment_created
invitation_sent
invitation_viewed
assignment_accepted
assignment_rejected
portfolio_response_recorded
handoff_assignment_started
```

Later Initiative Core events may be consumed:

```text
initiative_linked_to_handoff_assignment
initiative_started
step_entered
step_completed
blocker_raised
blocker_resolved
support_requested
decision_requested
relevant_progress_recorded
```

The integration contract must preserve:

```text
handoff_assignment_started != initiative_started
```

Use the existing `AuditLog` as an audit sink and add a narrow handoff event writer/outbox abstraction if transactional durability is required. Do not build a full event bus for this slice. Event envelope should include event id/type, aggregate/assignment id, entity version, actor id/role, channel, occurred/recorded timestamps, correlation/idempotency refs, and source refs.

## 22. Channel-independent application services

Web, Copilot, API, and future adapters must invoke the same services:

```text
getMyPendingInvitations()
getInvitationOverview(tokenOrAssignmentRef)
claimInvitation()
acceptAssignment()
rejectAssignment()
recordPortfolioResponse()
getAssignedWorkOverview()
startAssignedWork()
```

Authorization is `actor + role + backend guards`. Channel is metadata only. No client route, DOM, Step component, or `currentStep` may decide lifecycle.

## 23. API/command/read contracts

Proposed contracts, subject to implementation slice approval:

```text
GET  /api/v1/handoff/invitations/:token
POST /api/v1/handoff/invitations/:id/claim
POST /api/v1/handoff/assignments/:id/accept
POST /api/v1/handoff/assignments/:id/reject
POST /api/v1/handoff/assignments/:id/portfolio-response
GET  /api/v1/handoff/assignments/:id
POST /api/v1/handoff/assignments/:id/start
GET  /api/v1/portfolio/handoffs
```

Every mutation carries `expectedVersion` and `Idempotency-Key`; response includes assignment state/version and event/correlation reference. Exact route naming is a future implementation decision and is not created in this audit.

## 24. Concurrency/idempotency

Use compare-and-set on assignment version/state. Unique idempotency key is scoped to actor/command/assignment. Accept/Reject/Start are safe under retry and double-click. Claim uses atomic `claimedByUserId IS NULL OR same user`; a different user receives a closed authorization error. Start existing Initiative must use an adapter-level idempotency record to avoid duplicate Core activation. Projection updates reject stale event versions and expose lag/failed projection state.

## 25. Security/permissions

Portfolio Lead assignment/response requires scoped Portfolio permission and resource access, not just global role. Recipient actions require authenticated identity matching normalized invited email and assignment role. Existing Project access guards cannot substitute for invitation identity. Token hashes, PII, rejection reasons, and mail payloads must be redacted from logs where appropriate. Revoke/expiry must fail closed. Use rate limits for token lookup, claim, and auth continuation; prevent token enumeration and open redirects.

## 26. Persistence/migration strategy

No schema or migration is created now. Future implementation should prefer additive, adapter-first changes:

1. audit existing `ChallengeInvitation` rows and normalize lifecycle mappings;
2. backfill only deterministic token/recipient metadata, with an explicit compatibility report;
3. add assignment/event/projection persistence only if composition cannot satisfy uniqueness/history/concurrency;
4. preserve `Project` identity and `InitiativePortfolioMeta` compatibility;
5. keep legacy fields read-only or dual-read during a bounded migration;
6. add negative guards before changing the active route;
7. retire the old create path only after consumer evidence and V2 E2E.

Material migration, new canonical Initiative identity, or changed Core cardinality is ADR REQUIRED.

## 27. Frontend route/component strategy

No UI is implemented or designed here. Future route strategy should use a dedicated invitation/assignment route and a state-aware `HandoffShell`; it must not route a Challenge assignment through `/projects/new` and must not use `InitiativeWorkspacePage` as the pre-Start shell by default.

Candidate reuse is limited to the DS inventory in section 10. The shell should render one primary action per state: Accept, Start, or explanation/retry. Post-Start navigation is intentionally unspecified.

## 28. Email strategy

Reuse `backend/shared/mail/mailer.ts` through a handoff notification adapter. Persist delivery attempt/result separately from lifecycle transition; delivery failure must not silently mark accepted/started. Invitation mail includes an opaque link, expiry, intended recipient explanation, and safe support path. Rejection/Portfolio response notifications are retriable and idempotent. Existing pilot notifier is infrastructure precedent only; it is not semantic handoff logic.

## 29. Error/recovery states

Required states include: invalid/expired/revoked token, unauthenticated continuation, identity mismatch, invitation already claimed by another user, already accepted/rejected/started, missing Challenge/Initiative, invalid team, version conflict, duplicate idempotency key, mail unavailable, projection lag, downstream Core failure, and retry after transient failure. Errors must preserve state and never fall back to Project creation or Step 0 activation.

## 30. Observability/analytics

Measure event ids and correlation ids, not raw token/email. Capture invitation creation/send/view, auth continuation outcome, claim success/failure reason category, Accept/Reject, response, Start attempt/success/failure, version conflicts, retries, mail delivery, projection lag, and legacy-route hits. Keep actor role and interaction channel separate. Do not use page visits or client `currentStep` as business events.

## 31. Test strategy

Existing tests classification:

| Existing area | Classification |
|---|---|
| `backend/modules/portfolio/__tests__/portfolio.schemas.activation.test.ts` | KEEP; ADAPT for canonical invitation schema later |
| `backend/modules/portfolio/__tests__/challenge-team.test.ts` | KEEP; ADAPT for one Owner/max-three rules |
| `backend/modules/projects/__tests__/create-initiative-team.test.ts` | KEEP as legacy regression; add negative handoff guard |
| `backend/modules/projects/__tests__/portfolio-steps-materialize.test.ts` | KEEP as project/Core regression; not handoff authority |
| `front/src/app/pages/__tests__/PortfolioLeadActivationInvitation.ds08.test.tsx` | KEEP as DS-08 visual/authoring evidence; ADAPT only when active route changes |
| `front/e2e/team-inheritance.spec.ts` | KEEP/ADAPT compatibility; does not prove Handoff |
| `front/e2e/portfolio-challenge-states.spec.ts` | KEEP as Challenge regression; replace CTA expectation for V2 route |
| auth permission/claim tests | KEEP; NEW invitation identity-claim matrix |
| no complete recipient handoff E2E found | NEW |

Minimum NEW suites: invitation token lifecycle; existing/new-user continuation; identity mismatch; revoke/expiry/replay; Accept/Reject idempotency; rejection reason/Portfolio response; team invariants; Challenge Accept creates no Initiative; existing Initiative Accept does not duplicate; Accept does not initialize Step 0; Start existing vs Challenge branch; expected-version conflict; double-click/retry; channel parity; projection rebuild/versioning; legacy route negative test; mail retry.

## 32. Contract → code → test traceability matrix

| Contract rule | Current code/evidence | Gap | Future test |
|---|---|---|---|
| Invitation ≠ Initiative | `ChallengeInvitation`; current `/projects/new` contradicts | route/service separation | Accept does not create Project for Challenge |
| Accept ≠ Start | no Accept service; Project create starts Step 0 | add application commands | Accept leaves Core inactive |
| Challenge ≠ Initiative | no Challenge handoff service | challenge branch needed | Challenge Start creates no Initiative |
| one Owner/max 3 executors | enums/models only; no aggregate guard | team validator | cardinality/property tests |
| identity matches invited email | fields exist; no claim consumer | claim service | mismatch denied |
| rejection reason + response | no recipient rejection/response | commands/read model | reason visible, ownership unchanged |
| `handoff_assignment_started != initiative_started` | no event infrastructure | event contract | event distinction |
| Portfolio projection read-only | direct read service, no projection | projection/adapter | rebuild and source-of-truth tests |
| channel independence | permission middleware exists; no handoff service | shared application service | Web/Copilot/API parity |
| Start idempotent/versioned | no Start command | command + CAS/idempotency | retry/double-click/version conflict |

## 33. Technical implementation slices

1. **H-TECH-01 Authority and data audit:** freeze missing-authority decisions, inventory invitation rows and legacy route consumers. No code behavior change.
2. **H-TECH-02 Handoff contracts and state kernel:** define types, lifecycle mapping, assignment port, identity/access rules, and negative boundaries.
3. **H-TECH-03 Invitation access and identity continuation:** token lookup, existing/new-user return path, claim, expiry/revoke/replay protection, mail adapter.
4. **H-TECH-04 Team policy:** backend aggregate validator for one Owner/max three executors and Challenge proposal compatibility.
5. **H-TECH-05 Accept/Reject/Portfolio response:** shared application commands, audit/events, idempotency, read contract.
6. **H-TECH-06 PortfolioHandoffProjection:** narrow projector/adapter and Portfolio read integration; no source-of-truth duplication.
7. **H-TECH-07 Start boundary:** `startAssignedWork`, existing-Initiative adapter, Challenge branch with no Initiative creation, event distinction.
8. **H-TECH-08 Route cutover and future HandoffShell:** only after backend contract/E2E gates; visual implementation is a later authorized slice.

## 34. Jira slice proposal

Proposed HU/slices (not created):

- `[Tecnica] Handoff authority/data audit and legacy route quarantine` — H-TECH-01.
- `[Tecnica] Invitation identity continuation and recipient access` — H-TECH-03.
- `[Tecnica] Assignment response lifecycle and Portfolio projection` — H-TECH-02/H-TECH-05/H-TECH-06.
- `[Tecnica] Team ownership/cardinality enforcement` — H-TECH-04.
- `[Tecnica] Start assigned work boundary` — H-TECH-07.
- `[Tecnica] Handoff route/UI migration` — H-TECH-08, only after explicit frontend slice authority.

Per `AGENTS.md`, these are proposals only: no Jira ticket is created or changed without the required interview, brief, plan, and explicit confirmation.

## 35. Conflicts

### CONFLICT C-01 — authority artifact mismatch

```text
ID: C-01
Authority: docs/STARTERIA_AUTHORITY.md + repository-referenced v0.1 handoff contract
Requirement: requested v0.2 activation contract, handoff acceptance, visual-writing, integration contracts
Current implementation/document: only v0.1 activation contract/checklist equivalent and DS-08 are materialized
Mismatch: requested authority set is absent under the stated names
Risk: implementation may infer semantics from candidate/audit documents
Treatment: KEEP v0.1 as current repository reference; ADD/UPDATE authority package before implementation
ADR required: no (authority reconciliation required first)
```

### CONFLICT C-02 — legacy route crosses hard boundary

```text
ID: C-02
Authority: activation contract/checklist + Core v0.2
Requirement: Challenge assignment must not create Initiative/Steps before authorized boundary
Current implementation: /retos/:challengeId → /projects/new → createProject creates Project, Steps, meta and Step 0 IN_PROGRESS
Mismatch: Challenge Assignment is canonicalized into Initiative/Step work before Accept/Start
Risk: duplicate Initiative, premature Core activation, irreversible semantic drift
Treatment: REMOVE FROM CANONICAL PATH; retain only documented compatibility until cutover
ADR required: no for route correction; yes if Project/Core identity or cardinality is changed
```

### CONFLICT C-03 — team policy not enforced

```text
ID: C-03
Authority: handoff acceptance team rule
Requirement: exactly one Owner and max three executors
Current implementation: ChallengeTeamMember/TeamMember CRUD accepts arbitrary roles/counts; free-text legacy squad remains
Mismatch: storage permits invalid handoff teams
Risk: ambiguous ownership and unauthorized Start
Treatment: ADAPT with backend validator; audit existing data
ADR required: no unless canonical Core relation/cardinality changes
```

### CONFLICT C-04 — Portfolio read semantics are derived legacy fields

```text
ID: C-04
Authority: channel-independence/integration direction
Requirement: Portfolio consumes assignment events/projection, not Step/UI/path state
Current implementation: PortfolioHomeReadService directly derives from invitation/meta/Project and has no persisted projection/event store
Mismatch: no durable handoff projection or material event stream
Risk: stale/ambiguous lifecycle and channel coupling
Treatment: ADAPT; add narrow projection/event layer
ADR required: no unless source-of-truth or Core ownership changes
```

## 36. ADR candidates

Required only if triggered during implementation:

- new canonical Initiative identity/table;
- changing Core relationships/cardinality for Challenge/Initiative ownership or team;
- changing human authority or allowing Portfolio response to transfer ownership;
- changing Step 0–4 or Adaptive Cycle behavior;
- material domain migration required for assignment history/token/lifecycle.

Not ADR blockers by themselves: adding an adapter, a read-only projection, a narrow event/audit envelope, or backend guards that enforce the already-stated team rule.

## 37. No-regression checklist

- [ ] No code/schema/migration/route/test changed by this audit.
- [ ] No Step 0–4 design or post-Start behavior added.
- [ ] Existing Initiative assignment never creates a duplicate Project.
- [ ] Challenge assignment does not create Initiative before the authorized later workstream.
- [ ] Accept does not Start or activate Core.
- [ ] Start is the only hard boundary.
- [ ] `handoff_assignment_started` remains distinct from `initiative_started`.
- [ ] One Owner and max three executors are backend-enforced.
- [ ] Viewers do not count toward executor limit.
- [ ] Identity claim matches invited identity before Accept/Reject.
- [ ] Revoke/expiry/replay fail closed.
- [ ] Rejection reason is visible; response cannot silently change ownership.
- [ ] Portfolio never depends on DOM/path/currentStep.
- [ ] Web/Copilot/API use one application service path.
- [ ] Legacy `/projects/new?challengeId` is not canonical.

## 38. Recommended implementation order

1. Resolve the authority gap and approve the Handoff contract package.
2. Audit/backfill current invitation/team data without changing product behavior.
3. Quarantine the legacy Challenge → Project route with negative tests.
4. Implement identity continuation and invitation access.
5. Implement team validation and Accept/Reject/Portfolio response.
6. Implement the projection and narrow durable handoff events.
7. Implement `startAssignedWork` with target-specific branches and idempotency.
8. Prove backend contract, security, concurrency, and channel-parity tests.
9. Only then implement the authorized frontend HandoffShell/route.
10. Retire legacy route after consumer and E2E evidence; update Manifest/Current State.

## 39. Go / No-Go for implementation

**NO-GO for product implementation in this execution.**

Technical design is sufficiently detailed to start the required HU/planning and authority reconciliation. It is not safe to start code implementation until the missing authority artifacts are resolved, the legacy route is quarantined by an approved slice, and the product owner confirms whether the composition recommendation is sufficient or a durable `HandoffAssignment` persistence model is required. Any choice that creates a new canonical Initiative identity, changes Core cardinality, or changes Step/Core authority requires ADR before implementation.
