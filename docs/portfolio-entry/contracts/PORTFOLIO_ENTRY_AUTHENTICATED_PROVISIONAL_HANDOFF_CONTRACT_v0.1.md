# Starteria — Public Entry → Authenticated Provisional Handoff Contract v0.1

**Estado:** PROPOSED — CONTRACT DESIGN ONLY  
**Fecha:** 2026-09-25  
**Slice:** Public Entry → authentication → provisional continuation  
**Authority:** Core v0.3 target, ADR-003, ADR-004, frozen Public Entry candidate  
**Implementation:** NOT AUTHORIZED by this document

## 1. Purpose and boundary

This contract preserves one Public Entry session across authentication and
enters an authenticated provisional continuation. It does not create or
canonicalize business entities.

```text
public session
  → authentication / registration / login
  → authenticated claim of the existing session
  → AUTHENTICATED_PROVISIONAL_CONTINUATION
```

The contract preserves the existing session's context and provenance. It does
not rerun cognition merely because authentication occurred. It does not grant
organization membership, Portfolio authority, Initiative ownership, or Steps
access.

Direct Initiative / Steps continuation is explicitly outside v0.1.

## 2. Existing repository identifiers

The contract uses only identifiers already evidenced in the repository:

| Contract concept | Existing identifier / field | Meaning |
|---|---|---|
| Handoff/session id | `PortfolioEntrySession.id` | Canonical persisted Public Entry session identifier. |
| Public Entry session/draft id | Same `PortfolioEntrySession.id` | This slice does not introduce a second draft id. |
| Anonymous/public origin | `PortfolioEntrySession.entryOrigin`, `rawEntry`, `sourceMetadata`, and the session's `publicAccessTokenHash` | The raw public token is never carried or exposed by the handoff; only its server-side hash exists in persistence. |
| Authenticated claimant | `PortfolioEntrySession.ownerUserId` | Set to the verified authenticated `User.id` on claim. |
| Claim state | `PortfolioEntrySession.ownershipState` | Existing states include `ANONYMOUS` and `CLAIMED`. |
| Handoff record | `PortfolioEntryHandoff.id` | Versioned handoff record for the session. |
| Handoff version | `PortfolioEntryHandoff.version` | Existing per-session version. |
| Confirmation record | `PortfolioEntryConfirmation.id` | User confirmation/correction record linked to a handoff. |
| Confirmation version | `PortfolioEntryConfirmation.version` | Existing per-session confirmation version. |
| Confirmation time | `PortfolioEntryConfirmation.confirmedAt` | Set only for a `CONFIRMED` confirmation. |
| Contract/runtime/schema versions | `PortfolioEntrySession.contractVersion`, `runtimeVersion`, `schemaVersion`; and corresponding Handoff fields | Existing version metadata. |
| Optimistic concurrency | `PortfolioEntrySession.revision` and `expectedRevision` inputs | Existing stale-write boundary. |
| Created time | `createdAt` on session/handoff/confirmation | Existing persisted timestamps. |

There is no existing persisted `claimedAt`, `claimId`, or generic
`originatingAnonymousSessionId` field in the audited model. v0.1 does not
invent or require any of them. The same `PortfolioEntrySession.id` remains the
identity across public access and authenticated claim.

## 3. Contract shape

The following is a proposed TypeScript-like contract, not an implementation or
schema migration.

