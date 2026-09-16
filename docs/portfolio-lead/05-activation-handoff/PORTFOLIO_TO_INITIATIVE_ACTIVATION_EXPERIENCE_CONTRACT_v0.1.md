# PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1

**Status:** Draft for implementation
**Scope:** Portfolio/Challenge â†’ Invitation â†’ Accept â†’ Initiative Overview â†’ Start
**Out of scope:** Internal logic of Initiative Core / Steps 0â€“4
**Primary purpose:** Freeze the user experience, domain semantics and handoff boundary before implementation.

---

## 1. Purpose

This contract defines the canonical Startería experience for handing off work from Portfolio Lead governance into an Initiative Owner experience.

The flow must preserve strategic traceability without forcing the Initiative Owner to understand Portfolio Lead mechanics.

The canonical journey is:

```text
Challenge / Existing Initiative
        â†“
     Invitation
        â†“
       Accept
        â†“
 Initiative Overview
        â†“
       Start
        â†“
========================
 Initiative Core / Steps
========================
```

Three actions MUST remain distinct:

```text
INVITE â‰  ACCEPT â‰  START
```

---

## 2. Product principle

Portfolio Lead decides **what should be activated and why**.

Initiative Owner receives only the context required to understand:

1. what they have been invited to work on;
2. why it matters;
3. what is expected from them;
4. what support/context already exists;
5. what action they can take next.

The Initiative Owner should not need to navigate Portfolio Lead governance structures to begin.

---

## 3. Canonical entry scenarios

### Scenario A â€” Invitation to an existing Initiative

```text
Existing Initiative
      â†“
Invitation
      â†“
Accept
      â†“
Owner / participant linked
      â†“
Initiative Overview
      â†“
Start, if not already started
```

Acceptance MUST NOT create a duplicate Initiative.

---

### Scenario B â€” Invitation to address a Challenge

```text
Challenge
   â†“
Invitation
   â†“
Accept
   â†“
Create Initiative in pre_start
   â†“
Accepted owner
   â†“
Initiative Overview
   â†“
Start
```

Acceptance MAY materialize the Initiative shell, but MUST NOT activate the Initiative Core.

---

## 4. Invitation semantics

An invitation represents:

> â€œStartería is asking this person to take responsibility for, or participate in, a specific piece of work connected to a Challenge or an existing Initiative.â€

The invitation is not an Initiative and is not proof that work has started.

### Minimum invitation information

- recipient email;
- inviter;
- Challenge reference;
- Strategic Front reference where applicable;
- target type:
  - `challenge_only`
  - `existing_initiative`
- existing Initiative reference when applicable;
- invitation role;
- current invitation status;
- creation date;
- expiration/revocation state if applicable.

### Minimum invitation lifecycle

```text
created
sent
viewed
accepted
declined
revoked
expired
```

Implementation may map legacy states during migration, but the experience must preserve these semantics.

---

## 5. Email-first and in-app access

The invitation must support an email-first flow.

### Existing Startería user

```text
Email / notification
      â†“
Open invitation
      â†“
Authenticated experience
      â†“
Invitation Overview
```

### Person without active Startería session/account

```text
Email
  â†“
Claim / authenticate
  â†“
Startería preserves invitation context
  â†“
Invitation Overview
```

Authentication MUST NOT lose the invitation context.

Startería SHOULD also surface the same invitation inside the product once the user is authenticated.

---

## 6. Invitation / Initiative Overview

Startería should avoid creating multiple intermediary pages.

A single Overview surface should evolve according to state.

### Before acceptance

The experience answers:

- What am I being invited to?
- Why does this matter?
- Who invited me?
- What outcome is expected?
- What relevant context already exists?
- What should I do now?

Primary actions:

```text
[Accept invitation]
[Decline]
```

---

### After acceptance, before Start

The same surface becomes the Initiative Overview.

It answers:

- What initiative am I responsible for?
- What Challenge / strategic objective is it connected to?
- What is the expected outcome?
- What relevant evidence/context is inherited?
- Who is involved?
- What support may be needed?
- What happens when I start?

Primary action:

```text
[Start initiative]
```

---

### After Start

The Overview becomes the stable Initiative home/summary surface.

The detailed Initiative Core / Steps experience is outside this contract.

---

## 7. Acceptance semantics

`Accept` means:

> the invited person explicitly accepts the proposed responsibility/participation.

Acceptance MUST be permission-checked and idempotent.

### Existing Initiative

On Accept:

- do not create another Initiative;
- link/update the accepted participant or owner;
- preserve Portfolio/Challenge traceability;
- update invitation status;
- emit the relevant domain/audit event.

### Challenge-only invitation

