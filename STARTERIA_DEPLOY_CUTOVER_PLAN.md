# STARTERIA DEPLOY CUTOVER PLAN

## 1. Current Deployment Topology

Current deploy source repository: `nmindFa/Dashboardstarteria`.

Current deploy branch: unknown in target repo metadata; expected current productive branch is the provider-configured branch in the old repository.

Current provider: `UNKNOWN` from this repository. No canonical Vercel, Netlify, Render, Railway, Fly, Cloudflare Pages, or provider config was found in the target tree.

Current build command, output directory, secrets, production URLs, database host, and runtime service topology must be read from the existing deployment provider before switch. Do not infer production credentials from repository examples.

Historical references to `nmindFa/Dashboardstarteria` or `Dashboardstarteria` remain in docs/audits as provenance. No runtime or CI deployment config in the target tree points to the old repo.

## 2. Target Deployment Topology

Target deploy source repository: `DarkCodePE/harness-starteria`.

Target deploy branch after merge: `main`.

Target runtime groups:

| Component | Target artifact | Runtime |
|---|---|---|
| Frontend | `Dockerfile.frontend` or `front/dist` | Vite build served by nginx |
| Backend | `Dockerfile.backend` or `front` package backend build | Node 20 Express server on port `3001` |
| AI service | `ai-service/Dockerfile` | Python 3.11, uvicorn on port `8001` |
| Database | `front/prisma/schema.prisma`, `front/prisma/migrations/**` | PostgreSQL |
| Local/reference topology | `docker-compose.yml` | frontend, backend, ai-service, postgres, storage volume |

## 3. Repo/Branch Switch

Current -> target map:

| Item | CURRENT | TARGET |
|---|---|---|
| Repository | `nmindFa/Dashboardstarteria` | `DarkCodePE/harness-starteria` |
| Branch | Provider-configured old productive branch | `main` |
| CI source | Old repository CI | `.github/workflows/ci.yml` in target repo |
| Full E2E status | 20 failures reproduced in source | Same 20 failures; accepted test debt, no migration regression |
| Smoke gate | Unknown provider-side gate | Portfolio Entry smoke in CI: `e2e/portfolio-entry-conversion.spec.ts` |

Human switch steps in provider:

1. Confirm current production project points to `nmindFa/Dashboardstarteria`.
2. Change repository connection to `DarkCodePE/harness-starteria`.
3. Set production branch to `main`.
4. Preserve existing environment variable values in the provider secret store.
5. Update build/start commands only where they differ from current productive commands.
6. Deploy first to staging or production-candidate, not directly to live traffic when the provider supports previews.

## 4. Frontend Build/Deploy

Build command:

```sh
cd front
npm ci
npx prisma generate
npm run build
```

Docker alternative:

```sh
docker build -f Dockerfile.frontend .
```

Output directory: `front/dist` for static hosting, or nginx image content at `/usr/share/nginx/html` for Docker.

Required frontend build variables:

| Variable | Status | Notes |
|---|---|---|
| `VITE_API_URL` | REQUIRED | Use `/api/v1` for same-origin nginx proxy or production API URL for split deploy. |
| `VITE_GOOGLE_CLIENT_ID` | OPTIONAL | Required only if Google sign-in is enabled. |
| `VITE_FEATURE_PDF_AUTOFILL` | OPTIONAL | Feature flag. Public Portfolio Entry does not depend on public PDF upload. |
| `VITE_ENABLE_INITIAL_REVIEW` | OPTIONAL | Feature flag. |
| `VITE_ENABLE_INITIATIVE_REVIEW_CHAT` | OPTIONAL | Feature flag. |
| `VITE_ENABLE_DEMO_DATA` | OPTIONAL | Should be false/absent in production unless explicitly intended. |
| `VITE_BACKEND_PROXY_TARGET` | OPTIONAL | Dev/Vite proxy only; not a production browser variable. |
| `VITE_PORTFOLIO_LEAD_EMAIL` | LEGACY | Used by older role-mapping logic/tests; do not rely on it as production authorization. |

