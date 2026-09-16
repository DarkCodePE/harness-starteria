/**
 * Unit tests for seed-plans.ts (TASK-019).
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
import { seedPlans } from '../seed-plans';
import { PLAN_CATALOG } from '../plans';

const mockPlan = prisma.plan as unknown as {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('seedPlans()', () => {
  it('calls upsert once for each entry in PLAN_CATALOG', async () => {
    // All plans are new (findUnique returns null → created)
    mockPlan.findUnique.mockResolvedValue(null);
    mockPlan.upsert.mockResolvedValue({});

    await seedPlans();

    expect(mockPlan.upsert).toHaveBeenCalledTimes(PLAN_CATALOG.length);
  });

  it('upserts every plan by its code', async () => {
    mockPlan.findUnique.mockResolvedValue(null);
    mockPlan.upsert.mockResolvedValue({});

    await seedPlans();

    const codes = mockPlan.upsert.mock.calls.map(
      (call: unknown[]) => (call[0] as { where: { code: string } }).where.code,
    );
    expect(codes).toEqual(expect.arrayContaining(PLAN_CATALOG.map((p) => p.code)));
    expect(codes).toHaveLength(PLAN_CATALOG.length);
  });

  it('counts plans as created when findUnique returns null', async () => {
    mockPlan.findUnique.mockResolvedValue(null);
    mockPlan.upsert.mockResolvedValue({});

    const result = await seedPlans();

    expect(result.created).toBe(PLAN_CATALOG.length);
    expect(result.updated).toBe(0);
  });

  it('counts plans as updated when findUnique returns an existing row', async () => {
    const existingRow = { id: 'plan-1', code: 'free' };
    mockPlan.findUnique.mockResolvedValue(existingRow);
    mockPlan.upsert.mockResolvedValue({});

    const result = await seedPlans();

    expect(result.updated).toBe(PLAN_CATALOG.length);
    expect(result.created).toBe(0);
  });

  it('is idempotent: second run returns 0 created, all updated', async () => {
    mockPlan.findUnique.mockResolvedValue({ id: 'existing' });
    mockPlan.upsert.mockResolvedValue({});

    const first = await seedPlans();
    const second = await seedPlans();

    // Both passes use the same mock state (all plans already exist)
    expect(first.created).toBe(0);
    expect(first.updated).toBe(PLAN_CATALOG.length);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(PLAN_CATALOG.length);
    // Upsert was called in both passes
    expect(mockPlan.upsert).toHaveBeenCalledTimes(PLAN_CATALOG.length * 2);
  });

  it('upsert create payload includes all required fields', async () => {
    mockPlan.findUnique.mockResolvedValue(null);
    mockPlan.upsert.mockResolvedValue({});

    await seedPlans();

    const freePlanCall = mockPlan.upsert.mock.calls.find(
      (call: unknown[]) => (call[0] as { where: { code: string } }).where.code === 'free',
    );
    expect(freePlanCall).toBeDefined();

    const arg = freePlanCall![0] as {
      create: {
        code: string;
        name: string;
        interval: string;
        priceCents: number;
        currency: string;
        limits: object;
        isActive: boolean;
      };
    };
    expect(arg.create).toMatchObject({
      code: 'free',
      isActive: true,
    });
    expect(typeof arg.create.limits).toBe('object');
  });
});
