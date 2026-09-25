# Portfolio Entry → Portfolio Home Integration v0.1

**Slice:** `PORTFOLIO_HOME`  
**Estado:** implementación de slice verificada en checkout  
**Fecha:** 2026-09-25

## Route

Se reutiliza la ruta canónica `/portfolio/inicio`. El continuation solo identifica
el contexto de llegada mediante `portfolioEntryContinuationId`; el contexto de
negocio se resuelve server-side.

## Server-side authorization chain

`authenticated User.id → owned PortfolioEntryPortfolioContinuation → source
PortfolioEntrySession → selected organization context → current
OrganizationMember → current OrganizationPortfolioAccessGrant(portfolio:read)`.

La lectura nueva es `GET /api/v1/public/portfolio-entry/continuations/:continuationId/home-context`.
La autorización no confía en query params, `organizationId`, permisos globales ni
el snapshot histórico como autoridad. Bootstrap vuelve a validar la membresía y
el grant actual antes de crear o reutilizar estado provisional.

## Entry context projection and arrival UX

La respuesta pública del endpoint es una proyección segura que contiene solo:

- necesidad entendida y resultado deseado;
- contexto confirmado;
- asuntos aún abiertos;
- trabajo para más adelante;
- incógnitas que requieren confirmación organizativa;
- organización seleccionada y una siguiente acción humana.

Portfolio Home muestra el panel **Tu punto de partida** y conserva el contexto
útil sin repetir intake. No expone estados internos, nombres de modelos,
capabilities, versiones, prompts ni detalles de autorización.

## Bootstrap reuse

**Sí.** Se reutiliza `PortfolioBootstrapSession` mediante
`createOrReuseFromContinuation`. Sigue siendo provisional y no crea
`StrategicFront`, `Challenge`, `Initiative`, `Project` ni `Steps` al abrir Home.

## Continuity and no-repeat evidence

La cadena conserva `PortfolioEntrySession.id`, continuation, handoff y
confirmation. No se crea una segunda sesión ni se vuelve a ejecutar la cognición;
la lectura es read-only y deriva la proyección desde el snapshot persistido.

## Revocation and boundaries

Si se revoca el grant scoped, el endpoint Home devuelve estado de acceso denegado
y la UI muestra un fallback seguro; no se crea/reutiliza Bootstrap. `portfolioScope`
histórico no puede sustituir la comprobación actual de membresía + grant.

No hubo cambios de esquema ni migraciones.

## Tests and verification

- HOME-01–HOME-16: cubiertos por `portfolio-home-entry-context.test.ts` y las
  pruebas existentes de context establishment/bootstrap; ownership, organización,
  grant, linkage, proyección, read-only, no cognition y no canonicalización.
- HOME-UI-01–HOME-10: panel de llegada, copy de contexto, asuntos abiertos,
  trabajo posterior, siguiente acción, ausencia de jerga y fallback seguro;
  cobertura focalizada en `PortfolioLeadHomePage.bootstrap.test.tsx`.
- Transition integration: la ruta de continuación existente mantiene el mismo
  session id y el nuevo read precede a Bootstrap; la suite DB de integración
  pasa contra la base de datos E2E indicada abajo.
- DB-backed integration: `backend/modules/portfolio-entry-continuation/__tests__/portfolio-home-entry-context.integration.test.ts` PASS
  against `postgresql://postgres:postgres@localhost:55433/starteria_e2e`, gated by
  `PORTFOLIO_ENTRY_DB_INTEGRATION=1`.
- Authorized home-context: PASS; the real authenticated router/service path
  returned the selected authorized organization and preserved the same
  `PortfolioEntrySession.id`, handoff/confirmation linkage, confirmed context,
  and organizational unknowns.
- No-repeat/read-only: PASS; no second session or continuation was created and
  `StrategicFront`, `Challenge`, `Project`, `PortfolioEntrySession`,
  `PortfolioEntryModelExecution`, scoped-grant, and `OrganizationMember` counts
  were unchanged during the read.
- Revoked access: PASS; deleting the current `portfolio:read` grant denied the
  next read, and the historical `portfolioScope` did not bypass authorization.
  Anonymous access, cross-user access, and an attempted client organization
  swap were denied or ignored safely.
- Backend typecheck: PASS.
- Frontend typecheck: PASS.
- Backend focalizado: 26 PASS.
- Frontend focalizado: 22 PASS.
- `git diff --check`: PASS.

## Remaining boundary

La transición termina en Portfolio Home/Bootstrap provisional. Strategic Front,
Challenge, Initiative, Project, Steps, grant issuer UI y cualquier acción de
canonicalización requieren una slice explícita posterior.
