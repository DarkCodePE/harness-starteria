# ADR-020: Billing & Entitlements (capa de planes, suscripciones y medición)

## Status
Accepted — 2026-06-08

## Date
2026-06-08

## Context

Tras habilitar Google login (ADR-014), cualquier usuario autenticado usa el dashboard
y las funciones de IA/mentoría/exportación **sin plan, límite ni cobro**. No existe
capa de monetización y el costo marginal de inferencia LLM (ADR-001/008) no se acota
ni se recupera. PRD-005 confirma un **modelo híbrido** (B2C self-serve + B2B por
cohorte) y exige una capa de entitlements que sirva ambos caminos con una sola base.

Restricción de deploy (ADR-018): el prod se gestiona con `prisma db push` (no
`migrate deploy`, falla con P3005). Añadir un `@unique` a una tabla **ya poblada**
dispara el guard de pérdida de datos de `db push` y aborta el deploy. Por tanto la
unicidad sobre `User`/`Project` debe enforcarse en servicios, no en el schema (mismo
patrón que `Project.pilotLeadId` y `RefreshToken.tokenHash`).

## Decision

Introducir una capa **estrictamente aditiva** (tablas nuevas + FKs escalares nullable):

1. **Catálogo `Plan`** con límites como JSON extensible (`limits`, `-1` = ilimitado),
   evitando migraciones por cada nuevo límite. Códigos: `free | starter | team |
   enterprise | pilot`.
2. **`Subscription`** que cuelga de **`User` XOR `Organization`** (ambos FK nullable).
   La unicidad "una activa por sujeto" se enforca en `SubscriptionService` (findFirst
   guard), **no** con índice parcial (db push no puede añadirlo a tabla poblada).
3. **Medición CQRS:** `EntitlementService.check(userId, feature, qty)` (lee, no muta)
   + `EntitlementService.meter(...)` (escribe). `check` resuelve plan en orden
   **User → Organization (vía OrganizationMember) → Free implícito** (sin fila).
4. **`UsageCounter`** por `(subscriptionId, feature, periodKey="YYYY-MM")`. El reset
   es **implícito**: al cambiar el mes, `check` calcula un `periodKey` nuevo, no
   encuentra contador y arranca en 0. Sin cron, sin borrado destructivo.
5. **`UsageEvent`** = ledger idempotente con `dedupeKey @unique`
   (`"<feature>:<sourceId>"`). En P2002 (re-entrega) `meter` es no-op ⇒ AI runs y
   webhooks cuentan **una vez**. Incremento del contador vía `update { increment }`
   atómico (no read-modify-write).
6. **Enforcement a nivel API** (ADR-004) como middleware `requireEntitlement(feature)`
   que compone con `requireRole`/`requireOwnership`, detrás del flag
   **`BILLING_ENFORCEMENT_ENABLED` (default `false`)**: en `false`, `check` siempre
   devuelve `allowed:true` pero **igual mide** (shadow mode) para recolectar
   distribuciones reales antes de bloquear.
7. **Plan/entitlement se resuelve desde la DB en el call site**, no desde el JWT (el
   rol en JWT puede estar obsoleto ≤15 min, ADR-004) ⇒ downgrade/cancelación inmediatos.

### Call sites (features medidas)

| Feature | Módulo |
|---|---|
| `project_create` | `backend/modules/projects/project.service.ts` (createProject) |
| `ai_refine` | bridge IA / `backend/modules/public-ai` + `backend/modules/ai` (ADR-011/013) |
| `pdf_extract` | `backend/modules/initiative-pdfs` (medido en estado terminal del webhook, ADR-013) |
| `mentor_credit` | `backend/modules/mentor` (+ decremento de `Project.mentorCredits`) |
| `seats` | invitación de `TeamMember` / `OrganizationMember` |
| `exec_export` | `backend/modules/portfolio` (export de `ExecutiveOutput`) |

## Consequences

- **+** Cambios aditivos ⇒ `prisma db push` no dispara el guard de pérdida de datos.
- **+** Shadow mode permite desplegar **sin riesgo de UX**: mide, no bloquea, hasta
  calibrar y activar el flag.
- **+** Idempotencia reusa patrones existentes (ADR-013 `syncRunFromUpstream`, ADR-018
  single-use token).
- **+** Una sola base sirve B2C y B2B (PRD-005 híbrido).
- **−** La unicidad lógica vive en servicios, no en el schema → disciplina de código
  (tests de concurrencia obligatorios).
- **−** Free tier activo cuesta ~$5/usuario/mes sin tope ⇒ los límites de `ai_refine`/
  `pdf_extract` en Free son **críticos** para el margen (objetivo ≤$2).

## Related
PRD-005, SPEC-005, ADR-001/008 (costo LLM), ADR-004/009/010 (authz), ADR-011/013
(bridge + webhook interno), ADR-018 (`prisma db push`), ADR-021 (webhooks billing),
ADR-022 (organización/cohorte).
