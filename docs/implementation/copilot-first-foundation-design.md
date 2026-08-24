# Copilot-first Foundation Design: Create Strategic Front

Fecha: 2026-07-26
Alcance: diseno tecnico, sin implementacion, para la primera vertical Copilot-first: crear un frente estrategico desde el Portfolio Copilot.
Estado: propuesta. No modifica frontend, backend, Prisma ni PRDs.

## Actualizacion 2026-07-26 - Block 01 implementado

Alcance implementado: contratos canonicos, persistencia Prisma, repositorio Prisma, servicios basicos `ConversationService`/`ActionPlanService`, `CapabilityRegistry` en codigo, autorizacion conceptual `canCreateStrategicFront` y tests backend para la vertical `CreateStrategicFront`.

Ajustes frente al diseno original:

| Tema | Diseno original | Implementacion Block 01 |
| --- | --- | --- |
| Alcance organizacional | `workspaceId` como abstraccion futura. | `organizationId` obligatorio. No se introduce entidad `Workspace`. |
| Payload P0 | Incluia `workspaceId`, `sponsorId` y `areaOrUnit` como campos conversacionales. | Schema estricto acepta solo `organizationId`, `name`, `objective`, `mainKpi`, `baseline`, `target`, `horizon`, `sponsor`, `priority`, `createdBy`. |
| Sponsor | Decision abierta `sponsorId` vs `sponsor`. | Se conserva `sponsor` string, compatible con `StrategicFront`. No hay relacion nueva. |
| Permisos | Permiso conceptual `portfolio.strategicFront.create`. | Funcion testeable `canCreateStrategicFront(user, organizationId)` con roles actuales `admin|mentor` y validacion de organizacion/membresia. No hay RBAC nuevo. |
| Persistencia | Tablas conversacion/assessment/plan/action/execution/projection. | Block 01 implementa `CopilotConversation`, `CopilotMessage`, `IntentAssessment`, `ActionPlan`, `ProposedAction`, `ActionExecution`. `ProjectionLink` queda como JSON dentro de `ActionExecution`. `organizationId` queda como escalar indexado, sin FK a `Organization`, porque la historia de migraciones no crea esa tabla desde cero. |
| Ejecucion | `ActionExecutor` y command futuro. | No implementado. Solo modelo persistente de `ActionExecution` pendiente e idempotency key unique. |
| Integracion Portfolio | Command futuro delega en `PortfolioService`. | No implementado. El modulo Copilot no importa `PortfolioService` ni escribe `StrategicFront`. |
| APIs/frontend | Endpoints y UI futura. | No implementado. No se crean rutas HTTP ni UI. |

## Actualizacion 2026-07-26 - Block 02 implementado

Alcance implementado: aprobacion/rechazo backend de `ProposedAction`, invalidacion explicita de aprobacion al editar, `ActionExecutor`, `CreateStrategicFrontCommandHandler`, idempotencia funcional, auditoria de ejecucion e integracion real con `PortfolioService.createStrategicFront`.

Ajustes frente al diseno:

| Tema | Decision Block 02 |
| --- | --- |
| `organizationId` | Sigue como referencia logica validada por aplicacion. No se agrega FK hacia `Organization`. |
| Migracion | Se agrega una migracion aditiva para `User.organizationId`, campo ya presente en el schema Prisma pero ausente en migraciones limpias. |
| Rechazo | La razon se registra en `AuditLog.details`, no en una columna nueva de `ProposedAction`. |
| Proyeccion | Se guarda como JSON tipado dentro de `ActionExecution.projectionLinks`; no se crea tabla `ProjectionLink`. |
| Consistencia | No se declara transaccion unica entre Portfolio y Copilot; se registra ledger y referencias para reconciliacion. |
| Scope | No se implementan endpoints, frontend, adapter deterministico ni IA real. |

## Actualizacion 2026-07-27 - Block 03 implementado

Alcance implementado: adapter deterministico inicial, orquestacion mensaje -> `IntentAssessment` -> `ActionPlan`, continuacion por clarificacion, DTOs backend y endpoints HTTP `/api/v1/copilot` para conversaciones, mensajes, planes, edicion, aprobacion, rechazo, ejecucion y recuperacion de executions.

| Tema | Decision Block 03 |
| --- | --- |
| Adapter | `DeterministicCopilotAdapter` soporta solo `CreateStrategicFront`; no accede a Prisma, Portfolio ni comandos. |
| Configuracion | `COPILOT_ASSESSMENT_ADAPTER=deterministic`; en produccion sin adapter configurado responde `ADAPTER_NOT_AVAILABLE`. |
| Mensaje incompleto | Guarda mensaje y assessment, cambia conversacion a `asking_clarification`, no crea `ProposedAction`. |
| Mensaje desconocido | Persiste assessment `unknown/unsupported`, no crea plan ni muta datos. |
| HTTP auth | Todos los endpoints usan JWT; `organizationId` sale de `User.organizationId`/membresia, no del body. |
| Idempotencia HTTP | `POST /actions/:id/execute` exige header `Idempotency-Key` y delega la idempotencia real al `ActionExecutor`. |
| Scope | No se implementan frontend, IA real, streaming, uploads, importacion, retos, cohortes, readiness ni otras capabilities. |

## 1. Resumen ejecutivo

La fundacion minima propone un bounded context `copilot` que orquesta conversaciones, interpretacion deterministica, planes de accion, aprobaciones, ejecuciones, auditoria e idempotencia. El dominio Portfolio conserva la propiedad de `StrategicFront` y de sus reglas. Copilot no crea ni persiste frentes directamente: solo ejecuta un `CreateStrategicFrontCommand` aprobado que delega en `PortfolioService.createStrategicFront`.

Secuencia obligatoria:

```text
Mensaje del usuario
-> IntentAssessment
-> seleccion de capability
-> ActionPlan
-> ProposedAction
-> edicion opcional
-> aprobacion humana
-> validacion deterministica
-> CreateStrategicFrontCommand
-> servicio propietario de Portfolio
-> persistencia
-> evento
-> ActionExecution
-> actualizacion del mapa estrategico
-> confirmacion en el Copiloto
```

P0 usa un adapter deterministico para desarrollo y tests. El AI bridge existente queda fuera de la escritura y no se conecta a un proveedor real en esta vertical.

## 2. Estado actual reutilizable

### 2.1 Inspeccion solicitada

| Area inspeccionada | Estado real | Reutilizacion o vacio |
| --- | --- | --- |
| Estructura backend | `backend/app.ts` monta routers bajo `/api/v1`. Modulos existentes: auth, portfolio, ai, initial-review, companies, public, billing, steps, etc. | Agregar futuro `backend/modules/copilot` y router `/api/v1/copilot` bajo flag. |
| Estructura frontend | Vite/React en `front/src/app` y features en `front/src/features`. Portfolio Lead vive en `front/src/features/portfolio-lead` y paginas bajo `front/src/app/pages`. | Agregar futuro `front/src/features/copilot` sin reemplazar flujo manual. |
| Entidades Prisma | `StrategicFront`, `Challenge`, `Initiative`, `AuditLog`, `UsageEvent`, `InitialReview`, etc. | Reutilizar `StrategicFront` existente. Agregar tablas Copilot en migracion futura. |
| Servicios y repositorios | Prisma compartido en `backend/shared/db/prisma.ts`; servicios por modulo. Portfolio usa `PortfolioService`. | Copilot debe llamar servicios de dominio, no acceder a tablas Portfolio como propietario. |
| Controllers/endpoints | Portfolio expone `/api/v1/portfolio/strategic-fronts`; create usa `POST` protegido. No existe `/copilot`. | Crear endpoints Copilot futuros para conversacion, plan, aprobacion y ejecucion. |
| Creacion actual de `StrategicFront` | `PortfolioController.createStrategicFront` valida body y delega en `PortfolioService.createStrategicFront`. | `CreateStrategicFrontCommand` debe delegar ahi o en una extraccion equivalente del dominio Portfolio. |
| Modelos Portfolio Lead | Frontend tiene tipos y adaptadores ricos en `portfolio-lead/domain/*`; backend/DB tiene contrato mas acotado. | Copilot debe apuntar al contrato backend/DB y usar adaptadores solo para UI futura. |
| Autenticacion/permisos | `authenticate`, `requireRole`. Crear/editar/borrar frentes requiere `admin` o `mentor`. Roles DB: `participante`, `mentor`, `admin`, `sponsor`, `colaborador`, `viewer`. | No inventar rol nuevo. P0 usa permiso logico `portfolio.strategicFront.create` resuelto como `admin|mentor`. |
| Auditoria/activity logs | Modelo `AuditLog` con `action`, `resource`, `resourceId`, `details`, ip, userAgent. No se observo bus formal de eventos de dominio. | Usar `AuditLog` como evidencia persistida P0 y definir eventos logicos. |
| Eventos de dominio | No hay infraestructura transversal evidente para eventos de dominio Portfolio. | P0 registra eventos logicos en auditoria; event bus queda extension futura. |
| API client frontend | `front/src/app/services/api.ts` usa axios, `VITE_API_URL || /api/v1`, bearer token y refresh 401. | `HttpCopilotClient` debe reutilizar este cliente. |
| State management frontend | Contextos React: `PortfolioLeadContext` mantiene frentes, retos, iniciativas y acciones manuales. | Copilot UI futura no debe mutar optimisticamente Portfolio como fuente de verdad; refresca tras execution. |
| AI bridge actual | `backend/modules/ai/bridge.service.ts` llama ai-service con token interno, retry y circuit breaker. | No usar en P0. En futuro solo para assessment/propuesta, nunca para escritura directa. |
| Persistencia de conversaciones/revisiones | Initial review persiste snapshots, chat events y respuestas; no hay conversaciones Copilot generales. | Patron util para determinismo/chat, pero nuevo modelo Copilot separado. |
| Feature flags | `front/src/app/services/featureFlags.ts` soporta flags Vite existentes como PDF. | Agregar flags Copilot futuros en front/back. |
| Convenciones de tests | Vitest backend y frontend; Playwright formalizado pero requiere Docker/Postgres. | Tests P0 unit/integration/contracts; E2E queda para stack disponible. |

