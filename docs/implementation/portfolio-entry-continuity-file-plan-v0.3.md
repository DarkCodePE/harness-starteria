> HISTORICAL / PLAN: ver ../../CURRENT_STATE.md. Este plan no autoriza incorporar backend/, front/, Prisma, runtime ni tests productivos en este repositorio publico. No duplica el contrato activo; usar ../../doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md.

# Portfolio Entry - file plan minimo para continuidad Portfolio v0.3


Estado: plan tecnico aprobado con correcciones documentales obligatorias, no implementado en runtime.
Objetivo: implementar despues una continuidad Portfolio autorizada sin Project/Steps por defecto.

## Principios

- No tocar Step 0-4 ni Adaptive Core para resolver Entry.
- No cambiar prompts productivos para ocultar un problema de destino.
- No reutilizar `Project` ficticio como contenedor Portfolio.
- Mantener conversion Initiative como regresion separada.

## Diff funcional futuro

| Slice | Archivos probables | Cambio esperado | Pruebas |
|---|---|---|---|
| Perfil/versionado de sesion | `front/prisma/schema.prisma`, migracion nueva, `backend/modules/portfolio-entry-sessions/**` | agregar perfil/destino permitido y version, sin reclasificar sesiones antiguas | unit repository + integration Prisma |
| Politica de continuidad | nuevo modulo bajo `backend/modules/portfolio-entry-continuation/` o equivalente | resolver perfil, revision vigente, claim, permisos, ambito Portfolio y snapshot | service tests + router tests |
| Persistencia snapshot Portfolio | modelo existente primero: evaluar `Company`, `Organization`, `PortfolioEntrySession`; si falta, propuesta ADR/migracion | guardar handoff revisado con procedencia y pendientes dentro del ambito autorizado | integration DB |
| Rechazo Project desde Portfolio | `backend/modules/portfolio-entry-conversion/**` | si sesion perfil Portfolio, rechazar conversion Project con error especifico; mantener Initiative path legitimo | conversion regression + negative tests |
| Bridge post-auth | `front/src/app/pages/AuthPage.tsx`, `front/src/features/portfolio-entry/public/**` | despues de claim, pedir al backend destino permitido; no confiar en CTA/query param | frontend tests |
| Destino Portfolio | `front/src/app/pages/PortfolioLeadHomePage.tsx` o nueva vista existente bajo `/portfolio/*` si procede | mostrar contexto de sesion, procedencia, pendientes y primera accion real | RTL + E2E autorizado |
| Permisos | `backend/shared/authz/permissions.ts`, `backend/modules/portfolio/portfolio.router.ts` solo si evidencia lo exige | validar `portfolio:read`/`portfolio:write` y ambito; no inferir por email/claim | authz tests |
| Idempotencia | repositorio de idempotencia existente o nuevo scope | clave por sessionId + revision + destino + user + operation | race/idempotency integration |
| E2E | `front/e2e/portfolio-entry-portfolio-continuation.spec.ts` futuro | registro/claim -> continuidad Portfolio -> primera accion real; sin Project/Steps | Playwright con DB autorizada |

## Pruebas obligatorias antes de declarar E2E

- Sesion Portfolio intenta endpoint Project: rechazo sin efectos.
- Doble conversion concurrente: un solo destino.
- Revision antigua confirmada: rechazo.
- Sesion ajena: 403.
- Usuario autenticado sin permiso Portfolio: 403/flujo de solicitud, sin fallback a Step 0.
- Fallo de persistencia: no crea Project ni snapshot parcial irreversible.
- Refresh/retorno: contexto confirmado visible.
- Conversion Initiative existente sigue pasando bajo perfil autorizado.

## Bloqueos conocidos

- Falta ratificar ADR-031 y contrato post-entry.
- Falta elegir contenedor/persistencia Portfolio con evidencia de permisos.
- Las integraciones DB criticas estuvieron skipped en la ultima ejecucion reportada.
