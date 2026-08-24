import type { ChangeImpactResult, CriticalChangeUserOutcome, StepNumber } from './adaptive-core.types';

const STEP_NUMBERS: StepNumber[] = [0, 1, 2, 3, 4];

export function buildCriticalChangeUserOutcome(impact: ChangeImpactResult): CriticalChangeUserOutcome {
  if (impact.transition === 'derived_initiative_recommended') {
    return {
      headline: 'Este cambio parece modificar elementos centrales de la iniciativa.',
      message: 'Conviene revisar si sigue siendo la misma iniciativa o si debe tratarse como una iniciativa derivada.',
      preservedSteps: impact.inheritedSteps,
      reviewSteps: impact.reopenedSteps,
      downstreamSteps: downstreamFrom(impact.reentryStep),
      recommendedAction: 'create_derived_initiative',
      recommendedStep: impact.reentryStep,
    };
  }

  if (impact.transition === 'new_cycle') {
    const step = impact.reentryStep;
    return {
      headline: step === 2
        ? 'Tu contexto y foco siguen siendo validos. Necesitas revisar la solucion desde Step 2.'
        : 'El cambio afecta una decision ya confirmada y requiere revisar la ruta.',
      message: step == null
        ? 'La evaluacion detecto materialidad, pero no encontro un step confirmado para reingreso.'
        : `Se conserva lo anterior valido y se recomienda retomar desde Step ${step}.`,
      preservedSteps: impact.inheritedSteps,
      reviewSteps: impact.reopenedSteps,
      downstreamSteps: downstreamFrom(step),
      recommendedAction: 'resume_from_step',
      recommendedStep: step,
    };
  }

  if (impact.transition === 'return_to_prior_direction') {
    return {
      headline: 'Retomar una direccion anterior',
      message: 'Crearemos una nueva iteracion basada en una direccion anterior. El aprendizaje de las iteraciones posteriores se conservara.',
      preservedSteps: impact.inheritedSteps,
      reviewSteps: impact.reopenedSteps,
      downstreamSteps: downstreamFrom(impact.reentryStep),
      recommendedAction: 'return_to_prior_direction',
      recommendedStep: impact.reentryStep,
    };
  }

  return {
    headline: 'Este cambio no modifica la direccion de la iniciativa.',
    message: 'Puedes continuar en la iteracion actual y revisar solo los puntos operativos afectados.',
    preservedSteps: STEP_NUMBERS.filter((step) => !impact.affectedSteps.includes(step)),
    reviewSteps: impact.affectedSteps,
    downstreamSteps: [],
    recommendedAction: 'continue_current_iteration',
    recommendedStep: impact.reentryStep,
  };
}

function downstreamFrom(step: StepNumber | null): StepNumber[] {
  if (step == null) return [];
  return STEP_NUMBERS.filter((item) => item > step);
}