### 2.2 StrategicFront canonico real

Fuente canonica de persistencia: `front/prisma/schema.prisma`.

Campos actuales:

| Campo | Tipo actual | Nota para Copilot |
| --- | --- | --- |
| `id` | string | Generado por Prisma. |
| `name` | string | Unico obligatorio observado en schema backend. |
| `description` | string? | Opcional. |
| `strategicObjective` | string? | Mapea el `objective` conversacional. |
| `whyNow` | string? | Opcional. |
| `mainKpi` | string? | Opcional. |
| `baseline` | string? | Opcional. |
| `target` | string? | Opcional. |
| `horizon` | string? | Opcional. |
| `sponsor` | string? | Texto, no `sponsorId`. |
| `status` | `draft|active|paused|closed` | Default `draft`. |
| `priority` | `Alta|Media|Baja` | Default `Media`. |
| `organizationId` | string? | Mejor equivalente actual de `workspaceId`. |
| `ownerId` | string? | Mejor equivalente actual de `createdBy`/owner. |
| `createdAt`, `updatedAt` | DateTime | Prisma. |

El payload solicitado por producto se interpreta asi para evitar un segundo modelo:

| Payload conversacional solicitado | Campo actual compatible | Decision P0 |
| --- | --- | --- |
| `name` | `name` | Persistible. |
| `objective` | `strategicObjective` | DTO Copilot puede aceptar `objective`, command envia `strategicObjective`. |
| `mainKpi` | `mainKpi` | Persistible. |
| `baseline` | `baseline` | Persistible. |
| `target` | `target` | Persistible. |
| `horizon` | `horizon` | Persistible. |
| `sponsorId` opcional | No existe. Existe `sponsor` string. | No persistir como id en P0 sin migracion. Puede quedar en metadata/propuesta y requiere decision. |
| `priority` | `priority` | Persistible con `Alta|Media|Baja`. |
| `areaOrUnit` | No existe en DB/backend; existe `area` en tipos frontend no persistidos. | No enviar al servicio Portfolio actual. Requiere decision/migracion si debe persistirse. |
| `workspaceId` | `organizationId` o scope Copilot | Usar como scope Copilot; mapear a `organizationId` solo si representa organizacion. |
| `createdBy` | `ownerId` | Persistible como owner si el dominio lo acepta. |

## 3. Bounded contexts

| Contexto | Responsabilidad | No debe hacer |
| --- | --- | --- |
| `copilot` | Orquestar mensajes, assessments, capabilities, planes, aprobaciones, ejecuciones, auditoria, idempotencia y links de proyeccion. | Ser propietario de `StrategicFront`, duplicar reglas Portfolio o escribir con AI bridge. |
| `portfolio` | Validar y persistir `StrategicFront`, retos y objetos de gobernanza Portfolio. | Conocer detalles conversacionales o prompts. |
| `auth` | Autenticar usuario y exponer rol/claims. | Delegar autorizacion final al frontend. |
| `ai` | Adapter futuro para inferencia/propuesta. | Ejecutar comandos o escribir DB. |
| `frontend portfolio-lead` | Mostrar copilot, plan y mapa; refrescar datos reales. | Crear frentes directamente en nombre del Copilot. |

## 4. Arquitectura propuesta

```text
Portfolio Copilot UI
  -> CopilotClient
  -> /api/v1/copilot
  -> CopilotController
  -> CopilotOrchestrator
       -> DeterministicCopilotAdapter
       -> CapabilityRegistry
       -> ActionPlanService
       -> ApprovalService
       -> ActionExecutor
            -> Permission check backend
            -> IdempotencyService
            -> CreateStrategicFrontCommand
            -> PortfolioService.createStrategicFront
            -> AuditLog/event record
            -> ProjectionService
```

Componentes existentes reutilizados:

| Archivo existente | Uso previsto |
| --- | --- |
| `backend/modules/portfolio/portfolio.service.ts` | Servicio propietario de creacion real. |
| `backend/modules/portfolio/portfolio.schemas.ts` | Validacion compatible del payload final. |
| `backend/modules/portfolio/portfolio.router.ts` | Referencia de permiso actual `admin|mentor`. |
| `backend/modules/auth/auth.middleware.ts` | `authenticate` y roles actuales. |
| `backend/shared/errors/AppError.ts` | Errores controlados. |
| `backend/shared/errors/error-handler.ts` | Envelope API existente. |
| `backend/shared/db/prisma.ts` | Prisma compartido para tablas Copilot y auditoria. |
| `front/prisma/schema.prisma` | `StrategicFront` canonico y modelos Copilot futuros. |
| `front/src/app/services/api.ts` | Base de `HttpCopilotClient`. |
| `front/src/app/services/portfolioService.ts` | Refresh posterior de lista/mapa, no ejecucion Copilot. |
| `front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx` | Rehidratacion de estado Portfolio despues del comando. |
| `front/src/app/pages/PortfolioLeadHomePage.tsx` | Superficie futura del shell Copilot. |
| `front/src/app/pages/PortfolioLeadStrategicFrontsPage.tsx` | Vista/proyeccion de frentes y atajo manual protegido. |
| `backend/modules/initial-review/*` | Referencia de adapter deterministico y persistencia de eventos, sin acoplar dominios. |
| `backend/modules/ai/bridge.service.ts` | Boundary futuro de inferencia, no usado en P0. |

Vacios reales:

- No existe bounded context `copilot`.
- No existen tablas para conversaciones, mensajes, planes, acciones, ejecuciones, links o idempotencia Copilot.
- No hay capability registry formal.
- No hay modelo de aprobacion humana versionada.
- No hay command executor idempotente.
- No hay event bus de dominio formal; solo `AuditLog` puede cubrir evidencia inicial.
- No hay permiso granular `portfolio.strategicFront.create`; debe mapearse a roles existentes.
- `sponsorId`, `areaOrUnit` y `workspaceId` no tienen equivalencia 1:1 persistible en `StrategicFront`.

## 5. Objetos

Convenciones:

- IDs Prisma `cuid()`.
- Versionado entero monotono por entidades editables.
- Payloads JSON con `schemaVersion`.
- Errores con envelope existente `{ success:false, error:{ code, message, hint, details, requestId } }`.
- Fechas `createdAt`, `updatedAt`, `approvedAt`, `startedAt`, `completedAt`, `failedAt` segun corresponda.
- No guardar tokens, passwords ni prompt raw sensible fuera de la conversacion autorizada.

### 5.1 CopilotConversation

Proposito: raiz recuperable de una interaccion Copilot dentro de un workspace/contexto.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `workspaceId` | string | Scope de workspace; P0 puede mapearlo a `organizationId` si aplica. |
| `workspaceType` | `portfolio` | P0 fijo. |
| `userId` | string | Autor inicial. |
| `context` | Json | Ruta, modulo, filtros, feature flags, datos leidos permitidos. |
| `contextObjectType` | string? | Ej. `portfolio_home`, `strategic_front`. |
| `contextObjectId` | string? | Opcional. |
| `status` | enum | Estados de seccion 6. |
| `activeActionPlanId` | string? | Plan vigente. |
| `title` | string? | Derivado del primer mensaje. |
| `version` | number | Incrementa en cambios estructurales. |
| `createdAt`, `updatedAt` | DateTime | Recuperacion y orden. |

Relaciones: 1:N `CopilotMessage`, 1:N `IntentAssessment`, 1:N `ActionPlan`, 1:N `ActionExecution`.

Persistencia: tabla `CopilotConversation`.

Invariantes:

- Siempre tiene usuario autenticado.
- Solo el owner o `admin` puede leerla en P0.
- `completed`, `cancelled` y `blocked` no aceptan nuevos mensajes de ejecucion sin crear una nueva conversacion/version.
- Debe poder recuperarse tras refresh con ultimo plan y ejecuciones.

Permisos:

- Crear/leer: autenticado y owner.
- Ejecutar acciones dentro de ella: permiso de capability en backend.

