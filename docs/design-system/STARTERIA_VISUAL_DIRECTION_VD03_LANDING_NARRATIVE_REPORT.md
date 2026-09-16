# STARTERIA VISUAL DIRECTION VD-03 LANDING NARRATIVE REPORT

Status: ready for visual review

## 1. What The Prior Landing Was Still Missing

- The landing was correctly input-first, but still read too much like a text-entry interface with supporting bullets.
- It did not explain Starteria strongly enough as a structured platform for priorities, challenges, initiatives, evidence and decisions.
- The scroll narrative was short and did not clearly answer: what problem Starteria solves, how it works, what the user gets and why to trust it.
- Trust language existed near the input, but not as a dedicated platform principle.

## 2. Final Landing Structure

The landing now follows this structure:

1. Hero with value proposition and real Portfolio Entry input.
2. Platform structure cue: Priority -> Challenge -> Initiative -> Evidence -> Decision.
3. Problem / solution section.
4. How Starteria works section.
5. What you get section.
6. Trust principles section.
7. Final CTA returning the user to the real input.

The approved public-entry sequence remains:

`Landing -> real input -> conversation / clarification -> analysis / handoff -> registration / continue`

## 3. Hero Treatment

The hero remains the true starting point:

- simple top nav;
- strong editorial headline;
- concise copy explaining Starteria as a platform for structured business decisions;
- real natural-language textarea from `PortfolioEntryExperience`;
- editable example chips;
- primary CTA `Analizar mi situacion`;
- reassurance copy.

On mobile, the input appears before the platform-structure explanation to preserve the input-first architecture.

## 4. Problem / Solution Section Treatment

The section now explains the actual problem Starteria addresses:

- many initiatives but weak business read;
- activity without enough decision support;
- disconnected portfolio, challenge and execution conversations.

The treatment uses one large section with divided rows instead of a noisy feature grid.

## 5. How-It-Works Section Treatment

The section explains the flow in plain language:

1. the user explains what they need to move;
2. Starteria structures the context;
3. gaps, challenges and paths become clearer;
4. the user prepares decisions with more clarity.

It is intentionally not a technical flowchart.

## 6. Trust-Section Treatment

Trust principles are now explicit:

- users can start with incomplete context;
- nothing is formalized without review;
- AI structures and proposes while human decision authority remains;
- public entry does not create initiatives or activate Steps.

No unsupported compliance or security claims were added.

## 7. What-You-Get Section Treatment

The outcomes section presents what the user gains:

- a structured, revisable initial read;
- clearer priorities and challenges;
- visibility over initiatives and evidence gaps;
- a path from portfolio toward execution and decision.

The section uses a dark, restrained contrast band to distinguish outcome value from the surrounding explanatory sections.

## 8. Final CTA Treatment

The final CTA is simple and points back to starting:

- reinforces that the first entry is public and revisable;
- clarifies that formal work starts only when the user decides to continue;
- uses `Analizar mi situacion` to scroll back to the input.

## 9. Screenshot Paths

Stored under `docs/design-system/visual-direction-vd03/`:

- `landing-hero-desktop-1440.png`
- `landing-hero-mobile-390.png`
- `landing-sections-desktop-1440.png`
- `landing-sections-mobile-390.png`

## 10. Tests Run

Passed:

- `npm run typecheck:front`
- `npm run test:front -- src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`
- `npm run test:front -- app/components/design-system app/components/ui`
- `npx playwright test e2e/visual-direction-vd03-landing-narrative.spec.ts`
- `npm run build`
- `npm run lint`
- `git diff --check`

Build completed with existing bundle-size/dynamic-import warnings.

## 11. Regressions

No regressions observed.

Unchanged:

- Core logic;
- backend;
- Prisma;
- permissions;
- AI reasoning;
- public-entry contracts;
- route semantics;
- clarification and handoff logic.

## 12. Platform Explanation Assessment

VD-03 makes the landing more clearly explain Starteria as a structured platform rather than only a chat-like interface.

The page now communicates:

- the business problem;
- the platform structure;
- the user journey;
- the outcomes;
- the trust boundaries around AI, review and formalization.
