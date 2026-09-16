# Starteria Design System Visual QA DS-01 to DS-08

Date: 2026-09-16

Scope: visual QA only for the implemented Design System foundation and pilots DS-01 through DS-08. No product behavior, routes, backend, Prisma, AI logic, permissions, Core logic, schemas or domain semantics were changed.

## Executive Visual QA Summary

The DS-01 to DS-08 work is mostly visually coherent across the reviewed Starteria surfaces. The primary DS language is visible: neutral surfaces, indigo primary actions, compact badges, border-first cards, clear hierarchy, and a distinct lavender/indigo treatment for Starteria AI guidance.

The previously identified visual blocker on `/public/start` mobile example chips has been fixed and revalidated at 390px, 375px, and 320px. The current DS-01 to DS-08 state is visually stable enough to checkpoint, with the remaining findings tracked as important/polish debt.

Internal Portfolio Lead surfaces are stable enough for continued product migration. Remaining internal issues are mostly consistency debt: legacy beige shell treatment, mixed filter/input styling, dense nested sections, and some copy/encoding polish.

## Routes Reviewed

- `/public/start`
- `/portfolio/inicio`
- `/portfolio/frentes-estrategicos`
- `/portfolio/retos?challengeId=challenge-invite`
- `/portfolio/retos` with search forced to `zzzz-no-results` for an empty/no-results state

## Screenshot References

Screenshots were generated with local Playwright/E2E tooling under:

- `docs/design-system/visual-qa-ds01-ds08/public-start-desktop-1440.png`
- `docs/design-system/visual-qa-ds01-ds08/public-start-tablet-1024.png`
- `docs/design-system/visual-qa-ds01-ds08/public-start-mobile-390.png`
- `docs/design-system/visual-qa-ds01-ds08/public-start-mobile-390-blocker-fixed.png`
- `docs/design-system/visual-qa-ds01-ds08/public-start-mobile-375-blocker-fixed.png`
- `docs/design-system/visual-qa-ds01-ds08/public-start-mobile-320-blocker-fixed.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-inicio-desktop-1440.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-inicio-tablet-1024.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-inicio-mobile-390.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-frentes-estrategicos-desktop-1440.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-frentes-estrategicos-tablet-1024.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-frentes-estrategicos-mobile-390.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-retos-desktop-1440.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-retos-tablet-1024.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-retos-mobile-390.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-retos-empty-desktop-1440.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-retos-empty-tablet-1024.png`
- `docs/design-system/visual-qa-ds01-ds08/portfolio-retos-empty-mobile-390.png`

## Desktop Findings

Desktop hierarchy is coherent on all reviewed routes. `/public/start` has a strong editorial landing rhythm, clear primary input, and understandable confidentiality notice. `/portfolio/inicio`, `/portfolio/frentes-estrategicos`, and `/portfolio/retos` share a recognizable operational workspace structure with page header, summary metrics, filters, cards, and primary CTAs.

The internal shell is still visually warmer than the DS core because the left navigation background and strategic-layer notice use a beige/yellow legacy treatment. This does not break use, but it makes the Portfolio surfaces feel less unified with the neutral-indigo DS direction.

## Tablet Findings

Tablet layouts remain usable. The sidebar remains visible and content cards resize without obvious overflow. `/portfolio/retos` filter controls stack into a tall vertical section, which is readable but visually heavy. `/public/start` is stable at tablet width.

## Mobile Findings

Internal Portfolio routes stack cleanly at 390px. CTAs wrap or move below titles, metric tiles stack, and filter tabs become multi-row pill groups without visible horizontal overflow in the captured first viewport.

`/public/start` was revalidated after the blocker fix. Long example chips now wrap inside the card at 390px, 375px, and 320px without document-level horizontal overflow.

## Consistency Findings

The DS primitives are visible in primary buttons, cards, badges, alerts/notices, and AI blocks. The biggest consistency gaps are legacy shell styling and some local filter/input treatments that do not feel identical to the canonical DS primitives.

## Typography Findings

Typography hierarchy is generally consistent: page titles, descriptions, labels, and compact metadata have clear scale differences. The public landing H1 is appropriately editorial, while internal pages use operational heading scale.

Some Spanish text appears without diacritics in visible UI (`estrategicos`, `decision`, `informacion`, etc.). This is not a layout defect by itself, but it reduces perceived product quality and should be addressed in a copy/encoding pass.

## Spacing Findings

Spacing is mostly calm and consistent. Desktop cards have clear separation and mobile stacking preserves readable gutters. Some internal pages, especially Retos, feel card-dense because filters, tabs, summaries, and detail containers all use bordered surfaces in close succession.

## Color / State Findings

Semantic color use is restrained and mostly appropriate. Indigo primary CTAs are consistent. AI uses lavender/indigo and is visually distinct from neutral operational content. Warning/confidentiality treatments are readable.

The beige/yellow strategic-layer notice in the sidebar is useful but visually stronger and warmer than the rest of DS. It should be revisited as part of shell consolidation rather than changed ad hoc.

## AI / Human Distinction Findings

