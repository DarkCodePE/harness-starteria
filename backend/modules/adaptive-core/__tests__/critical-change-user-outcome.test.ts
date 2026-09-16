import { describe, expect, it } from 'vitest';
import { buildCriticalChangeUserOutcome } from '../critical-change-user-outcome';
import type { ChangeImpactResult } from '../adaptive-core.types';

describe('critical change user outcome', () => {
  it('projects new_cycle Step 2 as preserved context and resume action', () => {
    const outcome = buildCriticalChangeUserOutcome({
      assessmentVersion: 1,
      sourceCycleId: 'cycle-1',
      changeScope: 'solution',
      affectedSteps: [2, 3, 4],
      affectedCheckpoints: ['CP-2.3'],
      affectedOutputIds: ['SelectedBet'],
      earliestAffectedStep: 2,
      confirmedContractAffected: true,
      materialChange: true,
      transition: 'new_cycle',
      reentryStep: 2,
      basedOnCycleId: null,
      inheritedSteps: [0, 1],
      reopenedSteps: [2, 3, 4],
      pendingSteps: [],
      historicalOnlySteps: [],
      identityChange: false,
      derivedInitiativeRecommended: false,
      rationale: [],
    } satisfies ChangeImpactResult);

    expect(outcome.preservedSteps).toEqual([0, 1]);
    expect(outcome.reviewSteps).toContain(2);
    expect(outcome.recommendedAction).toBe('resume_from_step');
    expect(outcome.recommendedStep).toBe(2);
    expect(outcome.headline).toContain('Step 2');
  });

  it('explains return_to_prior_direction as a new iteration, not rollback terminology', () => {
    const outcome = buildCriticalChangeUserOutcome({
      assessmentVersion: 1,
      sourceCycleId: 'cycle-2',
      changeScope: 'solution',
      affectedSteps: [2, 3, 4],
      affectedCheckpoints: ['CP-2.1'],
      affectedOutputIds: ['SelectedBet'],
      earliestAffectedStep: 2,
      confirmedContractAffected: true,
      materialChange: true,
      transition: 'return_to_prior_direction',
      reentryStep: 2,
      basedOnCycleId: 'cycle-1',
      inheritedSteps: [0, 1],
      reopenedSteps: [2, 3, 4],
      pendingSteps: [],
      historicalOnlySteps: [],
      identityChange: false,
      derivedInitiativeRecommended: false,
      rationale: [],
    } satisfies ChangeImpactResult);

    expect(outcome.recommendedAction).toBe('return_to_prior_direction');
    expect(outcome.headline).toBe('Retomar una direccion anterior');
    expect(outcome.message).toContain('nueva iteracion');
    expect(outcome.message).toContain('aprendizaje');
  });
});
