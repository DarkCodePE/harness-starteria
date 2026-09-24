export type ReadinessDimension =
  | 'RELEVANCE'
  | 'DECISION'
  | 'EXECUTION_REALITY'
  | 'EVIDENCE_AUTHORITY'
  | 'ROUTING';

export type DimensionStatus =
  | 'SUFFICIENT'
  | 'PARTIAL'
  | 'MATERIAL_GAP'
  | 'UNKNOWN'
  | 'NOT_RELEVANT';

export type ResolutionType =
  | 'ASK_NOW'
  | 'REQUIRES_ORGANIZATIONAL_INPUT'
  | 'DEFER_TO_LATER_STAGE'
  | 'NONCRITICAL'
  | 'ALREADY_SUFFICIENT';

export type DecisionDependency = 'BLOCKING' | 'CONSTRAINING' | 'NON_BLOCKING' | 'UNKNOWN';
export type Answerability = 'USER_CAN_ANSWER' | 'ORGANIZATIONAL_AUTHORITY_REQUIRED' | 'EXTERNAL_EVIDENCE_REQUIRED' | 'LATER_STAGE_DISCOVERY';
export type ExecutionGapClassification = 'CURRENT_DECISION_BLOCKER' | 'CURRENT_DECISION_CONSTRAINT' | 'LATER_STAGE_EXECUTION_DETAIL' | 'NOT_EXECUTION_RELEVANT';
export type DecisionSensitivity = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type DecisionBranchType =
  | 'ENABLEMENT_CHANGE'
  | 'ROUTE_CHANGE'
  | 'CONDITION_CHANGE'
  | 'SCOPE_CHANGE'
  | 'DETAIL_CHANGE'
  | 'NO_MATERIAL_CHANGE'
  | 'UNKNOWN';
export type AnswerShape = 'BOOLEAN' | 'CATEGORY' | 'BOUNDED_FACT' | 'OPEN_EXPLORATION' | 'ORGANIZATIONAL_CONFIRMATION';
export type CounterfactualDecisionTest = {
  plausible_answer_a: string;
  plausible_answer_b: string;
  decision_branching: 'YES' | 'NO' | 'UNCLEAR';
  branching_reason: string;
};

export type CounterfactualMetadata = Partial<CounterfactualDecisionTest> & {
  answer_a: string;
  answer_b: string;
  consequence_a?: string;
  consequence_b?: string;
  materially_different?: 'YES' | 'NO' | 'UNCLEAR';
  branch_type?: DecisionBranchType;
};

export type NextAction =
  | { type: 'ASK'; gap_id: string }
  | { type: 'STOP'; reason: string }
  | { type: 'ROUTE'; route: string; gap_id?: string }
  | { type: 'REQUIRE_ORGANIZATIONAL_INPUT'; gap_id: string };

export type CandidateGap = {
  id: string;
  dimension: ReadinessDimension;
  description: string;
  resolution_type: ResolutionType;
  decision_impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  route_impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  stage_fit: 'PORTFOLIO' | 'INITIATIVE' | 'STEPS_LATER_STAGE' | 'ORGANIZATIONAL_INPUT' | 'EXTERNAL_EVIDENCE' | 'SUFFICIENT';
  evidence_basis: string[];
  current_decision_dependency: DecisionDependency;
  answerability: Answerability;
  execution_gap_classification: ExecutionGapClassification;
  decision_sensitivity: DecisionSensitivity;
  decision_branch_type: DecisionBranchType;
  counterfactual_decision_test: CounterfactualDecisionTest;
  answer_shape: AnswerShape;
  why_ask_now?: string;
  why_not_ask?: string;
};

export type DecisionReadinessEvaluation = {
  dimensions: Record<ReadinessDimension, DimensionStatus>;
  candidate_gaps: CandidateGap[];
  selected_gap: CandidateGap | null;
  deferred_gaps: CandidateGap[];
  next_action: NextAction;
  rationale_trace: RationaleTraceEntry[];
};

export type RationaleTraceEntry = {
  turn: number;
  reconsidered_dimensions: ReadinessDimension[];
  selected_gap_id: string | null;
  selection_basis: 'DECISION_IMPACT' | 'ROUTING_IMPACT' | 'HANDOFF_SUFFICIENCY' | 'AUTHORITY_BOUNDARY' | 'STAGE_BOUNDARY' | 'NONE';
  dominant_competing_gap?: string;
  selection_tradeoff: string;
  selection_reason: string;
  why_not_ask: Array<{ gap_id: string; reason: string }>;
};

export type DecisionReadinessRun = {
  case_id: string;
  evaluations: DecisionReadinessEvaluation[];
  final: DecisionReadinessEvaluation;
  violations: string[];
  human_review: Record<string, 1 | 2 | 3 | 4 | 5 | null>;
};

export type DecisionReadinessFixture = {
  id: string;
  title: string;
  turns: string[];
  expected_invariants?: string[];
  expected_routes?: string[];
  decision_counterfactual?: CounterfactualMetadata;
};

