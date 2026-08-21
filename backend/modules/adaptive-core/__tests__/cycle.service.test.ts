import { describe, expect, it } from 'vitest';
import { AdaptiveCycleService } from '../cycle.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('AdaptiveCycleService', () => {
  it('creates Cycle 1 idempotently for a project without cycles', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 0 });
    const prisma = makeCyclePrisma(store);
    const service = new AdaptiveCycleService(prisma as any);

    const first = await service.ensureActiveCycle(project.id);
    const second = await service.ensureActiveCycle(project.id);

    expect(first.id).toBe(second.id);
    expect(store.initiativeCycle).toHaveLength(1);
    expect(first.cycleNumber).toBe(1);
    expect(first.status).toBe('active');
    expect(store.cycleStepState).toHaveLength(5);
    expect(store.cycleStepState.find((state) => state.stepNumber === 0)?.state).toBe('active');
  });

  it('backfills existing R2 rows into Cycle 1 without replacing them', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 2 });
    const prisma = makeCyclePrisma(store);
    const output = {
      id: 'legacy-output',
      projectId: project.id,
      stepNumber: 1,
      version: 1,
      status: 'confirmed',
      outputKey: 'ProblemFocusBrief',
      outputJson: { preserved: true },
      confirmedById: 'u1',
      confirmedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    store.adaptiveStepOutput.push(output);

    const cycle = await new AdaptiveCycleService(prisma as any).ensureActiveCycle(project.id);

    expect(store.adaptiveStepOutput[0]).toMatchObject({
      id: output.id,
      outputJson: output.outputJson,
      confirmedAt: output.confirmedAt,
      confirmedById: output.confirmedById,
      cycleId: cycle.id,
    });
  });
});