Errores: `conversation_not_found`, `permission_denied`, `execution_failed`.

### 5.2 CopilotMessage

Proposito: log append-only de mensajes visibles y sistemicos.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `conversationId` | string | FK. |
| `role` | `user|assistant|system` | P0 deterministico no implica modelo externo. |
| `content` | string | Texto visible. |
| `type` | `free_text|clarification|plan_summary|approval_request|execution_result|error` | Semantica UI. |
| `sourceReferences` | Json[] | Mensajes, docs, objetos Portfolio usados. |
| `status` | `received|processed|failed|superseded` | Procesamiento del mensaje. |
| `metadata` | `CopilotAuditMetadata` | Auditoria. |
| `createdAt` | DateTime | Timestamp. |

Relaciones: N:1 conversation; puede apuntar a `IntentAssessment`.

Persistencia: tabla `CopilotMessage`.

Invariantes:

- Append-only; una correccion genera otro mensaje.
- Un `execution_result` solo aparece despues de una `ActionExecution` final.
- `content` no puede estar vacio para `role=user`.

Permisos: mismos de la conversacion.

Errores: `invalid_payload`, `conversation_not_found`.

### 5.3 IntentAssessment

Proposito: interpretacion versionada del mensaje y seleccion de capability candidata.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `conversationId` | string | FK. |
| `messageId` | string | Mensaje original. |
| `originalMessage` | string | Snapshot normalizado. |
| `primaryIntent` | `create_strategic_front|unknown|read_portfolio` | P0 ejecutable solo create. |
| `operation` | `create|read|clarify|unsupported` | Operacion detectada. |
| `detectedEntities` | Json | Campos extraidos. |
| `ambiguousObjects` | Json[] | Objetos candidatos ambiguos. |
| `missingInformation` | string[] | Campos faltantes. |
| `suggestedCapabilities` | string[] | Debe existir en registry. |
| `confidence` | `low|medium|high|not_evaluable` | Heuristica P0. |
| `sourcesUsed` | Json[] | Mensaje, contexto, schemas. |
| `promptOrRubricVersion` | string | Ej. `deterministic-create-front.v1`. |
| `status` | `generated|needs_clarification|not_evaluable|superseded` | Estado propio. |
| `createdAt` | DateTime | Timestamp. |

Relaciones: N:1 conversation; 1:N action plans.

Persistencia: tabla `IntentAssessment`.

Invariantes:

- No ejecuta ni persiste objetos Portfolio.
- Si sugiere una capability, esta debe existir y estar habilitada.
- No inventa campos criticos no presentes; marca faltantes.

Permisos: lectura/escritura interna asociada a conversacion.

Errores: `capability_not_found`, `missing_required_input`.

### 5.4 ActionPlan

Proposito: plan versionado y recuperable con acciones propuestas y dependencias.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `conversationId` | string | FK. |
| `intentAssessmentId` | string | FK. |
| `summary` | string | Resumen visible. |
| `status` | enum | Estados de seccion 6. |
| `version` | number | Incrementa al reemplazar plan. |
| `proposedActions` | ProposedAction[] | P0 una accion. |
| `dependencies` | Json[] | P0 vacio, preparado. |
| `contextUsed` | Json | Contexto de lectura permitido. |
| `createdBy` | string | Usuario/sistema. |
| `supersedesPlanId` | string? | Version nueva. |
| `createdAt`, `updatedAt` | DateTime | Timestamps. |

Relaciones: N:1 conversation, N:1 assessment, 1:N proposed actions.

Persistencia: tabla `ActionPlan`.

Invariantes:

- No hay plan ejecutable sin al menos una ProposedAction.
- `approved` exige que todas las acciones ejecutables esten aprobadas.
- Nueva version marca plan anterior como `superseded`.

Permisos: owner puede ver/editar antes de aprobacion; aprobar/ejecutar exige capability permission.

Errores: `action_plan_not_found`, `stale_action_version`, `action_not_approved`.

### 5.5 ProposedAction

Proposito: accion concreta, editable y aprobable, que referencia una capability registrada.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `actionPlanId` | string | FK. |
| `capabilityId` | string | P0 `CreateStrategicFront`. |
| `ownerPrd` | string | `PRD-06`. |
| `operation` | `create` | P0. |
| `commandType` | string | `CreateStrategicFrontCommand`. |
| `title` | string | Texto visible. |
| `explanation` | string | Razon y supuestos. |
| `proposedPayload` | Json | Payload editable. |
| `editableFields` | string[] | Campos editables. |
| `requiredPermissions` | string[] | Snapshot. |
| `requiresConfirmation` | boolean | true. |
| `dependencies` | string[] | IDs de acciones previas. |
| `status` | enum | Estados de seccion 6. |
| `version` | number | Incrementa con edicion. |
| `payloadHash` | string | Hash canonical JSON. |
| `approvedPayloadHash` | string? | Hash aprobado. |
| `approvedBy` | string? | Usuario. |
| `approvedAt` | DateTime? | Timestamp. |
| `rejectedBy` | string? | Usuario. |
| `rejectedAt` | DateTime? | Timestamp. |
| `rejectionReason` | string? | Motivo opcional. |
| `createdAt`, `updatedAt` | DateTime | Timestamps. |

Relaciones: N:1 action plan; 1:N executions.

Persistencia: tabla `ProposedAction`.

Invariantes:

- `capabilityId` y `commandType` deben coincidir con registry.
- Edicion posterior a aprobacion invalida `approvedPayloadHash`.
- Una accion `rejected` no se ejecuta.
- Una accion `completed` no se reejecuta para crear otro frente.

Permisos: editar owner antes de execution; aprobar/ejecutar `admin|mentor`.

Errores: `action_not_approved`, `stale_action_version`, `permission_denied`.

### 5.6 ActionExecution

Proposito: ledger idempotente de ejecucion de una ProposedAction.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `proposedActionId` | string | FK. |
| `conversationId` | string | Denormalizado para recuperacion. |
| `actionPlanId` | string | Denormalizado. |
| `idempotencyKey` | string | Unique. |
| `approvedBy` | string | Usuario aprobador. |
| `executedBy` | string | Usuario que dispara ejecucion. |
| `status` | enum | Estados de seccion 6. |
| `attempt` | number | Intentos controlados. |
| `commandType` | string | `CreateStrategicFrontCommand`. |
| `commandPayload` | Json | Snapshot exacto. |
| `payloadHash` | string | Debe coincidir con aprobado. |
| `result` | CommandExecutionResult? | Resultado normalizado. |
| `error` | Json? | Error persistido. |
| `createdObjects` | Json[] | Objetos creados. |
| `updatedObjects` | Json[] | P0 vacio. |
| `projectionLinks` | ProjectionLink[] | Links recuperables. |
| `createdAt`, `updatedAt`, `startedAt`, `completedAt`, `failedAt` | DateTime? | Timestamps. |

Relaciones: N:1 proposed action; 1:N projection links.

Persistencia: tabla `ActionExecution`.

Invariantes:

- Unique `idempotencyKey`.
- Misma key completada devuelve mismo resultado.
- Misma key en curso devuelve estado actual.
- Mismo action con distinto payload hash es `idempotency_conflict`.

Permisos: consultar owner/admin; ejecutar usuario autenticado con permiso de capability.

Errores: `idempotency_conflict`, `execution_failed`, `partial_execution`.

### 5.7 CapabilityDefinition

Proposito: contrato versionado que declara que una capacidad puede proponerse y ejecutarse.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | `CreateStrategicFront`. |
| `ownerPrd` | string | `PRD-06`. |
| `supportedIntents` | string[] | Intenciones. |
| `operation` | string | `create`. |
| `requiredInputs` | string[] | Inputs bloqueantes. |
| `optionalInputs` | string[] | Inputs enriquecedores. |
| `requiredPermissions` | string[] | Permisos logicos. |
| `requiresConfirmation` | boolean | true. |
| `commandType` | string | Tipo registrado. |
| `inputSchema` | schema ref | Zod/JSON schema. |
| `outputSchema` | schema ref | Zod/JSON schema. |
| `resultProjection` | string[] | Views destino. |
| `version` | string | Ej. `2026-07-26.p0`. |
| `status` | `draft|enabled|disabled|deprecated` | Estado registry. |

Persistencia: P0 registry estatico en codigo con snapshot en `ActionPlan.capabilitySnapshot`. Tabla administrativa opcional P1.

Invariantes:

- No ejecutar capability no registrada o deshabilitada.
- Cambios incompatibles requieren nueva version.
- `commandType` debe pertenecer al dominio owner esperado.

Errores: `capability_not_found`, `invalid_payload`.

### 5.8 CapabilityRegistry

Proposito: registrar, consultar y validar capabilities sin dispatch dinamico inseguro.

Diseno:

