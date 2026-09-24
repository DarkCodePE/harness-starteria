# Strategic Framing — SF-1 Current-State Audit v0.1

**Status:** `EVIDENCE / CURRENT-STATE AUDIT` · `NOT AUTHORITY`
**Slice:** SF-1
**Audit date:** 2026-09-24
**Scope:** factual repository audit against the human-approved SF-0 baseline. No runtime, schema, tests, authority documents, routes, Copilot capabilities, commit or push was performed.

## Executive summary

Starteria has reusable cognition and governed staging at two different boundaries, but it does not yet have a Strategic Framing runtime. Portfolio Entry already produces structured, provenance-bearing interpretation, clarification questions, reverse-alignment findings and a provisional handoff. Portfolio Bootstrap already derives a Portfolio Anchor, accepts existing work, produces deterministic connection/advancement proposals and requires human review for material mutations. Those pieces are safe inputs or patterns for SF, but they are not a reusable SF application service today.

The current system has no productive Enterprise Direct or Existing Portfolio path into Strategic Interpretation/Framing. `/portfolio/inicio` renders the existing Portfolio Home for authenticated users without a continuation and renders Bootstrap only when `portfolioEntryContinuationId` is present. This verifies `PL-GAP-01`.

Canonical Portfolio services create/update Strategic Fronts immediately and create Challenges only below an existing Front. There is no persisted candidate Front or candidate Challenge staging type. Bootstrap `ProposedMutation` is governed staging, but its target enum is limited to `work_item`, `strategic_connection`, `advancement_condition` and `portfolio_anchor`; it cannot represent a candidate Front/Challenge without an adapter or new contract. Therefore SF-1 must not reuse direct canonical writes as SF staging.

The smallest safe SF-2 is a read-only composition over existing Entry handoff/continuation, Bootstrap Anchor/work-item/connection/reading records and canonical Portfolio read services. It should derive provisional framing labels in memory, perform no writes, add no route and make no Copilot changes. Candidate promotion, new persistence, adaptive framing behavior, lenses, prioritization and canonical mutations remain SF-3+ decisions.

## Authority and audit basis

The inspected SF-0 documents state that the Experience Contract is approved but runtime is not implemented (`docs/portfolio-lead/07-strategic-framing/README.md`, approval/runtime declaration). The approved boundary is:

```text
Public Entry / Enterprise Direct / Existing Portfolio or imported work
→ Strategic Interpretation
→ front_like / challenge_like / initiative_like / unresolved
→ sufficient Portfolio Anchor
→ Strategic Framing
→ human-governed Front / candidate Challenge / prioritization
```

The audit preserves the higher factual Core v0.2 authority and the SF-0 rules that Anchor is not a Strategic Front, Work Item is not an Initiative, AI inference is not confirmation, and no Lens/Gap/AI result automatically creates a Challenge. Primary references: `docs/STARTERIA_AUTHORITY.md`, `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`, `docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_EXPERIENCE_CONTRACT_v0.1.md`, `docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_CONTEXT_v0.1.md`.

## Current journey map

### Current public path

```text
/public/start
  → front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx
  → Portfolio Entry runtime/session and handoff
  → confirmation/continuation
  → authenticated /portfolio/inicio?portfolioEntryContinuationId=...
  → PortfolioBootstrapHome
```

Status: **PARTIAL** against SF-0. Portfolio Entry, confirmation and continuation exist; Bootstrap can create/reuse a session from the continuation. The path does not continue into Strategic Framing. Evidence: `backend/modules/portfolio-entry-runtime/session/session-controller.ts`, `backend/modules/portfolio-entry-continuation/portfolio-entry-continuation.service.ts`, `backend/modules/portfolio-bootstrap/portfolio-bootstrap.service.ts:createOrReuseFromContinuation`, `front/src/app/pages/PortfolioLeadHomePage.tsx:entryContinuationId`.

### Current direct authenticated path

```text
authenticated user with portfolio:read
  → /portfolio/inicio
  → PortfolioLeadHomePage
  → no continuation query parameter
  → legacy/mixed Portfolio Home read surface
```

Status: **LEGACY_COLLISION** for SF-0. `PortfolioLeadHomePage` calls `usePortfolioBootstrap(entryContinuationId)` but renders `PortfolioBootstrapHome` only inside `if (entryContinuationId)`; without it, it renders the Home experience. No governed Strategic Interpretation or Anchor setup is required. Evidence: `front/src/app/pages/PortfolioLeadHomePage.tsx:34-89`, `front/src/app/routes.ts:111-118`, `front/src/app/layout/PortfolioLeadLayout.tsx:70`, `backend/modules/portfolio/portfolio.router.ts:33-46`.

### Current existing-Portfolio path

```text
authenticated Portfolio Lead
  → /portfolio/frentes-estrategicos, /portfolio/retos, /portfolio/iniciativas
  → canonical Front/Challenge/Initiative screens and APIs
```

Status: **MISSING** for governed Strategic Interpretation/Framing. Existing Fronts and Challenges can be read and edited, and Bootstrap can ingest manually pasted/imported work, but there is no route/service that invokes Entry cognition or reverse alignment for an existing portfolio. Evidence: `front/src/app/layout/PortfolioLeadLayout.tsx:47-51`, `front/src/app/routes.ts:115-118`, `backend/modules/portfolio/portfolio.router.ts`, `backend/modules/portfolio-bootstrap/portfolio-bootstrap.router.ts`.

### SF-0 transition comparison