## 5. Backend Build/Deploy

Build command:

```sh
cd front
npm ci
npx prisma generate
npm run build:backend
```

Start command:

```sh
cd front
npm run start:backend
```

Docker alternative:

```sh
docker build -f Dockerfile.backend .
```

Health check:

```text
GET /api/health
```

Required backend variables:

| Variable | Status | Notes |
|---|---|---|
| `NODE_ENV` | REQUIRED | `production` in production. |
| `PORT` | REQUIRED | Defaults to `3001` in Docker. |
| `DATABASE_URL` | REQUIRED | Production PostgreSQL connection string. |
| `JWT_SECRET` | REQUIRED | Secret value from provider secret store. |
| `JWT_EXPIRES_IN` | OPTIONAL | Defaults exist. |
| `JWT_REFRESH_EXPIRES_IN` | OPTIONAL | Defaults exist. |
| `CORS_ORIGIN` | REQUIRED | Required for split-origin deploy. Can be avoided with same-origin nginx proxy. |
| `LOG_LEVEL` | OPTIONAL | Defaults exist. |
| `BODY_LIMIT` | OPTIONAL | Defaults exist in examples. |
| `LOCAL_STORAGE_DIR` | REQUIRED | Required for local file storage paths used by PDF/evidence features. |
| `AI_SERVICE_URL` | REQUIRED | Internal AI service URL. |
| `AI_SERVICE_TOKEN` | REQUIRED | Shared backend/AI secret. |
| `BRIDGE_SHARED_SECRET` | LEGACY | Backward-compatible alias; prefer `AI_SERVICE_TOKEN`. |
| `GOOGLE_CLIENT_ID` | OPTIONAL | Required only if Google sign-in validation is enabled. |
| `INITIAL_REVIEW_AI` | OPTIONAL | Empty/mock, real, or real-strict according to environment policy. |
| `CONTEXT_SOURCE_MAX_BYTES` | OPTIONAL | Company context guardrail. |
| `CONTEXT_WEB_MAX_BYTES` | OPTIONAL | Company context guardrail. |
| `CONTEXT_WEB_TIMEOUT_MS` | OPTIONAL | Company context guardrail. |
| `CONTEXT_WEB_MAX_REDIRECTS` | OPTIONAL | Company context guardrail. |
| `SMTP_HOST` | OPTIONAL | Required only for outbound pilot lead email. |
| `SMTP_PORT` | OPTIONAL | Required only with SMTP. |
| `SMTP_SECURE` | OPTIONAL | Required only with SMTP. |
| `SMTP_USER` | OPTIONAL | Required only with SMTP auth. |
| `SMTP_PASS` | OPTIONAL | Required only with SMTP auth. |
| `PILOT_LEAD_NOTIFY_FROM` | OPTIONAL | Required only with SMTP notifications. |
| `PILOT_LEAD_NOTIFY_TO` | OPTIONAL | Required only with SMTP notifications. |

## 6. AI Service Build/Deploy

Build command:

```sh
cd ai-service
uv sync --all-extras
```

Start command:

```sh
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

Docker alternative:

```sh
docker build -f ai-service/Dockerfile ai-service
```

Health check: provider should verify the service starts and exposes its configured health/readiness endpoint if present; otherwise use a basic process and HTTP reachability check for port `8001`.

AI service variables:

| Variable | Status | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | REQUIRED | Provider IA key; never commit value. |
| `OPENROUTER_MODEL` | OPTIONAL | Defaults to `deepseek/deepseek-v4-flash` in compose. |
| `OPENROUTER_BASE_URL` | OPTIONAL | Defaults in code. |
| `ENVIRONMENT` | REQUIRED | Production/staging environment label. |
| `LOG_LEVEL` | OPTIONAL | Defaults exist. |
| `MAX_COST_PER_REQUEST_USD` | OPTIONAL | Cost guardrail. |
| `MAX_COST_PER_PROJECT_DAY_USD` | OPTIONAL | Cost guardrail. |
| `EVAL_COST_CAP_USD` | OPTIONAL | Evaluation cost guardrail. |
| `AI_SERVICE_INTERNAL_TOKEN` | REQUIRED | Must match backend shared token. |
| `BACKEND_WEBHOOK_URL` | OPTIONAL | Required for push callback; polling fallback exists when unset. |
| `BACKEND_WEBHOOK_TOKEN` | OPTIONAL | Required when webhook push is enabled. |
| `BACKEND_WEBHOOK_TIMEOUT_SEC` | OPTIONAL | Webhook timeout. |
| `LANGSMITH_API_KEY` | OPTIONAL | Observability/tracing. |
| `LANGSMITH_PROJECT` | OPTIONAL | Observability/tracing. |
| `LANGSMITH_TRACING` | OPTIONAL | Observability/tracing. |
| `PDF_EXTRACT_COST_CAP_USD` | OPTIONAL | PDF extraction guardrail if enabled. |
| `PDF_EXTRACT_STUB` | OPTIONAL | Test/dev only unless explicitly approved. |

## 7. Database Migrations

Do not execute production migrations in this task.

Pre-deploy:

1. Take a verified production database backup.
2. Record current app commit and database migration state.
3. Verify DB connectivity from the backend runtime network.
4. Run `npx prisma migrate status` against staging/production-candidate.
5. Confirm no unexpected destructive operations for the target environment.

Deploy:

1. Deploy backend image/build with target code but do not route live traffic until DB is ready.
2. Apply migrations:

```sh
cd front
npx prisma migrate deploy
```

3. Verify Prisma client generation in the built artifact.
4. Start backend.

Post-deploy:

1. `GET /api/health`.
2. Verify Portfolio Entry session creation.
3. Verify clarification and handoff.
4. Verify confirmation/auth.
5. Verify Portfolio continuation.
6. Verify Portfolio Home load.
7. Confirm Portfolio Lead does not create `Project`, `Step`, or activate `Step0`.

Rollback:

1. Roll back app deployment to the previous known-good artifact/repository.
2. Preserve the pre-deploy database backup.
3. If migrations changed schema/data incompatibly, restore from backup or apply a reviewed forward-fix migration. Do not invent down migrations if none exist.
4. Keep all incident evidence and migration logs.

## 8. Env Vars

Grouped audit:

| Group | Variable | Status |
|---|---|---|
| FRONTEND | `VITE_API_URL` | REQUIRED |
| FRONTEND | `VITE_GOOGLE_CLIENT_ID` | OPTIONAL |
| FRONTEND | `VITE_FEATURE_PDF_AUTOFILL` | OPTIONAL |
| FRONTEND | `VITE_ENABLE_INITIAL_REVIEW` | OPTIONAL |
| FRONTEND | `VITE_ENABLE_INITIATIVE_REVIEW_CHAT` | OPTIONAL |
| FRONTEND | `VITE_ENABLE_DEMO_DATA` | OPTIONAL |
| FRONTEND | `VITE_BACKEND_PROXY_TARGET` | OPTIONAL |
| FRONTEND | `VITE_PORTFOLIO_LEAD_EMAIL` | LEGACY |
| BACKEND | `NODE_ENV` | REQUIRED |
| BACKEND | `PORT` | REQUIRED |
| BACKEND | `LOG_LEVEL` | OPTIONAL |
| BACKEND | `BODY_LIMIT` | OPTIONAL |
| BACKEND | `LOCAL_STORAGE_DIR` | REQUIRED |
| BACKEND | `AI_SERVICE_URL` | REQUIRED |
| BACKEND | `AI_SERVICE_TOKEN` | REQUIRED |
| BACKEND | `BRIDGE_SHARED_SECRET` | LEGACY |
| BACKEND | `INITIAL_REVIEW_AI` | OPTIONAL |
| BACKEND | `CONTEXT_SOURCE_MAX_BYTES` | OPTIONAL |
| BACKEND | `CONTEXT_WEB_MAX_BYTES` | OPTIONAL |
| BACKEND | `CONTEXT_WEB_TIMEOUT_MS` | OPTIONAL |
| BACKEND | `CONTEXT_WEB_MAX_REDIRECTS` | OPTIONAL |
| BACKEND | `SMTP_HOST` | OPTIONAL |
| BACKEND | `SMTP_PORT` | OPTIONAL |
| BACKEND | `SMTP_SECURE` | OPTIONAL |
| BACKEND | `SMTP_USER` | OPTIONAL |
| BACKEND | `SMTP_PASS` | OPTIONAL |
| BACKEND | `PILOT_LEAD_NOTIFY_FROM` | OPTIONAL |
| BACKEND | `PILOT_LEAD_NOTIFY_TO` | OPTIONAL |
| AI_SERVICE | `OPENROUTER_API_KEY` | REQUIRED |
| AI_SERVICE | `OPENROUTER_MODEL` | OPTIONAL |
| AI_SERVICE | `OPENROUTER_BASE_URL` | OPTIONAL |
| AI_SERVICE | `ENVIRONMENT` | REQUIRED |
| AI_SERVICE | `LOG_LEVEL` | OPTIONAL |
| AI_SERVICE | `MAX_COST_PER_REQUEST_USD` | OPTIONAL |
| AI_SERVICE | `MAX_COST_PER_PROJECT_DAY_USD` | OPTIONAL |
| AI_SERVICE | `EVAL_COST_CAP_USD` | OPTIONAL |
| AI_SERVICE | `AI_SERVICE_INTERNAL_TOKEN` | REQUIRED |
| AI_SERVICE | `BACKEND_WEBHOOK_URL` | OPTIONAL |
| AI_SERVICE | `BACKEND_WEBHOOK_TOKEN` | OPTIONAL |
| AI_SERVICE | `BACKEND_WEBHOOK_TIMEOUT_SEC` | OPTIONAL |
| AI_SERVICE | `PDF_EXTRACT_COST_CAP_USD` | OPTIONAL |
| AI_SERVICE | `PDF_EXTRACT_STUB` | OPTIONAL |
| DATABASE | `DATABASE_URL` | REQUIRED |
| DATABASE | `POSTGRES_DB` | OPTIONAL |
| DATABASE | `POSTGRES_USER` | OPTIONAL |
| DATABASE | `POSTGRES_PASSWORD` | REQUIRED if using compose-managed DB |
| DATABASE | `PGVECTOR_DB` | LEGACY |
| DATABASE | `PGVECTOR_USER` | LEGACY |
| DATABASE | `PGVECTOR_PASSWORD` | LEGACY |
| AUTH | `JWT_SECRET` | REQUIRED |
| AUTH | `JWT_EXPIRES_IN` | OPTIONAL |
| AUTH | `JWT_REFRESH_EXPIRES_IN` | OPTIONAL |
| AUTH | `JWT_REFRESH_SECRET` | LEGACY |
| AUTH | `GOOGLE_CLIENT_ID` | OPTIONAL |
| OBSERVABILITY | `LANGSMITH_API_KEY` | OPTIONAL |
| OBSERVABILITY | `LANGSMITH_PROJECT` | OPTIONAL |
| OBSERVABILITY | `LANGSMITH_TRACING` | OPTIONAL |
| EXTERNAL_SERVICES | `CORS_ORIGIN` | REQUIRED for split-origin |
| EXTERNAL_SERVICES | `S3_BUCKET` | LEGACY |
| EXTERNAL_SERVICES | `S3_REGION` | LEGACY |
| EXTERNAL_SERVICES | `S3_ACCESS_KEY` | LEGACY |
| EXTERNAL_SERVICES | `S3_SECRET_KEY` | LEGACY |
| EXTERNAL_SERVICES | `AI_API_KEY` | LEGACY |

No values are documented here. Provider-side values must be copied through the provider secret manager.

## 9. Secrets Handling

- Never commit `.env`, `.env.local`, provider secrets, database dumps, or tokens.
- Use provider secret stores for `DATABASE_URL`, `JWT_SECRET`, `AI_SERVICE_TOKEN`, `OPENROUTER_API_KEY`, SMTP credentials, and webhook tokens.
- Rotate default/dev secrets before production.
- Ensure backend and AI service shared-token names agree before cutover.

## 10. CORS/Domain Config

Same-origin target:

- Frontend serves `/api/*` through nginx proxy.
- `VITE_API_URL=/api/v1`.
- CORS pressure is minimal because browser requests are same-origin.

Split-origin target:

- `VITE_API_URL` must point to the production backend API base.
- `CORS_ORIGIN` must include the production frontend origin.
- Auth redirects/OAuth origins must include production domains.

Public URLs and API URLs are `UNKNOWN` from the repo and must be confirmed in the deployment provider.

## 11. Smoke Tests

Staging/production-candidate acceptance criteria:

- Landing nueva visible.
- Portfolio Entry visible.
- No "Crear pre proyecto" as Portfolio Lead journey.
- Clarification works.
- Handoff works.
- Auth works.
- Portfolio continuation works.
- Portfolio Home loads.
- `/public/draft/:id/edit` is not reached for Portfolio Lead.
- `/projects/:id` is not reached for Portfolio Lead.
- `/step/0` is not reached for Portfolio Lead.
- DB migrations pass.
- Backend health passes.
- Frontend loads.
- AI service health/reachability passes.

Targeted local/CI commands:

```sh
cd front
npm run typecheck
npm run build
npm run test:backend -- --runInBand
npm run test:e2e -- e2e/portfolio-entry-conversion.spec.ts
```

Use the exact supported test runner flags for the environment; do not run the full legacy E2E suite as a production cutover gate unless the accepted test debt has first been isolated.

## 12. Rollback

Application rollback:

1. Repoint deployment provider back to the previous repository/commit or redeploy the previous production artifact.
2. Keep DNS unchanged until staging/prod-candidate smoke passes.
3. If DNS was changed in a later task, revert DNS to the previous deployment target.

Database rollback:

1. Prefer restoring from the verified pre-deploy backup if data/schema incompatibility is detected immediately.
2. If live writes occurred after cutover, decide between restore, forward-fix migration, or manual reconciliation with product owner approval.
3. Do not invent down migrations when the repo does not provide them.

AI/backend rollback:

1. Preserve old AI service and backend env vars until post-deploy acceptance passes.
2. Roll back backend and AI service together if shared-token or webhook compatibility fails.

## 13. Acceptance Criteria

Cutover can be considered ready only when:

- PR #6 is merged to `main`.
- Target `main` contains `front/`, `backend/`, `ai-service/`, Prisma schema/migrations, tests, CI, and canonical authority/docs.
- CI is green on the merged state or equivalent post-merge run.
- Post-merge smoke passes locally or in CI for typecheck, build, targeted Portfolio Entry tests, and targeted Portfolio Entry browser smoke.
- Deployment provider has been identified and configured to use `DarkCodePE/harness-starteria` `main`.
- Staging/production-candidate smoke meets all criteria in section 11.
- Secrets are configured in the provider, not committed.
- Database backup exists and migration status is understood.
- Rollback owner and procedure are acknowledged.

## 14. Known Test Debt

Accepted for this migration:

- Full browser E2E remains `21 passed / 20 failed / 4 skipped/not run`.
- The same `20` failures reproduce on source commit `17b57a6e3dcf2d6d4b43571013427edb6c21ee22`.
- Migration regressions found: `0`.
- Remaining migration blockers: `0`.

Treatment after cutover:

- Move Step0/Adaptive Core/Initiative Entry specs into the correct current suite.
- Deprecate or update PublicDraft/PDF expectations that conflict with the active Portfolio Entry contract.
- Repair Portfolio challenge/auth/role E2E debt as product hardening, not repository migration work.

Deploy switch verdict for this task:

`NOT_READY_TO_SWITCH_DEPLOY`

Reason: provider, current production project settings, public URLs, runtime secrets, and production database endpoint are not discoverable from this repository. The repository merge can proceed, but the actual provider switch must be performed by a human with deployment-provider access after staging/production-candidate smoke.
