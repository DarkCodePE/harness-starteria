---
id: PRD-005
title: "Suscripciones, planes y monetización"
status: approved
date: 2026-06-07
author: Swarm de 5 agentes (value-map · market · pricing · unit-economics · entitlements) — sintetizado por Claude
sprint: S-05
priority: high
children:
  - SPEC-005
adrs: [ADR-020, ADR-021, ADR-022]
---

> **Decisión de segmento — CONFIRMADA (2026-06-08): MEZCLA = HÍBRIDO.** El producto
> atiende **a la vez** individuos sueltos y organizaciones que corren programas. Por
> tanto se construye **una sola** infraestructura de entitlements que sirve los dos
> caminos: la `Subscription` puede colgar del `User` (B2C: el individuo paga su Pro)
> o de la `Organization`/`Cohort` (B2B: la empresa paga por sus participantes), y
> `EntitlementService.check` resuelve en orden User → Organization → Free. "Cobrar al
> que sube la iniciativa" queda cubierto: si vino solo, paga él (Free→Pro); si vino
> por un programa, ya lo cubrió su organización. El secuenciamiento de construcción
> (no de segmento) es: **infra de entitlements + topes Free + Pro B2C (Culqi+Yape)
> primero, licencia B2B por cohorte después** — misma base, se activa por fases.
---

# PRD-005: Suscripciones, planes y monetización

> **Síntesis ejecutiva (leer primero).** Hoy, tras habilitar Google login, cualquier
> usuario usa el dashboard de Starteria **sin límites ni cobro**: no existe capa de
> plan/suscripción/entitlement/billing. El modelo de datos es **B2B-first**
> (cohortes, sponsors, challenges, portfolio, executive outputs ⇒ el comprador
> natural es la organización que corre el programa, no el participante). La
> recomendación es un **modelo híbrido**: un **contrato B2B por cohorte/programa**
> como motor de ingresos, sobre un **ladder B2C self-serve (Free → Pro → Team)**
> que actúa como funnel de adquisición y monetiza los pilotos actuales. La IA y los
> mentor-credits se cobran como **asignación incluida por plan + paquetes de recarga
> pagables por Yape**, nunca como pago-por-uso crudo. Rail de pago: **Culqi
> (recurrente con card-on-file) + Yape (one-shot/recargas vía Culqi) + Mercado Pago
> (fallback con suscripción nativa)**; **Stripe queda descartado** (no disponible para
> merchants peruanos). Toda la capa técnica es **aditiva** y respeta el modelo de
> deploy `prisma db push` (sin nuevos `@unique` sobre tablas pobladas; ver ADR-018).

---

## Problem statement

La plataforma no puede generar ingresos sostenibles ni acotar su costo marginal de IA porque, tras autenticarse (incluido Google login), cualquier usuario accede al dashboard y a las funciones de IA, mentoría y exportación sin ningún plan, límite o cobro que capture el valor entregado ni recupere el costo de inferencia LLM.

---

## User stories (EARS format)

**US-001 — Plan implícito por defecto:**
WHEN un usuario autenticado (password o Google) sin suscripción activa accede a una función monetizable, the system SHALL resolver su plan como **Free** (catálogo `Plan.code = "free"`) y aplicar sus límites sin requerir ninguna fila de suscripción.

**US-002 — Verificación de entitlement antes del efecto:**
WHEN un usuario intenta una acción medida (`project_create`, `ai_refine`, `pdf_extract`, `mentor_credit`, `seats`, `exec_export`), the system SHALL invocar `EntitlementService.check(userId, feature, qty)` **antes** de ejecutar el efecto colateral, y SHALL permitir o bloquear según `Plan.limits[feature]` y el consumo del período vigente.

**US-003 — Medición idempotente del consumo:**
WHEN una acción medida se completa con éxito, the system SHALL registrar un `UsageEvent` con `dedupeKey = "<feature>:<sourceId>"` e incrementar atómicamente el `UsageCounter` del período; IF llega una re-entrega del mismo evento (mismo `dedupeKey`), THEN the system SHALL contar el consumo **una sola vez** (no-op).