| Transition | Current status | Evidence |
|---|---|---|
| Entry / Direct / Existing work → Strategic Interpretation | PARTIAL for Public Entry; MISSING for Direct and Existing work | Entry runtime exists; no non-public caller boundary |
| Interpretation → provisional type (`front_like`, `challenge_like`, `initiative_like`, `unresolved`) | MISSING | No matching runtime enum/type found in Entry, Bootstrap or Portfolio modules |
| Interpretation → sufficient Anchor | IMPLEMENTED for Entry continuation → Bootstrap | `derivePortfolioAnchorFromContinuation`, `createOrReuseFromContinuation` |
| Anchor → Strategic Framing workspace | MISSING | No SF route/runtime exists; SF-0 README says runtime NOT IMPLEMENTED |
| Framing → governed Front / candidate Challenge | PARTIAL only through unrelated canonical/proposal infrastructure | Direct Portfolio writes exist; no SF staging target |
| Framing → later Home / Activation | PARTIAL / LEGACY_COLLISION | PH-2 read service exists; PH-3B frontend absent; activation lifecycle is existing runtime |

## Component inventory and classifications

| Component / evidence | Factual current behavior | State classification | Reuse classification | SF-0 treatment |
|---|---|---|---|---|
| `backend/modules/portfolio-entry-runtime/domain/analysis.schema.ts` and `agent/portfolio-entry-agent-adapter.ts` | Validates `initial_entry_state`, `current_frame`, `primary_intent`, `ambiguities`, `contradictions`, `reverse_alignment`, `provenance` and `question_plan` | PROVISIONAL | REUSE_WITH_ADAPTER | Reusable Strategic Interpretation inputs; not confirmation |
| `backend/modules/portfolio-entry-runtime/session/session-controller.ts` | Applies question budget, active question/convergence transitions and emits `ready_for_handoff` | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Keep cognition; do not replay public UX for every entry mode |
| `backend/modules/portfolio-entry-runtime/handoff/handoff-builder.ts` and `handoff/handoff.schema.ts` | Materializes a structured, provisional handoff with value/context, decision-to-enable, unresolved context and provenance | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Good source snapshot; Entry-specific orchestration must be adapted |
| `PortfolioEntrySession` / `PortfolioEntryHandoff` / `PortfolioEntryConfirmation` in `front/prisma/schema.prisma` | Persists Entry lifecycle, versioned handoffs, confirmation and model execution evidence | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Not a general SF session model |
| `backend/modules/portfolio-bootstrap/portfolio-anchor-derivation.ts` | Derives Anchor status, business signal status, source refs and provenance from continuation snapshot | DERIVED → GOVERNED_STAGING when persisted | REUSE_WITH_ADAPTER | Safe Anchor source; Anchor remains distinct from Front |
| `PortfolioAnchor` + `PortfolioAnchorHistory` in `front/prisma/schema.prisma` | Persists one Anchor per Bootstrap session plus versioned history, confirmation and provenance | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Suitable read source; not corporate strategy or canonical Front |
| `PortfolioBootstrapWorkItem` | Stores raw/proposed work label, state hint, `ownerCandidate`, source refs and lifecycle | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Preserve Work Item != Initiative; ownerCandidate is not ownership |
| `portfolio-bootstrap.analyzer.ts:DeterministicPortfolioBootstrapAnalyzer` | Uses deterministic overlap/text rules to produce connection status and advancement conditions | DERIVED / PROVISIONAL | REUSE_WITH_ADAPTER | Advisory signal only; no semantic clustering |
| `PortfolioStrategicConnection` | Links a Work Item to an Anchor; statuses include alignment/unknown/misalignment; confirmation fields exist | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Pending alignment source, not Front/Challenge link |
| `PortfolioBootstrapProposedMutation` | Stores proposed value, rationale, source refs, provenance, uncertainty, materiality, confirmationRequired and review lifecycle | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Human review pattern reusable; target model is Bootstrap-specific and lacks candidate Front/Challenge |
| `backend/modules/portfolio/portfolio.service.ts:createStrategicFront/updateStrategicFront` | Writes `StrategicFront` directly through Prisma | CANONICAL | DO_NOT_REUSE_FOR_SF | Only after explicit SF promotion boundary; not provisional staging |
| `backend/modules/portfolio/portfolio.service.ts:createChallenge` | Requires a valid Front and writes canonical Challenge directly | CANONICAL | ADR_REQUIRED_IF_CHANGED | Preserves Front → Challenge hierarchy |
| `PortfolioLeadContext` and `domain/adapters.ts` | Optimistically updates local Front/Challenge lists then persists through Portfolio APIs | UI_ONLY + DERIVED | LEGACY_COMPAT_ONLY | Existing UI pattern only; not SF source of record |
| `CopilotOrchestrationService`, ActionPlan/ProposedAction/Approval/Executor | Persists assessment/action plan, requests approval and executes approved command with auth/audit/idempotency | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Shell reusable; business capability coverage is incomplete |
| `PortfolioHomeReadService` | Composes a read-only Home response from canonical records; does not persist a projection | DERIVED | REUSE_AS_IS for read pattern | Useful boundary; PH-3B frontend does not consume PH-2 |

## Area A — Portfolio Entry / Strategic Interpretation

### Reusable cognition

`analysis.schema.ts` defines the material interpretation fields: `primary_intent`, `initial_entry_state`, `current_frame`, `operating_context`, `ambiguities`, `contradictions`, `reverse_alignment` and `provenance`. `session-controller.ts` controls interaction mode, question budget, active question and convergence. `handoff-builder.ts` and `handoff.schema.ts` produce a structured handoff with provenance-bearing fields and unresolved context.

These pieces perform reusable cognition: intent detection, context extraction, ambiguity/contradiction detection, reverse alignment and question planning. They are coupled to Entry in the session controller, Entry-specific agent adapters, Entry handoff persistence and public conversion/continuation rules. The current application boundary is `PortfolioEntrySessionController` plus `PortfolioEntryHandoffMaterializer`; there is no service accepting Enterprise Direct or Existing Portfolio input without an Entry session. Future extraction therefore needs an adapter around the cognition, not a second public Entry UX replay.

