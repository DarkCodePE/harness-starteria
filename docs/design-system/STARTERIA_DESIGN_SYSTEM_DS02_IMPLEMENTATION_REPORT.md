# STARTERIA_DESIGN_SYSTEM_DS02_IMPLEMENTATION_REPORT

**Estado:** Implementado en slice tecnica DS-02 / pendiente de adopcion progresiva
**Fecha:** 2026-09-16
**Alcance:** Primitive Consolidation
**Repositorio:** snapshot publico de harness/documentacion con frontend historico presente en `front/`

## 1. Authority Read

Leido antes de editar codigo:

1. `docs/STARTERIA_AUTHORITY.md`
2. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
3. `docs/product-adr/ADR-INDEX.md`
4. `docs/product-adr/ADR-031-portfolio-entry-continuation-to-portfolio.md`
5. `docs/design-system/STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
6. `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
7. `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
8. `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
9. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS01_IMPLEMENTATION_REPORT.md`
10. `STARTERIA_DESIGN_SYSTEM_CURRENT_STATE_AUDIT.md`
11. `AGENTS.md`

ADRs de producto aprobadas aplicables: ninguna encontrada. `ADR-031` existe pero esta marcada como propuesta/no aprobada.

## 2. Primitive Inventory

| Primitive | Existing implementations | Source / dependencies | Variants / sizes before DS-02 | Token usage / hardcodes | Accessibility behavior | Consumers/count practical | Generic/domain | Duplication |
|---|---|---|---|---|---|---|---|---|
| Button | `front/src/app/components/ui/button.tsx`; many raw `<button>` | Radix Slot + CVA | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; `default`, `sm`, `lg`, `icon` | Used base theme tokens; many consumers/raw buttons use hardcoded colors | Native button / Slot; focus classes | Direct imports found in 8 files; raw `<button>` remains widespread per audit/rg | Generic | High |
| IconButton | `Button size="icon"` only; raw icon-only buttons | none named | no named wrapper | local classnames | label inconsistent in raw consumers | raw icon usage remains | Generic need | Missing |
| Badge | `ui/badge.tsx`; `StatusChip.tsx`; Portfolio badges | Radix Slot + CVA | `default`, `secondary`, `destructive`, `outline` | base tokens; legacy chips hardcode slate/amber/emerald/rose/violet | text visible; focus if interactive | Direct `ui/badge` imports found in 4 files | Generic primitive plus domain legacy duplicates | High |
| Input | `ui/input.tsx`; raw `<input>` | native input | no variants | base theme tokens; raw consumers hardcode borders/colors | native labels/aria props | Direct imports found in 3 files; raw inputs remain | Generic | High |
| Textarea | `ui/textarea.tsx`; raw `<textarea>` | native textarea | no variants | base theme tokens; raw consumers hardcode | native labels/aria props | direct/shared usage plus raw textareas remain | Generic | High |
| Select | `ui/select.tsx`; raw `<select>`; custom `PublicFieldDropdown` | Radix Select | trigger size `sm/default` | base theme tokens | Radix keyboard/ARIA | shared usage exists; raw select/custom dropdown remain | Generic primitive; some raw domain state selects | Medium |
| Checkbox | `ui/checkbox.tsx`; raw checkbox | Radix Checkbox | none | base theme tokens | Radix checkbox | low shared use; raw remains | Generic | Low/medium |
| Radio | `ui/radio-group.tsx`; option-button radios | Radix Radio Group | none | base theme tokens | Radix radio | low shared use; raw option controls remain | Generic | Medium |
| Switch | `ui/switch.tsx` | Radix Switch | none | base theme tokens | Radix switch | low/unknown | Generic | Low |
| Card | `ui/card.tsx`; many ad hoc cards | native div composition | `Card*` family | base tokens; feature cards hardcode colors/radius/shadow | structural only | many ad hoc cards remain | Generic primitive; many domain cards | High |
| Dialog | `ui/dialog.tsx`; `ui/alert-dialog.tsx`; raw fixed overlays | Radix Dialog / AlertDialog | content/header/footer/title/description | base tokens; raw overlays hardcode | Radix focus trap/ARIA | shared + raw overlays remain | Generic | Medium/high |
| Drawer | `ui/drawer.tsx`; `ui/sheet.tsx`; custom drawers | Vaul + Radix Dialog sheet | directional content | base tokens; custom drawers hardcode | Vaul/Radix behavior | shared + custom drawers remain | Generic primitive; Copilot/domain drawers later | Medium |
| Tooltip | `ui/tooltip.tsx`; manual hover hints | Radix Tooltip | provider/trigger/content | base tokens | Radix tooltip | low shared; manual hints remain | Generic | Medium |
| Tabs | `ui/tabs.tsx`; hand-built tabs/segments | Radix Tabs | list/trigger/content | base tokens | Radix tabs | low shared; custom tabs remain | Generic | Medium |
| Alert | `ui/alert.tsx`; many `role=alert` panels | CVA + native div | `default`, `destructive` | base tokens; local panels hardcode semantic colors | `role="alert"` | local alert panels remain | Generic feedback primitive | High |
| Skeleton | `ui/skeleton.tsx` | native div | none | base tokens | decorative loading | unknown/low | Generic | Low |
| Progress | `ui/progress.tsx`; `ProgressBar.tsx`; public progressbars | Radix Progress | numeric value | base tokens; legacy progress has color semantics | Radix progress | `ProgressBar` heavily used in legacy screens | Generic numeric only | Medium/high |

## 3. KEEP / ADAPT / CONSOLIDATE / DEPRECATE / NEW Matrix

| Primitive | Canonical candidate | Treatment | Rationale |
|---|---|---|---|
| Button | `front/src/app/components/ui/button.tsx` | CONSOLIDATE | Existing primitive is clean and compatible; added DS-02 API aliases and DS-01 tokens. |
| IconButton | `front/src/app/components/ui/icon-button.tsx` | NEW | Named wrapper enforces accessible label and uses Button foundation. |
| Badge | `front/src/app/components/ui/badge.tsx` | ADAPT | Generic badge remains separate from `DomainStatusBadge`; added generic feedback variants. |
| Input | `front/src/app/components/ui/input.tsx` | ADAPT | Token/focus/invalid normalization only. |
| Textarea | `front/src/app/components/ui/textarea.tsx` | ADAPT | Token/focus/invalid normalization only. |
| Select | `front/src/app/components/ui/select.tsx` | ADAPT | Preserve Radix Select; token/focus/content normalization only. |
| Checkbox | `front/src/app/components/ui/checkbox.tsx` | ADAPT | Preserve Radix; token/focus normalization. |
| Radio | `front/src/app/components/ui/radio-group.tsx` | ADAPT | Preserve Radix; token/focus normalization. |
| Switch | `front/src/app/components/ui/switch.tsx` | ADAPT | Preserve Radix; token/focus normalization. |
| Card | `front/src/app/components/ui/card.tsx` | ADAPT | Structural neutral card family retained. |
| Dialog | `front/src/app/components/ui/dialog.tsx` | ADAPT | Preserve Radix focus/ARIA; normalize overlay/surface/elevation. |
| Drawer | `front/src/app/components/ui/drawer.tsx` | ADAPT | Preserve Vaul; normalize visual foundation. |
| Sheet | `front/src/app/components/ui/sheet.tsx` | KEEP / DEPRECATE LATER | Still used as Radix-compatible side sheet; documented as duplicate drawer-family primitive. |
| Tooltip | `front/src/app/components/ui/tooltip.tsx` | ADAPT | Preserve Radix; normalize contrast/tokens. |
| Tabs | `front/src/app/components/ui/tabs.tsx` | ADAPT | Preserve Radix; add overflow-safe list and DS tokens. |
| Alert | `front/src/app/components/ui/alert.tsx` | CONSOLIDATE | Added generic `info/success/warning/danger`; kept `destructive` alias. |
| Skeleton | `front/src/app/components/ui/skeleton.tsx` | KEEP | Added reduced-motion compatibility. |
| Progress | `front/src/app/components/ui/progress.tsx` | ADAPT | Numeric generic progress only; clamped value; no Step sufficiency semantics. |

## 4. Canonical Primitive Paths

- `front/src/app/components/ui/button.tsx`
- `front/src/app/components/ui/icon-button.tsx`
- `front/src/app/components/ui/badge.tsx`
- `front/src/app/components/ui/input.tsx`
- `front/src/app/components/ui/textarea.tsx`
- `front/src/app/components/ui/select.tsx`
- `front/src/app/components/ui/checkbox.tsx`
- `front/src/app/components/ui/radio-group.tsx`
- `front/src/app/components/ui/switch.tsx`
- `front/src/app/components/ui/card.tsx`
- `front/src/app/components/ui/dialog.tsx`
- `front/src/app/components/ui/drawer.tsx`
- `front/src/app/components/ui/tooltip.tsx`
- `front/src/app/components/ui/tabs.tsx`
- `front/src/app/components/ui/alert.tsx`
- `front/src/app/components/ui/skeleton.tsx`
- `front/src/app/components/ui/progress.tsx`

Validation-only surface:

- `front/src/app/components/design-system/DSPrimitiveValidationSurface.tsx`

## 5. API Changes

### Button

Added:

- canonical variants: `primary`, `secondary`, `ghost`, `destructive`;
- canonical size: `md`;
- optional `loading` prop for native buttons;
- default variant changed to `primary`;
- default size changed to `md`.

Compatibility retained:

- legacy `default` variant;
- legacy `outline` and `link` variants;
- legacy `default` size;
- existing `asChild` support.

### IconButton

Added:

```tsx
<IconButton aria-label="Close">
  <X />
