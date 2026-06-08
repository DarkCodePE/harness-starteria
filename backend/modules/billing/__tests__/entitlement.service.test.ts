/**
 * EntitlementService unit tests (TASK-016, vitest).
 *
 * All prisma access is mocked — these are pure unit tests of the entitlement
 * logic (resolution precedence, limit math, shadow mode, idempotent metering).
 * `config.billingEnforcementEnabled` is mutable so we can flip enforcement.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mocks -----------------------------------------------------------------

// Mutable config: tests flip `billingEnforcementEnabled` per-case.
// `vi.hoisted` lets the factory (which is hoisted above the file) safely close
// over this object without tripping the "no top-level variables" rule.
const { mockConfig } = vi.hoisted(() => ({
  mockConfig: { billingEnforcementEnabled: false },
}));
vi.mock('../../../config', () => ({ config: mockConfig }));

vi.mock('../../../shared/db/prisma', () => ({
  prisma: {
    subscription: { findFirst: vi.fn() },
    organizationMember: { findFirst: vi.fn() },
    usageCounter: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    usageEvent: { create: vi.fn() },
  },
}));

import { prisma } from '../../../shared/db/prisma';
import {
  entitlementService,
  check,
  meter,
  resolveActiveSubscription,
  getLimits,
} from '../entitlement.service';
import { FREE_LIMITS, FREE_PLAN_CODE } from '../plans';

// Typed handles to the mocked prisma fns.
const subFindFirst = prisma.subscription.findFirst as ReturnType<typeof vi.fn>;
const memberFindFirst = prisma.organizationMember.findFirst as ReturnType<typeof vi.fn>;
const counterFindFirst = prisma.usageCounter.findFirst as ReturnType<typeof vi.fn>;
const counterCreate = prisma.usageCounter.create as ReturnType<typeof vi.fn>;
const counterUpdate = prisma.usageCounter.update as ReturnType<typeof vi.fn>;
const eventCreate = prisma.usageEvent.create as ReturnType<typeof vi.fn>;

function planSub(code: string, limits: Record<string, number>, id = 'sub-1') {
  return { id, plan: { code, limits } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockConfig.billingEnforcementEnabled = false;
  // Default: no subscriptions / no membership / no counter unless overridden.
  subFindFirst.mockResolvedValue(null);
  memberFindFirst.mockResolvedValue(null);
  counterFindFirst.mockResolvedValue(null);
  counterCreate.mockResolvedValue({});
  counterUpdate.mockResolvedValue({});
  eventCreate.mockResolvedValue({});
});

// --- getLimits -------------------------------------------------------------

describe('getLimits', () => {
  it('returns FREE_LIMITS when there is no subscription', () => {
    expect(getLimits(null)).toBe(FREE_LIMITS);
  });

  it('returns the plan limits when a subscription is present', () => {
    const sub = planSub('starter', { ai_refine: 400 });
    expect(getLimits(sub)).toEqual({ ai_refine: 400 });
  });
});

// --- resolveActiveSubscription (precedence) --------------------------------

describe('resolveActiveSubscription', () => {
  it('prefers the user subscription over the org subscription', async () => {
    subFindFirst.mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'user-sub'));

    const sub = await resolveActiveSubscription('u1');

    expect(sub?.id).toBe('user-sub');
    // Org lookup must NOT happen once the user sub is found.
    expect(memberFindFirst).not.toHaveBeenCalled();
  });

  it('falls back to the org subscription when the user has none', async () => {
    // 1st call (user) → null, 2nd call (org) → org sub.
    subFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(planSub('team', { ai_refine: 1500 }, 'org-sub'));
    memberFindFirst.mockResolvedValueOnce({ organizationId: 'org-9', userId: 'u1' });

    const sub = await resolveActiveSubscription('u1');

    expect(sub?.id).toBe('org-sub');
    expect(memberFindFirst).toHaveBeenCalledOnce();
    // The org lookup must query by the resolved organizationId.
    expect(subFindFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-9' }),
        include: { plan: true },
      }),
    );
  });

  it('returns null when neither a user nor an org subscription exists', async () => {
    subFindFirst.mockResolvedValue(null);
    memberFindFirst.mockResolvedValue(null);

    expect(await resolveActiveSubscription('u1')).toBeNull();
  });

  it('only counts ACTIVE/TRIALING statuses as active', async () => {
    subFindFirst.mockResolvedValueOnce(null);
    memberFindFirst.mockResolvedValueOnce(null);

    await resolveActiveSubscription('u1');

    expect(subFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          status: { in: ['ACTIVE', 'TRIALING'] },
        }),
      }),
    );
  });
});

// --- check (metered) -------------------------------------------------------

describe('check — metered feature (free user)', () => {
  it('allows when under the cap (enforcement ON)', async () => {
    mockConfig.billingEnforcementEnabled = true;
    // Free plan ai_refine = 40. used = 39, qty = 1 → 40 <= 40 → allowed.
    counterFindFirst.mockResolvedValueOnce({ used: 39 });
    // Free user has no sub → but used reads return 0 unless a sub exists.
    // Give the user a free-equivalent sub so the counter is consulted.
    subFindFirst.mockResolvedValueOnce(planSub('free', { ...FREE_LIMITS }, 'free-sub'));

    const r = await check('u1', 'ai_refine', 1);

    expect(r.limit).toBe(40);
    expect(r.wouldAllow).toBe(true);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(1);
  });

  it('blocks when over the cap (enforcement ON)', async () => {
    mockConfig.billingEnforcementEnabled = true;
    subFindFirst.mockResolvedValueOnce(planSub('free', { ...FREE_LIMITS }, 'free-sub'));
    counterFindFirst.mockResolvedValueOnce({ used: 40 }); // already at cap

    const r = await check('u1', 'ai_refine', 1);

    expect(r.wouldAllow).toBe(false);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.reason).toBeDefined();
  });

  it('no subscription → uses FREE_LIMITS and treats used as 0', async () => {
    mockConfig.billingEnforcementEnabled = true;
    subFindFirst.mockResolvedValue(null);
    memberFindFirst.mockResolvedValue(null);

    const r = await check('u1', 'ai_refine', 1);

    expect(r.planCode).toBe(FREE_PLAN_CODE);
    expect(r.limit).toBe(FREE_LIMITS.ai_refine);
    expect(r.wouldAllow).toBe(true);
    // Counter is never read for a free user (no subscriptionId).
    expect(counterFindFirst).not.toHaveBeenCalled();
  });
});

// --- check — shadow mode ---------------------------------------------------

describe('check — shadow mode (enforcement OFF)', () => {
  it('forces allowed=true but wouldAllow reflects the real (blocked) verdict', async () => {
    mockConfig.billingEnforcementEnabled = false;
    subFindFirst.mockResolvedValueOnce(planSub('free', { ...FREE_LIMITS }, 'free-sub'));
    counterFindFirst.mockResolvedValueOnce({ used: 100 }); // way over the 40 cap

    const r = await check('u1', 'ai_refine', 1);

    expect(r.allowed).toBe(true); // shadow mode never blocks
    expect(r.wouldAllow).toBe(false); // but the real verdict is "block"
    expect(r.reason).toBeDefined();
  });
});

// --- check — unlimited -----------------------------------------------------

describe('check — unlimited (-1) plan', () => {
  it('returns Infinity remaining and short-circuits without reading the counter', async () => {
    mockConfig.billingEnforcementEnabled = true;
    subFindFirst.mockResolvedValueOnce(planSub('enterprise', { ai_refine: -1 }, 'ent-sub'));

    const r = await check('u1', 'ai_refine', 50);

    expect(r.limit).toBe(-1);
    expect(r.remaining).toBe(Infinity);
    expect(r.allowed).toBe(true);
    expect(r.wouldAllow).toBe(true);
    expect(counterFindFirst).not.toHaveBeenCalled();
  });
});

// --- check — resource feature ----------------------------------------------

describe('check — resource feature uses currentCount', () => {
  it('blocks when currentCount + qty exceeds the limit (enforcement ON)', async () => {
    mockConfig.billingEnforcementEnabled = true;
    // free project_create = 1. currentCount = 1, qty = 1 → 2 > 1 → block.
    subFindFirst.mockResolvedValueOnce(planSub('free', { ...FREE_LIMITS }, 'free-sub'));

    const r = await check('u1', 'project_create', 1, 1);

    expect(r.wouldAllow).toBe(false);
    expect(r.allowed).toBe(false);
    // Resource features never read the usage counter.
    expect(counterFindFirst).not.toHaveBeenCalled();
  });

  it('allows when currentCount + qty is within the limit', async () => {
    mockConfig.billingEnforcementEnabled = true;
    subFindFirst.mockResolvedValueOnce(planSub('starter', { project_create: 5 }, 'st-sub'));

    const r = await check('u1', 'project_create', 1, 2);

    expect(r.wouldAllow).toBe(true);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3);
  });
});

// --- meter (idempotent write) ----------------------------------------------

describe('meter', () => {
  it('is a no-op for resource features', async () => {
    const r = await meter('u1', 'project_create', { dedupeKey: 'project_create:p1' });

    expect(r).toEqual({ counted: false });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it('records the event and creates the counter when none exists', async () => {
    subFindFirst.mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'st-sub'));
    counterFindFirst.mockResolvedValueOnce(null); // no counter yet

    const r = await meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:r1', qty: 2 });

    expect(r).toEqual({ counted: true });
    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionId: 'st-sub',
          feature: 'ai_refine',
          qty: 2,
          dedupeKey: 'ai_refine:r1',
        }),
      }),
    );
    expect(counterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionId: 'st-sub', feature: 'ai_refine', used: 2 }),
      }),
    );
    expect(counterUpdate).not.toHaveBeenCalled();
  });

  it('increments the existing counter atomically via { increment }', async () => {
    subFindFirst.mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'st-sub'));
    counterFindFirst.mockResolvedValueOnce({ id: 'ctr-1', used: 10 });

    const r = await meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:r2' });

    expect(r).toEqual({ counted: true });
    expect(counterUpdate).toHaveBeenCalledWith({
      where: { id: 'ctr-1' },
      data: { used: { increment: 1 } },
    });
    expect(counterCreate).not.toHaveBeenCalled();
  });

  it('a duplicate dedupeKey (P2002) is a no-op and never touches the counter', async () => {
    subFindFirst.mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'st-sub'));
    eventCreate.mockRejectedValueOnce({ code: 'P2002' });

    const r = await meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:r1' });

    expect(r).toEqual({ counted: false });
    expect(counterFindFirst).not.toHaveBeenCalled();
    expect(counterUpdate).not.toHaveBeenCalled();
    expect(counterCreate).not.toHaveBeenCalled();
  });

  it('double meter with the same dedupeKey: first counts, second is a no-op', async () => {
    subFindFirst
      .mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'st-sub'))
      .mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'st-sub'));
    counterFindFirst.mockResolvedValueOnce(null);
    // 1st create succeeds, 2nd throws P2002.
    eventCreate.mockResolvedValueOnce({}).mockRejectedValueOnce({ code: 'P2002' });

    const first = await meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:dup' });
    const second = await meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:dup' });

    expect(first).toEqual({ counted: true });
    expect(second).toEqual({ counted: false });
  });

  it('rethrows non-P2002 prisma errors', async () => {
    subFindFirst.mockResolvedValueOnce(planSub('starter', { ai_refine: 400 }, 'st-sub'));
    eventCreate.mockRejectedValueOnce({ code: 'P2003' }); // FK violation, not idempotency

    await expect(meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:r1' })).rejects.toMatchObject({
      code: 'P2003',
    });
  });

  it('free user (no subscription): writes the event but skips the counter', async () => {
    subFindFirst.mockResolvedValue(null);
    memberFindFirst.mockResolvedValue(null);

    const r = await meter('u1', 'ai_refine', { dedupeKey: 'ai_refine:free1' });

    expect(r).toEqual({ counted: true });
    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subscriptionId: null }) }),
    );
    expect(counterFindFirst).not.toHaveBeenCalled();
    expect(counterCreate).not.toHaveBeenCalled();
    expect(counterUpdate).not.toHaveBeenCalled();
  });
});

// --- facade ----------------------------------------------------------------

describe('entitlementService facade', () => {
  it('exposes the four named functions', () => {
    expect(entitlementService.check).toBe(check);
    expect(entitlementService.meter).toBe(meter);
    expect(entitlementService.resolveActiveSubscription).toBe(resolveActiveSubscription);
    expect(entitlementService.getLimits).toBe(getLimits);
  });
});