### Field mapping and limits

| SF-0 output | Existing source | Audit result |
|---|---|---|
| Intended movement | `handoff.desired_outcome`, `analysis.current_frame`, `decision_to_enable` | Clean provisional mapping |
| Why it matters | `handoff.understanding`, `priority`, `known_context` | Available, often AI-inferred/provisional |
| Signal/proxy | `handoff.business_signal`, `evidence_or_clarity_needed`; Bootstrap Anchor derives `businessSignalStatus` | Available as confirmed/proxy/suggested/unknown, not a canonical outcome |
| Scope assessment | Entry intent/frame/context and unresolved context | Partial; no SF scope type |
| Parent context | `known_context` and Bootstrap Anchor `contextSummary` | Partial; no Front/Challenge hierarchy representation |
| Reverse-alignment findings | `analysis.reverse_alignment`, `handoff.unresolved_context`, `contradictions` | Available in Entry only; no Existing Portfolio caller |
| Provenance | Entry provenance schema/summary and Bootstrap `sourceRefs`/`provenanceStatus` | Reusable with adapter |
| Open uncertainties | ambiguities, contradictions, gap-resolution map, pending items | Available; no unified SF uncertainty model |

`front_like / challenge_like / initiative_like / unresolved` is not represented as a runtime enum or persisted field in the inspected Entry, Bootstrap or Portfolio code. Current inference is kept in structured AI/provisional fields, but direct Portfolio UI forms can immediately create canonical records; that direct path is the confirmation violation for SF if reused.

## Area B — Bootstrap / Anchor / staging

Bootstrap persistence is materially present. `PortfolioBootstrapSession` has phases `B0_CONTINUE` through `B5_FIRST_READING`, `sourceContinuationId`, `existingWorkStatus` and status. `PortfolioAnchor` has `outcomeStatement`, `contextSummary`, `decisionToEnable`, business signal status/value, status, source refs, provenance, confirmation actor/time and version; `PortfolioAnchorHistory` versions changes. `derivePortfolioAnchorFromContinuation()` marks `anchor_sufficient` only when outcome, minimum context and decision or confirmed/proxy signal are present, and marks conflicting contradictions. This supports a sufficient Anchor without claiming all parent hierarchy is resolved.

The Anchor does not persist a dedicated parent-context state, why-it-matters field, or open-uncertainty collection; these remain in context/source refs/derived status. `decisionToEnable` is the closest explicit decision field. It must be treated as governed staging, not canonical corporate strategy.

Work intake is implemented through manual entry, pasted text and uploaded CSV/XLSX mapping/commit. Evidence: `portfolio-bootstrap.schemas.ts:manualWorkItemBodySchema,pasteWorkItemsBodySchema,uploadImportBodySchema`; `portfolio-bootstrap.router.ts` import routes; `PortfolioBootstrapWorkItemSourceType` includes `pasted_text`, `manual_entry`, `entry_context`, `imported_file`. The model has `ownerCandidate`, `currentStateHint` and `sourceRefs`; no ownership assignment is implied.

`PortfolioStrategicConnection` is Anchor-scoped (`anchorId`, `workItemId`, `sourceMutationId`) and has statuses `confirmed_alignment`, `partial_alignment`, `alignment_unknown`, `confirmed_misalignment`, `out_of_current_priority`. It can support pending alignment to the Anchor, not a canonical Front or Challenge.

`PortfolioBootstrapProposedMutation` is a governed material-review mechanism: proposed/current values, rationale, review/correction actor/time, source refs, provenance (`ai_inferred`/`ai_suggested`), uncertainty, materiality, `confirmationRequired` and status. Routes exist for list, correct, confirm, reject and leave pending. Its target enum does not include candidate Front or candidate Challenge. Classification: `REUSE_WITH_ADAPTER` for review/audit semantics; `DO_NOT_REUSE_FOR_SF` as an unmodified domain model.

The analyzer is explicitly `deterministic` or `real_ai`, but the current `DeterministicPortfolioBootstrapAnalyzer` calculates text overlap and conditions for business signal, decision path, dependency, required context and ownership visibility. It does not cluster work into candidate Strategic Fronts/Challenges and does not productively implement semantic clustering. Known gap `PL-GAP-04` is verified.

## Area C — Multi-entry reality

Public Entry has a real continuation boundary. `PortfolioBootstrapController.createFromContinuation` calls `PortfolioBootstrapService.createOrReuseFromContinuation`, which requires `portfolio:read`; Bootstrap writes/review require `portfolio:write` as enforced in service/controller tests. Direct authenticated access bypasses that boundary as described above. Existing Portfolio has canonical list/create/edit surfaces but no caller to Entry interpretation, reverse alignment, or governed SF.

There is no route or service for Enterprise Direct → Strategic Interpretation. There is no route or service for Existing Portfolio → reverse alignment → Anchor → SF. This is a missing capability, not a reason to route existing users through the public Entry UX.

## Area D — Strategic Front runtime

The Prisma `StrategicFront` model persists `name`, `description`, `strategicObjective`, `whyNow`, `mainKpi`, `baseline`, `target`, `horizon`, `sponsor`, `status`, `priority`, `organizationId`, `ownerId` and timestamps. Backend create/update schemas accept that smaller canonical set, and `PortfolioService.createStrategicFront()` calls Prisma create immediately. Reads are exposed by the authenticated Portfolio router.

`PortfolioLeadStrategicFrontsPage.tsx` form state captures additional UI fields including `sponsorEmail`, `threshold`, `area`, `endDate` and `notes`. `front/src/features/portfolio-lead/domain/adapters.ts:toBackendStrategicFront()` forwards only `name`, `strategicObjective`, `whyNow`, `mainKpi`, `baseline`, `target`, `horizon`, `sponsor`, `status` and `priority`. The backend schema/model does not accept the extra fields. This verifies `PL-GAP-02`: UI-only/dropped persistence mismatch. No fix is made.

