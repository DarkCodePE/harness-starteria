# Copilot-first Foundation Block 06

## Block 06D Update

Block 6D added automated resilience evidence for DR-11 through DR-16 and created:

- `docs/implementation/copilot-first-foundation-block-06d.md`
- `docs/pilot/copilot-first-dry-run-resilience-evidence.md`
- `docs/pilot/evidence/internal-observed-session-01.md`

Technical resilience checks passed against `starteria_pilot_dry_run`, but the dry run is still not complete because manual UI observation and a human support walkthrough were not executed.

## Scope

Block 06 prepares a controlled pilot for the first Copilot-first vertical:

```text
CreateStrategicFront from Portfolio Copilot
-> conversation
-> Action Plan
-> human approval
-> idempotent execution
-> Portfolio Lead projection
```

It does not activate a productive allowlist, invent pilot participants, add capabilities, connect a real AI provider, change `StrategicFront`, create `Workspace`, or remove approval controls.

## Required Reading

Read and used as source:

- `docs/implementation/copilot-first-foundation-block-01.md`
- `docs/implementation/copilot-first-foundation-block-02.md`
- `docs/implementation/copilot-first-foundation-block-03.md`
- `docs/implementation/copilot-first-foundation-block-04.md`
- `docs/implementation/copilot-first-foundation-block-05.md`
- `docs/implementation/copilot-first-foundation-design.md`
- `docs/implementation/copilot-first-traceability-matrix.md`
- `docs/implementation/copilot-first-rollout-plan.md`
- `docs/implementation/copilot-first-pilot-scorecard.md`
- `docs/operations/copilot-first-runbook.md`
- `docs/operations/copilot-first-incident-playbook.md`
- `docs/security/copilot-first-security-review.md`
- `docs/prds/copilot-first-v1/09_PRD_PILOTO_CALIDDA_Y_VALIDACION_TI.md`
- `docs/prds/copilot-first-v1/00A_PRD_ARQUITECTURA_COPILOT_FIRST_Y_ORQUESTACION_TRANSVERSAL.md`
- `docs/prds/copilot-first-v1/06_PRD_PORTFOLIO_LEAD_IMPORTACION_Y_GOBERNANZA.md`
- `docs/prds/copilot-first-v1/08_PRD_AGENTE_IA_ESPECIALIZADO_Y_RUBRICAS.md`

Requested paths that do not exist and were not treated as source:

- `docs/prds/09_PRD_PILOTO_CALIDDA_Y_VALIDACION_TI.md`
- `docs/prds/00A_PRD_ARQUITECTURA_COPILOT_FIRST_Y_ORQUESTACION_TRANSVERSAL.md`
- `docs/prds/06_PRD_PORTFOLIO_LEAD_IMPORTACION_Y_GOBERNANZA.md`
- `docs/prds/08_PRD_AGENTE_IA_ESPECIALIZADO_Y_RUBRICAS.md`

The real PRDs are under `docs/prds/copilot-first-v1/`.

## Block 5 Gate

Technical gate: **NO-GO**.

Reason: Block 05 documents that the vertical cannot be certified end-to-end until the Block 04 E2E on clean PostgreSQL is green. The known blocker is seed/migration drift around `Project.pilotLeadId`.

Operational gate: **NO-GO**.

Reasons:

- pilot organization is not confirmed;
- pilot users are not confirmed;
- roles and owners are placeholders;
- support channel and schedule are placeholders;
- allowed data policy requires human confirmation;
- dry run is not executed;
- allowlist is not activated.

## Deliverables

- Pilot charter, users matrix, cases, data handling, activation checklist, onboarding, facilitator guide, findings register, change policy, support model and dry-run report under `docs/pilot/`.
- Session, interview, survey, midpoint, final report and commercial learning templates under `docs/pilot/templates/`.
- Updated rollout plan, scorecard, traceability matrix and runbook.
- Pilot report script: `front/scripts/pilot/generate-copilot-pilot-report.ts`.
- UI pilot notice in `PortfolioCopilotShell`.

## Pilot Activation Rule

Do not enable `COPILOT_ALLOWED_ORGANIZATION_IDS` for a real organization until:

1. clean PostgreSQL migrations are proven;
2. backend/frontend typecheck, builds and tests pass;
3. vertical E2E is green;
4. kill switch and capability disable are tested;
5. organization, users, owners, support and data policy are confirmed;
6. dry run is executed and recorded.

## Dry Run Status

Status: **not executed**.

The dry-run report exists as a template and must be completed only after the full internal route is run.

## Next Step

Resolve the Block 05 E2E blocker, run the technical gate, then complete the operational placeholders before the first real user session.

## Block 06A Update

The E2E/migration blocker is addressed by Block 06A infrastructure work. See:

- `docs/implementation/copilot-first-foundation-block-06a.md`
- `docs/implementation/e2e-database-strategy.md`
- `docs/implementation/local-database-baseline-assessment.md`

Rule: do not use `starteria_db` as a clean E2E or pilot dry-run database.

## Block 06C Update

Block 06C added a functional automated dry run, but the complete dry run remains **NO-GO**.

Evidence:

- `starteria_pilot_dry_run` was provisioned from a clean disposable database with 14 migrations.
- `pilot:dry-run:start -- --functional` executed run `dry-run-1785277766521`.
- DR-01 through DR-10 passed through real backend/API/PostgreSQL.
- DR-11 through DR-16 were not executed because they require flag-specific restarts, controlled Portfolio failure/projection scenarios and operator support simulation.
- Manual UI observation was not executed.
- A sensitive log exposure was found in global HTTP logs and fixed by adding logger redaction paths; smoke-log verification remains required before closing the finding.

Decision:

- Technical: **NO-GO** for complete pilot readiness.
- Operational: **NO-GO** because real organization, users, owners, support, consent, dates and allowed data remain pending.

See:

- `docs/implementation/copilot-first-foundation-block-06c.md`
- `docs/pilot/copilot-first-internal-dry-run-evidence.md`
- `docs/pilot/copilot-first-dry-run-go-no-go.md`
