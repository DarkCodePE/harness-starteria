# Plan MVP — Portafolio: workspaces, estados, acceso por iniciativa y convocatoria

- **Fecha**: 2026-08-19
- **Estado**: Propuesto (pendiente de bajar cada slice a `feature_list.json` al arrancarla, WIP = 1)
- **Fuentes**: `feature_list.json`, `front/prisma/schema.prisma`, `front/src/features/portfolio-lead/domain/types.ts`, ADR-023/024/025/029

## 1. Objetivo y modelo de dominio

Un **Objetivo** (frente estratégico) se divide en **Retos**; los retos son abordados por **Iniciativas** (proyectos con Steps 0–4); el **Portfolio Lead** define qué reto abordar, define el equipo, abre una **convocatoria**, y al final decide sobre cada iniciativa.

La jerarquía **ya existe en el código** (confirmado en Prisma):

```
StrategicFront (objetivo)  →  Challenge (reto)  →  InitiativePortfolioMeta ↔ Project (iniciativa, Steps 0–4)
                                   ├─ ChallengeTeamMember   (equipo del reto, ADR-023)
                                   ├─ ChallengeInvitation   (personas invitadas)
                                   └─ activationMode / openCallStatus / visibleToParticipants (convocatoria)
```

## 2. Qué ya existe — no re-construir

