# Copilot-first Foundation Block 01

Fecha: 2026-07-26
Estado: implementado en backend/Prisma, sin UI ni endpoints HTTP.

## Alcance

Este bloque implementa la base tecnica para la vertical `CreateStrategicFront`:

- contratos canonicos;
- schemas estrictos;
- modelos Prisma;
- migracion SQL;
- repositorio Prisma;
- `CapabilityRegistry`;
- `ConversationService`;
- `ActionPlanService` basico;
- autorizacion conceptual `portfolio.strategicFront.create`;
- auditoria basica con `AuditLog`;
- tests backend.

Fuera de alcance: UI, rutas HTTP, AI real, AI bridge, aprobacion final, rechazo final, `ActionExecutor`, `CreateStrategicFrontCommand`, `PortfolioService`, importacion, retos, cohortes, readiness y decisiones.

## Decisiones MVP aplicadas

| Decision | Aplicacion |
| --- | --- |
| Alcance organizacional | `organizationId` es obligatorio en `CopilotConversation` y payload P0. Se indexa como escalar y se valida en repositorio/autorizacion; no se agrega FK hacia `Organization` porque el historial de migraciones aplicable desde cero no crea esa tabla. |
| Sin Workspace generico | No se crea modelo `Workspace` ni campo `workspaceId`. |
| StrategicFront pertenece a Portfolio | Copilot no importa `PortfolioService` ni escribe `strategicFront`. |
| Sponsor actual | Se usa `sponsor` string; no existe `sponsorId`. |
| Sin `areaOrUnit` | No se incluye en payload porque no hay persistencia compatible. |
| Sin RBAC nuevo | `portfolio.strategicFront.create` se resuelve con roles actuales `admin|mentor`. |
| Permisos granulares futuros | Documentados como siguiente evolucion, no implementados. |

## Modelos creados

Prisma agrega:

- `CopilotConversation`
- `CopilotMessage`
- `IntentAssessment`
- `ActionPlan`
- `ProposedAction`
- `ActionExecution`

Enums agregados:

- `CopilotConversationStatus`
- `CopilotMessageRole`
- `CopilotMessageType`
- `CopilotIntent`
- `CopilotOperation`
- `CopilotConfidence`
- `CopilotAdapterType`
- `ActionPlanStatus`
- `ProposedActionStatus`
- `ActionExecutionStatus`

No se modifico `StrategicFront`.

## Migracion

Migracion creada:

`front/prisma/migrations/20260726170000_copilot_foundation_block_01/migration.sql`

Incluye relaciones explicitas con `User`, `CopilotConversation`, `CopilotMessage`, `IntentAssessment`, `ActionPlan` y `ProposedAction`. Las relaciones usan `RESTRICT` para no borrar auditoria accidentalmente. `ActionExecution.idempotencyKey` es unico.

`CopilotConversation.organizationId` queda como escalar obligatorio con indices. Ajuste frente al diseno: no se crea FK a `Organization` en este bloque porque las migraciones historicas del repositorio no crean la tabla `Organization`, aunque el modelo exista en el schema Prisma actual. El acceso organizacional se valida de forma deterministica desde `PrismaCopilotRepository.getOrganizationAccess`.

## Contratos

Archivos:

- `backend/modules/copilot/domain/copilot.types.ts`
- `backend/modules/copilot/domain/capability.types.ts`
- `backend/modules/copilot/schemas/copilot.schemas.ts`

Payload P0 estricto:

```ts
{
  organizationId: string;
  name: string;
  objective?: string;
  mainKpi?: string;
  baseline?: string;
  target?: string;
  horizon?: string;
  sponsor?: string;
  priority?: 'Alta' | 'Media' | 'Baja';
  createdBy: string;
}
```

Campos excluidos deliberadamente: `workspaceId`, `sponsorId`, `areaOrUnit`.

## Capability Registry

Archivo:

`backend/modules/copilot/application/capability-registry.ts`

Capability registrada:

- id: `CreateStrategicFront`
- ownerPrd: `PRD-06`
- intent: `create_strategic_front`
- operation: `create`
- permission: `portfolio.strategicFront.create`
- confirmation: required
- commandType: `CreateStrategicFrontCommand`
- projections: mapa estrategico y detalle de frente

El registry no contiene implementacion del comando y no accede a Prisma.

## Repositorios

Archivos:

- `backend/modules/copilot/infrastructure/copilot.repository.ts`
- `backend/modules/copilot/infrastructure/prisma-copilot.repository.ts`

Operaciones implementadas:

- crear y recuperar conversacion;
- agregar y listar mensajes;
- guardar `IntentAssessment`;
- crear `ActionPlan`;
- crear `ProposedAction`;
- recuperar plan con acciones;
- recuperar accion;
- editar payload e incrementar version;
- marcar plan como `superseded`;
- crear `ActionExecution` pendiente;
- buscar execution por `idempotencyKey`;
- escribir `AuditLog`;
- consultar acceso organizacional.

