import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

async function createSelectedBetCriticalChange() {
  const store = createCycleStore();
  const project = seedCycleProject(store, { currentStep: 3 });
  const service = new AdaptiveCoreService(makeCyclePrisma(store));
  await service.ensureInitialized(project.id, 'u1', 'participante');
  const cycle = store.initiativeCycle[0];
  store.cycleStepState.push(
    { id: 'state-0', cycleId: cycle.id, stepNumber: 0, state: 'confirmed' },
    { id: 'state-1', cycleId: cycle.id, stepNumber: 1, state: 'confirmed' },
    { id: 'state-2', cycleId: cycle.id, stepNumber: 2, state: 'confirmed' },
  );
  store.adaptiveStepOutput.push(
    { id: 'output-0', projectId: project.id, cycleId: cycle.id, stepNumber: 0, version: 1, status: 'confirmed', outputKey: 'Step0AlignmentBrief', outputJson: {} },
    { id: 'output-1', projectId: project.id, cycleId: cycle.id, stepNumber: 1, version: 1, status: 'confirmed', outputKey: 'Step1FocusDecision', outputJson: {} },
    { id: 'output-2', projectId: project.id, cycleId: cycle.id, stepNumber: 2, version: 1, status: 'confirmed', outputKey: 'SelectedBet', outputJson: { selectedBet: 'A' } },
  );
  await service.registerCriticalChange(project.id, 'u1', 'participante', {
    idempotencyKey: 'idempotent-new-cycle-assessment',
    field: 'selected_bet',
    previousValue: { selectedBet: 'A' },
    nextValue: { selectedBet: 'B' },
    confirmed: true,
  });
  return { store, project, service, criticalChange: store.criticalChange[0] };
}

describe('critical change transition idempotency and validation', () => {
  it('keeps one Cycle 2 and one active cycle when confirmation is retried', async () => {
    const { store, project, service, criticalChange } = await createSelectedBetCriticalChange();

    const input = { idempotencyKey: 'idempotent-transition-confirm', confirmed: true, confirmedReentryStep: 2 as const };
    await service.confirmCriticalChangeTransition(project.id, 'u1', 'participante', criticalChange.id, input);
    const resultingCycleId = criticalChange.resultingCycleId;
    await service.confirmCriticalChangeTransition(project.id, 'u1', 'participante', criticalChange.id, input);

    expect(store.initiativeCycle).toHaveLength(2);
    expect(store.initiativeCycle.filter((cycle) => cycle.status === 'active')).toHaveLength(1);
    expect(criticalChange.resultingCycleId).toBe(resultingCycleId);
    expect(store.initiativeCycle.filter((cycle) => cycle.triggerRefId === criticalChange.id)).toHaveLength(1);
  });

  it('rejects a CriticalChange from another project', async () => {
    const { store, project, service, criticalChange } = await createSelectedBetCriticalChange();
    const otherProject = seedCycleProject(store, { id: 'other-project-r3b2a' });

    await expect(service.confirmCriticalChangeTransition(otherProject.id, 'u1', 'participante', criticalChange.id, {
      idempotencyKey: 'cross-project-confirm',
      confirmed: true,
      confirmedReentryStep: 2,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_NOT_FOUND' });
    expect(project.currentStep).toBe(3);
  });

  it('rejects derived initiative recommendations in R3-B2A', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 2 });
    const service = new AdaptiveCoreService(makeCyclePrisma(store));
    await service.ensureInitialized(project.id, 'u1', 'participante');
    const cycle = store.initiativeCycle[0];
    store.cycleStepState.push(
      { id: 'state-0', cycleId: cycle.id, stepNumber: 0, state: 'confirmed' },
      { id: 'state-1', cycleId: cycle.id, stepNumber: 1, state: 'confirmed' },
    );
    await service.registerCriticalChange(project.id, 'u1', 'participante', {
      idempotencyKey: 'derived-assessment',
      field: 'challenge_type',
      previousValue: 'growth',
      nextValue: 'new-challenge',
      confirmed: true,
    });
    const criticalChange = store.criticalChange[0];
    expect(criticalChange.impactJson.transition).toBe('derived_initiative_recommended');

    await expect(service.confirmCriticalChangeTransition(project.id, 'u1', 'participante', criticalChange.id, {
      idempotencyKey: 'derived-confirm',
      confirmed: true,
      confirmedReentryStep: 0,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_TRANSITION_UNSUPPORTED' });
    expect(store.initiativeCycle).toHaveLength(1);
    expect(criticalChange.status).toBe('assessment_ready');
  });
});
