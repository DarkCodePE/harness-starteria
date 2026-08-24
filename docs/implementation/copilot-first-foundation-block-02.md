# Copilot-first Foundation Block 02

Fecha: 2026-07-26
Estado: implementado en backend, sin UI ni endpoints HTTP.

## Alcance

Este bloque implementa la segunda parte backend de la vertical `CreateStrategicFront`:

- aprobacion y rechazo de `ProposedAction`;
- invalidacion de aprobacion al editar payload;
- calculo agregado de estado de `ActionPlan`;
- `CreateStrategicFrontCommand`;
- `CreateStrategicFrontCommandHandler`;
- `ActionExecutor`;
- idempotencia funcional con `ActionExecution.idempotencyKey`;
- integracion real con `PortfolioService.createStrategicFront`;
- auditoria de aprobacion, rechazo, ejecucion, replay y fallos;
- prueba de integracion PostgreSQL opcional.

Fuera de alcance: endpoints HTTP, frontend, adapter deterministico de mensajes, IA real, importacion, retos, cohortes, readiness, decisiones y otras capabilities.

## Decisiones MVP aplicadas

| Decision | Aplicacion |
| --- | --- |
| `organizationId` | Se mantiene como referencia logica. No se agrega FK hacia `Organization`. |
| `Workspace` | No se crea modelo `Workspace` ni `workspaceId`. |
| `StrategicFront` | No se modifica el modelo. La creacion pasa por `PortfolioService`. |
| Sponsor | Se mantiene `sponsor` string. No se crea `sponsorId`. |
| `areaOrUnit` | No se agrega porque no existe persistencia compatible. |
| Permisos | `portfolio.strategicFront.create` sigue mapeado a roles actuales `admin|mentor` y membresia/organizacion. |
| Migracion aditiva | Se agrega solo `User.organizationId` como escalar si falta en DB limpia, porque el schema ya lo declaraba pero la historia migratoria no lo creaba. |

## Aprobacion

Archivo:

- `backend/modules/copilot/application/approval.service.ts`

`approveProposedAction`:

1. recupera accion, plan y conversacion;
2. valida `organizationId` de conversacion y payload;
3. valida acceso organizacional y permiso conceptual;
4. valida `expectedVersion`;
5. comprueba capability registrada y commandType;
6. valida `proposedPayload` contra el schema de la capability;
7. permite aprobar solo acciones `proposed` o `edited`;
8. persiste `approvedBy`, `approvedAt` y estado `approved`;
9. recalcula estado agregado del plan;
10. audita `ProposedActionApproved`.

## Rechazo

`rejectProposedAction`:

- valida organizacion, permisos, version, capability y payload;
- persiste `rejectedBy`, `rejectedAt` y estado `rejected`;
- registra la razon en `AuditLog.details`;
- bloquea acciones dependientes no completadas;
- recalcula estado del plan;
- audita `ProposedActionRejected`.

La razon no se agrego al modelo `ProposedAction` para evitar una migracion no indispensable; queda en auditoria.

## Edicion posterior a aprobacion

`ActionPlanService.editProposedPayload` ya incrementaba version e invalidaba `approvedBy/approvedAt`. Block 02 agrega auditoria explicita:

- `copilot.proposed_action.approval_invalidated`
- evento logico `ProposedActionApprovalInvalidated`

La version anterior no puede ejecutarse porque `ActionExecutor` exige `expectedVersion` actual y estado `approved`.

## Estado agregado del plan

Archivo:

- `backend/modules/copilot/application/action-plan-status.ts`

Reglas implementadas:

- sin acciones: `draft`;
- ninguna aprobada y con acciones pendientes: `awaiting_confirmation`;
- algunas aprobadas: `partially_approved`;
- todas las ejecutables aprobadas: `approved`;
- alguna en ejecucion: `executing`;
- completadas + fallidas/bloqueadas/rechazadas: `partially_completed`;
- todas completadas: `completed`;
- todas fallidas/rechazadas/bloqueadas: `failed`.

