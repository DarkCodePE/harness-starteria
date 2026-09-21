# Portfolio Entry — Conversion CTA VH-3 v0.1

## 1. Previous CTA structure

The previous `EarlyAccessCard` was a generic registration-style card with five benefits, MVP/access language, a long explanation, `Continuar con mi portafolio`, `Ajustar esta lectura`, and a Steps guardrail. It appeared after the VH-2 analysis disclosure but competed with the handoff through feature inventory and registration framing.

## 2. New CTA structure

The CTA is now one differentiated `portfolio-entry-conversion-cta` split panel:

- left: contextual eyebrow, the conversion headline, one short support sentence, and three continuity benefits;
- right: primary `Crear mi portafolio`, secondary `Ajustar esta lectura`, and the reassurance line.

The panel remains after the four-block handoff and the optional `Ver análisis completo` disclosure.

## 3. Visual hierarchy

The dark Starteria panel is visually distinct from the analysis while remaining inside the existing design-system vocabulary. The left side communicates value already delivered; the right side isolates the next action. There are no nested cards, route grids, or competing primary buttons.

## 4. Conversion proposition

Headline: `Convierte esta lectura en tu portafolio de trabajo`.

Support: `Guarda este análisis y empieza a ordenar tus iniciativas con los mismos criterios, sin perder el contexto que ya construiste.`

The proposition frames the CTA as continuity from an existing strategic reading, not as a generic product signup.

## 5. Benefits shown

Exactly three value statements are shown:

1. `Conserva esta lectura.`
2. `Ordena y prioriza tus iniciativas.`
3. `Da seguimiento al portafolio desde un mismo contexto.`

## 6. Content removed from CTA hierarchy

The CTA no longer presents five benefits, MVP/access claims, a feature inventory, a repeated Starteria route, or a long registration-oriented explanation. The full path remains available in VH-2 expanded analysis, not in the conversion panel.

## 7. What remains available elsewhere

The four primary handoff blocks remain first. `Ver análisis completo` still exposes rationale, assumptions, additional context, evidence, alternatives, provenance, conversation trace, and the full Starteria path. Correction, confirmation, claim, and Portfolio continuation behavior remain in their existing flows.

## 8. CTA destination and semantics

The primary button keeps the existing `onConfirm` handler. Only its presentation label changed from `Continuar con mi portafolio` to `Crear mi portafolio`; no destination, auth, claim, session, confirmation, or continuation semantics changed. `ConfirmedSummary` retains its existing conversion action and copy.

## 9. Responsive behavior

The panel uses a single-column stack by default and switches to a two-column composition at the existing medium breakpoint. Benefits become a readable row at small widths and return to a vertical list at medium widths before becoming a compact row on larger screens. The primary CTA remains full-width in its action column and no horizontal five-step layout is introduced.

## 10. Accessibility behavior

The panel keeps semantic heading structure and native buttons. The action buttons retain keyboard navigation, visible focus behavior from the existing Button component, and meaningful labels. Icons are marked decorative, and hierarchy is not communicated by color alone.

## 11. Files changed

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
- `front/src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`
- `front/e2e/portfolio-entry-conversion.spec.ts`
- this implementation report

## 12. Tests

- frontend typecheck: PASS;
- focused `PortfolioEntryExperience` tests: PASS, 19 tests;
- Portfolio Entry E2E: PASS, 8 scenarios;
- `git diff --check`: PASS before commit.

The focused assertions cover headline, primary CTA, three-benefit maximum, reassurance, no route duplication, CTA position after the handoff, existing confirmation/claim behavior, and correction/confirmed-session behavior.

## 13. Known limitations

The CTA remains presentation-only and does not persist UI state. The E2E suite validates the existing continuation path; it does not perform pixel-level visual regression or automated overflow measurement at every breakpoint.
