import type {
  Project,
  Step0AdditionalStakeholders,
  Step0ClarityLevel,
  Step0ContributionType,
  Step0Data,
  Step0EvidenceType,
  Step0Frame,
  Step0Mode,
  Step0PrimaryObjective,
} from '../context/AppContext';
import type { Challenge, StrategicFront } from '../portfolio/PortfolioLeadContext';
import { activationLabel, challengeTypeLabel } from '../portfolio/portfolioLeadCopy';

export interface Step0Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export interface InheritedChallengeContextItem {
  label: string;
  value: string;
}

export interface InheritedChallengeContext {
  mode: Step0Mode;
  challenge: Challenge | null;
  front: StrategicFront | null;
  items: InheritedChallengeContextItem[];
}

export const FRAME_OPTIONS: Step0Option<Exclude<Step0Frame, ''>>[] = [
  { value: 'correccion', label: 'Quiero corregir una fricción o problema' },
  { value: 'crecimiento', label: 'Quiero capturar una oportunidad' },
  { value: 'exploracion', label: 'Quiero explorar una apuesta o reducir incertidumbre' },
  { value: 'mejora_proceso', label: 'Quiero mejorar un proceso existente' },
];

export const CLARITY_OPTIONS: Step0Option<Exclude<Step0ClarityLevel, ''>>[] = [
  { value: 'observacion_inicial', label: 'Solo tengo una observación inicial' },
  { value: 'algunas_senales', label: 'Tengo señales, pero falta ordenarlas' },
  { value: 'hipotesis_clara', label: 'Tengo una hipótesis clara' },
  { value: 'idea_pensada', label: 'Ya tengo una solución pensada' },
  { value: 'decision_por_destrabar', label: 'Tengo una decisión que necesito destrabar' },
];

export const PRIMARY_OBJECTIVE_OPTIONS: Step0Option<Exclude<Step0PrimaryObjective, ''>>[] = [
  { value: 'eficiencia', label: 'Eficiencia, tiempos o costos' },
  { value: 'experiencia_cliente', label: 'Experiencia del cliente' },
  { value: 'ingresos', label: 'Ingresos, crecimiento o adopción' },
  { value: 'riesgo', label: 'Riesgo o cumplimiento' },
  { value: 'productividad', label: 'Productividad interna' },
  { value: 'aprendizaje', label: 'Aprendizaje para decidir' },
  { value: 'otro', label: 'Otro' },
];

export const CONTRIBUTION_OPTIONS: Step0Option<Exclude<Step0ContributionType, ''>>[] = [
  { value: 'descubrir_problema', label: 'Descubrir mejor el problema o la oportunidad' },
  { value: 'validar_hipotesis', label: 'Validar una hipotesis relevante' },
  { value: 'resolver_parte', label: 'Resolver una parte del reto' },
  { value: 'resolver_directo', label: 'Resolver de forma directa una necesidad concreta' },
  { value: 'no_claro', label: 'Aun no lo tengo claro' },
];

export const ADDITIONAL_STAKEHOLDER_OPTIONS: Step0Option<Exclude<Step0AdditionalStakeholders, ''>>[] = [
  { value: 'no', label: 'No, con ellos es suficiente por ahora' },
  { value: 'si', label: 'Si, conviene involucrar a otra persona o equipo' },
  { value: 'no_claro', label: 'Aun no lo tengo claro' },
];

export const EVIDENCE_TYPE_OPTIONS: Step0Option<Exclude<Step0EvidenceType, ''>>[] = [
  { value: 'datos', label: 'Datos internos' },
  { value: 'feedback_clientes', label: 'Feedback de clientes' },
  { value: 'feedback_equipo', label: 'Feedback del equipo' },
  { value: 'reclamos_tickets', label: 'Reclamos o tickets' },
  { value: 'demoras', label: 'Demoras observadas' },
  { value: 'retrabajo', label: 'Retrabajo visible' },
  { value: 'benchmark', label: 'Comparación externa' },
  { value: 'hipotesis', label: 'Aún es una hipótesis' },
  { value: 'sin_senales', label: 'No tengo señales claras todavía' },
  { value: 'otro', label: 'Otro' },
];

