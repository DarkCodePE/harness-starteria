# ADR-024: Persistencia de mutaciones del Portafolio Lead (cerrar el camino WRITE)

## Status
Accepted — 2026-06-14

## Date
2026-06-14

## Context

El milestone #7 integró portafolio-lead ↔ portal de Steps. El camino **READ** ya está
cableado (#100): `PortfolioLeadProvider` lee del backend vía `domain/adapters.ts`, y
`Initiative.projectId` es real. La sincronización de progreso Steps→seguimiento existe
(#95): `step.service.updateStepStatus` + `project.service.updateStep0` proyectan a
`InitiativePortfolioMeta.status` vía `portfolio/initiative-progress.ts`.

**Brecha conocida (follow-up abierto del milestone #7):** las **mutaciones** del
`PortfolioLeadProvider` (editar campos de seguimiento de una iniciativa: mentor,
blocker, decisión, equipo, deliverables, etc.) **son locales** — se aplican al estado
del provider en el cliente pero **no se persisten** en el backend. Tras un refresh se
pierden. El único endpoint de escritura que liga Project↔Challenge hoy es
`portfolio.service.upsertInitiativeMeta` (`PUT /initiatives/:projectId/meta`).

Con ADR-023 (equipo unificado) esto se vuelve crítico: editar el equipo desde el
dashboard debe persistir a `ChallengeTeamMember`/`TeamMember`, no a estado efímero.

## Decision

Cerrar el camino **WRITE** del portafolio-lead contra el backend, reusando el endpoint
de meta existente y extendiéndolo donde haga falta:

1. **Mutaciones de campos de seguimiento** (status manual, mentor, blocker, decisión,
   recomendaciones, flags) → `PUT /api/portfolio/initiatives/:projectId/meta`
   (`upsertInitiativeMeta`), idempotente por `@@unique([projectId, challengeId])`.
2. **Mutaciones de equipo** (ADR-023) → endpoints dedicados de team
   (`/api/portfolio/challenges/:id/team`, `/initiatives/:projectId/team`) que escriben
   `ChallengeTeamMember`/`TeamMember`, **no** el Json. `meta.teamMembers` se recalcula
   como caché derivada.
3. **`PortfolioLeadProvider`** expone acciones async que llaman estos endpoints y
   hacen optimistic update + reconcile; deja de mutar solo estado local.
4. **Campos derivados** (`meta.status`, `blockedDays`, `lastActivity`) siguen siendo
   responsabilidad del sync (`initiative-progress.ts`) y **no** se aceptan como
   escritura manual arbitraria (el sync gana) salvo overrides explícitos de decisión.

## Consequences

- **+** El dashboard de seguimiento deja de perder ediciones tras refresh.
- **+** Reusa `upsertInitiativeMeta` + `@@unique` ⇒ idempotencia gratis.
- **+** Habilita la edición de equipo de ADR-023 con persistencia real.
- **−** Hay que distinguir campos **derivados** (los gana el sync) de campos
  **editables** (los gana el usuario) ⇒ contrato explícito de qué es escribible.
- **−** Optimistic update requiere manejo de reconcile/rollback en el provider.

## Related
ADR-023 (modelo de equipo unificado), milestone #7 (#95 sync, #100 READ path).
Servicios: `backend/modules/portfolio/portfolio.service.ts`
(`upsertInitiativeMeta`/`getInitiativeMeta`), `front/src/features/portfolio-lead/`
(`PortfolioLeadProvider`, `domain/adapters.ts`).
