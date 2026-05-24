import { PUBLIC_DRAFT_EXPIRATION_HOURS } from '../domain/rules';
import type {
  PublicDraft,
  PublicDraftOutput,
  PublicQuestion,
  PublicSuggestedChallengeType,
} from '../domain/types';
import {
  createPublicDraftId,
  discardPublicDraft,
  getAnonymousSessionId,
  getPublicDraft,
  isPublicDraftExpired,
  savePublicDraft,
  updatePublicDraft,
} from './publicDraftStorage';

const DEFAULT_MISSING_FIELDS = [
  'Evidencia inicial',
  'Persona o area que debe escuchar la propuesta',
  'Decision puntual que necesitas',
];

function compactSentence(value: string, maxLength = 150): string {
  const compacted = value.replace(/\s+/g, ' ').trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, maxLength).trim()}...`;
}

function inferChallengeType(inputText: string): PublicSuggestedChallengeType {
  const text = inputText.toLowerCase();
  if (/(crecer|venta|ingreso|conversion|conversión|adopcion|adopción|cliente|mercado)/i.test(text)) {
    return 'growth';
  }
  if (/(explorar|aprender|hipotesis|hipótesis|incertidumbre|piloto|probar|experimento)/i.test(text)) {
    return 'exploration';
  }
  return 'correction';
}

function titleFromInput(inputText: string, challengeType: PublicSuggestedChallengeType): string {
  const cleaned = compactSentence(inputText, 70)
    .replace(/[.?!]+$/g, '')
    .trim();

  if (!cleaned) return 'Propuesta de iniciativa';
  if (cleaned.length <= 52) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  const prefix = challengeType === 'growth'
    ? 'Oportunidad para'
    : challengeType === 'exploration'
      ? 'Exploracion sobre'
      : 'Mejora para';

  return `${prefix} ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
}

function inferAudience(inputText: string): string {
  const text = inputText.toLowerCase();
  if (/(cliente|usuario|comprador|consumidor)/i.test(text)) return 'Clientes o usuarios afectados';
  if (/(equipo|colaborador|empleado|lider|líder|operacion|operación)/i.test(text)) return 'Equipo interno afectado';
  if (/(sponsor|gerencia|direccion|dirección|comite|comité)/i.test(text)) return 'Lideres que deben decidir';
  return 'Personas afectadas por la friccion u oportunidad descrita';
}

function inferSignal(inputText: string, challengeType: PublicSuggestedChallengeType): string {
  const text = inputText.toLowerCase();
  if (/(tiempo|demora|dias|días|horas)/i.test(text)) return 'Reduccion de tiempo o demora visible';
  if (/(costo|gasto|ahorro)/i.test(text)) return 'Reduccion de costo o esfuerzo operativo';
  if (/(conversion|conversión|venta|ingreso)/i.test(text)) return 'Mejora en conversion, adopcion o ingreso';
  if (challengeType === 'exploration') return 'Aprendizaje suficiente para decidir si avanzar';
  return 'Senal observable de mejora en el proceso afectado';
}

function inferEvidence(inputText: string): string | undefined {
  if (/(dato|metrica|métrica|reporte|dashboard|encuesta|entrevista|feedback)/i.test(inputText)) {
    return 'El texto menciona senales iniciales que deben confirmarse y documentarse en Step 0.';
  }
  return undefined;
}

function buildQuestions(output: PublicDraftOutput): PublicQuestion[] {
  return [
    {
      id: 'initialEvidence',
      label: 'Que evidencia o senal inicial tienes hoy?',
      helper: 'Puede ser un dato, testimonio, reporte, friccion repetida o hipotesis por validar.',
      status: output.initialEvidence ? 'answered' : 'pending',
      answer: output.initialEvidence,
    },
    {
      id: 'suggestedStakeholder',
      label: 'Quien deberia escuchar primero esta propuesta?',
      helper: 'Piensa en sponsor, lider de area, owner del proceso o persona que puede destrabar el siguiente paso.',
      status: output.suggestedStakeholder ? 'answered' : 'pending',
      answer: output.suggestedStakeholder,
    },
    {
      id: 'decisionRequested',
      label: 'Que decision necesitas para seguir?',
      helper: 'Define si buscas permiso para explorar, acceso a datos, sponsor, equipo o tiempo para validar.',
      status: output.decisionRequested ? 'answered' : 'pending',
      answer: output.decisionRequested,
    },
  ];
}

