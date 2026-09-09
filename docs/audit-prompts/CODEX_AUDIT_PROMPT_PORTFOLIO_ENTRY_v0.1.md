# Codex Audit Prompt — Portfolio Entry Current State

Use this prompt before making any implementation changes.

---

You are auditing the current Starteria repository in preparation for the first vertical slice:

**Pantalla 1 — Portfolio Entry / Landing pública del Portfolio Lead**

Your task in this run is **AUDIT ONLY**.

Do not change product code.
Do not refactor.
Do not create migrations.
Do not change schemas.
Do not modify Step 0–4.
Do not implement the new experience yet.

## 1. Mandatory authority reading

Before inspecting implementation, read in this order:

1. `/docs/STARTERIA_AUTHORITY.md`
2. `/docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
3. the active `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
4. relevant approved ADRs
5. `/docs/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`
6. `PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md`
7. root `AGENTS.md`

If paths differ, locate the authoritative files first and report their actual paths.

Do not use older PRDs to override a higher-authority contract.

## 2. Core protection

This audit must treat Portfolio Entry as **pre-Core**.

The target Screen 1 must not create:

- Organization
- StrategicFront
- Challenge
- Initiative
- Step
- Decision

The audit must identify any current path that does so.

Do not propose modifying Step 0–4 as part of this slice.

## 3. Inspect current routes

Audit at least:

- `/`
- `/public/start`
- any route reached after `/public/start` submission
- any auth continuation route
- any conversion route into Initiative / Step 0

Document:

- route files;
- page components;
- loaders/actions/handlers;
- redirect behavior;
- auth dependencies.

## 4. Inspect frontend

Map all components used by `/public/start`.

For each relevant component report:

- path;
- responsibility;
- local state;
- API calls;
- feature flags;
- analytics;
- dependencies;
- whether it encodes product semantics or is generic infrastructure.

Pay special attention to:

- current headline/subcopy;
- textarea;
- minimum-character behavior;
- example chips;
- PDF/file upload;
- CTA;
- proposal-generation UI;
- preview;
- loading states;
- error states.

## 5. Inspect backend/API flow

Trace the full submit path from `/public/start`.

Identify:

- endpoint called;
- controller/route handler;
- service;
- AI service/prompt;
- persistence;
- conversion logic;
- redirects;
- downstream Initiative/Step creation.

Produce a simple sequence:

```text
UI
→ endpoint
→ service
→ persistence
→ AI
→ conversion
→ redirect
```

Use actual code names/paths.

## 6. Inspect persistence

Locate all relevant models/entities/tables.

Especially inspect whether these currently exist:

- PublicDraft
- InitialReview
- Initiative
- StepProgress
- anonymous session
- provenance/source models
- audit log
- analytics event persistence

For `PublicDraft`, compare its actual semantics against the new required provisional concepts:

- PortfolioEntryDraft
- PortfolioEntryAnalysis

Do NOT assume they are equivalent.

Produce:

```text
LEGACY MODEL COMPATIBILITY

Model:
Reusable as-is: yes/no
Semantic conflicts:
Migration/refactor risk:
Recommendation:
KEEP / ADAPT / REPLACE / DO NOT REUSE
```

## 7. Inspect AI behavior

Locate:

- prompts;
- model calls;
- output schemas;
- parsing/validation;
- fallbacks;
- retries.

Check whether current AI can:

- invent KPI;
- suggest KPI;
- create proposal text;
- suggest challenge type;
- create Initiative-like structure;
- trigger conversion;
- mutate confirmed data.

Compare this against the new contract.

## 8. Inspect tests

Find relevant:

- unit tests;
- integration tests;
- e2e tests;
- route tests;
- schema tests.

Report:

- what behavior is currently protected;
- what old behavior will intentionally need changing;
- what tests must remain;
- what tests are missing.

Do not delete/update tests in this audit.

## 9. Produce KEEP / ADAPT / REMOVE / NEW matrix

Create a table with columns:

| Area | Current implementation | Contract requirement | Status | Treatment | Reason | Files affected |

Treatment must be exactly one of:

- KEEP
- ADAPT
- REMOVE
- NEW

At minimum classify:

- `/public/start` route;
- public shell/header;
- textarea;
- example chips;
- minimum-character rule;
- PDF upload;
- CTA;
- current draft model;
- current AI analysis;
- proposal editor/review;
- conversion-to-Initiative;
- Step0 redirect;
- analytics;
- error/loading primitives.

## 10. Explicit conflict report

For every mismatch with a higher-authority contract, report:

```text
CONFLICT
ID:
Contract:
Requirement:
Current implementation:
Observed mismatch:
Risk:
Recommended treatment:
Requires ADR: yes/no
```

Do not silently reconcile.

## 11. ADR detection

Mark `Requires ADR: yes` only if resolving the issue would:

- change a Core invariant;
- change canonical domain relationships;
- expand AI organizational authority;
- change human authority;
- modify stable Step 0–4 functions;
- modify Adaptive Cycle/gating semantics;
- automatically canonicalize inference.

A normal UI or Experience Contract migration does not automatically require ADR.

## 12. Required output file

Create:

`PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md`

with this structure:

1. Executive summary
2. Authority files found and read
3. Repository/routes discovered
4. Current `/public/start` E2E
5. Frontend inventory
6. Backend/API inventory
7. Persistence/model inventory
8. AI inventory
9. Test inventory
10. KEEP / ADAPT / REMOVE / NEW matrix
11. Contract conflicts
12. ADR candidates
13. No-regression risks for Step 0–4
14. Recommended implementation slices
15. Open technical questions that cannot be resolved from the repo
16. Final recommendation: adapt existing vs rebuild specific parts

## 13. Final response to me

After creating the audit file, respond only with:

- audit file path;
- 5–10 most important findings;
- whether `/public/start` should be adapted or rebuilt, with evidence;
- any ADR blockers;
- whether it is safe to move to implementation planning.

Do not implement yet.
