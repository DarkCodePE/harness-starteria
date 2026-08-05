# Copilot-first Foundation Block 04: Portfolio Copilot Frontend

Fecha: 2026-07-27

## Alcance

Implementado el frontend funcional de la primera vertical `CreateStrategicFront` dentro de la Home Portfolio Lead:

- cliente HTTP tipado contra `/api/v1/copilot`;
- recuperación de conversación por `sessionStorage` del `conversationId`;
- envío de mensajes al adapter determinístico backend;
- visualización compacta de `IntentAssessment`;
- clarificación sin crear acciones inválidas;
- `ActionPlan` y `ProposedAction`;
- editor específico de `CreateStrategicFront`;
- aprobación, rechazo y ejecución con `Idempotency-Key`;
- polling limitado de `ActionExecution`;
- resultado confirmado por backend y projection links;
- refresh del mapa estratégico desde la API Portfolio;
- feature flag `VITE_PORTFOLIO_COPILOT_ENABLED`;
- tests frontend y spec E2E vertical.

Fuera de alcance: IA real, streaming, WebSockets, importación, retos, cohortes, readiness, otras capabilities y cambios de dominio backend.

## Gate Block 3

Antes de construir frontend se verificó el backend Copilot:

- `npm run typecheck:backend`: GO.
- `npx vitest run --config vitest.backend.config.ts ../backend/modules/copilot/__tests__`: GO, 12 archivos / 75 tests; integraciones PostgreSQL opt-in skipped por defecto.

Endpoints disponibles: conversaciones, mensajes, latest assessment, current plan, action plan por id, edit, approve, reject, execute con `Idempotency-Key`, execution por id y executions por action.

## Arquitectura Frontend

Feature aislada en `front/src/features/copilot`:

- `api/`: contrato `CopilotClient`, implementación `HttpCopilotClient`, normalización de errores.
- `domain/`: DTOs canónicos frontend y selectores de estado.
- `hooks/`: `useCopilotConversation` y polling de execution.
- `mappers/`: payload editable de `CreateStrategicFront` sin permitir edición de organización ni actor.
- `components/`: shell, conversación, composer, assessment, clarificación, plan, action editor, aprobación y execution result.

La Home Portfolio Lead solo importa `PortfolioCopilotShell` cuando el feature flag está encendido. Con flag apagado, mantiene la Home anterior.

## Cliente HTTP

`HttpCopilotClient` reutiliza `front/src/app/services/api.ts`, por lo que conserva cookies, token en memoria y refresh auth existente.

No envía `userId`, `approvedBy`, `executedBy` ni `organizationId` como inputs libres. Para editar, conserva `organizationId` y `createdBy` recibidos en el payload backend sin renderizarlos ni permitir cambiarlos; los campos editables son `name`, `objective`, `mainKpi`, `baseline`, `target`, `horizon`, `sponsor` y `priority`.

## Estados y Recuperación

`useCopilotConversation`:

- recupera `conversationId` desde `sessionStorage`;
- llama `GET conversation`, `GET messages`, `GET current action plan`;
- lista executions por acción;
- reconstruye resultado terminal después de refresh;
- no guarda mensajes, tokens ni payloads en storage.

Estados visuales:

- `collecting_context`: composer habilitado;
- `interpreting`: envío bloqueado temporalmente;
- `asking_clarification`: muestra faltantes;
- `awaiting_confirmation`: muestra plan editable;
- `executing`: muestra execution/polling;
- `completed`: muestra resultado y links;
- `blocked`: muestra error seguro.

## Action Plan

`ActionPlanCard` no asume que siempre exista una sola acción, aunque P0 solo registra `CreateStrategicFront`.

`StrategicFrontActionEditor` valida nombre y prioridad antes de PATCH. Un 409 por stale version se muestra como error y dispara recuperación del plan vigente.

## Aprobación, Rechazo y Ejecución

La aprobación usa `expectedVersion` de la acción actual y no cambia el estado visual hasta recibir backend.

El rechazo conserva la acción y permite razón opcional.

La ejecución:

- genera UUID para `Idempotency-Key`;
- conserva la misma key durante el intento;
- deshabilita el botón mientras la request está en curso;
- no llama Portfolio directamente;
- confirma éxito solo con `ActionExecution.completed` o replay backend;
- usa links de `ActionExecution.projectionLinks`.

## Proyección y Mapa