- Registro estatico P0 en `backend/modules/copilot/capabilities`.
- API interna `getById(id)`, `findByIntent(intent)`, `validatePayload(id,payload)`, `assertCommandOwner(id,commandType,domain)`.
- Cada definition incluye `version`; el `ActionPlan` guarda snapshot para reproducibilidad.
- El executor solo acepta comandos enlazados en registry, no strings arbitrarios.
- El command handler se registra explicitamente: `CreateStrategicFrontCommand -> PortfolioCommandAdapter`.

Versionado:

- `capability.version` semantica o fecha `2026-07-26.p0`.
- Payload schemas con `schemaVersion`.
- Nueva version de schema no modifica planes existentes; crea nuevos planes.

Errores:

- `capability_not_found` si no existe.
- `invalid_payload` si schema no valida.
- `execution_failed` si command handler no coincide con dominio.

### 5.9 CommandExecutionResult

Proposito: envelope interno estandar para resultados de comandos.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `success` | boolean | Discriminante. |
| `commandType` | string | Ejecutado. |
| `createdObjects` | `{type,id,label?}[]` | P0 `StrategicFront`. |
| `updatedObjects` | `{type,id,label?}[]` | P0 vacio. |
| `domainEvents` | `{type,id?,payload?}[]` | Eventos logicos/audit. |
| `warnings` | `{code,message}[]` | Ej. projection warning. |
| `errors` | `{code,message,stage,retryable}[]` | Si falla. |
| `projectionLinks` | ProjectionLink[] | Destinos UI. |
| `schemaVersion` | string | `command-result.v1`. |

Invariantes:

- `success=true` requiere objeto de dominio confirmado por servicio Portfolio.
- Si hay `createdObjects.StrategicFront`, debe haber al menos un link o warning `projection_failed`.

### 5.10 ProjectionLink

Proposito: recuperar y abrir la representacion visual despues de ejecutar.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | cuid. |
| `actionExecutionId` | string | FK. |
| `objectType` | string | `StrategicFront`. |
| `objectId` | string | ID creado. |
| `viewId` | string | `portfolio.strategic_map` o `portfolio.strategic_fronts`. |
| `route` | string | Ruta frontend futura. |
| `label` | string | Nombre del frente. |
| `status` | `pending|available|failed` | Proyeccion. |
| `createdAt` | DateTime | Timestamp. |

Invariantes:

- No se marca `available` si el objeto no existe.
- Si falla la proyeccion, el comando puede quedar `completed` con warning.

### 5.11 CopilotAuditMetadata

Proposito: metadata comun para trazabilidad.

Campos:

| Campo | Tipo | Notas |
| --- | --- | --- |
| `conversationId` | string | Conversacion. |
| `intentAssessmentId` | string? | Assessment. |
| `selectedCapabilityId` | string? | Capability. |
| `actionPlanId` | string? | Plan. |
| `initialPayloadHash` | string? | Payload inicial. |
| `editedPayloadHash` | string? | Payload editado. |
| `approvedBy` | string? | Aprobador. |
| `executionId` | string? | Ejecucion. |
| `resultSummary` | Json? | Resultado. |
| `errors` | Json[] | Errores. |
| `modelOrAdapter` | string | P0 `deterministic.v1`. |
| `requestId` | string? | Middleware. |
| `actorUserId` | string | Usuario. |
| `actorRole` | string | Rol actual. |
| `ipAddress` | string? | Request. |
| `userAgent` | string? | Request. |
| `timestamps` | Json | Etapas. |

Persistencia:

- JSON en entidades Copilot.
- Resumen en `AuditLog.details`.

Invariantes:

- Registrar tanto intentos exitosos como rechazados/denegados.
- No almacenar secretos.

## 6. Estados

### 6.1 CopilotConversation

| Desde | Hacia | Actor | Preconditions | Efectos | Errores | Evento |
| --- | --- | --- | --- | --- | --- | --- |
| new | `collecting_context` | backend | Conversacion creada con auth | Persiste conversation y contexto inicial | `invalid_payload`, `permission_denied` | `CopilotConversationCreated` |
| `collecting_context` | `interpreting` | user/backend | Mensaje valido recibido | Persiste message, inicia assessment | `conversation_not_found` | `copilot_message_sent` |
| `interpreting` | `asking_clarification` | backend | Faltan inputs bloqueantes | Crea pregunta y assessment | `missing_required_input` | `IntentAssessed` |
| `interpreting` | `proposal_ready` | backend | Capability encontrada y payload suficiente para propuesta | Crea ActionPlan draft | `capability_not_found`, `invalid_payload` | `ActionPlanCreated` |
| `proposal_ready` | `awaiting_confirmation` | backend | ProposedAction generada | Expone plan aprobable | `projection_failed` no aplica aun | `ActionPlanCreated` |
| `awaiting_confirmation` | `executing` | user/backend | Accion aprobada y execute solicitado | Crea ActionExecution | `action_not_approved`, `permission_denied` | `ActionExecutionStarted` |
| `executing` | `completed` | backend | Todas las acciones completadas | Mensaje de confirmacion y links | `projection_failed` puede quedar warning | `ActionExecutionCompleted` |
| `executing` | `partially_completed` | backend | Algunas acciones fallan | Resultado parcial | `partial_execution` | `ActionExecutionFailed` |
| any open | `blocked` | backend | Error no recuperable o decision requerida | Detiene ejecucion | `execution_failed` | `ActionExecutionFailed` |
| any open | `cancelled` | user | Usuario cancela | Marca plan/acciones canceladas | `stale_action_version` | `ProposedActionRejected` |

### 6.2 ActionPlan

| Desde | Hacia | Actor | Preconditions | Efectos | Errores | Evento |
| --- | --- | --- | --- | --- | --- | --- |
| new | `draft` | backend | Assessment completado | Crea plan versionado | `invalid_payload` | `ActionPlanCreated` |
| `draft` | `awaiting_confirmation` | backend | Al menos una ProposedAction | Plan visible | `capability_not_found` | `ActionPlanCreated` |
| `awaiting_confirmation` | `partially_approved` | user/backend | Subconjunto aprobado | Registra aprobaciones parciales | `permission_denied` | `ProposedActionApproved` |
| `awaiting_confirmation` | `approved` | user/backend | Todas las acciones aprobadas | Registra hash/aprobador | `stale_action_version` | `ProposedActionApproved` |
| `awaiting_confirmation` | `cancelled` | user | Rechazo total/cancelacion | Acciones no ejecutables | `action_plan_not_found` | `ProposedActionRejected` |
| `awaiting_confirmation` | `superseded` | backend | Nuevo plan versionado | Mantiene auditoria, oculta plan viejo | `stale_action_version` | `ActionPlanCreated` |
| `partially_approved`/`approved` | `executing` | user/backend | Execute solicitado | Crea executions | `action_not_approved` | `ActionExecutionStarted` |
| `executing` | `completed` | backend | Todas completadas | Resultado final | `projection_failed` warning | `ActionExecutionCompleted` |
| `executing` | `partially_completed` | backend | Al menos una completada y otra fallida/rechazada | Registra parcial | `partial_execution` | `ActionExecutionFailed` |
| `executing` | `failed` | backend | Ninguna accion completada | Error recuperable/no recuperable | `execution_failed` | `ActionExecutionFailed` |

### 6.3 ProposedAction

| Desde | Hacia | Actor | Preconditions | Efectos | Errores | Evento |
| --- | --- | --- | --- | --- | --- | --- |
| new | `proposed` | backend | Capability valida | Guarda payload/hash | `capability_not_found` | `ActionPlanCreated` |
| `proposed` | `edited` | user | Version vigente y no executing | Actualiza payload, incrementa version | `stale_action_version`, `invalid_payload` | `ProposedActionEdited` |
| `proposed`/`edited` | `approved` | user/backend | Permiso y hash vigente | Guarda aprobador/hash | `permission_denied`, `stale_action_version` | `ProposedActionApproved` |
| `approved` | `edited` | user | Usuario cambia payload | Invalida aprobacion previa | `stale_action_version` | `ProposedActionEdited` |
| `proposed`/`edited`/`approved` | `rejected` | user | Accion no ejecutada | Registra motivo | `action_plan_not_found` | `ProposedActionRejected` |
| `approved` | `executing` | backend | Hash aprobado coincide | Crea execution | `action_not_approved` | `ActionExecutionStarted` |
| `executing` | `completed` | backend | Command exitoso | Guarda objetos/links | `projection_failed` warning | `StrategicFrontCreated` |
| `executing` | `failed` | backend | Command falla | Guarda error retryable | `domain_validation_failed`, `persistence_failed` | `ActionExecutionFailed` |
| any open | `blocked` | backend | Decision producto requerida | No ejecutable | `missing_required_input` | `ActionExecutionFailed` |
| any open | `cancelled` | user | Cancelacion | No ejecutable | `stale_action_version` | `ProposedActionRejected` |

### 6.4 ActionExecution

