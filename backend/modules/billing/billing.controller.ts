/**
 * BillingController — HTTP edge for the internal billing webhook receiver
 * (ADR-021). Thin: resolve the provider, verify+normalize the inbound webhook,
 * hand the event to SubscriptionService, and report whether a transition was
 * applied. All errors flow to the global error handler via `next(err)`.
 */

import type { Request, Response, NextFunction } from 'express';
import { getProvider } from './providers';
import { SubscriptionService } from './subscription.service';

export class BillingController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  /**
   * POST /webhooks/:provider
   * Auth + payload normalization is the provider's job (verifyWebhook). On a
   * verified event we apply it idempotently and echo {received, applied}.
   */
  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = getProvider(req.params.provider);
      // express lowercases header keys; cast to the port's header shape.
      const event = provider.verifyWebhook(
        req.body,
        req.headers as Record<string, string | undefined>,
      );
      const { applied } = await this.subscriptions.applyProviderEvent(event);
      res.status(200).json({ received: true, applied });
    } catch (err) {
      next(err);
    }
  };
}