Al completar ejecución, el shell llama `PortfolioLeadContext.refreshPortfolioData`, que vuelve a consultar:

- `listStrategicFronts`;
- `listChallenges`;
- `listInitiatives`.

No se inserta el frente creado en estado local. Si el refresh falla, se conserva el éxito del comando y se muestra warning de actualización visual.

## Feature Flag

Flag:

```text
VITE_PORTFOLIO_COPILOT_ENABLED=true
```

Reglas:

- default off;
- enabled muestra Copilot en Home Portfolio Lead;
- disabled mantiene Home actual;
- tests cubren enabled/disabled del helper;
- `run-e2e.ts` lo activa explícitamente para E2E.

Backend E2E:

```text
COPILOT_ASSESSMENT_ADAPTER=deterministic
```

## Errores UX

`CopilotApiError` normaliza envelopes backend:

- 403: falta de acceso;
- 404: objeto no disponible;
- 409: stale/idempotency;
- 422: campos o contenido no procesable;
- 503: adapter no disponible;
- 500: error controlado.

No se muestran stack traces, Prisma, tablas ni payloads internos.

## Accesibilidad

- composer con label accesible;
- Enter envía y Shift+Enter conserva salto de línea;
- botones disabled durante requests;
- errores con `role="alert"`;
- estado de ejecución con `aria-live`;
- tarjetas y secciones con labels semánticos.

## Tests

Agregados:

- `http-copilot-client.test.ts`: rutas, bodies, `Idempotency-Key`, no envío libre de actores/organización.
- `PortfolioCopilotShell.test.tsx`: mensaje completo, edición, aprobación, ejecución, refresh, clarificación y doble click.
- `feature-flag.test.ts`: flag apagado/encendido.
- `portfolio-copilot-create-front.spec.ts`: E2E vertical con backend real, PostgreSQL y replay idempotente.

Resultados ejecutados:

- `npm run typecheck:front`: GO.
- `npx vitest run --config vitest.front.config.ts src/features/copilot/__tests__ --reporter=dot --silent`: GO, 3 archivos / 9 tests.
- `npm run test:front -- --reporter=dot --silent`: GO, 42 archivos / 281 tests.
- `npm run typecheck`: GO.
- `npm run build:backend`: GO.
- `npm run test:backend -- --reporter=dot --silent`: GO, 61 archivos / 515 tests, 2 skipped opt-in.
- `npm test`: GO.
- `npm run build`: GO con warnings existentes de chunk grande/dynamic import.
- `npx prisma migrate deploy`: GO; sin migraciones pendientes.
- `npx prisma migrate status`: GO; database schema up to date.
- `npm run test:e2e -- portfolio-copilot-create-front.spec.ts`: NO-GO de infraestructura/migración. El runner aplica migraciones correctamente, pero el seed falla con `P2022: The column Project.pilotLeadId does not exist in the current database`. No se usó `db push --accept-data-loss` para ocultarlo.

## Limitaciones

- No hay listado backend global de conversaciones pendientes; la UI recupera la conversación activa conocida por `sessionStorage`.
- El editor conserva `organizationId` y `createdBy` del payload backend porque el schema actual los exige en PATCH; no son editables ni generados por el usuario.
- No hay analytics frontend real; no se creó un sistema paralelo.
- E2E requiere PostgreSQL/Docker y que el seed `portfolio@starteria.io` exista.

## Riesgos

| Riesgo | Mitigación actual |
| --- | --- |
| Usuario existente sin organización | E2E prepara organización; backend devuelve `ORGANIZATION_ACCESS_DENIED` en runtime real. |
| Refresh visual falla tras crear frente | Warning en UI; no reejecuta comando. |
| Doble click | Botón disabled y backend idempotente; test cubre una sola llamada. |
| Stale version | Error 409 y recuperación de conversación/plan. |
| Flag activado sin backend adapter | Backend devuelve 503 controlado. |
| E2E no puede seedear con migraciones actuales | Crear/aplicar migración faltante para `Project.pilotLeadId` o ajustar seed; no usar `db push --accept-data-loss` como sustituto de migración. |

## Siguiente bloque

1. Endpoint backend para listar conversaciones/planes pendientes del usuario.
2. Bandeja compacta real de propuestas pendientes.
3. Analytics frontend si existe infraestructura canónica.
4. Reconciliador de ejecuciones `executing` antiguas.
5. Adapter IA real sin permisos de escritura.
