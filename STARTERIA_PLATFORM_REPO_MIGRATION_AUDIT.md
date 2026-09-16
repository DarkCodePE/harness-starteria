# STARTERIA PLATFORM REPO MIGRATION AUDIT

## 1. Executive Summary

Migration branch: `feat/traer-plataforma`.

Target repo: `DarkCodePE/harness-starteria`.

Source repo: `nmindFa/Dashboardstarteria`.

The target branch was created from target `main` and received the selected product runtime from the source branch that contains Portfolio Entry product wiring. This was not a blind repository copy: target authority, harness, skills, plugins, and existing documentation were preserved.

Pre-merge gap closure update: DB migration validation now passes against isolated PostgreSQL; DB integration tests for Portfolio Entry sessions, conversion/confirmation, continuation, and bootstrap pass without skips; Portfolio Entry browser smoke passes. Full browser E2E still fails outside the Portfolio Entry smoke, so the branch is not merge-ready yet.

Final pre-merge verdict for this branch: `NOT_MERGE_READY`.

Blocking gap before declaring merge-ready: full browser E2E failed (`20 failed, 4 did not run, 21 passed`). The targeted Portfolio Entry smoke is green (`8 passed`) and now protected in CI as `e2e-light`.

## 2. Source Repo State

Source repo: `nmindFa/Dashboardstarteria`.

Default branch: `main`.

Portfolio Entry PR checked: `#181 Wire Portfolio Entry product journey`.

PR state at migration time: `OPEN`.

PR merge status: not merged (`mergedAt: null`, `mergeCommit: null`).

PR head branch: `fix/portfolio-entry-product-wiring`.

PR head commit used as source: `17b57a6e3dcf2d6d4b43571013427edb6c21ee22`.

PR base commit observed: `db4274e6d984ddc515dc500efd46c5703b4657b3`.

Source CI on PR #181: required CI passed; E2E light was skipped.

## 3. Target Repo State

Target repo: `DarkCodePE/harness-starteria`.

Default branch: `main`.

Target `main` exists.

Target base commit: `459409710e234e3204a09acc8f14cf949a92f75d`.

Integration branch: `feat/traer-plataforma`, created from target `main`.

## 4. Source Commit Used

`17b57a6e3dcf2d6d4b43571013427edb6c21ee22`.

Rationale: PR #181 was not merged into source `main`, so using source `main` would have omitted the Portfolio Entry product wiring. The selected source is therefore the PR head, explicitly declared here.

## 5. Target Base Commit

`459409710e234e3204a09acc8f14cf949a92f75d`.

## 6. Authority Reconciliation

Existing target authority was preserved. Product runtime was added under runtime paths without replacing the target authority map or active Portfolio Entry contract.