**US-004 — Tope de IA en Free sin romper la "aha":**
WHILE un usuario Free trabaja en su único proyecto activo, the system SHALL permitir completar una pasada de la metodología guiada (refine-field + 1 extracción PDF + ≥1 feedback IA) dentro de la asignación incluida; IF agota la asignación, THEN the system SHALL ofrecer un upgrade o un paquete de recarga **sin bloquearlo a mitad de la metodología en su proyecto único**.

**US-005 — Muro en amplitud y entregables, no en profundidad:**
WHEN un usuario Free intenta crear un 2.º proyecto activo, reservar un mentor, invitar a un colaborador o exportar un executive output sin marca de agua, the system SHALL bloquear la acción y presentar la ruta de upgrade correspondiente.

**US-006 — Recargas (top-ups) pagables por Yape:**
WHEN cualquier usuario (incl. Free) compra un paquete de recarga de créditos, the system SHALL procesar el pago **one-shot vía Yape (a través de Culqi)** y acreditar los créditos de forma transaccional (sin doble-acreditación ni pérdida).

**US-007 — Suscripción recurrente con card-on-file:**
WHEN un usuario contrata Pro o Team, the system SHALL tokenizar la tarjeta con Culqi (card-on-file) y, en cada renovación, ejecutar el cargo programado; IF el cargo falla, THEN the system SHALL reintentar (dunning) y, agotados los reintentos, transicionar la suscripción a `PAST_DUE` y luego `EXPIRED`, degradando al plan Free.

**US-008 — Suscripción por organización / cohorte (B2B):**
WHEN una organización compra una licencia de cohorte, the system SHALL crear una `Subscription` a nivel de `Organization` vinculada a un `Cohort`, de modo que **toda iniciativa de los participantes de esa cohorte** quede cubierta por el pool de créditos y asientos, sin facturación por proyecto.

**US-009 — Webhooks de billing idempotentes:**
WHEN un proveedor (Culqi / Mercado Pago / Yape-aggregator) emite un evento de ciclo de vida de suscripción a `POST /api/v1/internal/billing/webhooks/:provider`, the system SHALL verificar la firma del proveedor y aplicar la transición vía `SubscriptionService.applyProviderEvent`, que SHALL ser **no-op** si el estado mapeado es igual al estado actual.

**US-010 — Enforcement detrás de feature flag (shadow mode):**
WHILE `BILLING_ENFORCEMENT_ENABLED = false`, the system SHALL **medir** el consumo (shadow mode) pero `check()` SHALL devolver siempre `allowed: true`, de modo que se recolecten distribuciones reales de uso antes de activar el bloqueo.

**US-011 — Grandfathering de pilotos:**
WHEN se active la capa de billing, the system SHALL migrar a todo usuario existente (incl. redentores de código de piloto, ADR-018) a un plan **"Founding Pilot"** de proveedor `MANUAL` con entitlements generosos por un período acotado, de modo que el dashboard gratuito actual **no cambie** para ellos.

**US-012 — Plan/entitlement resuelto desde DB, no desde el JWT:**
WHEN se evalúa un entitlement, the system SHALL resolver el estado de plan **desde la base de datos en el call site**, no desde el JWT (rol en JWT puede estar obsoleto ≤15 min, ADR-004), de modo que un downgrade/cancelación tenga efecto inmediato.

---

## Success metrics

