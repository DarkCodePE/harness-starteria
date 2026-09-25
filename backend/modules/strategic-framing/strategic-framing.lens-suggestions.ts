import type {
  StrategicFramingProvisionalState,
  StrategicLensKey,
  StrategicLensSuggestion,
  StrategicLensSuggestionResult,
} from './strategic-framing.types';

type Candidate = Omit<StrategicLensSuggestion, 'sourceRefs' | 'confidence'> & {
  confidence: StrategicLensSuggestion['confidence'];
  refs: string[];
};

const labels: Record<StrategicLensKey, string> = {
  value_outcome: 'Value / Outcome',
  customer_opportunity: 'Customer / Opportunity',
  process_capability: 'Process / Capability',
  learning_evidence: 'Learning / Evidence',
  financial: 'Financial',
  culture_organization: 'Culture / Organization',
  technology: 'Technology',
  risk_compliance: 'Risk / Compliance',
  ecosystem_partners: 'Ecosystem / Partners',
};

const order: StrategicLensKey[] = [
  'value_outcome', 'customer_opportunity', 'process_capability', 'learning_evidence',
  'financial', 'culture_organization', 'technology', 'risk_compliance', 'ecosystem_partners',
];

const text = (value: unknown): string => typeof value === 'string' ? value.trim().toLowerCase() : '';
const present = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;

