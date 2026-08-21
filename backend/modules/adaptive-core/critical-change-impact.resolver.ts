import type {
  ChangeImpactResult,
  CriticalChangeCandidate,
  CriticalChangeDependencyResult,
  StepNumber,
} from './adaptive-core.types';

const STEP_NUMBERS: StepNumber[] = [0, 1, 2, 3, 4];

type StepStateRow = {
  stepNumber: number;
  state: string;
};

type StepOutputRow = {
  id: string;
  stepNumber: number;
  status: string;
  outputKey?: string | null;
};

export class CriticalChangeImpactResolver {
  resolve(input: {
    change: CriticalChangeCandidate;
    sourceCycle: { id: string; currentStep?: number | null };
    dependency: CriticalChangeDependencyResult;
    stepStates: StepStateRow[];
    stepOutputs: StepOutputRow[];
  }): ChangeImpactResult {
    const affectedSteps = input.dependency.potentiallyAffectedSteps;
    const affectedConfirmedSteps = affectedSteps.filter((step) => this.isConfirmedContractStep(step, input.stepStates, input.stepOutputs));
    const confirmedContractAffected = affectedConfirmedSteps.length > 0;
    const valueChanged = !stableEqual(input.change.previousValue, input.change.nextValue);
    const identityChange = input.change.changeScope === 'challenge' && confirmedContractAffected && valueChanged;
    const derivedInitiativeRecommended = identityChange;

    let materialChange = false;
    let transition: ChangeImpactResult['transition'] = 'same_cycle';
    let reentryStep: StepNumber | null = null;
    const rationale = [...input.dependency.rationale];

    if (input.change.requestedTransition === 'return_to_prior_direction') {
      materialChange = true;
      transition = 'return_to_prior_direction';
      reentryStep = input.change.requestedReentryStep ?? affectedConfirmedSteps[0] ?? input.dependency.potentiallyAffectedSteps[0] ?? null;
      rationale.push('El usuario pidio retomar una direccion anterior; se requiere ciclo historico explicito y nuevo ciclo, no rollback.');
    } else if (!confirmedContractAffected) {
      rationale.push('El cambio toca trabajo en borrador o no confirmado; se mantiene en el mismo ciclo.');
    } else if (input.change.field === 'target_date') {
      rationale.push('La fecha objetivo es operativa por defecto; no crea ciclo aunque toque ejecucion confirmada.');
    } else if (!valueChanged) {
      rationale.push('No hay diferencia estable entre el valor anterior y el nuevo.');
    } else if (identityChange) {
      materialChange = true;
      transition = 'derived_initiative_recommended';
      reentryStep = affectedConfirmedSteps[0] ?? null;
      rationale.push('El cambio modifica elementos centrales del reto; se recomienda evaluar una iniciativa derivada.');
    } else {
      materialChange = true;
      transition = 'new_cycle';
      reentryStep = affectedConfirmedSteps[0] ?? null;
      rationale.push('El cambio afecta un contrato confirmado y cambia el valor de forma material; se recomienda un nuevo ciclo.');
    }

    const earliestAffectedStep = affectedSteps[0] ?? null;
    const reviewFrom = reentryStep ?? earliestAffectedStep;

    return {
      assessmentVersion: 1,
      sourceCycleId: input.sourceCycle.id,
      changeScope: input.change.changeScope,
      affectedSteps,
      affectedCheckpoints: input.dependency.potentiallyAffectedCheckpoints,
      affectedOutputIds: input.dependency.potentiallyAffectedOutputIds,
      earliestAffectedStep,
      confirmedContractAffected,
      materialChange,
      transition,
      reentryStep,
      basedOnCycleId: input.change.basedOnCycleId ?? null,
      inheritedSteps: reentryStep == null ? [] : STEP_NUMBERS.filter((step) => step < reentryStep && this.isValidPreservedStep(step, input.stepStates)),
      reopenedSteps: reentryStep == null ? [] : affectedSteps.filter((step) => step >= reentryStep),
      pendingSteps: reviewFrom == null ? [] : STEP_NUMBERS.filter((step) => step > reviewFrom && !affectedSteps.includes(step)),
      historicalOnlySteps: [],
      identityChange,
      derivedInitiativeRecommended,
      rationale,
    };
  }

  private isConfirmedContractStep(step: StepNumber, states: StepStateRow[], outputs: StepOutputRow[]): boolean {
    const state = states.find((item) => item.stepNumber === step)?.state;
    return state === 'confirmed' || outputs.some((output) => output.stepNumber === step && output.status === 'confirmed');
  }

  private isValidPreservedStep(step: StepNumber, states: StepStateRow[]): boolean {
    const state = states.find((item) => item.stepNumber === step)?.state;
    return state === 'confirmed' || state === 'inherited';
  }
}

export function stableEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}
