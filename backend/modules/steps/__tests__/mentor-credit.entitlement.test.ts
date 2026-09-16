/**
 * mentor-credit.entitlement.test.ts — PRD-005 / issue #85 (`mentor_credit`).
 *
 * The participant mentor-booking call site already existed
 * (POST /:projectId/steps/:number/session → StepService.requestMentorSession).
 * This verifies the per-project credit ledger now decrements atomically and is
 * floored at 0 (so it never throws and never goes negative). The shadow metering
 * of the `mentor_credit` feature itself is covered by the middleware test; here
 * we pin the real side-effect the issue called for.
 */
import { describe, it, expect, vi } from 'vitest';
import { StepService } from '../step.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    step: { findFirst: vi.fn().mockResolvedValue({ id: 'step-1' }) },
    mentorSession: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'sess-1' }),
    },
    user: { findFirst: vi.fn().mockResolvedValue({ id: 'mentor-1', role: 'mentor' }) },
    project: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    ...overrides,
  } as any;
}

describe('requestMentorSession — mentor credit consumption (#85)', () => {
  it('creates a session and decrements mentorCredits atomically (floored at 0)', async () => {
    const prisma = makePrisma();
    const svc = new StepService(prisma);

    const out = await svc.requestMentorSession('proj-1', 1, 'user-1');

    expect(out.sessionId).toBe('sess-1');
    expect(prisma.mentorSession.create).toHaveBeenCalledOnce();
    // Atomic, guarded decrement: only when there's a credit left → never negative.
    expect(prisma.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'proj-1', mentorCredits: { gt: 0 } },
      data: { mentorCredits: { decrement: 1 } },
    });
  });

  it('is a no-op decrement (count 0) when the project has 0 credits — no throw', async () => {
    const prisma = makePrisma({
      project: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    });
    const svc = new StepService(prisma);

    // Booking still succeeds in the shadow phase (enforcement deferred to #84).
    await expect(svc.requestMentorSession('proj-1', 1, 'user-1')).resolves.toEqual({
      sessionId: 'sess-1',
    });
    expect(prisma.project.updateMany).toHaveBeenCalledOnce();
  });
});
