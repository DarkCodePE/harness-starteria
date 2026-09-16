import type { ChallengeType, InitialReview, InitialReviewOutput } from './types';

const KEYWORDS: Record<ChallengeType, string[]> = {
  correction: ['reducir', 'demora', 'error', 'friccion', 'friccion', 'proceso', 'retrabajo', 'fallo', 'lento', 'costo'],
  growth: ['ventas', 'conversion', 'adopcion', 'crecimiento', 'clientes', 'mercado', 'ingresos', 'expansion'],
  exploration: ['explorar', 'validar', 'aprender', 'nuevo mercado', 'incertidumbre', 'piloto', 'hipotesis', 'probar'],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function classify(text: string): { type: ChallengeType; confidence: number; reason: string } {
  const normalized = normalize(text);
  if (normalized.includes('nuevo mercado')) {
    return {
      type: 'exploration',
      confidence: 0.74,
      reason: 'El texto apunta a explorar un nuevo mercado y reducir incertidumbre antes de invertir mas.',
    };
  }

  const scores = Object.entries(KEYWORDS).map(([type, words]) => ({
    type: type as ChallengeType,
    score: words.filter(word => normalized.includes(normalize(word))).length,
  }));
  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score === 0) {
    return {
      type: 'exploration',
      confidence: 0.42,
      reason: 'Todavia hay incertidumbre suficiente como para tratarla como una exploracion inicial.',
    };
  }

  const type = scores[0].type;
  const confidence = Math.min(0.86, 0.58 + scores[0].score * 0.08);
  const reasonByType: Record<ChallengeType, string> = {
    correction: 'El texto muestra senales de friccion, demora, error o proceso que conviene corregir.',
    growth: 'El texto apunta a captura de valor, adopcion, clientes o crecimiento.',
    exploration: 'El texto se centra en aprender, validar o reducir incertidumbre antes de invertir mas.',
  };
  return { type, confidence, reason: reasonByType[type] };
}

function shortSentence(text: string, fallback: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  const first = clean.split(/[.!?]/).find(Boolean)?.trim() ?? clean;
  if (first.length <= 180) return first;
  const byWord = first.slice(0, 177).replace(/\s+\S*$/, '').trim();
  return `${byWord || first.slice(0, 177).trim()}...`;
}

function titleFrom(text: string, type: ChallengeType): string {
  const base = shortSentence(text, 'Iniciativa por ordenar')
    .replace(/^quiero\s+/i, '')
    .replace(/^necesito\s+/i, '')
    .replace(/^busco\s+/i, '');
  const trimmed = base.length > 72 ? base.slice(0, 69).trim() : base;
  const prefix: Record<ChallengeType, string> = {
    correction: 'Mejorar',
    growth: 'Impulsar',
    exploration: 'Explorar',
  };
  return `${prefix[type]} ${trimmed}`.replace(/\s+/g, ' ');
}

export function generateInitialReviewOutput(review: InitialReview): InitialReviewOutput {
  const combined = [review.inputText, review.contextText].filter(Boolean).join(' ');
  const classification = classify(combined);
  const summary = shortSentence(
    combined,
    'Quieres ordenar una iniciativa que aun necesita foco, contexto y criterios de avance.',
  );

  const suggestedName = titleFrom(summary, classification.type);
  const typeCopy: Record<ChallengeType, string> = {
    correction: 'corregir una friccion visible',
    growth: 'capturar una oportunidad de crecimiento',
    exploration: 'reducir incertidumbre antes de decidir',
  };

  return {
    understandingSummary: `Starteria entiende que quieres ${typeCopy[classification.type]}: ${summary}. Esto aun no valida la iniciativa; solo ordena el punto de partida.`,
    suggestedChallengeType: classification.type,
    challengeTypeReason: classification.reason,
    confidenceScore: classification.confidence,
    critique: {
      solid: 'Hay una intencion concreta y suficiente material para iniciar una conversacion de Step 0.',
      weak: 'Aun falta separar hechos observados, supuestos y decisiones que necesitas destrabar.',
      risky: 'El mayor riesgo es avanzar a solucion sin confirmar impacto, actores afectados y evidencia inicial.',
      recommendedAdjustment: 'Convertir la idea en un foco investigable con alcance, senales actuales y preguntas minimas.',
      mainRisk: 'Avanzar con una definicion demasiado amplia o basada solo en intuicion.',
    },
    strategicQuestions: [
      {
        id: 'impact-signal',
        question: 'Que senal real muestra que esto importa ahora?',
        options: ['Datos internos', 'Feedback de clientes o usuarios', 'Demoras o retrabajo visibles'],
        allowsUnknown: true,
        status: 'unanswered',
        shouldCarryToStep0: true,
      },
      {
        id: 'affected-group',
        question: 'A quien afecta primero esta iniciativa?',
        options: ['Clientes', 'Equipo interno', 'Operacion o proceso', 'Liderazgo'],
        allowsUnknown: true,
        status: 'unanswered',
        shouldCarryToStep0: true,
      },
      {
        id: 'decision-needed',
        question: 'Que decision necesitas conseguir para avanzar?',
        options: ['Investigar mas', 'Acceso a datos', 'Tiempo con usuarios', 'Sponsor o prioridad'],
        allowsUnknown: true,
        status: 'unanswered',
        shouldCarryToStep0: true,
      },
    ],
    improvedProposal: {
      suggestedName,
      proposal: `Ordenar y evaluar la iniciativa "${suggestedName}" para entender su impacto, alcance real y condiciones antes de disenar una solucion.`,
      initialFocus: summary,
      expectedImpact: 'Aclarar si vale la pena investigar, que evidencia falta y que actor debe participar en la siguiente conversacion.',
      nextRecommendedStep: 'Completar Step 0 para aterrizar contexto, alcance, actores, senales iniciales y decision buscada.',
    },
    routePreview: [
      {
        step: 0,
        name: 'Ordenar contexto',
        whatWillHappen: 'Aterrizar origen, impacto, actores, senales y decision buscada.',
        expectedOutput: 'Base inicial editable para iniciar la iniciativa con foco.',
      },
      {
        step: 1,
        name: 'Definir y validar foco',
        whatWillHappen: 'Separar hechos, supuestos y evidencia necesaria.',
        expectedOutput: 'Foco validado y preguntas de investigacion claras.',
      },
      {
        step: 2,
        name: 'Disenar apuesta y experimento',
        whatWillHappen: 'Convertir el foco en hipotesis, solucion inicial y prueba.',
        expectedOutput: 'Experimento medible con criterio de decision.',
      },
      {
        step: 3,
        name: 'Ejecutar, aprender y decidir',
        whatWillHappen: 'Probar en pequeno, capturar evidencia y aprender.',
        expectedOutput: 'Resultados, aprendizajes y recomendacion.',
      },
      {
        step: 4,
        name: 'Cerrar, alinear y proyectar siguiente paso',
        whatWillHappen: 'Preparar narrativa, evidencia y decision ejecutiva.',
        expectedOutput: 'Propuesta final clara para sponsor o comite.',
      },
    ],
  };
}
