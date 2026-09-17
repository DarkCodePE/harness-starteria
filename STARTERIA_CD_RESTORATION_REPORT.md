# Starteria CD restoration report

Status: deployment automation prepared for a manual first release. Production has not been deployed or verified by this change.

## 1. Root cause

The migration to `DarkCodePE/harness-starteria` omitted `.github/workflows/cd.yml`. Target `main` at `9b70f3889047179c3727394ef89eb4b589939344` has CI but no CD trigger. The legacy source is `nmindFa/Dashboardstarteria`, `origin/main:.github/workflows/cd.yml`. No target workflow could build, push, or roll out current `main`.

## 2. Legacy CD architecture

Legacy CD triggered on main pushes, semver tags, or manual tag input. It reused CI, built backend/frontend/AI images, pushed `orlandogtp/starteria-{backend,frontend,ai-service}` to Docker Hub, obtained kubeconfig from Rackspace Spot, synced backend and AI secrets, applied manifests in namespace `starteria`, ran an Adaptive Cycle SQL backfill plus `prisma db push`, set images, waited for rollout, and called `rollout undo` on failure. Its comments mentioning GHCR were stale: the actual login and tags used Docker Hub.

## 3. Current target architecture and comparison

| Item | Finding |
| --- | --- |
| CI | `.github/workflows/ci.yml` has `workflow_call` and an aggregate `summary` that fails if Node, Python, build, or Portfolio Entry browser smoke fails. The stale comment claiming automatic CD has been corrected. |
| Docker contexts | Backend and frontend use repository root with `Dockerfile.backend` and `Dockerfile.frontend`; AI uses `./ai-service` with `./ai-service/Dockerfile`. All exist at target commit. |
| Images | Manifests use Docker Hub namespace `orlandogtp` and names `starteria-backend`, `starteria-frontend`, `starteria-ai-service`. No GHCR migration is supported by current manifests. |
| Namespace and cluster | Manifests use `starteria`. Rackspace Spot endpoint and request fields remain the legacy integration; live API/cluster access has not been tested. |
| Database | `starteria-db` StatefulSet reads `starteria-db-secrets/POSTGRES_PASSWORD`. Legacy CD did not create this secret. Target cutover plan recommends reviewed migration and backup, while legacy production used `db push`. Their operational advice conflicts; no schema command runs in restored CD. |
| Cloudflare | `cloudflared-token` is provisioned outside the workflow. CD checks it exists and does not print or recreate it. |
| Repository references | Runtime image paths and Rackspace request contain no old repo URL. Historical docs may retain the old repo as provenance. |

The target `STARTERIA_DEPLOY_CUTOVER_PLAN.md` still records the provider as unknown and the switch as not ready. The legacy workflow and current Kubernetes files provide stronger factual evidence for the workflow topology, but production configuration and database state still need operator confirmation. This report does not change product authority or schema policy.

## 4. Adaptations made

- Manual `workflow_dispatch` only; no push or tag deployment trigger.
- The operator supplies a full `source_sha`. The build checks that it belongs to main history. This permits a PR merge followed by deployment of the requested pre-merge product commit `9b70f3889047179c3727394ef89eb4b589939344`.
- CI remains the gate. Images use only `main-<7-character source SHA>` tags; `latest` is not pushed. The first tag is `main-9b70f38`.
- The workflow now syncs `starteria-db-secrets` and `PORTFOLIO_ENTRY_API_KEY`, required by the target database manifest and live Portfolio Entry backend mode. It URL-encodes the DB password for `DATABASE_URL`.
- Preflight checks existing database, deployments, and Cloudflare token before mutation, verifies the supplied DB password matches the live Kubernetes Secret, and records each live image. Image-substituted manifests avoid an intermediate rollout to hard-coded or `latest` images. On rollout failure, the workflow restores the three captured image references and waits again.
- No Prisma command runs. Schema readiness, backup, and compatibility must be confirmed by the operator before the first release. Automatic image restore does not reverse database, secret, or manifest changes.

## 5. Secret checklist

GitHub API returned zero repository-level Actions secrets and zero environments for `DarkCodePE/harness-starteria` during this audit. Organization-level secret listing returned 404, so effective availability is **UNKNOWN** for every item. `AVAILABLE` is intentionally not asserted. Required means required by the restored workflow or by its intended production behavior.

