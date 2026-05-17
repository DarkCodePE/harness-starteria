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
  { value: 'correccion', label: 'Quiero corregir una friccion o problema' },
  { value: 'crecimiento', label: 'Quiero capturar una oportunidad' },
  { value: 'exploracion', label: 'Quiero explorar una apuesta o reducir una incertidumbre' },
];

export const CLARITY_OPTIONS: Step0Option<Exclude<Step0ClarityLevel, ''>>[] = [
  { value: 'observacion_inicial', label: 'Tengo una observacion inicial' },
  { value: 'algunas_senales', label: 'Ya reuni algunas senales' },
  { value: 'hipotesis_clara', label: 'Tengo una hipotesis bastante clara' },
  { value: 'idea_pensada', label: 'Ya tengo una idea o solucion pensada' },
];

export const PRIMARY_OBJECTIVE_OPTIONS: Step0Option<Exclude<Step0PrimaryObjective, ''>>[] = [
  { value: 'eficiencia', label: 'Eficiencia, tiempos o costos' },
  { value: 'experiencia_cliente', label: 'Experiencia del cliente' },
  { value: 'ingresos', label: 'Ingresos, crecimiento o adopcion' },
  { value: 'riesgo', label: 'Riesgo o cumplimiento' },
  { value: 'productividad', label: 'Productividad o clima interno' },
  { value: 'aprendizaje', label: 'Aprendizaje para decidir una apuesta' },
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
  { value: 'testimonios', label: 'Testimonios o feedback directo' },
  { value: 'benchmark', label: 'Referencias o comparaciones externas' },
  { value: 'hipotesis', label: 'Aun es una hipotesis por validar' },
  { value: 'otro', label: 'Otro respaldo' },
];

export const FRAME_COPY: Record<Exclude<Step0Frame, ''>, { noun: string; action: string; helper: string }> = {
  correccion: {
    noun: 'problema',
    action: 'corregir',
    helper: 'Describe la friccion concreta, donde se rompe hoy y por que vale la pena intervenirla.',
  },
  crecimiento: {
    noun: 'oportunidad',
    action: 'capturar',
    helper: 'Describe la oportunidad visible, la ventana que se abre y por que conviene moverla ahora.',
  },
  exploracion: {
    noun: 'apuesta',
    action: 'explorar',
    helper: 'Describe la incertidumbre o apuesta, que estas viendo y que necesitas aprender antes de comprometerte.',
  },
};

export const OBJECTIVE_COPY: Record<Exclude<Step0PrimaryObjective, ''>, { helper: string; consequence: string }> = {
  eficiencia: {
    helper: 'Ayuda a aterrizar tiempos, costos, capacidad o reprocesos que hoy justifican mover esta iniciativa.',
    consequence: 'Explica que ineficiencia, tiempo o costo seguiria creciendo si esto no se mueve pronto.',
  },
  experiencia_cliente: {
    helper: 'Ayuda a conectar la iniciativa con fricciones del cliente, calidad de servicio o experiencia percibida.',
    consequence: 'Explica como se seguiria deteriorando la experiencia o la relacion con el cliente si se deja igual.',
  },
  ingresos: {
    helper: 'Ayuda a vincular la iniciativa con crecimiento, conversion, adopcion o captura de valor.',
    consequence: 'Explica que oportunidad comercial o de adopcion se seguiria perdiendo en los proximos 3 meses.',
  },
  riesgo: {
    helper: 'Ayuda a enfocar riesgo operativo, regulatorio, reputacional o de cumplimiento.',
    consequence: 'Explica que riesgo seguiria abierto o podria escalar si no se interviene a tiempo.',
  },
  productividad: {
    helper: 'Ayuda a aterrizar productividad, carga operativa, coordinacion o clima interno.',
    consequence: 'Explica que sobrecarga, retrabajo o desgaste seguiria afectando al equipo si esto se posterga.',
  },
  aprendizaje: {
    helper: 'Ayuda a justificar por que aprender ahora vale mas que esperar a tener certeza perfecta.',
    consequence: 'Explica que decision seguiria postergada o que incertidumbre seguiria abierta si no se aprende pronto.',
  },
  otro: {
    helper: 'Ayuda a explicar con tus palabras que objetivo principal buscas mover con esta iniciativa.',
    consequence: 'Explica cual seria la consecuencia principal de no moverla en el corto plazo.',
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
  const mode = input?.mode ?? getStep0Mode(project);
  const initiativeFrame = input?.initiativeFrame
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
  const initiativeTitle = input?.initiativeTitle ?? project.name;
  const currentEvidence = input?.currentEvidence ?? '';
  const supportNeeded = input?.supportNeeded ?? (input?.siMinimo?.join(', ') ?? '');

  return {
    nombreParticipante: input?.nombreParticipante ?? userName,
    rolArea: input?.rolArea ?? '',
    origen: input?.origen ?? legacyOriginFrom(initiativeFrame, clarityLevel),
    quePasaQueQuieres: input?.quePasaQueQuieres ?? '',
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
    impactWho: input?.impactWho ?? (input?.impacta?.join(', ') ?? ''),
    visibleMoment: input?.visibleMoment ?? '',
    whyNowText: input?.whyNowText ?? '',
    ifNotNowConsequence: input?.ifNotNowConsequence ?? '',
    evidenceType,
    currentEvidence,
    validationSignal: input?.validationSignal ?? '',
    sponsorInterestReason: input?.sponsorInterestReason ?? '',
    supportNeeded,
    decisionRequested: input?.decisionRequested ?? '',
    deliveryEmail: input?.deliveryEmail ?? userEmail,
    additionalStakeholders: input?.additionalStakeholders ?? '',
    additionalStakeholdersDetail: input?.additionalStakeholdersDetail ?? '',
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
    quienEscuchar: data.mode === 'linked_to_challenge' ? data.additionalStakeholdersDetail ?? '' : data.quienEscuchar,
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
        return 'Cuentalo con tus palabras: que incertidumbre o apuesta estas viendo y por que merece abrirse dentro de este reto?';
      default:
        return 'Cuentalo con tus palabras: que estas viendo y por que esta iniciativa merece abrirse dentro de este reto?';
    }
  }

  switch (frame) {
    case 'crecimiento':
      return 'Cuentamelo con tus palabras: que oportunidad ves y que quieres mover?';
    case 'exploracion':
      return 'Cuentamelo con tus palabras: que quieres explorar o que incertidumbre quieres reducir?';
    default:
      return 'Cuentamelo con tus palabras: que esta pasando, que oportunidad ves o que quieres validar?';
  }
}