| Pieza pedida | Estado | Evidencia |
|---|---|---|
| Dos workspaces por plataforma | **HECHO** | ADR-029 fase 1 desplegada: PBA-01..06 + 08 passing. Switcher de workspace, menú por permisos, roles múltiples (`User.roles[]`), `/admin/roles`. |
| Estructura Objetivo → Retos → Iniciativas | **HECHO (schema + API)** | Modelos `StrategicFront`, `Challenge`, `InitiativePortfolioMeta` + endpoints `/portfolio/*` (30 guards con `requirePermission`). |
| Conectar reto con iniciativa (crear desde reto) | **HECHO** | `portfolio-steps-integration` passing: `challengeLink` → Project + meta + herencia de frente/reto/equipo + Step 0 prefill. |
| Definir el equipo (modelo de datos) | **HECHO (modelo)** | ADR-023/024: `ChallengeTeamMember` scoped al reto, materializado en `TeamMember` por iniciativa y sobreescribible. |
| Estados | **PARCIAL** | Enums ricos en schema y dominio front (reto: `draft → ready_to_activate → activating_team → active → receiving_initiatives → in_tracking → pending_decision → closed`; iniciativa: `in_step_N`, `blocked`, `ready_for_decision`, `closed`). **Falta**: estado `paused` (no existe en ningún enum canónico), transiciones validadas server-side y persistencia verificada. |
| Convocatoria | **PARCIAL** | `Challenge.activationMode` (default `convocatoria_abierta`), `openCallStatus`, `visibleToParticipants`, `publicationNotes`, `lastPublishedAt`, `ChallengeInvitation`. **Falta**: flujo end-to-end "persona recibe link → ve el reto → crea iniciativa" verificado, y la UI de publicación conectada al backend. |
| Dar acceso por iniciativa | **PARCIAL** | `TeamMember` por proyecto existe (heredado del reto). **Falta**: enforcement server-side en lecturas (issue #161: 7 lecturas de portfolio sin gate) y UI de gestión de acceso por iniciativa. |
| Persistencia de mutaciones del portfolio | **EN RIESGO** | `portfolio-persist-mutations` está `blocked` sin evidencia ejecutable: activación, equipo y exec-outputs editados podrían vivir solo en el provider de React (hay `mockData.ts` en la feature). |

## 3. Decisiones previas a codificar (proponer **ADR-030**)

1. **Máquina de estados canónica y única** por entidad (reto e iniciativa), con transiciones válidas **en el servidor**. Decidir si "en pausa" y "bloqueado" son estados de la máquina o efectos de una decisión (`PortfolioDecisionOutcome` ya contempla pausar) más un flag. Hoy `InitiativePortfolioStatus` tiene `blocked` pero **nadie tiene `paused`**.
2. **Regla de acceso por iniciativa**: quién ve/edita una iniciativa — miembro de su equipo (`TeamMember`) ∪ equipo del reto ∪ `portfolio:read`. Qué ve un no-miembro (¿404 o ficha resumida?). Falla cerrado.
3. **Alcance de la convocatoria MVP**: link interno autenticado (reusar `/retos/:challengeId` + `visibleToParticipants`) vs link público estilo `/public/*`. Recomendación MVP: **interno autenticado** — el flujo público de pilotos ya existe y es otra puerta.
4. **Deuda de enums dobles** (canonical + legacy en cada status): congelar el canónico en ADR-030 y planificar la migración del legacy, sin bloquear el MVP.

## 4. Fases y slices (para `feature_list.json`, WIP = 1)

### Fase 0 — Fundación (bloqueante para todo lo demás)

**MVP-P0-01 · Desbloquear el stack e2e y cerrar PBA-07** — tamaño S
- Liberar el puerto 5433 (docker-proxy huérfano) o remapear `starteria-db` + `DATABASE_URL`; correr `npm run docker:up && npm run test:e2e`; registrar evidencia de PBA-07 (dual-role).
- Verificación: suite e2e verde local.

**MVP-P0-02 · Persistencia real de mutaciones del portfolio** (retoma `portfolio-persist-mutations`) — tamaño M
- Toda mutación del provider portfolio-lead (crear/editar frente y reto, activación, equipo, clasificación, exec-outputs, decisiones) golpea el backend y sobrevive recarga + re-login. Retirar `mockData.ts` del camino de escritura.
- Scope_out: nuevos estados (Fase 1), convocatoria (Fase 4).
- Verificación: e2e "crear frente → crear reto → activar → recargar → sigue todo"; unit del provider sin mock en escrituras.

### Fase 1 — Estados (activado · bloqueado · en pausa)

**MVP-P1-01 · Máquina de estados del reto** — tamaño M
- Transiciones válidas server-side (Zod + service), incluir `paused` según ADR-030; UI de cambio de estado en `/portfolio/retos` con estados visibles (badge); un reto `paused`/`closed` no acepta iniciativas nuevas.
- Verificación: unit de transiciones (válidas e inválidas → 409/422) + e2e activar→pausar→reactivar con recarga.

**MVP-P1-02 · Estados de la iniciativa sincronizados** — tamaño M
- `InitiativePortfolioMeta.status` refleja el step real (`in_step_N`), soporta `blocked`/`paused`, y la decisión del lead (pausar/cerrar) transiciona el estado. El participante ve el estado (banner en el proyecto si está pausada/bloqueada; edición bloqueada según ADR-030).
- Verificación: unit de sincronización step→status + e2e decisión "pausar" → proyecto en solo-lectura.

### Fase 2 — Conexión reto ↔ iniciativa (rama "Sí" del flujo)

**MVP-P2-01 · Vincular / clasificar iniciativas existentes + owner** — tamaño M
- Desde `/portfolio/iniciativas`: vincular una iniciativa existente a frente/reto, asignar owner; persiste en `InitiativePortfolioMeta` (estado `imported_pending_validation` ya existe en el enum).
- Verificación: e2e vincular → recargar → clasificación y owner persisten; el participante dueño la ve conectada al reto.

### Fase 3 — Equipo y acceso por iniciativa

**MVP-P3-01 · UI de equipo del reto y de la iniciativa** — tamaño M
- Gestión visual sobre ADR-023: añadir/quitar miembros del reto (`ChallengeTeamMember`) y override por iniciativa (`TeamMember`). Sin tocar el modelo (ya existe).
- Verificación: e2e añadir miembro al reto → nueva iniciativa lo hereda → override en una iniciativa no toca el reto.

**MVP-P3-02 · Enforcement de acceso por iniciativa** — tamaño M/L
- Guard server-side: solo equipo de la iniciativa ∪ equipo del reto ∪ `portfolio:read` leen/escriben la iniciativa. Cierra el issue **#161** (7 lecturas sin gate). Falla cerrado (403), sin oráculo de PII.
- Verificación: unit por endpoint (miembro 200 / no-miembro 403 / portfolio_lead 200) + e2e con dos participantes.

### Fase 4 — Convocatoria (rama "No" del flujo)

**MVP-P4-01 · Crear y publicar la convocatoria del reto** — tamaño M
- El lead redacta y publica: `activationMode`, `openCallStatus=activa`, `visibleToParticipants=true`, `publicationNotes`, invitados (`ChallengeInvitation`). El reto aparece a los participantes elegibles en el dashboard.
- Verificación: e2e publicar → participante lo ve en su dashboard; despublicar → deja de verse.

**MVP-P4-02 · Link de convocatoria → ver reto → crear/aceptar iniciativa** — tamaño M
- Cadena completa: invitado abre el link (interno autenticado, `/retos/:challengeId`) → ve el reto → crea la iniciativa desde ahí (reusa `challengeLink` de `portfolio-steps-integration`) o acepta una propuesta según ADR-030.
- Verificación: **e2e de referencia nuevo**: lead publica → participante entra por link → crea iniciativa → aparece en `/portfolio/iniciativas` del lead con estado `in_step_0`.

## 5. Orden y dependencias

```
Fase 0 (MVP-P0-01 → MVP-P0-02)          ← bloqueante: sin persistencia no hay nada que probar
   └→ Fase 1 (estados)
        ├→ Fase 2 (vincular/clasificar)      ← paralelizable con Fase 3 entre sesiones (WIP=1 dentro de cada una)
        ├→ Fase 3 (equipo y acceso)
        └→ Fase 4 (convocatoria)             ← depende de estados (P1) y de acceso (P3-02) para publicar con seguridad
```

Regla del repo: **una sola feature `in_progress`**; cada slice entra a `feature_list.json` con `scope_out` y `verification` declarados **antes** de codificar, y pasa a `passing` solo con evidencia ejecutable (un PR mergeado no cuenta).

## 6. Puerta de completación del MVP

El MVP de este plan está completo cuando el e2e de referencia nuevo (MVP-P4-02) corre verde junto al smoke existente (PDF autofill → Step 0), y:

1. Un lead crea objetivo → retos → publica convocatoria → invitado crea iniciativa por link.
2. Estados activado/bloqueado/en pausa persisten tras recarga y gobiernan qué se puede hacer.
3. Un no-miembro recibe 403 en una iniciativa ajena; un miembro entra.
4. Todo sobrevive recarga + re-login (nada vive solo en el provider).

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Escrituras del portfolio sobre mock (`mockData.ts`) — el mayor | Fase 0 primero; ningún slice de fases 1–4 arranca sin MVP-P0-02 verde. |
| Enums dobles legacy/canonical divergen al añadir `paused` | ADR-030 congela el canónico; adapter único legacy→canonical. |
| `prisma db push` con enum nuevo contra base poblada | Añadir valores de enum es aditivo (seguro); verificar contra Postgres efímero poblado como en PBA-02. |
| Acceso por iniciativa rompe flujos existentes (mentor/admin/sponsor) | Matriz de permisos en ADR-030 antes de tocar guards; suite unit por rol como en PBA-04. |
| Puerto 5433 sigue tomado | Remapear puerto en compose + `DATABASE_URL` (no depender de reiniciar el daemon). |