| Desde | Hacia | Actor | Preconditions | Efectos | Errores | Evento |
| --- | --- | --- | --- | --- | --- | --- |
| new | `pending` | backend | Key reservada | Ledger creado | `idempotency_conflict` | `ActionExecutionStarted` |
| `pending` | `validating` | backend | Accion aprobada | Valida schema/permiso/hash | `invalid_payload`, `permission_denied`, `action_not_approved` | `ActionExecutionStarted` |
| `validating` | `executing` | backend | Validacion ok | Invoca command handler | `domain_validation_failed` | `ActionExecutionStarted` |
| `executing` | `completed` | backend | Portfolio devuelve objeto | Guarda result/eventos/links | `projection_failed` warning | `ActionExecutionCompleted` |
| `executing` | `failed` | backend | Command no completa | Guarda error | `persistence_failed`, `execution_failed` | `ActionExecutionFailed` |
| any | `idempotent_replay` | backend | Misma key y completed/running | Devuelve resultado/estado previo | `idempotency_conflict` | none o audit replay |
| `executing` | `partially_completed` | backend | Objeto creado pero proyeccion/audit secundaria falla | Registra warning y recuperacion | `projection_failed`, `partial_execution` | `ActionExecutionCompleted` con warning |

## 7. APIs

Base path: `/api/v1/copilot`. Todos los endpoints requieren `authenticate`.

| Metodo | Ruta | Request | Response | Permisos | Errores | Idempotencia |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/conversations` | `{ workspaceId, workspaceType:'portfolio', context? }` | `{ success:true, data: CopilotConversation }` | Auth owner | `invalid_payload`, `permission_denied` | `clientConversationId` opcional para dedupe futuro. |
| GET | `/conversations/:id` | params | Conversacion + mensajes + latest assessment + plans + executions | Owner/admin | `conversation_not_found`, `permission_denied` | N/A. |
| POST | `/conversations/:id/messages` | `{ content, clientMessageId?, context? }` | Mensaje + IntentAssessment + ActionPlan opcional | Owner | `invalid_payload`, `conversation_not_found`, `capability_not_found` | `clientMessageId` unique por conversation. |
| GET | `/conversations/:id/messages` | params, cursor? | Lista paginada | Owner/admin | `conversation_not_found` | N/A. |
| GET | `/intent-assessments/:id` | params | IntentAssessment | Owner/admin | `conversation_not_found` | N/A. |
| GET | `/action-plans/:id` | params | ActionPlan + actions + executions | Owner/admin | `action_plan_not_found` | N/A. |
| PATCH | `/proposed-actions/:id` | `{ expectedVersion, proposedPayload }` | ProposedAction actualizada | Owner antes de executing | `stale_action_version`, `invalid_payload` | Version check. |
| POST | `/proposed-actions/:id/approve` | `{ expectedVersion, expectedPayloadHash }` | ProposedAction aprobada | `portfolio.strategicFront.create` -> `admin|mentor` | `permission_denied`, `stale_action_version`, `invalid_payload` | Hash aprobado evita replay con payload distinto. |
| POST | `/proposed-actions/:id/reject` | `{ expectedVersion, reason? }` | ProposedAction rechazada | Owner o aprobador permitido | `stale_action_version` | No reejecutable. |
| POST | `/action-plans/:id/approve` | `{ actionIds?, expectedPlanVersion }` | Plan parcial/total aprobado | Permiso por accion | `permission_denied`, `stale_action_version` | Cada accion guarda hash. |
| POST | `/action-plans/:id/execute` | `{ actionIds?, idempotencyKey? }` | Ejecuciones creadas/recuperadas | Permiso por accion | `action_not_approved`, `idempotency_conflict` | Key por accion+hash; endpoint multi preparado. |
| POST | `/proposed-actions/:id/execute` | `{ idempotencyKey? }` | ActionExecution | `admin|mentor` | `action_not_approved`, `permission_denied`, `execution_failed` | Key unica obligatoria generada si no llega. |
| GET | `/executions/:id` | params | ActionExecution + result | Owner/admin | `conversation_not_found`, `permission_denied` | N/A. |
| POST | `/executions/:id/retry` | `{ idempotencyKey? }` | ActionExecution | Permiso capability | `idempotency_conflict`, `stale_action_version` | Solo mismo payload/hash. |
| GET | `/executions/:id/projection-links` | params | ProjectionLink[] | Owner/admin | `projection_failed` | N/A. |

## 8. Capability Registry

Capability P0:

```yaml
capabilityId: CreateStrategicFront
ownerPrd: PRD-06
version: 2026-07-26.p0
supportedIntents:
  - create_strategic_front
  - create_portfolio_front
  - organize_operational_efficiency_front
operation: create
requiredInputs:
  - name
optionalInputs:
  - objective
  - strategicObjective
  - description
  - whyNow
  - mainKpi
  - baseline
  - target
  - horizon
  - sponsor
  - sponsorId
  - priority
  - areaOrUnit
  - workspaceId
  - createdBy
requiredPermissions:
  - portfolio.strategicFront.create
requiresConfirmation: true
commandType: CreateStrategicFrontCommand
resultProjection:
  - portfolio.home.strategic_overview
  - portfolio.strategic_fronts.list
  - portfolio.strategic_fronts.detail
