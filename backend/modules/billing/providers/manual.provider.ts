/**
 * ManualProvider — the BillingProvider.MANUAL implementation (ADR-021).
 *
 * Used for admin-granted / grandfathered-pilot subscriptions and as the
 * integration surface for internal webhook deliveries before a real merchant
 * contract lands (PRD-005). Auth is the same shared-secret class as the
 * ai-service webhook (ADR-013): a single `x-internal-token` header compared
 * against `config.billingWebhookSecret`.
 *
 * `verifyWebhook` assumes the body has already been JSON-parsed by express'
 * `express.json()` middleware (the router mounts it), so it receives a plain
 * object, not a raw Buffer. Real providers (Culqi/MercadoPago) will need the
 * raw bytes for HMAC verification — hence the BillingPort signature accepts
 * `Buffer | unknown`.
 */

import { config } from '../../../config';
import { AppError } from '../../../shared/errors/AppError';
import type { WebhookEvent } from '../types';
import type { BillingPort, CheckoutPlan, CheckoutSubject } from './billing-port';

/** The webhook `type` strings ManualProvider recognizes (mirrors WebhookEvent.type). */
const KNOWN_TYPES: ReadonlySet<string> = new Set([
  'subscription.activated',
  'subscription.renewed',
  'payment.failed',
  'subscription.canceled',
  'subscription.expired',
]);

export class ManualProvider implements BillingPort {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCheckout(_plan: CheckoutPlan, _subject: CheckoutSubject): Promise<{ url: string }> {
    // Manual activation has no hosted checkout — an admin flips the row directly.
    // The sentinel URL signals "no redirect needed; already provisioned".
    return { url: 'manual://activated' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancel(_providerSubId: string): Promise<void> {
    // No provider side to call — cancellation is applied to our row by the
    // SubscriptionService when the canceled webhook (or admin action) arrives.
  }

  verifyWebhook(
    rawBody: Buffer | unknown,
    headers: Record<string, string | undefined>,
  ): WebhookEvent {
    // 1) Authenticate. Header lookup is case-insensitive because express
    //    lowercases header keys, but inbound tooling may not.
    const token = pickHeader(headers, 'x-internal-token');
    if (!token || token !== config.billingWebhookSecret) {
      throw AppError.unauthorized('Invalid billing webhook token', 'BILLING_WEBHOOK_AUTH_FAILED');
    }

    // 2) Parse. Body is already JSON (express.json mounted by the router). If a
    //    raw Buffer/string sneaks through, parse it defensively.
    const body = coerceBody(rawBody);
    if (!body || typeof body !== 'object') {
      throw AppError.badRequest('Malformed billing webhook payload', 'BILLING_WEBHOOK_BAD_BODY');
    }

    const record = body as Record<string, unknown>;
    const eventId = typeof record.eventId === 'string' ? record.eventId : undefined;
    const type = typeof record.type === 'string' ? record.type : undefined;

    if (!eventId || !type) {
      throw AppError.badRequest(
        'Billing webhook missing eventId or type',
        'BILLING_WEBHOOK_BAD_BODY',
      );
    }

    return {
      eventId,
      type: (KNOWN_TYPES.has(type) ? type : 'unknown') as WebhookEvent['type'],
      providerSubId:
        typeof record.providerSubId === 'string' ? record.providerSubId : undefined,
      providerCustomerId:
        typeof record.providerCustomerId === 'string' ? record.providerCustomerId : undefined,
      raw: body,
    };
  }
}

/** Case-insensitive header lookup that tolerates array-valued headers. */
function pickHeader(
  headers: Record<string, string | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === wanted) {
      const v = headers[key];
      return Array.isArray(v) ? v[0] : v;
    }
  }
  return undefined;
}

/** Accepts a parsed object, a JSON Buffer, or a JSON string. */
function coerceBody(rawBody: Buffer | unknown): unknown {
  if (Buffer.isBuffer(rawBody)) {
    try {
      return JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }
  }
  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  }
  return rawBody;
}
