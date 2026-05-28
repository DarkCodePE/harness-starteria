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
  'Señales actuales por confirmar',
  'Personas o áreas afectadas',
  'Decisión o apoyo necesario',
];

function compactSentence(value: string, maxLength = 150): string {
  const compacted = value.replace(/\s+/g, ' ').trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, maxLength).trim()}...`;
}

function sentenceCase(value: string) {
  const clean = value.trim();
  if (!clean) return clean;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function normalizePublicProposalTitle(value: string | undefined, fallback = 'Propuesta preliminar de iniciativa'): string {
  const raw = compactSentence(value ?? '', 120)
    .replace(/[.?!]+$/g, '')
    .trim();
  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  if (/tax\s*&\s*legal|precios de transferencia|practicante|asistente/.test(lower)) {
    return 'Organizar la carga de proyectos en Tax & Legal';
  }
  if (/aumentar ventas|producto nuevo/.test(lower)) return 'Aumentar ventas de un producto nuevo';
  if (/reducir.*tiempo.*aprobaci[oó]n|aprobaci[oó]n.*solicitudes internas/.test(lower)) {
    return 'Reducir tiempos de aprobación interna';
  }

  const withoutLead = raw
    .replace(/^(yo\s+)?(necesito saber c[oó]mo|no s[eé] c[oó]mo|quiero|necesito|busco|me gustar[ií]a|tengo que)\s+/i, '')
    .replace(/^(poder|lograr|entender c[oó]mo)\s+/i, '')
    .trim();

  const withoutReason = withoutLead.split(/\s+(porque|ya que|debido a|para que|y en consecuencia)\s+/i)[0]?.trim() || withoutLead;
  const compact = compactSentence(withoutReason, 70).replace(/[.?!]+$/g, '').trim();
  if (!compact) return fallback;
  return sentenceCase(compact);
}

function inferChallengeType(inputText: string): PublicSuggestedChallengeType {
  const text = inputText.toLowerCase();
  if (/(crecer|venta|ingreso|conversión|conversion|adopción|adopcion|cliente|mercado|producto nuevo)/i.test(text)) return 'growth';
  if (/(explorar|aprender|hipótesis|hipotesis|incertidumbre|piloto|probar|experimento|validar demanda)/i.test(text)) return 'exploration';
  return 'correction';
}

export type PublicDraftFocus =
  | 'Coordinación operativa'
  | 'Crecimiento comercial'
  | 'Mejora operativa'
  | 'Exploración por validar'
  | 'Priorización de trabajo'
  | 'Capacidad limitada'
  | 'Mejora de proceso';

export interface PublicDraftNarrative {
  title: string;
  subtitle: string;
  focus: PublicDraftFocus;
  summary: string;
  currentSituation: string;
  whyMatters: string;
  audience: string;
  hypothesis: string;
  signal: string;
  validationItems: string[];
  nextStep: string;
}

function inferFocus(inputText: string, type: PublicSuggestedChallengeType): PublicDraftFocus {
  const text = inputText.toLowerCase();
  if (/tax\s*&\s*legal|precios de transferencia|otra área|otra area/.test(text)) return 'Coordinación operativa';
  if (/sobrecarga|muchos proyectos|practicante|asistente|capacidad/.test(text)) return 'Capacidad limitada';
  if (/priorizar|prioridad|organizarme|organizar/.test(text)) return 'Priorización de trabajo';
  if (type === 'growth') return 'Crecimiento comercial';
  if (type === 'exploration') return 'Exploración por validar';
  if (/aprobaci[oó]n|seguimiento|flujo|proceso|demora/.test(text)) return 'Mejora operativa';
  return 'Mejora de proceso';
}

export function inferPublicDraftNarrative(inputText: string, output?: Partial<PublicDraftOutput>): PublicDraftNarrative {
  const type = output?.suggestedChallengeType ?? inferChallengeType(inputText);
  const focus = inferFocus(inputText, type);
  const title = normalizePublicProposalTitle(output?.proposalTitle || output?.whatToMove || inputText);
  const text = inputText.toLowerCase();

  if (/tax\s*&\s*legal|precios de transferencia|practicante|asistente/.test(text)) {
    return {
      title: 'Organizar la carga de proyectos en Tax & Legal',
      subtitle: 'Propuesta preliminar para ordenar prioridades, responsabilidades y capacidad operativa frente a una carga creciente de proyectos compartidos entre áreas.',
      focus: 'Coordinación operativa',
      summary: 'El usuario necesita ordenar cómo se gestionan múltiples proyectos en el área de Tax & Legal, especialmente cuando dependen de coordinación con Precios de Transferencia y existe capacidad limitada de apoyo operativo.',
      currentSituation: 'Hay varios proyectos avanzando en paralelo, dependencia entre áreas y una carga importante que termina concentrándose en una sola persona.',
      whyMatters: 'Si no se ordena la carga y las responsabilidades, pueden aparecer retrasos, saturación, pérdida de seguimiento y menor calidad en las entregas.',
      audience: 'Impacta al equipo de Tax & Legal, al área de Precios de Transferencia, a la practicante/asistente y a quienes dependen de la entrega de esos proyectos.',
      hypothesis: 'La principal fricción podría no ser solo la cantidad de proyectos, sino la falta de priorización, distribución clara de tareas y acuerdos operativos entre áreas.',
      signal: 'Hay demasiados proyectos simultáneos, poca capacidad de apoyo y varias tareas terminan dependiendo de una sola persona.',
      validationItems: [
        'Qué proyectos están activos y cuáles son prioritarios.',
        'Qué tareas dependen de Tax & Legal y cuáles de otra área.',
        'Qué puede asumir la practicante/asistente según experiencia.',
        'Qué tareas consumen más tiempo.',
        'Qué decisiones necesita tomar un líder o responsable del área.',
      ],
      nextStep: 'Mapear proyectos activos, responsables, fechas límite, urgencia, tareas pendientes y dependencias con otras áreas. Con eso se podrá decidir qué priorizar, qué delegar y qué necesita coordinación.',
    };
  }

  if (type === 'growth') {
    return {
      title,
      subtitle: 'Propuesta preliminar para aclarar la propuesta de valor, entender por qué los clientes no la están comprendiendo y definir señales comerciales para decidir cómo avanzar.',
      focus: 'Crecimiento comercial',
      summary: `La iniciativa busca ordenar una oportunidad comercial relacionada con ${title.charAt(0).toLowerCase()}${title.slice(1)}, sin asumir todavía cuál es la solución correcta.`,
      currentSituation: text.includes('entiendan') || text.includes('entienden')
        ? 'El producto existe, pero los clientes no parecen entender con claridad su valor o cómo aplicarlo a su contexto.'
        : 'Hay una oportunidad de crecimiento que necesita mayor claridad antes de invertir más esfuerzo comercial.',
      whyMatters: 'Si no se entiende qué frena la adopción o la compra, el equipo puede invertir en mensajes, canales o acciones que no resuelven la causa real.',
      audience: output?.impactedAudience || 'Clientes actuales o potenciales, equipo comercial y personas responsables de explicar el producto.',
      hypothesis: 'La baja venta podría estar relacionada con poca claridad de la propuesta de valor o falta de entendimiento del cliente.',
      signal: output?.initialEvidence || 'Existe una señal comercial inicial que debe revisarse con feedback de clientes, conversaciones de venta o datos de adopción.',
      validationItems: [
        'Qué parte del producto no entienden los clientes.',
        'Qué objeciones aparecen en conversaciones comerciales.',
        'Qué segmentos muestran mayor interés.',
        'Qué mensaje genera más claridad.',
        'Qué señal mínima indicaría que vale la pena avanzar.',
      ],
      nextStep: 'Revisar conversaciones comerciales recientes, objeciones frecuentes y ejemplos de clientes que sí entendieron el valor del producto.',
    };
  }

  if (/aprobaci[oó]n|solicitudes internas|seguimiento entre áreas|seguimiento entre areas/.test(text)) {
    return {
      title: 'Reducir tiempos de aprobación interna',
      subtitle: 'Propuesta preliminar para ordenar el flujo de aprobaciones, clarificar responsables y reducir pérdida de seguimiento entre áreas.',
      focus: 'Mejora operativa',
      summary: 'La iniciativa busca revisar cómo se gestionan las solicitudes internas para reducir demoras y mejorar la trazabilidad entre áreas.',
      currentSituation: 'El proceso de aprobación pierde seguimiento entre áreas, lo que puede generar tiempos muertos y falta de claridad sobre quién debe destrabar cada caso.',
      whyMatters: 'Si no se ordena el flujo, pueden mantenerse demoras, retrabajo, frustración interna y decisiones que tardan más de lo necesario.',
      audience: output?.impactedAudience || 'Equipos que solicitan aprobaciones, áreas responsables de revisarlas y líderes que necesitan visibilidad del proceso.',
      hypothesis: 'La demora podría estar relacionada con falta de responsables claros, trazabilidad limitada o puntos de espera no visibles en el proceso.',
      signal: output?.initialEvidence || 'Hay pérdida de seguimiento entre áreas y demoras visibles en el proceso de aprobación.',
      validationItems: [
        'Tiempo promedio de aprobación.',
        'Responsables por etapa.',
        'Puntos donde se pierde seguimiento.',
        'Casos más frecuentes de demora.',
        'Información mínima para aprobar o rechazar una solicitud.',
      ],
      nextStep: 'Revisar el flujo actual de aprobación, tiempos promedio, responsables y puntos donde se pierde seguimiento.',
    };
  }

  return {
    title,
    subtitle: `Propuesta preliminar para ordenar ${title.charAt(0).toLowerCase()}${title.slice(1)} y definir qué señales permiten decidir el siguiente paso.`,
    focus,
    summary: output?.whatToMove || `La iniciativa busca ordenar ${title.charAt(0).toLowerCase()}${title.slice(1)} para convertir una idea inicial en una conversación accionable.`,
    currentSituation: output?.whatToMove || 'Existe una situación inicial que necesita mayor claridad antes de decidir una solución o plan de acción.',
    whyMatters: output?.whyNow || 'Si no se aclara la situación, puede mantenerse la incertidumbre sobre prioridad, alcance e impacto.',
    audience: output?.impactedAudience || 'Personas, equipos o procesos relacionados con la situación descrita por el usuario.',
    hypothesis: 'Es posible que la oportunidad principal esté en ordenar el alcance, las señales disponibles y la primera decisión necesaria.',
    signal: output?.initialEvidence || 'La señal inicial debe confirmarse con datos, feedback o revisión del proceso.',
    validationItems: [
      'Qué está ocurriendo hoy.',
      'A quién afecta y con qué frecuencia.',
      'Qué señales muestran que el tema existe.',
      'Qué decisión permitiría avanzar.',
      'Qué información falta para priorizarlo.',
    ],
    nextStep: output?.nextRecommendedAction || 'Ordenar la información disponible y definir una primera conversación con las personas involucradas.',
  };
}

function buildQuestions(output: PublicDraftOutput): PublicQuestion[] {
  return [
    {
      id: 'initialEvidence',
      label: 'Qué te hace pensar que esto importa?',
      helper: 'Puede ser una demora, sobrecarga, retrabajo, conversación o hipótesis por validar.',
      status: output.initialEvidence ? 'answered' : 'pending',
      answer: output.initialEvidence,
    },
    {
      id: 'decisionRequested',
      label: 'Qué decisión o apoyo necesitas?',
      helper: 'Define si necesitas priorización, tiempo, datos, apoyo de otra área o autorización para avanzar.',
      status: output.decisionRequested ? 'answered' : 'pending',
      answer: output.decisionRequested,
    },
  ];
}

export function generateMockPublicDraftOutput(inputText: string): PublicDraftOutput {
  const challengeType = inferChallengeType(inputText);
  const narrative = inferPublicDraftNarrative(inputText, { suggestedChallengeType: challengeType });
  const hasEvidence = /(dato|métrica|metrica|reporte|dashboard|encuesta|entrevista|feedback|demora|sobrecarga|retrabajo|presión|presion)/i.test(inputText);
  const evidence = hasEvidence ? narrative.signal : undefined;
  const missingCriticalFields = DEFAULT_MISSING_FIELDS.filter(field => {
    if (field === 'Señales actuales por confirmar') return !evidence;
    return true;
  });

  return {
    proposalTitle: narrative.title,
    whatToMove: narrative.currentSituation,
    whyNow: narrative.whyMatters,
    impactedAudience: narrative.audience,
    initialEvidence: evidence,
    suggestedStakeholder: '',
    supportNeeded: 'Priorizar el tema, revisar información disponible y acordar apoyo con las áreas involucradas.',
    decisionRequested: 'Definir si este borrador debe convertirse en iniciativa para seguir ordenándolo en Starteria.',
    suggestedChallengeType: challengeType,
    suggestedKpiOrSignal: narrative.signal,
    missingCriticalFields,
    risks: [
      'La propuesta aún no tiene evidencia suficiente para considerarse validada.',
      'El alcance debe aclararse antes de definir una ruta de acción.',
    ],
    nextRecommendedAction: narrative.nextStep,
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
      summary: 'La propuesta ya tiene una base inicial para conversar, pero todavía necesita confirmación del usuario y señales por validar.',
      goodPoints: ['Hay una intención inicial clara.', 'Ya existe un primer borrador para revisar.'],
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
      if (field === 'Señales actuales por confirmar') return !(answers.initialEvidence ?? draft.aiOutput.initialEvidence)?.trim();
      if (field === 'Personas o áreas afectadas') return !(answers.suggestedStakeholder ?? draft.aiOutput.suggestedStakeholder)?.trim();
      if (field === 'Decisión o apoyo necesario') return !(answers.decisionRequested ?? draft.aiOutput.decisionRequested)?.trim();
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
        ? 'Completa los puntos que necesitan claridad antes de convertir el borrador.'
        : 'El borrador tiene claridad suficiente para seguir en Starteria.',
    },
  });
}

export function finishPublicDraft(draftId: string): PublicDraft | null {
  const draft = getPublicDraft(draftId);
  if (!draft || isPublicDraftExpired(draft)) return null;

  return updatePublicDraft(draftId, {
    status: 'edited',
    aiRecommendation: {
      summary: 'La propuesta quedó lista para convertirse cuando el usuario cree una cuenta o inicie sesión.',
      goodPoints: draft.aiRecommendation?.goodPoints ?? [],
      missing: draft.aiOutput.missingCriticalFields,
      nextAction: 'Crea una cuenta para guardar este borrador y seguir ordenándolo en Starteria.',
      confidenceScore: draft.aiOutput.confidenceScore,
    },
  });
}

export function discardDraft(draftId: string): PublicDraft | null {
  return discardPublicDraft(draftId);
}