export const FRAME_COPY: Record<Exclude<Step0Frame, ''>, { noun: string; action: string; helper: string }> = {
  correccion: {
    noun: 'problema',
    action: 'corregir',
    helper: 'Describe la fricción concreta, dónde se rompe hoy y por qué vale la pena investigarla.',
  },
  crecimiento: {
    noun: 'oportunidad',
    action: 'capturar',
    helper: 'Describe la oportunidad visible, la ventana que se abre y por qué conviene investigarla ahora.',
  },
  exploracion: {
    noun: 'apuesta',
    action: 'explorar',
    helper: 'Describe la incertidumbre o apuesta, qué estás viendo y qué necesitas aprender antes de comprometerte.',
  },
  mejora_proceso: {
    noun: 'proceso',
    action: 'mejorar',
    helper: 'Describe el proceso actual, qué podría mejorar y por qué vale la pena revisarlo.',
  },
};

export const OBJECTIVE_COPY: Record<Exclude<Step0PrimaryObjective, ''>, { helper: string; consequence: string }> = {
  eficiencia: {
    helper: 'Ayuda a conectar la iniciativa con tiempos, costos, capacidad o retrabajo.',
    consequence: 'Explica qué ineficiencia, tiempo o costo seguiría creciendo si esto no se mueve pronto.',
  },
  experiencia_cliente: {
    helper: 'Ayuda a conectar la iniciativa con fricciones del cliente, calidad de servicio o experiencia percibida.',
    consequence: 'Explica cómo se seguiría deteriorando la experiencia o relación con el cliente si se deja igual.',
  },
  ingresos: {
    helper: 'Ayuda a vincular la iniciativa con crecimiento, conversión, adopción o captura de valor.',
    consequence: 'Explica qué oportunidad comercial o de adopción se seguiría perdiendo.',
  },
  riesgo: {
    helper: 'Ayuda a enfocar riesgo operativo, regulatorio, reputacional o de cumplimiento.',
    consequence: 'Explica qué riesgo seguiría abierto o podría escalar si no se atiende.',
  },
  productividad: {
    helper: 'Ayuda a aterrizar productividad, carga operativa, coordinación o dinámica interna.',
    consequence: 'Explica qué sobrecarga, retrabajo o desgaste seguiría afectando al equipo.',
  },
  aprendizaje: {
    helper: 'Ayuda a justificar por qué aprender ahora vale más que esperar certeza perfecta.',
    consequence: 'Explica qué decisión seguiría postergada o qué incertidumbre seguiría abierta.',
  },
  otro: {
    helper: 'Ayuda a explicar con tus palabras qué objetivo principal buscas mover.',
    consequence: 'Explica cuál sería la consecuencia principal de no hacer nada.',
  },
};

export function getStep0Mode(project: Project): Step0Mode {
  return project.challengeLink?.challengeId ? 'linked_to_challenge' : 'independent';
}

export function buildInheritedChallengeContext(
  project: Project,
  challenges: Challenge[],
  fronts: StrategicFront[],
): InheritedChallengeContext {
  const mode = getStep0Mode(project);
  if (mode === 'independent') {
    return { mode, challenge: null, front: null, items: [] };
  }

  const challenge = challenges.find(item => item.id === project.challengeLink?.challengeId) ?? null;
  const front = challenge ? fronts.find(item => item.id === challenge.strategicFrontId) ?? null : null;
  const items: InheritedChallengeContextItem[] = [];

  if (front?.name) items.push({ label: 'Frente estrategico', value: front.name });
  if (challenge?.name) items.push({ label: 'Nombre del reto', value: challenge.name });
  if (challenge?.challengeType) items.push({ label: 'Tipo de reto', value: challengeTypeLabel(challenge.challengeType) });
  if (front?.strategicObjective) items.push({ label: 'Objetivo estrategico del frente', value: front.strategicObjective });
  if (challenge?.successCriteria) items.push({ label: 'KPI o criterio del reto', value: challenge.successCriteria });
  else if (front?.mainKpi) items.push({ label: 'KPI principal asociado', value: front.mainKpi });
  if (front?.sponsor) items.push({ label: 'Sponsor definido', value: front.sponsor });
  if (challenge?.challengeOwner) items.push({ label: 'Owner del reto', value: challenge.challengeOwner });
  if (challenge?.activationMode) items.push({ label: 'Modalidad del reto', value: activationLabel(challenge.activationMode) });

  return { mode, challenge, front, items };
}

export function legacyOriginFrom(frame: Step0Frame, clarity: Step0ClarityLevel): Step0Data['origen'] {
  if (clarity === 'idea_pensada') return 'idea';
  if (frame === 'correccion') return 'problema';
  if (frame === 'crecimiento') return 'oportunidad';
  if (frame === 'exploracion') return 'explorando';
  if (frame === 'mejora_proceso') return 'problema';
  return '';
}