`PortfolioLeadContext.createStrategicFront()` creates an optimistic local Front, then calls `portfolioService.createStrategicFront(toBackendStrategicFront(input))`; update follows the same optimistic-then-persist pattern. There is no candidate/proposal state before the canonical API call and no material confirmation boundary beyond clicking create/save. Classification for SF: the canonical service/UI is `DO_NOT_REUSE_FOR_SF` as staging; reuse only after a future explicit promotion action.

## Area E — Challenge and candidate feasibility

`front/prisma/schema.prisma:1487-1490` makes `Challenge.strategicFrontId` required and defines the relation with cascade. `portfolio.schemas.ts:createChallengeSchema` contains Challenge fields but no independent candidate type. `PortfolioService.createChallenge(strategicFrontId, input)` first loads the Front and then creates the Challenge with that `strategicFrontId`. The route is `/strategic-fronts/:frontId/challenges` and requires `portfolio:write`.

The frontend `CreateChallengeInput`, Challenge pages and `PortfolioLeadContext.createChallenge()` create an immediate canonical Challenge under a selected Front. No non-canonical candidate Challenge object exists. Bootstrap `ProposedMutation` cannot represent a candidate Challenge using its current target enum, and no other staging object was found.

**CAN CANDIDATE CHALLENGE REMAIN NON-CANONICAL TODAY? `PARTIAL`.** It can remain derived/in-memory/read-only in an SF-2 read model, but it cannot be persisted or reviewed as a candidate using existing Bootstrap targets. Creating an orphan canonical Challenge would require changing the required relation and is an `ADR_REQUIRED_IF_CHANGED` condition. No nullable relation or orphan is introduced.

## Area F — Initiative, pending alignment and imported work

`PortfolioBootstrapWorkItem` can remain `detected`, `needs_review`, `pending`, `confirmed_in_portfolio` or `rejected` without becoming a Project/Initiative. That is the current governed staging representation for imported work. There is no canonical `pending_alignment` field on Work Item, Initiative or `InitiativePortfolioMeta`; the closest state is Work Item `pending`, or `PortfolioStrategicConnection.status=alignment_unknown/partial_alignment`. Classification: `GOVERNED_STAGING`, not canonical Initiative state.

`InitiativePortfolioMeta` requires `projectId` and `challengeId`, with optional `strategicFrontId`, and its status is Step-oriented (`en_step_0` through `en_step_4`, blocked/review/decision variants). The project creation schema accepts `challengeId`/`challengeLink`; `ProjectService.createProject()` loads the Challenge and its Front, creates the Project and materializes portfolio meta/steps/team. Tests `backend/modules/projects/__tests__/portfolio-steps-materialize.test.ts` and `create-initiative-team.test.ts` pin this behavior. Thus Project-from-Challenge collapses Challenge linkage, Initiative shell creation and Step materialization into one existing lifecycle. Invitation/acceptance is a separate ChallengeInvitation lifecycle, but no SF boundary inserts a pending Initiative before canonical Challenge. This is relevant collision `PL-GAP-06`; it is deferred to Activation/Handoff and not changed here.

## Area G — Copilot infrastructure

`backend/modules/copilot/application/capability-registry.ts:createDefaultCapabilityRegistry()` registers only `CreateStrategicFront`. `CopilotOrchestrationService` saves an IntentAssessment, creates an ActionPlan and ProposedAction, requires confirmation, and routes only an executable `create_strategic_front` assessment. `ApprovalService`, `ActionExecutor`, `strategic-front.authorization.ts`, audit writes and idempotency provide reusable orchestration infrastructure. `front/src/features/copilot/components/PortfolioCopilotShell.tsx` presents conversation, assessment, clarification, action plan, approval and execution result.

The capability tests explicitly assert that `CreateChallenge` is not registered. No `AssignInitiativeOwner` or clustering/Strategic Framing proposal capability was found. Therefore the known productive-capability hypothesis is verified:

```text
CreateStrategicFront: productive
CreateChallenge: not productive
AssignInitiativeOwner: not productive
Clustering / SF proposal: not productive
```

The shell can be reused as an advisory layer only if its proposed structured state remains separate from the SF system of record and every future apply step has explicit human confirmation. SF-2 does not need Copilot changes.

## Area H — UI surfaces and host analysis

| Surface | Current job/source/mutations | Classification for SF |
|---|---|---|
| `/portfolio/inicio` / `PortfolioLeadHomePage` | Home command/read surface; reads PortfolioLeadContext and PH-style Home; Bootstrap only with continuation; no SF mutation boundary | Pattern only; `LEGACY_COMPAT_ONLY` as host |
| `/portfolio/frentes-estrategicos` / `PortfolioLeadStrategicFrontsPage` | Lists/forms canonical Fronts; create/update/delete through Portfolio API; optimistic context | `DO_NOT_REUSE_FOR_SF` as staging; pattern only after promotion |
| `/portfolio/retos` / `PortfolioLeadChallengesPage` | Lists/forms canonical Challenges under selected Front; activation/invitation mutations | `DO_NOT_REUSE_FOR_SF` as staging |
| `/portfolio/iniciativas` | Existing Initiative/portfolio tracking surface backed by Project + InitiativePortfolioMeta | `LEGACY_COMPAT_ONLY` for SF read context |
| Bootstrap `PortfolioBootstrapHome` | Anchor, work intake, analysis, connections, proposed mutations and first reading | `REUSE_WITH_ADAPTER` for read/staging patterns |
| Copilot shell/drawer | Advisory conversation and approved action execution | `REUSE_WITH_ADAPTER` as optional cognitive layer |
| `PortfolioHomeReadService` / `/api/v1/portfolio/home` | Authenticated read-only composition; no persisted projection | `REUSE_AS_IS` as read-model pattern |

