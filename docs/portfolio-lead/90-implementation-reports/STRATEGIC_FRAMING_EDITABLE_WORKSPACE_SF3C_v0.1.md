# Strategic Framing — Editable Workspace SF-3C v0.1

**Estado:** implementado en `feat/strategic-framing-sf3c-editable-workspace`; pendiente de revisión humana y certificación de entorno.

## Alcance y API

SF-3C consume un `StrategicFramingProvisionalState` existente por `stateId`.

- `GET /api/v1/strategic-framing/states/:stateId` — `authenticate` + `portfolio:read`.
- `PATCH /api/v1/strategic-framing/states/:stateId` — `authenticate` + `portfolio:write`.
- El PATCH exige `expectedVersion` positivo y delega en SF-3B el historial, corrección y conflicto optimista.
- El schema Zod estricto no acepta `organizationId`, `userId`, ids canónicos, procedencia, suficiencia ni `scopeAssessment`.

En ambas operaciones el controller obtiene `User.organizationId` server-side a partir de `req.user.id`; el cliente no puede elegir el ámbito.

## Workspace

La ruta `/portfolio/framing/:stateId` muestra estado provisional, origen, versión, contexto, edición estructurada y suficiencia como evaluación actual. Permite guardar/cancelar explícitamente y ofrece `Recargar versión` ante `SF_PROVISIONAL_STATE_STALE`, sin sobrescribir cambios concurrentes.

Editables: movimiento intencionado, por qué importa, señal, horizonte, decisión que habilita, nivel de sujeto y estado/etiqueta del contexto padre.

Solo lectura: `scopeAssessment` y rationale/confianza, suficiencia, procedencia, source mode, versión y timestamps.

Al editar el padre se conservan sus `sourceRefs` confiables existentes; el navegador no puede sustituirlos. No hay Copilot, CTA de crear Frente/Reto ni composición de trabajo existente.

## Evidencia y límites

- Backend HTTP SF-3C: 9/9 tests PASS; 18/18 tests PASS incluyendo el servicio provisional SF-3B.
- Frontend workspace SF-3C: 9/9 tests PASS.
- SF-2/SF-3B focalizados: 14/14 tests PASS (read service 5 + provisional state 9).
- Typecheck backend/frontend: PASS.
- Frontend build: PASS.
- `git diff --check`: PASS.
- Sin modelos Prisma, migraciones ni escrituras canónicas.
- SF-3D conserva la iniciación/selección desde Public Entry, Enterprise Direct y Existing Portfolio.

Regression guards confirmados: no hay cambios en `front/prisma/schema.prisma`, migraciones, Portfolio Home integration, Copilot, CandidateChallenge ni servicios de mutación canónica.

No quedan gaps de aceptación SF-3C dentro del alcance de esta batería. Las suites amplias de producto y la certificación de runtime externo permanecen fuera de este cierre.

## Test evidence closure — 2026-09-25

### Backend HTTP boundary

`backend/modules/strategic-framing/__tests__/strategic-framing.router.test.ts`

- unauthenticated GET/PATCH: PASS;
- `portfolio:read` / `portfolio:write`: PASS;
- server-side `User.organizationId`, client `organizationId`/`userId` no grant: PASS;
- authorized provisional response, not-found, cross-user and cross-org denial propagation: PASS;
- strict body rejection for organization/user ids, canonical ids, `sourceRefs`, `provenance` and missing `expectedVersion`: PASS;
- valid correction and parent label/status correction with trusted refs preserved by the service contract: PASS;
- stale `SF_PROVISIONAL_STATE_STALE` mapped to HTTP conflict: PASS;
- canonical mutation guard: PASS; router/controller exposes only provisional read/correction service calls.

### Frontend workspace

`front/src/features/portfolio-lead/strategic-framing/__tests__/StrategicFramingWorkspacePage.test.tsx`

- existing provisional state, Provisional badge, source mode, version and last update: PASS;
- intended movement, why-it-matters and parent status/label editing: PASS;
- four subject levels with user-facing labels, unresolved parent and read-only sufficiency sections: PASS;
- save with `expectedVersion`, local server version update and cancel-to-server-state: PASS;
- stale conflict does not retry, exposes explicit reload, and reloads latest state: PASS;
- no Create Front/Create Challenge CTA and no Copilot dependency: PASS;
- not-found, forbidden and generic load errors: PASS.

### Regression guards

No Prisma schema or migration changes, canonical writes, CandidateChallenge persistence,
Copilot, multi-entry orchestration or Portfolio Home integration were introduced by
the SF-3C test-closure changes. Existing implementation changes remain limited to
the already-authorized SF-3C slice in this working tree.