```ts
type HandoffContractVersion = 'PORTFOLIO_ENTRY_AUTHENTICATED_PROVISIONAL_v0.1';

type ContinuationState =
  | 'PUBLIC_SESSION'
  | 'AUTHENTICATION_PENDING'
  | 'AUTHENTICATED_PROVISIONAL_CONTINUATION'
  | 'CONFIRMATION_REQUIRED'
  | 'CONFIRMED_PROVISIONAL_CONTINUATION'
  | 'RECOVERY_REQUIRED'
  | 'EXPIRED';

type InformationClass =
  | 'USER_PROVIDED'
  | 'USER_CONFIRMED'
  | 'AI_INFERRED_PROVISIONAL'
  | 'ORGANIZATIONAL_UNKNOWN'
  | 'LATER_WORK'
  | 'SYSTEM_AUTHORITY';

type Provenance = {
  informationClass: InformationClass;
  origin: string;
  sourcePath?: string;
  sourceTurnId?: string;
  sourceText?: string;
  capturedAt?: string;
  modelExecutionId?: string;
};

type ServerAuthorityEnvelope = {
  contractVersion: HandoffContractVersion;
  sessionId: string;                 // PortfolioEntrySession.id
  handoffId: string;                 // PortfolioEntryHandoff.id
  handoffVersion: number;            // PortfolioEntryHandoff.version
  confirmationId?: string;           // PortfolioEntryConfirmation.id
  confirmationVersion?: number;
  authenticatedUserId: string;       // verified User.id / ownerUserId
  ownershipState: 'CLAIMED';
  sessionLifecycle:
    | 'HANDOFF_READY'
    | 'AWAITING_CONFIRMATION'
    | 'REVISIONS_REQUESTED'
    | 'CONFIRMED';
  sessionRevision: number;
  sessionContractVersion: string;
  sessionRuntimeVersion: string;
  sessionSchemaVersion: string;
  handoffSchemaVersion: string;
  handoffRuntimeVersion: string;
  createdAt: string;
  confirmedAt?: string;
  organizationScope: 'UNRESOLVED' | 'VALIDATED_SEPARATELY';
  portfolioAccess: 'PROVISIONAL_ONLY' | 'VALIDATED_SEPARATELY';
  canonicalEntityCreated: false;
  directInitiativeContinuation: false;
};

type ProvisionalValue<T> = {
  value: T | null;
  provenance: Provenance[];
};

type ProvisionalContextPayload = {
  understoodNeed: ProvisionalValue<string>;
  desiredOutcome: ProvisionalValue<string>;
  rawPublicContext: ProvisionalValue<string>;
  knownContext: Array<{
    key: string;
    value: string;
    provenance: Provenance[];
  }>;
  userConfirmedCorrections: Array<{
    field: string;
    value: unknown;
    replaces?: unknown;
    provenance: Provenance[];
  }>;
  selectedMaterialGap: ProvisionalValue<string>;
  currentOpenItems: Array<{
    id: string;
    description: string;
    provenance: Provenance[];
  }>;
  laterWorkItems: Array<{
    id: string;
    description: string;
    provenance: Provenance[];
  }>;
  authorityOwnedUnknowns: Array<{
    gapId: string;
    description: string;
    requiredAuthority: 'ORGANIZATIONAL_AUTHORITY_REQUIRED';
    provenance: Provenance[];
  }>;
  suggestedNextMove: ProvisionalValue<string>;
  continuationSummary: ProvisionalValue<string>;
  provenanceSourceReferences: Provenance[];
};

type DecisionConversionMetadata = {
  handoffStatus: 'ready' | 'ready_with_uncertainty' | 'insufficient_input';
  decisionToEnable: ProvisionalValue<string> | { value: 'unresolved'; provenance: Provenance[] };
  recommendedApproach?: {
    description: string;
    rationale?: string;
    assumption?: string;
    provenance: Provenance[];
  };
  evidenceOrClarityNeeded: Array<ProvisionalValue<string>>;
  starteriaPath: Array<{
    action: 'structure' | 'make_visible' | 'compare_or_follow' | 'resolve_gaps' | 'prepare_decision';
    description: string;
    provenance: Provenance[];
  }>;
  conversionEligible: false;
  initiativeProfileSelected: false;
};

type AuthenticatedProvisionalHandoff = {
  authority: ServerAuthorityEnvelope;
  context: ProvisionalContextPayload;
  decisionMetadata: DecisionConversionMetadata;
  continuationState: ContinuationState;
  noRepeat: {
    mustPreserve: string[];
    mayReconfirm: string[];
    mustNotAssume: string[];
  };
};
```

`handoffPayload` remains the existing versioned handoff record. This contract
defines the safe projection and classification around it; it does not require
renaming existing fields such as `understanding`, `desired_outcome`,
`known_context`, `unresolved_context`, `evidence_or_clarity_needed`,
`starteria_path`, or `provenance_summary`.

## 4. Information classes and field policy

### 4.1 REQUIRED

