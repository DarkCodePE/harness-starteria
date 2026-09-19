# STARTERIA VISUAL DIRECTION VD-01 REPORT

Status: ready for visual review

## 1. Authority Read

Read before editing product code:

- `AGENTS.md`
- `CURRENT_STATE.md`
- `docs/STARTERIA_AUTHORITY.md`
- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- applicable product ADR index and current approved/proposed ADR state
- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- Portfolio Lead / Governance contracts present under `docs/experience/portfolio-lead/`
- `docs/design-system/STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
- `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
- DS-01 through DS-08 reports
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_VISUAL_QA_DS01_DS08.md`

VD-01 was treated as a visual/composition pilot only. Core, backend, Prisma, permissions, AI reasoning, routes, budgets, activation semantics, coverage semantics and portfolio semantics were not changed.

## 2. Visual Baseline Problems Identified

- `/public/start` still presented Starteria through a legacy landing composition and a Steps-first style product mockup.
- The real Portfolio Entry input was visually downstream from the proposition instead of being the primary first-fold interaction.
- Public copy still exposed internal architecture language in places where user value should lead.
- Portfolio Home remained too close to a card dashboard and did not visually prioritize attention.
- Retos still carried dense operational card patterns that made Strategic Front -> Challenge -> Initiatives harder to scan.
- Copilot surfaces risked reading as generic chat or auxiliary panels instead of contextual intelligence.

## 3. Visual Direction Applied

Applied a stronger Strategic Calm + Intelligent Momentum direction:

- larger editorial hierarchy;
- more spacious first folds;
- light neutral base with restrained indigo/cyan atmosphere;
- fewer small feature cards on public entry;
- darker conversion/continuation zone for handoff;
- attention-first workspace treatment for Portfolio Home;
- clearer product-expression visual around Portfolio -> Challenges -> Initiatives -> Evidence -> Decisions.

## 4. `/public/start` Before / After

Before:

- legacy landing rhythm;
- CTA-before-input flow;
- old product preview with Steps-first implication.

After:

- hero combines proposition, real natural-language entry, editable example chips, CTA and reassurance in the first fold;
- right side shows a new labelled illustrative Starteria reading;
- no conceptual fixed challenge or initiative counts are shown.

After screenshots:

- `docs/design-system/visual-direction-vd01/public-start-desktop-1440.png`
- `docs/design-system/visual-direction-vd01/public-start-mobile-390.png`

## 5. Hero / Input Treatment

The Portfolio Entry input is now visually embedded in the hero. Existing input behavior is preserved: users still enter natural-language context and Starteria still handles the existing entry/handoff flow without creating canonical portfolio objects before review.

Visible prompt direction:

- `Que necesitas conseguir o entender?`
- example chips for aligning initiatives, understanding blockers, preparing committee and deciding priorities;
- reassurance that the user can start with what they know.

## 6. Old Steps Visual Treatment

The old Steps-first primary visual was removed from `/public/start` and replaced with a new illustrative product-expression preview:

`Strategic Priority -> Challenge -> Initiatives -> Evidence -> Decision`

The visual is labelled `Ejemplo de lectura Starteria` / illustrative, and it does not imply that visitor data has already been analyzed.

## 7. Handoff Treatment

The Portfolio Entry handoff now uses a stronger two-zone treatment:

- left: the read/understanding area;
- right: a darker `Continue with Starteria` conversion area with benefits, path and primary CTA.

The route path is explanatory only:

`Portfolio -> Retos -> Iniciativas -> Evidencia -> Decisiones`

No canonical object creation semantics were changed.

## 8. Portfolio Home Treatment

`/portfolio/inicio` was adjusted toward an attention-first workspace:

- compact portfolio summary remains secondary;
- `Requiere atencion` is the primary operational section;
- pending decisions are separated from danger/error semantics;
- structural sections and dividers replace some card-heavy framing;
- the Starteria contextual layer remains visible in the right-side workspace area.

## 9. Challenge Treatment

`/portfolio/retos` was validated through the existing Challenge route and selected challenge state:

- the route preserves current Challenge/domain semantics;
- the page continues to expose Strategic Front, Challenge, initiatives, attention and activation context;
- the selected challenge path is captured for visual review.

VD-01 did not recalculate coverage, invent percentages or alter challenge state.

## 10. Copilot Visual Treatment

Copilot treatment remains contextual rather than a generic chat replacement:

- Portfolio Home positions Starteria as an intelligence layer beside the workspace;
- Challenge views continue to use the current insight/recommendation surfaces;
- critical attention state remains outside Copilot.

## 11. Responsive

Validated with Playwright at:

- 1440px
- 1024px
- 390px
- 375px
- 320px for `/public/start`

No horizontal overflow was detected by the VD-01 visual test.

## 12. Accessibility

Maintained:

- labelled textarea;
- accessible button semantics;
- visible focus styles from existing DS primitives;
- semantic heading structure;
- non-color-only state language;
- mobile reading order with the input before the preview.

## 13. Screenshots

Captured under `docs/design-system/visual-direction-vd01/`:

- `public-start-desktop-1440.png`
- `public-start-mobile-390.png`
- `public-start-mobile-375.png`
- `public-start-tablet-1024.png`
- `public-start-mobile-320.png`
- `portfolio-inicio-desktop-1440.png`
- `portfolio-inicio-mobile-390.png`
- `portfolio-inicio-mobile-375.png`
- `portfolio-inicio-tablet-1024.png`
- `portfolio-retos-desktop-1440.png`
- `portfolio-retos-mobile-390.png`
- `portfolio-retos-mobile-375.png`
- `portfolio-retos-tablet-1024.png`

## 14. Tests

Passed:

- `npm run typecheck:front`
- focused Portfolio Entry tests
- focused DS/UI tests
- focused Portfolio Home / Challenge / Portfolio Lead tests
- direct Playwright VD-01 visual E2E screenshots
- `npm run build`
- `npm run lint`
- `git diff --check`

Note: the repository E2E wrapper attempted to start Docker/Postgres and could not proceed because Docker access was unavailable in this environment. The VD-01 Playwright visual spec was run directly against the local Vite server and passed.

## 15. Files Changed

- `front/src/app/pages/public/PublicStartPage.tsx`
- `front/src/features/public-start/components/PublicStartHero.tsx`
- `front/src/features/public-start/domain/copy.ts`
- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
- `front/src/app/pages/PortfolioLeadHomePage.tsx`
- `front/e2e/visual-direction-vd01.spec.ts`
- `docs/design-system/STARTERIA_VISUAL_DIRECTION_VD01_REPORT.md`
- `docs/design-system/visual-direction-vd01/*.png`

## 16. Remaining Legacy Visual Fragments

- The authenticated Portfolio shell/sidebar still carries the warm strategic-layer treatment and legacy navigation composition.
- `/portfolio/retos` still has dense filter and card stacking that should be revisited in a deeper Challenge/Portfolio workspace pass.
- Existing attention components still use stronger filled warning/danger treatments in some places; VD-01 moved composition but did not redesign every state primitive.
- Some Spanish text in existing source still has encoding inconsistencies; VD-01 avoided broad copy rewrites outside scope.

## 17. Blockers

No product blocker remains for VD-01 visual review.

Environment limitation:

- Docker-backed E2E wrapper could not run because Docker access was unavailable; direct Playwright visual validation passed.

## 18. Recommendation Before Continuing Initiative / Steps UX

Before continuing Initiative Overview or Steps UX, review VD-01 screenshots with product/design and decide whether the authenticated shell/sidebar should be modernized as a dedicated follow-up. That shell is now the largest remaining visual constraint on making the product feel fully aligned with the new Starteria direction.