export class StrategicFramingLensSuggestionEvaluator {
  evaluate(state: StrategicFramingProvisionalState, now: () => Date = () => new Date()): StrategicLensSuggestionResult {
    const candidates: Candidate[] = [];
    const signal = text(state.movementSignalStatus);
    const sufficiencyText = [...state.sufficiency.blockers, ...state.sufficiency.softGaps, ...state.sufficiency.optionalContext].map(text).join(' ');
    const allText = [state.intendedMovement, state.whyItMatters, state.decisionToEnable, state.horizonContext, state.rationaleUncertainty, sufficiencyText, state.parentContext.label].map(text).join(' ');
    const uncertainty = state.sufficiency.status === 'insufficient' || state.sufficiency.status === 'conflicting' || state.sufficiency.status === 'unknown';
    const refs = trustedRefs(state);
    const hasSignalUncertainty = !signal || ['unknown', 'conflicting', 'suggested'].includes(signal);
    const weakOutcome = !present(state.intendedMovement) || !present(state.whyItMatters) || hasSignalUncertainty || (uncertainty && /(outcome|valor|value|resultado|impact|clar|movimiento)/.test(sufficiencyText));

    if (weakOutcome) candidates.push(this.candidate('value_outcome', state, refs,
      'El recorrido entre el movimiento planteado y el resultado que importa todavía no está suficientemente claro.',
      '¿Qué resultado material debería cambiar y cómo sabríamos que el movimiento está funcionando?', uncertainty ? 'medium' : 'low'));

    if (hasSignalUncertainty || (uncertainty && /(evidence|evidencia|signal|señal|proxy|knowledge|conoc)/.test(sufficiencyText)) || (state.scopeAssessment.confidence === 'low' && present(state.rationaleUncertainty))) {
      candidates.push(this.candidate('learning_evidence', state, refs,
        'La señal o evidencia disponible no permite todavía sostener con confianza la dirección propuesta.',
        '¿Qué evidencia observable cambiaría la decisión o reduciría esta incertidumbre?', 'medium'));
    }

    const customerEvidence = /(customer|cliente|adopt|adopci|usuario|user|market|mercado|opportun|oportun)/.test(allText);
    if (customerEvidence && (uncertainty || hasSignalUncertainty || state.parentStatus === 'unresolved')) candidates.push(this.candidate('customer_opportunity', state, refs,
      'Hay incertidumbre material sobre la oportunidad, adopción o necesidad a la que responde el movimiento.',
      '¿Qué necesidad u oportunidad de cliente tendría que confirmarse para avanzar?', 'medium'));

    const processEvidence = /(process|proceso|capabil|capacidad|operat|operativ|execution|ejecuci|bottleneck|cuello|dependenc)/.test(allText);
    if (processEvidence && (uncertainty || state.scopeAssessment.confidence !== 'high')) candidates.push(this.candidate('process_capability', state, refs,
      'El avance parece depender de una capacidad, dependencia o restricción operativa que conviene hacer explícita.',
      '¿Qué capacidad o dependencia está limitando actualmente el resultado?', 'medium'));

    this.addSpecialized(candidates, state, refs, allText);
    const depthHint = this.depth(state, candidates.length, allText);
    const suggestions = candidates
      .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence) || order.indexOf(a.lens) - order.indexOf(b.lens))
      .map(({ refs: sourceRefs, ...candidate }) => ({ ...candidate, sourceRefs }));
    return { stateId: state.id, stateVersion: state.version, sourceMode: state.sourceMode, depthHint, suggestions, generatedAt: now().toISOString() };
  }

  private candidate(lens: StrategicLensKey, state: StrategicFramingProvisionalState, refs: string[], reason: string, materialQuestion: string, confidence: StrategicLensSuggestion['confidence']): Candidate {
    return { lens, label: labels[lens], reason, materialQuestion, confidence: refs.length === 0 ? 'low' : confidence, refs: refs.slice(0, 3) };
  }

  private addSpecialized(candidates: Candidate[], state: StrategicFramingProvisionalState, refs: string[], allText: string): void {
    const add = (lens: StrategicLensKey, reason: string, question: string) => candidates.push(this.candidate(lens, state, refs, reason, question, 'medium'));
    const material = state.sufficiency.status !== 'sufficient' || present(state.decisionToEnable) || present(state.rationaleUncertainty);
    if (material && /(cost|costo|budget|presupuesto|invest|inversi|return|retorno|financial|financ)/.test(allText)) add('financial', 'Hay contexto financiero o de inversión conectado con una decisión, restricción o resultado.', '¿Qué evidencia cambiaría la decisión sobre esta inversión o coste?');
    if (material && /(culture|cultura|organiz|incentiv|incentivo|ownership|responsab|operating model|cambio)/.test(allText)) add('culture_organization', 'El resultado depende materialmente de una capacidad organizativa, responsabilidad o cambio de modelo operativo.', '¿Qué responsabilidad, incentivo o capacidad organizativa tendría que estar disponible?');
    if (material && /(technolog|tecnolog|data|dato|architect|arquitect|system|sistema|feasib|technical|técnic)/.test(allText)) add('technology', 'Existe una dependencia técnica, de datos o de factibilidad conectada con el encuadre actual.', '¿Qué dependencia técnica o de datos podría cambiar esta decisión?');
    if (material && /(risk|riesgo|compliance|cumpl|legal|regulat|security|segur|control)/.test(allText)) add('risk_compliance', 'Hay una restricción material de riesgo, regulación, control, legalidad o seguridad.', '¿Qué riesgo o control debe resolverse antes de comprometer el resultado?');
    if (material && /(partner|socio|proveedor|provider|ecosystem|ecosistema|external|externo)/.test(allText)) add('ecosystem_partners', 'El movimiento depende materialmente de un actor externo, proveedor o relación de ecosistema.', '¿Qué dependencia externa tendría que confirmarse o gestionarse para avanzar?');
  }

  private depth(state: StrategicFramingProvisionalState, count: number, allText: string): StrategicLensSuggestionResult['depthHint'] {
    const complex = state.sufficiency.status === 'conflicting' || state.sufficiency.blockers.length > 1 || count >= 4 || /(invest|inversi|govern|gobern|dependenc|conflict|conflicto)/.test(allText);
    if (complex) return 'deep';
    if (state.sufficiency.status === 'sufficient' && count === 0 && state.scopeAssessment.confidence === 'high') return 'light';
    return 'standard';
  }
}

function trustedRefs(state: StrategicFramingProvisionalState): string[] {
  const refs = [...state.sourceRefs, ...state.parentContext.sourceRefs, ...state.scopeAssessment.provenance, ...state.provenance.map((item) => item.sourceRef)];
  return [...new Set(refs.filter((ref): ref is string => typeof ref === 'string' && ref.length > 0))];
}

function confidenceRank(value: StrategicLensSuggestion['confidence']): number { return value === 'high' ? 3 : value === 'medium' ? 2 : 1; }
