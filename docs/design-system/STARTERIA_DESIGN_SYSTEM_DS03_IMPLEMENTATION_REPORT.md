# STARTERIA_DESIGN_SYSTEM_DS03_IMPLEMENTATION_REPORT

**Estado:** Implementado en slice tecnica DS-03 / pendiente de adopcion progresiva
**Fecha:** 2026-09-16
**Alcance:** AI / Human / Review Patterns
**Repositorio:** snapshot publico de harness/documentacion con frontend historico presente en `front/`

## 1. Authority Read

Leido antes de editar codigo:

1. `CURRENT_STATE.md`
2. `docs/STARTERIA_AUTHORITY.md`
3. `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
4. `docs/product-adr/ADR-INDEX.md`
5. `docs/product-adr/ADR-031-portfolio-entry-continuation-to-portfolio.md`
6. `docs/design-system/STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
7. `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
8. `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
9. `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
10. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS01_IMPLEMENTATION_REPORT.md`
11. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS02_IMPLEMENTATION_REPORT.md`
12. `AGENTS.md`

ADRs de producto aprobadas aplicables: ninguna encontrada. `ADR-031` existe pero esta marcado como propuesto/no aprobado.

## 2. Current AI / Human / Review Inventory

| Area | Existing implementation | Observation | Treatment |
|---|---|---|---|
| Public proposal AI assist | `front/src/features/public-start/components/PublicAIAssistPanel.tsx` | Represents current value, AI suggestion, rationale and apply/keep/edit actions; uses hardcoded violet styling and public-flow copy. | ADAPT later |
| Portfolio Copilot proposed action | `front/src/features/copilot/components/ProposedActionCard.tsx` + `ApprovalControls.tsx` | Has action proposal and approval/reject/execute controls; includes Copilot-specific DTOs and status logic. | KEEP until Copilot slice |
| Initial Review critique/proposal | `front/src/features/initial-review/components/*` | AI critique and improved proposal cards with local colors/forms; domain copy and editable state. | CONSOLIDATE later |
| Initiative Review cards | `front/src/features/initiative-review/components/ReviewCards.tsx` | Multiple structured AI review cards, refinement controls and highlighted update states. | KEEP until review migration |
| Autofill proposal field | `front/src/app/components/autofill/AutofillField.tsx` | Mature domain-specific field wrapper with proposal/confirmation/discard/provenance and keyboard behavior. | KEEP / SPLIT later |
| Autofill approval gate | `front/src/app/components/autofill/ApprovalGateBanner.tsx` | Domain gate that blocks submit until AI proposals are confirmed. Product behavior, not primitive pattern. | KEEP |
| Adaptive critical change review | `front/src/features/adaptive-core/components/CriticalChangeReview.tsx` | Proposed mutation/review shape for critical change, but tied to Adaptive Core actions. | KEEP / ADAPT later |
| Mentor surfaces | `front/src/app/components/MentorSupportModal.tsx`, `MentorVirtualPanel.tsx`, `front/src/app/pages/MentorPanelPage.tsx` | Human/mentor language exists but mixed with modal/page behavior and product workflows. | KEEP |
| Feedback IA panel | `front/src/app/components/FeedbackIAPanel.tsx` | Legacy AI feedback surface. | DEPRECATE later after mapping |

## 3. KEEP / ADAPT / CONSOLIDATE / DEPRECATE / NEW Matrix

| Pattern | Canonical path | Treatment | Rationale |
|---|---|---|---|
| InlineInsight | `front/src/app/components/design-system/patterns/InlineInsight.tsx` | NEW | Compact AI insight with optional action and expandable rationale. |
| AISuggestionPanel | `front/src/app/components/design-system/patterns/AISuggestionPanel.tsx` | NEW | Larger AI proposal surface with suggestion, why, provenance, actions, loading and error states. |
| ReviewDisposition | `front/src/app/components/design-system/patterns/ReviewDisposition.tsx` | NEW | Explicit mapping from review disposition vocabulary to DS-01 `DomainStatusBadge` review statuses. |
| HumanReviewBlock | `front/src/app/components/design-system/patterns/HumanReviewBlock.tsx` | NEW | Human review representation distinct from AI styling, requiring reviewer and role. |
| ProposedMutationCard | `front/src/app/components/design-system/patterns/ProposedMutationCard.tsx` | NEW | Current -> Starteria suggestion -> Why -> Actions pattern; emits intents only. |
| ReviewActions | `front/src/app/components/design-system/patterns/ReviewActions.tsx` | NEW | Small generic action group for review/apply/keep/edit/reject intent emission. |
| Existing AI/review feature cards | feature-specific paths listed above | KEEP | Not migrated in DS-03 to avoid route/product logic changes. |
| Autofill proposal confirmation | `front/src/app/components/autofill/*` | KEEP / SPLIT later | Contains real domain behavior and accessibility affordances; requires semantic migration plan. |

## 4. Patterns Implemented

- `InlineInsight`
- `AISuggestionPanel`
- `ReviewDisposition`
- `HumanReviewBlock`
- `ProposedMutationCard`
- `ReviewActions`
- `DSPatternValidationSurface`

All pattern components are representational. They receive explicit state/content and emit action IDs through callbacks. They do not infer product state, call services, mutate domain objects, update routes or change permissions.

## 5. Canonical Paths

- `front/src/app/components/design-system/patterns/InlineInsight.tsx`
- `front/src/app/components/design-system/patterns/AISuggestionPanel.tsx`
- `front/src/app/components/design-system/patterns/ReviewDisposition.tsx`
- `front/src/app/components/design-system/patterns/HumanReviewBlock.tsx`
- `front/src/app/components/design-system/patterns/ProposedMutationCard.tsx`
- `front/src/app/components/design-system/patterns/ReviewActions.tsx`
- `front/src/app/components/design-system/patterns/types.ts`
- `front/src/app/components/design-system/patterns/index.ts`
- `front/src/app/components/design-system/patterns/DSPatternValidationSurface.tsx`

Validation-only surface extended:

- `front/src/app/components/design-system/DSPrimitiveValidationSurface.tsx`

## 6. Public APIs

### ReviewDisposition

```tsx
<ReviewDisposition status="REQUIRES_REVIEW" />
```

Supported statuses:

- `UNREVIEWED`
- `REQUIRES_REVIEW`
- `USER_CONFIRMED`
- `USER_REJECTED`
- `SUPERSEDED`

Mapping is centralized in `REVIEW_DISPOSITION_TO_DOMAIN_STATUS`.

### InlineInsight

```tsx
<InlineInsight rationale={['Same KPI']} actions={actions} onAction={onAction}>
  This challenge may need review.
</InlineInsight>
```

### AISuggestionPanel

Supports:

- `state="ready" | "loading" | "error"`
- `suggestion`
- `why`
- `provenance`
- optional `actions`
- `onAction(actionId)`

### HumanReviewBlock

Requires:

- `title`
- `reviewer`
- `role`
- `status`

Optional:

- `comment`
- `timestamp`
- `actions`

### ProposedMutationCard

Requires:

- `current`
- `suggestion`

Optional:

- `why`
- `actions`
- `onAction(actionId)`

## 7. AI / Human Visual Distinction

AI patterns use DS-01 AI tokens:

- `--ai-suggested-surface`
- `--ai-suggested-border`
- `--ai-suggested-text`
- `--ai-suggested-icon`

AI uses `Sparkles` from Lucide and labels such as `Starteria suggestion`.

Human review uses neutral surfaces, reviewer identity, role and `ReviewDisposition`. Human confirmation does not use the AI lavender surface.

## 8. Provenance Handling

`AISuggestionPanel` supports optional `provenance` items:

```tsx
provenance={[{ label: 'Based on', value: 'confirmed evidence' }]}
```

Provenance is displayed only when supplied. The pattern does not require or fabricate provenance and does not expose chain-of-thought.

## 9. Accessibility

Implemented:

- visible text labels for AI and human authority;
- accessible action buttons via DS-02 `Button`;
- loading state with `aria-busy`;
- error state via DS-02 `Alert`;
- expandable rationale with native `details/summary`;
- `HumanReviewBlock` requires visible reviewer and role;
- `ReviewDisposition` reuses accessible `DomainStatusBadge`;
- no icon-only authority indicator.

Deferred:

- richer field-level `aria-describedby` belongs to future Field/Form pattern adoption;
- legacy raw feature components still need migration/a11y audit.

## 10. Tests

Focused tests added:

- AI suggestion and human confirmation render differently.
- Review dispositions map deterministically.
- `ProposedMutationCard` emits actions and keeps displayed values unchanged.
- `HumanReviewBlock` identifies reviewer and role.
- `AISuggestionPanel` supports optional actions.
- AI pattern supports loading/error.
- accessibility labels/actions exist.
- `DomainStatusBadge` regression remains covered.

Commands run:

```text
rtk cmd /c npx vitest run --config vitest.front.config.ts src/app/components/design-system/patterns/__tests__/patterns.test.tsx src/app/components/design-system/status/__tests__/DomainStatusBadge.test.tsx
```

Result:

- 2 test files passed.
- 12 tests passed.

Additional verification:

```text
rtk cmd /c npm run typecheck:front
```

Result: passed.

```text
rtk cmd /c npm run build
```

Result: passed.

Existing warnings:

- Vite reports the pre-existing dynamic/static import chunk warning for `front/src/app/services/api.ts`.
- Vite reports large chunk size warning after minification.

```text
rtk cmd /c npm run lint
```

Result: baseline lint passed.

```text
rtk git diff --check -- front/src/app/components/design-system docs/design-system
```

Result: passed.

## 11. Files Changed

Created:

- `front/src/app/components/design-system/patterns/types.ts`
- `front/src/app/components/design-system/patterns/ReviewDisposition.tsx`
- `front/src/app/components/design-system/patterns/ReviewActions.tsx`
- `front/src/app/components/design-system/patterns/InlineInsight.tsx`
- `front/src/app/components/design-system/patterns/AISuggestionPanel.tsx`
- `front/src/app/components/design-system/patterns/HumanReviewBlock.tsx`
- `front/src/app/components/design-system/patterns/ProposedMutationCard.tsx`
- `front/src/app/components/design-system/patterns/DSPatternValidationSurface.tsx`
- `front/src/app/components/design-system/patterns/index.ts`
- `front/src/app/components/design-system/patterns/__tests__/patterns.test.tsx`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS03_IMPLEMENTATION_REPORT.md`

Modified:

- `front/src/app/components/design-system/DSPrimitiveValidationSurface.tsx`

## 12. Legacy Consumers Not Migrated

Not migrated in DS-03:

- `front/src/features/public-start/components/PublicAIAssistPanel.tsx`
- `front/src/features/copilot/components/*`
- `front/src/features/initial-review/components/*`
- `front/src/features/initiative-review/components/ReviewCards.tsx`
- `front/src/app/components/autofill/*`
- `front/src/features/adaptive-core/components/CriticalChangeReview.tsx`
- `front/src/app/components/MentorSupportModal.tsx`
- `front/src/app/components/MentorVirtualPanel.tsx`
- `front/src/app/components/FeedbackIAPanel.tsx`

Candidate future consumers:

- public proposal/handoff AI suggestions;
- Portfolio Copilot proposed actions;
- Initial Review critique/proposal;
- Initiative Review result cards;
- autofill proposal review surfaces;
- Mentor/Sponsor review blocks;
- Adaptive critical change review.

## 13. Conflicts

No Core/product semantic conflict was introduced by DS-03. The new pattern layer does not modify AI reasoning, Core logic, Step logic, routes, permissions, or product state transitions.

Documented deferred conflict:

```text
CONFLICT
Primitive/Pattern:
AutofillField
Current behavior:
Represents AI-proposed, confirmed and conflict field states and performs confirm/edit/discard/restore interactions through product hooks.
Why it is domain-specific:
It owns field-level behavior and persistence intents, not only visual representation.
Recommended treatment:
SPLIT later into visual proposal pattern + domain field controller.
Risk:
Silent migration could remove keyboard shortcuts, provenance, undo or high-impact confirmation behavior.
```

```text
CONFLICT
Primitive/Pattern:
Copilot ProposedActionCard / ApprovalControls
Current behavior:
Encodes Copilot action DTOs, approval invalidation and execution status.
Why it is domain-specific:
It mixes generic review actions with Copilot execution workflow.
Recommended treatment:
ADAPT later by composing `ProposedMutationCard` / `ReviewActions` around existing domain controller.
Risk:
Replacing directly could alter approval/execution semantics.
```

## 14. Recommendation for DS-04

Recommended DS-04 scope:

- page-level patterns only: `PageHeader`, `EmptyState`, `NextAction`, `ReviewDecisionPage` support blocks;
- do not migrate Portfolio Home or Steps broadly yet;
- pilot one non-critical validation surface or one low-risk review/decision shell;
- define migration recipes from legacy AI/review cards to DS-03 patterns before touching product screens.
