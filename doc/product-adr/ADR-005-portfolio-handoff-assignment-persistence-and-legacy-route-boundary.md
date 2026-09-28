# ADR-005 — Portfolio Handoff Assignment Persistence and Legacy Challenge Route Boundary

**Estado:** PROPOSED — ADR DESIGN ONLY  
**Fecha:** 2026-09-28  
**Slice:** Portfolio Lead → Initiative Owner Handoff  
**Decide:** persistencia mínima del Handoff Assignment y tratamiento del flujo legacy `Challenge → /projects/new?challengeId=...`  
**No autoriza:** implementación productiva, cambios Prisma/schema, migraciones, rutas, frontend/backend runtime, Step 0–4, autoridad IA/humana ni creación de una nueva identidad canónica `Initiative`

## 1. Decision summary

Starteria adopta un **bounded persistence model de Handoff Assignment** como source of truth exclusivo del lifecycle de transferencia entre Portfolio Lead e Initiative Owner.

Conceptualmente:

```text
PortfolioHandoffAssignment
├── assignment_id
├── target_kind
│   ├── existing_initiative
│   └── challenge
├── challenge_ref
├── initiative_ref?              // requerido solo para existing_initiative
├── initiative_owner_ref
├── execution_team_refs[]        // owner + máximo 2 adicionales
├── invited_identity
├── handoff_state
├── accepted_at?
├── rejected_at?
├── rejection_reason?
├── portfolio_response?
├── started_at?
├── version
└── audit/event refs
```

Este modelo:

```text
HandoffAssignment
≠ Challenge
≠ Project / Initiative
≠ Step
```

y no introduce una nueva identidad canónica de `Initiative`.

`Project` se mantiene como la identidad productiva actual de Initiative mientras no exista otro ADR que cambie esa decisión.

Para `Assigned Challenge`:

```text
Challenge
→ Handoff Assignment
→ Invitation
→ Accept
→ Activation Overview
→ Start
```

`Accept` no crea Project/Initiative.

`Start` registra `handoff_assignment_started` y termina este bounded context.

La futura formulación/materialización de una Initiative pertenece al workstream downstream.

El flujo legacy `/projects/new?challengeId=...` queda clasificado como `COMPATIBILITY_ONLY + DEPRECATION_TARGET` para este handoff. No puede ser la ruta canónica de `Assigned Challenge`.

## 2. Authority and evidence

Esta decisión se apoya en:

- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- ADRs aprobados aplicables
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_ACCEPTANCE_CHECKLIST_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_VISUAL_UX_WRITING_CONTRACT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_INTEGRATION_CONTRACT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_TECHNICAL_DESIGN_v0.1.md`
- `docs/portfolio-lead/04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS08_ACTIVATION_INVITATION_REPORT.md`
- `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`
- `doc/product-adr/ADR-004-authenticated-continuation-access-and-initiative-handoff-authority.md`

Repository evidence currently shows:

```text
Challenge
→ /retos/:challengeId
→ /projects/new?challengeId=...
→ Project creation
→ TeamMember creation
→ Step structures
→ Step 0 initialization
→ InitiativePortfolioMeta
```

That behavior predates the new Handoff Experience Contract and cannot define the canonical target lifecycle.

## 3. Problem

The new handoff supports two distinct business cases.

### A — Assigned Initiative

```text
Existing Initiative
→ Handoff Assignment
→ Invitation
→ Accept
→ Activation Overview
→ Start
```

The existing Initiative must be preserved.

### B — Assigned Challenge

```text
Challenge
→ Handoff Assignment
→ Invitation
→ Accept
→ Activation Overview
→ Start
```

No Initiative exists yet.

The current repository does not have a durable object that can represent both cases without collapsing them into Project/Initiative creation.

Reusing the current `Challenge → createProject(challengeLink)` path would violate:

```text
Invitation ≠ Initiative
Accept ≠ Start
handoff_assignment_started ≠ initiative_started
```

and would create a fictitious Initiative for the Assigned Challenge case.

The architecture therefore needs a persisted pre-Core responsibility object without turning that object into another Initiative Core.

## 4. Decision drivers

The selected option must:

1. support Assigned Initiative and Assigned Challenge;
2. allow Assigned Challenge to exist with `initiative_ref = null`;
3. preserve exactly one Initiative Owner;
4. enforce execution team maximum = 3;
5. preserve invited identity across authentication;
6. support Accept / Reject / rejection reason;
7. allow Portfolio Lead response without silent ownership mutation;
8. keep Accept separate from Start;
9. support optimistic concurrency / version checks;
10. support idempotency and retry;
11. support audit and semantic events;
12. support Portfolio read projection;
13. remain channel-independent;
14. not become a second Initiative source of truth;
15. not modify Step 0–4;
16. allow the legacy path to be quarantined without breaking unrelated legacy use immediately.

## 5. Options evaluated

### Option A — Extend `ChallengeInvitation` into the full handoff aggregate

Advantages:
- fewer persistence objects;
- reuses an existing invitation model.

Problems:
- invitation delivery and responsibility assignment become the same thing;
- model name and current semantics remain Challenge-specific;
- awkward fit for `existing_initiative`;
- difficult to separate revoke/expire invitation state from accepted assignment lifecycle;
- creates coupling between transport and Portfolio accountability.

**Decision:** REJECTED as canonical target.

`ChallengeInvitation` may remain a compatibility/delivery source during migration, but should not own the canonical assignment lifecycle.

### Option B — Compose existing models without new persistence

Conceptually:

```text
ChallengeInvitation
+ ChallengeTeamMember
+ TeamMember
+ InitiativePortfolioMeta
+ AuditLog
```

Problems:
- no single durable assignment identity;
- source of truth becomes distributed and ambiguous;
- concurrency/idempotency become difficult to enforce;
- rejection reason / Portfolio response / Start require cross-table reconstruction.

**Decision:** REJECTED.

### Option C — Add bounded `PortfolioHandoffAssignment` persistence

Conceptually:

```text
PortfolioHandoffAssignment
→ source of truth only for handoff lifecycle
```

Advantages:
- one stable assignment identity;
- supports both target kinds;
- allows `initiative_ref = null` for Assigned Challenge;
- clean Accept/Reject/Start separation;
- clean concurrency/versioning;
- clean audit/event correlation;
- Portfolio projection can remain derived;
- no need to create a new Initiative identity.

Cost:
- new bounded persistence;
- migration/compatibility layer required.

**Decision:** SELECTED.

### Option D — Projection-only / event-only assignment

Problems:
- no authoritative command target for Accept/Reject/Start;
- projection risks becoming source of truth;
- unnecessary architectural complexity for MVP.

**Decision:** REJECTED.

## 6. Selected bounded model

The selected model is a **handoff-domain persistence object**, not a new Core aggregate.

Recommended conceptual fields:

```text
PortfolioHandoffAssignment
├── id
├── organization_id
├── portfolio_scope_ref?
├── challenge_id
├── target_kind
│   ├── EXISTING_INITIATIVE
│   └── CHALLENGE
├── initiative_id?              // required only for EXISTING_INITIATIVE
├── initiative_owner_user_id?
├── invited_email_normalized
├── invited_identity_ref?
├── state
├── rejection_reason?
├── portfolio_response?
├── created_by_actor_id
├── created_at
├── accepted_at?
├── rejected_at?
├── started_at?
├── revoked_at?
├── expired_at?
├── version
└── updated_at
```

Execution members should be persisted through the simplest repository-consistent relationship that supports:

```text
exactly 1 owner
+ 0..2 additional executing members
```

Observers remain outside the execution-member cardinality.

The exact Prisma/table naming is a Technical Design decision after ADR acceptance.

This ADR authorizes the **domain decision** that bounded persistence is required; it does not authorize a specific schema implementation.

## 7. Source-of-truth boundaries

`PortfolioHandoffAssignment` owns:
- target kind;
- target refs;
- Initiative Owner identity;
- execution-team membership within this handoff;
- handoff state;
- Accept/Reject;
- rejection reason;
- Portfolio response reference/content as defined by Technical Design;
- Start timestamp/state;
- version.

Invitation infrastructure owns:
- delivery/claim token;
- recipient delivery;
- expiration mechanics;
- recipient access/claim verification;
- mail delivery status.

Project/Initiative Core owns:
- actual Initiative lifecycle;
- Step 0–4;
- Initiative team after the downstream boundary where applicable;
- evidence;
- validation;
- blockers;
- decisions.

`PortfolioHandoffProjection` is derived read state and never source of truth.

## 8. Lifecycle decision

Canonical handoff states:

```text
created
sent
viewed
accepted
rejected
revoked
expired
started
```

Authentication state is not part of this business lifecycle.

Candidate legacy mapping:

```text
pendiente   → created
notificado  → sent
confirmado  → accepted
declinado   → rejected
```

Legacy mapping cannot synthesize `viewed`, `revoked`, `expired` or `started` without evidence.

## 9. Assigned Initiative invariant

For `target_kind = EXISTING_INITIATIVE`:

```text
challenge_id != null
initiative_id != null
```

Accept:
- does not create Project;
- does not duplicate Initiative;
- records accepted responsibility;
- preserves Initiative history.

Start:
- records `handoff_assignment_started`;
- may hand control to existing Initiative Core through an application boundary;
- must not recreate Step state.

## 10. Assigned Challenge invariant

For `target_kind = CHALLENGE`:

```text
challenge_id != null
initiative_id = null
```

Accept MUST NOT:
- create Project;
- create Initiative;
- create TeamMember in Initiative Core;
- create Steps;
- initialize Step 0;
- create InitiativePortfolioMeta as if an Initiative existed.

Start:

```text
accepted
→ started
→ handoff_assignment_started
```

and ends this bounded context.

A future downstream workstream may later publish:

```text
initiative_linked_to_handoff_assignment
```

with `assignment_id + initiative_id`.

## 11. Team invariant

Every assignment must have exactly one designated Initiative Owner.

Execution cardinality:

```text
1 Initiative Owner
+ 0..2 additional execution members
= 1..3 executing people
```

Observers/Viewers do not count.

Portfolio Lead may propose the initial team but must designate the Initiative Owner explicitly.

## 12. Invitation identity boundary

The selected model must support:

```text
invited email
→ invitation opened
→ login/register
→ restore same assignment/invitation
→ verify authenticated identity matches invited identity
→ Accept / Reject enabled
```

Authentication proves identity, not assignment acceptance.

A valid session does not bypass recipient matching.
A valid invitation does not bypass organization/resource permissions.

## 13. Accept / Reject / Portfolio response

Accept:
- permission checked;
- idempotent;
- verifies invited identity;
- enforces current version;
- preserves target identity;
- does not Start.

Reject:
- requires non-empty rejection reason;
- records actor/timestamp;
- updates Portfolio projection via derived state/event.

Portfolio Lead response:
- is auditable;
- does not mutate historical rejection;
- does not silently assign another owner;
- does not silently reopen the same assignment;
- does not convert rejection into acceptance.

## 14. Start boundary

Canonical application semantics:

```text
startAssignedWork(assignmentId, expectedVersion)
```

rather than universally:

```text
startInitiative(initiativeId)
```

Start requires:
- accepted assignment;
- eligible authenticated actor;
- required permissions;
- valid current version;
- idempotency;
- auditability.

Start produces:

```text
handoff_assignment_started
```

For Assigned Challenge this is NOT `initiative_started`.

## 15. Portfolio projection

`PortfolioHandoffProjection` is a derived read model.

Minimum target fields:

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
generated_at
```

