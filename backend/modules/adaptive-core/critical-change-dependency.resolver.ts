import type { CriticalChangeDependencyResult, CriticalChangeScope, StepNumber } from './adaptive-core.types';

const ALL_STEPS: StepNumber[] = [0, 1, 2, 3, 4];

const SCOPE_DEPENDENCIES: Record<CriticalChangeScope, { steps: StepNumber[]; checkpoints: string[]; outputs: string[]; rationale: string }> = {
  execution: {
    steps: [3],
    checkpoints: ['CP-3.1', 'CP-3.2', 'CP-3.4'],
    outputs: ['ExecutionReadiness', 'ExecutionLog', 'Step3Decision'],
    rationale: 'Un cambio de ejecucion normalmente afecta la preparacion, registro o decision del experimento.',
  },
  experiment: {
    steps: [2, 3],
    checkpoints: ['CP-2.4', 'CP-3.1', 'CP-3.2', 'CP-3.3'],
    outputs: ['ExecutionDesign', 'ExperimentCard', 'ExecutionReadiness', 'ExperimentResultAnalysis'],
    rationale: 'Un cambio de experimento puede tocar el diseno y la ejecucion.',
  },
  solution: {
    steps: [2, 3, 4],
    checkpoints: ['CP-2.1', 'CP-2.3', 'CP-2.4', 'CP-3.1', 'CP-4.2'],
    outputs: ['SelectedBet', 'ExecutionDesign', 'PilotCard', 'ExperimentCard', 'DecisionPackage'],
    rationale: 'Un cambio de solucion puede afectar la apuesta, su prueba y la narrativa de decision.',
  },
  hypothesis: {
    steps: [1, 2, 3, 4],
    checkpoints: ['CP-1.1', 'CP-1.2', 'CP-1.4', 'CP-2.1', 'CP-3.3', 'CP-4.2'],
    outputs: ['ValidationFocus', 'EvidencePlan', 'Step1FocusDecision', 'DesignCriteria', 'ExperimentResultAnalysis'],
    rationale: 'Un cambio de hipotesis puede afectar foco, evidencia, diseno y lectura de resultados.',
  },
  focus: {
    steps: [1, 2, 3, 4],
    checkpoints: ['CP-1.1', 'CP-1.4', 'CP-2.1', 'CP-2.3', 'CP-3.3', 'CP-4.2'],
    outputs: ['ValidationFocus', 'Step1FocusDecision', 'DesignCriteria', 'SelectedBet'],
    rationale: 'Un cambio de foco puede afectar desde la decision de investigacion hacia adelante.',
  },
  challenge: {
    steps: ALL_STEPS,
    checkpoints: ['CP-0.1', 'CP-0.3', 'CP-1.1', 'CP-2.1', 'CP-3.4', 'CP-4.4'],
    outputs: ['Step0AlignmentBrief', 'ValidationContract', 'ValidationFocus', 'DecisionPackage'],
    rationale: 'Un cambio de reto puede alterar la identidad de la iniciativa y exige revision de identidad.',
  },
};

export function mapLegacyCriticalChangeField(field: string): CriticalChangeScope {
  if (field === 'selected_bet') return 'solution';
  if (field === 'hypothesis') return 'hypothesis';
  if (field === 'scope') return 'focus';
  if (field === 'challenge_type') return 'challenge';
  if (field === 'target_date') return 'execution';

  // Campos contextuales: el dato puede afectar framing, ejecucion o ruta, pero no hay
  // evidencia suficiente en el payload legacy para elevarlo automaticamente.
  if (field === 'critical_restriction') return 'execution';
  if (field === 'company_or_area') return 'focus';
  if (field === 'route') return 'focus';

  return 'execution';
}

export class CriticalChangeDependencyResolver {
  resolve(input: { changeScope: CriticalChangeScope; field?: string | null }): CriticalChangeDependencyResult {
    const base = SCOPE_DEPENDENCIES[input.changeScope];
    const rationale = [base.rationale];
    let steps = [...base.steps];
    let checkpoints = [...base.checkpoints];
    let outputs = [...base.outputs];

    if (input.field === 'target_date') {
      steps = [3];
      checkpoints = ['CP-3.1', 'CP-3.2'];
      outputs = ['ExecutionReadiness', 'ExecutionLog'];
      rationale.push('target_date se trata como cambio operativo por defecto; no invalida contrato confirmado por si mismo.');
    }

    if (input.field === 'critical_restriction') {
      steps = [2, 3];
      checkpoints = ['CP-2.4', 'CP-3.1'];
      outputs = ['ExecutionDesign', 'ExecutionReadiness'];
      rationale.push('critical_restriction se mapea de forma conservadora a diseno/ejecucion salvo evidencia adicional.');
    }

    if (input.field === 'company_or_area' || input.field === 'route') {
      rationale.push(`${input.field} es contextual; el resolver solo marca dependencias potenciales y deja la invalidacion al impact resolver.`);
    }

    return {
      changeScope: input.changeScope,
      field: input.field ?? null,
      potentiallyAffectedSteps: uniqueSteps(steps),
      potentiallyAffectedCheckpoints: uniqueStrings(checkpoints),
      potentiallyAffectedOutputIds: uniqueStrings(outputs),
      invalidatedSteps: [],
      rationale,
    };
  }
}

function uniqueSteps(values: StepNumber[]): StepNumber[] {
  return [...new Set(values)].sort((a, b) => a - b) as StepNumber[];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