const DIMENSIONS: ReadinessDimension[] = [
  'RELEVANCE',
  'DECISION',
  'EXECUTION_REALITY',
  'EVIDENCE_AUTHORITY',
  'ROUTING',
];

const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));
const explicitUnknown = (text: string) => hasAny(text, [
  'no lo sé', 'no lo se', 'no está definido', 'no esta definido',
  'no sabemos', 'gerencia no lo ha dicho', 'nadie tiene claro',
  'no tengo esa información', 'no tengo esa informacion', 'no sabemos aún', 'no sabemos aun',
  'no sabemos la causa',
]);

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function classifyCounterfactualBranch(metadata: CounterfactualMetadata | undefined): DecisionBranchType {
  if (!metadata) return 'UNKNOWN';
  if (metadata.branch_type) return metadata.branch_type;
  const a = normalize(metadata.consequence_a ?? '');
  const b = normalize(metadata.consequence_b ?? '');
  if (!a || !b || metadata.materially_different === 'UNCLEAR') return 'UNKNOWN';
  if (metadata.materially_different === 'NO') return 'NO_MATERIAL_CHANGE';
  if (metadata.materially_different !== 'YES') return 'UNKNOWN';
  const pair = `${a} ${b}`;
  const enablement = [
    'puede continuar', 'puede avanzar', 'can proceed', 'can continue', 'continue implementation',
    'no puede continuar', 'no puede avanzar', 'cannot proceed', 'cannot continue', 'no puede implementar',
    'no puede continuar', 'bloquea', 'blocked', 'must stop', 'debe detener', 'no puede seguir',
  ];
  const positiveEnablement = (value: string) => hasAny(value, ['puede continuar', 'puede avanzar', 'can proceed', 'can continue']);
  const negativeEnablement = (value: string) => hasAny(value, ['no puede continuar', 'no puede avanzar', 'cannot proceed', 'cannot continue', 'no puede implementar', 'bloquea', 'blocked', 'must stop', 'debe detener', 'no puede seguir']);
  if (positiveEnablement(a) !== positiveEnablement(b) || negativeEnablement(a) !== negativeEnablement(b)) {
    return 'ENABLEMENT_CHANGE';
  }
  const route = ['enrutar', 'rutar', 'route', 'routing', 'input organizacional', 'organizational input', 'otra ventana', 'another decision window', 'pause', 'pausar', 'escalar', 'escalate'];
  if (hasAny(pair, route) && (a.includes('continu') || b.includes('continu') || a.includes('advance') || b.includes('advance'))) return 'ROUTE_CHANGE';
  const condition = ['condicion', 'condition', 'precondicion', 'precondition', 'criterio', 'criterion', 'aprobacion', 'approval', 'guardrail', 'requisito', 'requirement'];
  if (hasAny(pair, condition)) return 'CONDITION_CHANGE';
  const scope = ['alcance', 'scope', 'escala', 'scale', 'volumen', 'volume', 'cobertura', 'coverage'];
  if (hasAny(pair, scope)) return 'SCOPE_CHANGE';
  const detail = ['detalle', 'detail', 'workflow', 'technical design', 'diseno tecnico', 'implementation detail', 'implementacion posterior'];
  if (hasAny(pair, detail)) return 'DETAIL_CHANGE';
  return 'UNKNOWN';
}

function dependencyForBranch(branch: DecisionBranchType, fallback: DecisionDependency): DecisionDependency {
  if (branch === 'ENABLEMENT_CHANGE') return 'BLOCKING';
  if (branch === 'ROUTE_CHANGE') return 'BLOCKING';
  if (branch === 'CONDITION_CHANGE' || branch === 'SCOPE_CHANGE') return 'CONSTRAINING';
  if (branch === 'DETAIL_CHANGE' || branch === 'NO_MATERIAL_CHANGE') return 'NON_BLOCKING';
  return fallback;
}

function sensitivityForBranch(branch: DecisionBranchType, fallback: DecisionSensitivity, metadata?: CounterfactualMetadata): DecisionSensitivity {
  if (branch === 'ENABLEMENT_CHANGE' || branch === 'ROUTE_CHANGE') return 'HIGH';
  if (branch === 'CONDITION_CHANGE') {
    const pair = normalize(`${metadata?.consequence_a ?? ''} ${metadata?.consequence_b ?? ''}`);
    return hasAny(pair, ['no puede', 'cannot', 'bloquea', 'must stop', 'detener']) ? 'HIGH' : 'MEDIUM';
  }
  if (branch === 'SCOPE_CHANGE') {
    const pair = normalize(`${metadata?.consequence_a ?? ''} ${metadata?.consequence_b ?? ''}`);
    return hasAny(pair, ['decision class', 'go/no-go', 'continuar o no', 'continue or not']) ? 'HIGH' : 'MEDIUM';
  }
  if (branch === 'DETAIL_CHANGE' || branch === 'NO_MATERIAL_CHANGE') return 'LOW';
  return fallback;
}

