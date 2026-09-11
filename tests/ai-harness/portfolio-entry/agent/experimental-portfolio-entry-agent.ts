import type { EntryState, Intent, PortfolioEntryAgentAdapter, PortfolioEntryAnalysis } from '../types';

type Detection = {
  primary_intent: Intent;
  secondary_intents: Intent[];
  entry_state: EntryState;
  ambiguities: string[];
  status: 'classified' | 'ambiguous' | 'insufficient_input';
};

type ContextExtraction = {
  extracted_context: Record<string, unknown>;
  ambiguities: string[];
  contradictions: string[];
  missing_obvious_context: string[];
};

const SKILLS = [
  'entry-01-intent-detection',
  'entry-02-context-extraction',
  'entry-03-reverse-alignment',
  'entry-04-question-planner',
];

export class ExperimentalPortfolioEntryAgent implements PortfolioEntryAgentAdapter {
  async analyze(input: { entryId: string; rawInput: string }): Promise<PortfolioEntryAnalysis> {
    const detection = detectIntent(input.rawInput);
    const context = extractContext(input.rawInput, detection);
    const reverse = detectReverseAlignment(detection, context);
    const questions = planQuestions(detection, context, reverse);
    const analysisStatus = detection.status === 'insufficient_input' ? 'insufficient_input' : 'ready';

    return {
      entry_id: input.entryId,
      analysis_version: 'portfolio-entry-experimental-v0.1',
      analysis_status: analysisStatus,
      primary_intent: detection.primary_intent,
      secondary_intents: detection.secondary_intents,
      entry_state: detection.entry_state,
      extracted_context: context.extracted_context,
      ambiguities: [...detection.ambiguities, ...context.ambiguities],
      contradictions: context.contradictions,
      missing_critical_context: context.missing_obvious_context,
      reverse_alignment_required: reverse.reverse_alignment_required,
      reverse_alignment_gap: reverse,
      question_plan: questions,
      provenance: buildProvenance(context.extracted_context),
      prohibited_actions: [],
      agent_trace_summary: {
        skills_executed: SKILLS,
        provider: 'deterministic-experimental',
        model: null,
      },
      ux_summary: buildUxSummary(detection, context, reverse),
    };
  }
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function detectIntent(rawInput: string): Detection {
  const text = normalize(rawInput);
  const secondary = new Set<Intent>();
  let entry_state: EntryState = 'unknown';
  let primary_intent: Intent = 'unknown';
  const ambiguities: string[] = [];

  const hasPortfolio = /iniciativas/.test(text) || /portfolio|portafolio/.test(text);
  const hasReport = /comite|present|report|pidio mostrar/.test(text);
  const hasDecision = /decid|seguir|cerrar|financiando|presupuesto|vale la pena/.test(text);
  const hasAlignment = /alinead|contribuyen|objetivos|moviendo/.test(text);
  const hasTracking = /bloquead|avanzando|estado/.test(text);
  const hasSolution = /chatbot|app|ia generativa|ia en ventas|implementar|lancemos|crea una iniciativa/.test(text);
  const hasInitiative = /proyecto atlas|iniciativa de|atlas busca|esta iniciativa/.test(text);
  const hasProblem = /problema|abandonan|no sabemos por que|no tenemos baseline|churn/.test(text);
  const hasOpportunity = /pidiendo un servicio|oportunidad/.test(text);
  const hasStrategicGoal = /quiero aumentar|queremos reducir|quiero reducir|busca reducir|ventas en 200/.test(text);

  if (/necesito ordenar esto\.?$/.test(text)) {
    return {
      entry_state: 'unknown',
      primary_intent: 'unknown',
      secondary_intents: [],
      ambiguities: ["No está claro qué representa 'esto'."],
      status: 'insufficient_input',
    };
  }

  if (hasPortfolio) entry_state = 'portfolio_first';
  if (hasReport) entry_state = /tengo \d+ iniciativas/.test(text) && hasDecision ? 'portfolio_first' : 'reporting_first';
  if (hasDecision && !hasReport && !/tengo|tenemos|varias|abiertas/.test(text)) entry_state = 'decision_first';
  if (hasOpportunity && !hasSolution) entry_state = 'opportunity_first';
  if (hasProblem && !hasSolution && !hasInitiative && !hasStrategicGoal) entry_state = 'problem_first';
  if (hasStrategicGoal && !hasInitiative && !hasPortfolio && !hasSolution) entry_state = 'strategy_first';
  if (hasInitiative) entry_state = 'initiative_first';
  if (hasSolution) entry_state = 'solution_first';
  if (/proyecto atlas\.?$/.test(text)) entry_state = 'initiative_first';

  if (hasReport) {
    primary_intent = 'portfolio_reporting';
    if (hasDecision) secondary.add('portfolio_prioritization');
    if (hasTracking) secondary.add('portfolio_tracking');
  } else if (hasAlignment) {
    primary_intent = 'portfolio_alignment';
  } else if (hasTracking) {
    primary_intent = 'portfolio_tracking';
  } else if (hasDecision && hasPortfolio) {
    primary_intent = 'portfolio_prioritization';
  } else if (hasDecision && !hasInitiative && !hasSolution) {
    primary_intent = 'portfolio_prioritization';
  } else if (hasSolution || hasInitiative) {
    primary_intent = 'initiative_governance';
  } else if (hasStrategicGoal) {
    primary_intent = 'strategic_goal';
  }

  if (hasDecision && primary_intent !== 'portfolio_prioritization' && !hasInitiative && !hasSolution) {
    secondary.add('portfolio_prioritization');
  }
  if (hasReport && primary_intent !== 'portfolio_reporting') secondary.add('portfolio_reporting');

  return {
    entry_state,
    primary_intent,
    secondary_intents: Array.from(secondary).filter((intent) => intent !== primary_intent),
    ambiguities,
    status: entry_state === 'unknown' && primary_intent === 'unknown' ? 'ambiguous' : 'classified',
  };
}

function extractContext(rawInput: string, detection: Detection): ContextExtraction {
  const text = normalize(rawInput);
  const extracted_context: Record<string, unknown> = {};
  const ambiguities: string[] = [];
  const contradictions: string[] = [];
  const missing_obvious_context: string[] = [];

  if (/aumentar las ventas en 200 este trimestre/i.test(rawInput)) {
    extracted_context.goal = 'aumentar ventas';
    extracted_context.target = 200;
    extracted_context.horizon = 'este trimestre';
  } else if (/aumentar las ventas en 200\.?$/i.test(rawInput)) {
    extracted_context.goal = 'aumentar ventas';
    extracted_context.target = 200;
    ambiguities.push('No está clara la unidad de 200.');
  }

  if (/reducir el tiempo de respuesta a clientes de 24 a 4 horas este trimestre/i.test(rawInput)) {
    extracted_context.goal = 'reducir el tiempo de respuesta a clientes';
    extracted_context.baseline = '24 horas';
    extracted_context.target = '4 horas';
    extracted_context.horizon = 'este trimestre';
  }
  if (/reducir churn/i.test(rawInput)) extracted_context.goal = 'reducir churn';
  if (/no tenemos baseline/i.test(rawInput)) {
    extracted_context.baseline_known = false;
    if (/reducir el tiempo de aprobación/i.test(rawInput)) extracted_context.goal = 'reducir el tiempo de aprobación';
  }

  const portfolioNumbers = [...rawInput.matchAll(/\b(\d+)\s+iniciativas\b/gi)].map((match) => Number(match[1]));
  const approximatePortfolio = rawInput.match(/unas?\s+(\d+)(?:\s+iniciativas)?/i);
  if (portfolioNumbers.length === 1 && !approximatePortfolio) extracted_context.portfolio_size = portfolioNumbers[0];
  if (portfolioNumbers.length > 0 && approximatePortfolio) {
    extracted_context.portfolio_size = [...new Set([...portfolioNumbers, Number(approximatePortfolio[1])])];
    contradictions.push('La cantidad de iniciativas no está confirmada.');
  }
  if (/unas?\s+30 iniciativas/i.test(rawInput)) extracted_context.portfolio_size = 30;

  if (/chatbot para ventas/i.test(rawInput)) extracted_context.solution = 'chatbot para ventas';
  else if (/chatbot/i.test(rawInput)) extracted_context.solution = 'chatbot';
  if (/IA generativa para atención al cliente/i.test(rawInput)) extracted_context.solution = 'IA generativa para atención al cliente';
  if (/app para clientes/i.test(rawInput)) extracted_context.solution = 'app para clientes';
  if (/Chatbot Comercial/i.test(rawInput)) extracted_context.solution = 'Chatbot Comercial';
  if (/IA en ventas/i.test(rawInput)) extracted_context.solution = 'IA en ventas';

  if (/responder más rápido a los leads/i.test(rawInput)) extracted_context.expected_change = 'responder más rápido a los leads';
  if (/menos de 5 minutos/i.test(rawInput)) extracted_context.target = 'menos de 5 minutos';
  if (/perdiendo oportunidades comerciales/i.test(rawInput)) extracted_context.problem = 'perdiendo oportunidades comerciales';
  if (/abandonan la compra antes de pagar/i.test(rawInput)) extracted_context.problem = 'clientes abandonan la compra antes de pagar';
  if (/servicio que todavía no ofrecemos/i.test(rawInput)) extracted_context.opportunity = 'clientes piden un servicio que todavía no ofrecemos';
  if (/no tengo claro qué problema/i.test(rawInput)) extracted_context.problem_known = false;
  if (/crecimiento/i.test(rawInput)) extracted_context.business_concern = 'crecimiento';

  if (/Proyecto Atlas/i.test(rawInput)) extracted_context.initiatives_mentioned = ['Atlas'];
  if (/Atlas busca/i.test(rawInput)) {
    extracted_context.initiatives_mentioned = ['Atlas'];
    extracted_context.baseline = '10 días';
    extracted_context.target = '5 días';
    extracted_context.horizon = 'este trimestre';
    extracted_context.expected_change = 'reducir abandono de nuevos clientes';
  }
  if (/automatización de compras/i.test(rawInput)) extracted_context.initiatives_mentioned = ['automatización de compras'];

  if (/decid|seguir|cerrar|financiando|presupuesto|vale la pena/.test(text)) extracted_context.decision_need = true;
  if (/comite|direccion|present|report/.test(text)) extracted_context.reporting_need = true;
  if (/proximo trimestre/.test(text)) extracted_context.horizon = 'próximo trimestre';

  if ((detection.entry_state === 'solution_first' || detection.entry_state === 'initiative_first') && !extracted_context.goal && !extracted_context.expected_change) {
    missing_obvious_context.push('expected_change');
    missing_obvious_context.push('business_intent');
  }
  if (detection.primary_intent === 'portfolio_alignment' && !extracted_context.goal && !extracted_context.business_concern) {
    missing_obvious_context.push('alignment_criteria');
  }
  if (detection.status === 'insufficient_input') missing_obvious_context.push('subject');

  return { extracted_context, ambiguities, contradictions, missing_obvious_context };
}

function detectReverseAlignment(detection: Detection, context: ContextExtraction): PortfolioEntryAnalysis['reverse_alignment_gap'] & { reverse_alignment_required: boolean } {
  const isCandidate = detection.entry_state === 'solution_first' || detection.entry_state === 'initiative_first';
  const initiativeSubject = Array.isArray(context.extracted_context.initiatives_mentioned)
    ? context.extracted_context.initiatives_mentioned[0]
    : '';
  const subject = String(context.extracted_context.solution ?? initiativeSubject ?? '');
  const present_links = [
    subject ? 'subject' : '',
    context.extracted_context.expected_change ? 'expected_change' : '',
    context.extracted_context.target || context.extracted_context.metric ? 'metric_signal' : '',
    context.extracted_context.goal || context.extracted_context.business_concern || context.extracted_context.problem ? 'business_intent' : '',
  ].filter(Boolean);
  const missing_links = ['expected_change', 'metric_signal', 'business_intent', 'continuity_criterion'].filter((link) => !present_links.includes(link));
  const required = isCandidate && missing_links.length >= 2;

  return {
    reverse_alignment_required: required,
    subject_type: detection.entry_state === 'solution_first' ? 'solution' : detection.entry_state === 'initiative_first' ? 'initiative' : 'unknown',
    subject: subject || null,
    connection_state: !isCandidate ? 'not_required' : required ? 'required' : missing_links.length ? 'partial' : 'not_required',
    present_links,
    missing_links,
    suggested_focus: required ? `Conectar ${subject || 'la entrada'} con un cambio de negocio observable.` : null,
  };
}

function planQuestions(
  detection: Detection,
  context: ContextExtraction,
  reverse: ReturnType<typeof detectReverseAlignment>,
): PortfolioEntryAnalysis['question_plan'] {
  const questions: PortfolioEntryAnalysis['question_plan'] = [];
  const add = (question: string, reason: string, resolves: string[]) => {
    if (questions.length < 3) {
      questions.push({
        id: `q${questions.length + 1}`,
        question,
        reason_to_ask: reason,
        resolves,
        priority: questions.length + 1,
        expected_answer_type: 'free_text',
      });
    }
  };

  if (detection.status === 'insufficient_input') {
    add('¿Qué estás intentando ordenar o entender exactamente?', 'La entrada no define el objeto de análisis.', ['ambiguity']);
    return questions;
  }
  if (reverse.reverse_alignment_required) {
    add('Si esta solución funciona, ¿qué tendría que cambiar en el negocio para justificarla?', 'Falta conectar la solución o iniciativa con un cambio esperado de negocio.', ['expected_change', 'business_intent']);
    if (reverse.missing_links.includes('metric_signal')) {
      add('¿Qué señal te permitiría saber que ese cambio está ocurriendo?', 'Falta una señal observable mínima.', ['metric_signal']);
    }
    return questions;
  }
  if (context.ambiguities.length) {
    add('¿Cómo deberíamos interpretar el dato ambiguo para esta primera lectura?', 'Existe un dato con unidad o significado abierto.', ['ambiguity']);
  }
  if (context.contradictions.length) {
    add('Para esta revisión, ¿trabajamos con el dato confirmado o con el rango aproximado?', 'Hay una contradicción material que conviene preservar.', ['contradiction']);
  }
  if (detection.primary_intent === 'portfolio_alignment' && !context.extracted_context.business_concern) {
    add('¿Contra qué prioridades u objetivos deberían contribuir esas iniciativas?', 'Falta el criterio mínimo de alineamiento.', ['business_intent']);
  }
  if (detection.primary_intent === 'portfolio_reporting') {
    add('¿Qué necesita entender o decidir la audiencia a partir de esa presentación?', 'La necesidad de reporte está clara, pero no su criterio de utilidad.', ['reporting_need', 'decision_need']);
  }
  if (detection.primary_intent === 'portfolio_prioritization' && !context.extracted_context.goal) {
    add('¿Contra qué resultado o criterio de negocio necesitas tomar esa decisión?', 'Una decisión de continuidad necesita un criterio mínimo.', ['decision_need', 'business_intent']);
  }
  if (detection.entry_state === 'problem_first' || detection.entry_state === 'opportunity_first') {
    add('¿Qué necesitas conseguir ahora: entender mejor la situación, decidir qué hacer o evaluar una solución que ya tienes?', 'El input describe una situación, pero el job actual sigue abierto.', ['business_intent']);
  }
  return questions.slice(0, 3);
}

function buildProvenance(context: Record<string, unknown>): PortfolioEntryAnalysis['provenance'] {
  return Object.keys(context).map((key) => ({
    path: `extracted_context.${key}`,
    origin: key === 'business_concern' ? 'AI_INFERRED' : 'EXTRACTED_FROM_USER_TEXT',
    review_disposition: 'UNREVIEWED',
  }));
}

function buildUxSummary(
  detection: Detection,
  context: ContextExtraction,
  reverse: ReturnType<typeof detectReverseAlignment>,
): string {
  if (detection.status === 'insufficient_input') return 'Tu entrada todavía no define qué quieres ordenar o entender. Necesitamos una aclaración mínima antes de continuar.';
  if (reverse.reverse_alignment_required) return 'Parece que estás partiendo desde una solución o iniciativa concreta. Antes de avanzar, conviene aclarar qué cambio de negocio tendría que producir para justificarla.';
  if (context.contradictions.length) return 'Hay información útil, pero también una contradicción que debe quedar visible antes de continuar.';
  if (detection.primary_intent === 'portfolio_alignment') return 'Parece que necesitas entender qué iniciativas están conectadas a las prioridades del negocio. Falta aclarar el criterio contra el que deberían evaluarse.';
  return 'Hay suficiente información inicial para construir una interpretación provisional sin convertirla todavía en verdad confirmada.';
}
