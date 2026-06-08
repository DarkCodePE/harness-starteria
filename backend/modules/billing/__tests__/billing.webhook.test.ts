/**
 * billing.webhook.test.ts — TASK-018 (issue #79) webhook auth + routing.
 *
 * Two layers:
 *  (a) ManualProvider.verifyWebhook — secret check + payload normalization
 *      (unit, no DB, no HTTP).
 *  (b) billingRouter — a tiny express app mounting the real router behind the
 *      global errorHandler, exercised with supertest. The shared Prisma client
 *      reached by the router is mocked so no DB is required.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ManualProvider } from '../providers/manual.provider';
import { getProvider } from '../providers';
import { AppError } from '../../../shared/errors/AppError';
import { errorHandler } from '../../../shared/errors/error-handler';
import { config } from '../../../config';

const TOKEN = config.billingWebhookSecret;

// ─── Mock the shared Prisma client the router instantiates internally ────────
// billing.router.ts does `new SubscriptionService(prisma)`, so we stub prisma
// before importing the router (vi.mock is hoisted).
const usageCreate = vi.fn();
const subFindFirst = vi.fn();
const subUpdate = vi.fn();

vi.mock('../../../shared/db/prisma', () => ({
  prisma: {
    usageEvent: { create: (...a: unknown[]) => usageCreate(...a) },
    subscription: {
      findFirst: (...a: unknown[]) => subFindFirst(...a),
      update: (...a: unknown[]) => subUpdate(...a),
    },
  },
}));

// Imported AFTER the mock so the router picks up the stubbed prisma.
import { billingRouter } from '../billing.router';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/internal/billing', billingRouter);
  app.use(errorHandler);
  return app;
}

const validBody = {
  eventId: 'evt-http-1',
  type: 'subscription.activated',
  providerSubId: 'sub-ext-1',
};

// ─── (a) ManualProvider unit tests ───────────────────────────────────────────

describe('ManualProvider.verifyWebhook', () => {
  const provider = new ManualProvider();

  it('throws unauthorized when the x-internal-token is missing', () => {
    expect(() => provider.verifyWebhook(validBody, {})).toThrowError(AppError);
    try {
      provider.verifyWebhook(validBody, {});
    } catch (e) {
      expect((e as AppError).statusCode).toBe(401);
      expect((e as AppError).message).toBe('Invalid billing webhook token');
    }
  });

  it('throws unauthorized when the token is wrong', () => {
    try {
      provider.verifyWebhook(validBody, { 'x-internal-token': 'nope' });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(401);
    }
  });

  it('returns a normalized WebhookEvent on a good token', () => {
    const event = provider.verifyWebhook(validBody, { 'x-internal-token': TOKEN });
    expect(event.eventId).toBe('evt-http-1');
    expect(event.type).toBe('subscription.activated');
    expect(event.providerSubId).toBe('sub-ext-1');
  });

  it('accepts the token header case-insensitively', () => {
    const event = provider.verifyWebhook(validBody, { 'X-Internal-Token': TOKEN });
    expect(event.eventId).toBe('evt-http-1');
  });

  it('coerces an unknown type to "unknown"', () => {
    const event = provider.verifyWebhook(
      { ...validBody, type: 'something.weird' },
      { 'x-internal-token': TOKEN },
    );
    expect(event.type).toBe('unknown');
  });

  it('throws badRequest when eventId is missing', () => {
    try {
      provider.verifyWebhook({ type: 'subscription.activated' }, { 'x-internal-token': TOKEN });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(400);
    }
  });

  it('throws badRequest when type is missing', () => {
    try {
      provider.verifyWebhook({ eventId: 'evt-x' }, { 'x-internal-token': TOKEN });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(400);
    }
  });
});

// ─── getProvider registry ────────────────────────────────────────────────────

describe('getProvider', () => {
  it('returns a ManualProvider for "manual"', () => {
    expect(getProvider('manual')).toBeInstanceOf(ManualProvider);
  });

  it('resolves both mercadopago spellings', () => {
    expect(getProvider('mercadopago')).toBe(getProvider('mercado_pago'));
  });

  it('throws badRequest for an unknown provider', () => {
    try {
      getProvider('paypal');
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as AppError).statusCode).toBe(400);
    }
  });
});

// ─── (b) Router-level tests via supertest ────────────────────────────────────

describe('POST /api/v1/internal/billing/webhooks/:provider', () => {
  let app: express.Express;

  beforeEach(() => {
    usageCreate.mockReset();
    subFindFirst.mockReset();
    subUpdate.mockReset();
    app = buildApp();
  });

  it('returns 200 {received:true, applied:true} on a valid manual webhook', async () => {
    usageCreate.mockResolvedValue({ id: 'ue-1' });
    subFindFirst.mockResolvedValue({
      id: 'sub-1',
      providerSubId: 'sub-ext-1',
      status: 'TRIALING',
      canceledAt: null,
    });
    subUpdate.mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' });

    const res = await request(app)
      .post('/api/v1/internal/billing/webhooks/manual')
      .set('X-Internal-Token', TOKEN)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, applied: true });
    expect(subUpdate).toHaveBeenCalledOnce();
  });

  it('returns 200 {applied:false} when the subscription is unknown', async () => {
    usageCreate.mockResolvedValue({ id: 'ue-2' });
    subFindFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/internal/billing/webhooks/manual')
      .set('X-Internal-Token', TOKEN)
      .send({ ...validBody, eventId: 'evt-http-2' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, applied: false });
  });

  it('returns 401 when the token is invalid (error path)', async () => {
    const res = await request(app)
      .post('/api/v1/internal/billing/webhooks/manual')
      .set('X-Internal-Token', 'wrong-token')
      .send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BILLING_WEBHOOK_AUTH_FAILED');
    expect(usageCreate).not.toHaveBeenCalled();
  });

  it('returns 400 for an unknown provider', async () => {
    const res = await request(app)
      .post('/api/v1/internal/billing/webhooks/paypal')
      .set('X-Internal-Token', TOKEN)
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BILLING_UNKNOWN_PROVIDER');
  });

  it('returns 400 when the body is missing eventId/type', async () => {
    const res = await request(app)
      .post('/api/v1/internal/billing/webhooks/manual')
      .set('X-Internal-Token', TOKEN)
      .send({ providerSubId: 'sub-ext-1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BILLING_WEBHOOK_BAD_BODY');
  });
});