AI guidance is visually distinguishable where present, especially the Starteria panel on `/portfolio/inicio`. It uses the expected lavender/indigo treatment and does not look like human confirmation or success.

The reviewed routes did not expose a strong human-review block side-by-side with AI in the captured fixtures, so this QA confirms AI distinctness on these surfaces but does not fully validate all DS-03 human review patterns in production context.

## Copilot Findings

The Copilot/Starteria panel on Portfolio Home is non-authoritative and secondary. It does not hide critical portfolio information. Placement works on desktop as a right-side contextual block. On narrower routes captured here, the persistent Copilot was not forced into an unusable column.

## Accessibility-Visible Findings

Visible focus appears on the Retos search field in the empty/no-results capture. Buttons and inputs have readable contrast. Statuses and cards use text, not color alone.

The mobile overflow accessibility issue on `/public/start` is closed. Example chips remain keyboard-focusable buttons and now keep their text inside the visible page width.

## Responsive Findings

Desktop and tablet are broadly stable. Internal mobile routes are stable in the captured top sections. The public entry route now satisfies the no-horizontal-overflow expectation at 390px, 375px, and 320px.

## Issues

### BLOCKER

No open blockers.

Closed blocker:

1. `/public/start` mobile horizontal overflow from long example chips.
   - Evidence: `docs/design-system/visual-qa-ds01-ds08/public-start-mobile-390.png`
   - Root cause: `PortfolioEntryExperience` rendered editable example chips as DS `Button` instances. The canonical Button primitive includes `shrink-0`; in a wrapping flex row, those mobile buttons kept intrinsic width and overflowed the viewport.
   - File changed: `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
   - Fix applied: example chips now use `w-full min-w-0 max-w-full shrink whitespace-normal break-words` with `sm:w-auto`, allowing mobile wrapping while preserving button behavior, focus behavior, and click-to-edit selection.
   - Validation: no document horizontal overflow at 390px, 375px, or 320px.
   - Status: closed.

### IMPORTANT

1. Internal Portfolio shell still mixes DS surfaces with legacy beige/yellow sidebar treatment.
   - Evidence: `portfolio-inicio-desktop-1440.png`, `portfolio-frentes-estrategicos-desktop-1440.png`, `portfolio-retos-desktop-1440.png`
   - Recommended treatment: Handle in a shell/navigation consolidation slice, not inside product semantics.

2. Filter and search controls are visually close to DS but not fully consolidated across Fronts and Retos.
   - Evidence: `portfolio-frentes-estrategicos-desktop-1440.png`, `portfolio-retos-tablet-1024.png`
   - Recommended treatment: Use canonical DS input/select/filter patterns consistently.

3. Spanish diacritics are missing in several visible UI strings.
   - Evidence: reviewed screenshots across public and portfolio routes.
   - Recommended treatment: Separate copy/encoding polish pass; avoid changing product terms casually.

4. Retos and Frentes pages show dense bordered-section stacking.
   - Evidence: `portfolio-retos-desktop-1440.png`, `portfolio-frentes-estrategicos-desktop-1440.png`
   - Recommended treatment: Review card density and section rhythm before deeper migrations.

### POLISH

1. Public landing example chips read like links/pills but act as editable examples; mobile treatment needs clearer tap target rhythm after overflow is fixed.

2. `/portfolio/retos` tablet filters stack into a tall block that pushes content down.

3. Some CTA groups have similar visual weight between primary and secondary actions, especially on Front cards.

4. Portfolio Home empty/attention sections are coherent but could use slightly clearer separation between "empty portfolio" and "requires attention" concepts.

5. Public landing bottom enterprise card feels more marketing-card-like than the internal DS rhythm, though it is acceptable for the public surface.

## Recommended Fixes Before Continuing

1. Run a targeted visual pass for Portfolio shell/sidebar tokens.
2. Normalize filter/search controls using DS primitives where behavior-safe.
3. Plan a copy/encoding polish pass for missing Spanish diacritics.
4. Defer broader density/card rhythm improvements to the next visual consolidation slice.

## Checkpoint Recommendation

DS-01 through DS-08 are visually stable enough to checkpoint/push. The `/public/start` mobile blocker is closed; the remaining issues are important/polish debt that should be handled in focused follow-up slices.

## Verification

Command run:

```text
rtk cmd /c npm run test:e2e -- e2e/visual-qa-ds01-ds08.spec.ts
rtk cmd /c npm run test:e2e -- e2e/visual-qa-public-start-overflow.spec.ts
```

Result:

```text
1 passed
3 passed
```

Notes:

- The screenshot harnesses were temporary and removed after capture.
- E2E startup emitted existing warnings about Prisma package config deprecation and Vite public directory path guidance.

Additional verification after blocker fix:

```text
cmd /c npm run test:front -- src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx
cmd /c npm run typecheck:front
cmd /c npm run build
cmd /c npm run lint
```

Results:

```text
PortfolioEntryExperience.test.tsx: 12 passed
typecheck:front: passed
build: passed with existing chunk/dynamic-import warnings
lint: Baseline lint passed
```
