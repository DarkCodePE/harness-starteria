import { CREATE_STRATEGIC_FRONT_CAPABILITY_ID } from './capability-registry';
import type { CopilotAssessmentAdapter, CopilotAssessmentAdapterInput } from './copilot-assessment.adapter';
import type { ConversationalAssessmentResult } from '../domain/copilot.types';
import { conversationalAssessmentResultSchema } from '../schemas/copilot.schemas';

const RUBRIC_VERSION = 'deterministic-portfolio-copilot-session.v2';
const REQUIRED_FIELDS = ['name', 'objective', 'mainKpi', 'baseline', 'target', 'horizon', 'areaOrBusinessUnit', 'priority'] as const;
const DRAFT_REQUIRED_FIELDS = ['name', 'objective', 'mainKpi'] as const;

type ExtractedFrontFields = {
  name?: string;
  objective?: string;
  mainKpi?: string;
  baseline?: string;
  target?: string;
  horizon?: string;
  sponsor?: string;
  areaOrBusinessUnit?: string;
  priority?: 'Alta' | 'Media' | 'Baja';
};

type PortfolioCopilotSession = {
  id: string;
  organizationId?: string;
  userId: string;
  intent: 'create_strategic_front';
  targetEntity: 'strategic_front';
  phase: 'collecting_information' | 'proposal_ready' | 'awaiting_approval';
  contextRefs: Record<string, string | undefined>;
  collectedFields: Record<string, unknown>;
  fieldSources: Record<string, {
    sourceMessageId: string;
    confidence?: number;
    extractionType: 'explicit' | 'inferred' | 'inherited' | 'user_edited';
  }>;
  missingRequiredFields: string[];
  unresolvedAmbiguities: string[];
  askedFieldKeys: string[];
  questionAttempts: Record<string, number>;
  proposal?: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export class DeterministicCopilotAdapter implements CopilotAssessmentAdapter {
  readonly adapterType = 'deterministic';
  readonly version = RUBRIC_VERSION;

  async assess(input: CopilotAssessmentAdapterInput): Promise<ConversationalAssessmentResult> {
    const content = input.content.trim();
    const sourceReferences = input.sourceReferences?.length
      ? input.sourceReferences
      : [{ type: 'message' as const, id: input.messageId, label: 'Mensaje del usuario' }];
    const previousSession = getPreviousSession(input.previousAssessment?.detectedEntities);

    if (!previousSession && !looksLikeCreateStrategicFront(content)) {
      return parseAssessmentResult({
        primaryIntent: 'unknown',
        secondaryIntents: [],
        operation: 'unsupported',
        detectedEntities: {},
        ambiguousObjects: [],
        missingInformation: [],
        recommendedCapabilities: [],
        assumptions: [],
        risks: ['No hay una capability P0 compatible con el mensaje.'],
        sourceReferences,
        confidence: 'low',
        adapterType: this.adapterType,
        rubricVersion: this.version,
        assistantMessage: 'No pude convertir ese mensaje en una accion Copilot soportada por esta version.',
      });
    }

    const extracted = extractCreateStrategicFrontFields(content, previousSession);
    const session = buildNextSession({ previousSession, extracted, input });
    const draftReady = DRAFT_REQUIRED_FIELDS.every((field) => isResolvedField(session.collectedFields[field]));
    const proposedPayload = draftReady
      ? {
          organizationId: input.organizationId,
          name: session.collectedFields.name,
          objective: session.collectedFields.objective,
          mainKpi: session.collectedFields.mainKpi,
          baseline: valueOrUndefined(session.collectedFields.baseline),
          target: valueOrUndefined(session.collectedFields.target),
          horizon: valueOrUndefined(session.collectedFields.horizon),
          sponsor: valueOrUndefined(session.collectedFields.sponsor),
          areaOrBusinessUnit: valueOrUndefined(session.collectedFields.areaOrBusinessUnit),
          priority: (session.collectedFields.priority as ExtractedFrontFields['priority'] | undefined) ?? 'Media',
          createdBy: input.userId,
        }
      : undefined;

    if (proposedPayload) {
      session.proposal = proposedPayload;
      session.phase = session.missingRequiredFields.length === 0 ? 'proposal_ready' : 'awaiting_approval';
    }

    return parseAssessmentResult({
      primaryIntent: 'create_strategic_front',
      secondaryIntents: [],
      operation: 'create',
      detectedEntities: {
        ...removeUndefined(extracted),
        ...session.collectedFields,
        portfolioCopilotSession: session,
      },
      ambiguousObjects: [],
      missingInformation: session.missingRequiredFields,
      recommendedCapabilities: [CREATE_STRATEGIC_FRONT_CAPABILITY_ID],
      assumptions: [],
      risks: session.missingRequiredFields.length > 0 ? ['Faltan campos recomendados para completar la propuesta.'] : [],
      sourceReferences,
      confidence: draftReady ? 'high' : 'medium',
      adapterType: this.adapterType,
      rubricVersion: this.version,
      proposedPayload,
      assistantMessage: session.missingRequiredFields.length === 0 && proposedPayload
        ? `Prepare una propuesta revisable para crear el frente estrategico "${String(session.collectedFields.name)}".`
        : buildClarificationMessage(session),
    });
  }
}

function parseAssessmentResult(value: unknown): ConversationalAssessmentResult {
  return conversationalAssessmentResultSchema.parse(value) as ConversationalAssessmentResult;
}

function looksLikeCreateStrategicFront(content: string): boolean {
  const normalized = normalize(content);
  return /\b(crea|crear|quiero crear|registra|registrar)\b/.test(normalized) &&
    /\b(frente|frente estrategico)\b/.test(normalized);
}

function extractCreateStrategicFrontFields(content: string, previousSession?: PortfolioCopilotSession | null): ExtractedFrontFields {
  const latestTurn = content.split(/\r?\n/).filter((line) => line.trim()).at(-1)?.trim() ?? content;
  const expectedFields = previousSession?.missingRequiredFields ?? [];
  const explicit: ExtractedFrontFields = {
    name: matchFirst(content, [
      /frente\s+(?:estrategico\s+)?llamado\s+(.+?)(?:\.|\s+su objetivo|\s+objetivo|\s+el kpi|\s+kpi|$)/i,
      /frente\s+(?:de\s+)?(.+?)(?:\.|\s+su objetivo|\s+objetivo|\s+el kpi|\s+kpi|\r?\n|$)/i,
    ]),
    objective: matchFirst(content, [
      /(?:^|\n)\s*((?:optimizar|reducir|aumentar|mejorar|disminuir|incrementar|acelerar|fortalecer)\s+.+?)(?:,?\s+(?:nuestro\s+)?kpi|\s+indicador|\s+metrica|\s+se[nn]al|$)/i,
      /su objetivo es\s+(.+?)(?:\.|\s+el kpi|\s+kpi principal|\s+con baseline|$)/i,
      /objetivo\s+(?:es\s+)?(.+?)(?:\.|\s+el kpi|\s+kpi principal|\s+con baseline|$)/i,
      /meta\s+(?:es\s+)?(.+?)(?:\.|\s+el kpi|\s+kpi principal|\s+con baseline|$)/i,
      /queremos mover\s+(.+?)(?:\.|\s+el kpi|\s+kpi principal|\s+con baseline|$)/i,
    ]),
    mainKpi: matchFirst(content, [
      /kpi principal\s+(?:sera|ser[aá]|es)?\s*(.+?)(?:,|\.\s| con baseline|\s+baseline|\s+meta|\s+horizonte|$)/i,
      /(?:nuestro\s+)?kpi\s+(?:sera|ser[aá]|es)?\s*(.+?)(?:,|\.\s| con baseline|\s+baseline|\s+meta|\s+horizonte|$)/i,
      /(?:indicador|senal|se[nn]al|metrica principal|m[eé]trica principal)\s+(?:sera|ser[aá]|es)?\s*(.+?)(?:,|\.\s| con baseline|\s+baseline|\s+meta|\s+horizonte|$)/i,
    ]),
    baseline: matchFirst(content, [
      /baseline\s+(.+?)(?:,|\.\s|\s+meta|\s+target|\s+horizonte|$)/i,
      /linea base\s+(.+?)(?:,|\.\s|\s+meta|\s+target|\s+horizonte|$)/i,
      /valor actual\s+(.+?)(?:,|\.\s|\s+meta|\s+target|\s+horizonte|$)/i,
      /situacion actual\s+(.+?)(?:,|\.\s|\s+meta|\s+target|\s+horizonte|$)/i,
    ]),
    target: matchFirst(content, [
      /meta\s+(.+?)(?:,|\.\s|\s+horizonte|\s+prioridad|\s+sponsor|$)/i,
      /target\s+(.+?)(?:,|\.\s|\s+horizonte|\s+prioridad|\s+sponsor|$)/i,
    ]),
    horizon: matchFirst(content, [
      /horizonte\s+(?:de\s+)?(.+?)(?:,|\.\s|\s+prioridad|\s+sponsor|$)/i,
      /plazo\s+(?:de\s+)?(.+?)(?:,|\.\s|\s+prioridad|\s+sponsor|$)/i,
    ]),
    sponsor: matchFirst(content, [
      /sponsor\s+(.+?)(?:\.|$)/i,
    ]),
    areaOrBusinessUnit: matchFirst(content, [
      /(?:area|[aá]rea|unidad|gerencia)\s+(?:de\s+)?(.+?)(?:,|\.\s|\s+prioridad|\s+sponsor|$)/i,
    ]),
    priority: extractPriority(content),
  };
  return { ...explicit, ...extractExpectedAnswer(latestTurn, expectedFields, explicit) };
}

function buildNextSession({
  previousSession,
  extracted,
  input,
}: {
  previousSession?: PortfolioCopilotSession | null;
  extracted: ExtractedFrontFields;
  input: CopilotAssessmentAdapterInput;
}): PortfolioCopilotSession {
  const now = new Date().toISOString();
  const collectedFields: Record<string, unknown> = { ...(previousSession?.collectedFields ?? {}) };
  const fieldSources = { ...(previousSession?.fieldSources ?? {}) };

  for (const [field, value] of Object.entries(extracted)) {
    if (!isResolvedField(value)) continue;
    collectedFields[field] = value;
    fieldSources[field] = {
      sourceMessageId: input.messageId,
      confidence: 0.86,
      extractionType: 'explicit' as const,
    };
  }

  const missingRequiredFields = REQUIRED_FIELDS.filter((field) => !isResolvedField(collectedFields[field]));
  const previousAsked = previousSession?.askedFieldKeys ?? [];
  const nextField = selectNextUnresolvedField(missingRequiredFields, previousAsked);
  const askedFieldKeys = nextField ? [...new Set([...previousAsked, nextField])] : previousAsked;
  const questionAttempts = { ...(previousSession?.questionAttempts ?? {}) };
  if (nextField) questionAttempts[nextField] = (questionAttempts[nextField] ?? 0) + 1;

  return {
    id: previousSession?.id ?? input.conversationId,
    organizationId: input.organizationId,
    userId: input.userId,
    intent: 'create_strategic_front',
    targetEntity: 'strategic_front',
    phase: missingRequiredFields.length > 0 ? 'collecting_information' : 'proposal_ready',
    contextRefs: previousSession?.contextRefs ?? {},
    collectedFields,
    fieldSources,
    missingRequiredFields,
    unresolvedAmbiguities: [],
    askedFieldKeys,
    questionAttempts,
    version: (previousSession?.version ?? 0) + 1,
    createdAt: previousSession?.createdAt ?? now,
    updatedAt: now,
  };
}

function matchFirst(content: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    const value = match?.[1]?.trim().replace(/\s+/g, ' ');
    if (value) return trimTrailingConjunction(value);
  }
  return undefined;
}

