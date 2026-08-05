# Copilot-first Foundation Block 06B

Status: technical E2E gate closed; operational pilot remains NO-GO.

## Scope

Block 06B stabilized the reproducible E2E path and executed the automated dry-run checks against an isolated pilot dry-run database.

Databases used:

| Purpose | Database |
| --- | --- |
| Local development | `starteria_db` |
| E2E | `starteria_e2e` |
| Pilot dry run | `starteria_pilot_dry_run` |

`starteria_db` was not reset, migrated destructively, or used as the clean E2E database.

## Root Causes

### Login 401

`portfolio-steps-integration` and `team-inheritance` used the legacy hardcoded account `admin@starteria.io`, which does not exist in the isolated E2E seed. The fix was to seed a deterministic E2E admin user and have specs read `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`.

### PDF Hang

The public PDF spec waited for a success navigation even when the E2E PDF extraction path could terminate in a controlled failure. The fix was to use product states with bounded timeouts and a deterministic test-only terminal failure mode through `PDF_EXTRACTION_E2E_MODE=terminal-failed`.

## Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Clean migrations | GO | `npm run db:e2e:provision` applied 14 migrations and `migrate status` returned up to date |
| E2E complete suite | GO | `npm run test:e2e:all`: 17 passed in 43.5s |
| Copilot E2E | GO | `npm run test:e2e:copilot`: passed |
| Steps E2E | GO | `npm run test:e2e:steps`: passed |
| PDF E2E | GO | `npm run test:e2e:pdf`: passed |
| Smoke Copilot | GO | `npm run pilot:dry-run:start -- --checks`: smoke completed |
| Pilot report | GO | preflight ok, 14 migrations, required Copilot tables present |
| Dry run full checklist | NO-GO partial | Automated smoke/report executed; full manual/operational dry-run cases are still pending |

## Commands Verified

```text
npm run db:generate
npm run typecheck:backend
npm run typecheck:front
npm run typecheck
npm run build:backend
npm run build
npm test
npm run test:front -- --reporter=dot --silent
npm run db:e2e:provision
npm run test:e2e:all
npm run db:pilot:provision
npm run pilot:dry-run:start -- --checks
git diff --check
```

## Remaining Operational Blockers

- Real pilot organization not confirmed.
- Real pilot users not confirmed.
- Pilot owner, technical owner, support owner and incident owner remain pending.
- Support channel, consent, dates and permitted data remain pending.
- Full dry-run checklist still needs explicit execution for kill switch, rejection, insufficient permission and support simulation.

