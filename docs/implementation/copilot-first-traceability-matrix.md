# Copilot-first Traceability Matrix: Create Strategic Front

## Block 06D Traceability Update

New technical evidence:

- DR-11 through DR-16: `front/.pilot-dry-run/resilience-1785301958758.json`.
- Versioned summary: `docs/pilot/copilot-first-dry-run-resilience-evidence.md`.
- Traceability addendum: `docs/pilot/copilot-first-evidence-traceability.md`.

Mapped controls:

| Control | Evidence | Status |
| --- | --- | --- |
| Capability disabled | DR-11 | passed automated, UI observation pending |
| Write kill switch | DR-12 | passed automated, UI observation pending |
| Total kill switch | DR-13 | passed automated, UI observation pending |
| Controlled Portfolio failure | DR-14 | passed automated, UI observation pending |
| Projection failure without reexecution | DR-15 | passed automated, UI observation pending |
| Support traceability | DR-16 | passed automated reconstruction, human operator pending |

Fecha: 2026-07-27
Alcance: primera vertical Copilot-first: `CreateStrategicFront`.
Estado: Blocks 01-05 parcialmente implementados para la primera vertical backend+frontend. Sin IA real ni otras capabilities. Bloque 4/Bloque 5 siguen NO-GO para piloto porque E2E en PostgreSQL limpio esta bloqueado por drift de seed/migracion (`Project.pilotLeadId`).

Formato:

| PRD | Requisito | Capability | Command | Endpoint | Archivos previstos | Test | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00A PRD Copilot-first | Registrar capabilities invocables sin duplicar reglas de dominio | CreateStrategicFront | n/a | n/a | `backend/modules/copilot/application/capability-registry.ts`, `domain/capability.types.ts` | `capability-registry.test.ts` | Registry en codigo con `ownerPrd=PRD-06`, intent `create_strategic_front`, operation `create`, confirmation required | implemented |
| 00A PRD Copilot-first | Contratos canonicos de conversacion, mensajes, assessment, plan, accion y execution ledger | CreateStrategicFront | n/a | n/a | `backend/modules/copilot/domain/copilot.types.ts`, `schemas/copilot.schemas.ts` | `capability-registry.test.ts`, `action-plan.service.test.ts`, `conversation.service.test.ts` | Tipos y schemas estrictos creados; payload P0 excluye `workspaceId`, `sponsorId`, `areaOrUnit` | implemented |
| 00A PRD Copilot-first | Persistir conversaciones y planes recuperables | CreateStrategicFront | n/a | n/a | `front/prisma/schema.prisma`, migration `20260726170000_copilot_foundation_block_01` | `prisma-copilot.repository.test.ts` | Modelos `CopilotConversation`, `CopilotMessage`, `IntentAssessment`, `ActionPlan`, `ProposedAction`, `ActionExecution` | implemented |
| 00A PRD Copilot-first | Garantizar idempotencia como boundary de ejecucion futura | CreateStrategicFront | future `CreateStrategicFrontCommand` | n/a | `ActionExecution.idempotencyKey`, `PrismaCopilotRepository.createPendingActionExecution` | `prisma-copilot.repository.test.ts` | Unique `idempotencyKey`; P2002 mapea a `IDEMPOTENCY_CONFLICT` | implemented |
| 00A PRD Copilot-first | Auditoria de acciones del orquestador | CreateStrategicFront | n/a | n/a | `PrismaCopilotRepository.writeAudit`, services | `conversation.service.test.ts`, `action-plan.service.test.ts`, `prisma-copilot.repository.test.ts` | Eventos auditados para conversation, message, assessment, plan, action edit y supersede | implemented |
| PRD-01 Workspaces | Portfolio Lead debe exigir organizacion y permisos contextuales | CreateStrategicFront | n/a | n/a | `backend/modules/copilot/application/strategic-front.authorization.ts` | `strategic-front.authorization.test.ts` | `canCreateStrategicFront` usa `organizationId`, roles actuales y membresia/organizacion existente | implemented |
| PRD-02 Smart Entry | Intent assessment debe devolver intent, operation, capacidades, faltantes, fuentes y confianza | CreateStrategicFront | n/a | n/a | `domain/copilot.types.ts`, `schemas/copilot.schemas.ts`, `ActionPlanService.saveIntentAssessment` | `action-plan.service.test.ts` | `IntentAssessment` persiste `create_strategic_front`, `create`, recommendedCapabilities y rubric/adapter | implemented |
| PRD-06 Portfolio Lead | Payload de crear frente debe ser compatible con el modelo actual de Portfolio | CreateStrategicFront | future `CreateStrategicFrontCommand` | n/a | `schemas/copilot.schemas.ts`, `capability-registry.ts` | `capability-registry.test.ts`, `action-plan.service.test.ts` | Payload P0 usa `organizationId`, `name`, `objective`, KPI/baseline/target/horizon, `sponsor`, `priority`, `createdBy`; no usa `workspaceId`, `sponsorId`, `areaOrUnit` | implemented |
| PRD-06 Portfolio Lead | El dominio Portfolio sigue siendo propietario de `StrategicFront` | CreateStrategicFront | future `CreateStrategicFrontCommand` | n/a | No se crea command ni import de `PortfolioService` | `rg` verification, `capability-registry.test.ts` | Modulo Copilot no referencia `PortfolioService` ni `strategicFront`; no hay escritura del frente | implemented |
| PRD-08 AI Agent | La IA/adapter no debe tener escritura directa | CreateStrategicFront | n/a | n/a | No se implementa adapter IA; no se importa AI bridge | `rg` verification | No hay `bridge.service`, `ai-service` ni repo de escritura IA en Copilot | implemented |
| PRD-08 AI Agent | Separar propuesta de ejecucion | CreateStrategicFront | future `CreateStrategicFrontCommand` | n/a | `ActionPlanService`, `ProposedAction`, `ActionExecution` model | `action-plan.service.test.ts`, `prisma-copilot.repository.test.ts` | Se crean/editar propuestas y ledger pendiente; no existe executor | implemented |
| 00A PRD Copilot-first | Endpoints de conversaciones, mensajes, plans, approvals y executions | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*` | `backend/modules/copilot/copilot.router.ts`, `copilot.controller.ts`, `copilot.dto.ts` | `copilot.router.test.ts`, `copilot-api-vertical.integration.test.ts` | Endpoints autenticados para crear/recuperar conversaciones, enviar mensajes, recuperar assessment/plan, editar/aprobar/rechazar/ejecutar y consultar executions | implemented |
| 00A PRD Copilot-first | Aprobacion humana total/parcial/rechazo | CreateStrategicFront | `CreateStrategicFrontCommand` | `POST /api/v1/copilot/actions/:actionId/approve`, `/reject` | `backend/modules/copilot/application/approval.service.ts` | `approval.service.test.ts`, `copilot.router.test.ts` | Aprueba/rechaza con version, org, permisos, capability, payload y auditoria; bloqueo de dependientes | implemented |
| 00A PRD Copilot-first | Ejecutar mediante command de dominio validado | CreateStrategicFront | `CreateStrategicFrontCommand` | `POST /api/v1/copilot/actions/:actionId/execute` | `backend/modules/copilot/application/action-executor.ts`, `commands/create-strategic-front.command.ts` | `action-executor.test.ts`, `create-strategic-front.command.test.ts`, `copilot.router.test.ts` | Executor exige aprobacion/version/permisos, crea ledger idempotente y despacha command | implemented |
| PRD-06 Portfolio Lead | Crear frente real y devolver links de mapa/lista | CreateStrategicFront | `CreateStrategicFrontCommand` | `POST /api/v1/copilot/actions/:actionId/execute` | `CreateStrategicFrontCommandHandler`, existing `PortfolioService`, `ActionExecutor` | `copilot-portfolio.integration.test.ts`, `copilot-api-vertical.integration.test.ts` | Integracion PostgreSQL crea exactamente un `StrategicFront` via Portfolio y replay HTTP no duplica | implemented |
| PRD-06 Portfolio Lead | Mantener atajos estructurados y UI Copilot | CreateStrategicFront | n/a | `/api/v1/copilot/*` | `front/src/features/copilot/*`, `front/src/app/pages/PortfolioLeadHomePage.tsx` | `PortfolioCopilotShell.test.tsx`, `http-copilot-client.test.ts` | UI Portfolio Copilot conectada al backend real: conversacion, clarificacion, plan, edicion, aprobacion, rechazo, ejecucion y resultado | implemented |
| PRD-06 Portfolio Lead | Refrescar mapa estrategico desde fuente real despues de crear frente | CreateStrategicFront | `CreateStrategicFrontCommand` | `GET /api/v1/portfolio/strategic-fronts` | `PortfolioLeadContext.refreshPortfolioData`, `PortfolioCopilotShell` | `PortfolioCopilotShell.test.tsx`, `portfolio-copilot-create-front.spec.ts` | Al completar execution se llama refresh Portfolio; no se inserta frente localmente | implemented |
| 00A PRD Copilot-first | Recuperar conversacion/plan/execution despues de refresh | CreateStrategicFront | n/a | `GET /api/v1/copilot/conversations/:id`, `/messages`, `/action-plan`, `/actions/:id/executions` | `useCopilotConversation.ts`, DTOs Copilot | `PortfolioCopilotShell.test.tsx` | Se persiste solo conversationId en sessionStorage y se reconstruye UI desde backend | implemented |
| Repository Baseline | E2E vertical backend+frontend sin localhost:80 | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*`, `/api/v1/portfolio/*` | `front/e2e/portfolio-copilot-create-front.spec.ts`, `front/scripts/run-e2e.ts` | `npm run test:e2e` | Spec agregado; runner configura flags Copilot backend/frontend y adapter deterministico. Ejecucion real sigue NO-GO por `Project.pilotLeadId` faltante en seed sobre PostgreSQL limpio | blocked |
| PRD-08 AI Agent | Adapter deterministico y luego IA real reemplazable | CreateStrategicFront | n/a | `POST /api/v1/copilot/conversations/:conversationId/messages` | `deterministic-copilot.adapter.ts`, `copilot-orchestration.service.ts` | `deterministic-copilot.adapter.test.ts`, `copilot-orchestration.service.test.ts` | Adapter deterministico interpreta completo/incompleto/desconocido, no escribe DB ni ejecuta comandos | implemented |
| Repository Baseline | Mantener quality gates existentes | CreateStrategicFront | n/a | n/a | Todo el bloque | comandos finales | `db:generate`, `typecheck:backend`, `build:backend`, `npm test`, `typecheck:front`, `build` y `typecheck` pasan | implemented |
| 00A PRD Copilot-first | Detener escrituras sin perder lectura/auditoria | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*` | `copilot-feature-guard.ts`, `copilot-runtime-config.ts`, `copilot.controller.ts` | `copilot.router.test.ts`, `copilot-runtime-config.test.ts` | Backend flags `COPILOT_ENABLED`, `COPILOT_WRITE_ENABLED`, capability flag y allowlist organizacional | implemented |
| 00A PRD Copilot-first | Recuperar ejecuciones interrumpidas sin reintento ciego | CreateStrategicFront | `CreateStrategicFrontCommand` | n/a | `copilot-execution-reconciler.ts`, `copilot-reconciliation-scheduler.ts`, Prisma migration Block 05 | `copilot-execution-reconciler.test.ts` | Stale executions se reclaman por campos persistidos; ambiguity -> `manual_review_required`; no llama Portfolio | implemented_partial |
| 00A PRD Copilot-first | Trazabilidad distribuida interna | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*` | `request-id.ts`, `ActionExecution.correlationId`, `copilot.dto.ts` | `request-id.test.ts`, Copilot tests | `x-correlation-id` valido se acepta/genera y se persiste en execution | implemented |
| PRD-08 AI Agent | No exponer secretos ni payloads sensibles en logs | CreateStrategicFront | n/a | n/a | `copilot-redaction.ts`, `copilot-logger.ts`, `action-executor.ts` | `copilot-observability.test.ts` | Redaccion de headers, mensajes y payloads; idempotency key auditada como fingerprint | implemented_partial |
| PRD-09 Piloto TI | Readiness y runbooks operativos | CreateStrategicFront | n/a | `/api/readiness/copilot` | `copilot-readiness.ts`, `docs/operations/*`, `docs/security/copilot-first-security-review.md` | `typecheck:backend`; docs review | Readiness diferencia DB, registry, flags, adapter y reconciliador; runbook/playbook creados | implemented_partial |
| PRD-09 Piloto TI | Smoke y carga basica reproducibles | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*` | `front/scripts/copilot-smoke.ts`, `front/scripts/copilot-load-baseline.ts`, `front/package.json` | Pendiente de entorno desplegado | Scripts creados con proteccion contra produccion accidental | implemented_unverified |

## Evidencia Block 01

| Evidencia | Resultado |
| --- | --- |
| `npm run db:generate` | GO. Prisma Client generado con modelos Copilot. |
| `npm run typecheck:backend` | GO tras ajustes de tipos Prisma. |
| `npx vitest run --config vitest.backend.config.ts ../backend/modules/copilot/__tests__` | GO. 5 archivos / 35 tests. |
| Verificacion boundary con `rg` | GO. No aparecen `PortfolioService`, `bridge.service`, `ai-service` ni escritura `strategicFront` en modulo Copilot. |
| `npx prisma migrate deploy` | GO contra `starteria_copilot_test`. Aplico las 10 migraciones desde cero, incluida `20260726170000_copilot_foundation_block_01`. |
| `npx prisma migrate status` | GO contra `starteria_copilot_test`. Resultado: `Database schema is up to date!`. |

## Evidencia Block 03

| Evidencia | Resultado |
| --- | --- |
| `npx vitest run --config vitest.backend.config.ts ../backend/modules/copilot/__tests__` | GO. 12 archivos / 75 tests; integraciones PostgreSQL opt-in skipped por defecto. |
| `copilot.router.test.ts` | GO. Cubre auth, mensaje completo/incompleto/desconocido, assessment, plan, edit, stale, approve, reject, execute, replay, scope y errores. |
| `copilot-api-vertical.integration.test.ts` | Opt-in con `COPILOT_DB_INTEGRATION=1`; valida API completa con PostgreSQL y `StrategicFront` real via Portfolio. |
| Migracion `20260727093000_copilot_block_03_unknown_assessment` | Aditiva. Agrega enum values `unknown` y `unsupported` para persistir assessments no evaluables. |

## Evidencia Block 04

| Evidencia | Resultado |
| --- | --- |
| `npm run typecheck:front` | GO. Contratos frontend Copilot, Home y Portfolio context tipan correctamente. |
| `npx vitest run --config vitest.front.config.ts src/features/copilot/__tests__ --reporter=dot --silent` | GO. 3 archivos / 9 tests. |
| `npm run test:front -- --reporter=dot --silent` | GO. 42 archivos / 281 tests. |
| `portfolio-copilot-create-front.spec.ts` | Agregado. Cubre login Portfolio Lead, mensaje deterministico, plan, edicion, aprobacion, ejecucion, refresh y replay idempotente con PostgreSQL. |
| `run-e2e.ts` | Actualizado para levantar frontend con `VITE_PORTFOLIO_COPILOT_ENABLED=true` y backend con `COPILOT_ASSESSMENT_ADAPTER=deterministic`. |

## Fuera de alcance no marcado como implementado

- IA real.
- Streaming.
- Archivos/uploads desde Copilot.
- Importacion.
- Retos, cohortes, readiness y decisiones.
- Proyeccion visual comprobada en navegador fuera del spec E2E agregado.

## Block 06 - Pilot Activation Readiness

| PRD | Requisito | Capability | Command | Endpoint | Archivos previstos | Test | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRD-09 Piloto TI | Charter formal de piloto controlado | CreateStrategicFront | n/a | n/a | `docs/pilot/copilot-first-pilot-charter.md` | doc review | Incluye hipotesis H1-H10, responsables como placeholders y GO/NO-GO | prepared_no_go |
| PRD-09 Piloto TI | Usuarios piloto anonimizados y roles existentes | CreateStrategicFront | n/a | n/a | `docs/pilot/copilot-first-pilot-users.md` | doc review | Matriz con `pilot-user-*`; no crea roles nuevos | prepared_pending_humans |
| PRD-09 Piloto TI | Casos controlados diversos | CreateStrategicFront | n/a | n/a | `docs/pilot/copilot-first-pilot-cases.md` | doc review | 10 casos, incluyendo incompleto, ambiguo, rechazo, permisos, replay y fuera de alcance | prepared_pending_execution |
| PRD-09 Piloto TI | Datos y confidencialidad del piloto | CreateStrategicFront | n/a | n/a | `docs/pilot/copilot-first-data-handling.md`, UI notice | `PortfolioCopilotShell.test.tsx` | Aviso piloto y politica documental sin afirmar cumplimiento no verificado | implemented_partial |
| PRD-09 Piloto TI | Checklist de activacion con flags y kill switch | CreateStrategicFront | n/a | `/api/readiness/copilot` | `docs/pilot/copilot-first-pilot-activation-checklist.md` | doc review | Defaults seguros y pasos previos; no activa allowlist | prepared_no_go |
| PRD-09 Piloto TI | Onboarding y guia de facilitacion | CreateStrategicFront | n/a | n/a | `copilot-first-user-guide.md`, `copilot-first-facilitator-guide.md` | doc review | Explica Action Plan, editar/aprobar/ejecutar, soporte y datos prohibidos | prepared |
| PRD-09 Piloto TI | Instrumentacion y reporte reproducible | CreateStrategicFront | n/a | n/a | `front/scripts/pilot/generate-copilot-pilot-report.ts` | `generate-copilot-pilot-report.test.ts` | Reporte lee AuditLog/ActionExecution, anonimiza y no exporta conversaciones completas | implemented_partial |
| PRD-09 Piloto TI | Observacion, entrevista, encuesta y findings | CreateStrategicFront | n/a | n/a | `docs/pilot/templates/*`, `copilot-first-findings-register.md` | doc review | Plantillas creadas; no contienen sesiones fabricadas | prepared_pending_sessions |
| PRD-09 Piloto TI | Politica de cambios y criterios de pausa | CreateStrategicFront | n/a | n/a | `copilot-first-pilot-change-policy.md` | doc review | Define pausa inmediata/investigacion y cambios permitidos | prepared |
| PRD-09 Piloto TI | Modelo de soporte | CreateStrategicFront | n/a | n/a | `copilot-first-pilot-support-model.md` | doc review | Usa placeholders; no declara 24/7 ni SLA contractual | prepared_pending_humans |
| PRD-09 Piloto TI | Dry run previo a usuario real | CreateStrategicFront | n/a | `/api/v1/copilot/*` | `copilot-first-dry-run-report.md` | pendiente | Reporte creado como not executed; no se marca realizado | not_executed |

Block 06 status: **NO-GO for activation** until Block 05 technical gate and operational placeholders are resolved.

## Block 06A - Reproducible E2E And Dry-run Environment

| PRD | Requisito | Capability | Command | Endpoint | Archivos previstos | Test | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Repository Baseline | E2E no usa `starteria_db` | CreateStrategicFront | n/a | n/a | `front/scripts/run-e2e.ts`, `docker-compose.e2e.yml` | `npm run test:e2e` | Runner usa `E2E_DATABASE_URL` y compose `starteria-e2e` | implemented_pending_validation |
| Repository Baseline | Provisioning seguro de DB desechable | CreateStrategicFront | n/a | n/a | `front/scripts/database/*` | `test-database-utils.test.ts` | Allowlist impide `starteria_db`, `postgres`, templates y nombres no declarados | implemented |
| Repository Baseline | Seed E2E deterministico | CreateStrategicFront | n/a | n/a | `front/prisma/seed.e2e.ts` | pending integration | Usuarios autorizado, no autorizado y otra organizacion | implemented_pending_validation |
| PRD-09 Piloto TI | Seed dry run sintetico | CreateStrategicFront | n/a | n/a | `front/prisma/seed.pilot-dry-run.ts` | pending integration | Organizacion sintetica, portfolio lead y viewer | implemented_pending_validation |
| PRD-09 Piloto TI | Smoke Copilot controlado | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*` | `front/scripts/copilot-smoke.ts` | smoke | Health, readiness, flags, approve, execute, replay y un frente exacto | implemented_pending_validation |
| PRD-09 Piloto TI | Reporte con preflight DB | CreateStrategicFront | n/a | n/a | `front/scripts/pilot/generate-copilot-pilot-report.ts` | report tests | Exige `PILOT_REPORT_DATABASE_URL`; falla si faltan tablas/migraciones | implemented |

Block 06A status is GO only after disposable DB provisioning, E2E, smoke and report pass.

## Block 06C - Observed Dry Run Readiness

| PRD | Requisito | Capability | Command | Endpoint | Archivos | Test/Evidencia | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRD-09 Piloto TI | Dry run funcional automatizado | CreateStrategicFront | `CreateStrategicFrontCommand` | `/api/v1/copilot/*`, `/api/v1/portfolio/strategic-fronts` | `front/scripts/copilot-dry-run-functional.ts` | `dry-run-1785277766521`; DR-01..DR-10 passed | implemented_partial |
| PRD-09 Piloto TI | Rechazo y accion no ejecutable | CreateStrategicFront | `CreateStrategicFrontCommand` | `/copilot/actions/:id/reject`, `/execute` | API Copilot | DR-05 passed; rejected action did not create front | implemented |
| PRD-09 Piloto TI | Usuario sin permiso | CreateStrategicFront | n/a | `/copilot/conversations` | Seed dry run | DR-06 passed; viewer got HTTP 403 before mutation | implemented |
| PRD-09 Piloto TI | Aislamiento organizacional | CreateStrategicFront | n/a | `/copilot/conversations/:id`, `/action-plan`, `/approve` | Seed dry run with other org | DR-07 passed; cross-org access denied | implemented |
| PRD-09 Piloto TI | Idempotencia replay/doble clic | CreateStrategicFront | `CreateStrategicFrontCommand` | `/copilot/actions/:id/execute` | ActionExecution unique idempotency key | DR-09 and DR-10 passed; one StrategicFront | implemented_with_observability_finding |
| PRD-09 Piloto TI | Kill switches observados | CreateStrategicFront | n/a | `/api/v1/copilot/*` | Runtime flags | DR-11..DR-13 not executed in 6C | pending |
| PRD-09 Piloto TI | Soporte simulado y proyeccion fallida | CreateStrategicFront | n/a | n/a | Runbook/playbook | DR-15..DR-16 not executed in 6C | pending |
| PRD-09 Piloto TI | Logs sin secretos | CreateStrategicFront | n/a | all HTTP routes | `backend/shared/utils/logger.ts` | Redaction paths added; backend tests pass; smoke-log verification pending | fixed_pending_verification |

Block 06C status: **NO-GO tecnico** until manual UI observation, flag/kill-switch cases, Portfolio error, projection failure, support simulation and post-fix log verification are complete.
