# ADR-023: Modelo de equipo unificado (scoped al reto, heredado por iniciativas)

## Status
Accepted — 2026-06-14

## Date
2026-06-14

## Context

El dominio de gestión de innovación (ADR-009, schema en `front/prisma/schema.prisma`)
modela `StrategicFront` (frente) → `Challenge` (reto) → `Project` (iniciativa) →
`Step` (0–4). El vínculo reto↔iniciativa **no es directo**: el único puente es
`InitiativePortfolioMeta` (`@@unique([projectId, challengeId])`), dominio del
portafolio-lead (ADR product / milestone #7).

Hoy conviven **tres representaciones distintas de "equipo"**, sin FK entre ellas:

1. **`ChallengeSquadMember`** (nivel reto): `value: String` + `role: String?` — texto
   libre, **no** referencia a `User`. Es donde el portafolio-lead "asigna al equipo
   que abordará el reto" (`activationMode = squad_asignado`).
2. **`TeamMember`** (nivel iniciativa): `userId → User` real, `role: TeamRole`
   (`OWNER|EDITOR|VIEWER`), `status`, `modulePermissions: String[]`. Es el equipo que
   **realmente trabaja** la iniciativa en el portal de Steps.
3. **`InitiativePortfolioMeta.teamMembers`** (`Json?`) + `teamOwner`/`teamLabel`
   (`String?`): copia denormalizada para pintar el dashboard.

Esto genera: (a) traducción manual squad→TeamMember al crear iniciativa desde el reto
(milestone #96), que hoy copia strings a Json sin materializar usuarios reales;
(b) tres fuentes de verdad que se desincronizan; (c) imposibilidad de saber, desde el
reto, qué personas-usuario están comprometidas con sus iniciativas.

Pregunta de diseño que originó este ADR: *¿no es más simple tener un solo equipo por
roles?* Sí — pero con una decisión explícita de **alcance**: el equipo debe vivir donde
ocurre la asignación (el reto) y ser heredado, no un equipo plano global ni un equipo
independiente recreado por iniciativa.

Restricción de deploy (ADR-018/020): prod usa `prisma db push` (no `migrate deploy`).
Añadir `@unique` a una tabla **ya poblada** dispara el guard de pérdida de datos y
aborta el deploy ⇒ los cambios deben ser **aditivos** y la unicidad lógica se enforca
en servicios.

## Decision

Unificar en **un solo modelo de equipo tipado, propiedad del reto y heredado por sus
iniciativas, con overrides puntuales por iniciativa**. Migración **aditiva + puente**
(no reemplazo destructivo).

### Modelo de datos (aditivo)

1. **`ChallengeTeamMember`** (nuevo) — el equipo canónico del reto:
   ```
   id, challengeId → Challenge (Cascade)
   userId   String?   // nullable: admite miembro aún no registrado (compat con squad libre)
   label    String?   // nombre/área cuando userId es null (placeholder de transición)
   role     TeamRole  // reutiliza el enum existente (OWNER|EDITOR|VIEWER); ver "roles" abajo
   status   TeamMemberStatus @default(PENDING)
   createdAt, updatedAt
   @@index([challengeId]); @@index([userId])
   // unicidad lógica (userId, challengeId) enforzada en servicio (no @unique → db push)
   ```
2. **`TeamMember`** (existente, nivel iniciativa) pasa a ser **override/herencia**:
   se mantiene como está, pero su población por defecto **se deriva** del
   `ChallengeTeamMember` del reto al crear la iniciativa. Un `TeamMember` extra (p.ej.
   especialista externo a una sola iniciativa) es un override aditivo; quitar un
   heredado es un override de exclusión (campo `inheritedFrom`/`excluded` o ausencia).
3. **`ChallengeSquadMember`** queda **deprecado** (compat de lectura) durante la
   transición; se backfillea a `ChallengeTeamMember` y luego se retira (ver fases).
4. **`InitiativePortfolioMeta.teamMembers` (Json)** deja de ser fuente de verdad y pasa
   a ser **caché de lectura** del dashboard, recalculado desde
   `ChallengeTeamMember` + overrides `TeamMember`.

### Herencia y resolución

- Fuente de verdad del equipo = `ChallengeTeamMember(challengeId)`.
- Equipo efectivo de una iniciativa = `ChallengeTeamMember` del reto **menos** exclusiones
  **más** `TeamMember` propios (override). Resuelto en `team.service.resolveInitiativeTeam(projectId)`.
- Crear iniciativa desde un reto materializa los `TeamMember` heredados con `userId`
  reales (cuando existen), eliminando la copia a Json como mecanismo primario.

### Roles

Se reutiliza el enum **`TeamRole` (OWNER|EDITOR|VIEWER)** para no introducir una
segunda taxonomía de roles. Es **ortogonal** al modelo de autorización global de 6
roles (ADR-009/010): `TeamRole` describe la función dentro del equipo de un
reto/iniciativa; el rol de 6-roles describe el permiso de plataforma. No se mezclan.

### Restricción de unicidad

`(userId, challengeId)` único se enforca en `team.service` con `findFirst`-guard
(mismo patrón que `Subscription` en ADR-020 y `Project.pilotLeadId` en ADR-018), **no**
con `@unique` en el schema, para no romper `prisma db push`.

## Consequences

- **+** Una sola fuente de verdad de equipo (reto), con usuarios reales en vez de strings.
- **+** Responde la pregunta de simplicidad sin perder granularidad: equipo único por
  roles **a nivel reto**, con override por iniciativa cuando hace falta.
- **+** Elimina la traducción squad→TeamMember (milestone #96) como copia frágil de Json.
- **+** Cambios aditivos ⇒ `prisma db push` no dispara el guard de pérdida de datos.
- **+** El dashboard portafolio-lead puede mostrar compromiso real (Users) por reto.
- **−** Periodo de transición con dos tablas vivas (`ChallengeSquadMember` deprecada +
  `ChallengeTeamMember`) hasta completar backfill y retiro.
- **−** La unicidad lógica vive en servicios ⇒ tests de concurrencia obligatorios.
- **−** `meta.teamMembers` Json se vuelve derivado ⇒ hay que recalcularlo en el sync
  (extiende `portfolio/initiative-progress.ts`, ADR product milestone #95).

## Related
ADR-009/010 (modelo de 6 roles — ortogonal), ADR-018 (`prisma db push`), ADR-020
(unicidad lógica en servicio, patrón shadow/aditivo), ADR-024 (persistencia de
mutaciones del portafolio-lead), milestone #7 (#92/#95/#96/#100). Schema:
`front/prisma/schema.prisma`. Servicios: `backend/modules/portfolio/`,
`backend/modules/projects/` (TeamMember).
