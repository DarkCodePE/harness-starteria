# ADR-003: Public Entry registration and continuation boundary

**Estado:** `PROPOSED`  
**Fecha:** 2026-09-25  
**Scope:** Public Entry → registration/login → authenticated continuation → Portfolio / Initiative / Steps  
**Supersedes:** none  
**Relates to:** ADR-001 (proposed Portfolio continuation), ADR-002 (accepted clarification convergence)

> This ADR is design-only. It does not authorize runtime, frontend, backend, schema, migration, route, productive AI or harness changes.

## 1. Context and evidence

The canonical Core v0.3 is restored at:

`docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`

The active Portfolio Entry Experience Contract is:

`doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

The frozen candidate establishes a public, provisional, traceable interpretation before canonicalization. Core v0.3 additionally requires human organizational authority, provenance for material claims, explicit alignment, versioned change history and separation between Portfolio accountability and Initiative ownership.

The current-state audit found both a legacy public pilot funnel and a newer Portfolio Entry continuation/conversion surface. The relevant evidence is:

- `docs/implementation/PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md`
- `backend/modules/portfolio-entry-continuation/portfolio-entry-continuation.service.ts`
- `backend/modules/portfolio-entry-conversion/portfolio-entry-conversion.service.ts`
- `backend/modules/pilot-leads/pilot-lead.router.ts`
- `front/src/app/pages/AuthPage.tsx`
- `front/src/app/routes.ts`
- `doc/product-adr/ADR-001-portfolio-entry-continuation-to-portfolio.md`

The repository therefore requires an explicit boundary decision. Registration authenticates a person; it must not silently decide that a provisional interpretation is organizational truth or that the user has entered Initiative execution.

## 2. Problem

Without a canonical boundary, the following paths can compete:

```text
Public Entry → registration/login → Portfolio continuation
Public Entry → registration/login → Project / Step 0
Public Entry → pilot claim → Project + Steps
```

The first is compatible with the Portfolio Lead orientation. The latter two are present as legacy or explicit Initiative paths and can bypass or appear to bypass Portfolio governance if treated as the default continuation of Public Entry.

## 3. Decision

Adopt **Option C — Conditional routing**, constrained by the following default:

```text
Public Entry
  → provisional handoff
  → registration/login or authenticated claim
  → restore provisional context
  → explicit profile and confirmation checks
  → Portfolio continuation by default
  → canonical structure only after the relevant governance boundary
  → Initiative / Steps only through an explicit Initiative continuation