export function legacyImpactFromObjective(objective: Step0PrimaryObjective): Step0Data['impacto3meses'] {
  switch (objective) {
    case 'eficiencia':
      return 'costos';
    case 'experiencia_cliente':
      return 'cliente';
    case 'ingresos':
      return 'ingresos';
    case 'riesgo':
      return 'riesgo';
    case 'productividad':
      return 'productividad';
    case 'aprendizaje':
      return 'no_claro';
    case 'otro':
      return 'otro';
    default:
      return '';
  }
}

export function normalizeStep0Data(input: Partial<Step0Data> | undefined, project: Project, userName: string, userEmail: string): Step0Data {
  const raw = (input ?? {}) as Partial<Step0Data> & {
    suggestedName?: string;
    challengeType?: string;
    contextInitial?: string;
    initialFocus?: string;
    expectedImpact?: string;
    mainRisk?: string;
    nextRecommendedStep?: string;
    pendingQuestions?: unknown[];
  };
  const frameFromInitialReview =
    raw.challengeType === 'correction' ? 'correccion'
      : raw.challengeType === 'growth' ? 'crecimiento'
        : raw.challengeType === 'exploration' ? 'exploracion'
          : undefined;
  const mode = input?.mode ?? getStep0Mode(project);
  const initiativeFrame = input?.initiativeFrame
    ?? frameFromInitialReview
    ?? (input?.origen === 'problema'
      ? 'correccion'
      : input?.origen === 'oportunidad'
        ? 'crecimiento'
        : input?.origen === 'explorando'
          ? 'exploracion'
          : '');
  const clarityLevel = input?.clarityLevel
    ?? (input?.origen === 'idea' ? 'idea_pensada' : '');
  const primaryObjective = input?.primaryObjective
    ?? (input?.impacto3meses === 'costos'
      ? 'eficiencia'
      : input?.impacto3meses === 'cliente'
        ? 'experiencia_cliente'
        : input?.impacto3meses === 'ingresos'
          ? 'ingresos'
          : input?.impacto3meses === 'riesgo'
            ? 'riesgo'
            : input?.impacto3meses === 'productividad'
              ? 'productividad'
              : input?.impacto3meses === 'no_claro'
                ? 'aprendizaje'
                : input?.impacto3meses === 'otro'
                  ? 'otro'
                  : '');
  const evidenceType = input?.evidenceType ?? input?.respaldo ?? '';
  const initiativeTitle = input?.initiativeTitle ?? raw.suggestedName ?? project.name;
  const currentEvidence = input?.currentEvidence ?? raw.mainRisk ?? '';
  const supportNeeded = input?.supportNeeded ?? (input?.siMinimo?.join(', ') ?? '');
  const pendingQuestions = Array.isArray(raw.pendingQuestions)
    ? raw.pendingQuestions
        .map(question => typeof question === 'string'
          ? question
          : typeof question === 'object' && question !== null
            ? String((question as { question?: unknown; text?: unknown; title?: unknown }).question
              ?? (question as { text?: unknown }).text
              ?? (question as { title?: unknown }).title
              ?? '')
            : '')
        .filter(Boolean)
    : [];

  return {
    nombreParticipante: input?.nombreParticipante ?? userName,
    rolArea: input?.rolArea ?? '',
    origen: input?.origen ?? legacyOriginFrom(initiativeFrame, clarityLevel),
    quePasaQueQuieres: input?.quePasaQueQuieres ?? raw.initialFocus ?? raw.contextInitial ?? '',
    impacta: input?.impacta ?? [],
    parteProceso: input?.parteProceso ?? '',
    impacto3meses: input?.impacto3meses ?? legacyImpactFromObjective(primaryObjective),
    respaldo: input?.respaldo ?? evidenceType,
    quienEscuchar: input?.quienEscuchar ?? '',
    siMinimo: input?.siMinimo ?? [],
    mode,
    initiativeTitle,
    initiativeFrame,
    clarityLevel,
    primaryObjective,
    specificChallengePart: input?.specificChallengePart ?? '',
    challengeGoalConnection: input?.challengeGoalConnection ?? '',
    linkedContributionType: input?.linkedContributionType ?? '',
    impactWho: input?.impactWho ?? raw.expectedImpact ?? (input?.impacta?.join(', ') ?? ''),
    visibleMoment: input?.visibleMoment ?? '',
    whyNowText: input?.whyNowText ?? raw.contextInitial ?? '',
    ifNotNowConsequence: input?.ifNotNowConsequence ?? '',
    evidenceType,
    currentEvidence,
    validationSignal: input?.validationSignal ?? raw.nextRecommendedStep ?? (pendingQuestions[0] ?? ''),
    sponsorInterestReason: input?.sponsorInterestReason ?? '',
    supportNeeded,
    decisionRequested: input?.decisionRequested ?? '',
    deliveryEmail: input?.deliveryEmail ?? userEmail,
    additionalStakeholders: input?.additionalStakeholders ?? '',
    additionalStakeholdersDetail: input?.additionalStakeholdersDetail ?? '',
    alignmentStatus: input?.alignmentStatus,
    alignmentPerson: input?.alignmentPerson ?? '',
    alignmentRoleArea: input?.alignmentRoleArea ?? '',
    alignmentDate: input?.alignmentDate ?? '',
    alignmentFeedback: input?.alignmentFeedback ?? '',
    alignmentInitialDecision: input?.alignmentInitialDecision ?? '',
    alignmentEvidenceType: input?.alignmentEvidenceType ?? '',
    alignmentEvidenceNote: input?.alignmentEvidenceNote ?? '',
    alignmentAdvancedPending: input?.alignmentAdvancedPending ?? false,
    leaderFeedbackStatus: input?.leaderFeedbackStatus ?? (
      input?.alignmentStatus === 'scheduled'
        ? 'meeting_scheduled'
        : input?.alignmentStatus === 'feedback_received'
          ? 'feedback_received'
          : input?.alignmentStatus === 'aligned'
            ? 'approved_to_investigate'
            : input?.alignmentStatus === 'aligned_with_observations'
              ? 'aligned_with_conditions'
              : input?.alignmentStatus === 'not_aligned'
                ? 'not_prioritized'
                : input?.alignmentStatus === 'unknown'
                  ? 'pending'
                  : undefined
    ),
    leaderFeedbackPerson: input?.leaderFeedbackPerson ?? input?.alignmentPerson ?? '',
    leaderFeedbackRoleArea: input?.leaderFeedbackRoleArea ?? input?.alignmentRoleArea ?? '',
    leaderFeedbackDate: input?.leaderFeedbackDate ?? input?.alignmentDate ?? '',
    leaderFeedbackComment: input?.leaderFeedbackComment ?? input?.alignmentFeedback ?? '',
    leaderFeedbackInitialDecision: input?.leaderFeedbackInitialDecision ?? input?.alignmentInitialDecision ?? '',
    leaderFeedbackEvidenceType: input?.leaderFeedbackEvidenceType ?? input?.alignmentEvidenceType ?? '',
    leaderFeedbackEvidenceNote: input?.leaderFeedbackEvidenceNote ?? input?.alignmentEvidenceNote ?? '',
    leaderFeedbackTopic: input?.leaderFeedbackTopic ?? '',
    leaderFeedbackClosedPending: input?.leaderFeedbackClosedPending ?? false,
  };
}

