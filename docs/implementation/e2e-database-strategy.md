# E2E And Pilot Dry-run Database Strategy

## Database Ownership

| Command area | Database URL variable | Default database | Purpose |
| --- | --- | --- | --- |
| Development | `DATABASE_URL` | `starteria_db` | Local app development only |
| E2E | `E2E_DATABASE_URL` | `starteria_e2e` | Disposable Playwright validation |
| E2E admin | `E2E_DATABASE_ADMIN_URL` | `postgres` | Create/drop only disposable DBs |
| Pilot dry run | `PILOT_DRY_RUN_DATABASE_URL` | `starteria_pilot_dry_run` | Internal dry run |
| Pilot report | `PILOT_REPORT_DATABASE_URL` | `starteria_pilot_dry_run` | Read-only reporting |

## Safety Rules

Provisioning scripts refuse to operate on:

- `postgres`
- `template0`
- `template1`
- `starteria_db`
- any database not in the disposable allowlist

Allowed disposable databases:

- `starteria_e2e`
- `starteria_pilot_dry_run`

## E2E Flow

```text
validate config
-> start isolated PostgreSQL using docker-compose.e2e.yml
-> recreate starteria_e2e
-> prisma migrate deploy
-> prisma migrate status
-> seed.e2e.ts
-> backend
-> health/readiness
-> frontend
-> Playwright
-> stop owned processes
-> docker compose -p starteria-e2e down
```

Default runtime ports:

- PostgreSQL: `55433`
- Backend: `4100`
- Frontend: `5176`

The Vite dev proxy sends `/api` to `VITE_BACKEND_PROXY_TARGET`, defaulting to the E2E backend URL in the runner.

Use `E2E_SKIP_DOCKER=true` to use an existing PostgreSQL server. The runner still uses only `E2E_DATABASE_URL`.

Use `E2E_KEEP_DATABASE=true` to preserve the disposable database for diagnosis.

Use `E2E_KEEP_DOCKER=true` to preserve the isolated Docker container.

## Dry-run Flow

```text
starteria_pilot_dry_run empty
-> prisma migrate deploy
-> prisma migrate status
-> seed.pilot-dry-run.ts
-> backend/frontend with COPILOT_ALLOWED_ORGANIZATION_IDS=org-pilot-dry-run
-> smoke
-> report preflight
-> report
```

## Commands

```bash
npm run db:e2e:provision
npm run db:e2e:migrate
npm run db:e2e:seed
npm run db:e2e:status
npm run db:pilot:provision
npm run db:pilot:migrate
npm run db:pilot:seed
npm run db:pilot:status
npm run test:e2e
npm run smoke:copilot
npm run pilot:report:preflight
npm run pilot:report -- --from=YYYY-MM-DD --to=YYYY-MM-DD
```

Do not use `prisma db push` as a substitute for `migrate deploy`.

Do not run `npm run build` and `npm run build:backend` simultaneously while both share `front/dist`.

## Current Validation

As of the latest local run:

- `db:e2e:provision`: passes from an empty `starteria_e2e`.
- `db:e2e:status`: reports `Database schema is up to date!`.
- Targeted Copilot E2E: passes with real frontend, backend, PostgreSQL, migrations, approval, execution, refresh and replay.
- Full `test:e2e`: still NO-GO due timeout outside the Copilot vertical.