On Accept:

- materialize one Initiative shell if one does not yet exist for this accepted invitation;
- assign the accepted owner/participant;
- preserve Challenge and Strategic Front lineage;
- set Initiative lifecycle to a pre-start state;
- do not activate Initiative Core / Steps.

---

## 8. `pre_start`

`pre_start` represents:

> the Initiative exists and ownership has been accepted, but execution has not formally started.

It is a real lifecycle boundary.

In `pre_start`, Startería may prepare:

- inherited Challenge context;
- strategic rationale;
- expected outcome;
- relevant metrics;
- known evidence;
- team;
- sponsor context;
- known dependencies.

It MUST NOT imply Step execution has started.

---

## 9. Start semantics

`Start` is a separate explicit command.

Conceptually:

```text
startInitiative(initiativeId)
```

It MUST be:

- permission-checked;
- idempotent;
- auditable;
- channel-independent;
- safe against double-click/retry;
- based on the latest valid Initiative state/version.

Only after successful Start may Startería activate the Initiative Core.

This contract ends at the Start boundary.

---

## 10. New-from-Challenge vs existing/reconstructed Initiative

The Start command must preserve the distinction between:

### `new_from_challenge`

The Initiative was created from a Challenge invitation and begins with inherited strategic context.

### `existing_initiative`

The Initiative existed before the invitation and must preserve its existing history/state.

The handoff must not overwrite historical Initiative information just because Portfolio context is attached.

---

## 11. Team policy â€” MVP

Startería should keep team semantics deliberately simple.

### Core team

```text
1 owner
+ up to 2 additional core members
= maximum 3 core participants
```

Additional people may be represented as observer/viewer where needed.

### Roles

Reuse the simplest viable current role model:

```text
OWNER
EDITOR
VIEWER
```

Do not introduce additional participant taxonomies unless a validated use case requires them.

### Owner invitation rights

Portfolio configuration should be able to determine:

```text
owner_can_invite = true | false
```

---

## 12. Support request

The Initiative Owner must have a simple way to surface a dependency or request support.

The user-facing concept should be lightweight:

> â€œIf you need information, access, support from another area, or a decision to move forward, request support from your Portfolio Lead.â€

The MVP should avoid requiring an elaborate dependency workflow before Start.

Known dependencies may be displayed as context, for example:

> â€œThis initiative may require participation from Compliance.â€

Startería should not invent named approvers, deadlines or mandatory gates that are not present in the source context.

---

## 13. Sponsor semantics

Sponsor visibility does not imply universal approval authority.

Startería may show:

- Sponsor associated with the Strategic Front / Challenge;
- why the work matters;
- relevant sponsor context.

But:

```text
Sponsor visible â‰  Sponsor approves every decision
```

Decision authority must remain tied to the specific decision/governance rule.

The Sponsor is not the day-to-day operator of the Initiative.

---

## 14. Portfolio Lead projection

Portfolio must be able to distinguish at minimum:

```text
invited
accepted
pre_start
started
declined
expired/revoked
```

Portfolio views must not count an invitation as an active Initiative.

Challenge coverage and Initiative counts must remain semantically accurate.

---

## 15. Channel-independent interaction

Web UI, Startería Copilot and external assistant integrations must use the same domain services/commands.

No channel is allowed to create an alternate lifecycle.

Target common capabilities include:

```text
getMyStarteriaEntrySummary()
listMyPendingInvitations()
getInvitationOverview()
acceptInvitation()
declineInvitation()
getInitiativeOverview()
sendSupportRequest()
startInitiative()
```

All channels must observe the same permissions, idempotency rules and persisted state.

---

## 16. Contextual assistant entry

An assistant should not start with a generic greeting when Startería already knows what requires attention.

Example:

```text
Startería

Tienes:
1 reto pendiente de aceptar
2 iniciativas activas

¿Qué quieres revisar?

[El reto que me asignaron]
[Mis iniciativas]
[Lo que requiere mi atención]
```

When there is a single pending invitation:

> â€œTienes un nuevo reto pendiente de revisar. ¿Quieres que te muestre de qué se trata?â€

This requires a common contextual entry summary capability, not channel-specific hardcoded copy.

---

## 17. UI/UX guardrails â€” not a full UI redesign

A detailed visual redesign is intentionally deferred until the lifecycle and services are implemented/stable.

However, any implementation created now must respect these constraints so that technical work does not lock Startería into a dense interface.

### Visual hierarchy

Each screen/state should make three things immediately visible:

1. **What is this?**
2. **Why does it matter?**
3. **What should I do next?**

### Minimal information density

Default view should show only essential information.

Secondary detail should use progressive disclosure.