function statusMap(text: string): Record<ReadinessDimension, DimensionStatus> {
  const relevance = hasAny(text, ['valor', 'importante', 'prioridad', 'resultado', 'ahorro', 'reduc'])
    ? 'PARTIAL' : 'UNKNOWN';
  const decision = hasAny(text, ['decidir', 'decisión', 'decision', 'quién decide', 'quien decide', 'comité', 'comite'])
    ? (explicitUnknown(text) ? 'MATERIAL_GAP' : 'PARTIAL') : 'UNKNOWN';
  const execution = hasAny(text, [
    'capacidad', 'horas por semana', 'ownership', 'responsabilidad', 'responsable',
    'operativa', 'operar', 'usuarios', 'plantillas manuales', 'presupuesto', 'equipo',
    'dependemos', 'dependencia', 'adopción', 'adopcion', 'turnos',
  ]) ? 'MATERIAL_GAP' : 'UNKNOWN';
  const evidence = hasAny(text, [
    'precisión', 'precision', '%', 'métricas', 'metricas', 'validada', 'evidencia',
    'no lo sé', 'no lo se', 'no está definido', 'no esta definido', 'autoridad formal',
  ]) ? (explicitUnknown(text) ? 'MATERIAL_GAP' : 'PARTIAL') : 'UNKNOWN';
  const routing = hasAny(text, [
    'plan anual', 'plan anual', 'etapa', 'siguiente fase', 'piloto', 'operación', 'operacion',
    'cooperación externa', 'cooperacion externa', 'steps', 'experimento', 'compliance',
  ]) ? 'PARTIAL' : 'UNKNOWN';

  return { RELEVANCE: relevance, DECISION: decision, EXECUTION_REALITY: execution, EVIDENCE_AUTHORITY: evidence, ROUTING: routing };
}

function gap(
  id: string,
  dimension: ReadinessDimension,
  description: string,
  resolution_type: ResolutionType,
  decision_impact: CandidateGap['decision_impact'],
  route_impact: CandidateGap['route_impact'],
  stage_fit: CandidateGap['stage_fit'],
  evidence_basis: string[],
  extras: Partial<Pick<CandidateGap, 'why_ask_now' | 'why_not_ask' | 'current_decision_dependency' | 'answerability' | 'execution_gap_classification' | 'decision_sensitivity' | 'counterfactual_decision_test' | 'answer_shape'>> = {},
): CandidateGap {
  const current_decision_dependency = extras.current_decision_dependency
    ?? (resolution_type === 'REQUIRES_ORGANIZATIONAL_INPUT' && decision_impact === 'HIGH' ? 'BLOCKING'
      : resolution_type === 'ASK_NOW' && decision_impact === 'HIGH' ? 'CONSTRAINING'
        : 'NON_BLOCKING');
  const answerability = extras.answerability
    ?? (stage_fit === 'ORGANIZATIONAL_INPUT' ? 'ORGANIZATIONAL_AUTHORITY_REQUIRED'
      : stage_fit === 'EXTERNAL_EVIDENCE' ? 'EXTERNAL_EVIDENCE_REQUIRED'
        : stage_fit === 'STEPS_LATER_STAGE' || stage_fit === 'INITIATIVE' ? 'LATER_STAGE_DISCOVERY'
          : 'USER_CAN_ANSWER');
  const execution_gap_classification = extras.execution_gap_classification
    ?? (dimension !== 'EXECUTION_REALITY' ? 'NOT_EXECUTION_RELEVANT'
      : stage_fit === 'STEPS_LATER_STAGE' || stage_fit === 'INITIATIVE' ? 'LATER_STAGE_EXECUTION_DETAIL'
        : current_decision_dependency === 'BLOCKING' ? 'CURRENT_DECISION_BLOCKER'
          : current_decision_dependency === 'CONSTRAINING' ? 'CURRENT_DECISION_CONSTRAINT'
            : 'NOT_EXECUTION_RELEVANT');
  const decision_sensitivity = extras.decision_sensitivity
    ?? (resolution_type === 'DEFER_TO_LATER_STAGE' || stage_fit === 'INITIATIVE' || stage_fit === 'STEPS_LATER_STAGE' ? 'LOW'
      : current_decision_dependency === 'BLOCKING' ? 'HIGH'
        : current_decision_dependency === 'CONSTRAINING' ? 'MEDIUM' : 'UNKNOWN');
  const answer_shape = extras.answer_shape
    ?? (answerability === 'ORGANIZATIONAL_AUTHORITY_REQUIRED' ? 'ORGANIZATIONAL_CONFIRMATION'
      : answerability === 'LATER_STAGE_DISCOVERY' || answerability === 'EXTERNAL_EVIDENCE_REQUIRED' ? 'OPEN_EXPLORATION'
        : dimension === 'EXECUTION_REALITY' && execution_gap_classification === 'CURRENT_DECISION_CONSTRAINT' ? 'BOUNDED_FACT'
          : dimension === 'EXECUTION_REALITY' && execution_gap_classification === 'CURRENT_DECISION_BLOCKER' ? 'BOUNDED_FACT'
            : 'BOUNDED_FACT');
  const counterfactual_decision_test = extras.counterfactual_decision_test ?? {
    plausible_answer_a: dimension === 'EXECUTION_REALITY' ? 'La capacidad/adopción permite avanzar.' : 'El gap se resuelve suficientemente.',
    plausible_answer_b: dimension === 'EXECUTION_REALITY' ? 'La capacidad/adopción no permite avanzar.' : 'El gap permanece abierto.',
    decision_branching: decision_sensitivity === 'HIGH' ? 'YES' : decision_sensitivity === 'LOW' ? 'NO' : 'UNCLEAR',
    branching_reason: decision_sensitivity === 'HIGH' ? 'Las respuestas cambian la decisión o su condición material.' : decision_sensitivity === 'LOW' ? 'Las respuestas solo cambian detalle posterior.' : 'No hay base suficiente para establecer branching.',
  } as CounterfactualDecisionTest;
  return { id, dimension, description, resolution_type, stage_fit, evidence_basis, decision_impact, route_impact, ...extras, current_decision_dependency, answerability, execution_gap_classification, decision_sensitivity, decision_branch_type: 'UNKNOWN', counterfactual_decision_test, answer_shape };
}

