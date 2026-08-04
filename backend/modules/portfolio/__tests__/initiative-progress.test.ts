/**
 * initiative-progress.test.ts - issue #95.
 *
 * Pins the derivation that keeps InitiativePortfolioMeta.status in sync with real step
 * progress, and the best-effort sync's guardrails: it only touches linked initiatives
 * that are still in the auto-progression phase, and it never throws.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  deriveInitiativePortfolioStatus,
  syncInitiativeProgress,
} from '../initiative-progress';

const approved = (n: number) => ({ number: n, status: 'APPROVED' });

describe('deriveInitiativePortfolioStatus', () => {
  it('stays en_step_0 while Step 0 is not COMPLETED', () => {
    expect(deriveInitiativePortfolioStatus('NOT_STARTED', [])).toBe('en_step_0');
    expect(deriveInitiativePortfolioStatus('IN_PROGRESS', [approved(1)])).toBe('en_step_0');
  });

  it('moves to en_step_1 once Step 0 is COMPLETED but no step is approved', () => {
    expect(deriveInitiativePortfolioStatus('COMPLETED', [])).toBe('en_step_1');
    expect(
      deriveInitiativePortfolioStatus('COMPLETED', [{ number: 1, status: 'IN_PROGRESS' }]),
    ).toBe('en_step_1');
  });

  it('points to the lowest not-yet-approved step', () => {
    expect(deriveInitiativePortfolioStatus('COMPLETED', [approved(1)])).toBe('en_step_2');
    expect(
      deriveInitiativePortfolioStatus('COMPLETED', [approved(1), approved(2)]),
    ).toBe('en_step_3');
    expect(
      deriveInitiativePortfolioStatus('COMPLETED', [
        approved(1),
        approved(2),
        { number: 3, status: 'SUBMITTED' },
        approved(4),
      ]),
    ).toBe('en_step_3');
  });

  it('caps at en_step_4 when every step is approved', () => {
    expect(
      deriveInitiativePortfolioStatus('COMPLETED', [approved(1), approved(2), approved(3), approved(4)]),
    ).toBe('en_step_4');
  });
});

describe('syncInitiativeProgress', () => {
  function makePrisma(overrides: Record<string, any> = {}) {
    return {
      initiativePortfolioMeta: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      ...overrides,
    } as any;
  }

  it('is a no-op when the project has no linked initiative in progression', async () => {
    const prisma = makePrisma();
    await syncInitiativeProgress(prisma, 'p1');
    expect(prisma.initiativePortfolioMeta.updateMany).not.toHaveBeenCalled();
    expect(prisma.project.findUnique).not.toHaveBeenCalled();
  });

  it('pushes the derived status to linked progression-phase initiatives', async () => {
    const prisma = makePrisma({
      initiativePortfolioMeta: {
        findMany: vi.fn().mockResolvedValue([{ id: 'm1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue({
          step0Status: 'COMPLETED',
          steps: [{ number: 1, status: 'APPROVED' }, { number: 2, status: 'IN_PROGRESS' }],
        }),
      },
    });
    await syncInitiativeProgress(prisma, 'p1');
    expect(prisma.initiativePortfolioMeta.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['m1'] } },
      data: { status: 'en_step_2', currentStep: '2' },
    });
  });

  it('prefers adaptive progress signal over legacy Step rows', async () => {
    const prisma = makePrisma({
      initiativePortfolioMeta: {
        findMany: vi.fn().mockResolvedValue([{ id: 'm1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue({
          step0Status: 'COMPLETED',
          steps: [{ number: 1, status: 'IN_PROGRESS' }],
          adaptiveProgressSignal: { signalJson: { step: 3, checkpointCode: 'CP-3.1' } },
        }),
      },
    });
    await syncInitiativeProgress(prisma, 'p1');
    expect(prisma.initiativePortfolioMeta.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['m1'] } },
      data: { status: 'en_step_3', currentStep: '3' },
    });
  });

  it('never throws - a DB failure is swallowed (sync is best-effort)', async () => {
    const prisma = makePrisma({
      initiativePortfolioMeta: {
        findMany: vi.fn().mockRejectedValue(new Error('db down')),
        updateMany: vi.fn(),
      },
    });
    await expect(syncInitiativeProgress(prisma, 'p1')).resolves.toBeUndefined();
  });
});
