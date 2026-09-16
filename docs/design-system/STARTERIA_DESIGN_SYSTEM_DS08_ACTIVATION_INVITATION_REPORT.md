# STARTERIA DESIGN SYSTEM DS-08 ACTIVATION / INVITATION REPORT

Status: implemented as a bounded frontend visual pilot.
Date: 2026-09-16

## 1. Authority Read

Read before implementation:

- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `docs/product-adr/ADR-INDEX.md`
- `docs/portfolio-lead/README.md`
- `docs/portfolio-lead/DOCUMENT_INVENTORY.md`
- `docs/portfolio-lead/04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/README.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md`
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md`
- `docs/design-system/STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
- `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS01_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS02_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS03_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS04_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS05_PORTFOLIO_ENTRY_HANDOFF_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS06_PORTFOLIO_HOME_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS07_STRATEGIC_FRONT_CHALLENGE_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_REPO_AUTHORITY_RECONCILIATION.md`
- `AGENTS.md`
- `CURRENT_STATE.md`

No approved product ADR specific to DS-08 was found in `docs/product-adr/ADR-INDEX.md`; ADR-031 remains proposed and was not used as authority.

## 2. Activation / Invitation Journey Mapping

| Stage | Route/component | Domain responsibility | Presentation responsibility | DS target |
| --- | --- | --- | --- | --- |
| Challenge detail / activation context | `/portfolio/retos?challengeId=...`, `front/src/app/pages/PortfolioLeadChallengesPage.tsx` | Reads challenge state, activation mode, readiness labels, sponsor/owner statuses, selected people, assigned squad and linked initiatives from Portfolio Lead state | Expanded challenge detail, actions, summary surfaces | `PageHeader`, `ContextSummary`, `AISuggestionPanel`, `NextAction`, `DomainStatusBadge`, `Badge`, `Button`, `Progress` |
| Activation recommendation | `getChallengeActivationRecommendation(...)` consumed by `PortfolioLeadChallengesPage.tsx` | Recommendation remains domain-supplied by existing Portfolio Lead selectors/actions | Displays recommendation as non-authoritative Starteria suggestion | `AISuggestionPanel` |
| Activation modality | `Challenge.activationMode`; edit drawer still owns current form controls | Current modality options remain unchanged | Displayed in context and handoff summary | `ContextSummary`, `Badge` |
| Challenge owner / sponsor status | `Challenge.challengeOwnerStatus`, `Challenge.sponsorStatus` | Current status mutations remain `updateChallengeStakeholderStatus(...)` | Status labels displayed as context metadata | `ContextSummary`, existing handlers |
| Selected people / invitations | `Challenge.selectedPeople` with `pendiente`, `notificado`, `confirmado`, `declinado` | Existing invitation lifecycle and update functions remain unchanged | Rendered in expanded challenge handoff as supplied state | `DomainStatusBadge` with explicit labels |
| Assigned squad | `Challenge.assignedSquad` | Existing squad membership and roles remain unchanged | Rendered in expanded challenge handoff | `Badge`, DS surfaces |
| Handoff to initiative creation | Existing navigation to `/projects/new?challengeId=...` | Current creation semantics remain unchanged | DS `NextAction` explains handoff and preserves CTA | `NextAction` |
| Invitation landing / accept / decline | No safe frontend route found for challenge invitation landing in this slice | Backend invitation recipient services exist, but frontend route migration would require route/product behavior work | Not migrated | Deferred |
| Email communication | Backend invitation access/mailer logic exists under `backend/modules/portfolio/*` | Email generation is backend scope | Not modified in DS-08 | Deferred; visual structure documented by contract only |

## 3. Domain vs Presentation Boundaries

- DS-08 did not change activation readiness logic.
- DS-08 did not change activation recommendation logic.
- DS-08 did not add, rename or merge activation modalities.
- DS-08 did not change invitation lifecycle states.
- DS-08 did not create an invitation landing route.
- DS-08 did not modify backend email generation.
- DS-08 did not create Initiative or Step state.