function generateGaps(text: string, previous: DecisionReadinessEvaluation | undefined, counterfactual?: CounterfactualMetadata): CandidateGap[] {
  const gaps: CandidateGap[] = [];
  const unknown = explicitUnknown(text);
  const hasCapacity = hasAny(text, ['2h', 'horas por semana', 'capacidad', 'una persona operativa', 'sin presupuesto', 'turnos', 'implementarlo', 'responsabilidad fuera de horario']);
  const hasOwnership = hasAny(text, ['ownership', 'owner', 'accountable', 'sponsor', 'quién se hará cargo', 'quien se hara cargo', 'nadie tiene claro quién', 'nadie tiene claro quien', 'quién puede autorizar', 'quien puede autorizar']);
  const hasAdoption = hasAny(text, ['usuarios siguen', 'plantillas manuales', 'adopción', 'adopcion', 'revisión manual', 'revision manual']);
  const hasValueUncertainty = hasAny(text, ['no sé si', 'no se si', 'suficiente valor', 'qué quiere priorizar', 'que quiere priorizar', 'qué resultado', 'que resultado', 'usar más ia', 'usar mas ia', 'justifica mantener', 'justifica continuar', 'impacto justifica']);
  const hasAuthority = hasAny(text, ['autoridad formal', 'autorizar', 'flexibles', 'flexible', 'compliance', 'plan anual', 'quién decide', 'quien decide']);
  const laterStage = hasAny(text, ['experimento', 'muestra', 'threshold', 'siguiente fase', 'workflow', 'planificar', 'secuencia de trabajo', 'distribuir la capacidad']);
  const external = hasAny(text, ['externa', 'cooperación', 'cooperacion', 'evidencia externa']);
  const governanceEstablished = hasAny(text, ['explícitamente designados', 'explicitamente designados', 'formalmente designados', 'designa quién decide', 'designa quien decide', 'una persona decide', 'accountability', 'responsabilidades están formalmente repartidas', 'responsabilidades estan formalmente repartidas', 'responsabilidades están confirmadas', 'responsabilidades estan confirmadas']);
  const contextAlreadySufficient = hasAny(text, ['ya validada', 'ya validado', 'criterio de decisión acordado', 'criterio de decision acordado', 'están confirmados', 'estan confirmados', 'está confirmado', 'esta confirmado', 'suficientemente claras', 'suficientemente encuadrada', 'owner confirmado', 'sponsor y criterio de decisión están claros', 'sponsor y criterio de decision estan claros']);
  const authorityUnresolved = hasAny(text, ['no hay owner', 'nadie está nombrado', 'nadie esta nombrado', 'quién puede autorizar', 'quien puede autorizar', 'solo gerencia', 'gerencia puede confirmar']);
  const evidenceWeak = hasAny(text, ['anécdota', 'anecdota', 'una sola observación', 'una sola observacion', 'observación anecdótica', 'observacion anecdotica', 'beneficio supuesto', 'supuestos']);
  const implicitCapacity = hasAny(text, ['sobrecargado', 'sobrecargada', 'trabajo pendiente', 'llega al final', 'no puede hacerse cargo', 'semanas comprometidas', 'tiempo asignado', 'horas disponibles', '2 horas', 'no hay equipo', 'equipo operativo', 'cobertura', 'cubrir la operación', 'cubrir la operacion', 'cobertura disponible', 'media jornada', 'jornada completa']);
  const currentDecisionSignal = hasAny(text, ['decidir', 'decisión', 'decision', 'continúa', 'continua', 'continuar', 'lanzamiento', 'poner en marcha', 'escala', 'operación', 'operacion', 'pausa', 'implementarlo', 'implementación', 'implementacion', 'cambia el alcance', 'cambiaría el alcance', 'cambiaria el alcance']);
  const decisionBranchingSignal = hasAny(text, ['bloquea', 'bloqueada', 'no se puede tomar', 'seguir o enrutar', 'avanzamos o pausamos', 'cambia entre', 'decide si', 'decisión queda pendiente', 'decision queda pendiente']);
  const laterExecutionDetail = hasAny(text, ['workflow exacto', 'workflow', 'turnos de mantenimiento', 'rediseño del workflow', 'rediseñar el workflow', 'hábitos e incentivos', 'habitos e incentivos', 'diseño técnico', 'diseno tecnico', 'planificar cómo distribuir', 'planificar como distribuir', 'secuencia de trabajo']);
  const adoptionBlocking = hasAdoption && !currentDecisionSignal && hasAny(text, ['usuarios siguen', 'plantillas manuales', 'revisión manual', 'revision manual']);
  const executionBlocking = adoptionBlocking || (currentDecisionSignal && hasAny(text, ['no hay equipo', 'sin equipo', 'no tiene tiempo', 'tiempo asignado', 'nadie tiene tiempo', 'adopción se estancó', 'adopcion se estanco', 'no puede hacerse cargo', 'no hay capacidad', 'no owner', 'queda pendiente']));
  const executionConstraining = currentDecisionSignal && (hasCapacity || implicitCapacity || hasAdoption);
  const executionStage = laterExecutionDetail ? 'STEPS_LATER_STAGE' : hasAdoption && !currentDecisionSignal ? 'STEPS_LATER_STAGE' : 'PORTFOLIO';

  const unresolvedOwnership = hasOwnership && !governanceEstablished;
  if ((hasCapacity || unresolvedOwnership || hasAdoption || implicitCapacity) && !contextAlreadySufficient && !laterExecutionDetail) {
    gaps.push(gap(
      hasAdoption ? 'execution-adoption' : 'execution-capacity-ownership',
      'EXECUTION_REALITY',
      hasAdoption ? 'La adopción real no está asegurada aunque la herramienta funcione.' : 'La capacidad y/o accountability para ejecutar no están aseguradas.',
      unknown && (hasOwnership || authorityUnresolved) ? 'REQUIRES_ORGANIZATIONAL_INPUT' : (unknown && hasAdoption ? 'DEFER_TO_LATER_STAGE' : 'ASK_NOW'),
      'HIGH', 'HIGH', executionStage,
      ['user response contains execution constraints'],
      unknown && (hasOwnership || authorityUnresolved)
        ? { why_not_ask: 'La autoridad/ownership fue declarado desconocido; requiere input organizacional.' }
        : unknown && hasAdoption
          ? { why_not_ask: 'La causa exacta de adopción requiere trabajo posterior; el routing ya está claro.' }
        : {
          why_ask_now: 'Puede cambiar la decisión de avanzar y el routing del handoff.',
          current_decision_dependency: executionBlocking ? 'BLOCKING' : executionConstraining ? 'CONSTRAINING' : undefined,
          answerability: authorityUnresolved ? 'ORGANIZATIONAL_AUTHORITY_REQUIRED' : 'USER_CAN_ANSWER',
          execution_gap_classification: executionBlocking ? 'CURRENT_DECISION_BLOCKER' : executionConstraining ? 'CURRENT_DECISION_CONSTRAINT' : 'LATER_STAGE_EXECUTION_DETAIL',
          decision_sensitivity: executionBlocking || decisionBranchingSignal ? 'HIGH' : executionConstraining ? 'MEDIUM' : 'LOW',
          answer_shape: hasAdoption ? 'OPEN_EXPLORATION' : 'BOUNDED_FACT',
        },
    ));
  }
  if (hasValueUncertainty || (evidenceWeak && !hasAdoption) || (hasAny(text, ['precisión', 'precision', '%']) && !hasValueUncertainty && !hasAdoption)) {
    const evidenceGap = evidenceWeak && !hasValueUncertainty;
    gaps.push(gap(
      evidenceGap ? 'evidence-sufficiency' : 'business-value-confirmation', evidenceGap ? 'EVIDENCE_AUTHORITY' : 'RELEVANCE',
      evidenceGap ? 'La evidencia disponible no es suficiente para sostener una decisión de escala.' : 'La mejora operacional o la presión tecnológica no confirma valor/prioridad de negocio.',
      unknown || authorityUnresolved ? 'REQUIRES_ORGANIZATIONAL_INPUT' : 'ASK_NOW',
      'HIGH', 'MEDIUM', unknown ? 'ORGANIZATIONAL_INPUT' : 'PORTFOLIO',
      ['technical signal present', ...(unknown ? ['explicit organizational unknown'] : [])],
      unknown || authorityUnresolved
        ? { why_not_ask: 'La prioridad de negocio no está definida por la autoridad organizacional.' }
        : { why_ask_now: 'Puede cambiar si la iniciativa merece avanzar.', decision_sensitivity: evidenceGap && currentDecisionSignal ? 'HIGH' : 'MEDIUM', answer_shape: 'BOUNDED_FACT' },
    ));
  }
  if ((hasAuthority || hasOwnership || authorityUnresolved) && !governanceEstablished && !contextAlreadySufficient) {
    gaps.push(gap(
      'decision-authority', 'DECISION',
      'No está suficientemente separado quién decide, recomienda y responde operativamente.',
      unknown || authorityUnresolved ? 'REQUIRES_ORGANIZATIONAL_INPUT' : 'ASK_NOW',
      'HIGH', 'HIGH', 'ORGANIZATIONAL_INPUT',
      ['response references governance or accountability'],
      unknown || authorityUnresolved
        ? { why_not_ask: 'La designación formal requiere autoridad organizacional.' }
        : { why_ask_now: 'Puede cambiar la decisión de operación y la suficiencia del handoff.' },
    ));
  }
  if (external) {
    gaps.push(gap(
      'external-evidence', 'EVIDENCE_AUTHORITY',
      'La decisión depende de evidencia o cooperación externa aún no disponible.',
      'REQUIRES_ORGANIZATIONAL_INPUT', 'MEDIUM', 'HIGH', 'EXTERNAL_EVIDENCE',
      ['response references external dependency'],
      { why_not_ask: 'La fuente de evidencia está fuera del contexto que Portfolio Entry puede resolver.' },
    ));
  }
  if (laterStage) {
    gaps.push(gap(
      'later-stage-detail', 'ROUTING',
      'El detalle restante pertenece a una etapa posterior y no es necesario para este handoff.',
      'DEFER_TO_LATER_STAGE', 'LOW', 'HIGH', 'STEPS_LATER_STAGE',
      ['response references later-stage detail'],
      { why_not_ask: 'El routing ya está claro; preguntar ahora invadiría la etapa posterior.', execution_gap_classification: 'LATER_STAGE_EXECUTION_DETAIL' },
    ));
  }
  if (hasAny(text, ['proveedor', 'arquitectura', 'pipeline de datos', 'pipeline técnico', 'pipeline tecnico', 'umbral técnico', 'umbral tecnico', 'diseño técnico', 'diseno tecnico']) && !hasValueUncertainty) {
    gaps.push(gap(
      'technical-implementation-detail', 'ROUTING',
      'La arquitectura, proveedor o pipeline pertenece al diseño de la iniciativa posterior.',
      'DEFER_TO_LATER_STAGE', 'LOW', 'HIGH', 'INITIATIVE',
      ['technical detail is explicitly unresolved', 'current decision is organizational continuation'],
      { why_not_ask: 'Stage boundary: el detalle técnico no cambia la decisión actual.', execution_gap_classification: 'LATER_STAGE_EXECUTION_DETAIL' },
    ));
  }
  if (authorityUnresolved && hasAny(text, ['gerencia', 'management', 'prioridad'])) {
    gaps.push(gap(
      'organizational-priority', 'RELEVANCE',
      'La prioridad solo puede confirmarla una autoridad organizacional.',
      'REQUIRES_ORGANIZATIONAL_INPUT', 'HIGH', 'HIGH', 'ORGANIZATIONAL_INPUT',
      ['management authority explicitly required'],
      { why_not_ask: 'No corresponde pedir al usuario que adivine la decisión de gerencia.' },
    ));
  }
  if (previous?.selected_gap?.dimension === 'EXECUTION_REALITY' && !hasCapacity && !hasOwnership && !hasAdoption && !implicitCapacity) {
    gaps.push(gap(
      'execution-follow-up', 'EXECUTION_REALITY',
      'No apareció nueva evidencia que justifique seguir profundizando en execution reality.',
      'DEFER_TO_LATER_STAGE', 'LOW', 'LOW', 'INITIATIVE',
      ['no new execution evidence'],
      { why_not_ask: 'Local-depth guard: no hay cambio material demostrable.' },
    ));
  }
  return gaps;
}