</IconButton>
```

`aria-label` is required by the component prop type.

### Badge

Added generic feedback variants:

- `neutral`
- `info`
- `success`
- `warning`
- `danger`

Compatibility retained:

- `default`
- `secondary`
- `destructive`
- `outline`
- `asChild`

### Alert

Added generic feedback variants:

- `info`
- `success`
- `warning`
- `danger`

Compatibility retained:

- `default`
- `destructive` as danger alias.

## 6. Backward Compatibility Decisions

- No product screen consumers were mass-migrated.
- Existing primitive file paths remain stable under `front/src/app/components/ui/`.
- Existing Button `default`, `outline`, `link` and size `default` remain available.
- Existing Badge `destructive` and `outline` remain available.
- Existing Alert `destructive` remains available.
- `DomainStatusBadge` remains separate from generic `Badge`.
- `Sheet` remains available because current drawers/layouts may depend on it; it is documented as drawer-family overlap, not removed.
- `Progress` remains numeric and generic; no Step or sufficiency state is inferred.

## 7. Deprecation Registry

| Legacy path | Replacement | Status | Reason | Consumers | Migration priority |
|---|---|---|---|---|---|
| `front/src/app/components/StatusChip.tsx` | `DomainStatusBadge` only where mapping is semantically safe; otherwise future domain badge pattern | DEPRECATE LATER | Encodes product/status strings and local colors | Many Step/Dashboard/Project consumers | High but requires semantic mapping audit |
| `front/src/app/components/ProgressBar.tsx` | `ui/progress.tsx` for generic numeric progress; future domain progress patterns for sufficiency/readiness | DEPRECATE LATER | Adds color/status choices and percentage assumptions | Portfolio/Dashboard/Profile/Project consumers | Medium; avoid Step sufficiency conversion |
| `front/src/features/portfolio-lead/components/cards/ChallengeCoverageBadge.tsx` | Future Portfolio domain badge/pattern, not generic Badge | KEEP UNTIL DS-04/DS-06 | Domain coverage semantics | Challenge card | Medium |
| `front/src/features/portfolio-lead/components/cards/ChallengeActivationBadge.tsx` | Future Activation domain badge/pattern | KEEP UNTIL DS-04/DS-07 | Domain lifecycle semantics | Challenge card | Medium |
| `front/src/features/portfolio-lead/components/cards/StrategicFrontCoverageBadge.tsx` | Future Portfolio domain badge/pattern | KEEP UNTIL DS-04/DS-06 | Domain coverage semantics | Strategic Front card | Medium |
| Raw `<button>` in feature/page files | `ui/Button` or future pattern action components | DEPRECATE GRADUALLY | Duplicated focus/disabled/color behavior | Widespread; audit found 105 files and rg still reports broad use | Medium/high by pilot surface |
| Raw `<input>`, `<textarea>`, `<select>` | `ui/Input`, `ui/Textarea`, `ui/Select` or future Field pattern | DEPRECATE GRADUALLY | Duplicated form/focus/error styling | Widespread | Medium |
| Raw fixed overlays / custom drawers | `ui/Dialog`, `ui/Drawer`, or future review/drawer pattern | DEPRECATE GRADUALLY | Risk of weaker focus trap/ARIA | Step pages, mentor/domain drawers | High for accessibility, but not DS-02 |
| `front/src/app/components/ui/sheet.tsx` | `ui/Drawer` for generic drawers when feasible | KEEP / REVIEW | Same family as Drawer but Radix Dialog-based | Existing sheet-style consumers | Low/medium |

## 8. DS-01 Token Adoption

Canonical primitives now consume DS-01 semantic/foundation tokens for:

- brand action color: `brand-primary`, `brand-primary-hover`, `brand-primary-subtle`;
- neutral text/surface/border: `text-*`, `surface-*`, `background-subtle`, `border-default`;
- focus treatment: `focus-ring`;
- radius: `rounded-ds-sm`, `rounded-ds-md`;
- elevation: `shadow-elevation-overlay`, `shadow-elevation-modal`;
- feedback states: `--status-feedback-info-*`, `--status-feedback-success-*`, `--status-feedback-warning-*`, `--status-feedback-danger-*`.

No new arbitrary CSS variables were introduced in DS-02.

## 9. Accessibility Findings

Preserved or improved:

- Radix/Vaul primitives remain the base for Select, Checkbox, Radio, Switch, Dialog, Drawer, Tooltip and Tabs.
- `IconButton` requires an accessible name via `aria-label`.
- Button loading state sets `aria-busy` and disables native button activation.
- Input/Textarea/Select keep `aria-invalid` visual compatibility.
- Alert keeps `role="alert"`.
- Skeleton is `aria-hidden` and respects reduced motion.
- Tabs list now has max-width/overflow behavior to avoid fixed desktop-only assumptions.

Deferred accessibility risks:

- Many raw feature buttons and raw overlays remain outside DS-02 scope.
- Icon-only raw buttons in existing pages/layouts still need audit before migration.
- Field-level error association (`aria-describedby`) belongs to a future Field/Form pattern.

## 10. Tests Run

Focused tests:

```text
rtk cmd /c npx vitest run --config vitest.front.config.ts src/app/components/ui/__tests__/button.test.tsx src/app/components/ui/__tests__/badge.test.tsx src/app/components/ui/__tests__/input.test.tsx src/app/components/ui/__tests__/icon-button.test.tsx src/app/components/ui/__tests__/textarea.test.tsx src/app/components/ui/__tests__/alert.test.tsx src/app/components/ui/__tests__/selection-controls.test.tsx src/app/components/design-system/status/__tests__/DomainStatusBadge.test.tsx
```

Result:

- 8 test files passed.
- 31 tests passed.

## 11. Build / Typecheck / Lint Results

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

## 12. Files Changed

Modified:

- `front/src/app/components/ui/button.tsx`
- `front/src/app/components/ui/badge.tsx`
- `front/src/app/components/ui/input.tsx`
- `front/src/app/components/ui/textarea.tsx`
- `front/src/app/components/ui/select.tsx`
- `front/src/app/components/ui/checkbox.tsx`
- `front/src/app/components/ui/radio-group.tsx`
- `front/src/app/components/ui/switch.tsx`
- `front/src/app/components/ui/card.tsx`
- `front/src/app/components/ui/dialog.tsx`
- `front/src/app/components/ui/drawer.tsx`
- `front/src/app/components/ui/sheet.tsx`
- `front/src/app/components/ui/tooltip.tsx`
- `front/src/app/components/ui/tabs.tsx`
- `front/src/app/components/ui/alert.tsx`
- `front/src/app/components/ui/skeleton.tsx`
- `front/src/app/components/ui/progress.tsx`
- `front/src/app/components/ui/__tests__/button.test.tsx`
- `front/src/app/components/ui/__tests__/badge.test.tsx`

Created:

- `front/src/app/components/ui/icon-button.tsx`
- `front/src/app/components/ui/__tests__/icon-button.test.tsx`
- `front/src/app/components/ui/__tests__/textarea.test.tsx`
- `front/src/app/components/ui/__tests__/alert.test.tsx`
- `front/src/app/components/ui/__tests__/selection-controls.test.tsx`
- `front/src/app/components/design-system/DSPrimitiveValidationSurface.tsx`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS02_IMPLEMENTATION_REPORT.md`

