> HISTORICAL: ver ../../CURRENT_STATE.md. Esta auditoria conserva el estado observado de Portfolio Entry; no autoriza cambios productivos ni reemplaza el contrato vigente ../experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md.

# Portfolio Entry Current State Audit

Audit prompt: `docs/audit-prompts/CODEX_AUDIT_PROMPT_PORTFOLIO_ENTRY_v0.1.md`

Execution mode: AUDIT ONLY. No implementation, refactor, schema, migration, prompt, Step 0-4, Adaptive Cycle, checkpoint or contract changes were made.

## 1. Authority Read Confirmation

Found and read before implementation analysis:

- `AGENTS.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `docs/core/STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md`
- `docs/governance/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md`
- `docs/adr/ADR-001-model-selection.md`
- `docs/adr/ADR-002-agent-orchestration.md`
- `docs/adr/ADR-003-prompt-strategy.md`
- `docs/adr/ADR-004-pdf-extraction-model.md`
- `docs/adr/ADR-005-autofill-provenance-ux.md`
- `docs/adr/ADR-006-public-editor-suggestion-model.md`
- `backend/docs/adr/ADR-015-public-pilot-lead-capture.md`
- `backend/docs/adr/ADR-016-public-ai-field-refinement.md`
- `backend/docs/adr/ADR-018-pilot-code-to-project.md`
- `backend/docs/adr/ADR-030-challenge-and-initiative-state-machine.md`

Relevant authority summary:

- `Portfolio Entry` is pre-Core and must not create `Organization`, `StrategicFront`, `Challenge`, `Initiative`, `Step`, `Decision` or canonical evidence from Screen 1.
- Screen 1 must produce provisional, traceable `PortfolioEntryDraft` and `PortfolioEntryAnalysis` state, not canonical corporate objects.
- Screen 1 must not accept or display upload controls for PDFs or other external files.
- AI may extract, classify, infer, identify ambiguity and suggest next questions, but must not confirm strategy, invent validation, canonicalize corporate objects or activate Steps.
- `PublicDraft` must not be assumed equivalent to `PortfolioEntryDraft`.

## 2. Repository Surface Found

Main routes:

- `/` renders `LandingPage` and sends primary CTAs to `/public/start`.
- `/public/start` renders `PublicStartPage`.
- `/public/draft/:draftId/edit` renders `PublicProposalEditorPage`.
- `/auth/continue/:draftId` renders `ProgressiveSignupPage`.
- `/public/continuar` renders `PublicResumeWithCodePage`.
- Authenticated continuation may reach `/continuar-piloto`, `/projects/:projectId` or legacy `/projects/:projectId/step/0`.

Primary frontend files:

- `front/src/app/routes.ts`
- `front/src/app/pages/LandingPage.tsx`
- `front/src/app/pages/public/PublicStartPage.tsx`
- `front/src/app/pages/public/PublicProposalEditorPage.tsx`
- `front/src/app/pages/public/PublicProposalResultPage.tsx`
- `front/src/app/pages/public/ProgressiveSignupPage.tsx`
- `front/src/app/pages/public/PublicResumeWithCodePage.tsx`
- `front/src/app/pages/AuthPage.tsx`
- `front/src/app/pages/ContinuePilotPage.tsx`
- `front/src/features/public-start/domain/types.ts`
- `front/src/features/public-start/domain/copy.ts`
- `front/src/features/public-start/domain/rules.ts`
- `front/src/features/public-start/services/publicDraftStorage.ts`
- `front/src/features/public-start/services/publicDraftService.ts`
- `front/src/features/public-start/services/publicPilotLeadService.ts`
- `front/src/features/public-start/services/publicFieldRefineService.ts`
- `front/src/app/hooks/usePublicPdfAutofill.ts`
- `front/src/app/services/publicPdfAutofillService.ts`

Primary backend and AI files:

- `backend/app.ts`
- `backend/modules/initiative-pdfs/public-pdf.router.ts`
- `backend/modules/initiative-pdfs/public-pdf.controller.ts`
- `backend/modules/initiative-pdfs/public-pdf.schemas.ts`
- `backend/modules/initiative-pdfs/public-pdf.service.ts`
- `backend/modules/public-ai/refine-field.router.ts`
- `backend/modules/public-ai/refine-field.controller.ts`
- `backend/modules/public-ai/refine-field.schemas.ts`
- `backend/modules/public-ai/refine-field.service.ts`
- `backend/modules/pilot-leads/pilot-lead.router.ts`
- `backend/modules/pilot-leads/pilot-lead.service.ts`
- `backend/modules/pilot-leads/pilot-claim.service.ts`
- `backend/modules/pilot-leads/pilot-proposal.mapper.ts`
- `backend/modules/projects/project.service.ts`
- `front/prisma/schema.prisma`
- `ai-service/routers/ai.py`
- `ai-service/agents/field_refiner.py`
- `ai-service/agents/pdf_extractor/*`

## 3. Current Real Flow

### `/` to `/public/start`

`LandingPage` uses `/public/start` as the pre-project CTA route. It is a marketing/public entry page and does not submit or persist portfolio entry data itself.

### `/public/start` text submit

`PublicStartPage` holds local `inputText`, `notice`, `loading`, `uploadDraftId`, `anonymousSessionId` and PDF upload state. Text submit:

1. trims textarea input;
2. blocks if trimmed length is below 30 characters;
3. writes `starteria.publicStart.inputText` to `sessionStorage`;
4. calls `createPublicDraftFromInput(trimmed)`;
5. navigates to `/public/draft/${draft.id}/edit`.

No backend/API call occurs on the text submit path. No real AI analysis occurs on this path. The generated output is local deterministic heuristic data stored as `PublicDraft`.

### `/public/start` PDF upload

If `isPdfAutofillEnabled()` is true, the page shows a PDF dropzone and accepts a validated PDF. It:

1. creates a local upload draft with `createPublicDraftFromUpload(file.name)`;
2. uploads to `POST /api/v1/public/pdf-extract`;
3. polls `GET /api/v1/public/pdf-extract/runs/:runId`;
4. fetches `GET /api/v1/public/pdf-extract/runs/:runId/proposals`;
5. merges proposals into `AutofillContext` under the anonymous draft id;
6. navigates to `/public/draft/:draftId/edit`.

This is explicitly a public PDF surface. It conflicts with the active Portfolio Entry contract for Screen 1.

### Editor and proposal

`PublicProposalEditorPage` loads `PublicDraft` from sessionStorage and renders `PublicProposalEditor`. The editor:

- edits `PublicDraftOutput` fields such as `proposalTitle`, `whatToMove`, `whyNow`, `impactedAudience`, `initialEvidence`, `supportNeeded` and `decisionRequested`;
- can call `POST /api/v1/public/refine-field` through the backend bridge and ai-service `POST /api/v1/ai/refine-field`;
- falls back to local suggestions if the AI bridge fails;
- can export/copy a one-pager;
- calls `finishPublicDraft(draft.id)` and navigates to `/auth/continue/:draftId`;
- displays CTA copy: "Convertir en iniciativa y seguir en Starteria".

This behavior is closer to a public proposal editor/pilot funnel than to the new Portfolio Entry Screen 1 analysis contract.

### Lead capture and auth continuation

`ProgressiveSignupPage` is mounted at `/auth/continue/:draftId`, but it is a pilot interest form, not full account creation. It captures name/email/consent and optional phone/organization, then calls `submitPilotInterest`.

`submitPilotInterest` posts to `POST /api/v1/public/pilot-leads`, including a snapshot of the local proposal. Backend persists `PilotLead` with PII, consent timestamp, retention metadata and optional proposal snapshot. It does not create Project during lead submission.

`PublicResumeWithCodePage` lets a user redeem a `ST-PILOT-XXXX` code. It issues a short-lived claim token via `POST /api/v1/public/pilot-leads/:pilotCode/claim`, stores it client-side, then sends the user to `/auth`.

After auth, `ContinuePilotPage` calls authenticated `POST /api/v1/public/pilot-leads/consume-claim`. Backend `PilotClaimService.consume` calls the production `createPilotProject` callback if no project already exists for the lead.

### Conversion to Project, Step rows and Step 0

`backend/modules/pilot-leads/pilot-lead.router.ts` wires `createPilotProject` to:

- call `ProjectService.createProject(userId, { name: deriveProjectName(proposal) })`;
- update the created `Project` with `pilotLeadId`;
- map the proposal to Step 0 data via `mapProposalToStep0Data`;
- call `ProjectService.updateStep0(..., 'IN_PROGRESS')`.

`ProjectService.createProject` creates a `Project` row, owner team member and Step rows for numbers 1-4. It initializes `currentStep` and `step0Status` based on linked challenge state. In the pilot claim callback no `challengeId` or `challengeLink` is passed, so no `Challenge` is linked and no inherited challenge Step 0 data is created. The subsequent `updateStep0` stores mapped public proposal data on `Project.step0Data` and sets `step0Status` to `IN_PROGRESS`.

## 4. Persistence Inventory

Current public draft persistence:

- `PublicDraft` exists only in browser `sessionStorage` under `starteria.publicStart.drafts`.
- Anonymous session id exists in `sessionStorage` under `starteria.publicStart.anonymousSessionId`.
- `PublicDraft` has `mode: 'initiative'`, source type, status lifecycle, `aiOutput`, optional questions/recommendation, and conversion-related fields.
- Expiration is client-side only, currently 24 hours.

Backend persistence:

- No Prisma model named `PublicDraft` or `PortfolioEntryDraft` was found.
- `PilotLead` exists and stores `draftId`, `pilotCode`, PII, consent, status, source, retention and proposal snapshot.
- `PilotClaimToken` exists and stores hashed claim tokens and optional `createdProjectId`.
- `Project` stores `pilotLeadId`, `step0Data`, `step0Status` and has relations to Steps, Evidence, decisions and adaptive entities.
- `Step` rows are project-scoped and created by `ProjectService.createProject`.

Conclusion: the repo currently has no authoritative `PortfolioEntryDraft` or `PortfolioEntryAnalysis` persistence model. `PublicDraft` is browser-local and semantically different.

## 5. AI and Prompt Inventory

Text submit on `/public/start` does not call AI. `generateMockPublicDraftOutput` creates deterministic heuristic output in the frontend.

The editor-level "Ajustar con IA" path calls:

- frontend `refinePublicField`;
- backend `POST /api/v1/public/refine-field`;
- ai-service `POST /api/v1/ai/refine-field`;
- `ai-service/agents/field_refiner.py`.

That prompt refines one field while preserving the user's meaning and says not to invent data, metrics or facts. It is not a Portfolio Entry analysis prompt and does not produce intent classification, entry-state classification, extracted context, ambiguity list, missing critical context, reverse alignment or question plan.

The PDF upload path calls:

- frontend `uploadPublicPdf`;
- backend `POST /api/v1/public/pdf-extract`;
- ai-service `POST /api/v1/ai/pdf-extract`;
- `ai-service/agents/pdf_extractor/*`.

The PDF extractor is Step-scoped, with public target `step_0`. It produces Step 0 autofill proposals with provenance, not Portfolio Entry analysis.

## 6. Test Inventory

Current relevant tests protect the existing behavior, not the new Portfolio Entry contract:

- `front/e2e/public-start-access.spec.ts`
- `front/e2e/public-pdf-autofill.spec.ts`
- `front/src/app/__tests__/pdf-autofill-integration.test.tsx`
- `front/src/features/public-start/components/__tests__/PublicProposalEditor.refine.test.tsx`
- `front/src/features/public-start/services/__tests__/publicPilotLeadService.test.ts`
- `backend/modules/initiative-pdfs/__tests__/public-pdf.router.test.ts`
- `backend/modules/pilot-leads/__tests__/pilot-lead.router.test.ts`
- `backend/modules/pilot-leads/__tests__/pilot-claim.router.test.ts`
- `ai-service/tests/test_field_refiner.py`
- `ai-service/tests/test_public_path_step0_parity.py`
- `ai-service/tests/test_pdf_extractor_target_step.py`

These tests are valuable regression evidence for current behavior, but implementation planning will need new tests for:

- no file upload controls on Screen 1;
- text submit creates only provisional Portfolio Entry state;
- no canonical object creation from Screen 1;
- analysis output shape and provenance;
- all contract entry states;
- unknown/incomplete input handling;
- handoff boundaries before Initiative/Step creation.

## 7. Explicit Canonical Object Creation Check

Current `/public/start` text submit:

- `Organization`: not created.
- `StrategicFront`: not created.
- `Challenge`: not created.
- `Initiative`: no model named Initiative found; no Project created on text submit.
- `Step`: not created on text submit.
- `Decision`: not created.

Current `/public/start` PDF submit:

- `Organization`: not created.
- `StrategicFront`: not created.
- `Challenge`: not created.
- `Initiative`: no model named Initiative found; no Project created during PDF upload.
- `Step`: not created during PDF upload.
- `Decision`: not created.
- Evidence: no canonical Evidence row found on public PDF upload; uploaded bytes are stored by draft/run key and extraction runs are in-memory.

Current downstream pilot claim after auth:

- `Organization`: not created; `PilotLead.organization` is a string, not an Organization row.
- `StrategicFront`: not created.
- `Challenge`: not created because `createPilotProject` passes no challenge link.
- `Initiative`: the canonical initiative surrogate in this codebase is `Project`; a `Project` is created after authenticated claim consumption.
- `Step`: Step rows 1-4 are created by `ProjectService.createProject`; Step 0 data/status are stored on `Project` by `updateStep0`.
- `Decision`: not created in the audited public/pilot path.

Therefore Screen 1 itself does not currently create canonical objects, but the current public funnel can terminate in Project and Step creation after lead claim and authentication.

## 8. KEEP / ADAPT / REMOVE / NEW Matrix

| Element | Classification | Evidence / Rationale |
|---|---:|---|
| `/public/start` route shell | ADAPT | Existing route is the right entry point but current semantics are proposal/pilot funnel, not Portfolio Entry analysis. |
| `PublicLayout` and public shell | KEEP | Reusable public layout infrastructure if it does not encode obsolete product logic. |
| Textarea component pattern | ADAPT | Usable input primitive, but copy, 30-char gate and submit behavior need contract alignment. |
| Minimum 30 characters | ADAPT | Current hard gate is arbitrary relative to contract; may remain as UX guard only if analysis handles insufficient input explicitly. |
| Examples/chips | ADAPT | Useful starter affordance, but examples are initiative-specific and may bias analysis. |
| CTA on `/public/start` | ADAPT | Current copy creates a proposal of initiative; Screen 1 should start provisional analysis/handoff without implying conversion. |
| `PublicDraft` domain model | ADAPT | Not equivalent to `PortfolioEntryDraft`: different lifecycle, ownership, provenance, persistence and downstream semantics. |
| `PublicDraftOutput` proposal fields | ADAPT | Some fields may inspire UI, but they are proposal/Step0-like fields, not the required analysis structure. |
| Browser sessionStorage draft store | ADAPT | Useful for temporary UX, not authoritative enough for traceable Portfolio Entry state unless explicitly scoped. |
| `generateMockPublicDraftOutput` | REMOVE | Mock/heuristic output substitutes for analysis and can imply structure not evidenced by user input. |
| Public PDF upload/dropzone | REMOVE for Screen 1 | Active contract says Screen 1 must not accept files or show disabled upload controls. |
| Disabled upload button/unavailable notice | REMOVE for Screen 1 | Contract also forbids disabled upload UI. |
| Public PDF backend surface | ADAPT outside Screen 1 | Technically isolated from Project rows, but product-incompatible for active Screen 1. |
| PDF Step 0 autofill proposals | REMOVE from Screen 1 | They are Step 0 autofill, not Portfolio Entry analysis. |
| `AutofillContext` use with anonymous draft id | REMOVE from Screen 1 | Couples public entry to Step0-oriented autofill infrastructure. |
| Field refinement AI bridge | ADAPT | Rate-limited public bridge is useful, but existing prompt refines one proposal field; it is not the Portfolio Entry analyzer. |
| Field refinement fallback heuristic | ADAPT/REMOVE | May be useful as degraded writing assistance, but must not appear as analysis or invent context. |
| `PublicProposalEditor` | PARTIAL ADAPT | Rich editable UI exists, but current goal and CTA convert to initiative/pilot continuation. |
| One-pager preview/export | ADAPT | Potentially useful later, but Screen 1 contract centers analysis and question plan. |
| `ProgressiveSignupPage` pilot lead capture | ADAPT outside Screen 1 | Can remain as downstream/pilot workflow, but must be clearly outside pre-Core analysis boundary. |
| `PilotLead` persistence | ADAPT outside Screen 1 | Existing auditable lead capture works, but is not `PortfolioEntryDraft`/`PortfolioEntryAnalysis`. |
| Pilot claim conversion | REMOVE from Screen 1 boundary | Authenticated downstream creates Project and Steps; should not be reachable as implicit continuation of Screen 1. |
| Legacy `createProjectFromPublicDraft` path in AuthPage | REMOVE | It is a latent Project/Step0 creation route if pending draft session keys are set. |
| Analytics event pattern | KEEP | Existing custom events/dataLayer pattern can be reused for Screen 1 metrics. |
| Loading/error states | KEEP/ADAPT | Existing states are useful, but PDF-specific states should not appear on Screen 1. |
| Tests for old public PDF/pilot flow | ADAPT | They document existing behavior; new contract needs different tests and may require removing or relocating old expectations. |
| `PortfolioEntryDraft` persistence | NEW | No matching model/store found. |
| `PortfolioEntryAnalysis` schema and AI endpoint | NEW | No current endpoint produces the required analysis contract. |
| Contract guard tests for no canonical object creation | NEW | Needed around `/public/start` and any handoff. |
| Screen 1 to Screen 2 handoff model | NEW | Current handoff goes to public editor/pilot lead, not contract-defined Screen 2. |

## 9. Contract Conflicts

1. Screen 1 currently shows or can show PDF upload UI, including real dropzone when `VITE_FEATURE_PDF_AUTOFILL` is enabled. The active contract forbids PDFs and disabled upload controls on Screen 1.
2. Text submit creates local `PublicDraft` proposal output, not `PortfolioEntryDraft` plus `PortfolioEntryAnalysis`.
3. Text submit does not perform real AI analysis and does not classify intent, entry state, ambiguity, missing critical context, reverse alignment or next questions.
4. `PublicDraft` is browser-local, source-type driven and proposal-oriented; it lacks the required Portfolio Entry lifecycle, provenance semantics, analysis versioning and authority boundary.
5. Current copy and CTA imply creating/converting a proposal or initiative, while the active contract treats Screen 1 as pre-Core interpretation.
6. `generateMockPublicDraftOutput` and local fallback suggestions can introduce structured proposal values without a traceable analysis/provenance boundary.
7. PDF extraction is Step0-targeted and uses Autofill proposals; that binds the public entry to Step 0 semantics before the contract allows canonical Initiative/Step behavior.
8. Downstream pilot claim converts the proposal into a Project and Step rows after authentication. That may be valid for an older accepted ADR, but conflicts if treated as part of the active Portfolio Entry Screen 1 flow.
9. `AuthPage` still contains a legacy `createProjectFromPublicDraft` continuation path when pending public draft session keys exist.
10. Existing test coverage protects old public PDF, public proposal editor, pilot lead and pilot claim behavior; it does not guard the new authority.

## 10. ADR Blockers and Candidates

ADR blocker if implementation intends to keep automatic public funnel conversion to Project/Step0:

```text
CONFLICT
Contract: docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md
Requirement: Screen 1 is pre-Core and must not create canonical Initiative/Step state.
Current implementation: authenticated pilot claim consumes a public lead and creates Project plus Step rows, then maps proposal into Step 0.
Observed mismatch: older ADR-018 accepts conversion, while current Portfolio Entry authority prohibits that behavior inside Screen 1/pre-Core scope.
Risk: silent canonicalization of provisional public input and regression of Step 0 authority boundaries.
Recommended treatment:
ADAPT
Requires ADR: yes, if conversion remains reachable as the direct continuation of Portfolio Entry Screen 1.
```

ADR candidate if replacing `PublicDraft` with repository-persisted `PortfolioEntryDraft`:

- New persistence/lifecycle/provenance model may be additive, but if it changes conversion semantics or ownership rules it should be ADR-reviewed.

ADR candidate if removing or disabling accepted ADR-018 behavior:

- ADR-018 is accepted and explicitly creates Project after claim. Superseding, scoping or retiring it for the new Portfolio Entry flow should be documented.

No ADR needed for removing PDF controls from Screen 1 if PDF upload remains merely unavailable there and existing PDF capability is left intact outside the Portfolio Entry screen.

## 11. Risks to Step 0-4 and Adaptive Core

- Reusing `PublicDraft`/pilot claim conversion without a new boundary can continue creating `Project`, Step rows and Step0 data from pre-Core public input.
- Editing `ProjectService.createProject` or `updateStep0` to satisfy Portfolio Entry would risk authenticated Project and Step behavior. These services are shared and should not be changed for Screen 1.
- Editing `AutofillContext`, PDF proposal DTOs or public PDF extraction for Screen 1 may regress existing authenticated PDF autofill and Step 0/Step 4 flows.
- Keeping PDF extraction in `/public/start` lets Step0-oriented proposed values enter the public entry experience before the user has passed the contracted handoff.
- Existing Adaptive Core and portfolio state-machine tests imply that Step writes and read-only states are authority-sensitive; Portfolio Entry should add guards at its own boundary rather than altering adaptive services.

## 12. Recommended Implementation Slices

1. Add a new Portfolio Entry contract slice for Screen 1 only: route behavior, text input, analysis API, provisional state, no file upload, no canonical object creation.
2. Introduce `PortfolioEntryDraft` and `PortfolioEntryAnalysis` as distinct concepts from `PublicDraft`, with explicit provenance and lifecycle.
3. Replace Screen 1 submit behavior with real analysis generation or a backend analysis boundary; remove mock proposal generation from that path.
4. Remove PDF upload controls from `/public/start` while preserving authenticated PDF autofill code outside the Screen 1 route.
5. Re-scope or separate old pilot lead/claim continuation so it cannot be mistaken for Screen 1 conversion.
6. Add no-canonical-object tests around `/public/start` submit and any public handoff.
7. Add analysis contract tests for all required entry states, unknowns, ambiguity and missing-context outputs.
8. Only after Screen 1 is correct, plan Screen 2/handoff behavior and decide through ADR whether/when authenticated conversion to Project is allowed.

## 13. Recommendation

Recommendation: PARTIAL REBUILD.

Reasoning: the route shell, public layout, textarea primitive, loading/error patterns, analytics pattern and rate-limited public backend bridge are reusable. However, the core product semantics of the current `/public/start` flow are not the active Portfolio Entry contract. The current implementation creates a local proposal-oriented `PublicDraft`, supports PDF/Step0 autofill, routes into a public proposal editor and can later terminate in Project/Step creation through pilot claim. The Screen 1 behavior should be rebuilt around `PortfolioEntryDraft` and `PortfolioEntryAnalysis`, while carefully preserving non-product infrastructure that does not encode obsolete semantics.

It is safe to advance to Implementation Planning only if the next phase explicitly treats this as a Screen 1 contract implementation, does not touch Step 0-4 or Adaptive Core services, and resolves the ADR-018 conversion conflict before preserving any direct public-entry-to-Project path.