function selectGap(gaps: CandidateGap[]): CandidateGap | null {
  const askable = gaps.filter((item) => {
    if (item.resolution_type !== 'ASK_NOW') return false;
    if (item.current_decision_dependency === 'BLOCKING') return true;
    if (item.current_decision_dependency !== 'CONSTRAINING') return false;
    return item.decision_sensitivity === 'HIGH'
      || (item.decision_sensitivity === 'MEDIUM' && item.answer_shape !== 'OPEN_EXPLORATION');
  });
  if (!askable.length) return null;
  const rank: Record<ReadinessDimension, number> = {
    DECISION: 5,
    EXECUTION_REALITY: 5,
    RELEVANCE: 4,
    ROUTING: 3,
    EVIDENCE_AUTHORITY: 2,
  };
  return [...askable].sort((a, b) => {
    const impact = (value: CandidateGap['decision_impact']) => ({ HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 }[value]);
    return impact(b.decision_impact) - impact(a.decision_impact) || impact(b.route_impact) - impact(a.route_impact) || rank[b.dimension] - rank[a.dimension];
  })[0] ?? null;
}

function nextAction(selected: CandidateGap | null, gaps: CandidateGap[], text: string): NextAction {
  const org = gaps
    .filter((item) => item.resolution_type === 'REQUIRES_ORGANIZATIONAL_INPUT' && item.decision_impact === 'HIGH')
    .sort((a, b) => (a.dimension === 'DECISION' ? -1 : 0) - (b.dimension === 'DECISION' ? -1 : 0))[0];
  if (org && (explicitUnknown(text) || org.id === 'decision-authority' || org.id === 'organizational-priority')) {
    return { type: 'REQUIRE_ORGANIZATIONAL_INPUT', gap_id: org.id };
  }
  if (selected) return { type: 'ASK', gap_id: selected.id };
  const route = gaps.find((item) => item.resolution_type === 'DEFER_TO_LATER_STAGE');
  if (route) return { type: 'ROUTE', route: route.stage_fit, gap_id: route.id };
  const input = gaps.find((item) => item.resolution_type === 'REQUIRES_ORGANIZATIONAL_INPUT');
  if (input) return { type: 'REQUIRE_ORGANIZATIONAL_INPUT', gap_id: input.id };
  return { type: 'STOP', reason: 'sufficient_context_or_noncritical_gaps' };
}