export function getDescriptionHelper(frame: Step0Frame, objective: Step0PrimaryObjective) {
  const frameHelper = frame ? FRAME_COPY[frame].helper : 'Describe con ejemplos o senales reales lo que hoy estas viendo.';
  const objectiveHelper = objective ? OBJECTIVE_COPY[objective].helper : 'Si puedes, conecta esta descripcion con el objetivo principal que buscas mover.';
  return `${frameHelper} ${objectiveHelper}`;
}

export function getConsequenceHelper(objective: Step0PrimaryObjective) {
  return objective ? OBJECTIVE_COPY[objective].consequence : 'Explica la consecuencia principal de dejar esto igual durante los proximos 3 meses.';
}

export function getSummaryTitle(mode: Step0Mode) {
  return mode === 'linked_to_challenge'
    ? 'Base para justificar esta iniciativa dentro del reto ya priorizado'
    : 'Base para abrir conversacion y conseguir respaldo inicial';
}

export function getSummaryBlocks(data: Step0Data, inherited: InheritedChallengeContext) {
  if (data.mode === 'linked_to_challenge') {
    return [
      { label: 'Parte del reto que ataca', value: data.specificChallengePart || 'Aterriza que parte concreta del reto buscas mover con esta iniciativa.' },
      { label: 'Conexion con objetivo o KPI', value: data.challengeGoalConnection || 'Explica como esta iniciativa se conecta con el objetivo o KPI del reto.' },
      { label: 'Por que merece atencion ahora', value: data.whyNowText || 'Aterriza por que conviene mover esta iniciativa ahora dentro del reto.' },
      { label: 'Evidencia o senales actuales', value: data.currentEvidence || 'Describe evidencia, senales o referencias que hoy respaldan abrir esta iniciativa.' },
      { label: 'Senal para seguir avanzando', value: data.validationSignal || 'Aclara que te haria pensar que vale la pena seguir avanzando dentro del reto.' },
      { label: 'Apoyo del sponsor u owner', value: data.supportNeeded || 'Especifica el destrabe minimo que necesitas del sponsor o owner ya definido.' },
      { label: 'Decision puntual solicitada', value: data.decisionRequested || 'Explica que decision puntual estas buscando en esta etapa.' },
    ];
  }

  return [
    { label: 'Que quiere mover', value: data.quePasaQueQuieres || 'Describe que quieres mover o validar con esta iniciativa.' },
    { label: 'Por que importa', value: data.whyNowText || 'Explica por que conviene mover esto ahora.' },
    { label: 'A quien impacta', value: data.impactWho || 'Aclara a quien impacta de forma mas directa.' },
    { label: 'Que respaldo existe', value: data.currentEvidence || 'Resume la evidencia o senales que hoy sostienen la iniciativa.' },
    { label: 'Quien deberia escucharlo', value: data.quienEscuchar || 'Identifica el area, lider o sponsor que deberia escuchar esto primero.' },
    { label: 'Que apoyo minimo necesita', value: data.supportNeeded || 'Define el destrabe minimo que necesitas para avanzar.' },
    { label: 'Decision que buscas', value: data.decisionRequested || 'Explica que decision estas buscando en esta etapa.' },
  ];
}

export function getRequiredFieldKeys(mode: Step0Mode, data: Step0Data) {
  const base = [
    'initiativeTitle',
    'rolArea',
    'initiativeFrame',
    'primaryObjective',
    'clarityLevel',
    'quePasaQueQuieres',
    'impactWho',
    'visibleMoment',
    'whyNowText',
    'ifNotNowConsequence',
    'currentEvidence',
    'validationSignal',
    'supportNeeded',
    'decisionRequested',
    'deliveryEmail',
  ] as Array<keyof Step0Data>;

  if (mode === 'linked_to_challenge') {
    const linked = [
      'specificChallengePart',
      'challengeGoalConnection',
      'linkedContributionType',
      'additionalStakeholders',
    ] as Array<keyof Step0Data>;
    if (data.additionalStakeholders === 'si') linked.push('additionalStakeholdersDetail');
    return [...base, ...linked];
  }

  return [...base, 'quienEscuchar', 'sponsorInterestReason'] as Array<keyof Step0Data>;
}

export function isFilled(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}
