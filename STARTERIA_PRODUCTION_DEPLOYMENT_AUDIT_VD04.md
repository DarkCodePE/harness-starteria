# Starteria production deployment audit — VD-04

**Audit date:** 2026-09-17  
**Source repository:** `DarkCodePE/harness-starteria`  
**Source branch:** `main`  
**Exact source commit:** `9b70f3889047179c3727394ef89eb4b589939344`  
**Public URL tested:** `https://starter-ia.com/`  
**Release status:** BLOCKED before image build and rollout; no production change made.

## 1. Source and production truth

The fetched `main` ends in merge PR #27 (`9b70f38`), following VD-04 PR #26 (`0f3cade`) and the DS-01 through DS-08 work. The isolated worktree was clean before validation. The existing unrelated, dirty checkout was not used for a build.

The running production image and deployment source are **UNKNOWN**. No Kubernetes context is configured on this machine, and no Cloudflare dashboard, Rackspace Spot or Docker Hub deployment credentials were available for inspection. The checked-in manifests are desired-state examples, not proof of live pod state:

| Service | Checked-in image | Running image |
| --- | --- | --- |
| frontend | `orlandogtp/starteria-frontend:v2.0.9` | UNKNOWN |
| backend | `orlandogtp/starteria-backend:v2.0.2` | UNKNOWN |
| ai-service | `orlandogtp/starteria-ai-service:latest` placeholder | UNKNOWN |

The configured image registry in the manifests and historical CD workflow is Docker Hub under `orlandogtp`. The actual registry and digest of the running pods are **UNKNOWN**. No image digest was obtained.

The public URL responds through Cloudflare. The checked-in `cloudflared-deployment.yaml` uses a remotely managed tunnel token, and `k8s/nginx.conf` proxies `/api/` to `starteria-backend:3001`. The Cloudflare dashboard's current DNS, tunnel target and origin configuration could not be inspected. Whether this URL still deploys from `nmindFa/Dashboardstarteria` or from `DarkCodePE/harness-starteria` is **UNKNOWN**. `STARTERIA_DEPLOY_CUTOVER_PLAN.md` names the former as current and the latter as target, but it is a plan, not evidence that the switch occurred.

## 2. Deployment mechanism and missing CD

`DarkCodePE/harness-starteria` `main` contains only `.github/workflows/ci.yml`. It runs for pull requests and as a reusable workflow; it has no standalone `push: main` deployment trigger. Therefore this repository does **not** automatically deploy `main` through its checked-in GitHub Actions workflows.

The CI comment claiming `cd.yml` deploys every push is stale. Commit `5ba4fcf` migrated `.github/workflows/ci.yml` but did not add `cd.yml`. The old `nmindFa/Dashboardstarteria` repository has a `cd.yml` that was designed to build `main-<shortsha>` images in Docker Hub and deploy to Rackspace Spot after CI. Why it was omitted from the target repository is **UNKNOWN**; the migration omission is factual, while intent is unverified. The checked-in `k8s/deploy.sh` is a manual full-stack script, not an observed production release mechanism.

The most specific established image convention visible in the old CD workflow is `orlandogtp/starteria-frontend:main-<shortsha>`. A suitable **planned, unbuilt** target for this source is `orlandogtp/starteria-frontend:main-9b70f38`, preferably deployed by digest after push. This tag and digest do not currently exist as an artifact of this audit.

## 3. Evidence that public frontend is behind this main

`GET /` returned 200 and served `/assets/index-dwXL6XtA.js` with an HTML `Last-Modified` value of 2026-09-16 16:38:02 GMT. A browser check of the current public page found no landing textarea and no VD-04 section `Del texto a la estructura`. The exact `main` source contains that section and a real landing textarea; its local build emitted `/assets/index-COtW7Lev.js` and includes the VD-04 phrase. **VD-04 is not visible at the public URL.** This establishes that the visible frontend is behind the requested source, but does not identify the running image tag, digest or source repository.

## 4. Pre-deploy validation of exact main

| Gate | Result |
| --- | --- |
| Isolated source worktree clean | PASS before audit file creation |
| Fetched `main` SHA recorded | PASS: `9b70f3889047179c3727394ef89eb4b589939344` |
| `npm ci` from lockfile | PASS |
| Frontend `npm run build` | PASS; VD-04 phrase present in built bundle |
| `npm run typecheck` | PASS after `npm run db:generate` (generation only; no migration) |
| `npm run lint` | PASS: baseline lint |
| Relevant public-entry unit tests | PASS: 20 tests across Portfolio Entry experience, public service and auth claim |
| `docker build -f Dockerfile.frontend` | NOT RUN: Docker daemon unavailable |
| Built container image contains VD-04 | UNKNOWN: no container image built |

The build emitted bundle size and mixed static/dynamic import warnings, without failing. The initial typecheck failure was caused by the ungenerated Prisma client after `npm ci`; generating the client from the unchanged schema resolved it.

## 5. Actions executed and rollout result

Fetched `main`, created an isolated worktree, inspected CI/CD, Dockerfiles, Kubernetes manifests, cutover plan and public routing evidence, installed locked dependencies, ran the gates above, and inspected the public URL. **No image was built or pushed. No Kubernetes resource was changed. No backend, database or AI service was redeployed.**

Rollout result: **NOT STARTED**. A rollout would be unsafe without a verified current deployment, registry credentials, a working image builder, cluster access and a known rollback image. `kubectl config current-context` reports no context; `docker info` reports no daemon.

## 6. Current public baseline smoke (not post-rollout)

| Check | Current result |
| --- | --- |
| `GET /` | 200 |
| VD-04 landing visible | NO |
| Real textarea in first fold | NO; no textarea on `/` |
| `Analizar mi situación` CTA | Present (three matching buttons in DOM) |
| `/public/start` | 200; one textarea |
| Conversation-first VD-04 composition | NO on `/`; target release unverified |
| No early right-side analytical preview | NOT VERIFIED visually in this audit |
| Entry submission and handoff | NOT REPEATED in this deployment audit; prior Portfolio Entry live audit recorded a passing production flow on 2026-09-16 |
| `GET /api/health` | 200 |

## 7. Exact action required to release VD-04

1. An authorized operator verifies the live `starteria-frontend`, `starteria-backend` and `starteria-ai-service` deployments, image IDs/digests and rollout history in namespace `starteria`, plus the Cloudflare tunnel target and the repository actually driving releases.
2. From a clean checkout of commit `9b70f3889047179c3727394ef89eb4b589939344`, build `Dockerfile.frontend` with the established frontend build arguments; inspect the resulting image for the VD-04 landing. Do not build from this audit worktree after adding the report.
3. Push an immutable image to the existing Docker Hub repository, for example `orlandogtp/starteria-frontend:main-9b70f38`. Record its registry digest and the source SHA.
4. Use the established authorized production method to set only `deployment/starteria-frontend` to that immutable digest. Wait for `kubectl rollout status deployment/starteria-frontend -n starteria`; verify ready replica, new pod image ID, old pod replacement and no pull/crash loops.
5. Run browser smoke against `https://starter-ia.com/`: VD-04 section, first-fold textarea and CTA, `/public/start`, existing public entry submit through handoff, no early analytical preview, and `/api/health`. Record the previous image digest for rollback.

No new CD workflow should be created as part of this release. Separately decide whether to restore the old repository's `cd.yml` in the target repository, adapt its secrets/permissions and frontend-only release path, or document an external/manual production authority. Remove or correct the stale `ci.yml` comment once that decision is made. The cutover plan should then be updated with observed production ownership and an image/digest ledger.
