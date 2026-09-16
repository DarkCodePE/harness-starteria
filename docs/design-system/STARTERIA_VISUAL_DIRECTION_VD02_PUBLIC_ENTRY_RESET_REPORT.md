# STARTERIA VISUAL DIRECTION VD-02 PUBLIC ENTRY RESET REPORT

Status: ready for visual review

## 1. What Was Wrong In The Prior Implementation

- `/public/start` was carrying the landing, initial input and a large product-reading preview at the same time.
- The first public route was still CTA-first instead of starting the real experience directly.
- The right-side "Starteria reading" panel appeared before the user had completed the public-entry interaction.
- Conversation/clarification was visually compressed by a two-column composition that belonged to the final handoff stage.
- Legacy landing artifacts remained on `/`, including a platform screenshot and system-heavy copy.

## 2. Routes / Components Changed

- `/` via `front/src/app/pages/LandingPage.tsx`
- `/public/start` via `front/src/app/pages/public/PublicStartPage.tsx`
- public entry composer and handoff rendering via `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
- VD-02 visual screenshot validation via `front/e2e/visual-direction-vd02-public-entry.spec.ts`

## 3. Landing Final Composition

`/` is now the real public entry point:

- top navigation;
- large headline;
- concise user-facing supporting copy;
- real Portfolio Entry textarea;
- editable example chips;
- primary CTA `Analizar mi situacion`;
- reassurance copy;
- short lower sections explaining what Starteria helps with and the intended sequence.

Submitting from the landing uses the existing Portfolio Entry service/session behavior and redirects to `/public/start` for conversation/clarification.

## 4. `/public/start` Final Composition

`/public/start` is now a conversation-first workspace:

- single dominant main column;
- compact page framing;
- current input/clarification experience has room to breathe;
- confidentiality and enterprise support remain secondary below the main interaction;
- no dominant right-side product-reading preview appears in the initial state.

## 5. Handoff / Result Composition

The two-zone analytical/conversion structure remains available only after the flow reaches handoff/review state:

- left: Starteria read, what was understood, goal, known context, unresolved context and explanatory path;
- right: `Continua con Starteria`, unlocks, Portfolio -> Retos -> Iniciativas -> Evidencia -> Decisiones, and primary continuation CTA.

No handoff structure is shown before `HANDOFF_READY` / review state.

## 6. Removed / Replaced Elements

- Removed legacy CTA-first `/` hero.
- Removed the legacy dashboard/platform screenshot from the landing.
- Removed internal copy about provisional/canonical objects from the landing hero.
- Removed the early right-side `Ejemplo de lectura Starteria` / reading-preview panel from the initial `/public/start` composition.
- Replaced public-first composition with a direct textarea-first entry.

## 7. Screenshot Paths

Stored under `docs/design-system/visual-direction-vd02/`:

- `landing-desktop-1440.png`
- `landing-mobile-390.png`
- `public-start-initial-desktop-1440.png`
- `public-start-initial-mobile-390.png`
- `handoff-result-desktop-1440.png`
- `handoff-result-mobile-390.png`

## 8. Tests Run

Passed:

- `npm run typecheck:front`
- `npm run test:front -- src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`
- `npm run test:front -- app/components/design-system app/components/ui`
- `npx playwright test e2e/visual-direction-vd02-public-entry.spec.ts`
- `npm run build`
- `npm run lint`
- `git diff --check`

Build completed with existing bundle-size/dynamic-import warnings.

## 9. Regressions

No behavioral regression observed in the tested public-entry flow.

Product behavior preserved:

- no backend changes;
- no Core changes;
- no Prisma changes;
- no permission changes;
- no public-entry engine changes;
- no handoff schema changes;
- no question budget changes.

## 10. Match With Approved Experience Architecture

The public-entry flow now matches the approved sequence:

`Landing -> real input from first fold -> conversation / clarification -> analysis / handoff -> registration / continue decision`

The early analytical preview has been removed from the initial `/public/start` state, and the two-zone handoff appears only in the final result/review stage.
