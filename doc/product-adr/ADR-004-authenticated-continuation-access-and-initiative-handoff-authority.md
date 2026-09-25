# ADR-004 — Authenticated Continuation Access and Initiative Handoff Authority

**Estado:** PROPOSED — ADR DESIGN ONLY  
**Fecha:** 2026-09-25  
**Slice:** Authenticated continuation / Initiative handoff authority  
**Decide:** minimum server-owned authority for Public Entry continuation and
direct Initiative / Steps exception  
**No autoriza:** productive implementation, schema changes, route changes,
permission changes, invitation changes, or UX changes

## 1. Decision summary

Starteria adopts **Option C** for default authenticated Public Entry
continuation:

```text
verified authenticated identity
+ server-owned Public Entry session ownership
→ provisional Portfolio-oriented continuation context
```

This context is **not** canonical Portfolio membership, Portfolio Lead
authority, organization authority, or Initiative ownership.

Organization membership and tenant scope must be validated before the system
exposes organization-scoped Portfolio data or performs organization-scoped
actions. Registration never grants organizational authority automatically.

Direct Initiative / Steps continuation remains an explicit exception and
requires all applicable server-owned evidence defined in Section 6. No actor
currently receives unconditional Initiative-invitation issuer authority from
this ADR. Issuer authority is a conditional organizational decision attached
to the target context and an explicit server-owned authorization policy.

## 2. Context and authority status

This ADR is based on:

- `CURRENT_STATE.md`;
- `STARTERIA_V2_MANIFEST.md`;
- `docs/STARTERIA_AUTHORITY.md`;
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`;
- `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`;
- `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_SERVER_OWNED_CONTEXT_AND_INVITATION_AUDIT_v0.1.md`;
- the current auth, permission, Portfolio Entry, invitation, pilot-claim, and
  Project/Initiative implementation evidence.

The request describes Core v0.3 as canonical. The checkout authority record
currently describes Core v0.3 as candidate / requiring re-test. This ADR does
not silently promote that document; it preserves the repository's factual
status and applies the requested Core boundary as the target assumption for
this decision.

## 3. Problem

Authentication establishes `USER_IDENTITY`. It does not by itself establish:

- canonical business context;
- organization authority;
- Portfolio membership or Portfolio Lead responsibility;
- Initiative ownership;
- invitation issuer authority;
- permission to enter Initiative / Steps.

The current repository contains both a provisional Portfolio Entry session
model and legacy flows that can materialize Project/Step state. The ADR must
prevent those legacy assumptions from becoming the new canonical authority
model.

## 4. Options evaluated for default continuation

### Option A — identity plus organization membership

```text
authenticated user
+ validated OrganizationMember
→ provisional Portfolio-oriented continuation
```

Rejected as the default decision. It is stronger for tenant isolation than
identity alone, but organization membership does not prove Portfolio access,
Portfolio Lead responsibility, or that the current Public Entry context is
canonical. It would also make membership look like business canonicalization.

### Option B — identity, organization membership, and explicit Portfolio access

```text
authenticated user
+ validated OrganizationMember
+ explicit Portfolio membership/access
→ Portfolio continuation
```

Not selected for the first authenticated continuation boundary. It is the
appropriate requirement for organization-scoped Portfolio operations, but the
current repository does not define one consistent server-owned Portfolio
membership/access object or its provisioning lifecycle. Selecting it as the
entry prerequisite would make the current unknown-role path impossible without
inventing a missing model.

### Option C — separate provisional continuation context

```text
authenticated user
+ server-owned ownership of the claimed Public Entry session
→ provisional Portfolio-oriented continuation
```

**Selected.** It preserves the provisional truth across authentication,
supports UX continuity, avoids silent business canonicalization, and keeps
organization-scoped data behind a separate tenant-membership check.

Option C means a provisional authenticated experience, not canonical Portfolio
membership. It may show context-establishment and confirmation affordances,
but it must not imply that the user is a Portfolio Lead or has authority to
read/write an organization's Portfolio.

## 5. Selected minimum Portfolio access model

The minimum server-owned facts for the default continuation are:

1. verified authenticated identity;
2. a Public Entry session claimed/owned by that identity;
3. valid session lifecycle and revision/ownership checks;
4. the provisional Entry context preserved without role canonicalization.

Before any organization-scoped Portfolio read or write, the system additionally
requires:

1. a server-validated `OrganizationMember` relationship for the target
   organization; and
2. the applicable server-derived Portfolio capability/access for that scope.

Organization membership alone is not Portfolio Lead authority. A provisional
session alone is not organization membership. Registration alone is neither.

The selected model therefore separates:

```text
authenticated provisional continuation
≠
canonical Portfolio membership
≠
Portfolio Lead authority
```

## 6. Initiative / Steps exception invariant

Direct Initiative / Steps continuation is permitted only when all applicable
conditions below are true:

1. verified authenticated identity exists;
2. organization scope is validated for the target Initiative;
3. a canonical Initiative identifier exists (currently the repository's
   Project identity where that remains the factual domain representation);
4. the user has an eligible server-owned relationship to that Initiative,
   such as owner, active team membership, or accepted target-specific
   assignment;
5. an authorized handoff/invitation exists and binds the intended recipient,
   target, role, issuer, and contract/version state;
6. the invitation/handoff is valid: not expired, revoked, declined, or
   consumed incompatibly;
7. required acceptance/confirmation has occurred where the handoff contract
   requires it;
8. the server-derived permission for the requested Initiative action exists;
9. revision, idempotency, and handoff-version checks pass where applicable;
10. the Initiative has crossed the explicit Start boundary before Steps are
    entered.

If any required condition is absent, the system must not route directly to
Initiative or Steps. It must preserve the provisional context and use the
default Portfolio-oriented continuation or an explicit confirmation/error
state.

Invitation acceptance does not itself grant permissions. A valid invitation
cannot bypass organization scope, resource membership, or action permission.
An invitation is not an active Initiative, and Accept is not Start.

## 7. Invitation issuer authority

This ADR defines the required authority conceptually without creating a new
global role or permission:

```text
issuer authority = server-owned organizational/resource authority for the
target Initiative or Portfolio context, explicitly authorized to issue that
handoff under the applicable policy
```

The issuer must be recorded and validated against the target scope. A global
role label is insufficient by itself.

### 7.1 Existing actors

| Actor | Status | Decision |
|---|---|---|
| Portfolio Lead | `CONDITIONAL` | May be an issuer only when the server has established Portfolio/organization scope and an explicit invitation capability for the target context. The current global `portfolio:write` role is not, by itself, proof of Initiative invitation authority. |
| Initiative Owner | `CONDITIONAL` | May be an issuer only when the user is the server-owned owner of the canonical target Initiative and an explicit target policy allows owner-issued handoff. Existing Project ownership alone does not establish the policy. |
| Organization admin | `CONDITIONAL` | May be an issuer only when the organization policy grants Initiative-handoff authority for the target scope. `OrganizationMember.role = admin` alone is not enough until that policy is defined. |
| Sponsor | `NOT_AUTHORIZED` by default | Sponsor checkpoint/review responsibility does not imply invitation issuer authority. Sponsor can become `CONDITIONAL` only through an explicit target-scoped organizational policy, not through the Sponsor label. |
| System transition | `CONDITIONAL` | May issue only a deterministic, server-triggered handoff defined by an approved transition policy, with auditability, target identity, recipient binding, and idempotency. It cannot infer authority from AI or conversation. |

No existing actor is proven as an unconditional issuer by the current
repository evidence. The active invitation service does not yet enforce the
candidate schema's issuer, target, recipient, lifecycle, or `ownerCanInvite`
fields. This ADR therefore does not authorize any current invitation route.

## 8. Sponsor boundary

Only the boundary needed here is decided:

- Sponsor is not a universal Initiative inviter;
- Sponsor is not a universal approver of continuation;
- Sponsor is not the default Public Entry destination;
- Sponsor checkpoint authority remains limited to an explicitly assigned,
  resource-scoped checkpoint/review responsibility;
- any Sponsor-issued handoff would require a separate explicit organizational
  policy and target assignment.

The broader Sponsor model is out of scope.

## 9. Unknown-role invariant

When:

```text
authenticated identity exists
+ no authoritative business context exists
```

the canonical target behavior is:

```text
preserve provisional Public Entry context
→ continue to provisional Portfolio-oriented context establishment
→ do not assign a role
→ do not create Project
→ do not create Initiative
→ do not enter Steps
```

Under Option C, the default destination is a provisional authenticated
Portfolio-oriented continuation experience. It is not Portfolio membership
and must not expose organization-scoped data until organization scope and
applicable access are validated.

## 10. Forbidden behaviors

The following are forbidden as canonical behavior under this ADR:

- registration granting Portfolio authority automatically;
- registration creating organization membership unless a separate approved
  membership policy explicitly says so;
- AI-inferred role controlling routing or permissions;
- self-declared role controlling privileged routing;
- direct Initiative continuation without canonical Initiative context;
- invitation issuance without server-owned issuer authority;
- invitation acceptance bypassing required organization or action permissions;
- treating a valid invitation as equivalent to Start;
- using a legacy Project/pilot owner assumption as canonical business truth;
- using `User.role` or a Sponsor label as a substitute for target-scoped
  ownership or assignment;
- converting provisional Public Entry language into canonical Portfolio,
  Initiative, or Steps state.

## 11. Legacy isolation

The following are explicitly prevented from defining the new authority model:

| Surface | Classification | ADR treatment |
|---|---|---|
| `/auth/continue/:draftId` | `DEPRECATION_TARGET` | Historical public-draft continuation is not authority for the new flow. Retirement is deferred. |
| `/public/continuar` | `COMPATIBILITY_ONLY` | Pilot resume link may remain for compatibility; it cannot establish Portfolio or Initiative authority. |
| `/continuar-piloto` | `DEPRECATION_TARGET` | Legacy pilot continuation cannot define the canonical route. |
| Pilot claim | `COMPATIBILITY_ONLY` | Valid hashed, expiring claim may authorize the existing pilot compatibility flow only; it is not an Initiative invitation or Portfolio handoff. |
| `createProjectFromPublicDraft` | `DEPRECATION_TARGET` | It cannot be used as the canonical Public Entry continuation authority. |

Legacy retirement and route deletion are out of scope. Keeping a compatibility
consumer does not promote its semantics to V2 authority.

## 12. Product Handoff Contract impact

The future Product Handoff Contract may assume:

### Authenticated identity

It may rely on the verified authenticated user identity and server-owned
session ownership. It may not infer business role from identity alone.

### Organization scope

It may include organization scope only after server validation of membership
for the target organization. Absent validated scope, the handoff remains
provisional and must not expose tenant data.

### Portfolio access

It may distinguish provisional Portfolio-oriented continuation from canonical
Portfolio access. Canonical Portfolio reads/writes require the applicable
server-derived capability for the validated scope.

### Initiative context

It may rely on a canonical Initiative/Project id only when the target exists
and the user's eligible relationship is server-established. Public Entry text,
AI suggestions, or registration cannot supply this field as canonical truth.

### Invitation/handoff state

It may rely on invitation/handoff state only when issuer, recipient, target,
validity, acceptance, version, and idempotency facts are server-validated. A
future payload must not treat invitation creation as acceptance or Start.

### Permissions

It may rely on server-derived permissions for the requested action. Client
claims, user labels, invitation labels, and AI output are not permission
sources.

This section defines input authority categories only; it does not define the
full handoff payload.

## 13. Consequences

### Positive

- Authentication remains distinct from business canonicalization.
- Unknown-role users retain continuity without receiving invented authority.
- Tenant isolation is explicit before organization-scoped Portfolio access.
- Initiative/Steps routing has a strong negative guard.
- Existing infrastructure may be reused only behind explicit compatibility and
  target-scoped authority checks.
- Sponsor is prevented from becoming universal authority by implication.

### Costs and remaining work

- A future implementation must define the server-owned Portfolio access
  mechanism for organization-scoped work.
- A future invitation slice must define and enforce issuer policy, recipient
  binding, target scope, lifecycle, acceptance, version, and idempotency.
- The current candidate invitation schema and active service must be
  reconciled before implementation.
- Legacy consumer retirement remains a separate slice.

## 14. Decision status and next authority gate

**Decision status:** `PROPOSED`; not implementation-authorizing until accepted.

**Additional ADR still required:** NO for the two boundaries covered here if
this ADR is accepted. Separate ADR or amendment remains required if the chosen
Portfolio access mechanism introduces a materially different role, membership,
or tenant-authority model.

**Next authority gate:** accept/reject ADR-004, then define the smallest
implementation slice for server-owned provisional continuation and the
target-scoped invitation issuer contract. No runtime work is authorized by
this document alone.