Avoid presenting every Portfolio field, dependency, metadata item or system status at the same visual level.

### One dominant action

Each state should have one visually dominant primary action:

```text
Invitation â†’ Accept
pre_start  â†’ Start
```

Secondary actions must remain visually subordinate.

### Above-the-fold target

The initial viewport should ideally contain:

- title / identity;
- one-line strategic context;
- expected outcome;
- current state;
- primary CTA.

Additional context can live below or behind expandable sections.

### Plain-language statuses

Prefer user-facing language over internal enum names.

### No dashboard overload

Do not solve this experience by adding more cards.

The target is clarity, not information volume.

---

## 18. Reuse vs adaptation rules

### KEEP

- Strategic Front domain;
- Challenge domain;
- backend-governed Challenge state machine;
- existing Portfolio permissions foundation;
- Portfolio projections where semantics remain correct;
- Project as the current canonical implementation identity for Initiative unless an ADR changes this;
- existing Initiative Overview as the base surface;
- current sponsor context where valid.

### ADAPT

- `ChallengeInvitation`;
- Challenge/Initiative team models;
- `ProjectService.createProject(challengeLink)` usage;
- Initiative Overview state rendering;
- Portfolio Initiative counts/status projections;
- role assignment during Challenge handoff.

### NEW

- email/claim invitation semantics;
- explicit acceptance command;
- canonical `pre_start`;
- explicit Start command;
- lightweight support request;
- common channel-independent handoff services;
- contextual assistant entry;
- invitation notification surface.

---

## 19. Explicitly prohibited shortcuts

The implementation MUST NOT:

1. treat `Invitation` as an Initiative;
2. treat `Accept` as `Start`;
3. activate Step 0 merely because a Challenge invitation was accepted;
4. create duplicate Initiatives when accepting an invitation to an existing Initiative;
5. create empty Initiatives simply to increase Portfolio coverage;
6. build separate lifecycle logic for Web vs LLM channels;
7. require the Initiative Owner to navigate Portfolio Lead governance screens;
8. expose all Portfolio metadata by default;
9. add a new `Initiative` aggregate/table without an explicit ADR;
10. modify internal Steps 0â€“4 behavior as part of this bounded-context implementation.

---

## 20. Implementation sequence

### H-0 â€” Contract + acceptance checklist
Freeze this experience and implementation invariants.

### H-1 â€” Invitation domain
Adapt persistence/schema/status semantics.

### H-2 â€” Delivery + claim/auth
Email-first access and authenticated continuation.

### H-3 â€” Unified Overview
State-aware Invitation / Initiative Overview.

### H-4 â€” Accept
Explicit idempotent acceptance command.

### H-5 â€” Team policy
Owner + two core members, owner invitation policy.

### H-6 â€” Support
Lightweight support request.

### H-7 â€” Start boundary
Explicit Start command and lifecycle transition.

### H-8 â€” Channel-independent surface
Expose the same capabilities for Startería assistant / external LLM integrations.

After H-8:

```text
STOP
```

Do not continue into Initiative Core / Steps without a separate contract/audit.

---

## 21. Acceptance criteria for the E2E

The bounded context is considered complete only when all of the following are true:

- Portfolio Lead can invite a person to a Challenge or existing Initiative.
- Invitation survives email/authentication handoff.
- User can understand the invitation without entering Portfolio screens.
- User can accept or decline.
- Accepting an existing Initiative does not duplicate it.
- Accepting a Challenge-only invitation creates at most one pre-start Initiative.
- Accept does not activate Steps.
- User lands on a clear Initiative Overview after acceptance.
- User can explicitly Start.
- Start is idempotent and is the only boundary that activates the Initiative Core.
- Portfolio can distinguish invitation, acceptance, pre-start and started states.
- Team policy is enforced consistently.
- Sponsor context is informative but does not create implicit approval authority.
- Support can be requested without a complex workflow.
- Web and assistant channels use the same persisted state and domain commands.
- UI presents the hierarchy of information with one dominant next action and without unnecessary information overload.

---

## 22. Architectural caution / ADR trigger

Current Startería implementation uses `Project` as the practical identity of an Initiative.

This contract does not authorize introducing a separate canonical `Initiative` entity.

If implementation requires:

```text
Project â‰  Initiative
```

stop implementation and raise an ADR before proceeding.

---

## 23. Authority relationship

This document defines the target experience and lifecycle for the Portfolio â†’ Initiative activation handoff.

The current-state audit is evidence/reference, not target authority:

`PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md`

Where the current implementation conflicts with this contract, classify the affected behavior as KEEP / ADAPT / NEW and implement only within the bounded context defined here.
