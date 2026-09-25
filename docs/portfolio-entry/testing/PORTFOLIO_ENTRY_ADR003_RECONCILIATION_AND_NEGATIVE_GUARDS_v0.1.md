# Starteria — ADR-003 Current-State Reconciliation and Negative Guards

**Documento:** `PORTFOLIO_ENTRY_ADR003_RECONCILIATION_AND_NEGATIVE_GUARDS_v0.1.md`  
**Estado:** `AUDIT COMPLETE / IMPLEMENTATION NOT AUTHORIZED`  
**Fecha:** 2026-09-25  
**Slice:** documentation reconciliation + negative-guard preparation  
**ADR:** `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`

## 1. Repository and authority guard

```text
repository_root: C:/Users/User/proyect-starteria/harness-starteria-clean
origin: https://github.com/DarkCodePE/harness-starteria.git
branch: feat/portfolio-entry-decision-readiness-harness
base: 79527af6045d00b3a2701f90a6b889d15af02de
status_before_change: clean
result: PASS
```

`Dashboardstarteria` no fue usado como checkout canónico. La referencia a
validaciones observadas allí se conserva únicamente como evidencia documental,
no como prueba de runtime productivo de este repositorio.

## 2. ADR-003 status

ADR-003 permanece `PROPOSED`. No se cambió a `ACCEPTED` y no autoriza runtime,
frontend, backend, schema, migration, routing, productive AI ni harness changes.
La aceptación formal es requisito antes de cualquier integración productiva de
esta frontera, además de una slice de implementación separada.

## 3. Active narrative

La historia coherente que debe gobernar el target es:

```text
Public Entry
  → provisional / pre-canonical handoff
  → registration/login changes identity/session state
  → provisional context is restored, not validated as organizational truth
  → user confirmation/correction updates the provisional revision
  → Portfolio context by default
  → Initiative / Steps only after explicit profile, handoff, confirmation,
    eligibility, permission and authority boundaries
```

Confirmation may represent the user's intent. It does not grant organizational
authority and does not itself create Organization, Strategic Front, Challenge,
Initiative, Project, Evidence, Decision or Step.

The invariants are explicit:

```text
AUTHENTICATION != BUSINESS CANONICALIZATION
PUBLIC_ENTRY_CONTINUATION != PROJECT_CREATION
PUBLIC_ENTRY_CONTINUATION != STEPS_ENTRY
PUBLIC_ENTRY_CONTINUATION → PORTFOLIO_CONTEXT (default target)
```

Provenance must preserve at least:
`USER_DECLARED`, `CONFIRMED`, `EXTRACTED_FROM_USER_TEXT`, `AI_INFERRED`,
`AI_SUGGESTED`, unresolved organizational truth, later work and current open
items. Registration must not flatten these categories or delete unknowns.

## 4. Documents inspected and classification

The required authority order was read before the reconciliation. The following
additional sources were inspected for this boundary:

- `CURRENT_STATE.md`
- `AGENTS.md`
- `STARTERIA_V2_MANIFEST.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md`
- `docs/governance/STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`
- `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`
- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`
- `docs/implementation/PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md`
- `docs/implementation/portfolio-entry-continuity-file-plan-v0.3.md`
- `docs/portfolio-lead/README.md`
- `docs/portfolio-lead/02-entry/README.md`
- `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md`
- `backend/docs/adr/ADR-015-public-pilot-lead-capture.md`
- `backend/docs/adr/ADR-018-pilot-code-to-project.md`
- `backend/docs/adr/ADR-019-public-landing-absorbed.md`
- `backend/docs/adr/ADR-025-initial-review-to-project-reconciliation.md`
- frontend routes, auth continuation, Public Entry services and existing tests
- backend auth, pilot-lead, Portfolio continuation and conversion services/tests

Classification counts for the relevant statements reviewed:

| Classification | Count | Treatment |
|---|---:|---|
| `ALIGNED_WITH_ADR003` | 12 | Keep as active target/invariant or supporting authority. |
| `LEGACY_BUT_LABELED` | 6 | Keep as compatibility evidence; never define new behavior. |
| `STALE_CONFLICT` | 2 | Corrected in `CURRENT_STATE.md`; historical evidence untouched. |
| `AMBIGUOUS` | 2 | Keep unresolved; requires implementation/profile audit. |
| `HISTORICAL_ONLY` | 3 | Evidence only; not an active semantic owner. |
| `NOT_APPLICABLE` | 1 | The exact Design System baseline path named by AGENTS is absent in this checkout. |

The two stale conflicts were the claim that the post-entry contract was absent
and the lack of an explicit split between observed mixed implementation and the
ADR-003 target. The historical audit's `HISTORICAL` banner was respected; it was
not rewritten.

## 5. Current-state reconciliation

`CURRENT_STATE.md`: **modified YES**.

It now distinguishes:

- `IMPLEMENTED_TODAY`: mixed checkout, existing auth/Public Entry/legacy routes,
  and a candidate Portfolio continuation surface;
- `PROPOSED_TARGET`: ADR-003's Portfolio-first default, while ADR-003 is still
  proposed;
- `LEGACY_COMPATIBILITY`: pilot claim, public draft signup and existing
  Project/Steps paths;
- `DEPRECATION_TARGET`: direct Public Entry→Project/Steps default and
  `createProjectFromPublicDraft` at the Public Entry boundary;
- `NOT_YET_IMPLEMENTED`: canonical registration→handoff Portfolio integration
  and the Public Entry→Product Handoff Contract.

No historical evidence was rewritten and no productive behavior was changed.

## 6. Implementation path inventory

| Path / symbol | Classification | Evidence / treatment |
|---|---|---|
| `/public/start` | `ACTIVE_CANONICAL` for public shell only; not yet canonical ADR-003 continuation | `front/src/app/routes.ts`; target semantics still pending. |
| `/public/draft/:draftId/edit` | `COMPATIBILITY_ONLY` | Browser-local `PublicDraft` editor; not authoritative `PortfolioEntryDraft`. |
| `/auth/continue/:draftId` | `COMPATIBILITY_ONLY` | Progressive signup/pilot-lead continuation. |
| `/public/continuar` | `COMPATIBILITY_ONLY` | Resume-by-code pilot path. |
| `/continuar-piloto` | `DEPRECATION_TARGET` for Public Entry default | Explicit legacy pilot claim branch. |
| `createProjectFromPublicDraft` | `DEPRECATION_TARGET` | Direct Project/Step 0 path from `AuthPage`; no new consumers. |
| `ProjectService.createProject` | `COMPATIBILITY_ONLY` at this boundary | Valid for explicit Initiative/productive flows, forbidden as registration side effect. |
| Pilot claim `consume-claim` | `COMPATIBILITY_ONLY` | Existing pilot compatibility creates/returns Project and materializes Steps. |
| Portfolio continuation service → `/portfolio/inicio` | `ACTIVE_CANONICAL` as target shape, implementation unverified | Requires claimed/confirmed session, permission and idempotency. |
| Portfolio conversion → Project/Adaptive Core | `ACTIVE_CANONICAL` only for explicit Initiative branch | Must reject `PORTFOLIO_LEAD_ENTRY`. |
| `/projects/:projectId` | `ACTIVE_CANONICAL` for existing Initiative work | Not a valid default Public Entry destination. |
| `/projects/:projectId/step/0..4` | `ACTIVE_CANONICAL` for Initiative lifecycle | Not reachable from canonical registration by default. |
| invitation continuation | `UNKNOWN` | Separate route/permission audit required. |

The requested symbol `createProjectFromPublicDraft` exists in
`front/src/app/context/AppContext.tsx` and is invoked from `AuthPage.tsx` for a
pending public draft. It was not changed.

## 7. Negative guards

| ID | Guard | Status | Executable evidence / future assertion |
|---|---|---|---|
| `NEG-01` | Registration does not canonicalize provisional/inferred truth. | `PENDING_IMPLEMENTATION_GUARD` | Future `front/src/app/pages/__tests__/AuthPage.public-entry-registration-boundary.test.tsx` or backend auth/continuation integration: register after a provisional handoff and assert no canonical truth/confirmation mutation. |
| `NEG-02` | Registration does not automatically create Project. | `PENDING_IMPLEMENTATION_GUARD` | Future registration→handoff integration: snapshot Project count and assert unchanged; assert `createProjectFromPublicDraft` and `ProjectService.createProject` are not called. |
| `NEG-03` | Registration does not automatically create Initiative. | `PENDING_IMPLEMENTATION_GUARD` | Same future integration: assert no Initiative/Project canonical record or Initiative lifecycle row is created by auth alone. |
| `NEG-04` | Registration does not enter/create Steps. | `PENDING_IMPLEMENTATION_GUARD` | Same future integration: assert no Step 0–4 materialization, activation or redirect after auth alone. |
| `NEG-05` | Authority-owned unknowns/open items survive. | `EXECUTABLE / PASSING` | `backend/modules/portfolio-entry-conversion/__tests__/portfolio-entry-conversion.mapper.test.ts` preserves `unresolved_context`; targeted mapper test passed. |
| `NEG-06` | Provenance survives and inferred content stays distinguishable. | `EXECUTABLE / PASSING` | Same mapper test preserves `AI_INFERRED` while applying corrected user values; targeted test passed. |
| `NEG-07` | Pilot route is not the default canonical Public Entry route. | `EXECUTABLE / PASSING` | `front/src/app/routes.public-entry.test.tsx` plus `AuthPage.portfolio-entry-claim.test.tsx`; 4 targeted frontend tests passed and asserted no pilot redirect for Portfolio Entry claim. |
| `NEG-08` | Canonical Public Entry continuation does not call direct draft→Project. | `EXECUTABLE / PASSING` for existing Portfolio claim boundary; canonical registration integration pending | `AuthPage.portfolio-entry-claim.test.tsx` asserts `createProjectFromPublicDraft` is not called. The future registration test must extend this assertion to the canonical handoff trigger. |

### Test honesty

The canonical ADR-003 registration→handoff integration is not present. No fake
passing tests were created for NEG-01 through NEG-04. The existing tests above
protect adjacent, real boundaries only and are not presented as proof that the
missing canonical integration exists.

## 8. Executed validation

```text
front: AuthPage.portfolio-entry-claim.test.tsx + routes.public-entry.test.tsx
      2 files / 4 tests passed