export function evaluateTurn(
  caseId: string,
  turn: number,
  responses: string[],
  previous?: DecisionReadinessEvaluation,
  counterfactual?: CounterfactualMetadata,
): DecisionReadinessEvaluation {
  const text = responses.join(' ').toLowerCase();
  const latestResponse = responses.at(-1)?.toLowerCase() ?? '';
  const dimensions = statusMap(text);
  const branch = classifyCounterfactualBranch(counterfactual);
  const candidate_gaps = generateGaps(text, previous).map((item) => {
    const evidenceDependency = item.current_decision_dependency;
    const evidenceSensitivity = item.decision_sensitivity;
    const branchDependency = dependencyForBranch(branch, evidenceDependency);
    const branchSensitivity = sensitivityForBranch(branch, evidenceSensitivity, counterfactual);
    const branchAdjusted = branch !== 'UNKNOWN'
      ? {
          ...item,
          current_decision_dependency: branchDependency,
          decision_sensitivity: branchSensitivity,
          decision_branch_type: branch,
          counterfactual_decision_test: counterfactual
            ? {
                plausible_answer_a: counterfactual.answer_a,
                plausible_answer_b: counterfactual.answer_b,
                decision_branching: branch === 'NO_MATERIAL_CHANGE' ? 'NO' as const : 'YES' as const,
                branching_reason: `Consequences classify as ${branch}; classification takes precedence over gap dimension and lexical cues.`,
              }
            : item.counterfactual_decision_test,
          execution_gap_classification: branchDependency === 'BLOCKING'
            ? 'CURRENT_DECISION_BLOCKER' as const
            : branchDependency === 'CONSTRAINING'
              ? 'CURRENT_DECISION_CONSTRAINT' as const
              : item.execution_gap_classification,
        }
      : item;
    const previouslyDeferred = previous?.candidate_gaps.some((prior) => prior.id === item.id && prior.resolution_type !== 'ASK_NOW');
    const newExecutionEvidence = branchAdjusted.dimension === 'EXECUTION_REALITY' && hasAny(latestResponse, [
      'sobrecargado', 'sobrecargada', 'trabajo pendiente', 'semanas comprometidas',
      'no hay equipo', 'equipo operativo', 'horas disponibles', 'cobertura', 'usuarios siguen',
    ]);
    if ((previous?.selected_gap?.dimension === branchAdjusted.dimension || previouslyDeferred) && branchAdjusted.resolution_type === 'ASK_NOW' && !newExecutionEvidence) {
      return {
        ...branchAdjusted,
        resolution_type: 'DEFER_TO_LATER_STAGE' as const,
        why_ask_now: undefined,
        why_not_ask: 'Local-depth guard: no second ASK in this dimension without new material evidence.',
      };
    }
    return branchAdjusted;
  });
  const lastMileGap = candidate_gaps.find((item) =>
    item.resolution_type !== 'ASK_NOW'
    && (item.current_decision_dependency === 'BLOCKING' || item.current_decision_dependency === 'CONSTRAINING')
    && item.answerability === 'USER_CAN_ANSWER'
    && item.stage_fit === 'PORTFOLIO'
    && item.execution_gap_classification !== 'LATER_STAGE_EXECUTION_DETAIL'
    && (item.decision_sensitivity === 'HIGH' || (item.decision_sensitivity === 'MEDIUM' && item.answer_shape !== 'OPEN_EXPLORATION')));
  const guardedCandidateGaps = lastMileGap
    ? candidate_gaps.map((item) => item.id === lastMileGap.id
      ? { ...item, resolution_type: 'ASK_NOW' as const, why_ask_now: 'Last-mile guard: one bounded user-answerable gap can still change the current decision.', why_not_ask: undefined }
      : item)
    : candidate_gaps;
  const selected_gap = selectGap(guardedCandidateGaps);
  const why_not_ask = guardedCandidateGaps
    .filter((item) => item.id !== selected_gap?.id)
    .map((item) => ({ gap_id: item.id, reason: item.why_not_ask ?? (item.resolution_type === 'REQUIRES_ORGANIZATIONAL_INPUT' ? 'requires organizational input' : 'lower decision impact') }));
  const trace: RationaleTraceEntry = {
    turn,
    reconsidered_dimensions: [...DIMENSIONS],
    selected_gap_id: selected_gap?.id ?? null,
    selection_basis: selected_gap
      ? selected_gap.stage_fit === 'ORGANIZATIONAL_INPUT' ? 'AUTHORITY_BOUNDARY'
        : selected_gap.stage_fit === 'STEPS_LATER_STAGE' || selected_gap.stage_fit === 'INITIATIVE' ? 'STAGE_BOUNDARY'
          : selected_gap.route_impact === 'HIGH' ? 'ROUTING_IMPACT' : 'DECISION_IMPACT'
      : 'NONE',
    dominant_competing_gap: guardedCandidateGaps.find((item) => item.id !== selected_gap?.id && item.decision_impact === 'HIGH')?.id,
    selection_tradeoff: selected_gap
      ? `Selected ${selected_gap.id} because its decision/route materiality outranks unresolved informational detail.`
      : 'No gap met the ASK_NOW threshold after authority and stage checks.',
    selection_reason: selected_gap ? 'highest decision/route materiality among unresolved ASK_NOW gaps' : 'no unresolved ASK_NOW gap remains',
    why_not_ask,
  };
  const action = nextAction(selected_gap, guardedCandidateGaps, text);
  return {
    dimensions,
    candidate_gaps: guardedCandidateGaps,
    selected_gap,
    deferred_gaps: guardedCandidateGaps.filter((item) => item.id !== selected_gap?.id),
    next_action: action,
    rationale_trace: [...(previous?.rationale_trace ?? []), trace],
  };
}