| Field | Class | Reason |
|---|---|---|
| `authority.sessionId` | `SYSTEM_AUTHORITY` | Preserves the one Public Entry session identity. |
| `authority.handoffId/version` | `SYSTEM_AUTHORITY` | Identifies the exact frozen handoff record. |
| `authority.authenticatedUserId` | `SYSTEM_AUTHORITY` | Binds continuation to verified identity. |
| `authority.ownershipState` | `SYSTEM_AUTHORITY` | Must be `CLAIMED`; prevents anonymous/other-user access. |
| `authority.sessionRevision` | `SYSTEM_AUTHORITY` | Protects stale writes. |
| `authority.contract/schema/runtime versions` | `SYSTEM_AUTHORITY` | Prevents interpreting a record under an incompatible contract. |
| `authority.createdAt` | `SYSTEM_AUTHORITY` | Preserves temporal identity/auditability. |
| `authority.organizationScope` | `SYSTEM_AUTHORITY` | Explicitly records unresolved scope rather than guessing. |
| `authority.portfolioAccess` | `SYSTEM_AUTHORITY` | Distinguishes provisional context from canonical access. |
| `authority.canonicalEntityCreated` | `SYSTEM_AUTHORITY` | Negative assertion for this contract. |
| `authority.directInitiativeContinuation` | `SYSTEM_AUTHORITY` | Negative assertion for this contract. |
| `context.understoodNeed` | Existing handoff output; usually `AI_INFERRED_PROVISIONAL` or `USER_CONFIRMED` | Required to resume without restarting. |
| `context.desiredOutcome` | `USER_PROVIDED`, `AI_INFERRED_PROVISIONAL`, or `USER_CONFIRMED` | Carries user intent with provenance. |
| `context.rawPublicContext` | `USER_PROVIDED` | Preserves original public input. |
| `context.knownContext` | Mixed, each item individually provenanced | Carries useful known context without flattening source. |
| `context.currentOpenItems` | Mixed, individually provenanced | Prevents loss of unresolved current work. |
| `context.laterWorkItems` | `LATER_WORK` | Preserves deferred work without blocking continuation. |
| `context.authorityOwnedUnknowns` | `ORGANIZATIONAL_UNKNOWN` | Preserves what requires external authority. |
| `context.continuationSummary` | `USER_CONFIRMED` or `AI_INFERRED_PROVISIONAL` | Gives the user a concise resume point. |
| `context.provenanceSourceReferences` | Mixed | Keeps source traceability. |
| `decisionMetadata.handoffStatus` | `SYSTEM_AUTHORITY` over the stored handoff lifecycle | Indicates whether the handoff is usable without inventing certainty. |
| `decisionMetadata.decisionToEnable` | Mixed or unresolved | Carries the decision context without canonicalizing it. |
| `decisionMetadata.evidenceOrClarityNeeded` | Mixed | Preserves next clarification/evidence needs. |
| `continuationState` | `SYSTEM_AUTHORITY` | Explicit state machine boundary. |

### 4.2 OPTIONAL

The following may be carried when present in the frozen candidate and valid
under the same contract/version:

- `context.selectedMaterialGap`;
- corrected fields and their replaced provisional values;
- `recommendedApproach` and alternatives, always marked `AI_INFERRED_PROVISIONAL`
  or `AI_SUGGESTED` through provenance and never canonicalized;
- `decisionMetadata.starteriaPath`;
- `sourceTurnId` from `PortfolioEntryHandoff.sourceTurnId`;
- `confirmationId`, `confirmationVersion`, and `confirmedAt` when a
  confirmation record exists;
- `promptManifestId` as diagnostic/version metadata;
- locale and non-authoritative source metadata already held by the session.

### 4.3 DO_NOT_CARRY

The contract must not carry or expose as handoff authority:

- raw `publicAccessToken` (only `publicAccessTokenHash` exists server-side);
- password, refresh token, OAuth credential, or secret;
- inferred role, inferred organization, inferred Sponsor, or inferred owner as
  a canonical field;
- client-provided permissions or claims;
- invitation issuer, Initiative id, Project id, or Steps route for this v0.1
  provisional contract;
- `PortfolioEntryProfile.INITIATIVE_ENTRY` as a routing instruction;
- `conversionId`, `projectId`, or Adaptive Core identifiers;
- AI confidence treated as permission or confirmation;
- unscoped tenant records;
- internal model prompts or private provider payloads;
- stale handoff versions not selected by the server;
- arbitrary user text represented as `SYSTEM_AUTHORITY`;
- fields whose provenance cannot be determined.