```

Option A is the default path for the public Portfolio Lead experience. Option B is rejected as the default and is permitted only as the explicit Initiative continuation described below. Option C is required because Core supports multiple entry patterns and the repository already models distinct `PORTFOLIO_LEAD_ENTRY` and `INITIATIVE_ENTRY` profiles.

### 3.1 Authoritative routing criteria

The route may continue directly toward Initiative/Project only when all of the following are true:

1. The session has an explicit `INITIATIVE_ENTRY` continuation profile established before conversion; registration cannot establish it.
2. The handoff is present and versioned.
3. The user has confirmed/corrected the relevant handoff fields.
4. The conversion policy has determined that the session is conversion-eligible.
5. The authenticated user is the session owner and passes the required permissions.
6. The conversion is idempotent, provenance-linked and routed to the canonical Initiative/Project boundary.
7. Any required organizational authority, ownership and activation conditions are satisfied separately; user confirmation alone is insufficient.

For `PORTFOLIO_LEAD_ENTRY`, direct Project/Steps conversion is prohibited. The canonical destination is Portfolio continuation, and the continuation service must reject an incompatible Project conversion.

No route may infer the profile from the last message, CTA text, query parameter, registration event or an AI suggestion alone.

## 4. Invariants

The following are normative:

1. **Registration preserves continuity but does not itself canonicalize the Portfolio Entry interpretation.**
2. Registration proves or creates account/session identity only; it does not confirm business truth, strategic alignment, KPI, ownership, authority or evidence.
3. Provisional context may survive registration without becoming canonical.
4. **The default continuation surface for a converted Public Entry is Portfolio context, not Project/Steps.**
5. Initiative / Steps become reachable only after the relevant explicit Initiative profile, handoff, confirmation, conversion eligibility and authority boundary have been established.
6. A user may correct their own declared input and may confirm that a suggested interpretation represents their intent; this does not create organizational authority.
7. AI-inferred and AI-suggested values remain distinguishable from user-declared, extracted and organizationally confirmed values.
8. Unknowns and open items survive the handoff and registration boundary.
9. Continuation must restore known context and must not force the user to repeat it.
10. No two active continuation paths may have equivalent authority for the same session profile.

## 5. Current continuation-path audit

This is an audit classification only. No route is changed by this ADR.

| Path / surface | Classification | Finding |
|---|---|---|
| `/` → `/public/start` | `ACTIVE` / legacy semantics | Public shell is active, but current proposal/pilot behavior is not the frozen Portfolio Entry analysis contract. |
| `/public/start` → `/public/draft/:draftId/edit` | `ACTIVE` / `LEGACY` | Browser-local `PublicDraft` proposal flow; not authoritative `PortfolioEntryDraft` + `PortfolioEntryAnalysis`. |
| `/public/draft/:draftId/edit` → `/auth/continue/:draftId` | `ACTIVE` / `LEGACY` | Public proposal/pilot signup continuation. |
| `/auth/continue/:draftId` → `POST /public/pilot-leads` | `ACTIVE` / `LEGACY_COMPAT` | Captures a pilot lead; does not itself create Project, but is not the canonical Portfolio Entry handoff. |
| `/public/continuar` → claim token → `/auth` | `ACTIVE` / `LEGACY_COMPAT` | Resume-by-code pilot path. |
| `/auth` pending pilot claim → `/continuar-piloto` | `ACTIVE` / `LEGACY_COMPAT` | Authenticated pilot continuation. |
| `/continuar-piloto` → `consume-claim` → Project + Steps | `ACTIVE` / `LEGACY` | `createPilotProject` calls `ProjectService.createProject` and `updateStep0`; this is the observed `Public Entry → registration → Project/Steps` boundary. |
| `/auth` pending public draft → `/projects/:id/step/0` | `ACTIVE` / `LEGACY` | `createProjectFromPublicDraft` remains a direct Project/Step 0 path in `AuthPage`. |
| `/api/v1/public/portfolio-entry/:sessionId/continue` → `/portfolio/inicio?...` | `ACTIVE` / `CANDIDATE` | Explicit Portfolio continuation. Requires claimed session, confirmed handoff, confirmation, permission and idempotency. |
| `/api/v1/public/portfolio-entry/:sessionId/convert` → Project / Adaptive Core | `ACTIVE` / `CANDIDATE` | Explicit Initiative conversion; service rejects `PORTFOLIO_LEAD_ENTRY` and requires `INITIATIVE_ENTRY`, confirmation and conversion eligibility. |
| `/portfolio/inicio` | `ACTIVE` | Canonical target surface for Portfolio continuation. |
| `/projects/:projectId`, `/projects/:projectId/step/0..4` | `ACTIVE` | Productive Initiative/Steps surfaces; not a valid default destination from Public Entry. |
| invitation-specific continuation | `UNKNOWN` for this boundary | Invitation and role routes exist in the repository, but no audited Public Entry → invitation → Portfolio/Initiative handoff was found. Requires a separate route-level audit before claiming equivalence. |

## 6. Option evaluation

| Criterion | Option A — Portfolio-first | Option B — direct execution | Option C — conditional routing |
|---|---|---|---|
| Core v0.3 | Strong fit for Portfolio Lead and pre-canonical boundaries | Conflicts when registration is treated as authority or activation | Fits Core entry-pattern diversity if explicit authority gates remain |
| Frozen Portfolio Entry | Directly compatible | Conflicts with no-canonicalization and pre-Step boundary | Compatible as default; Initiative branch must remain explicit |
| Multi-entry Portfolio architecture | Preserves Portfolio as the initial corporate orientation | Reintroduces initiative-first drift | Supports Portfolio-first and explicit independent/initiative entries |
| Governance authority | Clear: Portfolio review precedes canonical structure | Ambiguous at registration | Clear if profile and authority are server-validated |
| Provenance | Easy to preserve in a Portfolio snapshot | High risk of inferred values becoming Step 0 truth | Preservable with separate provisional and canonical snapshots |
| Canonicalization safety | Highest | Lowest | Acceptable only with strict branch criteria |
| Continuity / no-repeat UX | Strong | Strong technically, but may repeat or skip governance | Strong if both branches carry the same provisional handoff |
| Incomplete organizational truth | Supported | Poor fit | Supported; unresolved items remain branch-visible |
| Initiative Owner handoff | Later, after Portfolio/activation boundary | Too early by default | Explicit Initiative branch can support it when established |
| Existing productive architecture | Requires promoting/validating Portfolio continuation | Reuses legacy pilot conversion | Best reconciliation: preserve explicit services, quarantine legacy default |
| Migration complexity | Medium | Low short-term, high governance debt | Medium/high, but bounded by existing profile split |

### 6.1 Options conclusion

- **Core-compatible options:** A and C.
- **Preferred canonical target:** C, with A as the default public Portfolio Lead route.
- **Rejected default:** B.
- **Reason:** the repository already contains a guarded Portfolio continuation and a separate explicit Initiative conversion. Treating all registrations as direct execution would collapse distinct authority boundaries and contradict the frozen candidate.

## 7. Provisional handoff object

Registration may carry a versioned provisional snapshot. This is a conceptual boundary, not a DB schema.

| Content | Classification | Boundary rule |
|---|---|---|
| `understood_need` | `SAFE_TO_CARRY_PROVISIONALLY` | Carry as an interpretation with source/provenance and revision. |
| `desired_outcome` | `SAFE_TO_CARRY_PROVISIONALLY` | Carry as user-reported or extracted intent; do not treat as approved outcome. |
| `known_context` | `SAFE_TO_CARRY_PROVISIONALLY` | Carry each item with origin and review disposition. |
| confirmed facts | `REQUIRES_CONFIRMATION` | Confirmation makes the item usable for the next governed step, not automatically canonical. |
| inferred/provisional interpretations | `SAFE_TO_CARRY_PROVISIONALLY` | Must remain labeled `AI_INFERRED` or `AI_SUGGESTED`; never flatten to fact. |
| current `open_items` | `SAFE_TO_CARRY_PROVISIONALLY` | Preserve description, impact, resolver/authority and next move. |
| later work | `SAFE_TO_CARRY_PROVISIONALLY` | Carry as later work; it cannot silently become the current blocker or current decision. |
| authority-owned unknowns | `SAFE_TO_CARRY_PROVISIONALLY` | Preserve owner and unresolved status; do not resolve by registration. |
| `suggested_next_move` | `SAFE_TO_CARRY_PROVISIONALLY` | Treat as AI suggestion, not command or authorization. |
| `continuation_summary` | `SAFE_TO_CARRY_PROVISIONALLY` | Derived summary only; source fields remain authoritative. |
| provenance/source references | `REQUIRES_CONFIRMATION` | Preserve the references and review disposition; registration cannot validate them. |
| credentials, permissions, organizational ownership, approval or KPI truth inferred from the snapshot | `MUST_NOT_CARRY_AS_FACT` | Must be obtained through the relevant authz/governance boundary. |

The snapshot must be versioned and supersedable. It must not overwrite the public session history or erase unresolved context.

## 8. Confirmation boundary

User confirmation/correction does the following:

- confirms that the displayed interpretation is acceptable as a representation of the user's intent;
- corrects fields and updates the provisional revision;
- allows the session to become eligible for the next contract-defined handoff or route when all other gates pass;
- preserves provenance showing what was user-confirmed versus extracted, inferred or suggested.

Confirmation does not:

- create Organization, Strategic Front, Challenge, Initiative, Project, Step, Evidence or Decision automatically;
- establish organizational alignment, ownership, budget, KPI approval or authority held by another person;
- make an AI inference a canonical fact without the required organizational validator;
- activate Step 0 or any later Step.

Canonical use requires a separate action at the relevant boundary:

```text
public interpretation
  → user correction/confirmation
  → explicit continuation profile
  → permission and authority checks
  → Portfolio continuation OR explicit Initiative conversion
  → canonical mutation only in that governed service