function findViolation(evaluations: DecisionReadinessEvaluation[], counterfactual?: CounterfactualMetadata): string[] {
  const violations: string[] = [];
  for (let index = 0; index < evaluations.length; index += 1) {
    const evaluation = evaluations[index];
    const trace = evaluation.rationale_trace.at(-1);
    if (!trace || trace.reconsidered_dimensions.length !== DIMENSIONS.length) violations.push('F-CROSS-DIMENSION');
    if (evaluation.next_action.type === 'ASK' && !evaluation.selected_gap) violations.push('F-UNNECESSARY-QUESTION');
    if (index > 0 && evaluations[index - 1].next_action.type === 'ASK' && evaluation.next_action.type === 'ASK') {
      const previousDimension = evaluations[index - 1].selected_gap?.dimension;
      if (previousDimension === evaluation.selected_gap?.dimension && !evaluation.selected_gap?.why_ask_now) violations.push('F-LOCAL-DEPTH');
    }
  }
  const seenOrgAsk = evaluations.slice(0, -1).some((item) => item.next_action.type === 'REQUIRE_ORGANIZATIONAL_INPUT');
  if (seenOrgAsk && evaluations.at(-1)?.next_action.type === 'ASK') violations.push('F-UNKNOWN-LOOP');
  const finalGaps = evaluations.at(-1)?.candidate_gaps ?? [];
  const observedBranch = finalGaps.find((gap) => gap.decision_branch_type !== 'UNKNOWN')?.decision_branch_type ?? 'UNKNOWN';
  if (counterfactual?.branch_type && observedBranch !== counterfactual.branch_type) violations.push('F-BRANCH-TYPE-MISCLASSIFIED');
  if ((observedBranch === 'ENABLEMENT_CHANGE' || observedBranch === 'ROUTE_CHANGE') && finalGaps.some((gap) => gap.decision_branch_type === observedBranch && gap.current_decision_dependency !== 'BLOCKING')) violations.push('F-BLOCKER-DOWNGRADED');
  if ((observedBranch === 'DETAIL_CHANGE' || observedBranch === 'NO_MATERIAL_CHANGE') && finalGaps.some((gap) => gap.decision_branch_type === observedBranch && (gap.current_decision_dependency === 'BLOCKING' || gap.decision_sensitivity === 'HIGH'))) violations.push('F-COUNTERFACTUAL-OVERUPGRADE');
  return [...new Set(violations)];
}

