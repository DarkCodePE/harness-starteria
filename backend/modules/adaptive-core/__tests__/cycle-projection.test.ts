import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('R3-A cycle projection', () => {
  it('moves Cycle, Project, PortfolioMeta and ProgressSignal together when confirming Step 0', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, {
      portfolioMeta: [{ id: 'meta-1', projectId: 'project-r3a-projection', challengeId: 'challenge-1', currentStep: 'Step 0' }],
      id: 'project-r3a-projection',
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);
    await service.ensureInitialized(project.id, 'u1', 'participante');
    const cycle = store.initiativeCycle[0];
    const config = store.adaptiveStepConfiguration[0];
    store.adaptiveStepOutput.push({
      id: 'draft-step0',
      projectId: project.id,
      cycleId: cycle.id,
      sourceConfigurationId: config.id,
      stepNumber: 0,
      version: 1,
      status: 'draft',
      outputKey: 'Step0AlignmentBrief',
      outputJson: { priorityHypothesis: 'H1', availableEvidence: [], actors: [], decisionCriteria: 'D1' },
    });

    await service.confirmStep0Brief(project.id, 'u1', 'participante', {
      confirmed: true,
      idempotencyKey: 'confirm-step0-r3a',
      brief: { priorityHypothesis: 'H1', availableEvidence: [], actors: ['Owner'], decisionCriteria: 'D1' },
    });

    expect(store.initiativeCycle[0].currentStep).toBe(1);
    expect(store.project[0].currentStep).toBe(1);
    expect(store.initiativePortfolioMeta[0].currentStep).toBe('Step 1');
    expect(store.adaptiveProgressSignal[0]).toMatchObject({ projectId: project.id, cycleId: cycle.id, stepNumber: 1 });
    expect(store.adaptiveStepConfiguration.find((item) => item.stepNumber === 1)?.cycleId).toBe(cycle.id);
    expect(store.adaptiveCheckpointInstance.find((item) => item.checkpointKey === 'CP-1.1')?.cycleId).toBe(cycle.id);
  });
});