```

For an authority-owned unknown, the user can confirm that the question is material or that the interpretation is their current understanding, but cannot confirm the organization's answer unless they possess the relevant authority.

## 9. Legacy Project / Steps boundary

| Surface | Disposition | Required treatment |
|---|---|---|
| `/continuar-piloto` and `consume-claim` Project creation | `COMPATIBILITY_ONLY` | Keep only for already-supported pilot compatibility; do not treat as the canonical Public Entry continuation. Add explicit provenance/profile separation before any migration. |
| `createProjectFromPublicDraft` in `AuthPage` | `DEPRECATE` | Remove from the Public Entry continuation boundary after consumer audit and replacement validation. No silent fallback to it. |
| `/projects/:id/step/0` reached from public/pilot paths | `DEPRECATE` for public default | Retain for existing Initiative work and explicit Initiative continuation only. |
| `/projects/:id` and `/projects/:id/step/1..4` | `KEEP` | These remain productive Initiative/Steps surfaces; their reachability is governed by Initiative lifecycle and permissions. |
| `portfolio-entry-continuation` → `/portfolio/inicio` | `KEEP` / candidate target | This is the default continuation shape, subject to its own approved product/runtime validation. |
| `portfolio-entry-conversion` → Project/Adaptive Core | `KEEP` as explicit Initiative branch | Must remain unavailable to `PORTFOLIO_LEAD_ENTRY`; requires explicit profile, confirmation and conversion eligibility. |
| unclassified invitation continuation | `NEEDS_FOLLOWUP_ADR` | First perform a route/permission audit; do not merge it with registration semantics by inference. |

## 10. Failure modes prevented

This ADR prevents the following by construction:

- registration silently canonicalizing truth;
- Public Entry creating Initiative/Project prematurely;
- a default direct Project/Steps path bypassing Portfolio governance;
- forced repetition of carried context;
- AI inference becoming fact;
- authority-owned unknowns disappearing from the handoff;
- later work being treated as the current blocker;
- two continuation paths having equivalent authority for one session profile.

The implementation must additionally reject stale revisions, preserve idempotency and expose route/profile decisions in auditable metadata. Those are implementation acceptance conditions, not changes authorized by this ADR.

## 11. Consequences

### Positive

- Registration has a narrow, legible meaning: identity/session continuity.
- Portfolio Lead users continue into Portfolio context by default.
- Explicit Initiative entries remain possible without making Initiative-first the universal product model.
- Provisional context survives without becoming organizational truth.
- Existing Portfolio continuation and conversion services can be evaluated against one authority boundary.

### Costs and risks

- Legacy pilot and pending-draft paths must be quarantined, migrated or retired.
- Profile establishment and authority checks need explicit implementation tests.
- Invitation continuation remains an open route-audit item.
- The current checkout contains both legacy and candidate implementations; implementation status must not be mistaken for approval.

## 12. Status and implementation boundary

```text
STATUS: PROPOSED
DECISION: CANDIDATE — OPTION C WITH OPTION A DEFAULT
IMPLEMENTATION AUTHORIZED: NO
RUNTIME CHANGED: NO
CORE CHANGED: NO
FROZEN PORTFOLIO ENTRY COGNITION CHANGED: NO
```

Approval of this ADR would resolve the product decision boundary. It would not by itself authorize backend/frontend/schema or route changes; those require a separate implementation slice, guardrail check, tests and evidence.

## 13. Additional ADR requirement

```text
ADDITIONAL_ADR_REQUIRED_FOR_THIS_BOUNDARY: NO
```

The invitation route audit may produce a separate ADR only if it reveals a materially different authority model. Legacy retirement and implementation details belong in their respective slices unless they require a new product decision.

## 14. Recommended next implementation slice

After explicit ADR approval, run a documentation/current-state reconciliation slice first:

1. inventory and classify every Public Entry continuation consumer;
2. make the server-owned continuation profile and route ownership explicit;
3. add negative tests proving registration does not canonicalize and `PORTFOLIO_LEAD_ENTRY` cannot convert to Project;
4. add a route audit for invitation continuation;
5. only then plan the smallest Portfolio continuation implementation slice.

No step above is authorized by this proposed ADR.