## Command Handler

Archivos:

- `backend/modules/copilot/commands/create-strategic-front.command.ts`
- `backend/modules/portfolio/portfolio.service.ts` reutilizado
- `backend/modules/portfolio/portfolio.schemas.ts` reutilizado

El handler:

1. valida el command Copilot;
2. mapea `objective` -> `strategicObjective`;
3. mapea `createdBy` -> `ownerId`;
4. conserva `organizationId`, `name`, `mainKpi`, `baseline`, `target`, `horizon`, `sponsor`, `priority`;
5. valida contra `createStrategicFrontSchema`;
6. delega en `PortfolioService.createStrategicFront`;
7. devuelve `CommandExecutionResult`.

No accede al repositorio Copilot y no escribe `StrategicFront` directamente.

## ActionExecutor

Archivo:

- `backend/modules/copilot/application/action-executor.ts`

`executeApprovedAction`:

1. busca ledger existente por `idempotencyKey`;
2. si existe misma key/accion, devuelve replay o estado vigente sin reejecutar;
3. si existe misma key/otra accion, devuelve `IDEMPOTENCY_CONFLICT`;
4. recupera accion, plan y conversacion;
5. valida organizacion, version, capability, payload y permiso;
6. exige estado `approved` con `approvedBy/approvedAt`;
7. crea `ActionExecution` pendiente;
8. cambia a `validating` y luego `executing`;
9. marca plan/accion como `executing`;
10. despacha `CreateStrategicFrontCommand`;
11. completa ledger con resultado, objetos creados y links;
12. marca accion `completed`;
13. recalcula ActionPlan;
14. audita inicio, dispatch, frente creado, completion o failure.

## Idempotencia

Reglas implementadas:

| Escenario | Comportamiento |
| --- | --- |
| Misma key + misma accion completada | Devuelve la ejecucion existente con status de respuesta `idempotent_replay`; no llama Portfolio. |
| Misma key + misma accion pending/validating/executing | Devuelve estado vigente; no llama Portfolio. |
| Misma key + misma accion failed | Devuelve fallo previo; no reintenta automaticamente. |
| Misma key + otra accion | `IDEMPOTENCY_CONFLICT`. |
| Colision DB por unique key | Repositorio mapea P2002 a `IDEMPOTENCY_CONFLICT`; executor recupera ledger existente cuando corresponde. |
| Nuevo intento deliberado tras fallo | Debe usar una nueva idempotencyKey. |

El sistema no depende de botones frontend deshabilitados.

## Validacion organizacional

Debido a que no hay FK a `Organization`:

- `CopilotConversation.organizationId` debe coincidir con el request;
- `ProposedAction.proposedPayload.organizationId` debe coincidir con el request;
- el actor debe pasar `canCreateStrategicFront`;
- `PrismaCopilotRepository.getOrganizationAccess` usa `Organization/OrganizationMember` si existen y `User.organizationId` como scalar logico;
- si falta acceso o hay cruce, no se crea frente y se audita.

## Auditoria

Eventos registrados:

- `copilot.proposed_action.approved`
- `copilot.proposed_action.rejected`
- `copilot.proposed_action.approval_invalidated`
- `copilot.execution.created`
- `copilot.execution.started`
- `copilot.command.dispatched`
- `portfolio.strategic_front.created`
- `copilot.execution.completed`
- `copilot.execution.failed`
- `copilot.execution.idempotent_replay`
- `copilot.execution.idempotency_conflict`
- `copilot.permission_denied.approval`
- `copilot.permission_denied.execution`

No se guardan secretos. Los payloads completos no se replican en auditoria; se registran IDs, capability, command, organizacion y resultado.

## Errores

Errores cubiertos:

- `ACTION_NOT_APPROVED`
- `ACTION_ALREADY_COMPLETED`
- `STALE_ACTION_VERSION`
- `INVALID_CAPABILITY_PAYLOAD`
- `CAPABILITY_NOT_FOUND`
- `PERMISSION_DENIED`
- `ORGANIZATION_ACCESS_DENIED`
- `IDEMPOTENCY_CONFLICT`
- `EXECUTION_IN_PROGRESS`
- `DOMAIN_VALIDATION_FAILED`
- `COMMAND_EXECUTION_FAILED`
- `PERSISTENCE_FAILED`
- `PARTIAL_EXECUTION`

Los errores se expresan con `AppError` y se registran en `ActionExecution.error` cuando ocurren durante la ejecucion.

## Consistencia

No se declara atomicidad total entre Portfolio y Copilot:

- `PortfolioService` y el ledger Copilot se actualizan en pasos separados;
- si Portfolio falla, el ledger queda `failed`;
- si el frente se crea y luego falla el update de Copilot, el executor devuelve `PARTIAL_EXECUTION`;
- el resultado guarda referencias suficientes para reconciliacion cuando el ledger pudo completarse;
- una ejecucion que queda `executing` debe recuperarse/reconciliarse en un bloque posterior.

## Tests

Archivos agregados:

- `backend/modules/copilot/__tests__/approval.service.test.ts`
- `backend/modules/copilot/__tests__/action-executor.test.ts`
- `backend/modules/copilot/__tests__/create-strategic-front.command.test.ts`
- `backend/modules/copilot/__tests__/copilot-portfolio.integration.test.ts`
- `backend/modules/copilot/__tests__/test-utils.ts`

Cobertura:

- aprobacion valida;
- rechazo y bloqueo de dependencias;
- stale version;
- permiso insuficiente;
- organizacion incorrecta;
- payload invalido;
- capability inexistente;
- invalidacion de aprobacion al editar;
- estados agregados;
- ejecucion aprobada;
- accion no aprobada;
- idempotency replay;
- key en otra accion;
- ejecucion en curso;
- fallo previo;
- fallo de Portfolio;
- command payload correcto;
- integracion PostgreSQL real con un solo `StrategicFront`.

## Validacion ejecutada

| Comando | Resultado |
| --- | --- |
| `npm run typecheck:backend` | GO durante implementacion. |
| `npx vitest run --config vitest.backend.config.ts ../backend/modules/copilot/__tests__` | GO. 8 archivos / 56 tests, 1 integracion skipped por defecto. |
| `COPILOT_DB_INTEGRATION=1 npx vitest run --config vitest.backend.config.ts ../backend/modules/copilot/__tests__/copilot-portfolio.integration.test.ts` | GO contra `starteria_copilot_test`. 1 test crea frente real y replay no duplica. |
| `npx prisma migrate deploy` | GO contra `starteria_copilot_test`. Aplica migracion `20260726183000_add_user_organization_scalar_for_copilot`. |
| `npx prisma migrate status` | GO contra `starteria_copilot_test`. `Database schema is up to date!`. |

La validacion completa queda registrada en la entrega final de la tarea.

## Limitaciones

- No hay endpoints HTTP todavia.
- No hay UI ni `CopilotClient`.
- No hay adapter deterministico de mensaje a plan.
- No hay IA real.
- No hay reconciliador para ejecuciones antiguas que queden `executing`.
- La razon de rechazo vive en AuditLog, no en una columna dedicada.
- `Organization` sigue sin FK ni migracion nueva; `organizationId` es alcance logico.

## Siguiente bloque

1. Endpoints backend internos para aprobar/rechazar/ejecutar.
2. Adapter deterministico de mensaje -> assessment -> plan.
3. Frontend mock contra `CopilotClient`.
4. Frontend HTTP bajo feature flag.
5. Reconciliacion de ejecuciones ambiguas.
6. E2E CreateStrategicFront.