| SECRET_NAME | REQUIRED | PURPOSE | PRESENT_STATUS |
| --- | --- | --- | --- |
| `DOCKERHUB_USERNAME` | Yes | Docker Hub login | UNKNOWN |
| `DOCKERHUB_TOKEN` | Yes | Docker Hub push credential | UNKNOWN |
| `RACKSPACE_REFRESH_TOKEN` | Yes | Spot kubeconfig request | UNKNOWN |
| `RACKSPACE_ORG_NAME` | Yes | Spot organization | UNKNOWN |
| `RACKSPACE_CLOUDSPACE_NAME` | Yes | Spot cloudspace | UNKNOWN |
| `STARTERIA_JWT_SECRET` | Yes | Backend JWT signing | UNKNOWN |
| `STARTERIA_DB_PASSWORD` | Yes | PostgreSQL and backend connection | UNKNOWN |
| `STARTERIA_AI_SERVICE_TOKEN` | Yes | Backend/AI internal authentication | UNKNOWN |
| `STARTERIA_BRIDGE_SHARED_SECRET` | Yes | Legacy bridge compatibility | UNKNOWN |
| `OPENROUTER_API_KEY` | Yes | AI service provider key | UNKNOWN |
| `PORTFOLIO_ENTRY_API_KEY` | Yes | Live Portfolio Entry backend adapter | UNKNOWN |
| `GOOGLE_CLIENT_ID` | Yes | Existing Google sign-in build/server configuration | UNKNOWN |
| `LANGSMITH_API_KEY` | No | Optional tracing | UNKNOWN |
| `STARTERIA_SMTP_HOST` | No | Optional outbound mail host | UNKNOWN |
| `STARTERIA_SMTP_USER` | No | Optional SMTP username | UNKNOWN |
| `STARTERIA_SMTP_PASS` | No | Optional SMTP password | UNKNOWN |
| `STARTERIA_PILOT_LEAD_NOTIFY_FROM` | No | Optional notification sender | UNKNOWN |

`cloudflared-token` is a required Kubernetes Secret, provisioned out of band; it is not a GitHub Actions secret in this workflow. If SMTP notifications are used, configure all four SMTP entries together. The workflow does not overwrite `SMTP_PORT`, `SMTP_SECURE`, or `PILOT_LEAD_NOTIFY_TO` because those are literal manifest values.

## 6. Workflow validation

PyYAML 6.0.3 parsed both workflows; a read-only validator passed the manual-only trigger, CI `workflow_call`, matrix contexts and Dockerfile locations, explicit manifest paths, Docker Hub image/container/deployment names, namespace, and SHA tag derivation. Static review checked rollout status and the failure branch that restores captured images. `git diff --check` passed. No local production deployment was run. GitHub Actions execution, credentials, Rackspace API response, Docker Hub access, current live deployments, and schema compatibility remain unverified until the first manual run.

## 7. First production release procedure

1. In `DarkCodePE/harness-starteria` → Settings → Secrets and variables → Actions, configure every required secret above. Confirm Docker Hub namespace access, Rackspace values, and the out-of-band `cloudflared-token` in namespace `starteria`. Create or review a `production` environment if approval protection is desired.
2. Take and verify a database backup; inspect current schema/migration status against commit `9b70f3889047179c3727394ef89eb4b589939344`. Resolve any required schema change through a separately reviewed procedure before this CD run.
3. Merge the CD PR only after its CI and review pass. Do not enable automatic main deployment.
4. Open repository Actions → **CD** → **Run workflow**. Select branch `main` and enter `source_sha` = `9b70f3889047179c3727394ef89eb4b589939344`.
5. Monitor the CI gate, three Docker builds and pushes, Rackspace preflight, secret sync, manifest apply, and all three rollout statuses. Confirm summary tag `main-9b70f38` and source commit.
6. Verify `kubectl -n starteria get deployments`, `kubectl -n starteria rollout status deployment/starteria-backend`, and equivalent frontend/AI statuses from an authorized runner/operator. Confirm all three deployed images have tag `main-9b70f38`.
7. Smoke test `https://starter-ia.com/`: homepage HTTP 200; VD-04 landing visible; hero has a real textarea; “Analizar mi situación” visible; platform structure cue visible; `/public/start` works; conversation-first layout remains. Confirm `https://starter-ia.com/api/health` returns HTTP 200. Record screenshots and response/status evidence.

## 8. Rollback procedure

On rollout failure, the workflow restores the three captured pre-release image references and waits for their rollout. If this fails, use the logged previous images with `kubectl -n starteria set image deployment/starteria-<service> <service>=<previous-image>` for each service, then `kubectl -n starteria rollout status deployment/starteria-<service>`. For post-rollout smoke failure, use the same manual image restoration. If the prior pod configuration or database changed, restore the reviewed prior manifests or use a reviewed database recovery/forward fix. Image rollback does not undo secrets or database changes. Keep the backup and incident evidence.

## 9. Remaining unknowns

- All effective Actions secret availability and the cloudflared Kubernetes secret require operator verification; repository-level Actions secrets list is empty.
- Rackspace API validity, cluster access, Docker Hub repository permissions, current live image references, and production database/schema compatibility are not verifiable from this checkout.
- The cutover plan's `migrate deploy` guidance conflicts with the legacy CD's `db push` production history. Resolve this before any database change. Restored CD does not mutate schema.
- A manually selected old source SHA is tested by CI at the workflow's main revision. The first PR changes deployment files only, so product code at the requested SHA is unchanged by the merge. Later releases should ensure the CI gate tests the exact deployed source revision.

## 10. Automatic deployment recommendation

Keep automatic deployment disabled. Consider `push: branches: [main]` only after a successful manual release, complete smoke evidence, verified secrets, a documented database migration/backup process, and a reviewed way to guarantee CI tests the same source revision that is deployed. This task does not enable it.