export function syncLegacyFields(data: Step0Data): Step0Data {
  const impactList = splitToList(data.impactWho);
  const supportList = splitToList(data.supportNeeded);
  return {
    ...data,
    mode: data.mode ?? 'independent',
    initiativeTitle: data.initiativeTitle ?? '',
    origen: legacyOriginFrom(data.initiativeFrame ?? '', data.clarityLevel ?? ''),
    impacto3meses: legacyImpactFromObjective(data.primaryObjective ?? ''),
    respaldo: data.evidenceType ?? '',
    impacta: impactList.length > 0 ? impactList : data.impacta,
    parteProceso: mapVisibleMomentToLegacyStage(data.visibleMoment, data.parteProceso),
    quienEscuchar: data.mode === 'linked_to_challenge' ? data.quienEscuchar || data.additionalStakeholdersDetail || '' : data.quienEscuchar,
    siMinimo: supportList.length > 0 ? supportList : data.siMinimo,
  };
}

function mapVisibleMomentToLegacyStage(value: string | undefined, fallback: Step0Data['parteProceso']): Step0Data['parteProceso'] {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.includes('antes')) return 'antes';
  if (normalized.includes('despues') || normalized.includes('después')) return 'despues';
  if (normalized.includes('transversal')) return 'transversal';
  if (normalized.includes('durante')) return 'durante';
  return fallback;
}

