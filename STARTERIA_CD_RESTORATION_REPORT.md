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

> Superseded in part by section 12 (2026-09-17): the manual-only trigger described
> below was replaced by push-to-main plus a required-reviewer gate on the
> `production` environment.

- Manual `workflow_dispatch` only; no push or tag deployment trigger.
- The operator supplies a full `source_sha`. The build checks that it belongs to main history. This permits a PR merge followed by deployment of the requested pre-merge product commit `9b70f3889047179c3727394ef89eb4b589939344`.
- CI remains the gate. Images use only `main-<7-character source SHA>` tags; `latest` is not pushed. The first tag is `main-9b70f38`.
- The workflow now syncs `starteria-db-secrets` and `PORTFOLIO_ENTRY_API_KEY`, required by the target database manifest and live Portfolio Entry backend mode. It URL-encodes the DB password for `DATABASE_URL`.
- Preflight checks existing database, deployments, and Cloudflare token before mutation, verifies the supplied DB password matches the live Kubernetes Secret, and records each live image. Image-substituted manifests avoid an intermediate rollout to hard-coded or `latest` images. On rollout failure, the workflow restores the three captured image references and waits again.
- No Prisma command runs. Schema readiness, backup, and compatibility must be confirmed by the operator before the first release. Automatic image restore does not reverse database, secret, or manifest changes.

## 5. Secret checklist

> Superseded by section 13 (2026-09-17): 13 of 17 are now configured from live
> cluster values. The `UNKNOWN` column below records what was verifiable then.

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

> Superseded by section 12 (2026-09-17). Four of the five preconditions listed
> here are still unmet; read section 12 for what enforces them now.

Keep automatic deployment disabled. Consider `push: branches: [main]` only after a successful manual release, complete smoke evidence, verified secrets, a documented database migration/backup process, and a reviewed way to guarantee CI tests the same source revision that is deployed. This task does not enable it.

## 11. Legacy CD failure diagnosis (2026-09-17)

Section 1 attributed the gap to the migration omitting `cd.yml`. That is true but
incomplete: the legacy pipeline in `nmindFa/Dashboardstarteria` was itself already broken.

Its last six CD runs failed, all at the same step. Run `34356710664` (2026-09-09, push to
`main`) shows the CI gate green, all three `Build & push` jobs failing in 17-20 seconds at
`Log in to Docker Hub`, and `Deploy to Rackspace Spot` never starting:

```
##[error]Error response from daemon: Get "https://registry-1.docker.io/v2/":
         unauthorized: personal access token is expired
```

The last successful legacy deploy was run `33014322053` (2026-08-26). The `deploy` job has
not executed since. This is the mechanical reason `STARTERIA_PRODUCTION_DEPLOYMENT_AUDIT_VD04.md`
found VD-04 absent from the public URL: production has been frozen since 2026-08-26, and no
Rackspace or cluster fault is implicated. Rackspace connectivity is therefore unproven since
that date, not known-broken.

The legacy repository still holds all 17 Actions secrets and its `cd.yml` still triggers on
`push: main` against the same cluster and the same `starteria` namespace. Renewing its Docker
Hub token there would revive a second pipeline writing to the same production. It must be
disabled once this repository has completed one verified release.

## 12. Automatic deployment enabled with a human gate (2026-09-17)

This supersedes section 4's "manual `workflow_dispatch` only", section 7 step 3's "do not
enable automatic main deployment", and section 10.

`cd.yml` now triggers on `push` to `main`, on `push` of a `vX.Y.Z` tag, and on
`workflow_dispatch` for redeploy/rollback. What became automatic is the build and the push to
Docker Hub. The production rollout did **not**: the `deploy` job keeps `environment: production`
and that environment carries required reviewers, so no rollout starts until a person approves it.

Section 10 listed five preconditions. Four are still unmet, and the gate is what stands in for
them:

| Section 10 precondition | Status |
| --- | --- |
| A successful manual release | NOT met — no release has run from this repository |
| Complete smoke evidence | NOT met |
| Verified secrets | NOT met — 10 of the 12 required secrets are absent; `cd.yml`'s credential check fails the run before any mutation |
| Documented database migration/backup process | NOT met — the `db push` vs `migrate deploy` conflict in section 9 is unresolved |
| CI tests the same revision that is deployed | Partially met — see below |