export function generateMockPublicDraftOutput(inputText: string): PublicDraftOutput {
  const challengeType = inferChallengeType(inputText);
  const title = titleFromInput(inputText, challengeType);
  const signal = inferSignal(inputText, challengeType);
  const evidence = inferEvidence(inputText);
  const missingCriticalFields = DEFAULT_MISSING_FIELDS.filter(field => {
    if (field === 'Evidencia inicial') return !evidence;
    return true;
  });

  return {
    proposalTitle: title,
    whatToMove: compactSentence(inputText) || 'Aterrizar una propuesta inicial de iniciativa.',
    whyNow:
      challengeType === 'growth'
        ? 'Conviene revisarla ahora porque puede abrir una oportunidad de crecimiento o adopcion que aun no esta capturada.'
        : challengeType === 'exploration'
          ? 'Conviene revisarla ahora porque reduce incertidumbre antes de comprometer recursos mayores.'
          : 'Conviene revisarla ahora porque la friccion descrita puede seguir generando retrabajo, demora o perdida de foco.',
    impactedAudience: inferAudience(inputText),
    initialEvidence: evidence,
    suggestedStakeholder: '',
    supportNeeded: 'Tiempo breve para revisar la propuesta, confirmar alcance y acceder a informacion inicial.',
    decisionRequested: 'Validar si vale la pena continuar en Step 0 con una cuenta creada.',
    suggestedChallengeType: challengeType,
    suggestedKpiOrSignal: signal,
    missingCriticalFields,
    risks: [
      'La propuesta aun no tiene evidencia suficiente para considerarse validada.',
      'El alcance puede ser demasiado amplio si no se define una primera senal observable.',
    ],
    nextRecommendedAction: 'Revisa el borrador, completa los campos criticos y crea una cuenta para continuar en Step 0.',
    confidenceScore: Math.min(0.84, Math.max(0.45, inputText.trim().length / 280)),
  };
}

export function createPublicDraftFromInput(inputText: string): PublicDraft {
  const now = new Date();
  const output = generateMockPublicDraftOutput(inputText);
  const draft: PublicDraft = {
    id: createPublicDraftId(),
    anonymousSessionId: getAnonymousSessionId(),
    mode: 'initiative',
    inputText: inputText.trim(),
    sourceType: 'text',
    aiOutput: output,
    status: 'created',
    questions: buildQuestions(output),
    aiRecommendation: {
      summary: 'La propuesta ya tiene una base inicial para conversar, pero todavia necesita evidencia y decision solicitada.',
      goodPoints: ['Hay una intencion inicial clara.', 'Ya se puede inferir una primera senal a observar.'],
      missing: output.missingCriticalFields,
      nextAction: output.nextRecommendedAction,
      confidenceScore: output.confidenceScore,
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PUBLIC_DRAFT_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString(),
  };

  return savePublicDraft(draft);
}

export function updatePublicDraftAnswers(draftId: string, answers: Record<string, string>): PublicDraft | null {
  const draft = getPublicDraft(draftId);
  if (!draft || isPublicDraftExpired(draft)) return null;

  const nextQuestions = (draft.questions ?? []).map(question => {
    const answer = answers[question.id] ?? question.answer ?? '';
    return {
      ...question,
      answer,
      status: answer.trim() ? 'answered' : question.status,
    };
  });

  const aiOutput: PublicDraftOutput = {
    ...draft.aiOutput,
    initialEvidence: answers.initialEvidence ?? draft.aiOutput.initialEvidence,
    suggestedStakeholder: answers.suggestedStakeholder ?? draft.aiOutput.suggestedStakeholder,
    decisionRequested: answers.decisionRequested ?? draft.aiOutput.decisionRequested,
    supportNeeded: answers.supportNeeded ?? draft.aiOutput.supportNeeded,
    missingCriticalFields: draft.aiOutput.missingCriticalFields.filter(field => {
      if (field === 'Evidencia inicial') return !(answers.initialEvidence ?? draft.aiOutput.initialEvidence)?.trim();
      if (field === 'Persona o area que debe escuchar la propuesta') {
        return !(answers.suggestedStakeholder ?? draft.aiOutput.suggestedStakeholder)?.trim();
      }
      if (field === 'Decision puntual que necesitas') {
        return !(answers.decisionRequested ?? draft.aiOutput.decisionRequested)?.trim();
      }
      return true;
    }),
  };

  return updatePublicDraft(draftId, {
    aiOutput,
    questions: nextQuestions,
    status: 'edited',
    aiRecommendation: {
      ...draft.aiRecommendation,
      missing: aiOutput.missingCriticalFields,
      nextAction: aiOutput.missingCriticalFields.length > 0
        ? 'Completa los campos criticos antes de continuar a Step 0.'
        : 'La propuesta esta lista para guardarse y continuar en Step 0.',
    },
  });
}

export function finishPublicDraft(draftId: string): PublicDraft | null {
  const draft = getPublicDraft(draftId);
  if (!draft || isPublicDraftExpired(draft)) return null;

  return updatePublicDraft(draftId, {
    status: 'edited',
    aiRecommendation: {
      summary: 'La propuesta quedo lista para convertirse cuando el usuario cree una cuenta o inicie sesion.',
      goodPoints: draft.aiRecommendation?.goodPoints ?? [],
      missing: draft.aiOutput.missingCriticalFields,
      nextAction: 'Crea una cuenta para guardar esta propuesta y continuar en Step 0.',
      confidenceScore: draft.aiOutput.confidenceScore,
    },
  });
}

export function discardDraft(draftId: string): PublicDraft | null {
  return discardPublicDraft(draftId);
}
