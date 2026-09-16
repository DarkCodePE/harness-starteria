# PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1

**Status:** Acceptance checklist for H-0 documentation freeze
**Scope:** Portfolio / Challenge -> Invitation -> Accept -> Initiative Overview -> Start
**Out of scope:** Internal Initiative Core / Steps 0-4 behavior after Start

This checklist protects implementation conformance to:

- `PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md`
- `STARTERIA_CORE_LOGIC_CONTRACT.md`, especially Portfolio -> Initiative activation readiness
- `PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md`

The current-state audit is evidence only. It is not functional authority.

## 1. Lifecycle Invariants

Every implementation slice must preserve:

- `Invitation != Initiative`
- `Accept != Start`
- `Accept != Step 0 active`
- `Owner assignment != Core active`
- `Challenge link != Step initialization`

The only canonical target sequence for this bounded context is:

```text
Invitation -> Accept -> pre_start -> Start -> Initiative Core
```

## 2. Challenge-Only Path

Required sequence:

```text
Challenge -> Invitation -> Accept -> one Initiative pre_start
```

Acceptance criteria:

- Sending an invitation does not create an Initiative/Project.
- Viewing an invitation does not create an Initiative/Project.
- Accepting a challenge-only invitation creates at most one Initiative shell for that accepted invitation.
- Retrying Accept is idempotent and returns the same Initiative shell.
- No Step is active before Start.
- No Initiative Core cycle is active before Start.
- No Portfolio projection counts pending invitations as active initiatives.

## 3. Existing Initiative Path

Required sequence:

```text
Existing Initiative -> Invitation -> Accept -> same Initiative
```

Acceptance criteria:

- Accept does not create a duplicate Initiative/Project.
- Existing history is preserved.
- Existing Initiative context is preserved.
- Portfolio/Challenge traceability may be linked or updated without overwriting historical Initiative data.
- Retrying Accept is idempotent.

## 4. pre_start Boundary

Functional definition:

```text
Initiative exists
+ responsibility accepted
+ inherited context available where applicable
+ Core not started
```

Required protections:

- `pre_start` must not be represented in a way that the system can interpret as `en_step_0`.
- Do not freeze `currentStep = 0` as the canonical definition of `pre_start`.
- Do not freeze `step0Status = NOT_STARTED` as the canonical definition of `pre_start`.
- The exact technical representation is deferred to the implementation slice and any required ADR.
- Overview may show inherited context, team, sponsor context, known dependencies and support options.
- Overview must not initialize Adaptive Core, StepState, Step 0, or InitiativeCycle.

## 5. Start Boundary

Only Start may cross into Initiative Core.

Acceptance criteria:

- `startInitiative(initiativeId)` is explicit.
- Start is permission-checked.
- Start is idempotent.
- Start is auditable.
- Start is channel-independent.
- Start is safe against retry and double-click.
- Start uses the latest valid Initiative state/version.
- Only after successful Start may Starteria activate Initiative Core / Steps.

## 6. Channel Independence

Web, Starteria Copilot and future external assistants must use the same domain/application services for:

- `getMyStarteriaEntrySummary()`
- `listMyPendingInvitations()`
- `getInvitationOverview()`
- `acceptInvitation()`
- `declineInvitation()`
- `getInitiativeOverview()`
- `sendSupportRequest()`
- `startInitiative()`

No channel may create alternate lifecycle semantics, alternate permissions, or alternate state transitions.

## 7. Team Policy

MVP policy:

- exactly 1 `OWNER`;
- up to 2 additional core members;
- maximum 3 core members;
- roles: `OWNER`, `EDITOR`, `VIEWER`;
- `owner_can_invite = true | false`;
- viewers/observers may be outside the core limit only if the implementation can do this cleanly.

Do not introduce complex participant taxonomies in this bounded context.

## 8. UI / Overview

The implementation must use one state-aware Overview surface.

Required:

- avoid duplicated landing/readiness/overview pages;
- make clear what this is;
- make clear why it matters;
- make clear what the user should do now;
- one primary CTA per state:
  - Invitation -> Accept invitation
  - pre_start -> Start initiative
- secondary actions remain subordinate;
- use progressive disclosure for detail;
- avoid dashboard overload;
- do not require Initiative Owners to navigate Portfolio Lead governance screens.

## 9. Sponsor Semantics

Sponsor visibility is context only.

Required:

- Sponsor context may be shown when sourced from Strategic Front / Challenge / Initiative context.
- Sponsor visible does not imply Sponsor approval authority.
- Decision authority remains tied to the specific governance rule/decision.

## 10. Support Request

Minimum support request capability:

```text
Initiative Owner -> request support -> Portfolio Lead
```

Allowed need types:

- information;
- access;
- support from another area;
- decision;
- unblock.

Required:

- Do not build a ServiceNow/Jira-like workflow in this bounded context.
- Do not invent named approvers, deadlines, or gates not present in source context.

## 11. ADR Candidates Pending

These are intentionally not resolved by H-0:

- Project vs Initiative identity.
- Technical representation of `pre_start`.
- Challenge coverage/cardinality if contract and Core interpretation conflict.
- Exact moment of Step materialization.
- Canonical ownership if current `Project.ownerId` prevents the target semantics.

Implementation must stop and raise an ADR if any slice requires resolving one of these as a domain decision.

## 12. NO-GO Conditions

Any slice is NO-GO if it:

- treats Invitation as Initiative;
- treats Accept as Start;
- activates Step 0 from invitation, view, claim, or Accept;
- creates duplicate Initiatives for an existing Initiative invitation;
- creates an Initiative before Accept in the challenge-only path;
- makes Web and Copilot use different lifecycle commands;
- adds a new canonical `Initiative` entity/table without ADR;
- modifies Steps 0-4 behavior inside this bounded context.