backend: portfolio-entry-conversion.mapper.test.ts
         1 file / 1 test passed

integration conversion suite: not counted as passing evidence here;
the selected DB integration cases were skipped by the configured environment.
```

Negative guards defined: **8**.  
Negative guards executable: **4** (NEG-05..NEG-08, with NEG-08 scoped to the
existing Portfolio claim boundary).  
Negative guards passing: **4**.  
`PENDING_IMPLEMENTATION_GUARD`: **4** (NEG-01..NEG-04).

## 9. Readiness decision

```text
automatic Project creation forbidden by target: YES
automatic Initiative creation forbidden by target: YES
automatic Steps entry forbidden by target: YES
provisional truth preservation: YES (target and adjacent mapper evidence)
organizational unknown preservation: YES (target and adjacent mapper evidence)
ADR acceptance required before productive implementation: YES
ready for Public Entry → Product Handoff Contract: NO
productive integration readiness: NOT READY
```

The handoff contract is not ready to be defined as an implementation contract
because ADR-003 is still proposed, the canonical registration boundary is not
integrated, route/profile ownership is mixed, and invitation continuation is
not audited. The next documentation step may define a candidate contract only
after formal ADR acceptance and completion of the route/profile audit.

## 10. Files changed by this slice

- `CURRENT_STATE.md`
- `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_ADR003_RECONCILIATION_AND_NEGATIVE_GUARDS_v0.1.md`

No frontend journey, backend behavior, route behavior, schema, migration,
Portfolio runtime, Initiative runtime, Steps runtime or frozen Portfolio Entry
cognition was modified.

## 11. Recommended next slice

`ADR-003 acceptance and route/profile boundary audit`:

1. obtain formal acceptance without changing the ADR silently;
2. audit every registration, claim, invitation and continuation consumer;
3. define the Public Entry→Product Handoff Contract as a candidate contract;
4. implement the smallest server-owned profile/handoff slice;
5. add NEG-01..NEG-04 as real integration tests before enabling any productive
   Portfolio continuation route;
6. retain pilot and Project/Steps paths as explicit compatibility until consumer
   evidence and retirement conditions permit deprecation.
