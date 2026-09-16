/**
 * billingRouter — internal billing webhook router (ADR-021).
 *
 * Self-contained: instantiates SubscriptionService (with the shared Prisma
 * client) and BillingController internally, mirroring auth.router.ts. The
 * integrator mounts it at `/api/v1/internal/billing`, so the effective route is
 *   POST /api/v1/internal/billing/webhooks/:provider
 *
 * No auth middleware here — auth is per-provider inside `verifyWebhook` (the
 * ManualProvider checks the x-internal-token shared secret; real providers
 * verify HMAC signatures). This keeps the secret-handling in one place per
 * provider rather than a one-size-fits-all router guard.
 */

import { Router } from 'express';
import { prisma } from '../../shared/db/prisma';
import { SubscriptionService } from './subscription.service';
import { BillingController } from './billing.controller';

const subscriptionService = new SubscriptionService(prisma);
const controller = new BillingController(subscriptionService);

export const billingRouter = Router();

// POST /webhooks/:provider — receive a provider webhook (Manual/Culqi/MercadoPago).
billingRouter.post('/webhooks/:provider', controller.handleWebhook);
