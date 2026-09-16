import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('R3-A cycle state loading', () => {
  it('loads state only from the active cycle', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);
    await service.ensureInitialized(project.id, 'u1', 'participante');
    const active = store.initiativeCycle[0];
    const historical = {
      id: 'historical-cycle',
      projectId: project.id,
      cycleNumber: 0,
      status: 'completed',
      startStep: 0,
      currentStep: 4,
      triggerType: 'initial',
    };
    store.initiativeCycle.push(historical);
    store.adaptiveStepOutput.push({
      id: 'historical-output',
      projectId: project.id,
      cycleId: historical.id,
      stepNumber: 1,
      version: 1,
      status: 'confirmed',
      outputKey: 'HistoricalOutput',
      outputJson: { historical: true },
    });

    const state = await service.getState(project.id, 'u1', 'participante');

    expect(state.cycle?.id).toBe(active.id);
    expect(state.stepOutputs.some((output) => output.id === 'historical-output')).toBe(false);
  });

  it('rejects confirmation of a checkpoint that belongs only to a historical cycle', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);
    await service.ensureInitialized(project.id, 'u1', 'participante');
    const historical = {
      id: 'historical-cycle',
      projectId: project.id,
      cycleNumber: 0,
      status: 'completed',
      startStep: 0,
      currentStep: 1,
      triggerType: 'initial',
    };
    store.initiativeCycle.push(historical);
    store.adaptiveCheckpointInstance.push({
      id: 'historical-cp',
      projectId: project.id,
      cycleId: historical.id,
      stepConfigurationId: store.adaptiveStepConfiguration[0].id,
      stepNumber: 1,
      checkpointKey: 'CP-1.1',
      sequence: 1,
      status: 'ready',
      materializedQuestionsJson: [],
    });

    await expect(service.confirmCheckpoint(project.id, 'u1', 'participante', {
      idempotencyKey: 'historical-cp-confirm',
      checkpointKey: 'CP-1.1',
      responses: { mainHypothesis: 'H1' },
    })).rejects.toMatchObject({ code: 'CHECKPOINT_NOT_ACTIVE' });
    expect(store.adaptiveCheckpointInstance.find((item) => item.id === 'historical-cp')?.status).toBe('ready');
  });
});
