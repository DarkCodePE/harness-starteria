# Portfolio Entry v0.2 Functional Validation Audit

**Slice:** Portfolio Entry v0.2/v0.2.1
**Branch:** `docs/portfolio-entry-v2-reconcile`
**Status:** audit result; no promotion
**Scope:** read-only validation of consumers, runtime, harness and tests

## 1. Consumer map

| Reference or surface | Classification | Finding |
| --- | --- | --- |
| `agents/portfolio-entry-responder.md` | `ACTIVE_CONSUMER` | Reads `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` and the four `doc/entry-*_SKILL_v0.1.md` files. |
| `plugins/starteria-harness/agents/portfolio-entry-responder.md` | `ACTIVE_CONSUMER` | Keeps the same v0.1 document inputs. |
| `skills/starteria-probar/SKILL.md` | `ACTIVE_CONSUMER` | Uses `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`. |
| `plugins/starteria-harness/skills/starteria-probar/SKILL.md` | `ACTIVE_CONSUMER` | Uses the v0.1 harness documentation. |
| `skills/starteria-revisar/SKILL.md` | `ACTIVE_CONSUMER` | Consults the v0.1 harness suite index. |
| `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | `LEGACY_COMPAT` | Legacy/current source with active consumers. |
| `doc/entry-01-intent-detection_SKILL_v0.1.md` through `doc/entry-04-question-planner_SKILL_v0.1.md` | `LEGACY_COMPAT` | Legacy/current skill sources with active consumers. |
| `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | `LEGACY_COMPAT` | Current harness source consumed by the v0.1 workflow. |
| `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | `LEGACY_COMPAT` / declared authority | Equivalent legacy source requiring path reconciliation with the target `docs/...` path. |
| `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | `HISTORICAL_REFERENCE` | Historical Core reference; it must not define new behavior. |
| | `STARTERIA_V2_MANIFEST.md` and `docs/STARTERIA_AUTHORITY.md` | `INDEX_ONLY` | Governance indexes, not runtime consumers. |
| `docs/.../*v0.2*` candidate stack | `CANDIDATE_ARTIFACT` | Installed for reconciliation and isolated validation; not active runtime consumers and not promoted authority. |
| `tests/ai-harness/portfolio-entry` | `UNKNOWN` | The requested directory is not materialized in this branch. |
| `backend/modules/portfolio-entry-runtime` | `ACTIVE_CONSUMER` | Imported by the active Portfolio Entry router. |

## 2. Runtime semantic map

The active API route is:

```text
/api/v1/public/portfolio-entry
```

It is registered by `backend/app.ts` and imports `backend/modules/portfolio-entry/portfolio-entry.router.ts`.

The active router identifies a mixed version state:

```text
contractVersion: portfolio-entry-contract-v0.1
runtimeVersion: portfolio-entry-runtime-v0.2
schemaVersion: portfolio-entry-schema-v0.2
promptManifestId: portfolio-entry-prompts-v0.2
```

The runtime already contains partial v0.2 semantics:

- `initial_entry_state` is separated from `current_frame`;
- provenance distinguishes user declarations, extraction, inference and suggestions;
- reverse alignment can be activated later in the interaction;
- question planning is bounded at three questions;
- quick clarification and guided exploration have explicit session states;
- session safety limits and question budgets are enforced;
- handoff is pre-canonical and reviewable;
- candidate metadata, prompt hashes and model execution metadata are retained;
- deterministic and live model adapters are available;
- prompts are loaded from `backend/modules/portfolio-entry-runtime/prompts/v0.2`.

This is partial v0.2 implementation evidence. It does not promote the v0.2 contracts or replace the v0.1 consumer baseline.

## 3. Test map

Available tests that can validate isolated runtime behavior include:

- `backend/modules/portfolio-entry-runtime/__tests__/live-adapter.test.ts`
  - structured output mapping;
  - provider/model metadata;
  - redaction of provider errors and secrets;
  - readiness reporting.
- `backend/modules/portfolio-entry/__tests__/portfolio-entry.router.test.ts`
  - sessions, messages, handoff, confirmation, claim, idempotency, guided exploration, authentication and rate limits.
- `backend/modules/portfolio-entry-conversion/__tests__/portfolio-entry-conversion.mapper.test.ts`
  - handoff-to-conversion mapping.
- `backend/modules/portfolio-entry-sessions/__tests__/portfolio-entry-session.service.test.ts`
  - persistence and recovery of runtime session types.
