import { describe, expect, it } from 'vitest';
import { CriticalChangeDependencyResolver, mapLegacyCriticalChangeField } from '../critical-change-dependency.resolver';
import { CriticalChangeImpactResolver } from '../critical-change-impact.resolver';
import type { ChangeImpactResult, CriticalChangeScope, StepNumber } from '../adaptive-core.types';

const dependencies = new CriticalChangeDependencyResolver();
const impactResolver = new CriticalChangeImpactResolver();

function assess(input: {
  field: string;
  scope?: CriticalChangeScope;
  previousValue: unknown;
  nextValue: unknown;
  confirmedSteps?: StepNumber[];
  outputStatuses?: Partial<Record<StepNumber, string>>;
}): ChangeImpactResult {
  const changeScope = input.scope ?? mapLegacyCriticalChangeField(input.field);
  return impactResolver.resolve({
    change: {
      sourceCycleId: 'cycle-1',
      changeScope,
      field: input.field,
      previousValue: input.previousValue,
      nextValue: input.nextValue,
    },
    sourceCycle: { id: 'cycle-1', currentStep: 3 },
    dependency: dependencies.resolve({ changeScope, field: input.field }),
    stepStates: [0, 1, 2, 3, 4].map((stepNumber) => ({
      stepNumber,
      state: input.confirmedSteps?.includes(stepNumber as StepNumber) ? 'confirmed' : stepNumber === 3 ? 'active' : 'pending',
    })),
    stepOutputs: Object.entries(input.outputStatuses ?? {}).map(([stepNumber, status]) => ({
      id: `output-${stepNumber}`,
      stepNumber: Number(stepNumber),
      status: status ?? 'draft',
    })),
  });
}

describe('critical change assessment', () => {
  it('keeps same cycle when selected_bet changes while Step 2 is draft', () => {
    const result = assess({
      field: 'selected_bet',
      previousValue: { selectedBet: 'A' },
      nextValue: { selectedBet: 'B' },
      outputStatuses: { 2: 'draft' },
    });

    expect(result.transition).toBe('same_cycle');
    expect(result.materialChange).toBe(false);
    expect(result.confirmedContractAffected).toBe(false);
  });

  it('recommends new cycle from Step 2 when selected_bet changes after Step 2 is confirmed', () => {
    const result = assess({
      field: 'selected_bet',
      previousValue: { selectedBet: 'A' },
      nextValue: { selectedBet: 'B' },
      confirmedSteps: [0, 1, 2],
    });

    expect(result.transition).toBe('new_cycle');
    expect(result.reentryStep).toBe(2);
    expect(result.inheritedSteps).toEqual([0, 1]);
    expect(result.materialChange).toBe(true);
  });

  it('keeps target_date as operational/non-material even with active Step 3 context', () => {
    const result = assess({
      field: 'target_date',
      previousValue: '2026-09-01',
      nextValue: '2026-10-01',
      confirmedSteps: [0, 1, 2],
    });

    expect(result.transition).toBe('same_cycle');
    expect(result.reentryStep).toBeNull();
    expect(result.materialChange).toBe(false);
  });

  it('uses earliest confirmed affected dependency for hypothesis changes without hardcoding Step 0', () => {
    const result = assess({
      field: 'hypothesis',
      previousValue: 'A',
      nextValue: 'B',
      confirmedSteps: [2],
    });

    expect(result.transition).toBe('new_cycle');
    expect(result.reentryStep).toBe(2);
    expect(result.affectedSteps).toEqual([1, 2, 3, 4]);
  });

  it('recommends derived initiative for confirmed challenge identity change without creating a cycle', () => {
    const result = assess({
      field: 'challenge_type',
      previousValue: 'crecimiento',
      nextValue: 'exploracion',
      confirmedSteps: [0, 1],
    });

    expect(result.transition).toBe('derived_initiative_recommended');
    expect(result.identityChange).toBe(true);
    expect(result.derivedInitiativeRecommended).toBe(true);
  });
});