| Métrica | Baseline | Target (12 meses) | Método de medición |
|---|---|---|---|
| Tasa de activación (redime código → crea ≥1 proyecto en 7 días) | s/d | ≥ 50% | Evento `project.created` dentro de 7d de `user.registered` |
| Conversión Free → Pago (cohorte rolling 90 días) | 0% | ≥ 3.5% (Año 1); ≥ 5% (Año 2) | Evento de billing vs. cohorte de registro |
| MRR | $0 | ~$4,000 @ 1K usuarios free; ~$20,000 @ 5K | Webhook de cargo exitoso (Culqi/MP) |
| ARPU (pago) | s/d | S/ 39 (~$10.5) base; expansión a Team | MRR / usuarios de pago, segmentado por plan |
| Churn mensual (pago) | s/d | ≤ 5% (Año 1); ≤ 3% (Año 2) | Cancelación o renovación fallida tras agotar reintentos |
| Margen bruto | negativo (sin ingresos, COGS IA) | ≥ 55% (Año 1); ≥ 65% (Año 2) | (MRR − COGS) / MRR |
| Costo LLM como % de ingreso (usuarios pago) | n/a | ≤ 20% | Factura Anthropic vs. MRR, segmentado por tier |
| COGS por usuario **free activo**/mes | ~$5.10 (sin tope) | ≤ $2.00 | Contador de llamadas IA por `userId` + tope de asignación |
| Tasa de éxito de pago (auto-renovación) | n/a | ≥ 90% | Webhook `charge.succeeded` / (succeeded + failed) |
| LTV:CAC | n/a | ≥ 3:1 | LTV (margen × ARPU × vida) / CAC mezclado |
| Payback de CAC | n/a | ≤ 8 meses | CAC mezclado / (ARPU × margen bruto) |

---

## Modelo de negocio recomendado

### Segmento y motor de ingresos
- **Comprador primario: B2B** — depto. de innovación corporativa, universidad o aceleradora que compra una **licencia de cohorte** que cubre N participantes durante un programa. Evidencia: `Cohort` como unidad de costo (`$150/cohort/month` en ADR-004/012), jerarquía `StrategicFront → Challenge → InitiativePortfolioMeta`, `SponsorCheckpoint` + `AlignmentSignal`, `ExecutiveOutput`, rol `sponsor`, y PRD-001 que nombra explícitamente *"participantes de programas de innovación corporativa"*. Encaja con el ecosistema **innova-app-yape** (Yape/BCP corre programas de innovación donde el banco es el comprador).
- **Segmento secundario: B2C self-serve** — fundadores/innovadores individuales en LATAM. El plan individual es trial/lead-gen y retención para quien sale de un programa corporativo.

### Tiers B2C / self-serve
> Anclaje FX: **1 USD ≈ S/ 3.7**. Re-anclar al lanzar. Las cifras de créditos son **hipótesis a calibrar** contra telemetría real de pilotos y costo por run (ver Open questions).

| | **Free (Explorer)** | **Pro (Innovator)** | **Team (Squad)** |
|---|---|---|---|
| Comprador | Pilot lead / individuo evaluador | Innovador solo serio | Equipo pequeño (2–6) |
| Precio (PEN) | S/ 0 | **S/ 39/mes** (anual S/ 390) | **S/ 129/mes** (anual S/ 1,290; hasta 5 asientos) |
| Precio (USD) | $0 | ~$10.5/mes | ~$35/mes |
| Proyectos activos | 1 | 5 | 15 (pool) |
| Créditos IA/mes | ~40 (≈ 1 pasada completa) | ~400 | ~1,500 (pool) |
| Mentor credits | 0 (ve perfiles, no reserva) | 3/mes | 15 (pool) |
| Asientos | 1 | 1 | hasta 5 (+S/ 19/mes extra) |
| Executive outputs | Preview con marca de agua | Export completo, 10/mes | Ilimitado + portfolio |
| Trigger de upgrade | tope de 1 proyecto / agota créditos / quiere mentor | >5 proyectos / más mentor / colaborador | features de cohorte/sponsor / SSO → B2B |

### Oferta B2B / Enterprise (cohorte / programa)

| | **Program (Cohort)** | **Enterprise (Portfolio)** |
|---|---|---|
| Comprador | Sponsor/org que corre 1 cohorte (univ., aceleradora, unidad de innovación) | Org con innovación continua multi-cohorte |
| Modelo de precio | **Por cohorte** desde **S/ 18,000** (~$4,900) hasta 50 participantes / ~3 meses (≈ S/ 360/participante) | **Anual** desde **S/ 90,000/año** (~$24,300); bandas custom, multi-cohorte |
| Incluido | Pool de créditos IA + mentor dimensionado a la cohorte, gestión de sponsor/cohorte/challenge, executive outputs con marca, portfolio, SSO básico | Todo Program + multi-cohorte, SSO/SAML, roles admin, API/export, success contact, readouts trimestrales |
| Pago | Factura/transferencia (RUC, factura electrónica SUNAT) — **no Yape** para montos enterprise | Contrato anual + factura |

