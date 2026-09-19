# STARTERIA_DESIGN_SYSTEM_DS06_PORTFOLIO_HOME_REPORT

**Estado:** Implementado en slice DS-06 / Portfolio Home pilot acotado
**Fecha:** 2026-09-16
**Alcance:** Portfolio Lead Home visual + interaction layer
**Repositorio:** snapshot publico de harness/documentacion con frontend historico presente en `front/`

## 1. Authority Read

Leido antes de editar codigo:

1. `CURRENT_STATE.md`
2. `docs/STARTERIA_AUTHORITY.md`
3. `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
4. `docs/product-adr/ADR-INDEX.md`
5. `docs/portfolio-lead/README.md`
6. `docs/portfolio-lead/DOCUMENT_INVENTORY.md`
7. `docs/portfolio-lead/04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md`
8. `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md`
9. `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_TECH_SPEC_v0.1.md`
10. `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md`
11. `docs/design-system/STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`
12. `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
13. `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`
14. `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
15. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS01_IMPLEMENTATION_REPORT.md`
16. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS02_IMPLEMENTATION_REPORT.md`
17. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS03_IMPLEMENTATION_REPORT.md`
18. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS04_IMPLEMENTATION_REPORT.md`
19. `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS05_PORTFOLIO_ENTRY_HANDOFF_REPORT.md`
20. `AGENTS.md`

ADRs de producto aprobadas aplicables: ninguna encontrada. `ADR-031` esta marcado como propuesto/no aprobado.

## 2. Current Portfolio Home Mapping

| Current surface | Current component | Domain responsibility | DS target pattern |
|---|---|---|---|
| Route | `/portfolio/inicio` in `front/src/app/routes.ts` | Existing route/navigation only | unchanged |
| Page component | `front/src/app/pages/PortfolioLeadHomePage.tsx` | Composes Portfolio Home from `usePortfolioLead`, selectors and navigation | `PortfolioWorkspacePage` composition |
| Data/context | `usePortfolioLead` from `front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx` | Hydrates fronts, challenges, initiatives; exposes mutations and refresh | unchanged |
| Role/layout guard | `front/src/app/layout/PortfolioLeadLayout.tsx`, workspace authz | Navigation and access surface | unchanged |
| Bootstrap continuation | `PortfolioBootstrapHome` via `usePortfolioBootstrap(entryContinuationId)` | Entry continuation/session bootstrap | unchanged |
| Summary model | `getHomeCommandCenterModel`, `getPortfolioHomeExperienceModel` | Derive view models from existing state | unchanged |
| Page header | Legacy `PortfolioWelcomeBanner` | Visual header/actions | DS `PageHeader` |
| Executive metrics | `PortfolioSummaryCards` + selector summary | Existing aggregate counts | DS `ContextSummary` plus existing summary cards |
| Attention list | `PortfolioAttentionList` | Renders supplied `PortfolioAlert[]`; preserves action path | DS `AttentionItem` / `EmptyState` |
| Next action | Existing `commandCenter.nextAction` | Supplied by existing selector | DS `NextAction` |
| Pending decisions | `commandCenter.pendingDecisions` | Existing decision cards from selector | DS `Card` + `ContextSummary` |
| Strategic fronts | `StrategicObjectivesOverview` | Existing front/challenge composition | retained |
| Copilot | `PortfolioCopilotLauncher` / `PortfolioCopilotDrawer` behind feature flag | Existing Copilot state/output | DS `InlineInsight` shell plus existing launcher/drawer |
| Loading/error | Bootstrap route handles continuation states; operational Home has no new loader | Existing behavior | unchanged |

## 3. Existing Domain / Presentation Responsibilities

- Selectors continue to compute summary, alerts, pending decisions, next action, front priority and activity.
- `PortfolioLeadHomePage` now only projects those supplied models into DS page/pattern components.
- `PortfolioAttentionList` maps an existing alert visual tone to DS visual severity; it does not derive whether an alert exists or whether it is critical.
- Navigation remains supplied by existing `path` / `actionPath` values.
- No API, persistence, permission, role, severity, decision or AI generation logic was changed.

## 4. Components Migrated

Migrated in DS-06:

- `front/src/app/pages/PortfolioLeadHomePage.tsx`
- `front/src/features/portfolio-lead/components/cards/PortfolioAttentionList.tsx`

Focused tests:

- `front/src/app/pages/__tests__/PortfolioLeadHomePage.bootstrap.test.tsx`
- `front/src/features/portfolio-lead/components/cards/__tests__/PortfolioAttentionList.test.tsx`

## 5. DS Patterns Consumed

- DS-04: `PageHeader`, `ContextSummary`, `NextAction`, `AttentionItem`, `EmptyState`
- DS-03: `InlineInsight`
- DS-02: `Card`, `Badge`
- DS-01: semantic surface, border, text, feedback and AI tokens via DS components

## 6. AttentionList Treatment

`PortfolioAttentionList` was **ADAPT**.

Current responsibility retained:

- receives `PortfolioAlert[]`;
- receives fallback next action;
- receives `onNavigate`;
- renders empty attention state when no alerts exist;
- preserves every supplied `actionPath`.

Treatment:

- replaced route-local alert cards with DS `AttentionItem`;
- replaced route-local empty state with DS `EmptyState`;
- added a tiny visual mapping from existing `PortfolioAlert.tone` to DS severity:
  - `rose -> danger`
  - `amber` / `violet -> warning`
  - `emerald -> success`
  - `sky` / `slate -> info`

This is a presentation mapping only. It does not calculate alert severity or create attention items.

## 7. Copilot Treatment

`PortfolioCopilotLauncher` and `PortfolioCopilotDrawer` were **KEEP / VISUAL SHELL ADAPT**.

Treatment:

- added a contextual DS `InlineInsight` in the right-side Home column;
- kept the existing launcher/drawer behind `isPortfolioCopilotEnabled()`;
- kept `onPortfolioRefresh={portfolioState.refreshPortfolioData}`;
- did not implement a new Copilot architecture;
- did not make critical portfolio information exist only inside Copilot.

## 8. Responsive Behavior

- Home now uses a responsive workspace grid: main content plus a right contextual column on wide screens.
- On smaller screens the Copilot/context column stacks after the main content.
- Attention items and NextAction use DS patterns with wrapping actions and stacked content.
- No route-specific breakpoint or fixed desktop-only width was introduced.

## 9. Accessibility

Preserved/improved:

- semantic page heading through `PageHeader`;
- action buttons rendered through DS pattern actions / primitives;
- attention severity includes visible label and icon, not color only;
- empty state exposes a clear title, description and action;
- Copilot insight is labeled as Starteria and explicitly non-authoritative;
- mobile reading order remains main workspace before Copilot context.

Deferred:

- Legacy strategic front cards and recent activity sections still contain raw local buttons/colors and should be migrated in a later detailed Strategic Front / Portfolio components slice.

## 10. Tests

Focused DS + Portfolio Home tests:

```text
rtk cmd /c npx vitest run --config vitest.front.config.ts src/app/pages/__tests__/PortfolioLeadHomePage.bootstrap.test.tsx src/features/portfolio-lead/components/cards/__tests__/PortfolioAttentionList.test.tsx src/app/components/design-system/patterns/__tests__/page-patterns.test.tsx src/app/components/design-system/patterns/__tests__/patterns.test.tsx src/app/components/design-system/status/__tests__/DomainStatusBadge.test.tsx src/app/components/ui/__tests__/button.test.tsx src/app/components/ui/__tests__/badge.test.tsx src/app/components/ui/__tests__/alert.test.tsx
```

Result:

- 8 test files passed.
- 37 tests passed.

Portfolio Lead / Copilot focused tests:

```text
rtk cmd /c npx vitest run --config vitest.front.config.ts src/features/portfolio-lead/domain/__tests__/portfolioInitiativeProjection.test.ts src/features/portfolio-lead/domain/__tests__/adapters.test.ts src/features/portfolio-lead/context/__tests__/PortfolioLeadContext.hydration.test.tsx src/features/portfolio-lead/context/__tests__/PortfolioLeadContext.activation-persist.test.tsx src/features/portfolio-lead/bootstrap/domain/__tests__/portfolioBootstrapDomain.test.ts src/features/portfolio-lead/bootstrap/projection/__tests__/bootstrapHomeProjection.test.ts src/features/portfolio-lead/bootstrap/state/__tests__/usePortfolioBootstrap.test.tsx src/features/portfolio-lead/bootstrap/components/__tests__/PortfolioBootstrapHome.test.tsx src/features/copilot/__tests__/feature-flag.test.ts src/features/copilot/__tests__/PortfolioCopilotShell.test.tsx
```

Result:

- 10 test files passed.
- 98 tests passed.
- Existing expected stderr observed in hydration failure test: `[portfolio] backend truth unavailable; not substituting mock data`.

Typecheck/build/lint:

```text
rtk cmd /c npm run typecheck:front
rtk cmd /c npm run build
rtk cmd /c npm run lint
```

Results:

- `typecheck:front` passed.
- `build` passed.
- `lint` passed.

Existing build warnings:

- Vite dynamic/static import warning for `front/src/app/services/api.ts`.
- Vite large chunk warning.

E2E:

```text
rtk cmd /c npm run test:e2e -- e2e/portfolio-lead-role.spec.ts
```

Result:

- passed, 6 tests.
- First run failed due Docker permission; rerun with elevated Docker access passed.

Additional browser E2E attempted:

```text
rtk cmd /c npm run test:e2e -- e2e/portfolio-entry-conversion.spec.ts
```

Result:

- failed: 1 failed, 7 passed.
- Failure occurred before DS-06 Home visual migration, on Portfolio Entry copy expectation: `getByText(/Esto entendi hasta ahora/i)` was not found.
- The same run later exercised Portfolio Bootstrap continuation paths, but the suite remains red because of the earlier Portfolio Entry assertion.
- A backend error also appeared during one Bootstrap confirm attempt: Prisma unique constraint on `PortfolioAnchorHistory(anchorId, version)`. This is outside DS-06 touched files and was not modified in this slice.

Diff check:

```text
rtk git diff --check -- front/src/app/pages/PortfolioLeadHomePage.tsx front/src/app/pages/__tests__/PortfolioLeadHomePage.bootstrap.test.tsx front/src/features/portfolio-lead/components/cards/PortfolioAttentionList.tsx front/src/features/portfolio-lead/components/cards/__tests__/PortfolioAttentionList.test.tsx docs/design-system
```

Result: passed.

## 11. Files Changed

Modified:

- `front/src/app/pages/PortfolioLeadHomePage.tsx`
- `front/src/app/pages/__tests__/PortfolioLeadHomePage.bootstrap.test.tsx`
- `front/src/features/portfolio-lead/components/cards/PortfolioAttentionList.tsx`

Created:

- `front/src/features/portfolio-lead/components/cards/__tests__/PortfolioAttentionList.test.tsx`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS06_PORTFOLIO_HOME_REPORT.md`

