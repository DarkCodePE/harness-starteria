# E2E Suite Stability Report

Status: stable in the local isolated E2E path.

## Strategy

The E2E runner provisions `starteria_e2e`, applies Prisma migrations from a clean database, seeds deterministic test users, starts the backend and frontend, runs Playwright, and cleans up its own processes.

Docker was not used in this run because the sandbox cannot access the Docker daemon. The validated path used `E2E_SKIP_DOCKER=true` with PostgreSQL already available on `localhost:55433`.

## Auth Strategy

The E2E seed now includes separate profiles:

| Profile | Email |
| --- | --- |
| Portfolio Lead authorized | `portfolio.e2e@starteria.test` |
| Unauthorized viewer | `viewer.e2e@starteria.test` |
| Other organization user | `other-org.e2e@starteria.test` |
| Admin / Steps user | `portfolio-admin.e2e@starteria.test` |

The root cause of the 401 was a stale hardcoded admin email in specs. The specs now read the deterministic E2E admin credentials.

## PDF Stability

Authenticated and public PDF E2E paths no longer depend on an unbounded wait for successful extraction. In E2E, `PDF_EXTRACTION_E2E_MODE=terminal-failed` returns a deterministic terminal state and the specs assert product-visible outcomes with bounded waits.

## Runner Lifecycle

The runner logs phases:

```text
[E2E] Wait for PostgreSQL
[E2E] Provision database
[E2E] Start backend
[E2E] Start frontend
[E2E] Run Playwright
```

The pilot dry-run runner uses separate ports:

| Service | Port |
| --- | --- |
| E2E backend | 4100 |
| E2E frontend | 5176 |
| Pilot dry-run backend | 4200 |
| Pilot dry-run frontend | 5186 |

## Latest Results

| Command | Result |
| --- | --- |
| `npm run test:e2e:all` | GO: 17 passed in 43.5s |
| `npm run test:e2e:copilot` | GO |
| `npm run test:e2e:steps` | GO |
| `npm run test:e2e:pdf` | GO |
| Port check after runs | No listeners observed on 4100, 4200, 5176, 5186 |

## Notes

The runner still emits Node DEP0190 warnings because Windows uses shell execution for `.cmd` scripts. This did not block the suite. The dry-run runner forces process exit after `--checks` so command execution returns cleanly after smoke and report complete.