### Créditos vs. suscripción
- **Asignación incluida por plan + paquetes de recarga (top-up) pagables por Yape one-tap.** Sin pago-por-uso crudo (genera "ansiedad de medición" y suprime el uso que demuestra valor; mal encaje LATAM).
- **Dos tipos de crédito, una billetera UI:** *AI credits* (1 refine ≈ 1; 1 extracción PDF ≈ 3–5; 1 feedback ≈ 5 — ratios calibrados a costo LLM real para que 1 crédito > costo marginal) y *mentorCredits* (unidad existente, ahora asignación mensual + recargas).
- **Reset mensual, sin rollover** en B2C (evita acaparamiento y bill-shock). Pools B2B se renuevan por período de contrato.
- Paquetes (ejemplo): Boost S 100cr S/15 · Boost M 300cr S/35 · Boost L 1,000cr S/99 · Mentor session 1cr S/49.

### Diseño del free tier (funnel friction-light)
- **Puede:** registrarse (incl. Google) y llegar a la metodología en un paso (sin captura de tarjeta); 1 proyecto activo con la metodología completa; asignación de IA suficiente para 1 pasada (refine en cada paso, 1 extracción PDF, ≥1 feedback); ver el marketplace de mentores (read-only); preview con marca de agua del executive output.
- **No puede (gates de upgrade):** 2.º proyecto; reservar mentor; IA más allá de la asignación; export sin marca de agua; invitar colaboradores.
- **Principio:** el muro está en **amplitud y entregables, no en profundidad**. Nunca limitar a mitad de la metodología en el proyecto único.

---

## Unit economics (resumen)

- **COGS LLM ≈ $3.50/proyecto activo/mes** (mix Opus orquestador + Sonnet workers + Haiku bridge, ADR-001/008; 25% ahorro por caché). ⇒ **~$9/usuario de pago/mes** (LLM + mentor + infra + DB + fees) y **~$5.10/usuario free activo/mes** — de ahí la criticidad de **capar la IA en Free** (objetivo ≤ $2).
- **Funnel:** visitante → pilot lead (8–12%) → activado (50%) → pago (3.5% a 90 días). Churn 4–6%.
- **LTV:CAC:** con ARPU $25/mes equivalente, margen ~64%, vida ~20 meses ⇒ LTV ≈ $320; CAC mezclado $50–$120 ⇒ **4:1** (escenario $80), payback ~5 meses.

## Rails de pago (Perú / LATAM)

| Decisión | Proveedor | Razón |
|---|---|---|
| **Launch — recurrente** | **Culqi** (card-on-file + cargo programado) | Integración más simple, settlement same-day BCP, Yape ya en su lista de métodos; fee 3.44% + $0.20 + IGV |
| **Launch — one-shot / recargas / anual** | **Yape vía Culqi** | Acceso a 14M+ usuarios; one-tap encaja con conducta de pago peruana |
| **Fallback — suscripción nativa** | **Mercado Pago** (Suscripciones, dunning nativo) | Único con auto-renew nativo + wallet; usar si no se invierte en dunning sobre Culqi en MVP |
| **B2B** | Factura / transferencia (RUC, SUNAT) | Orgs no pagan sumas enterprise por Yape |
| **Futuro (post-PMF) — Yape auto-renew** | **dLocal (Yape-on-file) / EBANX (Yape Recurring)** | Únicos con cargos recurrentes nativos sobre Yape; requieren contrato de agregador |
| **Descartado** | ~~Stripe~~, Niubiz, Izipay | Stripe **no disponible** para merchants PE; Niubiz alto setup; Izipay sin recurrente confirmado |

---

## Arquitectura técnica (entitlements) — resumen