function extractPriority(content: string): 'Alta' | 'Media' | 'Baja' | undefined {
  const normalized = normalize(content);
  if (/\bprioridad alta\b|\balta prioridad\b/.test(normalized)) return 'Alta';
  if (/\bprioridad media\b|\bmedia prioridad\b/.test(normalized)) return 'Media';
  if (/\bprioridad baja\b|\bbaja prioridad\b/.test(normalized)) return 'Baja';
  return undefined;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function trimTrailingConjunction(value: string): string {
  return value.replace(/\s+y$/i, '').trim();
}

function removeUndefined(input: ExtractedFrontFields): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function getPreviousSession(entities: Record<string, unknown> | undefined): PortfolioCopilotSession | null {
  const value = entities?.portfolioCopilotSession;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const session = value as Partial<PortfolioCopilotSession>;
  if (session.intent !== 'create_strategic_front' || !session.collectedFields) return null;
  return session as PortfolioCopilotSession;
}

function isResolvedField(value: unknown): boolean {
  return value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '');
}

function valueOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function selectNextUnresolvedField(missing: readonly string[], asked: readonly string[]): string | undefined {
  return missing.find((field) => !asked.includes(field)) ?? missing[0];
}

function buildClarificationMessage(session: PortfolioCopilotSession): string {
  const nextField = selectNextUnresolvedField(
    session.missingRequiredFields,
    session.askedFieldKeys.filter((field) => field !== session.missingRequiredFields[0]),
  );
  const captured = [];
  if (session.collectedFields.objective) captured.push('objective');
  if (session.collectedFields.mainKpi) captured.push('mainKpi');
  const prefix = captured.length > 0 ? 'Entendido. Ya registre esos datos. ' : '';
  return prefix + (nextField ? questionForField(nextField, session.questionAttempts[nextField] ?? 1) : 'Ya tengo los datos clave para preparar la propuesta.');
}