## 5. Frozen cognition boundary

Authentication and claim are identity/session transitions, not reasoning
events. The handoff must use the latest valid persisted handoff and session
semantic state. It must not:

- rerun the model because the user registered or logged in;
- reinterpret the same raw entry under a new role assumption;
- upgrade `AI_INFERRED_PROVISIONAL` to `USER_CONFIRMED` automatically;
- regenerate `known_context`, gaps, or recommendations merely because
  `ownerUserId` was set;
- delete or flatten provenance during claim.

A later user correction is a distinct user action and may create a new
confirmation/revision under the existing session lifecycle.

## 6. Claim/auth boundary

The existing repository provides the following safe boundary:

1. Public access identifies the session using `sessionId` plus a raw public
   token that is hashed with `hashPublicAccessToken`; the raw token is not
   persisted.
2. The session must be active and `ownershipState === ANONYMOUS` for public
   access.
3. Authentication supplies the verified `User.id`.
4. Claim attempts `claimOwnership(sessionId, ownerUserId, expectedRevision)`.
5. The repository requires an active session, `ANONYMOUS` state, no existing
   `ownerUserId`, and matching `revision`; the successful update sets
   `ownerUserId`, `CLAIMED`, and increments `revision`.
6. Only the claimed owner may read the authenticated session or continue it.

Required invariants:

- a different user cannot claim an already claimed session;
- a public UUID alone cannot authorize public access;
- the claim is a compare-and-set operation on ownership and revision;
- repeated claim attempts do not create a second session or a second owner;
- authentication changes identity/session ownership only;
- authentication does not confirm business truth or organizational unknowns;
- authentication does not create Project, Initiative, Steps, Organization, or
  Portfolio membership.

The repository's current claim operation is single-owner and revision-safe,
but an already-claimed same-user retry currently resolves through the existing
ownership guard rather than a separately documented idempotent claim response.
The future implementation must preserve the same owner and return the existing
owned session/continuation deterministically, without a duplicate record.

## 7. Provisional continuation state

After a valid claim, the safe target state is:

```text
AUTHENTICATED_PROVISIONAL_CONTINUATION
```

It is conceptually Portfolio-oriented but is not canonical Portfolio
membership. In this state the user may:

- review what Starteria understood;
- inspect raw context and provenance suitable for user display;
- correct their own statements;
- confirm user-owned interpretation;
- see current open items, later work, and authority-owned unknowns;
- continue preparation and context establishment;
- enter a later authorized organization/Portfolio access flow.

The user must not, solely because of this state:

- access tenant Portfolio data without validated scope and capability;
- create or be redirected to canonical Project/Initiative/Steps;
- assign organizational roles or ownership;
- confirm another actor's management, Sponsor, committee, or organization
  truth;
- use AI suggestions as permission or business authority.

## 8. Confirmation semantics

“Esto es lo que entendimos — confirmar/corregir” means:

```text
the user confirms or corrects the interpretation of their own submitted
context for purposes of this provisional handoff
```

For a field the user is competent to confirm, a new confirmation record may
move its information class from:

```text
AI_INFERRED_PROVISIONAL → USER_CONFIRMED
```

The transition must preserve the prior value, correction, provenance, user
identity, confirmation version, and `confirmedAt` where status is
`CONFIRMED`. It does not change the session's organization scope or grant a
permission.

The following cannot be upgraded by this confirmation:

```text
ORGANIZATIONAL_UNKNOWN → confirmed organizational fact
```

Examples include organization membership, Portfolio Lead appointment,
Initiative ownership, Sponsor authority, committee approval, invitation issuer
authority, and another actor's mandate. Those require the corresponding
server-owned organizational source.

## 9. No-repeat invariant

### MUST_PRESERVE

- same `PortfolioEntrySession.id`;
- raw/public context;
- latest valid versioned handoff;
- understood need and desired outcome with provenance;
- known context and current gaps;
- user-confirmed corrections;
- later work items;
- authority-owned unknowns;
- continuation summary and suggested next move;
- session lifecycle, ownership, and revision metadata;
- decision/conversion metadata needed to resume safely.

### MAY_RECONFIRM

- the user may reconfirm the displayed summary if the product requires an
  explicit confirmation step;