Enabling the trigger does not assert those preconditions are satisfied. It moves who enforces
them from the trigger to the approver, who now reads the resolved commit, tag and channel in the
run summary before approving. Until the secrets are configured, the pipeline still cannot reach
production at all.

Changes made:

- New `resolve` job is the single source of truth for which commit ships under which tag. It
  runs once, before the CI gate and before three parallel builds, and exposes `sha`, `tag` and
  `channel` as outputs. This removes the step that was duplicated in `build-and-push` and
  `deploy`, where two copies of the same derivation could diverge.
- The ref guard is now a closed allowlist over `event:ref` covering the three entry points. The
  previous `$GITHUB_REF == refs/heads/main` check would have rejected every tag push.
- The ancestry check is re-anchored on `origin/main` instead of the event's own `HEAD`, where it
  was a tautology. It now rejects a tag cut on a branch never merged to `main`.
- Image tag: a semver tag ships under its own name; everything else ships as `main-<7sha>`.
- Section 9's last bullet is partially addressed. Both `push` paths are now correct by
  construction. A `workflow_dispatch` with an explicit `source_sha` still has the CI gate test
  the caller's revision rather than the target, because a reusable workflow checks out the
  calling event's SHA. Closing it needs a `ref` input on `ci.yml`.
- Schema is still untouched. No Prisma command runs in CD.
- The image substitution in the rollout step no longer hardcodes `orlandogtp` on the left side of
  the `sed` while writing `$DOCKERHUB_NAMESPACE` on the right. A manifest pointing at a different
  registry made the substitution silently no-op, so `apply` would ship the manifest's old image
  and `set image` would correct it moments later — the intermediate rollout the step's own
  comment says to avoid. The pattern now matches any registry and the step fails loudly if no
  substitution occurred.

Two workflows omitted by the migration were also restored from the legacy repository:
`db-maintenance.yml` and `db-adaptive-cycle-readonly.yml`. Both are `workflow_dispatch` only and
self-contained, with no checkout and no repository files. The readonly audit verifies the
invariants established by
`front/prisma/production-hotfixes/20260825_adaptive_cycle_backfill_before_db_push.sql`, which
makes it the correct instrument for diagnosing the section 9 schema conflict before any schema
change is attempted.

Not versionable, and required for the gate to exist: the `production` environment must be
created with required reviewers. Without them, `environment: production` is a label, not a gate.
`main` also has no branch protection, so a direct push reaches the gate; the CI gate still runs
against it, but the approval becomes the only review.

## 13. Live cluster observations (2026-09-17)

Read directly from the Rackspace Spot cluster with an operator-supplied kubeconfig,
read-only. These supersede several "UNKNOWN" entries in section 5, section 9, and in
`STARTERIA_PRODUCTION_DEPLOYMENT_AUDIT_VD04.md`.

**Production already deploys from this repository.** The running images are
`orlandogtp/starteria-backend:main-0b749d4`, `orlandogtp/starteria-frontend:main-e43e8a7`
and `orlandogtp/starteria-ai-service:main-e43e8a7`. Both SHAs belong to
`DarkCodePE/harness-starteria` history, not to the legacy repository. The pods were created
on 2026-09-16, and no CI run produced them, so they were built and rolled out by hand. The
VD-04 audit's central unknown — which repository the public URL deploys from — is answered:
this one, manually.

**`secret/starteria-db-secrets` does not exist in the cluster.** The preflight required it,
so the first CD run would have aborted at that step. It aborted safely, before any mutation,
but it was a hard block that no document recorded. The preflight now reads the password from
the Secret when present and falls back to the StatefulSet's own env, which is where the live
value actually is.

**`k8s/postgres-statefulset.yaml` has drifted from the cluster.** The manifest declares
`POSTGRES_PASSWORD` via `secretKeyRef: starteria-db-secrets`; the live StatefulSet carries it
as an inline literal. A server-side dry-run confirmed that applying the manifest changes the
pod template, which restarts production Postgres. The database manifests were therefore
removed from the CD apply list: an application deploy pipeline should not redeploy the
database. The StatefulSet stays managed deliberately and out of band.

**The live database password is present in this repository's git history**, in commits
`54dae5d`, `27851f6` and `7fe8b56` — including one whose subject is removing it from the
working tree. Removing a secret from files does not remove it from history. It requires
rotation, which means `ALTER USER` inside Postgres, updating `starteria-backend-secrets`, and
restarting the backend. That is a separate maintenance operation, not part of this change.