- `backend/modules/portfolio-entry-runtime/__tests__/live-smoke.integration.test.ts`
  - real provider analysis and provisional handoff, gated by `PORTFOLIO_ENTRY_LIVE_SMOKE=1` and provider configuration.

The v0.2 documents define a deterministic baseline, live candidate mode, fixtures, holdouts and hypothesis validation, but no executable v0.2 harness runner or fixture directory was found under `tests/ai-harness/portfolio-entry`.

## 4. Safe validation plan

Use an isolated test router built with `buildPortfolioEntryRouter` and inject:

1. a candidate `agentAdapter`;
2. a candidate `handoffMaterializer`;
3. in-memory repositories;
4. a separate candidate ID such as `portfolio-entry-v0.2-validation`;
5. separate v0.1 regression fixtures and v0.2 candidate fixtures;
6. explicit contract, runtime, schema and prompt manifest metadata;
7. deterministic mode for contract conformance;
8. live mode only for the explicitly gated smoke test.

The isolated plan must keep separate:

- v0.1 regression checks;
- v0.2 contract conformance;
- hypothesis validation;
- live provider observations.

The exported production router, v0.1 agents, v0.1 skills, v0.1 harness and their consumers must remain unchanged.

## 5. Commands attempted

Read-only inspection included:

```text
git status --short --branch
rg --files docs/agents/portfolio-entry
rg --files docs/ai-harness/portfolio-entry docs/experience/portfolio-entry
rg --files agents plugins/starteria-harness skills doc
rg -n "doc/(PORTFOLIO_ENTRY|entry-0)|PORTFOLIO_ENTRY_(AGENT|AI_HARNESS)|SKILL_v0.1|v0.1" skills plugins/starteria-harness/skills
rg -n "portfolio-entry-runtime|portfolioEntryRouter|runtimeVersion|promptManifestId|contractVersion" backend front tests
npx vitest run --config vitest.backend.config.ts ...
npm.cmd exec -- vitest run --config vitest.backend.config.ts ...
```

The Vitest command targeted the runtime adapter, Portfolio Entry router, conversion mapper and session service suites.

## 6. Results

- The requested `tests/ai-harness/portfolio-entry` directory does not exist in this branch.
- The v0.1 responder and harness consumers still read `doc/...` sources.
- The active API router imports the v0.2 runtime and v0.2 prompt manifest.
- The router still labels the contract version as v0.1.
- The first test command was blocked because PowerShell execution policy rejected `npx.ps1`.
- The `npm.cmd exec` retry produced no output and did not complete; it was stopped after the process remained blocked.
- No runtime, test, authority or consumer files were changed during the audit.

## 7. Gaps

- The v0.1 authority and its executable/documentary sources are split between target `docs/...` paths and consumed `doc/...` paths.
- There is no materialized v0.2 harness runner or fixture suite under the requested tests path.
- The runtime version metadata is internally mixed between v0.1 contract and v0.2 runtime/schema/prompts.
- The v0.2 findings register is evidence and cannot promote contracts.
- Hypotheses HYP-001 through HYP-004 have not been validated as stable rules.
- Live smoke requires provider configuration, API key and external model availability.
- The existing v0.1 responder has no documented adapter boundary to the v0.2 structured output.
- The required Core target path is not available in the observed checkout; the historical Core source remains under `doc/...`.

## 8. Promotion blockers

Promotion is blocked until all of the following are resolved:

- reconcile `doc/...` sources, `docs/...` target paths and their active consumers;
- materialize and run a versioned v0.2 harness with deterministic fixtures;
- run contract conformance separately from hypothesis validation;
- resolve the mixed contract/runtime/schema/prompt version identity;
- validate holdout behavior and negative v0.1 leakage checks;
- verify the live smoke path independently from deterministic conformance;
- update authority explicitly only after validation evidence is accepted.

## 9. Final recommendation

```text
READY_FOR_ISOLATED_TEST_ADAPTER
```

```text
v0.2 TESTABLE IN ISOLATION: YES
v0.2 SAFE TO PROMOTE: NO
v0.1 CONSUMERS STILL ACTIVE: YES
RUNTIME PARTIALLY V0.2: YES
TEMPORARY ADAPTER/CONFIG REQUIRED: YES
AUTHORITY GAPS OPEN: YES
PROMOTION STATUS: BLOCKED_PENDING_VALIDATION
```
