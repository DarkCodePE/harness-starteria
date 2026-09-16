# STARTERIA VISUAL DIRECTION VD-04 CHAT-FIRST FLOW REPORT

Status: ready for visual review

## 1. What Was Still Missing In VD-03

- The landing explained Starteria better, but the transition from hero to explanatory sections still felt abrupt.
- The platform cue existed, but looked more like a small static label than a useful operating-model signal.
- The page needed clearer visual examples of the kind of attention, evidence and decision clarity Starteria helps unlock.
- Some wording still risked sounding internal or too platform-heavy for a first-time visitor.
- At very small mobile widths, the input CTA needed more breathing room in the first fold.

## 2. What Changed In VD-04

- Refined the hero proportions while keeping the real input as the primary action.
- Added a stronger transition section: `Del texto a la estructura`.
- Changed the platform cue to a simple progression: `Prioridad -> Reto -> Iniciativa -> Evidencia -> Decision`.
- Replaced outcome cards with clearer visual impact/platform cues: atencion, evidencia, alineacion and decision.
- Cleaned public wording to avoid internal terms.
- Reduced landing textarea height on mobile only so the input CTA remains visible at 320px.

## 3. Hero Refinements

The hero remains chat-first:

- real textarea remains in the first fold;
- example chips and CTA remain attached to the input;
- the input card remains the strongest action zone;
- supporting copy now says Starteria converts natural-language context into structured context for priorities, retos, initiatives, evidence and decisions.

Mobile keeps the input before the explanatory platform cue.

## 4. Platform-Structure Cue Treatment

The platform cue is now a compact map:

`Prioridad -> Reto -> Iniciativa -> Evidencia -> Decision`

It is explanatory and illustrative. It does not show counts, limits or real analyzed data.

## 5. Problem Section Treatment

The problem section now focuses on attention and decision clarity:

- disconnected initiative work;
- activity without enough decision support;
- weak visibility across effort and evidence;
- difficulty knowing what to continue, adjust, pause or scale.

The layout remains concise and row-based rather than a feature grid.

## 6. How-It-Works Treatment

The flow remains simple:

1. start with what you know;
2. structure context;
3. identify what is missing;
4. prepare clearer decisions.

The copy avoids technical workflow language.

## 7. Visual Impact / Platform-Cue Treatment

VD-04 adds visual cues for:

- attention;
- evidence;
- alignment;
- decision readiness.

These are clearly conceptual and do not present fake product data as facts.

## 8. Trust-Section Refinement

Trust language is now cleaner:

- incomplete context is acceptable;
- nothing becomes formal work without review;
- AI structures and proposes, humans decide;
- public entry does not create initiatives or launch work automatically.

No compliance or security claims were added.

## 9. Language Cleanup Decisions

Removed public-facing reference to `Steps` from the landing.

Avoided:

- canonical object language;
- internal workflow jargon;
- hard counts that could imply product limits;
- fake real metrics.

Kept user-facing language around priorities, retos, initiatives, evidence, decisions, attention, clarity and focus.

## 10. Screenshot Paths

Stored under `docs/design-system/visual-direction-vd04/`:

- `landing-hero-desktop-1440.png`
- `landing-sections-desktop-1440.png`
- `landing-hero-tablet-1024.png`
- `landing-sections-tablet-1024.png`
- `landing-hero-mobile-390.png`
- `landing-sections-mobile-390.png`
- `landing-hero-mobile-375.png`
- `landing-sections-mobile-375.png`
- `landing-hero-mobile-320.png`
- `landing-sections-mobile-320.png`

## 11. Tests Run

Passed:

- `npm run typecheck:front`
- `npm run test:front -- src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`
- `npm run test:front -- app/components/design-system app/components/ui`
- `npx playwright test e2e/visual-direction-vd04-chat-first-landing.spec.ts`
- `npx playwright test e2e/visual-direction-vd03-landing-narrative.spec.ts`
- `npm run build`
- `npm run lint`
- `git diff --check`

Build completed with existing bundle-size/dynamic-import warnings.

## 12. Regressions

No regressions observed.

Unchanged:

- Core logic;
- backend;
- Prisma;
- permissions;
- AI reasoning;
- public-entry contracts;
- route semantics;
- clarification and handoff logic;
- `/public/start` composition;
- approved handoff structure.

## 13. Assessment

The landing now better communicates Starteria as a structured platform while keeping the input as the protagonist.

The page remains chat-first, but the surrounding narrative now makes clear that the chat is an entry point into a structured decision platform, not the whole product.