### Host analysis

**Option A — extend existing Bootstrap surface.** Current code supports Anchor/intake/proposals and has a guarded route. Risk: Bootstrap phases and `PortfolioBootstrapProposedMutation` are not SF and do not represent Front/Challenge candidates. It can violate the SF-0 separation if Bootstrap becomes the Strategic Framing system of record. SF-2 should decide only whether to compose existing reads, not expand Bootstrap mutation semantics.

**Option B — new Strategic Framing workspace/route.** No current route/service exists, so this is architecturally the cleanest future host for a governed read model, but it is outside SF-2 and would need route/authorization decisions. It should be decided in SF-2+ after read inputs are verified.

**Option C — extend Front detail/create.** Current code supports direct canonical Front mutation only. It would collapse provisional interpretation into canonical state and violates the promotion boundary. Do not use as SF staging.

**Option D — other existing host (Home/Initiatives).** Existing Home and Initiative surfaces are read/tracking or Step lifecycle surfaces. They have useful context but would mix SF with Home/Activation/Steps. Use as read sources only. Host selection remains deferred; no aesthetic selection is made in SF-1.

## Area I — permissions and authorization

| Operation | Current authorization | SF implication |
|---|---|---|
| Portfolio Home read | `authenticate`; `/api/v1/portfolio/home` has no `portfolio:write` gate and tests verify authenticated read | View is explicit authentication; minimum future view can reuse `portfolio:read`/authenticated read policy, but exact SF view permission is unresolved |
| Bootstrap session/read | service checks `portfolio:read`; routes use auth | Explicit read capability |
| Bootstrap Anchor/work/proposal writes and material review | `portfolio:write`; integration tests verify read-only users cannot import/review/publish | Explicit write capability and human authority boundary |
| Strategic Front create/update/delete | `authenticate` + `requirePermission('portfolio:write')` | Existing canonical promotion permission candidate |
| Challenge create/update/publish/invitation | `authenticate` + `requirePermission('portfolio:write')` | Existing canonical promotion permission candidate |
| Copilot CreateStrategicFront | organization access plus `canCreateStrategicFront`, feature guard and command execution authorization; tests cover authorization | Reusable only for explicit canonical promotion, not provisional SF state |
| Imported work | Bootstrap auth; import and commit are write-gated by service permissions | Suitable source/staging input |

Permissions are capability-based via `backend/shared/authz/permissions.ts` and ADR-029. There is no explicit permission for “view Framing”, “edit provisional Framing”, “confirm interpretation” or “promote candidate Challenge”. Those are missing/unclear and must not be invented in SF-1. Minimum current mapping is authenticated/`portfolio:read` for a read model, `portfolio:write` for material review and canonical promotion; Challenge promotion also requires an existing Front.

## Area J — tests and evidence map

| Test/evidence | Classification |
|---|---|
| `backend/modules/portfolio-entry-runtime/__tests__/session-controller.test.ts` | Reusable contract protection for question budget, active question and convergence |
| `backend/modules/portfolio-entry-runtime/__tests__/value-handoff-cognition.test.ts` and live adapter tests | Reusable evidence for provisional handoff, unresolved decision and provenance |
| `backend/modules/portfolio-entry-conversion/__tests__/*` and continuation/session integration tests | Reusable Entry confirmation/continuation boundary; not an SF implementation |
| `backend/modules/portfolio-bootstrap/__tests__/portfolio-anchor-derivation.test.ts` | Reusable Anchor sufficiency/provenance/contradiction protection |
| `backend/modules/portfolio-bootstrap/__tests__/portfolio-bootstrap.integration.test.ts` | Reusable intake/import/permissions/material review evidence; targeted SF-2 extension candidate |
| `backend/modules/portfolio-bootstrap/__tests__/portfolio-bootstrap.router.test.ts` | Reusable route ownership/auth evidence |
| `front/src/features/portfolio-lead/bootstrap/domain/__tests__/*` | Reusable derived Bootstrap domain/projection evidence |
| `backend/modules/portfolio/__tests__/portfolio.router.authz.test.ts` | Reusable canonical Portfolio permission protection and PH read boundary |
| `backend/modules/portfolio/__tests__/portfolio-home.read-service.test.ts` | Reusable Home read-only composition boundary |
| `front/src/app/pages/__tests__/PortfolioLeadStrategicFrontChallenge.ds07.test.tsx` and PortfolioLeadContext tests | Evidence of current UI behavior; conflicting with SF staging if reused directly |
| `backend/modules/copilot/__tests__/capability-registry.test.ts`, approval/executor/orchestration tests | Reusable orchestration/approval/audit protection; confirms only Front capability |
| `backend/modules/projects/__tests__/portfolio-steps-materialize.test.ts` | Legacy/current lifecycle evidence; must not be used to define SF behavior |
| `front/e2e/portfolio-steps-integration.spec.ts` | Existing Steps integration evidence; unrelated to SF-2 and protected from writes |

No tests were changed or run in SF-1. The repository has tests for the existing boundaries but no SF runtime/read-model tests.

## Reuse map