Pre-existing from DS-01 / documentation consolidation and still uncommitted:

- `front/src/styles/theme.css`
- `front/src/app/components/design-system/status/*`
- `docs/design-system/*`

## 13. Unresolved Duplication

Static checks after DS-02 still show:

- broad raw `<button>` usage in feature/page files;
- raw `<input>`, `<textarea>` and `<select>` usage in feature/page files;
- raw fixed overlays/custom drawers in layout, Step and domain components;
- legacy `StatusChip`;
- legacy `ProgressBar`;
- Portfolio coverage/activation badge components;
- some non-target `ui/*` primitives still use older ring/sidebar/local tokens because DS-02 scope covered only the requested primitives.

No new MUI/emotion primitive usage was found under `front/src`.

## 14. Conflicts

No Core/product semantic conflict was introduced. DS-02 did not alter routes, permissions, Core logic, AI logic, Step logic or domain transitions.

Documented domain-specific primitive conflicts deferred:

```text
CONFLICT

Primitive:
StatusChip
Current behavior:
Maps Spanish/domain/product status labels directly to local visual tone classes.
Why it is domain-specific:
It collapses workflow, review, AI, risk and severity vocabulary into one visual chip.
Recommended treatment:
SPLIT
Risk:
Silent migration could collapse distinct semantics such as confirmed/completed/approved or AI suggested/user confirmed.
```

