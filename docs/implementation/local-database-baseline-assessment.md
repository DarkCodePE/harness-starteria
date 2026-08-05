# Local Database Baseline Assessment

Database assessed: `starteria_db`.

## Observed State

`npx prisma migrate status` against `starteria_db` reported 13 migrations not applied:

- `20260414220131_add_portfolio_lead_models`
- `20260519000000_pdf_autofill`
- `20260519010000_steps_234_persistence`
- `20260520003229_pdf_extraction_run_ai_run_id`
- `20260523120000_pdf_extraction_run_ai_run_id_index`
- `20260529000000_add_oauth_fields_to_user`
- `20260529120000_add_pilot_lead`
- `20260710090000_initial_review_flow`
- `20260711120000_company_context`
- `20260726170000_copilot_foundation_block_01`
- `20260726183000_add_user_organization_scalar_for_copilot`
- `20260727093000_copilot_block_03_unknown_assessment`
- `20260727120000_copilot_production_hardening`

`npx prisma migrate deploy` failed with `P3005`: the database schema is not empty.

## Drift

Observable drift: non-empty schema without Prisma migration history compatible with the current migration chain. This is enough to disqualify `starteria_db` as a clean E2E validation target.

Tables existing: [PENDIENTE: read-only inventory if needed].

`_prisma_migrations`: [PENDIENTE: read-only inventory if needed].

Important data: unknown. Treat as potentially important until a human confirms it is disposable.

## Options

| Option | Description | Risk | Recommendation |
| --- | --- | --- | --- |
| Preserve and create new local DB | Keep `starteria_db` untouched; use `starteria_e2e` and `starteria_pilot_dry_run` for validation | Low | Recommended |
| Export, recreate schema, reimport | Dump data, recreate with migrations, reimport carefully | Medium/high | Only if local data matters |
| Formal baseline via migrate diff | Generate a baseline after comparing actual schema to expected schema | High if rushed | Requires separate review |
| Reset | Drop/recreate `starteria_db` | High data-loss risk | Only after explicit human confirmation |
| Keep as legacy | Do not use for validation | Low | Acceptable for now |

## Prohibited In This Block

- No `migrate reset` on `starteria_db`.
- No `migrate resolve --applied` without validating each migration.
- No dropping tables.
- No using `db push` to hide migration drift.