> Detalle completo → SPEC-005. Todo **aditivo**: tablas nuevas + FKs escalares nullable. Sin `@unique` sobre `User`/`Project`/tablas pobladas (la unicidad de `Plan.code`, refs de `Subscription`, `UsageEvent.dedupeKey` vive solo en tablas nuevas ⇒ `prisma db push` no dispara su guard de pérdida de datos). Unicidad lógica en servicios (patrón ADR-018).

- **Modelos nuevos:** `Plan` (catálogo, `limits` como JSON extensible, `-1` = ilimitado), `Subscription` (de `User` **o** `Organization`; estado, proveedor, refs), `UsageCounter` (consumo por `(subscriptionId, feature, periodKey)`; reset implícito por `periodKey="YYYY-MM"`), `UsageEvent` (ledger idempotente con `dedupeKey @unique`), `Organization` + `OrganizationMember` (B2B/asientos, vinculable a `Cohort`). FK aditiva `User.organizationId String?`.
- **Chokepoint único:** `EntitlementService.check(userId, feature, qty)` (lee, no muta — CQRS) + `EntitlementService.meter(...)` (escribe, idempotente vía `UsageEvent` + `increment` atómico).
- **Call sites:** `project.service.ts` (createProject), bridge IA / `refine-field` (ADR-011/013), `pdf.service.ts` + webhook PDF (ADR-013, mide en estado terminal), `mentor.service.ts` (decremento de `Project.mentorCredits` + cap de plan), invitación de colaborador (`TeamMember`), export de `ExecutiveOutput`. Enforcement a **nivel API** como middleware `requireEntitlement(feature)` (compone con `requireRole`/`requireOwnership`, ADR-004).
- **Seam de billing:** puerto `BillingPort` (createCheckout / cancel / verifyWebhook) con impls Culqi/MercadoPago/Yape/Manual; receptor de webhooks `POST /api/v1/internal/billing/webhooks/:provider` (misma clase de auth que el webhook IA de ADR-013), idempotente.
- **Rollout:** flag `BILLING_ENFORCEMENT_ENABLED` (default `false`, shadow mode mide sin bloquear); grandfathering vía suscripción `MANUAL` "Founding Pilot".

---

## Non-functional requirements

- **Idempotencia:** ninguna acción medida ni evento de webhook puede contar/aplicarse dos veces (garantizado por `dedupeKey @unique` + transiciones no-op).
- **Consistencia transaccional:** acreditación de top-ups y decremento de créditos sin doble-gasto ni pérdida (operaciones atómicas en el límite del sistema).
- **Latencia:** `EntitlementService.check` < 50 ms P95 (lectura indexada por `(subscriptionId, feature, periodKey)`); no debe añadir latencia perceptible al flujo de IA.
- **Seguridad/PII:** datos de pago tokenizados en el proveedor (nunca PAN en nuestra DB); webhooks con verificación de firma; sin secretos de proveedor en el repo.
- **Deploy:** cambios de schema estrictamente aditivos, compatibles con `prisma db push` (ADR-018).
- **Cumplimiento Perú:** soporte de factura electrónica con RUC (SUNAT) para B2B; precios en PEN con equivalencia USD.

---

## Out of scope

- Implementación del UI de billetera/checkout (va en SPEC-005 + tickets de frontend).
- Integración productiva de dLocal/EBANX para Yape auto-renew (fase futura post-PMF).
- Facturación basada en consumo real en USD (usage-based billing) sobre `costUsd` — queda como evolución; este PRD usa límites por conteo + asignaciones.
- Rediseño del modelo de roles (ADR-009/010) — se reutiliza tal cual.
- Pricing definitivo: los precios y asignaciones aquí son **decision-ready pero a validar** (ver Open questions); no son cifras bloqueadas.
- Migración de datos de pilotos más allá del grandfathering descrito.

---

## Constraints and assumptions

**Constraints:**
- Cambios de schema **solo aditivos** (sin nuevos `@unique` sobre tablas pobladas) — ADR-018 / `prisma db push`.
- Reutilizar auth existente (password + Google OAuth, ADR-003/014) y `ProjectService` — sin nuevos flujos de auth.
- Stripe **no** es opción de rail para el merchant peruano.
- Enforcement a nivel API, no solo UI (ADR-004).