| Capability needed by SF | Current component | Current state classification | Reuse classification | Gap | Earliest slice |
|---|---|---|---|---|---|
| Strategic Interpretation | Entry analysis/session/handoff | PROVISIONAL / GOVERNED_STAGING | REUSE_WITH_ADAPTER | No non-Entry application boundary | SF-2 read; SF-3 extraction |
| Scope assessment | Entry frame/context; Bootstrap conditions | DERIVED | REUSE_WITH_ADAPTER | No SF scope model | SF-2 derived |
| Portfolio Anchor | `PortfolioAnchor`, derivation/history | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Parent/uncertainty fields are indirect | SF-2 read |
| Provenance | Entry provenance + Bootstrap source refs | GOVERNED_STAGING | REUSE_WITH_ADAPTER | No unified SF provenance DTO | SF-2 adapter |
| Uncertainty | Entry ambiguities/contradictions; Bootstrap uncertainty | PROVISIONAL / GOVERNED_STAGING | REUSE_WITH_ADAPTER | No unified model | SF-2 derived |
| Reverse alignment | Entry `reverse_alignment` | PROVISIONAL | REUSE_WITH_ADAPTER | Existing Portfolio cannot invoke it | SF-3+ |
| Existing-work intake | manual/paste/CSV/XLSX Bootstrap intake | GOVERNED_STAGING | REUSE_AS_IS for reads | No direct SF route/caller | SF-2 read |
| Pending alignment | WorkItem pending + StrategicConnection unknown/partial | GOVERNED_STAGING | REUSE_WITH_ADAPTER | No canonical pending-alignment state | SF-2 derived |
| ProposedMutation/human review | Bootstrap ProposedMutation routes/service | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Targets exclude candidate Front/Challenge | SF-3+ |
| Candidate Front | none | MISSING | MISSING | No non-canonical type/staging | SF-3+; possible ADR if canonical semantics change |
| Candidate Challenge | none; required canonical Front | MISSING | ADR_REQUIRED_IF_CHANGED | No non-canonical staging target | SF-3+; ADR if schema/cardinality changes |
| Adaptive depth | Entry quick clarification/question budget | PROVISIONAL | REUSE_WITH_ADAPTER | Entry-specific, not SF adaptive depth | SF-3+ |
| Lenses | no productive SF runtime representation found | MISSING | MISSING | Candidate library is documentary only | SF-3+ |
| Observations | no canonical SF observation model | MISSING | DO_NOT_REUSE_FOR_SF | Avoid inventing persisted authority | SF-3+ / ADR if canonical |
| Drivers/gaps/opportunities | Bootstrap advancement conditions and Entry gaps | DERIVED / GOVERNED_STAGING | REUSE_WITH_ADAPTER | Not canonical SF taxonomy | SF-3+ |
| Prioritization | Portfolio/UI priority exists on canonical Front; no SF prioritization | CANONICAL + UI_ONLY | DO_NOT_REUSE_FOR_SF as provisional state | No governed provisional prioritization | SF-3+ |
| Capacity/horizon reasoning | Existing Front fields and Challenge activation inputs | CANONICAL/UI_ONLY | REUSE_WITH_ADAPTER | Not SF reasoning model | SF-3+ |
| Canonical Front promotion | PortfolioService + `portfolio:write`; Copilot command | CANONICAL | EXTEND_LATER | No candidate-to-promotion boundary | SF-3+ |
| Canonical Challenge promotion | PortfolioService under required Front | CANONICAL | ADR_REQUIRED_IF_CHANGED for orphan path | No candidate promotion path | SF-3+ |
| Copilot suggestions | Copilot assessment/action plan/proposed action | GOVERNED_STAGING | REUSE_WITH_ADAPTER | Only Front create capability | SF-3+; no SF-2 change |
| No-Copilot structured workflow | Bootstrap Anchor/intake/review UI | GOVERNED_STAGING | REUSE_WITH_ADAPTER | No SF workspace/read model | SF-2 read; SF-3+ workflow |
| Home integration | PH-2 `PortfolioHomeReadService`; PH-3B absent | DERIVED | REUSE_AS_IS as boundary | Frontend does not consume PH-2 | Later PH/SF integration |

## Risk / conflict register

### SF1-F01 — direct authenticated Portfolio entry bypasses governed setup

- **Severity:** MATERIAL
- **Current behavior:** `/portfolio/inicio` renders Home without a continuation; Bootstrap renders only when the query continuation exists.
- **Evidence:** `front/src/app/pages/PortfolioLeadHomePage.tsx:34-89`; `front/src/app/routes.ts:111-118`.
- **SF-0 rule:** all entry modes should converge through Strategic Interpretation and a sufficient Anchor before SF.
- **Treatment:** `ADAPT`
- **Target slice:** SF-3+ entry orchestration; SF-2 only documents/read-composes.

### SF1-F02 — Strategic Front persistence mismatch

- **Severity:** MATERIAL
- **Current behavior:** Front form captures `sponsorEmail`, `threshold`, `area`, `endDate`, `notes`; `toBackendStrategicFront()` forwards a smaller set and backend/model do not persist the extras.
- **Evidence:** `front/src/app/pages/PortfolioLeadStrategicFrontsPage.tsx`; `front/src/features/portfolio-lead/domain/adapters.ts:163-170`; `backend/modules/portfolio/portfolio.schemas.ts:5-21`; `front/prisma/schema.prisma:1463-1485`.
- **SF-0 rule:** canonical/provisional state must be explicit and preserved; direct UI fields cannot be assumed canonical.
- **Treatment:** `ISOLATE`
- **Target slice:** separate Portfolio debt / later product decision; do not fix in SF-1/SF-2.

### SF1-F03 — no candidate Challenge staging

- **Severity:** MATERIAL
- **Current behavior:** Challenge requires `strategicFrontId`; current mutation creates canonical records only below a Front; ProposedMutation target types exclude candidate Challenge.
- **Evidence:** `front/prisma/schema.prisma:1487-1490`; `backend/modules/portfolio/portfolio.service.ts:createChallenge`; `front/prisma/schema.prisma:2409-2424`.
- **SF-0 rule:** candidate Challenge requires resolved/confirmed Front and explicit human promotion.
- **Treatment:** `ADR_CANDIDATE`
- **Target slice:** SF-3+; ADR only if canonical relation/cardinality or new domain persistence must change.

### SF1-F04 — Copilot single-capability limitation

