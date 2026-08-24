# Copilot-first Foundation Block 03

Fecha: 2026-07-27
Estado: implementado en backend HTTP, sin frontend ni IA real.

## Alcance

Este bloque implementa la primera vertical backend recorrible por API:

- `DeterministicCopilotAdapter`;
- orquestacion mensaje -> `IntentAssessment` -> `ActionPlan`;
- continuacion deterministica por clarificacion;
- endpoints HTTP `/api/v1/copilot/*`;
- DTOs seguros;
- aprobacion, rechazo, edicion y ejecucion por HTTP;
- idempotencia HTTP con header `Idempotency-Key`;
- recuperacion de conversacion, mensajes, plan y ejecuciones;
- test vertical API opt-in con PostgreSQL.

Fuera de alcance: UI React, cliente frontend, streaming, IA real, AI bridge, importacion, retos, cohortes, readiness, decisiones y otras capabilities.

## Adapter

Archivo:

- `backend/modules/copilot/application/deterministic-copilot.adapter.ts`

Contrato:

- `CopilotAssessmentAdapter` en `copilot-assessment.adapter.ts`;
- `adapterType = deterministic`;
- `version = deterministic-create-strategic-front.v1`.

El adapter:

- no accede a Prisma;
- no crea planes;
- no aprueba;
- no ejecuta;
- no llama Portfolio;
- no inventa campos faltantes.

Casos soportados:

| Mensaje | Resultado |
| --- | --- |
| Mensaje completo de crear frente | `create_strategic_front`, `CreateStrategicFront`, payload compatible. |
| `Quiero crear un frente de eficiencia operativa.` | Intencion detectada, faltan `objective` y `mainKpi`, sin `ProposedAction`. |
| Mensaje fuera de fixture | `unknown`, `unsupported`, sin capability ni plan. |

## Orchestration

Archivo:

- `backend/modules/copilot/application/copilot-orchestration.service.ts`

Responsabilidades implementadas:

1. valida conversacion y organizacion;
2. guarda mensaje del usuario;
3. cambia conversacion a `interpreting`;
4. llama al adapter;
5. guarda `IntentAssessment`;
6. valida capability;
7. si faltan datos, cambia a `asking_clarification`, guarda mensaje asistente y no crea accion;
8. si el payload esta completo, crea `ActionPlan`, `ProposedAction`, deja plan/conversacion `awaiting_confirmation`;
9. devuelve DTO consumible por frontend;
10. registra auditoria/analytics como detalles de `AuditLog`.

La continuacion por clarificacion combina mensajes de usuario previos de la misma conversacion cuando el ultimo assessment tenia faltantes. No hay memoria semantica ni resumen IA.

## Endpoints

Router:

- `backend/modules/copilot/copilot.router.ts`
- montado en `backend/app.ts` como `/api/v1/copilot`

Endpoints:

| Metodo | Ruta | Estado |
| --- | --- | --- |
| `POST` | `/api/v1/copilot/conversations` | implementado |
| `GET` | `/api/v1/copilot/conversations/:conversationId` | implementado |
| `GET` | `/api/v1/copilot/conversations/:conversationId/messages` | implementado |
| `POST` | `/api/v1/copilot/conversations/:conversationId/messages` | implementado |
| `GET` | `/api/v1/copilot/conversations/:conversationId/intent-assessment` | implementado |
| `GET` | `/api/v1/copilot/conversations/:conversationId/action-plan` | implementado |
| `GET` | `/api/v1/copilot/action-plans/:actionPlanId` | implementado |
| `PATCH` | `/api/v1/copilot/actions/:actionId` | implementado |
| `POST` | `/api/v1/copilot/actions/:actionId/approve` | implementado |
| `POST` | `/api/v1/copilot/actions/:actionId/reject` | implementado |
| `POST` | `/api/v1/copilot/actions/:actionId/execute` | implementado |
| `GET` | `/api/v1/copilot/executions/:executionId` | implementado |
| `GET` | `/api/v1/copilot/actions/:actionId/executions` | implementado |

No se aceptan `userId`, `createdBy` ni `organizationId` arbitrarios desde body para crear conversacion o ejecutar. El controller resuelve el actor desde JWT y `User.organizationId`.

## DTOs

Archivo:

- `backend/modules/copilot/copilot.dto.ts`

DTOs:

- `CopilotConversationDto`
- `CopilotMessageDto`
- `IntentAssessmentDto`
- `ActionPlanDto`
- `ProposedActionDto`
- `ActionExecutionDto`
- `CopilotMessageResponseDto`
- `CopilotErrorDto`

Los DTOs convierten fechas a ISO, conservan enums canonicos, mantienen JSON tipado y no devuelven modelos Prisma directamente.

## Auth

Todos los endpoints usan `authenticate`.

Reglas:

- el usuario viene del JWT;
- `organizationId` se obtiene de `User.organizationId` o membresia disponible;
- una conversacion de otra organizacion devuelve acceso denegado;
- aprobar y ejecutar reutilizan validacion backend de permisos `admin|mentor`;
- el endpoint de ejecucion exige `Idempotency-Key`;
- no hay elevacion de privilegios por usar Copilot.

## Estados

Estados sincronizados:

| Evento | Estado |
| --- | --- |
| conversacion creada | `collecting_context` |
| mensaje recibido | `interpreting` |
| faltantes | `asking_clarification` |
| plan creado | `awaiting_confirmation` |
| ejecucion iniciada | `executing` |
| ejecucion completada | `completed` |
| plan parcialmente completado | `partially_completed` |
| fallo total | `blocked` |

## Errores

Se agregan:

- `IDEMPOTENCY_KEY_REQUIRED`
- `ADAPTER_NOT_AVAILABLE`
- `EMPTY_MESSAGE`
- `ASSESSMENT_NOT_EVALUABLE`
- `ACTION_EXECUTION_NOT_FOUND`

Se reutilizan:

- `CONVERSATION_NOT_FOUND`
- `ACTION_PLAN_NOT_FOUND`
- `PROPOSED_ACTION_NOT_FOUND`
- `CAPABILITY_NOT_FOUND`
- `INVALID_CAPABILITY_PAYLOAD`
- `STALE_ACTION_VERSION`
- `ACTION_NOT_APPROVED`
- `PERMISSION_DENIED`
- `ORGANIZATION_ACCESS_DENIED`
- `IDEMPOTENCY_CONFLICT`
- `DOMAIN_VALIDATION_FAILED`

## Analytics y auditoria

No se crea sistema de analytics nuevo. Se registran eventos como `AuditLog.details.analyticsEvent`:

- `copilot_conversation_created` queda cubierto por `copilot.conversation.created`;
- `copilot_message_sent`;
- `copilot_intent_assessed`;
- `copilot_capability_routed`;
- `copilot_missing_information_requested`;
- `copilot_action_plan_generated`;
- `copilot_plan_resumed`;
- `copilot_action_edited`;
- `copilot_action_approved`;
- `copilot_action_rejected`;
- `copilot_action_execution_completed`;
- `copilot_action_execution_failed`.

El contenido completo del mensaje no se replica en analytics; queda solo como `CopilotMessage` autorizado.

## Variables

```text
COPILOT_ASSESSMENT_ADAPTER=deterministic
```

Comportamiento:

- test: deterministico permitido por defecto;
- development: usar `COPILOT_ASSESSMENT_ADAPTER=deterministic`;
- production: si no se configura adapter, devuelve `ADAPTER_NOT_AVAILABLE`.

## Tests

Archivos agregados:

- `deterministic-copilot.adapter.test.ts`
- `copilot-orchestration.service.test.ts`
- `copilot.dto.test.ts`
- `copilot.router.test.ts`
- `copilot-api-vertical.integration.test.ts`

Cobertura:

- adapter completo/incompleto/desconocido;
- no inventar campos;
- orquestacion crea plan solo con payload completo;
- continuacion por clarificacion;
- DTOs;
- crear conversacion;
- auth requerida;
- enviar mensaje;
- recuperar assessment/plan/mensajes;
- editar y stale version;
- aprobar/rechazar;
- ejecutar sin key falla;
- ejecutar con key;
- replay no duplica;
- scope organizacional;
- error Portfolio normalizado;
- capability desconocida;
- vertical API PostgreSQL opt-in.

## Limitaciones

- No hay frontend ni `CopilotClient`.
- No hay IA real ni AI bridge.
- El adapter deterministico es limitado y orientado a fixtures P0.
- No hay endpoint para aprobar multiples acciones en lote.
- No hay reconciliador de ejecuciones antiguas en `executing`.
- La proyeccion visual no esta comprobada en navegador.

## Riesgos

| Riesgo | Mitigacion actual |
| --- | --- |
| Parser deterministico demasiado estrecho | Tests fixture y documentacion explicita; adapter reemplazable. |
| `organizationId` ausente en usuarios existentes | Endpoint devuelve `ORGANIZATION_ACCESS_DENIED`; migracion Block 02 agrega columna si falta. |
| Produccion sin adapter configurado | Error controlado `ADAPTER_NOT_AVAILABLE`. |
| Atomicidad parcial Portfolio/Copilot | Se conserva ledger e idempotencia de Block 02. |

## Siguiente bloque

1. Cliente frontend `CopilotClient` + mock/http bajo feature flag.
2. UI minima Portfolio Copilot sin IA real.
3. Recuperacion visual de plan y ejecuciones.
4. Reconciliador de ejecuciones ambiguas.
5. E2E backend+frontend con PostgreSQL disponible.
6. Adapter IA real reemplazando al deterministico sin permisos de escritura.
