/**
 * CulqiProvider — STUB (ADR-021).
 *
 * TODO(PRD-005): wire the Culqi payment rails. Blocked on the merchant contract
 * and Culqi API credentials. Until then every method fails loudly so a
 * misconfigured deploy can't silently no-op a payment.
 */

import { AppError } from '../../../shared/errors/AppError';
import type { WebhookEvent } from '../types';
import type { BillingPort, CheckoutPlan, CheckoutSubject } from './billing-port';

const NOT_CONFIGURED = 'CulqiProvider not configured — pending merchant contract (PRD-005)';

export class CulqiProvider implements BillingPort {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCheckout(_plan: CheckoutPlan, _subject: CheckoutSubject): Promise<{ url: string }> {
    throw AppError.internal(NOT_CONFIGURED);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancel(_providerSubId: string): Promise<void> {
    throw AppError.internal(NOT_CONFIGURED);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyWebhook(
    _rawBody: Buffer | unknown,
    _headers: Record<string, string | undefined>,
  ): WebhookEvent {
    throw AppError.internal(NOT_CONFIGURED);
  }
}
