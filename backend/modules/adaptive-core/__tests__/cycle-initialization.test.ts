import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('R3-A cycle initialization', () => {
  it('creates Cycle 1, Step 0 config and CP-0.1 for a new project', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const state = await service.ensureInitialized(project.id, 'u1', 'participante');
    const cycle = store.initiativeCycle[0];

    expect(cycle).toMatchObject({ projectId: project.id, cycleNumber: 1, status: 'active' });
    expect(store.adaptiveStepConfiguration[0]).toMatchObject({ projectId: project.id, cycleId: cycle.id, stepNumber: 0 });
    expect(store.adaptiveCheckpointInstance[0]).toMatchObject({ projectId: project.id, cycleId: cycle.id, checkpointKey: 'CP-0.1' });
    expect(state.cycle).toMatchObject({ id: cycle.id, cycleNumber: 1, currentStep: 0, status: 'active' });
  });

  it('does not duplicate Cycle 1, Step 0 config or CP-0.1 on repeated initialization', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    await service.ensureInitialized(project.id, 'u1', 'participante');
    await service.ensureInitialized(project.id, 'u1', 'participante');

    expect(store.initiativeCycle).toHaveLength(1);
    expect(store.adaptiveStepConfiguration.filter((config) => config.stepNumber === 0)).toHaveLength(1);
    expect(store.adaptiveCheckpointInstance.filter((checkpoint) => checkpoint.checkpointKey === 'CP-0.1')).toHaveLength(1);
  });

  it('recognizes a reentry cycle with only Step 2 active configuration as already initialized', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 2 });
    const cycle = {
      id: 'cycle-reentry-step2',
      projectId: project.id,
      cycleNumber: 2,
      parentCycleId: 'cycle-previous',
      basedOnCycleId: null,
      triggerType: 'critical_change',
      triggerRefId: 'critical-change-1',
      startStep: 2,
      currentStep: 2,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.initiativeCycle.push(cycle);
    store.adaptiveStepConfiguration.push({
      id: 'config-step2-reentry',
      projectId: project.id,
      cycleId: cycle.id,
      stepNumber: 2,
      version: 1,
      status: 'active',
      routeType: 'explore_validate',
      depthLevel: 'standard',
      maturity: 'execution',
      configurationJson: { step: 2 },
      sourceContextJson: { step2Output: { selectedBet: 'A prime' } },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const state = await service.ensureInitialized(project.id, 'u1', 'participante');

    expect(store.initiativeCycle).toHaveLength(1);
    expect(store.initiativeCycle[0]).toMatchObject({ id: cycle.id, currentStep: 2, status: 'active' });
    expect(store.adaptiveStepConfiguration.filter((config) => config.stepNumber === 0)).toHaveLength(0);
    expect(store.adaptiveStepConfiguration.filter((config) => config.stepNumber === 2)).toHaveLength(1);
    expect(state.cycle).toMatchObject({ id: cycle.id, startStep: 2, currentStep: 2, status: 'active' });
  });
});