```text
CONFLICT

Primitive:
ProgressBar
Current behavior:
Represents numeric percentage and color choices used by Portfolio, Dashboard, Project and Step surfaces.
Why it is domain-specific:
Some usages may imply Step progress/readiness/sufficiency, which Core says must not be reduced to percentage completion.
Recommended treatment:
ADAPT / SPLIT
Risk:
Migrating all usage to generic Progress without semantic audit could encode misleading progress.
```

```text
CONFLICT

Primitive:
Portfolio coverage and activation badges
Current behavior:
Represent coverage and activation lifecycle states.
Why it is domain-specific:
They encode Portfolio/Challenge semantics, not generic metadata.
Recommended treatment:
KEEP until domain pattern slice
Risk:
Moving them into generic Badge would hide product meaning inside a primitive.
```

## 15. Recommendation for DS-03

Recommended DS-03 scope:

- AI / Human / Review patterns only.
- Build on DS-02 primitives and DS-01 semantic state.
- Candidate patterns:
  - `AISuggestionPanel` / `InlineInsight`;
  - `ReviewDispositionBadge` or equivalent domain/status pattern;
  - `HumanReviewBlock`;
  - `ProposedMutationCard`;
  - `HumanReviewControls`.
- Start with one high-signal pilot surface, preferably Portfolio Entry / public proposal or Copilot action review, without migrating Portfolio Home or Steps broadly.

Do not start DS-03 until product/design confirms the exact pilot surface and semantic mappings.
