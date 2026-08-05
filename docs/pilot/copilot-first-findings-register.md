# Copilot-first Findings Register

| Finding ID | Fecha | Sesion | Tipo | Severidad | Evidencia | Frecuencia | Causa probable | Accion | Owner | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| finding-6c-001 | 2026-07-28 | dry-run-1785277766521 | seguridad | S1 alta | Dry run logs before correction exposed `authorization` and `set-cookie` headers in pino-http output. Re-run `pilot:dry-run:start -- --checks` showed `authorization`, `set-cookie` and `idempotency-key` as `[REDACTED]`. | 1 run observed | Global HTTP logger did not redact request/response credential headers. | Added global logger redaction paths and backend unit coverage. | [PENDIENTE] | closed |
| finding-6c-002 | 2026-07-28 | dry-run-1785277766521 / DR-10 | observabilidad | S2 media | Concurrent execute produced one StrategicFront, but Prisma logged a unique idempotency conflict before replay handling completed. | 1 run observed | Race between parallel creates is functionally handled by unique constraint and replay lookup, but low-level Prisma error is noisy. | Consider lowering expected P2002 idempotency race logging or catching before error-level emission if logger supports it. Does not block data integrity. | [PENDIENTE] | open |
| finding-6c-003 | 2026-07-28 | DR-14 | observabilidad | S2 media | No approved failure-injection mechanism was available to force PortfolioService failure in dry run. | 1 run observed | Product has no explicit dry-run failure injection hook for `CreateStrategicFront`. | Define a test-only failure injection path or documented manual procedure without product bypass before claiming DR-14 complete. | [PENDIENTE] | open |
| finding-6c-004 | 2026-07-28 | DR-11/DR-12/DR-13 | metodología | S2 media | Capability-disabled, write kill switch and total kill switch were not executed in this run. | 1 run observed | Runner supports normal mode; flag-specific restart walkthrough still not automated/observed. | Execute controlled flag-mode runs with `PILOT_DRY_RUN_NODE_ENV=development` and explicit flags, then update evidence. | [PENDIENTE] | open |
| finding-6c-005 | 2026-07-28 | manual UI observation | usabilidad | S2 media | No human observer reviewed desktop/mobile/keyboard/focus/projection UI during this run. | 1 run observed | Automation covered API and E2E, not observed UX checklist. | Schedule observed dry run and attach anonymized notes before GO tecnico. | [PENDIENTE] | open |
| finding-6d-001 | 2026-07-29 | DR-16 | soporte | S2 media | Automated reconstruction confirmed traceability, but no human support operator used the runbook live with a user report. | 1 run observed | Current environment lacks a second person/operator session. | Run human support walkthrough using correlationId, conversationId, actionPlanId, proposedActionId, actionExecutionId, AuditLog and redacted logs. | [PENDIENTE] | open |
| finding-6d-002 | 2026-07-29 | resilience cleanup | observabilidad | S3 baja | Runner emits cleanup warnings while backend/frontend sockets are closing; post-run port check showed no listeners on dry-run ports. `pilot:dry-run:start -- --checks` also emitted Windows `taskkill` `Acceso denegado` after successful smoke/report. | multiple runner phases | Windows process-tree shutdown is slower than immediate endpoint checks and sometimes denies taskkill after the child is already closing. | Keep post-run port verification in runbook; investigate lower-noise process lifecycle later. Does not block integrity if ports are free. | [PENDIENTE] | open |

## Block 06D Closed Prior Findings

- `finding-6c-003`: closed by dry-run-only `COPILOT_DRY_RUN_PORTFOLIO_FAILURE_MODE=before_create`; DR-14 passed automated with no StrategicFront created.
- `finding-6c-004`: closed by `npm run pilot:dry-run:resilience`; DR-11, DR-12 and DR-13 passed automated. Manual UI observation remains covered by `finding-6c-005`.

## Block 06D Latest Finding Status

- `finding-6c-002`: closed by same-process serialization per `idempotencyKey` in `ActionExecutor` plus a concurrent unit test. The regression reproduced in `dry-run-1785302984347` as a duplicate StrategicFront under concurrent execute; the rerun `dry-run-1785303330334` passed DR-10 with one StrategicFront and replay on the second request.
- `finding-6c-003`: closed in latest evidence `resilience-1785336060725`.
- `finding-6c-004`: closed in latest evidence `resilience-1785336060725`.
- `finding-6c-005`: remains open and blocks full technical GO because no human UI observation was executed.
- `finding-6d-001`: remains open and blocks full technical GO because no human support operator walkthrough was executed.
- `finding-6d-002`: remains open as S3 cleanup noise. It does not block integrity while post-run port verification remains clean.

## Types

- bug
- usabilidad
- narrativa
- contrato
- metodologia
- permisos
- seguridad
- rendimiento
- observabilidad
- valor
- adopcion
- comercial
- fuera de alcance

## Severity

- S0 critica
- S1 alta
- S2 media
- S3 baja
- oportunidad

## Rules

- Do not convert every request into a feature.
- Do not mix bugs with preferences.
- Do not prioritize only by opinion.
- Link findings to evidence.
- Consolidate duplicates.
- Record frequency and impact.
- Mark whether the finding blocks the pilot.