export function runDecisionReadinessFixture(fixture: DecisionReadinessFixture): DecisionReadinessRun {
  const evaluations: DecisionReadinessEvaluation[] = [];
  for (let index = 0; index < fixture.turns.length; index += 1) {
    evaluations.push(evaluateTurn(fixture.id, index + 1, fixture.turns.slice(0, index + 1), evaluations.at(-1), fixture.decision_counterfactual));
  }
  return {
    case_id: fixture.id,
    evaluations,
    final: evaluations.at(-1)!,
    violations: findViolation(evaluations, fixture.decision_counterfactual),
    human_review: {
      cross_dimension_prioritization: null,
      local_depth_control: null,
      explicit_unknown_handling: null,
      routing_quality: null,
      stop_quality: null,
      strategy_execution_balance: null,
    },
  };
}

export function summarizeBaselineContrast(fixture: DecisionReadinessFixture): string[] {
  const text = fixture.turns.join(' ').toLowerCase();
  const observations: string[] = ['baseline has no structured cross-dimension trace'];
  if (hasAny(text, ['no lo sé', 'no lo se', 'no sabemos', 'nadie tiene claro'])) observations.push('baseline cannot evidence unknown-loop prevention');
  if (hasAny(text, ['capacidad', 'ownership', 'usuarios siguen', 'plan anual'])) observations.push('baseline has no observable materiality-vs-routing comparison');
  return observations;
}