MVP may compute it synchronously. A full event bus is not required.

## 16. Event boundary

Minimum semantic events:

```text
assignment_created
invitation_sent
invitation_viewed
assignment_accepted
assignment_rejected
portfolio_response_recorded
handoff_assignment_started
```

Future/downstream:

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

## 17. Legacy route classification

Observed legacy path:

```text
Challenge
→ /projects/new?challengeId=...
→ ProjectService.createProject(challengeLink)
→ Project
→ OWNER TeamMember
→ Steps
→ Step 0 active
→ InitiativePortfolioMeta
```

For the new handoff this route is:

```text
NOT_CANONICAL
COMPATIBILITY_ONLY
DEPRECATION_TARGET
```

No CTA, invitation, Overview, Accept or Start in the new Assigned Challenge handoff may navigate to or invoke it as canonical continuation.

## 18. Legacy quarantine strategy

Canonical new handoff:

```text
Portfolio handoff
→ Handoff Assignment services
→ Handoff Shell
→ Start boundary
```

Legacy compatibility:

```text
existing legacy links / flows
→ current /projects/new?challengeId=...
```

only where existing product behavior still explicitly depends on it.

Quarantine requirements:
1. remove new handoff call sites from the legacy route;
2. prevent new Handoff services from calling `ProjectService.createProject(challengeLink)` for Assigned Challenge;
3. add tests proving Assigned Challenge Accept and Start do not create Project/Step state;
4. inventory remaining legacy route callers;
5. mark those callers as compatibility consumers;
6. define retirement conditions before deleting the route;
7. avoid any fallback from new Handoff to legacy creation.

## 19. Legacy retirement conditions

Retire only after:
1. all canonical Portfolio handoff call sites use Handoff Assignment;
2. Assigned Challenge formulation has a downstream authorized replacement;
3. compatibility links are migrated or expired;
4. E2E proves no productive dependency remains;
5. observability confirms no required legacy traffic;
6. removal does not alter valid independent Project creation semantics.

Quarantine is required before implementation GO. Full retirement is not.

## 20. Migration strategy

Use bounded migration, not wholesale rewrite.

New canonical handoffs:

```text
all new Portfolio → Initiative Owner handoffs
→ PortfolioHandoffAssignment
```

