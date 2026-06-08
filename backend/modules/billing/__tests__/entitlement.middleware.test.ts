import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock the EntitlementService the middleware depends on.
vi.mock('../entitlement.service', () => ({
  entitlementService: {
    check: vi.fn(),
    meter: vi.fn().mockResolvedValue({ counted: true }),
  },
}));
// Quiet logger.
vi.mock('../../../shared/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { requireEntitlement } from '../entitlement.middleware';
import { entitlementService } from '../entitlement.service';

const check = entitlementService.check as unknown as ReturnType<typeof vi.fn>;
const meter = entitlementService.meter as unknown as ReturnType<typeof vi.fn>;

function makeReqRes() {
  const req: any = { user: { id: 'u1' }, requestId: 'req-1', params: {} };
  // res is an EventEmitter so res.once('finish', …) works.
  const res: any = Object.assign(new EventEmitter(), { statusCode: 200 });
  const next = vi.fn();
  return { req, res, next };
}

describe('requireEntitlement middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meter.mockResolvedValue({ counted: true });
  });

  it('skips entirely on unauthenticated requests (no req.user)', async () => {
    const { res, next } = makeReqRes();
    const req: any = { params: {} };
    await requireEntitlement('ai_refine')(req, res, next);
    expect(next).toHaveBeenCalledWith(); // no error
    expect(check).not.toHaveBeenCalled();
  });

  it('passes through and attaches req.entitlement when allowed', async () => {
    const { req, res, next } = makeReqRes();
    check.mockResolvedValue({ allowed: true, wouldAllow: true, limit: 40, remaining: 39, planCode: 'free' });
    await requireEntitlement('ai_refine')(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.entitlement.planCode).toBe('free');
  });

  it('blocks with an error when enforcement is on and over budget (allowed=false)', async () => {
    const { req, res, next } = makeReqRes();
    check.mockResolvedValue({ allowed: false, wouldAllow: false, limit: 40, remaining: 0, planCode: 'free', reason: 'over' });
    await requireEntitlement('ai_refine')(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeTruthy();
    expect(err.code ?? err.errorCode ?? '').toMatch(/ENTITLEMENT_EXCEEDED|FORBIDDEN/);
  });

  it('shadow mode: passes through even when it WOULD block (allowed=true, wouldAllow=false)', async () => {
    const { req, res, next } = makeReqRes();
    check.mockResolvedValue({ allowed: true, wouldAllow: false, limit: 40, remaining: 0, planCode: 'free', reason: 'over' });
    await requireEntitlement('ai_refine')(req, res, next);
    expect(next).toHaveBeenCalledWith(); // no error — let through
  });

  it('meters a metered feature once on a successful (2xx) response', async () => {
    const { req, res, next } = makeReqRes();
    check.mockResolvedValue({ allowed: true, wouldAllow: true, limit: 40, remaining: 39, planCode: 'free' });
    await requireEntitlement('ai_refine')(req, res, next);
    res.statusCode = 200;
    res.emit('finish');
    await Promise.resolve();
    expect(meter).toHaveBeenCalledWith('u1', 'ai_refine', expect.objectContaining({ dedupeKey: 'ai_refine:req-1' }));
  });

  it('does NOT meter when the response is an error (>=400)', async () => {
    const { req, res, next } = makeReqRes();
    check.mockResolvedValue({ allowed: true, wouldAllow: true, limit: 40, remaining: 39, planCode: 'free' });
    await requireEntitlement('ai_refine')(req, res, next);
    res.statusCode = 500;
    res.emit('finish');
    await Promise.resolve();
    expect(meter).not.toHaveBeenCalled();
  });

  it('does NOT meter resource features (project_create)', async () => {
    const { req, res, next } = makeReqRes();
    check.mockResolvedValue({ allowed: true, wouldAllow: true, limit: 1, remaining: 1, planCode: 'free' });
    await requireEntitlement('project_create', { resourceCount: () => 0 })(req, res, next);
    res.statusCode = 201;
    res.emit('finish');
    await Promise.resolve();
    expect(meter).not.toHaveBeenCalled();
    expect(check).toHaveBeenCalledWith('u1', 'project_create', 1, 0);
  });
});
