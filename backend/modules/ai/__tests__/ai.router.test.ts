/**
 * ai.router.test.ts — PRD-005 / issue #85 (`ai_refine` authenticated call site).
 *
 * Verifies the authenticated AI bridge: a logged-in user can refine a field and
 * the entitlement layer measures `ai_refine` in shadow mode (meters once on a
 * 2xx, never blocks). `authenticate` and `entitlementService` are mocked; the
 * RefineFieldService is a stub so no ai-service/HTTP is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../shared/errors/error-handler';

// Inject an authenticated user (no JWT needed for the wiring test).
vi.mock('../../auth/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'u-test', role: 'founder' };
    next();
  },
}));
// Mock the EntitlementService the middleware depends on.
vi.mock('../../billing/entitlement.service', () => ({
  entitlementService: {
    check: vi.fn(),
    meter: vi.fn().mockResolvedValue({ counted: true }),
  },
}));
vi.mock('../../../shared/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { buildAiRouter } from '../ai.router';
import { RefineFieldController } from '../../public-ai/refine-field.controller';
import { entitlementService } from '../../billing/entitlement.service';

const check = entitlementService.check as unknown as ReturnType<typeof vi.fn>;
const meter = entitlementService.meter as unknown as ReturnType<typeof vi.fn>;

function makeApp() {
  const fakeService: any = {
    refine: vi
      .fn()
      .mockResolvedValue({ suggestedValue: 'mejor', rationale: 'porque', confidence: 0.9 }),
  };
  const controller = new RefineFieldController(fakeService);
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.requestId = 'req-ai-1';
    next();
  });
  app.use('/api/v1/ai', buildAiRouter(controller));
  app.use(errorHandler);
  return { app, fakeService };
}

describe('authenticated AI router (#85 ai_refine)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meter.mockResolvedValue({ counted: true });
  });

  it('refines for an authenticated user and meters ai_refine in shadow', async () => {
    check.mockResolvedValue({
      allowed: true,
      wouldAllow: true,
      limit: 40,
      remaining: 39,
      planCode: 'free',
    });
    const { app, fakeService } = makeApp();

    const res = await request(app)
      .post('/api/v1/ai/refine-field')
      .send({ field: 'problema', currentValue: 'algo vago' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fakeService.refine).toHaveBeenCalledOnce();
    // check() ran against the authenticated user + the ai_refine feature.
    expect(check).toHaveBeenCalledWith('u-test', 'ai_refine', 1, undefined);
    // metered exactly once on the 2xx finish, keyed by requestId (idempotent).
    await new Promise((r) => setImmediate(r));
    expect(meter).toHaveBeenCalledWith(
      'u-test',
      'ai_refine',
      expect.objectContaining({ dedupeKey: 'ai_refine:req-ai-1' }),
    );
  });

  it('shadow mode: lets the refine through even when it WOULD block', async () => {
    check.mockResolvedValue({
      allowed: true, // forced true in shadow
      wouldAllow: false, // real verdict: over budget
      limit: 40,
      remaining: 0,
      planCode: 'free',
      reason: 'over',
    });
    const { app } = makeApp();

    const res = await request(app)
      .post('/api/v1/ai/refine-field')
      .send({ field: 'problema', currentValue: 'x' });

    expect(res.status).toBe(200); // not blocked
  });

  it('enforcement ON: blocks with 403 when over budget (allowed=false)', async () => {
    check.mockResolvedValue({
      allowed: false,
      wouldAllow: false,
      limit: 40,
      remaining: 0,
      planCode: 'free',
      reason: 'Has alcanzado el límite de tu plan.',
    });
    const { app } = makeApp();

    const res = await request(app)
      .post('/api/v1/ai/refine-field')
      .send({ field: 'problema', currentValue: 'x' });

    expect(res.status).toBe(403);
    expect(meter).not.toHaveBeenCalled();
  });
});