- **Severity:** MATERIAL
- **Current behavior:** capability registry/productive orchestration supports only `CreateStrategicFront`; CreateChallenge, owner assignment and clustering are absent.
- **Evidence:** `backend/modules/copilot/application/capability-registry.ts`; `copilot-orchestration.service.ts`; `__tests__/capability-registry.test.ts`.
- **SF-0 rule:** Copilot is advisory and cannot silently create Challenges or organizational authority.
- **Treatment:** `DEFER`
- **Target slice:** SF-3+; no SF-2 Copilot change.

### SF1-F05 — semantic clustering absent

- **Severity:** MATERIAL
- **Current behavior:** Bootstrap analyzer is deterministic overlap/condition analysis; no productive candidate Front/Challenge clustering exists.
- **Evidence:** `backend/modules/portfolio-bootstrap/portfolio-bootstrap.analyzer.ts`; `PortfolioBootstrapAnalyzerMode`; no candidate target enum.
- **SF-0 rule:** observations → drivers/gaps/opportunities → prioritization → human confirmation; no automatic Challenge.
- **Treatment:** `DEFER`
- **Target slice:** SF-3+.

### SF1-F06 — ownerCandidate is not ownership

- **Severity:** MATERIAL
- **Current behavior:** Work Item stores a free-text `ownerCandidate`; no assignment relation or owner authorization is created by intake/analyzer.
- **Evidence:** `front/prisma/schema.prisma:2720-2747`; `portfolio-bootstrap.analyzer.ts:ownership_visibility`; `PortfolioBootstrapWorkItemDto`.
- **SF-0 rule:** interpretation and suggestions cannot silently grant organizational authority.
- **Treatment:** `KEEP` as provisional hint; `ADAPT` when consumed.
- **Target slice:** SF-2 labeling; later ownership capability.

### SF1-F07 — Project-from-Challenge lifecycle collision

- **Severity:** MATERIAL
- **Current behavior:** project creation from Challenge links the Challenge, creates Project/Initiative meta and materializes Steps/team; InitiativePortfolioMeta requires Challenge.
- **Evidence:** `backend/modules/projects/project.schemas.ts:3-20`; `backend/modules/projects/project.service.ts:createProject`; `front/prisma/schema.prisma:1611-1639`; `backend/modules/projects/__tests__/portfolio-steps-materialize.test.ts`.
- **SF-0 rule:** Framing must not collapse Challenge, Invitation, Accept, Start, Initiative and Step activation.
- **Treatment:** `ISOLATE`
- **Target slice:** Activation/Handoff / later lifecycle ADR if needed.

### SF1-F08 — PH frontend does not consume PH-2

- **Severity:** INFO
- **Current behavior:** PH-2 read service exists as a read-only composition, while `PortfolioLeadHomePage` still uses the existing Home/Bootstrap branches; PH-3B frontend is not present.
- **Evidence:** `backend/modules/portfolio/portfolio-home.read-service.ts`; `backend/modules/portfolio/portfolio.router.ts:35-36`; `CURRENT_STATE.md`; `front/src/app/pages/PortfolioLeadHomePage.tsx`.
- **SF-0 rule:** Home is downstream read context, not SF system of record.
- **Treatment:** `DEFER`
- **Target slice:** PH-3B / later integration.

### SF1-F09 — no productive Enterprise Direct / Existing Portfolio interpretation boundary

- **Severity:** BLOCKER for full SF journey, not a blocker for read-only SF-2
- **Current behavior:** only Entry continuation has a service boundary into Bootstrap; existing Portfolio routes call canonical list/mutation APIs.
- **Evidence:** `PortfolioBootstrapService.createOrReuseFromContinuation`; Portfolio router; routes/layout inventory.
- **SF-0 rule:** Entry is not the exclusive gateway.
- **Treatment:** `ADAPT`
- **Target slice:** SF-3+.

### SF1-F10 — canonical Front/Challenge direct mutation is unsafe as SF staging

- **Severity:** BLOCKER for mutation implementation, not a blocker for SF-2
- **Current behavior:** Front and Challenge forms/API calls write canonical records immediately; no candidate/proposal state precedes them.
- **Evidence:** `PortfolioLeadContext.tsx:createStrategicFront/createChallenge`; `PortfolioService`; Portfolio router.
- **SF-0 rule:** explicit human confirmation is required before canonical promotion; no automatic Challenge.
- **Treatment:** `DO_NOT_REUSE_FOR_SF`
- **Target slice:** SF-3+ promotion design.

## SF-2 recommendation — Strategic Framing Read Model

The smallest safe SF-2 is a read-only composition, preferably an application-level read service without new persistence or new route.

1. **SF-2 should read:** latest confirmed/provisional Entry handoff/continuation snapshot; Bootstrap Anchor and Anchor history; Bootstrap session phase/status; Work Items and source/provenance; StrategicConnections; AdvancementConditions; ProposedMutations and their review status; latest Bootstrap Reading; existing canonical Fronts/Challenges/InitiativePortfolioMeta only as contextual read data; existing PH read model only as downstream context.
2. **SF-2 should not write:** no Front, Challenge, Initiative, Project, Step, Anchor, Work Item, StrategicConnection, ProposedMutation confirmation, Copilot ActionPlan execution, or Home/Activation state.
3. **Existing sources:** use the current canonical/staging sources above. Do not treat persisted data as canonical solely because it is in Prisma; preserve source status and provenance in the read DTO.
4. **Derived/in-memory concepts:** `front_like`, `challenge_like`, `initiative_like`, `unresolved`; scope assessment; parent context state; open uncertainty summary; movement/contribution/outcome separation; candidate observations/drivers/gaps/opportunities; and pending alignment may remain derived/read-only. They must not be persisted as canonical domain entities in SF-2.
5. **New persistence:** **NO** for the smallest safe slice. New persistence is unresolved only for later candidate/promotion slices and would require explicit authority/ADR assessment.
6. **New route:** **NO** for SF-2. Expose the composition through an existing internal boundary or test-level service first; route/host selection is SF-2+ only if required by an approved implementation slice.
7. **Copilot:** **NO** runtime changes. The Copilot shell may be read as optional infrastructure, but no capability is added or broadened.
8. **Boundary tests:** read-only source composition; preservation of provenance and provisional status; Anchor ≠ Front; Work Item ≠ Initiative; `ownerCandidate` ≠ owner; no candidate/AI inference becomes canonical; no Challenge is created; no Front/Challenge/Project/Step writes occur; direct/no-continuation input remains visible as a gap rather than silently bypassed.
9. **Deferred SF-3+:** non-public interpretation entry points, adaptive SF interaction, lenses, observations/drivers/gaps/opportunities, prioritization/capacity reasoning, candidate Front/Challenge staging, human promotion, canonical mutation, Copilot SF capabilities, Home integration and lifecycle separation.