**Assumptions:**
- El comprador de mayor valor es la organización (B2B), validado por el modelo de datos; los individuos son funnel + ingreso secundario.
- Yape no soporta auto-renovación nativa sin agregador (dLocal/EBANX) — confirmado por investigación de mercado.
- Los pilotos actuales deben preservarse con goodwill (no quitarles el producto gratuito de golpe).
- Las asignaciones de crédito (~40/400/1,500) y el ratio crédito→costo LLM deben calibrarse con telemetría real antes de bloquear.

---

## Dependencies

| Dependencia | Tipo | Estado |
|---|---|---|
| ADR-018 (modelo de deploy `prisma db push`) | ADR | Available |
| ADR-004 / ADR-009 / ADR-010 (authz, 6 roles) | ADR | Available |
| ADR-001 / ADR-008 (modelos y costo LLM) | ADR | Available |
| ADR-011 / ADR-013 (bridge IA + webhook interno) | ADR | Available |
| **ADR-020 — Billing & Entitlements** | ADR | A redactar (proposed) |
| **ADR-021 — Webhooks de billing agnósticos de proveedor** | ADR | A redactar (proposed) |
| **ADR-022 — Organización & asientos / monetización de cohorte** | ADR | A redactar (proposed) |
| Contrato merchant Culqi (+ Yape habilitado) | Externo | Por iniciar |
| Cuenta Mercado Pago (fallback) | Externo | Por iniciar |
| Calibración de créditos vs. telemetría de pilotos | Interno | Bloqueada (requiere datos) |

---

## Open questions

- [x] **Segmento B2C vs B2B — RESUELTO (2026-06-08):** mezcla de ambos ⇒ **modelo híbrido confirmado**. Se construye una sola infra de entitlements; la suscripción cuelga del `User` (B2C) o de la `Organization`/`Cohort` (B2B). Secuenciamiento de build: infra + topes Free + Pro B2C (Culqi+Yape) primero, licencia B2B por cohorte después.
- [ ] **Calibración de asignaciones de crédito** (~40/400/1,500) y ratio crédito→costo LLM real (ADR-001) para que 1 crédito > costo marginal y el Free quede ≤ $2/usuario/mes. — Owner: Datos/IA, Due: antes de activar enforcement
- [ ] **Política de grandfathering** exacta: ¿"Founding Pilot" = Pro gratis 6–12 meses + 40% de descuento vitalicio? ¿Las orgs piloto reciben oferta B2B founding? — Owner: Producto
- [ ] **Costo real de mentor:** ¿las `MentorSession` implican costo humano hoy o son virtuales/IA? Define si mentorCredits recupera costo o es palanca de valor. — Owner: Producto/Ops
- [ ] **¿El decremento de `mentorCredits` debe implementarse ya?** Hoy el `BannerPorDefinir` en `MentorSupportModal.tsx` lo deja explícitamente sin resolver. — Owner: Ingeniería
- [ ] **Timing de Yape auto-renew** (dLocal/EBANX): ¿qué umbral de MRR/usuarios justifica el contrato de agregador? — Owner: Producto/Finanzas

---

## Approval checklist

Antes de `status: approved`:
- [ ] Problem statement en una sola oración sin pistas de solución
- [ ] User stories en formato EARS
- [ ] Métricas de éxito cuantificadas
- [ ] Out-of-scope listado
- [ ] Open questions resueltas (en particular el secuenciamiento B2C/B2B y la calibración de créditos)
- [ ] ADR-020/021/022 redactados y enlazados
- [ ] Sin detalles de implementación en el documento (movidos a SPEC-005)

---

*Generado por un swarm de 5 agentes (mapa de valor · landscape competitivo · pricing & packaging · unit economics & pagos · arquitectura de entitlements). Las cifras de pricing/créditos son hipótesis decision-ready, no valores medidos — calibrar antes de bloquear.*