## 12. Legacy Components Retained / Deprecated

| Legacy component | Current responsibility | DS replacement/composition | Treatment |
|---|---|---|---|
| `PortfolioWelcomeBanner` | Home-specific banner/actions | `PageHeader` | DEPRECATE for Portfolio Home; retained for other consumers |
| `PortfolioPrimaryActionRail` | Object-first primary action cards | `PageHeader` actions + `NextAction` | DEPRECATE for Portfolio Home; retained |
| `PortfolioAttentionList` | Supplied alerts + navigation | `AttentionItem` / `EmptyState` | ADAPT |
| `StrategicObjectivesOverview` | Strategic front summary/cards | Future strategic front composition | KEEP |
| `PortfolioSummaryCards` | Existing metric cards | Future metric/context pattern | KEEP |
| `RecentActivitySection` | Recent activity | Future activity pattern | KEEP |
| `PortfolioCopilotDrawer` | Existing Copilot drawer/session UI | Future Copilot system | KEEP |

## 13. Behavior Regression Audit

No change to:

- APIs;
- portfolio queries;
- `PortfolioLeadContext`;
- selectors / severity calculation;
- pending decision calculation;
- routes;
- permissions;
- role handling;
- Copilot services;
- AI contracts/prompts;
- backend behavior;
- Core / Step behavior.

