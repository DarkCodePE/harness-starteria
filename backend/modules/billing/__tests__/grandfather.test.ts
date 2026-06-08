/**
 * Unit tests for grandfather.ts (TASK-015 seed half, ADR-020 §grandfather).
 * Prisma is fully mocked — no DB connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/db/prisma', () => ({
  prisma: {
    plan: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: { findMany: vi.fn() },
    subscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    project: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../../shared/db/prisma';
import { grandfatherExistingUsers } from '../grandfather';

const mockPlan = prisma.plan as {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
};
const mockUser = prisma.user as { findMany: ReturnType<typeof vi.fn> };
const mockSubscription = prisma.subscription as {
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};
const mockProject = prisma.project as {
  count: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
};

const PILOT_PLAN = { id: 'plan-pilot-id', code: 'pilot' };

beforeEach(() => {
  vi.clearAllMocks();
  // Default: pilot plan exists, no pilot redeemers
  mockPlan.findFirst.mockResolvedValue(PILOT_PLAN);
  mockProject.count.mockResolvedValue(0);
});

describe('grandfatherExistingUsers()', () => {
  it('creates a subscription for a user who has no existing subscription', async () => {
    mockUser.findMany.mockResolvedValue([{ id: 'user-1' }]);
    mockSubscription.findFirst.mockResolvedValue(null); // no existing sub
    mockSubscription.create.mockResolvedValue({});

    const result = await grandfatherExistingUsers();

    expect(mockSubscription.create).toHaveBeenCalledTimes(1);
    expect(result.granted).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it('creates subscription with provider MANUAL and planId from the pilot plan', async () => {
    mockUser.findMany.mockResolvedValue([{ id: 'user-2' }]);
    mockSubscription.findFirst.mockResolvedValue(null);
    mockSubscription.create.mockResolvedValue({});

    await grandfatherExistingUsers();

    const createArg = mockSubscription.create.mock.calls[0][0] as {
      data: {
        planId: string;
        userId: string;
        status: string;
        provider: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
      };
    };
    expect(createArg.data.planId).toBe(PILOT_PLAN.id);
    expect(createArg.data.userId).toBe('user-2');
    expect(createArg.data.status).toBe('ACTIVE');
    expect(createArg.data.provider).toBe('MANUAL');
  });

  it('sets currentPeriodEnd approximately 1 year (~365 days) after currentPeriodStart', async () => {
    mockUser.findMany.mockResolvedValue([{ id: 'user-3' }]);
    mockSubscription.findFirst.mockResolvedValue(null);
    mockSubscription.create.mockResolvedValue({});

    await grandfatherExistingUsers();

    const createArg = mockSubscription.create.mock.calls[0][0] as {
      data: { currentPeriodStart: Date; currentPeriodEnd: Date };
    };
    const start = createArg.data.currentPeriodStart;
    const end = createArg.data.currentPeriodEnd;
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    // Allow leap-year tolerance: 365 or 366 days
    expect(diffDays).toBeGreaterThanOrEqual(365);
    expect(diffDays).toBeLessThanOrEqual(366);
  });

  it('skips a user who already has a subscription (idempotent)', async () => {
    mockUser.findMany.mockResolvedValue([{ id: 'user-already-subbed' }]);
    mockSubscription.findFirst.mockResolvedValue({ id: 'existing-sub' }); // already has one
    mockSubscription.create.mockResolvedValue({});

    const result = await grandfatherExistingUsers();

    expect(mockSubscription.create).not.toHaveBeenCalled();
    expect(result.granted).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('grants 0 subscriptions on a second run (full idempotency)', async () => {
    const users = [{ id: 'user-a' }, { id: 'user-b' }];
    mockUser.findMany.mockResolvedValue(users);

    // First run: no subscriptions exist
    mockSubscription.findFirst.mockResolvedValue(null);
    mockSubscription.create.mockResolvedValue({});

    const first = await grandfatherExistingUsers();
    expect(first.granted).toBe(2);

    // Second run: all users now have subscriptions
    mockSubscription.findFirst.mockResolvedValue({ id: 'some-sub' });
    mockSubscription.create.mockClear();

    const second = await grandfatherExistingUsers();
    expect(second.granted).toBe(0);
    expect(second.skipped).toBe(2);
    expect(mockSubscription.create).not.toHaveBeenCalled();
  });

  it('processes multiple users correctly — mix of new and existing subscriptions', async () => {
    const users = [{ id: 'user-new' }, { id: 'user-existing' }];
    mockUser.findMany.mockResolvedValue(users);

    // First user has no sub, second already has one
    mockSubscription.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'sub-existing' });
    mockSubscription.create.mockResolvedValue({});

    const result = await grandfatherExistingUsers();

    expect(result.granted).toBe(1);
    expect(result.skipped).toBe(1);
    expect(mockSubscription.create).toHaveBeenCalledTimes(1);
  });

  it('throws a helpful error when the pilot plan does not exist', async () => {
    mockPlan.findFirst.mockResolvedValue(null); // plan missing

    await expect(grandfatherExistingUsers()).rejects.toThrow(
      /run seedPlans/i,
    );
  });

  it('throws with the plan code in the error message when plan is missing', async () => {
    mockPlan.findFirst.mockResolvedValue(null);

    await expect(grandfatherExistingUsers({ planCode: 'custom-plan' })).rejects.toThrow(
      /custom-plan/,
    );
  });

  it('respects a custom planCode option', async () => {
    const customPlan = { id: 'plan-custom-id', code: 'starter' };
    mockPlan.findFirst.mockResolvedValue(customPlan);
    mockUser.findMany.mockResolvedValue([{ id: 'user-5' }]);
    mockSubscription.findFirst.mockResolvedValue(null);
    mockSubscription.create.mockResolvedValue({});

    await grandfatherExistingUsers({ planCode: 'starter' });

    const createArg = mockSubscription.create.mock.calls[0][0] as {
      data: { planId: string };
    };
    expect(createArg.data.planId).toBe('plan-custom-id');

    // The findFirst for plan was called with the custom code
    expect(mockPlan.findFirst).toHaveBeenCalledWith({
      where: { code: 'starter' },
    });
  });

  it('returns pilotRedeemers count from project.count', async () => {
    mockProject.count.mockResolvedValue(3);
    mockUser.findMany.mockResolvedValue([]);

    const result = await grandfatherExistingUsers();

    expect(result.pilotRedeemers).toBe(3);
  });

  it('returns pilotRedeemers=0 when no pilot projects exist', async () => {
    mockProject.count.mockResolvedValue(0);
    mockUser.findMany.mockResolvedValue([]);

    const result = await grandfatherExistingUsers();

    expect(result.pilotRedeemers).toBe(0);
  });

  it('grants nothing and returns 0/0 when there are no users', async () => {
    mockUser.findMany.mockResolvedValue([]);

    const result = await grandfatherExistingUsers();

    expect(result.granted).toBe(0);
    expect(result.skipped).toBe(0);
    expect(mockSubscription.create).not.toHaveBeenCalled();
  });
});
