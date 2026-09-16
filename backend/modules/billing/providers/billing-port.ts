/**
 * BillingPort — the provider-agnostic interface every payment integration
 * implements (ADR-021). The SubscriptionService and webhook controller depend
 * only on this port, never on a concrete provider SDK, so swapping Culqi for
 * MercadoPago (or adding Stripe) is a wiring change, not a service rewrite.
 *
 * Three responsibilities:
 *  - createCheckout — start a hosted-checkout / payment session, return its URL.
 *  - cancel         — request cancellation of a provider-side subscription.
 *  - verifyWebhook  — authenticate an inbound webhook and normalize it into the
 *                     stable {@link WebhookEvent} shape (types.ts). This is the
 *                     ONLY place provider signature/secret verification lives;
 *                     downstream code trusts the returned WebhookEvent.
 */

import type { WebhookEvent } from '../types';

/** Who the checkout/subscription belongs to. Exactly one of userId/orgId is set. */
export interface CheckoutSubject {
  userId?: string;
  orgId?: string;
}

/** Plan identifier passed to a provider when opening a checkout session. */
export interface CheckoutPlan {
  /** Plan.code (e.g. "starter", "pilot"). */
  code: string;
  /** Optional provider-side price/plan reference, when pre-registered. */
  providerPriceId?: string;
}

export interface BillingPort {
  /**
   * Open a checkout session for `plan` on behalf of `subject`.
   * @returns the URL the client should be redirected to.
   */
  createCheckout(plan: CheckoutPlan, subject: CheckoutSubject): Promise<{ url: string }>;

  /** Cancel the provider-side subscription identified by `providerSubId`. */
  cancel(providerSubId: string): Promise<void>;

  /**
   * Authenticate `rawBody`/`headers` and normalize into a {@link WebhookEvent}.
   * Throws AppError.unauthorized on a failed signature/secret check and
   * AppError.badRequest on a malformed payload. Never returns an untrusted event.
   */
  verifyWebhook(
    rawBody: Buffer | unknown,
    headers: Record<string, string | undefined>,
  ): WebhookEvent;
}