**Four secrets would have been blanked by the first successful deploy.** `SMTP_HOST`,
`SMTP_USER`, `SMTP_PASS` and `PILOT_LEAD_NOTIFY_FROM` hold real values in production and
appear in the Secret's `last-applied-configuration`, so `apply` owns them. The workflow writes
them as `"${VAR:-}"`, which with the GitHub secrets absent resolves to the empty string.
The same applied to `LANGSMITH_API_KEY` on the AI service Secret. All five have since been
loaded into GitHub from the live values, so the next deploy is a no-op on them.

**Three Portfolio Entry configuration keys existed only in the cluster.**
`PORTFOLIO_ENTRY_PROVIDER=openai_responses`, `PORTFOLIO_ENTRY_MODEL=openai/gpt-5.6-luna` and
`PORTFOLIO_ENTRY_BASE_URL=https://openrouter.ai/api/v1` were added by `kubectl patch` and are
absent from `last-applied-configuration`, so `apply` would have preserved them — they were not
at risk of deletion. But they had no source of truth outside the running cluster: recreating
the Secret would have lost them silently. They are now written by the workflow as literals.
The workflow now writes all 14 keys the live Secret carries.

**Secrets status.** Thirteen of the seventeen are configured, all taken from live cluster
values so that the first deploy does not change production configuration. Still missing, and
not derivable from a kubeconfig: `RACKSPACE_REFRESH_TOKEN`, `RACKSPACE_ORG_NAME` and
`RACKSPACE_CLOUDSPACE_NAME`. The kubeconfig supplied for this inspection carried a 72-hour
OIDC `id_token`, not the refresh token the workflow posts to `generate-kubeconfig`; those three
come from Spot Console → API Access → Terraform.

Section 5 listed every secret as `UNKNOWN` because the GitHub API reported none. That is no
longer the state, but the entries there were never wrong: they recorded what could be verified
at the time.

## 14. Rackspace Spot credentials resolved and deploy path verified (2026-09-17)

All twelve required secrets and all five optional ones are now configured. The three
Rackspace values were determined empirically against the live API, because the operator's
kubeconfig does not contain them:

| Field in the `generate-kubeconfig` payload | Value | How it was established |
| --- | --- | --- |
| `organization_name` | `starteria` | Probed against the API; `org_v7e2C0j3gJ96GeGt` (the JWT's `org_id`) and `okuanbecerra-48` both returned HTTP 404 "failed to find organization by name" |
| `cloudspace_name` | `okuanbecerra-48` | Spot Console, Manage → Overview |
| `refresh_token` | (in GitHub secrets) | Spot Console → API Access → Terraform, created 2026-05-28 |

Section 2's comment describing the cloudspace as "the `hcp-...` one" is wrong and cost time.
`hcp-34be98c0-890e-47a9-b5e9-cb2466094274.spot.rackspace.com` is the API endpoint hostname;
the Console labels it as such. The cloudspace name is `okuanbecerra-48`.

**The deploy path was then verified end to end against the live cluster**, without deploying:

- `generate-kubeconfig` returns HTTP 200 and a usable kubeconfig with those three values.
- The preflight passes all three of its checks, including the new fallback that reads the
  database password from the StatefulSet's env because `secret/starteria-db-secrets` is absent.
- The previous-image capture that the rollback path depends on returns all three live images.
- Applying the four Service manifests reports `unchanged` — the reduced apply list is a no-op.
- Applying the three Deployment manifests through the image substitution, pinned to the
  currently running tags, reports no difference for `frontend` and `ai-service`. For `backend`
  the only change is adding `PORTFOLIO_ENTRY_RUNTIME_MODE=live`, which is behaviourally inert:
  `backend/config/index.ts:10` already defaults that variable to `live` when unset. The first
  release therefore changes production images and nothing else.

Two notes for the operator:

The Spot Console reports this cloudspace's control plane as **Non-production**, with no
failover protection, on a single node with 2 vCPU and 4 GB. That is the cluster serving
`starter-ia.com`.

The refresh token is shared with `nmindFa/Dashboardstarteria`, which holds the same value.
Rotating it disables the legacy pipeline as a side effect. Since section 11 calls for
disabling that pipeline once this repository completes a verified release, rotating the token
after that release accomplishes both at once.
