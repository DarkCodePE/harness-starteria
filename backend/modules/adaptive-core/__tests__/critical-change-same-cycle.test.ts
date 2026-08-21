import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('critical change same-cycle transition', () => {
  it('applies confirmed same_cycle without creating Cycle 2', async () => {
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

    await service.registerCriticalChange(project.id, 'u1', 'participante', {
      idempotencyKey: 'same-cycle-assessment',
      field: 'target_date',
      previousValue: '2026-09-01',
      nextValue: '2026-10-01',
      confirmed: true,
    });

    const criticalChange = store.criticalChange[0];
    expect(criticalChange.impactJson.transition).toBe('same_cycle');
    expect(criticalChange.impactJson.reentryStep).toBeNull();
    expect(criticalChange.impactJson.earliestAffectedStep).not.toBeNull();

    await service.confirmCriticalChangeTransition(project.id, 'u1', 'participante', criticalChange.id, {
      idempotencyKey: 'same-cycle-confirm',
      confirmed: true,
    });

    expect(store.initiativeCycle).toHaveLength(1);
    expect(criticalChange.status).toBe('applied');
    expect(criticalChange.confirmedById).toBe('u1');
    expect(criticalChange.confirmedAt).toBeInstanceOf(Date);
    expect(criticalChange.confirmedReentryStep).toBeNull();
    expect(criticalChange.appliedAt).toBeInstanceOf(Date);
    expect(criticalChange.resultingCycleId).toBeNull();

    const appliedEvent = store.adaptiveAdaptationEvent.find((event) => event.eventType === 'critical_change_applied');
    expect(appliedEvent?.payloadJson).toMatchObject({
      criticalChangeId: criticalChange.id,
      sourceCycleId: cycle.id,
      resultingCycleId: null,
      transition: 'same_cycle',
    });
  });

  it('rejects artificial same-cycle reentry when assessment has no reentryStep', async () => {
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

    await service.registerCriticalChange(project.id, 'u1', 'participante', {
      idempotencyKey: 'same-cycle-artificial-assessment',
      field: 'target_date',
      previousValue: '2026-09-01',
      nextValue: '2026-10-01',
      confirmed: true,
    });

    await expect(service.confirmCriticalChangeTransition(project.id, 'u1', 'participante', store.criticalChange[0].id, {
      idempotencyKey: 'same-cycle-artificial-confirm',
      confirmed: true,
      confirmedReentryStep: 3,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_REENTRY_MISMATCH' });
    expect(store.criticalChange[0].status).toBe('assessment_ready');
    expect(store.criticalChange[0].confirmedReentryStep).toBeNull();
  });
});