## Servicios

`ConversationService`:

- crea conversacion;
- valida organizacion/acceso;
- obtiene conversacion;
- agrega mensaje;
- lista mensajes;
- audita creacion, mensajes y rechazos de acceso.

`ActionPlanService`:

- guarda assessment validando capabilities;
- crea plan draft;
- agrega ProposedAction validada;
- recupera plan;
- edita payload;
- incrementa version;
- invalida `approvedAt/approvedBy` al editar;
- marca plan como superseded.

No implementa aprobar, rechazar ni ejecutar.

## Autorizacion

Archivo:

`backend/modules/copilot/application/strategic-front.authorization.ts`

`canCreateStrategicFront(user, organizationId, accessReader)` devuelve resultado estructurado. Roles actuales que satisfacen el permiso conceptual:

- `admin`: permitido si la organizacion existe;
- `mentor`: permitido si pertenece a la organizacion o tiene `user.organizationId` asociado.

Roles no permitidos para esta mutacion: `participante`, `sponsor`, `colaborador`, `viewer`.

## Auditoria

Se reutiliza `AuditLog`.

Eventos auditados:

- `copilot.organization_access.denied`
- `copilot.conversation.created`
- `copilot.message.saved`
- `copilot.intent_assessment.saved`
- `copilot.action_plan.created`
- `copilot.proposed_action.created`
- `copilot.proposed_action.edited`
- `copilot.action_plan.superseded`

`AuditLog` es suficiente para Block 01. No se amplio el modelo.

## Tests

Archivos:

- `backend/modules/copilot/__tests__/capability-registry.test.ts`
- `backend/modules/copilot/__tests__/strategic-front.authorization.test.ts`
- `backend/modules/copilot/__tests__/conversation.service.test.ts`
- `backend/modules/copilot/__tests__/action-plan.service.test.ts`
- `backend/modules/copilot/__tests__/prisma-copilot.repository.test.ts`

Cobertura funcional del bloque:

- registry;
- payload valido/invalido;
- duplicate/unknown capability;
- autorizacion por rol y organizacion;
- conversacion y mensajes;
- auditoria;
- ActionPlan y ProposedAction;
- stale version;
- superseded plan;
- idempotency key unique mapeada a error canonico;
- busquedas por conversacion/organizacion en adapter mockeado.

## Validacion ejecutada

| Comando | Resultado |
| --- | --- |
| `npm run db:generate` | GO. Prisma Client v6.19.2 generado con modelos Copilot. Persisten warnings existentes de `package.json#prisma` deprecado y override por `prisma.config.ts`. |
| `npm run typecheck:backend` | GO. `tsc -p tsconfig.backend.json --noEmit` exit 0. |
| `npm run build:backend` | GO. `tsc -p tsconfig.backend.json` exit 0. |
| `npx vitest run --config vitest.backend.config.ts ../backend/modules/copilot/__tests__` | GO. 5 archivos / 35 tests. |
| `npm test` | GO. Backend y frontend pasan. Incluye nuevos tests Copilot. Persisten warnings React `act(...)`/`forwardRef` ya conocidos. |
| `npm run typecheck:front` | GO. `tsc -p tsconfig.front.json --noEmit` exit 0. |
| `npm run build` | GO. Vite build exit 0. Persisten warnings existentes de chunk grande e import dinamico/estatico de `api.ts`. |
| `npm run typecheck` | GO. `typecheck:front` y `typecheck:backend` exit 0. |
| `npx prisma migrate deploy` | GO contra `starteria_copilot_test`. Aplico 10 migraciones desde cero, incluida `20260726170000_copilot_foundation_block_01`. |
| `npx prisma migrate status` | GO contra `starteria_copilot_test`. Resultado: `Database schema is up to date!`. |

## Riesgos

| Riesgo | Estado |
| --- | --- |
| Tests de persistencia con DB real | Migraciones validadas contra `starteria_copilot_test`; los tests unitarios de repositorio siguen usando Prisma mockeado. |
| Permiso granular real | Pendiente; por ahora se mapea a `admin|mentor`. |
| `objective` vs `strategicObjective` | Resuelto solo a nivel de payload Copilot; mapping a command queda para el bloque de command. |
| `ActionExecution` sin executor | Intencional; este bloque solo crea el ledger. |
| `ProjectionLink` como JSON | Suficiente para Block 01; tabla separada puede agregarse cuando exista proyeccion real. |

## Siguiente bloque

Bloque recomendado:

1. Adapter deterministico para mensaje -> IntentAssessment -> ActionPlan.
2. Endpoints backend internos de conversacion/plan sin ejecucion.
3. Aprobacion/rechazo backend.
4. Despues, `ActionExecutor` y `CreateStrategicFrontCommand` delegando en Portfolio.