## ADR assessment

No ADR was created in SF-1. Future `ADR CANDIDATE` conditions are:

- canonical Challenge without a Strategic Front or changed Front → Challenge cardinality;
- canonical StrategicLens, StrategicObservation or StrategicGap persistence;
- new AI organizational authority or automatic canonical promotion;
- changing Project/Initiative identity or introducing a new lifecycle between Challenge and Initiative;
- material role/permission authority change;
- new persistent candidate Front/Challenge lifecycle if it changes current domain semantics.

SF-2 itself does not require an ADR if it remains read-only and preserves the current authority boundaries.

## Validation record

- `git diff --check`: PASS after artifact creation.
- Conflict marker scan (`<<<<<<<`, `=======`, `>>>>>>>`) over the audit artifact and inspected repository text: PASS.
- Markdown/reference sanity: PASS for the referenced repository paths and symbols used in this report; the execution brief remains unchanged.
- Runtime files changed: NO.
- Schema/migrations changed: NO.
- Tests changed: NO.
- Commit/push: NO.

The checkout already contained the execution brief as an untracked repository file before this audit; it was preserved and not rewritten. The only file created by SF-1 is this audit artifact.

## Final SF-1 report

```text
SF-1 STATUS: GO_WITH_GAPS

BRANCH: audit/strategic-framing-sf1
BASE HEAD: 0bfb4e7ddc6e9c06bb96e5270c3f44639b88d89e
COMMIT CREATED: NO
PUSH PERFORMED: NO

AUDIT ARTIFACT:
docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_CURRENT_STATE_AUDIT_SF1_v0.1.md

CURRENT STATE:
- Public Entry → governed continuation: IMPLEMENTED
- Enterprise Direct → Strategic Interpretation: MISSING
- Existing Portfolio → Strategic Interpretation: MISSING
- Portfolio Anchor: IMPLEMENTED
- Reverse alignment: PARTIAL
- Existing-work intake: IMPLEMENTED
- Candidate Front staging: MISSING
- Candidate Challenge staging: MISSING
- Canonical Front create: IMPLEMENTED
- Canonical Challenge requires Front: YES
- Adaptive depth: PARTIAL
- Strategic lenses: MISSING
- Gap/opportunity prioritization: PARTIAL
- Copilot orchestration shell: IMPLEMENTED
- Copilot SF capability coverage: MISSING

REUSE:
- Entry cognition: REUSE_WITH_ADAPTER
- Bootstrap Anchor: REUSE_WITH_ADAPTER
- StrategicConnection: REUSE_WITH_ADAPTER
- ProposedMutation: REUSE_WITH_ADAPTER
- Bootstrap analyzer: REUSE_WITH_ADAPTER
- Portfolio canonical services: DO_NOT_REUSE_FOR_SF
- Copilot infrastructure: REUSE_WITH_ADAPTER
- Existing Front UI: DO_NOT_REUSE_FOR_SF

KNOWN GAPS VERIFIED:
- PL-GAP-01 direct entry bypass: YES
- PL-GAP-02 Front persistence mismatch: YES
- PL-GAP-03 ownerCandidate != ownership: YES
- PL-GAP-04 clustering absent: YES
- PL-GAP-05 Copilot coverage incomplete: YES
- PL-GAP-06 lifecycle collision relevant to SF: YES
- PL-GAP-07 PH-3B pending: YES

AUTHORITY:
- Core INV-01 preserved: YES
- Core INV-02 preserved: YES
- Candidate Challenge can remain non-canonical: PARTIAL
- ADR required for SF-2: NO
- ADR candidates for later slices: canonical Challenge without Front; canonical Lens/Observation/Gap; changed Front→Challenge cardinality; new AI authority; Project≠Initiative identity/lifecycle change; material role authority change

SF-2 RECOMMENDATION:
- read-only first: YES
- new persistence required: NO
- new route required now: NO
- Copilot runtime change required now: NO
- proposed inputs: Entry handoff/continuation; Bootstrap Anchor/history/session; Work Items; StrategicConnections; AdvancementConditions; ProposedMutations; latest Reading; canonical Front/Challenge/Initiative read context; PH read model
- proposed derived outputs: provisional entry type; scope; parent-context status; provenance; uncertainty; pending alignment; observations/drivers/gaps/opportunities; movement/contribution/outcome separation
- explicit writes prohibited: all Front/Challenge/Initiative/Project/Step/Anchor/Work Item/connection/proposal confirmations, Copilot execution and Home/Activation writes

FINDINGS:
- blockers: 2 (SF1-F09 full journey, SF1-F10 mutation boundary)
- material: 7
- minor/info: 1

VALIDATION:
- git diff --check: PASS
- conflict marker scan: PASS
- markdown/reference check: PASS
- runtime files changed: NO
- schema changed: NO
- tests changed: NO

READY FOR HUMAN REVIEW: YES
READY FOR SF-2 AFTER HUMAN REVIEW: YES
```
