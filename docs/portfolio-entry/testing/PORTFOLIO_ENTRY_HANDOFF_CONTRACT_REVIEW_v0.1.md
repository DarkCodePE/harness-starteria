# Starteria — Public Entry → Authenticated Provisional Handoff Contract Review v0.1

**Fecha:** 2026-09-25  
**Estado:** REVIEW ONLY — proposed contract, no executable implementation  
**Contract under review:** `docs/portfolio-entry/contracts/PORTFOLIO_ENTRY_AUTHENTICATED_PROVISIONAL_HANDOFF_CONTRACT_v0.1.md`

## 1. Review guard

```text
repository_root: C:/Users/User/proyect-starteria/harness-starteria-clean
origin: https://github.com/DarkCodePE/harness-starteria.git
branch: feat/portfolio-entry-decision-readiness-harness
```

No backend, frontend, Prisma/schema, migration, route, permission, invitation,
AI, Portfolio, Initiative, Steps, or frozen harness implementation was changed.

## 2. Authoritative inputs reviewed

- `CURRENT_STATE.md`
- `STARTERIA_V2_MANIFEST.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`
- `doc/product-adr/ADR-004-authenticated-continuation-access-and-initiative-handoff-authority.md`
- `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_ADR003_RECONCILIATION_AND_NEGATIVE_GUARDS_v0.1.md`
- `front/prisma/schema.prisma`
- `backend/modules/portfolio-entry-runtime/domain/handoff.schema.ts`
- `backend/modules/portfolio-entry-sessions/application/portfolio-entry-session.service.ts`
- `backend/modules/portfolio-entry-sessions/infrastructure/prisma-portfolio-entry-session.repository.ts`
- `backend/modules/portfolio-entry-continuation/portfolio-entry-continuation.service.ts`

## 3. Identity and existing-field review

The proposed contract uses existing identifiers only:

| Contract field | Existing evidence | Review result |
|---|---|---|
| `sessionId` | `PortfolioEntrySession.id` | ACCEPTED |
| Public session origin | `entryOrigin`, `rawEntry`, `sourceMetadata`, server-side `publicAccessTokenHash` | ACCEPTED; raw token excluded |
| Authenticated owner | `ownerUserId` | ACCEPTED |
| Claim state | `ownershipState` (`ANONYMOUS` → `CLAIMED`) | ACCEPTED |
| Handoff identity/version | `PortfolioEntryHandoff.id`, `sessionId`, `version` | ACCEPTED |
| Confirmation identity/version | `PortfolioEntryConfirmation.id`, `handoffId`, `version` | ACCEPTED |
| Confirmation time | `confirmedAt` | ACCEPTED; only meaningful for `CONFIRMED` |
| Concurrency | `revision`, `expectedRevision` | ACCEPTED |
| Contract/runtime/schema versions | Existing session and handoff fields | ACCEPTED |
| `claimedAt`, generic `claimId`, separate origin session id | Not present in repository | CORRECTLY EXCLUDED |

## 4. Payload review

### REQUIRED

The contract requires the minimum safe resume set:

- session/handoff identity and versions;
- authenticated owner and `CLAIMED` state;
- session revision and lifecycle;
- preserved raw context;
- understood need and desired outcome;
- known context, current open items, later work;
- organizational unknowns;
- continuation summary and provenance;
- decision/conversion metadata without Initiative conversion;
- explicit provisional organization/access flags;
- negative assertions that no canonical entity or direct Initiative
  continuation exists.

**Review result:** ACCEPTED.

### OPTIONAL

- selected material gap;
- user corrections and replaced values;
- recommended/alternative approaches with provisional provenance;
- Starteria path;
- source turn, confirmation metadata, prompt manifest, locale.

**Review result:** ACCEPTED, provided optional values remain provenance-bound.

### DO_NOT_CARRY

- raw public access token and secrets;
- client permissions;
- inferred role, organization, Sponsor, owner, or Initiative;
- invitation/Initiative/Project/Steps authority;
- conversion and Adaptive Core identifiers;
- internal prompts/provider payloads;
- unknown-provenance fields.

**Review result:** ACCEPTED.

## 5. Provenance review

The contract preserves the required information classes:

```text
USER_PROVIDED
USER_CONFIRMED
AI_INFERRED_PROVISIONAL
ORGANIZATIONAL_UNKNOWN
LATER_WORK
SYSTEM_AUTHORITY
```

The existing candidate handoff already provides provenance origins such as
`USER_DECLARED`, `EXTRACTED_FROM_USER_TEXT`, `AI_INFERRED`, and
`AI_SUGGESTED`; the contract adds the transport-level distinction between
user-confirmable content and organizational authority. No inference may be
promoted to `SYSTEM_AUTHORITY`.

**Review result:** ACCEPTED.

## 6. Frozen cognition review

Authentication/claim is explicitly not a model execution or interpretation
event. The contract reuses the latest persisted handoff and session state. A
later user correction is a separate confirmation/revision event.

**Review result:** ACCEPTED.

## 7. Claim, idempotency, and stale-write review

Existing repository evidence supports:

- public access by session id plus hashed public token;
- claim compare-and-set on `ownershipState`, `ownerUserId`, and `revision`;
- different-user rejection;
- revision conflicts for stale writes;
- unique `(sessionId, version)` handoff and confirmation records;
- existing continuation idempotency operation/key concept.

The review records one implementation gap honestly: a same-user repeated claim
does not currently have a separately documented idempotent response; the
ownership guard rejects non-anonymous state. The contract therefore requires a
future implementation to recover the already-owned session deterministically,
but does not claim that behavior is already executable.

**Review result:** ACCEPTED as contract target; implementation status remains
`NOT_IMPLEMENTED` for the same-user retry behavior.

## 8. Confirmation review

User confirmation can upgrade only a user-owned interpretation:

```text
AI_INFERRED_PROVISIONAL → USER_CONFIRMED
```

It cannot upgrade organization membership, Portfolio authority, Initiative
ownership, Sponsor/management truth, invitation authority, or committee
approval. `confirmedByUserId`, `confirmedAt`, accepted/corrected/rejected
fields, and confirmation version must remain linked to the selected handoff.

**Review result:** ACCEPTED.

## 9. No-repeat review

The contract distinguishes:

- `MUST_PRESERVE`: session, handoff, context, provenance, gaps, corrections,
  later work, unknowns, and version state;
- `MAY_RECONFIRM`: user-owned interpretation or stale display state;
- `MUST_NOT_ASSUME`: roles, organization, permissions, entities, or Steps.

**Review result:** ACCEPTED.

## 10. NEG-01–NEG-04 mapping

The repository's existing negative-guard document marks all four as
`PENDING_IMPLEMENTATION_GUARD`. This review does not mark any as passing.

| Guard | Contract mapping | Future executable assertion | Current status |
|---|---|---|---|
| NEG-01 | `REGISTRATION != CONFIRMATION`; authentication only changes identity/ownership | Register/login after a provisional handoff; assert `acceptedFields`, `correctedFields`, `confirmedAt`, handoff payload, and provenance do not change unless an explicit confirmation command occurs. | `PENDING_IMPLEMENTATION_GUARD` |
| NEG-02 | `PROVISIONAL_CONTINUATION != PROJECT_CREATION` | Complete auth/claim and enter provisional continuation; assert Project count unchanged and neither `createProjectFromPublicDraft` nor `ProjectService.createProject` is called. | `PENDING_IMPLEMENTATION_GUARD` |
| NEG-03 | `PROVISIONAL_CONTINUATION != INITIATIVE_CREATION` | Complete auth/claim; assert no canonical Initiative/Project lifecycle record is created and no Initiative id appears in the provisional handoff. | `PENDING_IMPLEMENTATION_GUARD` |
| NEG-04 | `PROVISIONAL_CONTINUATION != STEPS_ENTRY` | Complete auth/claim; assert no Step 0–4 rows/materialization/activation and no redirect to Steps. | `PENDING_IMPLEMENTATION_GUARD` |

Adjacent NEG-05–NEG-08 evidence remains separate and is not reclassified by
this contract review.

## 11. Initiative exception review

Direct Initiative / Steps routing is disabled. The contract returns or
represents:

```text
PORTFOLIO_ORIENTED_PROVISIONAL_CONTINUATION
```

No invitation issuer authority is solved here, consistent with the requested
scope and ADR-004.

**Review result:** ACCEPTED.

## 12. Open contract questions

These do not block the design artifact but must be resolved before productive
implementation:

1. What exact authenticated route/service will perform the claim while
   preserving the existing session revision boundary?
2. Should same-user repeated claim return the owned session or a stable
   continuation result, and what existing error/result envelope should encode
   it?
3. What exact server-side Portfolio capability is required after provisional
   context establishment for tenant-scoped reads/writes?
4. Which existing handoff payload fields are guaranteed present when the
   handoff status is `ready_with_uncertainty` or `insufficient_input`?
5. What explicit user action creates a `CONFIRMED` confirmation versus merely
   displaying the provisional summary?
6. Which later implementation slice owns recovery from expired/abandoned
   sessions without creating duplicate sessions?

Invitation issuer authority and direct Initiative/Steps routing remain outside
this contract by design.

## 13. Readiness decision

```text
contract shape complete: YES
existing identifiers respected: YES
provisional/authority separation complete: YES
frozen cognition boundary complete: YES
NEG-01..NEG-04 executable: NO
direct Initiative/Steps enabled: NO
additional ADR required for this contract: NO
ready for smallest productive implementation: NO
```

The contract is ready for review/acceptance as a design artifact, not for
productive integration. Acceptance of ADR-003 and ADR-004 remains a prerequisite
for implementation.

## 14. Recommended next implementation slice

After formal acceptance, implement only the smallest authenticated session
claim/provisional continuation slice:

1. authenticated claim using existing `PortfolioEntrySession.id`,
   `ownerUserId`, `ownershipState`, and `revision`;
2. server projection of the versioned handoff into the reviewed provisional
   contract;
3. deterministic same-user retry/recovery behavior;
4. no-repeat UI/API behavior without cognition rerun;
5. executable NEG-01–NEG-04 integration tests;
6. no Project, Initiative, Steps, invitation, or tenant Portfolio authority
   changes.