| Authority artifact | Version | Status | Canonical target path |
|---|---:|---|---|
| Authority Map | v0.1 | Base governance for harness/documentation | `doc/STARTERIA_AUTHORITY.md` |
| Core Contract | v0.2 | Base fundacional revisada / Por validar | `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` |
| Portfolio Entry Logic Contract | v0.1 | APROBADO COMO BASE DE EXPERIENCIA PARA AUDITORIA E IMPLEMENTACION | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` |
| Portfolio Post-Entry Continuation Contract | v0.1 | PROPOSED FOR REVIEW | `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` |
| Product ADR index | current | Reference | `doc/product-adr/ADR-INDEX.md` |
| Harness ADR index | current | Reference | `docs/adr/ADR-INDEX.md` |
| Development Harness | v0.1 | Reference | `doc/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md` |

## 7. Files Migrated

| Source path | Target equivalent | Action | Reason |
|---|---|---|---|
| `front/` | `front/` | KEEP_SOURCE | Product frontend runtime, Portfolio Entry UI, Portfolio Lead UI, tests, Prisma schema and migrations. |
| `backend/` | `backend/` | KEEP_SOURCE | Product backend runtime, Portfolio Entry sessions, continuation, bootstrap, auth, portfolio, tests. |
| `ai-service/` | `ai-service/` | KEEP_SOURCE_WITH_EXCLUSIONS | Product AI service and tests. Removed `ai-service/spikes/` as experimental/historical. |
| `tests/` | `tests/` | KEEP_SOURCE | Shared factories and pilot utility tests referenced by Node test config. |
| `evals/golden/` | `evals/golden/` | KEEP_SOURCE | Golden fixtures required by frontend/backend PDF contract tests. |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | KEEP_SOURCE | CI equivalent for product runtime validation. |
| `.github/dependabot.yml` | `.github/dependabot.yml` | KEEP_SOURCE | Dependency monitoring config from product source. |
| `.github/PULL_REQUEST_TEMPLATE.md` | `.github/PULL_REQUEST_TEMPLATE.md` | KEEP_SOURCE | PR hygiene from product source. |
| `docker-compose.yml` | `docker-compose.yml` | KEEP_SOURCE | Local product runtime composition. |
| `docker-compose.e2e.yml` | `docker-compose.e2e.yml` | KEEP_SOURCE | Postgres E2E service definition. |
| `Dockerfile.frontend` | `Dockerfile.frontend` | KEEP_SOURCE | Frontend image build. |
| `Dockerfile.backend` | `Dockerfile.backend` | KEEP_SOURCE | Backend image build. |
| `.env.example` | `.env.example` | KEEP_SOURCE | Non-secret runtime config template. |
| `feature_list.json` | `feature_list.json` | KEEP_SOURCE | Runtime feature inventory. |
| `scripts/check-feature-list.py` | `scripts/check-feature-list.py` | KEEP_SOURCE | Product feature-list check script. |
| `docs/STARTERIA_AUTHORITY.md` | `doc/STARTERIA_AUTHORITY.md` | KEEP_TARGET | Target authority map is canonical. Source copy not duplicated. |
| `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` | `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | KEEP_TARGET | Target core contract is canonical and retains declared status. |
| `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | KEEP_TARGET | Target already declares single active Portfolio Entry contract. |
| `docs/portfolio-lead/**` | `docs/portfolio-lead/**` | KEEP_TARGET | Target Portfolio Lead docs already exist; no blind overwrite. |
| `AGENTS.md` | `AGENTS.md` | KEEP_TARGET | Target agent instructions preserved. |

## 8. Files Excluded

Excluded intentionally:

- `.git/`
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `tmp/`
- `test-results/`
- local logs and `*.tmp`
- real `.env`, `.env.local`, `.env.production`
- `repair-control/`
- `project/`
- `k8s/`, including `cloudflared-secret.yaml`
- `.claude-flow/`, `.swarm/`, `.vscode/`
- `evals/results/`
- source root historical handoff/progress files
- `ai-service/spikes/`
- bulk source documentation not reconciled as canonical target authority

## 9. Legacy Isolation

Portfolio Lead journey must end in Portfolio, not Project/Step0.

Observed runtime:

- Portfolio Entry public flow includes tests for continuation to Portfolio.
- `front/e2e/portfolio-entry-conversion.spec.ts` watches and rejects navigation to:
  - `/public/draft/:id/edit`
  - `/projects/:id`
  - `/projects/:id/step/0`
  - `/step/0`
- Legacy Project/Step0 conversion still exists in `backend/modules/portfolio-entry-conversion/`.
- That conversion is retained as an Initiative Entry/legacy-compatible path and is not the Portfolio Lead primary journey.
- Backend tests include a rejection path for Project conversion from Portfolio sessions.

Confirmation status from `npm run test:e2e -- e2e/portfolio-entry-conversion.spec.ts`:

- Portfolio Entry creates Project for Portfolio Lead: `NO`.
- Portfolio Entry creates Steps: `NO`.
- Portfolio Entry activates Step0: `NO`.
- Portfolio Lead ends in Portfolio: `YES`.
- Forbidden-route watcher found no navigation to `/public/draft/:id/edit`, `/projects/:id`, `/projects/:id/step/0`, or `/step/0`.

## 10. Docs Reconciliation

No active contract was duplicated under a new active path.

Source product/runtime ADRs under `backend/docs/adr/` were migrated as backend implementation history, not as replacement for target harness ADRs or product authority.

Target canonical docs retained:

- `CURRENT_STATE.md`
- `doc/STARTERIA_AUTHORITY.md`
- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `doc/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`
- `docs/portfolio-lead/**`
- `docs/adr/**`
- `doc/product-adr/**`

## 11. Runtime Reconciliation

Migrated runtime groups:

- `front/`
- `backend/`
- `ai-service/`
- Prisma schema and migrations under `front/prisma/`
- Portfolio Entry runtime and sessions
- Portfolio Entry continuation and conversion boundary
- Portfolio Bootstrap/Home
- Portfolio Lead UI/domain/bootstrap state
- Auth wiring
- API clients
- Unit and integration test suites
- Browser E2E specs
- CI workflow

## 12. DB/Migrations

Migrated:

- `front/prisma/schema.prisma`
- `front/prisma/migrations/**`
- `front/prisma/seed*.ts`
- E2E DB scripts under `front/scripts/database/`

Validation:

- Isolated PostgreSQL: `docker compose -f docker-compose.e2e.yml -p starteria-e2e up -d --wait postgres`: passed.
- Clean DB provisioning: `npm run db:e2e:provision`: passed.
- Migrations from zero: 37 migrations applied successfully, from `20260414220131_add_portfolio_lead_models` through `20260914150000_add_portfolio_bootstrap_import_batches`.
- `npx prisma generate`: passed.
- Prisma client connectivity against isolated DB: passed (`user_count=4` after E2E seed).
- `npx prisma migrate status`: passed (`Database schema is up to date!`).
- Destructive-operation audit: no `DROP TABLE` found. Existing clean-migration SQL contains index/constraint drops, nullable-column relaxations, and `TruthValidation` normalization deletes in historical migration `20260810120000_r1_truth_integrity_review_fix`; no unexpected destructive operation for a clean database bootstrap was observed.

## 13. Tests

Executed locally:

- `npm ci --cache .npm-cache`: passed after allowing npm registry access.
- `npx prisma generate`: passed after allowing Prisma engine download.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:backend`: passed.
- `npm run test:front`: passed.
- `npx prisma validate` with local dummy `DATABASE_URL`: passed.
- DB integration command with `PORTFOLIO_ENTRY_DB_INTEGRATION=1` and `PORTFOLIO_BOOTSTRAP_DB_INTEGRATION=1`: passed (`4` files, `42` tests, `0` skips reported).
- Full browser E2E: failed (`45` tests total; `21` passed, `20` failed, `4` did not run).
- Targeted Portfolio Entry browser smoke: passed (`8` tests).

Not executed locally:

- Python tests: `uv` not available; `python -m pytest -m unit` unavailable because `pytest` is not installed.

Full Portfolio Entry browser path result:

- `/public/start` -> clarification -> handoff -> confirmation/auth -> Portfolio continuation -> Portfolio Home: passed in targeted smoke.
- Forbidden destinations `/public/draft/:id/edit`, `/projects/:id`, `/projects/:id/step/0`, `/step/0`: not reached in targeted smoke.
- Full-suite gap: `public-start-access.spec.ts` failed in the full run and must be reviewed with the other E2E failures before merge-ready status.

## 14. CI

Migrated CI: `.github/workflows/ci.yml`.

CI covers:

- Node tests with coverage.
- Python unit tests with coverage via `uv`.
- Frontend build.
- Python ruff check in advisory mode.
- E2E light: `npm run test:e2e -- e2e/portfolio-entry-conversion.spec.ts`.
- CI summary.

GitHub CI result on commit `5885fc3099dd48cb462f29d75ec56f9827bf0966`: passed.

- Node tests (vitest + coverage): success.
- Python tests (pytest -m unit): success.
- Lint and build: success.
- E2E light (Portfolio Entry): success.
- CI summary: success.

CI does not fully protect browser E2E:

- Full browser E2E is not enabled as a required CI job because the complete suite is currently red and materially broader than the pre-merge Portfolio Entry smoke.
- Do not declare full E2E protected until the 20 full-suite failures are resolved.

## 15. Security/Secret Scan

Manual exclusions prevented copying known risky locations such as real `.env`, `k8s/`, dumps, logs, coverage, temp folders, and local tool state.

Secret pattern scan command excluded lockfiles/vendor/cache/generated install output and searched for common API key/token/private key patterns.

Result: no matches.

Dependency audit:

- `npm audit --json`: 35 vulnerabilities: 2 low, 8 moderate, 20 high, 5 critical.
- `npm audit --omit=dev --json`: 19 production-scope vulnerabilities: 1 low, 4 moderate, 13 high, 1 critical.

Critical triage:

| Package/advisory group | Path | Classification | Blocking? | Treatment |
|---|---|---|---:|---|
| `vitest` | direct devDependency | DEV_ONLY | No | Fix requires major upgrade to Vitest 5; not applied in this scoped pre-merge pass. |
| `@vitest/coverage-v8` | direct devDependency, via `vitest` | DEV_ONLY | No | Same major-upgrade risk as Vitest; not applied. |
| `shell-quote` | transitive via `concurrently` | DEV_ONLY / TRANSITIVE | No | Used by local dev script `dev:all`, not production runtime. |
| `tar` | transitive via `@tailwindcss/oxide` and `@mapbox/node-pre-gyp` | TRANSITIVE / RUNTIME_NON_BLOCKING | No | Install/build-time archive parser dependency; not reached by Portfolio Entry HTTP/runtime paths. No safe scoped non-major fix identified. |
| npm critical total | audit metadata | MIXED | No runtime blocker identified | Keep Dependabot/audit follow-up before production cutover. |

Safe scoped fixes applied: none. Available automated fixes either require major version changes (`vitest`, `prisma`, `nodemailer`) or affect broad transitive install tooling; these were documented instead of upgraded indiscriminately.

PII scan:

- No real `.env` or DB dumps were migrated.
- Synthetic test emails/users are present in tests.
- No targeted PII corpus was found during the secret-pattern scan.

## 16. Deploy Readiness

DEPLOY_SOURCE_CURRENT: `nmindFa/Dashboardstarteria`, currently source product repo.

DEPLOY_SOURCE_TARGET: `DarkCodePE/harness-starteria`.

REQUIRED_CHANGE: after review/merge, repoint production build/deploy integration from `nmindFa/Dashboardstarteria` to `DarkCodePE/harness-starteria`.

EXPECTED_BRANCH: `main` after PR merge; do not deploy directly from `feat/traer-plataforma` unless explicitly approved.

EXPECTED_BUILD_COMMAND: frontend `cd front && npm ci && npx prisma generate && npm run build`; backend `cd front && npm run build:backend` or Dockerfile-based build; AI service per `ai-service/pyproject.toml` with `uv sync --all-extras`.

EXPECTED_OUTPUT: frontend Vite `front/dist`; backend compiled output per `tsconfig.backend.json`; AI service Python runtime container/app.

ENV_VARIABLES_REQUIRED:

- Frontend: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_ENABLE_INITIAL_REVIEW`, `VITE_ENABLE_INITIATIVE_REVIEW_CHAT`, `VITE_ENABLE_DEMO_DATA`, `VITE_FEATURE_PDF_AUTOFILL`, `VITE_BACKEND_PROXY_TARGET` for local/E2E proxying.
- Backend: `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `BODY_LIMIT`, `AI_SERVICE_URL`, `BRIDGE_SHARED_SECRET` or `AI_SERVICE_TOKEN`, `LOCAL_STORAGE_DIR`, `GOOGLE_CLIENT_ID`, billing flags/secrets if enabled, SMTP variables if notifications are enabled.
- AI service: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `ENVIRONMENT`, `LOG_LEVEL`, `MAX_COST_PER_REQUEST_USD`, `MAX_COST_PER_PROJECT_DAY_USD`, `LANGSMITH_*` if tracing is enabled, `BACKEND_WEBHOOK_URL`, `BACKEND_WEBHOOK_TOKEN`, `BACKEND_WEBHOOK_TIMEOUT_SEC`, `PDF_EXTRACT_COST_CAP_USD`, `PDF_EXTRACT_STUB`.
- Provider IA: OpenRouter by default (`https://openrouter.ai/api/v1`); deterministic Portfolio Entry mode is available through `PORTFOLIO_ENTRY_RUNTIME_MODE=deterministic` for E2E.
- Auth config: JWT access/refresh config, Google OAuth client ID if Google sign-in is enabled, waitlist/rate-limit flags only for test/E2E.
- CORS: `CORS_ORIGIN` supports comma-separated allowed origins.
- Production URLs: no runtime/CI deployment reference to `nmindFa/Dashboardstarteria` was found. Historical docs/audit/ADR references remain as provenance only.
- Build commands: frontend `cd front && npm ci && npx prisma generate && npm run build`; backend `cd front && npm run build:backend` or `Dockerfile.backend`; AI service `cd ai-service && uv sync --all-extras`.
- Start commands: backend `cd front && npm run start:backend` after build or Docker image; frontend served from Vite `dist`/nginx image; AI service through its Python app/runtime container.

MIGRATION_REQUIRED: yes, apply Prisma migrations from `front/prisma/migrations` to target production database only after review and backup.

ROLLBACK_PLAN: keep deployment pointed at `nmindFa/Dashboardstarteria` until target PR is merged, CI passes, DB migrations are validated in staging, and browser E2E passes. If post-cutover issues occur, revert deploy source to previous repo/commit and restore DB from pre-migration backup if migrations were applied.

## 17. Remaining Gaps

- Full browser E2E is red: `20` failures, `4` did not run.
- Python tests not executed locally due missing `uv`/`pytest`.
- GitHub CI must run on the PR in target repo and become the source of truth for Linux/Node 20/Python 3.11.
- `npm audit` still reports inherited vulnerabilities; no runtime-blocking critical was identified, but dependency security follow-up remains required before production cutover.
- Legacy Project/Step0 conversion remains in codebase and must remain isolated from Portfolio Lead journey.

## 18. Final Verdict

`NOT_MERGE_READY`

Reason: DB migrations, DB integrations, targeted Portfolio Entry browser smoke, and GitHub CI including `e2e-light` pass. However, full browser E2E failed (`20 failed, 4 did not run, 21 passed`), so this branch should not be merged yet.