Visual mappings added:

- Activation readiness display maps supplied `activationState` to a DS badge only.
- Invitation status display maps supplied `InvitationStatus` to DS badge visuals only:
  - `pendiente` -> unreviewed visual
  - `notificado` -> requires-review visual
  - `confirmado` -> confirmed visual
  - `declinado` -> rejected visual

These mappings do not alter persisted state or domain meaning.

## 4. Routes / Components Migrated

Migrated within scope:

- `front/src/app/pages/PortfolioLeadChallengesPage.tsx`
  - Added activation/invitation/handoff panel inside expanded challenge detail.
  - Reused existing recommendation, invitation, squad, publication and navigation data.
  - Normalized detail action buttons to DS `Button`.

Not migrated:

- `front/src/app/pages/ParticipantChallengeDetailPage.tsx`
- `front/src/app/pages/CreateProjectPage.tsx`
- `front/src/app/pages/ProjectHomePage.tsx`
- `front/src/app/pages/Step0Page.tsx` through Step 4
- Backend invitation recipient and mailer modules

## 5. DS Patterns Consumed

- `PageHeader`
- `ContextSummary`
- `AISuggestionPanel`
- `NextAction`
- `EmptyState`
- `DomainStatusBadge`
- `Badge`
- `Button`
- `Progress`

## 6. Activation Recommendation Treatment

The existing `getChallengeActivationRecommendation(...)` output is rendered with `AISuggestionPanel`.

The panel:

- labels the content as Starteria recommendation;
- displays supplied recommended modality;
- displays supplied justification, missing item and next step;
- offers only presentation actions;
- does not accept or apply activation automatically.

## 7. Invitation Status Treatment

Expanded challenge detail now renders:

- selected people;
- per-person invitation status;
- assigned squad members and roles;
- publication note and visibility.

No invitation state is inferred. Missing invitees or squad are shown as empty presentation states inside the handoff panel.

## 8. Email Treatment / Scope Decision

Email generation/rendering lives in backend scope in this checkout (`backend/modules/portfolio/invitation-access.service.ts`, `backend/modules/portfolio/invitation-recipient.router.ts`, related tests and mailer configuration). DS-08 did not modify backend email behavior because the run prohibited backend behavior changes unless explicitly required and documented first.

Email visual pattern remains deferred to a backend/template-authorized slice.

## 9. Post-Acceptance Handoff Treatment

There is no current challenge invitation landing/start frontend route migrated in DS-08. The visible handoff in Portfolio Lead now explains the existing path from challenge to initiative creation through `/projects/new?challengeId=...` and explicitly avoids claiming:

- Step 0 completion;
- strategic alignment confirmation;
- sponsor confirmation;
- mentor assignment;
- completed setup.

## 10. Responsive Behavior

The added handoff panel uses responsive grid composition:

- desktop: activation context and people/squad surfaces side by side;
- tablet/mobile: surfaces stack naturally;
- handoff action block remains full-width and readable.

No page-specific breakpoints were added.

## 11. Accessibility

- Status is represented with text labels and icons, not color only.
- Handoff action uses an accessible label including the challenge name.
- Existing keyboard behavior for buttons is preserved.
- AI recommendation remains visually distinct from human/status content.
- Reading order remains challenge context -> invitation/squad -> recommendation -> next action.

## 12. Tests

Added:

- `front/src/app/pages/__tests__/PortfolioLeadActivationInvitation.ds08.test.tsx`

Covered:

- supplied invitation status renders;
- supplied activation recommendation renders;
- existing handoff CTA navigates to `/projects/new?challengeId=...`;
- activation review action still opens the existing edit drawer.

Verification run:

- `npm run typecheck:front` from `front/`: passed.
- `npm run test:front -- PortfolioLeadActivationInvitation.ds08.test.tsx`: passed, 2 tests.
- `npm run test:front -- app/components/design-system app/components/ui`: passed, 12 files / 53 tests.
- `npm run test:front -- PortfolioLeadActivationInvitation.ds08.test.tsx PortfolioLeadStrategicFrontChallenge.ds07.test.tsx PortfolioLeadHomePage.bootstrap.test.tsx features/portfolio-lead`: passed, 12 files / 100 tests. Existing test stderr intentionally simulates backend unavailable.
- `npm run build`: passed. Existing Vite warnings remain for mixed static/dynamic `api.ts` import and large output chunk.
- `npm run lint`: passed.
- `git diff --check`: passed. Git reported existing line-ending warnings in the dirty tree.
- `npm run test:e2e -- e2e/portfolio-challenge-states.spec.ts`: passed, 4 tests, after rerun with elevated Docker access. Initial non-elevated run failed on Docker pipe permission only.

## 13. Files Changed

- `front/src/app/pages/PortfolioLeadChallengesPage.tsx`
- `front/src/app/pages/__tests__/PortfolioLeadActivationInvitation.ds08.test.tsx`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS08_ACTIVATION_INVITATION_REPORT.md`

## 14. Legacy Components Retained / Deprecated

Retained:

- `front/src/features/portfolio-lead/components/cards/ChallengeActivationPanel.tsx`
- `front/src/features/portfolio-lead/components/cards/ChallengeActivationRecommendation.tsx`
- `front/src/features/portfolio-lead/components/cards/ChallengeActivationModeSelector.tsx`
- `front/src/features/portfolio-lead/components/cards/ChallengeActivationOwnerStatus.tsx`
- `front/src/features/portfolio-lead/components/cards/ChallengeActivationMessageDraft.tsx`

Treatment: KEEP for now. They were found but are not the active rendered DS-08 surface in `PortfolioLeadChallengesPage.tsx`; removal or consolidation would be a separate cleanup.

## 15. No-Regression Audit

Confirmed by code review:

- No backend files changed.
- No Prisma files changed.
- No route definitions changed.
- No permissions changed.
- No activation readiness algorithm changed.
- No activation recommendation algorithm changed.
- No challenge status semantics changed.
- No invitation lifecycle semantics changed.
- No auth behavior changed.
- No AI prompt/contract changed.
- No Core/Steps behavior changed.

## 16. Conflicts / Blockers

CONFLICT

Primitive/surface: Invitation landing and email visual system

Current behavior: Backend invitation recipient and delivery logic exists, but no safe frontend challenge invitation landing/acceptance route was found for migration without touching route/backend behavior.

Why domain-specific: Invitation acceptance affects lifecycle, auth continuation and initiative handoff semantics.

Recommended treatment: KEEP backend behavior; add a dedicated frontend invitation/start slice only after route/product authority is explicit.

Risk: Creating a visual route in DS-08 would imply product semantics not currently wired in the frontend.

CONFLICT

Primitive/surface: Existing ChallengeActivationPanel component family

Current behavior: A card component family exists with local styling and raw controls, but the active Challenge page renders its own detail surface.

Why domain-specific: The component family accepts domain models and mutation handlers.

Recommended treatment: KEEP; consolidate only if future slices make it the active container.

Risk: Migrating unused/legacy cards now could create churn without improving the current journey.

## 17. Manual Validation Notes

Manual/code validation performed:

- Expanded `challenge-invite` renders selected people and invitation statuses.
- Expanded `challenge-squad` has supported squad display through the same panel.
- Handoff CTA preserves existing `/projects/new?challengeId=...` route.
- AI recommendation remains separate from invitation/human status.

Browser screenshots were not captured in this run.

## 18. Recommendation for DS-09

DS-09 should migrate Initiative Overview / pre-start handoff only if the product authority explicitly addresses the current tension between:

- invitation accepted / pre_start;
- initiative created;
- Step 0 initialized or not initialized;
- Adaptive Core authority.

Recommended DS-09 scope:

- Initiative Overview visual migration;
- pre-start handoff display;
- no Step 0-4 migration;
- explicit audit of `CreateProjectPage` and `AppContext.createProject(...)` semantics before any product change.
