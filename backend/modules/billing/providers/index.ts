/**
 * Provider registry (ADR-021). Maps the `:provider` path segment of the webhook
 * route to a concrete BillingPort. Single source of truth for "which providers
 * exist"; the controller never instantiates a provider directly.
 */

import { AppError } from '../../../shared/errors/AppError';
import type { BillingPort } from './billing-port';
import { ManualProvider } from './manual.provider';
import { CulqiProvider } from './culqi.provider';
import { MercadoPagoProvider } from './mercadopago.provider';

export type { BillingPort, CheckoutPlan, CheckoutSubject } from './billing-port';
export { ManualProvider } from './manual.provider';
export { CulqiProvider } from './culqi.provider';
export { MercadoPagoProvider } from './mercadopago.provider';

// Providers are stateless, so a single shared instance per kind is fine.
const manual = new ManualProvider();
const culqi = new CulqiProvider();
const mercadopago = new MercadoPagoProvider();

/**
 * Resolve a BillingPort by name (case-insensitive). Accepts both `mercadopago`
 * and `mercado_pago` to tolerate the Prisma enum spelling (MERCADO_PAGO).
 * @throws AppError.badRequest for an unknown provider name.
 */
export function getProvider(name: string): BillingPort {
  switch ((name ?? '').toLowerCase()) {
    case 'manual':
      return manual;
    case 'culqi':
      return culqi;
    case 'mercadopago':
    case 'mercado_pago':
      return mercadopago;
    default:
      throw AppError.badRequest('Unknown billing provider', 'BILLING_UNKNOWN_PROVIDER');
  }
}
