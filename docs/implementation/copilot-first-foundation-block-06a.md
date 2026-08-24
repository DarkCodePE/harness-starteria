# Copilot-first Foundation Block 06A

## Objective

Make migrations, E2E, smoke, pilot report and dry run reproducible without using `starteria_db` as a clean validation database.

## Diagnosis

`front/scripts/run-e2e.ts` previously selected:

```text
process.env.DATABASE_URL || postgresql://postgres:postgres@localhost:5433/starteria_db
```

It started the regular `postgres` service from `docker-compose.yml`, which uses the shared `pgdata` volume and `POSTGRES_DB=starteria_db`. It did not create a disposable database before running `prisma migrate deploy`. As a result, E2E inherited the local development database and failed with `P3005` when the schema was non-empty but Prisma migration history was not compatible.

`npm run smoke:copilot` required credentials but did not provision them.

`npm run pilot:report` used Prisma's default datasource and could read a database without Copilot tables, causing runtime failure on `ActionExecution`.

`npm run build` and `npm run build:backend` collide if run in parallel because Vite cleans `front/dist` while backend TypeScript writes `front/dist/backend`. They must run sequentially unless output directories are separated later.

## Decisions

- Keep `DATABASE_URL` for normal development and allow it to continue pointing to `starteria_db`.
- Use `E2E_DATABASE_URL` for E2E only.
- Use `PILOT_DRY_RUN_DATABASE_URL` for dry run only.
- Use `PILOT_REPORT_DATABASE_URL` for reports only; no silent fallback to `DATABASE_URL`.
- Start E2E PostgreSQL with `docker-compose.e2e.yml`, project `starteria-e2e`, no shared development volume.
- Default disposable DBs:
  - `starteria_e2e`
  - `starteria_pilot_dry_run`
- Never operate on `postgres`, `template0`, `template1` or `starteria_db`.

## Implemented

- `docker-compose.e2e.yml`
- `front/scripts/database/provision-e2e-database.ts`
- `front/scripts/database/provision-pilot-dry-run-database.ts`
- `front/scripts/database/test-database-utils.ts`
- `front/scripts/database/run-prisma-for-disposable-db.ts`
- `front/prisma/seed.e2e.ts`
- `front/prisma/seed.pilot-dry-run.ts`
- `front/prisma/migrations/20260728100000_add_missing_b2b_billing_tables_for_clean_migrations/migration.sql`
- E2E runner now provisions `starteria_e2e`.
- E2E runner uses dedicated defaults: backend `4100`, frontend `5176`, PostgreSQL `55433`.
- Vite proxy target is configurable through `VITE_BACKEND_PROXY_TARGET`.
- Frontend Portfolio Lead mapping can use `VITE_PORTFOLIO_LEAD_EMAIL` for synthetic E2E users.
- Auth rate limiting can be disabled only outside production through `AUTH_RATE_LIMIT_DISABLED=true`; the E2E runner sets it.
- Copilot smoke now checks health, readiness, feature flags, replay and exactly one created front.
- Pilot report now requires `PILOT_REPORT_DATABASE_URL` and supports preflight.

## Current Status

GO status: **NO-GO for full Block 6A activation**.

Validated on 2026-07-27 local workspace:

```text
npm run db:e2e:provision -> GO
npm run db:e2e:status -> GO
npm run test:e2e -- e2e/portfolio-copilot-create-front.spec.ts -> GO
npm run db:pilot:provision -> GO before the latest migration repair; rerun pending
npm run pilot:report:preflight -> GO against starteria_pilot_dry_run before the latest migration repair; rerun pending
npm run pilot:report -- --from=2026-07-01 --to=2026-07-31 -> GO empty report before the latest migration repair; rerun pending
npm run test:e2e -> NO-GO, timed out after 600s
```

Full-suite E2E no longer uses `starteria_db` and the Copilot vertical passes, but the complete suite is not green. The latest run reached the PDF public flow after the Copilot spec and timed out. One non-Copilot spec (`portfolio-steps-integration`) also failed with login 401. These are blockers for declaring full Block 6A GO, but not evidence of Copilot duplication or `starteria_db` usage.

Migration repair rationale:

- A clean database applied the historical migrations but missed schema-declared tables/columns: `Organization`, `OrganizationMember`, B2B billing tables, `Project.pilotLeadId`, and `InitialReviewChatEvent`.
- Historical migrations were not rewritten.
- The new migration is additive and does not alter `StrategicFront`.
- `User.organizationId` remains a scalar without a User -> Organization FK.