Observed action preservation:

- Page primary action still navigates to `/portfolio/frentes-estrategicos`.
- Import action still navigates to `/portfolio/iniciar?mode=import`.
- Empty attention fallback uses the existing next action path.
- Alert actions use the exact supplied `alert.actionPath`.
- Pending decision actions use the exact supplied `item.actionPath`.

## 14. Conflicts / Blockers

```text
CONFLICT
Contract:
CURRENT_STATE.md / AGENTS.md
Requirement:
This repo is a public documentation/harness snapshot and product code should not be evolved by default without explicit decision.
Current document/code:
DS-06 request explicitly asks to migrate Portfolio Home product code in this repository.
Observed mismatch:
The run required frontend edits in a repo that declares product runtime non-authoritative by default.
Risk:
Confusion between public harness snapshot and authorized product checkout.
Recommended treatment:
KEEP changes as requested for DS-06, but document the repository-state conflict and avoid backend/Core/domain changes.
Requires ADR:
No, unless future runs continue product implementation in this public snapshot without an explicit repository policy update.
```

```text
CONFLICT
Pattern:
StrategicObjectivesOverview / StrategicFrontExecutiveCard
Current behavior:
Still mixes strategic-front presentation, local tones, raw buttons, progress and challenge drill-down behavior.
Why it is domain-specific:
Strategic Front detail/card semantics belong to DS-07 or later, not DS-06 Home shell.
Recommended treatment:
KEEP now; migrate in DS-07 with a dedicated Strategic Front/Challenge card mapping.
Risk:
Broad migration here could alter front/challenge navigation or imply finalized domain card semantics prematurely.
```

