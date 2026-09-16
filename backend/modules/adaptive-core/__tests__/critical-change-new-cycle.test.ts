import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

function stateByStep(states: Array<Record<string, any>>) {
  return Object.fromEntries(states.map((state) => [state.stepNumber, state]));
}

describe('critical change new-cycle transition', () => {
  it('creates Cycle 2 at confirmed Step 2 reentry without copying historical outputs', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, {
      currentStep: 3,
      portfolioMeta: [{ id: 'meta-r3b2a', projectId: 'project-r3b2a-new-cycle' }],
      id: 'project-r3b2a-new-cycle',
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store));

    await service.ensureInitialized(project.id, 'u1', 'participante');
    const cycle1 = store.initiativeCycle[0];
    const config1 = store.adaptiveStepConfiguration[0];

    store.cycleStepState.push(
      { id: 'state-0', cycleId: cycle1.id, stepNumber: 0, state: 'confirmed' },
      { id: 'state-1', cycleId: cycle1.id, stepNumber: 1, state: 'confirmed' },
      { id: 'state-2', cycleId: cycle1.id, stepNumber: 2, state: 'confirmed' },
      { id: 'state-3', cycleId: cycle1.id, stepNumber: 3, state: 'active' },
    );
    store.adaptiveStepOutput.push(
      {
        id: 'output-step0-cycle1',
        projectId: project.id,
        cycleId: cycle1.id,
        stepNumber: 0,
        version: 1,
        sourceConfigurationId: config1.id,
        status: 'confirmed',
        outputKey: 'Step0AlignmentBrief',
        outputJson: { priorityHypothesis: 'H0' },
      },
      {
        id: 'output-step1-cycle1',
        projectId: project.id,
        cycleId: cycle1.id,
        stepNumber: 1,
        version: 1,
        sourceConfigurationId: config1.id,
        status: 'confirmed',
        outputKey: 'Step1FocusDecision',
        outputJson: { focus: 'F1' },
      },
      {
        id: 'output-step2-cycle1',
        projectId: project.id,
        cycleId: cycle1.id,
        stepNumber: 2,
        version: 1,
        sourceConfigurationId: config1.id,
        status: 'confirmed',
        outputKey: 'SelectedBet',
        outputJson: { selectedBet: 'A' },
      },
    );

    await service.registerCriticalChange(project.id, 'u1', 'participante', {
      idempotencyKey: 'new-cycle-assessment',
      field: 'selected_bet',
      previousValue: { selectedBet: 'A' },
      nextValue: { selectedBet: 'B' },
      confirmed: true,
    });
    const criticalChange = store.criticalChange[0];
    expect(criticalChange.impactJson.transition).toBe('new_cycle');
    expect(criticalChange.impactJson.reentryStep).toBe(2);

    await service.confirmCriticalChangeTransition(project.id, 'u1', 'participante', criticalChange.id, {
      idempotencyKey: 'new-cycle-confirm',
      confirmed: true,
      confirmedReentryStep: 2,
    });

    expect(store.initiativeCycle).toHaveLength(2);
    const cycle2 = store.initiativeCycle.find((cycle) => cycle.id !== cycle1.id)!;
    expect(cycle1.status).toBe('superseded');
    expect(cycle2).toMatchObject({
      projectId: project.id,
      cycleNumber: 2,
      parentCycleId: cycle1.id,
      basedOnCycleId: null,
      triggerType: 'critical_change',
      triggerRefId: criticalChange.id,
      startStep: 2,
      currentStep: 2,
      status: 'active',
    });

    const cycle2States = stateByStep(store.cycleStepState.filter((state) => state.cycleId === cycle2.id));
    expect(cycle2States[0]).toMatchObject({ state: 'inherited', inheritedFromCycleId: cycle1.id, inheritedFromOutputId: 'output-step0-cycle1' });
    expect(cycle2States[1]).toMatchObject({ state: 'inherited', inheritedFromCycleId: cycle1.id, inheritedFromOutputId: 'output-step1-cycle1' });
    expect(cycle2States[2]).toMatchObject({ state: 'active' });
    expect(cycle2States[3]).toMatchObject({ state: 'pending' });
    expect(cycle2States[4]).toMatchObject({ state: 'pending' });

    expect(store.adaptiveStepOutput.find((output) => output.id === 'output-step2-cycle1')?.outputJson).toEqual({ selectedBet: 'A' });
    expect(store.adaptiveStepOutput.filter((output) => output.cycleId === cycle2.id)).toHaveLength(0);

    const cycle2Config = store.adaptiveStepConfiguration.find((config) => config.cycleId === cycle2.id);
    expect(cycle2Config).toMatchObject({ projectId: project.id, stepNumber: 2, version: 1, status: 'active' });
    expect(store.adaptiveCheckpointInstance.find((checkpoint) => checkpoint.cycleId === cycle2.id)).toMatchObject({
      projectId: project.id,
      stepNumber: 2,
      checkpointKey: 'CP-2.1',
      stepConfigurationId: cycle2Config?.id,
    });

    expect(project.currentStep).toBe(2);
    expect(cycle2.currentStep).toBe(2);
    expect(store.initiativePortfolioMeta[0].currentStep).toBe('Step 2');
    expect(store.adaptiveProgressSignal[0]).toMatchObject({ cycleId: cycle2.id, stepNumber: 2 });
    expect(store.adaptiveProgressSignal[0].signalJson.step).toBe(2);
    expect(criticalChange).toMatchObject({
      status: 'applied',
      confirmedById: 'u1',
      confirmedReentryStep: 2,
      resultingCycleId: cycle2.id,
    });
    expect(criticalChange.appliedAt).toBeInstanceOf(Date);
  });
});
