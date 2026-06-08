---
id: SPEC-005
title: "Suscripciones, planes y entitlements — especificación técnica"
status: draft
date: 2026-06-08
author: BHIL Architecture (Swarm SPARC)
sprint: S-05
parent: PRD-005
children:
  - TASK-015
  - TASK-016
  - TASK-017
  - TASK-018
  - TASK-019
adrs: [ADR-020, ADR-021, ADR-022, ADR-018, ADR-013, ADR-004]
---

# SPEC-005: Suscripciones, planes y entitlements — Especificación técnica

## Specification summary

Lleva a código la capa de monetización de PRD-005 (modelo **híbrido confirmado**). El
alcance **desplegable de esta fase** es la **infraestructura de entitlements aditiva en
shadow mode** (mide, no bloquea): schema Prisma, `EntitlementService.check/meter`,
middleware `requireEntitlement` cableado en los 6 call sites detrás del flag
`BILLING_ENFORCEMENT_ENABLED=false`, seam de billing (`BillingPort` + webhook idempotente
con `ManualProvider`), seed del catálogo de planes y backfill de grandfathering.

El **frontend de billetera/checkout** y la **integración productiva de Culqi/Yape/MP**
son fases siguientes (issues fuera de este milestone, dependen de contrato de merchant).

## Constraints (heredados)

- Cambios de schema **estrictamente aditivos** — sin `@unique` sobre `User`/`Project`/
  tablas pobladas (ADR-018 / `prisma db push`). Unicidad lógica en servicios.
- Enforcement a nivel API, no UI (ADR-004). Plan resuelto desde DB, no JWT.
- Idempotencia en medición y webhooks (ADR-013 / ADR-020).
- Flag `BILLING_ENFORCEMENT_ENABLED` default `false` ⇒ deploy seguro (shadow mode).

## Modelo de datos (Prisma — aditivo)

`front/prisma/schema.prisma` — añadir enums `BillingProvider`, `SubscriptionStatus`,
`PlanInterval`; modelos `Plan`, `Subscription`, `UsageCounter`, `UsageEvent`,
`Organization`, `OrganizationMember`; y FK nullable `User.organizationId String?`.
(Definición completa en ADR-020 §1 y ADR-022 §1-2.) Unicidad permitida solo en tablas
nuevas (`Plan.code`, `UsageEvent.dedupeKey`).

## Componentes

1. **`backend/modules/billing/entitlement.service.ts`** — `check(userId, feature, qty=1)`
   (lee; resuelve User→Org→Free; devuelve `{allowed, remaining, limit, reason}`) y
   `meter(userId, feature, {dedupeKey, qty, sourceId})` (escribe; `UsageEvent` único +
   `UsageCounter.increment` atómico; no-op en P2002). `periodKey = "YYYY-MM"`.
2. **`backend/modules/billing/subscription.service.ts`** — CRUD de suscripción,
   `applyProviderEvent(event)` idempotente (no-op si estado == actual), dunning
   PAST_DUE→EXPIRED→degradar a Free.
3. **`backend/modules/billing/providers/`** — `BillingPort` + `ManualProvider` (fase 1),
   `CulqiProvider`/`MercadoPagoProvider` (stubs con TODO de contrato).
4. **`backend/modules/billing/billing.router.ts`** — `POST /api/v1/internal/billing/webhooks/:provider` (firma verificada, fuera de JWT, clase ADR-013).
5. **Middleware `requireEntitlement(feature)`** — compone con `requireRole`; en shadow
   mode mide y deja pasar. Cableado en: projects/createProject, public-ai+ai bridge,
   initiative-pdfs webhook terminal, mentor (+ decremento mentorCredits), seats, portfolio export.
6. **Seed** del catálogo (`free|starter|team|enterprise|pilot`) y **script de backfill**
   `grandfather`: cada usuario existente → `Subscription` `MANUAL` plan `pilot` (límites
   generosos), y los redentores de código de piloto (ADR-018) mapeados al mismo plan.

## TASK breakdown (vertical slices)

| TASK | Alcance | Entregable verificable |
|---|---|---|
| **TASK-015** | Schema Prisma aditivo + seed de planes | `prisma validate` OK; `db push` dry additivo; planes en DB |
| **TASK-016** | `EntitlementService.check/meter` + período + idempotencia | Tests unit: límites, reset mensual, doble-`meter` cuenta 1 |
| **TASK-017** | `requireEntitlement` + cableado en 6 call sites (shadow) | Tests: con flag off mide y pasa; con flag on bloquea al exceder |
| **TASK-018** | `BillingPort` + webhook idempotente + `ManualProvider` + `applyProviderEvent` | Tests: webhook re-entregado = no-op; firma inválida = 401 |
| **TASK-019** | Backfill grandfathering + flag wiring + env | Script idempotente; usuarios existentes en plan `pilot`; flag default off |

## Acceptance criteria (probabilísticos / cuantificados)

- `EntitlementService.check` < 50 ms P95 (lectura indexada).
- Doble `meter` con mismo `dedupeKey` ⇒ contador incrementa exactamente 1 (100% de N=100 runs concurrentes).
- Con `BILLING_ENFORCEMENT_ENABLED=false`: 0 acciones bloqueadas, 100% medidas (shadow).
- `prisma db push` aplica el schema **sin** `--accept-data-loss` (additive-only) en CI.
- Backfill: 100% de usuarios existentes con suscripción `pilot` tras correrlo; idempotente (re-run = 0 cambios).

## Out of scope (esta fase)

- UI de billetera/checkout/paywall (frontend).
- Integración productiva Culqi/Yape/MP (requiere contrato merchant).
- Dunning real, Yape auto-renew (dLocal/EBANX), usage-based billing en USD.

## Related
PRD-005, ADR-020/021/022, ADR-018 (deploy), ADR-013 (webhook idempotente), ADR-004 (authz).