- fields with ambiguous or changed user meaning may be corrected;
- stale display state may be refreshed from the latest server handoff;
- user-owned claims may be reviewed again after a revision conflict.

Reconfirmation must not be presented as asking the user to start the Entry
again.

### MUST_NOT_ASSUME

- authentication confirms the handoff;
- registration grants Portfolio authority;
- a user is a Portfolio Lead, Sponsor, Initiative Owner, or organization
  member because the text sounds like one;
- organization scope exists because a user named an organization;
- an Initiative or Project exists;
- Steps are ready;
- AI inference is user confirmation;
- the previous public session is safe to attach without token/ownership and
  revision checks.

## 10. Failure and recovery behavior

| Condition | Contract result | Required recovery |
|---|---|---|
| Registration succeeds, continuation fails | `RECOVERY_REQUIRED`; preserve session id and last server revision; no entity creation | Re-fetch/retry claim or continue from the owned session. Do not rerun cognition automatically. |
| Login succeeds, claim fails | No provisional claim is granted | Retry with the same session and expected revision; show ownership/conflict/expiry result. Do not create a new Entry by default. |
| Stale Public Entry revision | Conflict using existing revision semantics (`PORTFOLIO_ENTRY_SESSION_CONFLICT` where applicable) | Reload latest session/handoff; preserve user input for explicit reconciliation, not blind overwrite. |
| Already-claimed session | Same owner: return/recover existing owned session deterministically; different owner: reject | Never transfer ownership implicitly; require the existing owner or an explicit future recovery policy. |
| Different user attempts claim | Reject as unauthorized/invalid ownership claim | Do not expose provisional payload or mutate owner. |
| User abandons and returns | Preserve session while active; if `ABANDONED` or expired, return recovery/expired state | Re-enter only through an explicit supported recovery path; do not duplicate or reset the original session silently. |
| Duplicate submission | Use existing session `revision` compare-and-set and operation idempotency where the continuation operation requires it | Return the existing result or conflict; never create duplicate handoffs/confirmations/entities. |
| Expired/revoked handoff | `EXPIRED` or recovery/error state; no continuation authorization | Require a new valid handoff only through a future approved flow; do not reinterpret an expired record. |

The contract does not introduce new retry stores, claim tokens, or idempotency
infrastructure. It reuses existing session revision, unique per-session
handoff/confirmation versions, and the existing continuation idempotency
concept where a future implementation exposes that operation.

## 11. Initiative exception

Direct Initiative / Steps routing is **disabled** by this contract.

Even if an authenticated user confirms the provisional summary, the result
remains:

```text
PORTFOLIO_ORIENTED_PROVISIONAL_CONTINUATION
```

unless a future, separately authorized flow supplies the complete ADR-004
server-authoritative evidence. This v0.1 contract does not solve invitation
authority, does not accept an invitation, and does not route to Initiative or
Steps.

## 12. Negative invariants

The contract normatively encodes:

```text
REGISTRATION != CONFIRMATION
AUTHENTICATION != PORTFOLIO_AUTHORITY
HANDOFF != CANONICALIZATION
USER_CONFIRMATION != ORGANIZATIONAL_AUTHORITY
PROVISIONAL_CONTINUATION != PROJECT_CREATION
PROVISIONAL_CONTINUATION != INITIATIVE_CREATION
PROVISIONAL_CONTINUATION != STEPS_ENTRY
```

## 13. Relationship to existing candidate handoff

The frozen candidate `PortfolioEntryHandoffV2` fields remain the cognition
output source: `understanding`, `desired_outcome`, `decision_to_enable`,
`known_context`, `unresolved_context`, `gap_resolution_map`,
`evidence_or_clarity_needed`, `starteria_path`, `recommended_cta`, and
`provenance_summary`. Their values remain provisional unless the confirmation
record explicitly records user confirmation of a user-owned claim.

The contract deliberately does not carry the full `semanticState` blindly.
Only the safe projection in Section 4 is exposed as handoff context; internal
question budgets, model execution details, raw prompts, and operational state
remain server-side diagnostics.

## 14. Status

This is a proposed contract. It is not an approved schema, API, route, runtime
behavior, or permission grant. Productive implementation requires acceptance of
ADR-003/ADR-004 and a separate implementation slice with executable NEG-01–
NEG-04 tests.
