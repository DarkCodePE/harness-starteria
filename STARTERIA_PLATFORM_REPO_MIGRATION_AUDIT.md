# STARTERIA PLATFORM REPO MIGRATION AUDIT

## 1. Executive Summary

Migration branch: `feat/traer-plataforma`.

Target repo: `DarkCodePE/harness-starteria`.

Source repo: `nmindFa/Dashboardstarteria`.

The target branch was created from target `main` and received the selected product runtime from the source branch that contains Portfolio Entry product wiring. This was not a blind repository copy: target authority, harness, skills, plugins, and existing documentation were preserved.

Final verdict for this branch: `READY_WITH_GAPS`.

Blocking gaps before declaring `READY`: browser E2E was not executed locally, DB migrations were not executed against Postgres because Docker Desktop was unavailable, Python tests were not executed locally because `uv`/`pytest` were unavailable, and `npm audit` reports inherited dependency vulnerabilities.

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

Confirmation status:

- Portfolio Entry creates Project for Portfolio Lead: `NO` by intended Portfolio continuation path; full browser E2E not executed locally.
- Portfolio Entry creates Steps: `NO` by intended Portfolio continuation path; full browser E2E not executed locally.
- Portfolio Entry activates Step0: `NO` by intended Portfolio continuation path; full browser E2E not executed locally.
- Portfolio Lead ends in Portfolio: `YES` by code/tests present; full browser E2E not executed locally.

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

- `npx prisma generate`: passed after allowing Prisma engine download.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:55433/postgres npx prisma validate`: passed.
- `docker compose -f docker-compose.e2e.yml -p starteria-e2e up -d postgres`: failed because Docker Desktop/Linux engine was not available locally.
- `prisma migrate deploy/status` against Postgres: not executed locally.

## 13. Tests

Executed locally:

- `npm ci --cache .npm-cache`: passed after allowing npm registry access.
- `npx prisma generate`: passed after allowing Prisma engine download.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:backend`: passed.
- `npm run test:front`: passed.
- `npx prisma validate` with local dummy `DATABASE_URL`: passed.

Not executed locally:

- Python tests: `uv` not available; `python -m pytest -m unit` unavailable because `pytest` is not installed.
- DB integration tests requiring Postgres: Docker engine unavailable.
- Browser E2E: not executed because DB/Postgres dependency was unavailable.
- Full Portfolio Entry browser path Landing -> clarification -> handoff -> confirmation -> auth -> Portfolio continuation -> Portfolio Home: not executed locally.

## 14. CI

Migrated CI: `.github/workflows/ci.yml`.

CI covers:

- Node tests with coverage.
- Python unit tests with coverage via `uv`.
- Frontend build.
- Python ruff check in advisory mode.
- CI summary.

CI does not fully protect browser E2E:

- `E2E light (disabled - Phase 1)` is hard skipped with `if: false`.

Do not declare E2E fully protected.

## 15. Security/Secret Scan

Manual exclusions prevented copying known risky locations such as real `.env`, `k8s/`, dumps, logs, coverage, temp folders, and local tool state.

Secret pattern scan command excluded lockfiles/vendor/cache/generated install output and searched for common API key/token/private key patterns.

Result: no matches.

Dependency audit:

- `npm ci` reported 35 vulnerabilities: 2 low, 8 moderate, 20 high, 5 critical.
- These appear inherited from the source dependency graph and require separate dependency-security triage before production cutover.

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

- `DATABASE_URL`
- `JWT_SECRET`
- auth/provider credentials as enabled
- AI provider keys for live model mode
- mailer/provider credentials if notifications are enabled
- frontend API/base URL config as used by deployment environment

MIGRATION_REQUIRED: yes, apply Prisma migrations from `front/prisma/migrations` to target production database only after review and backup.

ROLLBACK_PLAN: keep deployment pointed at `nmindFa/Dashboardstarteria` until target PR is merged, CI passes, DB migrations are validated in staging, and browser E2E passes. If post-cutover issues occur, revert deploy source to previous repo/commit and restore DB from pre-migration backup if migrations were applied.

## 17. Remaining Gaps

- Browser E2E not executed locally.
- DB integration and Prisma migrations against Postgres not executed locally.
- Python tests not executed locally due missing `uv`/`pytest`.
- GitHub CI must run on the PR in target repo and become the source of truth for Linux/Node 20/Python 3.11.
- `npm audit` vulnerabilities need triage.
- Legacy Project/Step0 conversion remains in codebase and must remain isolated from Portfolio Lead journey.

## 18. Final Verdict

`READY_WITH_GAPS`

Reason: Runtime and documentation were migrated/reconciled and core local Node validation passed, but full E2E, DB migration validation, Python tests, and dependency vulnerability remediation are not complete.