```text
CONFLICT
E2E:
portfolio-entry-conversion.spec.ts
Current behavior:
Fails on Portfolio Entry copy expectation `Esto entendi hasta ahora`; later also logs a backend Bootstrap anchor history unique constraint.
Why it is outside DS-06:
DS-06 did not modify Portfolio Entry, Bootstrap backend service, schemas or persistence.
Recommended treatment:
REPORT and investigate in the Portfolio Entry/Bootstrap lane before treating as DS-06 regression.
Risk:
The broader Entry-to-Portfolio browser suite is not fully green despite the DS-06-focused tests and Portfolio role E2E passing.
```

## 15. Screenshots / Manual Validation Notes

- No screenshot artifacts were intentionally added to the repository.
- Automated browser validation covered the Portfolio Lead role stack and the Entry-to-Portfolio continuation suite attempt.
- Desktop/tablet/mobile visual screenshots were not captured in this run. Responsive behavior was validated through the DS pattern structure and DOM-level tests, not by manual screenshot comparison.
- Empty operational Home was covered by `PortfolioLeadHomePage.bootstrap.test.tsx`.
- Attention items and fallback action behavior were covered by `PortfolioAttentionList.test.tsx`.

## 16. Recommendation for DS-07

Recommended DS-07 scope:

- Strategic Front / Challenge summary pilot for Portfolio surfaces.
- Migrate `StrategicObjectivesOverview`, `StrategicFrontExecutiveCard`, `ChallengeCard`, coverage badges and next-action blocks into DS-composed domain-light cards.
- Keep Challenge Detail and Activation detail out of DS-07 unless the slice explicitly authorizes them.
- Before DS-07, resolve whether the public harness repo remains an acceptable place for product-code migrations.