Do not silently backfill legacy rows unless enough facts exist to preserve recipient, target, owner, lifecycle, provenance and timestamps.

Already materialized Projects remain valid existing Initiatives. Do not delete, recreate or rewind them.

## 21. No permanent dual-write

A temporary compatibility adapter may map legacy invitation state.

However:

```text
ChallengeInvitation + HandoffAssignment
```

must not remain two equally authoritative lifecycle sources.

Technical Design must define write authority, compatibility reads, cutover and removal target.

## 22. Channel independence

Web, Copilot, API and future adapters invoke the same application services.

Authority derives from:

```text
authenticated actor
+ target scope
+ server-owned permissions
+ assignment state/version
```

not channel.

## 23. Security and concurrency

Candidate material commands:

```text
acceptHandoffAssignment(assignmentId, expectedVersion)
rejectHandoffAssignment(assignmentId, reason, expectedVersion)
respondToHandoffRejection(assignmentId, response, expectedVersion)
startAssignedWork(assignmentId, expectedVersion)
```

must support server-side authorization, optimistic concurrency, idempotency, audit actor/channel and target verification.

## 24. Relationship to Project / Initiative identity

This ADR explicitly preserves:

```text
Project remains current Initiative identity
```

It does NOT:
- add a new Initiative aggregate;
- split Project and Initiative;
- change canonical cardinality;
- rewrite Initiative history.

Any future proposal to do so requires another ADR.

## 25. Relationship to Step 0–4

This ADR does not change Step functions, persistence, gating, Adaptive Cycle, sufficiency, reviews, evidence or validators.

Negative rules:

```text
Handoff Accept ≠ Step activation
Assigned Challenge Start ≠ Step activation
```

## 26. Consequences

Positive:
- no fictitious Initiative for challenge-only assignment;
- one durable handoff identity;
- explicit Accept/Reject/Start;
- enforceable team rules;
- clean Portfolio projection;
- future assignment→initiative correlation;
- quarantined legacy path.

Cost:
- new bounded persistence;
- compatibility/migration code;
- legacy caller inventory;
- explicit separation of invitation delivery and assignment lifecycle.

## 27. Rejected shortcuts

Do not:
- make ChallengeInvitation the permanent full aggregate merely to avoid persistence;
- create Project on Accept;
- create Project on Assigned Challenge Start inside this workstream;
- map `confirmado` to `started`;
- make PortfolioHandoffProjection writable;
- let frontend route state define lifecycle;
- use legacy route as fallback;
- infer Initiative Owner from team ordering;
- auto-backfill missing legacy facts.

## 28. Implementation gate unlocked by ADR acceptance

After ADR acceptance, Technical Design may re-evaluate implementation readiness for:

```text
H-TECH-02 Assignment persistence and team invariants
H-TECH-03 Identity continuation and claim
H-TECH-04 Invitation lifecycle and delivery
H-TECH-05 Accept, Reject and Portfolio response
H-TECH-06 Handoff Shell and Activation Overview
H-TECH-07 Start boundary
H-TECH-08 Portfolio projection and semantic events
H-TECH-09 Legacy route quarantine
```

ADR acceptance does not automatically mean GO. Technical Design must be updated.

## 29. Acceptance criteria

- [ ] `PortfolioHandoffAssignment` is the canonical handoff lifecycle source of truth.
- [ ] It is bounded and is not a new Initiative Core aggregate.
- [ ] `Project` remains the current Initiative identity.
- [ ] Assigned Challenge may exist with no Initiative.
- [ ] Accept does not create Project.
- [ ] Accept does not Start.
- [ ] Assigned Challenge Start does not create Project/Steps in this workstream.
- [ ] `handoff_assignment_started != initiative_started`.
- [ ] exactly one Initiative Owner is required.
- [ ] execution team maximum is 3 including Owner.
- [ ] invitation identity and assignment acceptance remain separate.
- [ ] PortfolioHandoffProjection is derived/read-only.
- [ ] `/projects/new?challengeId=...` is not canonical for the new handoff.
- [ ] legacy route has quarantine and retirement strategy.
- [ ] existing materialized Projects are preserved.
- [ ] no Step 0–4 behavior changes.
- [ ] no AI/human authority changes.
- [ ] Technical Design can now specify persistence/schema/API changes without redefining product semantics.

## 30. Status / next action

Current:

```text
PROPOSED — ADR DESIGN ONLY
```

Next:

```text
review ADR
→ accept / amend / reject
→ add to ADR index
→ update Technical Design
→ re-run GO / NO-GO
```

Do not implement H-TECH-02+ until this ADR is accepted and Technical Design is re-evaluated.