function questionForField(field: string, attempt: number): string {
  const concrete = attempt > 1;
  const questions: Record<string, [string, string]> = {
    name: ['Como se llama el frente estrategico?', 'Dame un nombre corto para el frente, por ejemplo "Eficiencia operativa".'],
    objective: ['Que objetivo de negocio debe mover este frente?', 'Resume el objetivo en una frase: verbo, proceso o area, y resultado esperado.'],
    mainKpi: ['Cual es el KPI principal o senal que usaran para medir avance?', 'Indica una metrica principal, por ejemplo "% de equipos sin devolucion por falla".'],
    baseline: ['Cual es el valor actual del indicador?', 'Indica el baseline actual. Si no lo tienen, responde "dejar pendiente".'],
    target: ['A que meta quieren llegar?', 'Indica la meta esperada. Si aun no esta definida, responde "dejar pendiente".'],
    horizon: ['En que horizonte quieren lograrlo?', 'Elige un plazo, por ejemplo "90 dias", "6 meses" o "Q4".'],
    areaOrBusinessUnit: ['Que area o unidad de negocio queda dentro del alcance?', 'Indica el area, proceso o unidad responsable del alcance.'],
    priority: ['Que prioridad tiene: alta, media o baja?', 'Elige una prioridad: alta, media o baja.'],
  };
  return questions[field]?.[concrete ? 1 : 0] ?? `Necesito completar ${field}.`;
}

function extractExpectedAnswer(
  content: string,
  expectedFields: readonly string[],
  explicit: ExtractedFrontFields,
): ExtractedFrontFields {
  const normalized = normalize(content);
  if (/\b(no lo se|no lo se|pendiente|dejar pendiente)\b/.test(normalized)) return {};
  if (Object.values(explicit).some(isResolvedField)) return {};
  const next = expectedFields.find((field) => !isResolvedField(explicit[field as keyof ExtractedFrontFields]));
  if (!next) return {};
  if (next === 'objective' && !/\b(kpi|indicador|metrica|senal|se[nn]al)\b/i.test(content)) return { objective: content };
  if (next === 'baseline') return { baseline: content };
  if (next === 'target') return { target: content };
  if (next === 'horizon') return { horizon: content };
  if (next === 'areaOrBusinessUnit') return { areaOrBusinessUnit: content };
  return {};
}