function splitToList(value: string | undefined) {
  return (value ?? '')
    .split(/[,\n;]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function getDynamicDescriptionLabel(frame: Step0Frame, mode: Step0Mode) {
  if (mode === 'linked_to_challenge') {
    switch (frame) {
      case 'crecimiento':
        return 'Cuentalo con tus palabras: que estas viendo y por que esta oportunidad merece abrirse dentro de este reto?';
      case 'exploracion':
        return 'Cuéntalo con tus palabras: ¿qué incertidumbre o apuesta estás viendo y por qué merece abrirse dentro de este reto?';
      case 'mejora_proceso':
        return '¿Qué proceso quieres mejorar y qué está pasando hoy?';
      default:
        return '¿Qué está pasando hoy?';
    }
  }

  switch (frame) {
    case 'crecimiento':
      return '¿Qué está pasando hoy?';
    case 'exploracion':
      return '¿Qué está pasando hoy?';
    case 'mejora_proceso':
      return '¿Qué está pasando hoy?';
    default:
      return '¿Qué está pasando hoy?';
  }
}

export function getDescriptionHelper(frame: Step0Frame, objective: Step0PrimaryObjective) {
  const frameHelper = frame ? FRAME_COPY[frame].helper : 'Describe el problema, oportunidad o apuesta que quieres abordar. No necesitas tenerlo perfecto.';
  const objectiveHelper = objective ? OBJECTIVE_COPY[objective].helper : 'Si puedes, conecta esta descripción con el objetivo principal que buscas mover.';
  return `${frameHelper} ${objectiveHelper}`;
}

export function getConsequenceHelper(objective: Step0PrimaryObjective) {
  return objective ? OBJECTIVE_COPY[objective].consequence : 'Describe la consecuencia principal: tiempo perdido, dinero, riesgo, clientes, desgaste del equipo o pérdida de oportunidad.';
}

export function getSummaryTitle(mode: Step0Mode) {
  return mode === 'linked_to_challenge'
    ? 'Base para justificar esta iniciativa dentro del reto ya priorizado'
    : 'Base para abrir conversación y conseguir respaldo inicial';
}

export function getSummaryBlocks(data: Step0Data, inherited: InheritedChallengeContext) {
  if (data.mode === 'linked_to_challenge') {
    return [
      { label: 'Qué quiere mover', value: data.specificChallengePart || data.quePasaQueQuieres || 'Falta aclarar qué quieres mover.' },
      { label: 'Por qué importa', value: data.whyNowText || 'Falta conectar esto con una prioridad de negocio.' },
      { label: 'A quién impacta', value: data.impactWho || data.impacta?.join(', ') || 'Falta indicar a quién impacta.' },
      { label: 'Qué señales existen', value: data.currentEvidence || data.evidenceType || 'Falta aclarar qué señales tienes hoy.' },
      { label: 'Qué falta confirmar', value: data.validationSignal || 'Falta definir qué necesitas confirmar en Step 1.' },
      { label: 'Quién debería escucharlo', value: data.quienEscuchar || data.additionalStakeholdersDetail || inherited.items.find(item => item.label === 'Owner del reto')?.value || 'Falta indicar quién debería escuchar esta propuesta.' },
      { label: 'Qué decisión busca', value: data.decisionRequested || 'Falta definir qué decisión quieres pedir.' },
    ];
  }

  return [
    { label: 'Qué quiere mover', value: data.quePasaQueQuieres || 'Falta aclarar qué quieres mover.' },
    { label: 'Por qué importa', value: data.whyNowText || 'Falta conectar esto con una prioridad de negocio.' },
    { label: 'A quién impacta', value: data.impactWho || data.impacta?.join(', ') || 'Falta indicar a quién impacta.' },
    { label: 'Qué señales existen', value: data.currentEvidence || data.evidenceType || 'Falta aclarar qué señales tienes hoy.' },
    { label: 'Qué falta confirmar', value: data.validationSignal || 'Falta definir qué necesitas confirmar en Step 1.' },
    { label: 'Quién debería escucharlo', value: data.quienEscuchar || 'Falta indicar quién debería escuchar esta propuesta.' },
    { label: 'Qué decisión busca', value: data.decisionRequested || 'Falta definir qué decisión quieres pedir.' },
  ];
}

export function getRequiredFieldKeys(mode: Step0Mode, data: Step0Data) {
  const base = [
    'initiativeFrame',
    'primaryObjective',
    'quePasaQueQuieres',
    'impactWho',
    'whyNowText',
    'evidenceType',
    'quienEscuchar',
    'decisionRequested',
  ] as Array<keyof Step0Data>;
  return base;
}

export function isFilled(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}