featureFlag: feature.copilotCreateStrategicFront
```

Schema de `proposedPayload` P0:

```typescript
type CreateStrategicFrontProposedPayloadV1 = {
  schemaVersion: 'create-strategic-front.payload.v1';
  name: string;
  objective?: string;
  strategicObjective?: string;
  description?: string;
  whyNow?: string;
  mainKpi?: string;
  baseline?: string;
  target?: string;
  horizon?: string;
  sponsor?: string;
  sponsorId?: string;
  priority?: 'Alta' | 'Media' | 'Baja';
  areaOrUnit?: string;
  workspaceId: string;
  createdBy: string;
};
```

Schema de command payload compatible con Portfolio actual:

```typescript
type CreateStrategicFrontCommandPayloadV1 = {
  schemaVersion: 'create-strategic-front.command.v1';
  name: string;
  description?: string;
  strategicObjective?: string;
  whyNow?: string;
  mainKpi?: string;
  baseline?: string;
  target?: string;
  horizon?: string;
  sponsor?: string;
  status?: 'draft' | 'active' | 'paused' | 'closed';
  priority?: 'Alta' | 'Media' | 'Baja';
  organizationId?: string;
  ownerId?: string;
};
```

Reglas de mapping:

- `objective` se normaliza a `strategicObjective` si este no viene.
- `workspaceId` se mapea a `organizationId` solo si representa una organizacion existente.
- `createdBy` se mapea a `ownerId`.
- `sponsorId` y `areaOrUnit` no se envian al `PortfolioService` actual hasta que exista soporte de dominio/persistencia; quedan como metadata/audit y decision abierta.
- `status` por defecto `draft`; `priority` por defecto `Media`.

Schema de resultado:

```typescript
type CreateStrategicFrontCommandResultV1 = {
  schemaVersion: 'create-strategic-front.result.v1';
  strategicFront: {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'closed';
    priority: 'Alta' | 'Media' | 'Baja';
    strategicObjective?: string | null;
    mainKpi?: string | null;
    baseline?: string | null;
    target?: string | null;
    horizon?: string | null;
    sponsor?: string | null;
    organizationId?: string | null;
    ownerId?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  projectionLinks: ProjectionLink[];
};
```

## 9. Command execution

`ActionExecutor` es la unica pieza que puede pasar de aprobacion a mutacion:

1. Carga ProposedAction y ActionPlan.
2. Verifica `status=approved`.
3. Verifica `payloadHash === approvedPayloadHash`.
4. Verifica `CapabilityRegistry.getById('CreateStrategicFront')`.
5. Verifica feature flag.
6. Valida payload con schema Copilot.
7. Mapea proposed payload a command payload compatible con `createStrategicFrontSchema`.
8. Ejecuta permiso backend obligatorio.
9. Reserva idempotency key.
10. Llama `CreateStrategicFrontCommand`.
11. El command llama `PortfolioService.createStrategicFront`.
12. Guarda `ActionExecution`, `AuditLog`, eventos logicos y `ProjectionLink`.
13. Genera mensaje de confirmacion solo si el resultado es exitoso.

El command no acepta payload directo desde el cliente. Siempre lee el payload aprobado persistido.

## 10. Permisos

Permiso logico P0: `portfolio.strategicFront.create`.

Resolucion actual sin inventar roles:

| Usuario | Resultado |
| --- | --- |
| `admin` | Puede aprobar y ejecutar. |
| `mentor` | Puede aprobar y ejecutar, equivalente al router Portfolio actual. |
| `participante`, `sponsor`, `colaborador`, `viewer` | No puede aprobar/ejecutar creacion P0. |

Frontend:

- Validacion orientativa para deshabilitar botones si el rol conocido no es `admin|mentor`.
- Mostrar solicitud de aprobador valido si no tiene permiso.
- Nunca esconder el plan como si no existiera; diferenciar "puedes ver" de "puedes ejecutar".

Backend:

- `authenticate` en todos los endpoints.
- Approve/execute repiten validacion obligatoria.
- Intentos rechazados se auditan con `permission_denied`.

Error estandar:

```json
{
  "success": false,
  "error": {
    "code": "permission_denied",
    "message": "Insufficient permission for capability CreateStrategicFront.",
    "hint": "Necesitas un usuario admin o mentor para crear frentes estrategicos."
  }
}
```

## 11. Idempotencia

Formato:

```text
copilot:v1:{workspaceId}:{conversationId}:{proposedActionId}:{payloadHash}
```

El cliente puede enviar `Idempotency-Key`, pero backend genera la key canonica con action y hash. El valor del cliente se guarda como `clientIdempotencyKey` para trazabilidad, no como fuente unica.

Persistencia:

- `ActionExecution.idempotencyKey` unique.
- Indice `ActionExecution(proposedActionId, payloadHash)`.
- Opcional futuro `CopilotIdempotencyKey` si se necesita TTL o bloqueo distribuido.

Comportamientos:

| Caso | Resultado |
| --- | --- |
| Doble clic | Segundo request encuentra execution `pending|validating|executing` y devuelve `202` con la misma execution. |
| Reintento de red despues de exito | Devuelve `200` con resultado previo, sin llamar Portfolio otra vez. |
| Ejecucion repetida con accion completed | Devuelve resultado previo. Para crear otro frente se necesita nueva ProposedAction. |
| Misma key con payload distinto | `idempotency_conflict`. |
| Ejecucion previa incompleta | Si esta `executing`, polling. Si expiro por timeout, marcar `failed` tras reconciliacion. Si hay evidencia de objeto creado, recuperar por execution/audit antes de reintentar. |
| Fallo antes de llamar Portfolio | Retry permitido con mismo hash. |
| Fallo despues de crear objeto y antes de proyeccion | Execution `partially_completed` o `completed` con warning, no recrear. |

## 12. Auditoria

Se registra:

- Conversacion creada.
- Mensaje recibido.
- IntentAssessment generado.
- Capability seleccionada.
- ActionPlan creado.
- Payload inicial.
- Payload editado.
- Aprobador, rol y hash aprobado.
- Rechazo y motivo.
- Ejecucion iniciada.
- Resultado de command.
- Errores con stage.
- Adapter usado (`deterministic.v1`).
- Timestamps por etapa.

Persistencia P0:

- Tablas Copilot guardan metadata completa.
- `AuditLog` guarda eventos resumidos con `resource='copilot'`, `resourceId=conversationId` o `executionId`.

## 13. Persistencia

Migracion propuesta futura en `front/prisma/schema.prisma` sin tocar `StrategicFront`:

```prisma
model CopilotConversation {
  id                 String   @id @default(cuid())
  workspaceId        String
  workspaceType      String
  userId             String
  context            Json?
  contextObjectType  String?
  contextObjectId    String?
  status             String
  activeActionPlanId String?
  title              String?
  version            Int      @default(1)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([userId, status, updatedAt])
  @@index([workspaceId, status])
}

model CopilotMessage {
  id               String   @id @default(cuid())
  conversationId   String
  role             String
  type             String
  content          String
  sourceReferences Json?
  status           String
  metadata         Json?
  createdAt        DateTime @default(now())

  @@index([conversationId, createdAt])
  @@unique([conversationId, id])
}

model IntentAssessment {
  id                    String   @id @default(cuid())
  conversationId        String
  messageId             String
  originalMessage       String
  primaryIntent         String
  operation             String
  detectedEntities      Json?
  ambiguousObjects      Json?
  missingInformation    Json?
  suggestedCapabilities Json?
  confidence            String
  sourcesUsed           Json?
  promptOrRubricVersion String
  status                String
  createdAt             DateTime @default(now())

  @@index([conversationId, createdAt])
  @@index([messageId])
}

model ActionPlan {
  id                 String   @id @default(cuid())
  conversationId     String
  intentAssessmentId String
  summary            String
  status             String
  version            Int
  dependencies       Json?
  contextUsed        Json?
  capabilitySnapshot Json?
  createdBy          String
  supersedesPlanId   String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@unique([conversationId, version])
  @@index([conversationId, status])
}

model ProposedAction {
  id                  String   @id @default(cuid())
  actionPlanId        String
  capabilityId        String
  ownerPrd            String
  operation           String
  commandType         String
  title               String
  explanation         String
  proposedPayload     Json
  editableFields      Json
  requiredPermissions Json
  requiresConfirmation Boolean
  dependencies        Json?
  status              String
  version             Int      @default(1)
  payloadHash         String
  approvedPayloadHash String?
  approvedBy          String?
  approvedAt          DateTime?
  rejectedBy          String?
  rejectedAt          DateTime?
  rejectionReason     String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([actionPlanId, status])
  @@index([capabilityId])
}

model ActionExecution {
  id             String   @id @default(cuid())
  proposedActionId String
  conversationId String
  actionPlanId   String
  idempotencyKey String   @unique
  approvedBy     String
  executedBy     String
  status         String
  attempt        Int      @default(1)
  commandType    String
  commandPayload Json
  payloadHash    String
  result         Json?
  error          Json?
  createdObjects Json?
  updatedObjects Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  startedAt      DateTime?
  completedAt    DateTime?
  failedAt       DateTime?

  @@index([proposedActionId, payloadHash])
  @@index([conversationId, status])
}

model ProjectionLink {
  id                String   @id @default(cuid())
  actionExecutionId String
  objectType        String
  objectId          String
  viewId            String
  route             String
  label             String
  status            String
  createdAt         DateTime @default(now())

  @@index([actionExecutionId])
  @@index([objectType, objectId])
}
```

Constraints:

- `ActionExecution.idempotencyKey` unique.
- `ActionPlan(conversationId, version)` unique.
- ProposedAction execution verifies approved hash in service, not only DB.
- Compatibilidad con datos actuales: no hay migracion destructiva; `StrategicFront` queda intacto.

## 14. Eventos

Eventos minimos:

| Evento | Fuente P0 | Mapeo actual |
| --- | --- | --- |
| `CopilotConversationCreated` | Crear conversacion | `AuditLog.action='copilot.conversation.created'`. |
| `IntentAssessed` | Enviar mensaje | `AuditLog.action='copilot.intent.assessed'`. |
| `ActionPlanCreated` | Plan service | `AuditLog.action='copilot.action_plan.created'`. |
| `ProposedActionEdited` | PATCH action | `AuditLog.action='copilot.proposed_action.edited'`. |
| `ProposedActionApproved` | Approve | `AuditLog.action='copilot.proposed_action.approved'`. |
| `ProposedActionRejected` | Reject | `AuditLog.action='copilot.proposed_action.rejected'`. |
| `ActionExecutionStarted` | Execute | `AuditLog.action='copilot.execution.started'`. |
| `StrategicFrontCreated` | Portfolio command result | No event bus actual; registrar `AuditLog.action='portfolio.strategic_front.created'` con source Copilot. |
| `ActionExecutionCompleted` | Executor | `AuditLog.action='copilot.execution.completed'`. |
| `ActionExecutionFailed` | Executor | `AuditLog.action='copilot.execution.failed'`. |
| `DashboardProjectionRequested` | Projection service/UI | `AuditLog.action='copilot.projection.requested'`. |
| `DashboardProjectionCompleted` | Projection service | `AuditLog.action='copilot.projection.completed'`. |
| `DashboardProjectionFailed` | Projection service | `AuditLog.action='copilot.projection.failed'`. |

Analytics producto:

- `copilot_message_sent`
- `intent_assessment_completed`
- `action_plan_presented`
- `proposed_action_edited`
- `action_approved`
- `action_rejected`
- `execution_started`
- `execution_completed`
- `execution_failed`
- `projection_opened`

## 15. Frontend futuro

DTOs:

- `CopilotConversationDto`
- `CopilotMessageDto`
- `IntentAssessmentDto`
- `ActionPlanDto`
- `ProposedActionDto`
- `ActionExecutionDto`
- `ProjectionLinkDto`
- `CommandExecutionResultDto`
- `CopilotErrorDto`

Interfaz:

```typescript
interface CopilotClient {
  createConversation(input: CreateConversationRequest): Promise<CopilotConversationDto>;
  getConversation(id: string): Promise<CopilotConversationDetailDto>;
  sendMessage(conversationId: string, input: SendMessageRequest): Promise<SendMessageResponseDto>;
  getActionPlan(id: string): Promise<ActionPlanDto>;
  editProposedAction(id: string, input: EditProposedActionRequest): Promise<ProposedActionDto>;
  approveProposedAction(id: string, input: ApproveActionRequest): Promise<ProposedActionDto>;
  rejectProposedAction(id: string, input: RejectActionRequest): Promise<ProposedActionDto>;
  executeProposedAction(id: string, input: ExecuteActionRequest): Promise<ActionExecutionDto>;
  getExecution(id: string): Promise<ActionExecutionDto>;
  retryExecution(id: string, input: RetryExecutionRequest): Promise<ActionExecutionDto>;
  getProjectionLinks(executionId: string): Promise<ProjectionLinkDto[]>;
}
```

`MockCopilotClient`:

- Usa fixture deterministico para el mensaje "Quiero crear un frente de eficiencia operativa."
- No llama backend.
- Sirve para Storybook/tests frontend mientras APIs no existen.

`HttpCopilotClient`:

- Reutiliza `api.ts`.
- Envia `Idempotency-Key` en execute si el caller lo provee.
- Respeta envelope `success/error`.

Componentes previstos:

- `PortfolioCopilotShell`
- `CopilotMessageList`
- `CopilotComposer`
- `IntentAssessmentSummary`
- `ActionPlanPreview`
- `ProposedActionEditor`
- `ApprovalControls`
- `ExecutionStatusPanel`
- `ProjectionLinkButton`

Estados UI:

- idle
- sending
- interpreting
- needs_clarification
- proposal_ready
- editing_action
- awaiting_confirmation
- executing
- completed
- failed
- permission_denied
- stale_version

Actualizacion del mapa estrategico:

- Despues de `execution.completed`, usar links de proyeccion y refrescar datos reales con servicios Portfolio existentes.
- Si la proyeccion falla pero el frente existe, mostrar confirmacion con warning y link alterno a lista.
- Si otra pestana abre la conversacion, polling o refetch recupera estado persistido.

Feature flag:

- `feature.copilotPortfolioHome` para shell visible.
- `feature.copilotActionPlans` para generar planes.
- `feature.copilotExecuteCommands` para ejecucion real.
- `feature.copilotCreateStrategicFront` para capability P0.

Estrategia mock -> HTTP:

1. Construir UI contra `CopilotClient`.
2. Usar `MockCopilotClient` hasta que APIs esten listas.
3. Cambiar provider por `HttpCopilotClient` bajo flag.
4. Mantener fixtures contractuales iguales a DTO backend.

## 16. Tests

Unitarios:

- Transiciones de `CopilotConversation`, `ActionPlan`, `ProposedAction`, `ActionExecution`.
- Schemas de payload/result.
- Permisos `admin|mentor`.
- Versionado y stale action.
- Aprobacion total/parcial/rechazo.
- Idempotencia y key builder.
- Registro y consulta de capabilities.

Integracion:

- Mensaje -> IntentAssessment -> ActionPlan.
- ActionPlan -> command payload.
- Validacion de dominio contra `createStrategicFrontSchema`.
- Creacion de frente via `PortfolioService`.
- Error del servicio Portfolio.
- Persistencia de conversation/plan/action/execution.
- Auditoria `AuditLog`.
- ProjectionLink visible.

Contratos:

- DTO frontend/backend.
- Capability schema.
- Proposed payload -> command payload.
- Command result discriminado.
- Error envelope.

Permisos/idempotencia:

- Usuario sin permiso no aprueba/ejecuta y queda auditado.
- Doble clic crea un solo `StrategicFront`.
- Retry de red devuelve resultado previo.
- Edicion invalida aprobacion.
- Rechazo impide execute.

E2E futuro:

- Crear frente desde mensaje.
- Editar antes de aprobar.
- Rechazar.
- Doble clic.
- Reintento.
- Permiso insuficiente.
- Error backend.
- Refresh en plan pendiente.
- Frente visible en mapa/lista.
- Audit trail completo.

## 17. Feature flag

Flags propuestos:

| Flag | Default P0 | Uso |
| --- | --- | --- |
| `COPILOT_ENABLED` | false | Habilita rutas backend. |
| `COPILOT_DETERMINISTIC_MODE` | true | Fuerza adapter fixture; bloquea IA real. |
| `COPILOT_EXECUTE_COMMANDS` | false hasta QA | Permite mutaciones reales. |
| `VITE_FEATURE_COPILOT_PORTFOLIO` | false | Muestra shell frontend. |
| `VITE_FEATURE_COPILOT_CREATE_FRONT` | false | Muestra capability P0. |

## 18. Secuencia de implementacion

1. Contratos y schemas.
2. Persistencia.
3. Capability Registry.
4. Action Plan service.
5. Action Executor.
6. Adapter deterministico.
7. Integracion con Portfolio.
8. APIs.
9. Frontend mock.
10. Frontend HTTP.
11. E2E.
12. IA real.

Detalles por bloque:

| Bloque | Resultado esperado |
| --- | --- |
| 1 | Tipos/Zod compartidos, sin DB ni UI. |
| 2 | Migracion Copilot, `db:generate`, repositorios. |
| 3 | `CreateStrategicFront` registrado y testeado. |
| 4 | Mensaje genera assessment/plan/action fixture. |
| 5 | Approve/edit/reject/execute state machine. |
| 6 | Fixture deterministico para desarrollo/tests. |
| 7 | Command delega en `PortfolioService`. |
| 8 | Endpoints protegidos y envelope consistente. |
| 9 | UI mock bajo flag sin tocar flujo manual. |
| 10 | Sustitucion por HTTP client. |
| 11 | Playwright con Docker/Postgres disponible. |
| 12 | Adapter IA reemplaza deterministico sin tocar dominio. |

## 19. Archivos previstos

Backend futuro:

```text
backend/modules/copilot/
  copilot.router.ts
  copilot.controller.ts
  copilot.schemas.ts
  copilot.types.ts
  copilot.service.ts
  conversation.repository.ts
  message.repository.ts
  intent-assessor.ts
  deterministic-copilot.adapter.ts
  capability-registry.ts
  action-plan.service.ts
  approval.service.ts
  action-executor.service.ts
  idempotency.service.ts
  projection.service.ts
  audit.service.ts
  commands/
    create-strategic-front.command.ts
  __tests__/
    capability-registry.test.ts
    intent-assessor.test.ts
    action-plan.service.test.ts
    approval.service.test.ts
    action-executor.create-strategic-front.test.ts
    permissions.test.ts
    idempotency.test.ts
    projection.test.ts
```

Frontend futuro:

```text
front/src/features/copilot/
  domain/types.ts
  domain/schemas.ts
  services/CopilotClient.ts
  services/MockCopilotClient.ts
  services/HttpCopilotClient.ts
  components/PortfolioCopilotShell.tsx
  components/CopilotMessageList.tsx
  components/CopilotComposer.tsx
  components/ActionPlanPreview.tsx
  components/ProposedActionEditor.tsx
  components/ApprovalControls.tsx
  components/ExecutionStatusPanel.tsx
  __tests__/
    CopilotClient.contract.test.ts
    ActionPlanPreview.test.tsx
    ProposedActionEditor.test.tsx
```

Persistencia futura:

```text
front/prisma/schema.prisma
front/prisma/migrations/<timestamp>_copilot_foundation/
```

## 20. Riesgos

| Riesgo | Mitigacion |
| --- | --- |
| Duplicar `StrategicFront` en Copilot | Copilot solo guarda propuestas/referencias; Portfolio persiste. |
| Duplicar reglas Portfolio Lead | Command reusa `PortfolioService` y schema Portfolio. |
| `sponsorId`/`areaOrUnit` no persistibles | Mantener como metadata y decision abierta antes de mutar schema. |
| Permiso `portfolio_lead` inexistente | Usar `admin|mentor`; documentar permiso granular futuro. |
| Doble clic crea duplicados | Unique idempotency key y execution replay. |
| UI afirma exito prematuro | Mensaje de exito solo desde `ActionExecution.completed`. |
| AI bridge escribe datos | P0 deterministico; futuro AI solo produce assessment/propuesta. |
| Fallo de proyeccion despues de crear frente | Execution completed con warning y recuperacion por refresh. |
| Transaccion parcial | Executor debe registrar ledger antes de command y reconciliar si hay timeout. |
| E2E no disponible localmente | Mantener tests unit/integration; E2E corre cuando Docker/Postgres esten disponibles. |

## 21. Decisiones abiertas

| Decision | Por que requiere producto/arquitectura |
| --- | --- |
| `workspaceId` real para Portfolio | El modelo actual usa `organizationId`, PRD-01 habla de workspaces progresivos aun no materializados. |
| Persistencia de `areaOrUnit` | El campo existe como necesidad conversacional/UI, no en `StrategicFront` backend/DB. |
| `sponsorId` vs `sponsor` texto | DB actual tiene `sponsor` string; un sponsor relacional requiere modelo/migracion. |
| Campos obligatorios minimos | Backend actual solo exige `name`; producto podria exigir KPI/baseline/target para calidad Portfolio. |
| Estado inicial | Recomendacion P0: siempre `draft`; producto debe confirmar si se permite `active`. |
| Rol granular Portfolio Lead | No existe rol `portfolio_lead`; decidir si basta `admin|mentor` o se agrega permisos por workspace. |
| Profundidad de editor P0 | Form especifico vs editor compacto de campos; no afecta backend pero si UX. |

## 22. Criterios de aceptacion

1. La vertical genera un `IntentAssessment` deterministico para crear frente.
2. La capability `CreateStrategicFront` esta registrada con `ownerPrd=PRD-06`.
3. El `ActionPlan` contiene una `ProposedAction` editable y versionada.
4. El usuario puede editar antes de aprobar.
5. La aprobacion registra aprobador, version y hash.
6. Editar despues de aprobar invalida la aprobacion.
7. Ejecutar sin aprobacion falla.
8. Ejecutar sin permiso falla en backend y se audita.
9. Doble clic/retry no crea dos frentes.
10. `CreateStrategicFrontCommand` delega en `PortfolioService.createStrategicFront`.
11. El `StrategicFront` se persiste en la tabla existente.
12. Se registra `ActionExecution` con result, errores o warnings.
13. Se crea `ProjectionLink` para mapa/lista.
14. El frontend puede recuperar la conversacion tras refresh.
15. El Copiloto confirma solo despues del resultado real.
16. P0 no usa IA real ni AI bridge para escribir.

## 23. Errores

| Codigo | Mensaje tecnico | Mensaje UX | Reintento | Requiere edicion | Nueva version | Registro |
| --- | --- | --- | --- | --- | --- | --- |
| `invalid_payload` | Payload does not match schema. | Revisa los campos marcados antes de continuar. | No | Si | No necesariamente | Action/audit con detalles Zod. |
| `missing_required_input` | Required input missing. | Falta informacion para preparar la accion. | No | Si | No | Assessment y message. |
| `capability_not_found` | Capability is not registered or disabled. | Esta accion todavia no esta disponible. | No | No | Si se regenera con otra capability | Audit. |
| `permission_denied` | Actor lacks required permission. | No tienes permiso para aprobar o ejecutar esta accion. | Si con otro usuario | No | No | Audit obligatorio. |
| `action_not_approved` | Action has no valid approval. | Aprueba la accion antes de ejecutarla. | Si | No | No | Execution rejected/audit. |
| `stale_action_version` | Expected version does not match current version. | El plan cambio. Actualiza y vuelve a intentar. | Si | No | Puede requerir | Audit. |
| `idempotency_conflict` | Same idempotency key used with different action or payload. | La accion ya fue enviada con otros datos. | No | No | Si | Execution/audit. |
| `domain_validation_failed` | Portfolio schema or business validation failed. | Portfolio rechazo los datos del frente. | No | Si | Si tras editar | Execution failed/audit. |
| `persistence_failed` | Database write failed. | No se pudo guardar el cambio. | Si | No | No | Error handler/audit. |
| `projection_failed` | Projection link or dashboard refresh failed. | El frente se creo, pero no pudimos abrir la vista automaticamente. | Si | No | No | Warning/result/audit. |
| `execution_failed` | Command execution failed. | No se pudo ejecutar la accion. | Si si retryable | Depende | Depende | Execution failed/audit. |
| `partial_execution` | Some side effects completed and others failed. | La accion quedo parcialmente completada. | Requiere recuperacion | No | No | Execution partial/audit. |
| `conversation_not_found` | Conversation not found or inaccessible. | No encontramos esta conversacion. | No | No | No | Request audit. |
| `action_plan_not_found` | Action plan not found or inaccessible. | No encontramos este plan de accion. | No | No | No | Request audit. |

## 24. Recuperacion despues de refresh

| Situacion | Comportamiento |
| --- | --- |
| Conversacion esperando respuesta | `GET /conversations/:id` devuelve estado `asking_clarification`, mensajes y pregunta vigente. |
| ActionPlan pendiente de aprobacion | Devuelve plan `awaiting_confirmation`, ProposedAction, payload y hash actual. |
| Accion aprobada no ejecutada | Devuelve action `approved`; UI muestra ejecutar si permiso vigente sigue valido. |
| Ejecucion en curso | Devuelve execution `validating|executing`; UI hace polling con `GET /executions/:id`. |
| Ejecucion termino fuera de la pestana | Devuelve `completed` con result y links; UI muestra confirmacion recuperada. |
| Ejecucion fallo | Devuelve `failed`, error, retryable y proxima accion recomendada. |
| Proyeccion fallo pero command termino | Devuelve `completed` con warning `projection_failed`; UI refresca Portfolio por lista. |
| Misma conversacion en otra pestana | Version/hash controlan ediciones; stale edits reciben `stale_action_version`. |

## 25. Modo deterministico inicial

Adapter: `DeterministicCopilotAdapter`.

Input fixture:

```text
Quiero crear un frente de eficiencia operativa.
```

Output conocido:

```json
{
  "intentAssessment": {
    "primaryIntent": "create_strategic_front",
    "operation": "create",
    "confidence": "high",
    "suggestedCapabilities": ["CreateStrategicFront"],
    "missingInformation": [],
    "promptOrRubricVersion": "deterministic-create-front.v1"
  },
  "actionPlan": {
    "summary": "Crear un frente estrategico de eficiencia operativa en estado borrador.",
    "status": "awaiting_confirmation"
  },
  "proposedAction": {
    "capabilityId": "CreateStrategicFront",
    "ownerPrd": "PRD-06",
    "commandType": "CreateStrategicFrontCommand",
    "title": "Crear frente: Eficiencia operativa",
    "editableFields": ["name", "objective", "mainKpi", "baseline", "target", "horizon", "priority", "sponsor"],
    "requiresConfirmation": true,
    "proposedPayload": {
      "schemaVersion": "create-strategic-front.payload.v1",
      "name": "Eficiencia operativa",
      "objective": "Mejorar la eficiencia operativa.",
      "priority": "Media"
    }
  }
}
```

Sustitucion futura:

- `CopilotAdapter` expone `assessIntent` y `draftActionPlan`.
- El adapter IA reemplaza al deterministico sin tocar `PortfolioService`, `ActionExecutor`, schemas o componentes principales.
- El adapter IA no recibe permisos de escritura ni Prisma.

## 26. Implementacion Block 04 Frontend

El frontend P0 queda conectado a los endpoints reales de Block 03 bajo feature flag `VITE_PORTFOLIO_COPILOT_ENABLED`.

Componentes implementados:

- `PortfolioCopilotShell`;
- `CopilotConversation`;
- `CopilotMessageList`;
- `CopilotComposer`;
- `CopilotStatusIndicator`;
- `IntentAssessmentCard`;
- `ClarificationCard`;
- `ActionPlanCard`;
- `ProposedActionCard`;
- `StrategicFrontActionEditor`;
- `ApprovalControls`;
- `ExecutionStatusCard`;
- `ExecutionResultCard`.

Contratos frontend:

- `CopilotClient`;
- `HttpCopilotClient`;
- DTOs explícitos equivalentes a los DTOs backend de Block 03.

Decisiones:

- no se introduce generación automática de contratos todavía;
- se documenta duplicación temporal DTO frontend/backend;
- `organizationId` y `createdBy` solo se preservan desde payload backend existente y no son editables;
- el mapa estratégico se actualiza llamando a `PortfolioLeadContext.refreshPortfolioData`, que vuelve a leer Portfolio desde backend;
- no existe `MockCopilotClient` productivo; los fakes viven solo en tests.

E2E:

- `front/e2e/portfolio-copilot-create-front.spec.ts` cubre login, mensaje, plan, edición, aprobación, ejecución, refresh y replay idempotente.
- `front/scripts/run-e2e.ts` activa `COPILOT_ENABLED=true`, `COPILOT_WRITE_ENABLED=true`, `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=true`, `COPILOT_ASSESSMENT_ADAPTER=deterministic` y `VITE_PORTFOLIO_COPILOT_ENABLED=true` para esta vertical.
- Estado real 2026-07-27: el spec existe, pero la ejecucion E2E sigue NO-GO porque el seed en PostgreSQL limpio falla con `Project.pilotLeadId` ausente.

## 27. Implementacion Block 05 Hardening

La vertical se endurece para piloto tecnico limitado sin agregar capabilities:

- flags backend: `COPILOT_ENABLED`, `COPILOT_WRITE_ENABLED`, `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED`, `COPILOT_ALLOWED_ORGANIZATION_IDS`;
- adapter deterministico no se activa en production aunque se configure por error;
- `x-request-id` y `x-correlation-id` se validan, generan y devuelven;
- `ActionExecution` persiste `correlationId`, `reconciliationClaimId` y `reconciliationClaimedAt`;
- estado terminal `manual_review_required` evita tratar una ejecucion ambigua como fallo reintentable;
- reconciliador reclama ejecuciones stale y nunca reejecuta Portfolio;
- readiness Copilot en `/api/readiness/copilot`;
- rate limiting in-process para mutaciones Copilot;
- redaccion de logs y fingerprint de idempotency key en auditoria/logs;
- metricas desacopladas con adapter no-op/test;
- smoke/load scripts reproducibles para entornos controlados.

Decision de consistencia:

- se documenta en `docs/architecture/adr-copilot-portfolio-consistency.md`;
- la frontera actual no es atomicamente exactly-once porque `PortfolioService.createStrategicFront` no recibe transaction client;
- el ledger idempotente y la reconciliacion conservadora son el mecanismo operativo de recuperacion.

Estado real:

- hardening backend: parcialmente implementado y probado por unit/HTTP tests;
- E2E de Block 04: NO-GO por drift de seed/migracion en PostgreSQL limpio (`Project.pilotLeadId` ausente);
- piloto tecnico: NO-GO hasta resolver ese bloqueo y obtener E2E verde con API/frontend reales.
