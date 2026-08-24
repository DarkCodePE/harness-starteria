import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('critical change idempotency', () => {
  it('stores one canonical CriticalChange and keeps AdaptiveAdaptationEvent as provenance', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 2 });
    const service = new AdaptiveCoreService(makeCyclePrisma(store));

    await service.ensureInitialized(project.id, 'u1', 'participante');
    const cycle = store.initiativeCycle[0];
    store.cycleStepState.push(
      { id: 'state-0', cycleId: cycle.id, stepNumber: 0, state: 'confirmed' },
      { id: 'state-1', cycleId: cycle.id, stepNumber: 1, state: 'confirmed' },
      { id: 'state-2', cycleId: cycle.id, stepNumber: 2, state: 'confirmed' },
    );
    store.adaptiveStepOutput.push({
      id: 'output-2',
      projectId: project.id,
      cycleId: cycle.id,
      stepNumber: 2,
      version: 1,
      status: 'confirmed',
      outputKey: 'SelectedBet',
      outputJson: { selectedBet: 'A' },
      requiresReview: false,
    });

    const input = {
      idempotencyKey: 'same-critical-change',
      field: 'selected_bet' as const,
      previousValue: { selectedBet: 'A' },
      nextValue: { selectedBet: 'B' },
      confirmed: true,
    };

    await service.registerCriticalChange(project.id, 'u1', 'participante', input);
    await service.registerCriticalChange(project.id, 'u1', 'participante', input);

    expect(store.criticalChange).toHaveLength(1);
    expect(store.criticalChange[0].status).toBe('assessment_ready');
    expect(store.criticalChange[0].confirmedById).toBeNull();
    expect(store.criticalChange[0].confirmedAt).toBeNull();
    expect(store.criticalChange[0].confirmedReentryStep).toBeNull();
    expect(store.criticalChange[0].resultingCycleId).toBeNull();
    expect(store.criticalChange[0].appliedAt).toBeNull();
    expect(store.criticalChange[0].impactJson.transition).toBe('new_cycle');
    expect(store.initiativeCycle).toHaveLength(1);
    expect(store.adaptiveStepConfiguration).toHaveLength(1);
    expect(store.adaptiveStepConfiguration.every((config) => config.requiresReview !== true)).toBe(true);
    expect(store.adaptiveStepOutput[0].requiresReview).toBe(false);

    const provenanceEvents = store.adaptiveAdaptationEvent.filter((event) => event.eventType === 'critical_change_assessment_ready');
    expect(provenanceEvents).toHaveLength(1);
    expect(provenanceEvents[0].payloadJson.criticalChangeId).toBe(store.criticalChange[0].id);
    expect(provenanceEvents[0].payloadJson.userActionConfirmedChange).toBe(true);
  });
});
