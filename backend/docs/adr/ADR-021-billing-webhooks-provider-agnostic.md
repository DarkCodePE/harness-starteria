# ADR-021: Webhooks de billing agnósticos de proveedor

## Status
Accepted — 2026-06-08

## Date
2026-06-08

## Context

PRD-005 selecciona un rail de pago multi-proveedor para Perú/LATAM: **Culqi**
(recurrente con card-on-file) como primario, **Yape vía Culqi** para one-shot/recargas,
**Mercado Pago** como fallback con suscripción nativa, y **dLocal/EBANX** a futuro para
Yape auto-renew. **Stripe queda descartado** (no disponible para merchants peruanos).
La capa de billing debe poder cambiar de proveedor sin reescribir el dominio, y los
eventos de ciclo de vida de suscripción (cargo exitoso, fallo, cancelación) llegan
asíncronos y **con entrega at-least-once** (pueden re-entregarse).

## Decision

1. **Puerto agnóstico `BillingPort`** bajo `backend/modules/billing/providers/`,
   mismo patrón de swap-seam que `IPdfStorage` (ADR-007/012):
   ```ts
   interface BillingPort {
     createCheckout(plan: Plan, subject: { userId?: string; orgId?: string }): Promise<{ url: string }>;
     cancel(providerSubId: string): Promise<void>;
     verifyWebhook(rawBody: Buffer, headers: Record<string,string>): WebhookEvent; // firma por proveedor
   }
   ```
   Implementaciones: `CulqiProvider`, `MercadoPagoProvider`, `YapeProvider` (one-shot),
   `ManualProvider` (grandfathering/admin).
2. **Receptor único** `POST /api/v1/internal/billing/webhooks/:provider`, en la **misma
   clase de auth que el webhook IA** (ADR-013): familia `/api/v1/internal/...`, fuera de
   JWT, con **verificación de firma por proveedor** (`verifyWebhook`). Nunca confía en el
   body sin verificar.
3. **Aplicación idempotente:** un único `SubscriptionService.applyProviderEvent(event)`
   mapea eventos del proveedor → transiciones de `SubscriptionStatus` y es **no-op si el
   estado mapeado == estado actual** (misma propiedad que `syncRunFromUpstream`, ADR-013).
   Los IDs de evento del proveedor se persisten como `dedupeKey` (estilo `UsageEvent`,
   ADR-020) ⇒ at-least-once es seguro.
4. **Lookup** por el índice `@@index([provider, providerSubId])` de `Subscription` (rol
   análogo a `aiRunId` en ADR-013).
5. **Dunning:** ante `charge.failed`, reintentos según proveedor; agotados →
   `PAST_DUE` → `EXPIRED` con degradación automática a Free. Mercado Pago aporta dunning
   nativo; sobre Culqi se implementa con cola/cron.

## Consequences

- **+** Cambiar/añadir proveedor = nueva impl del puerto, sin tocar el dominio.
- **+** Webhooks seguros (firma) e idempotentes (no doble aplicación).
- **+** Reusa la clase de auth de webhooks interna ya existente (ADR-013).
- **−** Cada proveedor tiene su esquema de firma/eventos → un adaptador por proveedor.
- **−** Dunning sobre Culqi es trabajo propio (Mercado Pago lo da nativo) — decisión de
  fase en PRD-005.

## Related
PRD-005, ADR-020 (entitlements), ADR-013 (webhook interno + idempotencia), ADR-007/012
(swap-seam de storage), ADR-011 (bridge HMAC).
