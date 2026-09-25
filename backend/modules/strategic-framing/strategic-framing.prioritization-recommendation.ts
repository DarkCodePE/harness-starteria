import type {
  StrategicFramingPrioritizationRecommendationResult,
  StrategicFramingPriorityCandidate,
  StrategicFramingPriorityRecommendationItem,
  StrategicFramingProvisionalState,
  StrategicFramingRecommendationDisposition,
  StrategicFramingRecommendationEvidenceQuality,
} from './strategic-framing.types';

export const STRATEGIC_FRAMING_RECOMMENDATION_VERSION = 'sf5c-v1';

export class StrategicFramingPrioritizationRecommendationEvaluator {
  evaluate(state: StrategicFramingProvisionalState): StrategicFramingPrioritizationRecommendationResult {
    const candidates = state.prioritizationState.candidates;
    const focusSlots = state.prioritizationState.focusSlots;
    const blockerIds = new Set(candidates.filter((candidate) => matchesStructuredSignal(candidate.statementSnapshot, state.sufficiency.blockers)).map((candidate) => candidate.candidateId));
    const softGapIds = new Set(candidates.filter((candidate) => matchesStructuredSignal(candidate.statementSnapshot, state.sufficiency.softGaps)).map((candidate) => candidate.candidateId));
    const warnings: string[] = [];
    const limitations = [
      'SF-5C no dispone todavía de dimensiones estructuradas de impacto, urgencia, dependencia, coste o retorno.',
      'La recomendación es derivada y recalculable; no representa prioridad organizacional ni sustituye la disposición humana.',
      'Las dependencias no están estructuradas y no se usan para ordenar candidatos.',
      'SF-5C v1 no recomienda DISCARD sin evidencia estructurada explícita de irrelevancia.',
    ];

    if (candidates.length === 0) limitations.push('No hay candidatos de priorización persistidos; el GET no crea ni inicializa candidatos.');
    if (focusSlots === null) warnings.push('La capacidad de foco es desconocida; debe aclararse antes de recomendar ADDRESS NOW.');
    if (focusSlots === 0) warnings.push('La capacidad de foco declarada es cero; no se recomienda ADDRESS NOW.');

    const materialCandidates = candidates.filter((candidate) => blockerIds.has(candidate.candidateId));
    const capacity = focusSlots === null ? 'unknown' : focusSlots === 0 ? 'none' : focusSlots <= 1 ? 'limited' : 'available';
    let addressNow = new Set<string>();
    let tiedAtCutoff = new Set<string>();

    if (focusSlots !== null && focusSlots > 0 && materialCandidates.length <= focusSlots) {
      addressNow = new Set(materialCandidates.map((candidate) => candidate.candidateId));
    } else if (focusSlots !== null && focusSlots > 0 && materialCandidates.length > focusSlots) {
      tiedAtCutoff = new Set(materialCandidates.map((candidate) => candidate.candidateId));
      warnings.push('Hay más candidatos con evidencia estructurada equivalente que capacidad disponible; existe un empate en el corte, se requiere aclaración humana y no se elige un ganador arbitrario.');
    }

    const recommendations = candidates.map((candidate) => this.item(candidate, state, {
      blocker: blockerIds.has(candidate.candidateId),
      softGap: softGapIds.has(candidate.candidateId),
      addressNow: addressNow.has(candidate.candidateId),
      tiedAtCutoff: tiedAtCutoff.has(candidate.candidateId),
      capacity,
    }));

    return {
      stateId: state.id,
      stateVersion: state.version,
      sourceMode: state.sourceMode,
      focusSlots,
      capacityStatus: capacity,
      recommendations,
      warnings,
      limitations,
      recommendationVersion: STRATEGIC_FRAMING_RECOMMENDATION_VERSION,
    };
  }

  private item(candidate: StrategicFramingPriorityCandidate, state: StrategicFramingProvisionalState, input: { blocker: boolean; softGap: boolean; addressNow: boolean; tiedAtCutoff: boolean; capacity: 'unknown' | 'none' | 'limited' | 'available' }): StrategicFramingPriorityRecommendationItem {
    let recommendedDisposition: StrategicFramingRecommendationDisposition = 'observe';
    const rationale: string[] = [];
    const whyNow: string[] = [];
    const whyNotNow: string[] = [];

    if (input.tiedAtCutoff) {
      recommendedDisposition = 'needs_clarification';
      rationale.push('El candidato correlaciona con un blocker estructurado, pero la evidencia disponible no distingue entre los candidatos empatados en el límite de capacidad.');
      whyNotNow.push('La capacidad no permite recomendar ADDRESS NOW para todos los candidatos empatados sin una decisión humana adicional.');
    } else if (input.addressNow) {
      recommendedDisposition = 'address_now';
      rationale.push('El statement del candidato coincide exactamente con un blocker estructurado vigente.');
      whyNow.push('El blocker aporta una señal estructurada de relevancia actual dentro del framing guardado.');
    } else if (input.capacity === 'unknown' && input.blocker) {
      recommendedDisposition = 'needs_clarification';
      rationale.push('El candidato correlaciona con un blocker estructurado, pero la capacidad de foco no está declarada.');
      whyNotNow.push('Se debe aclarar la capacidad antes de recomendar cuántos candidatos pueden abordarse ahora.');
    } else {
      if (input.softGap) rationale.push('El statement del candidato coincide exactamente con un soft-gap estructurado; permanece visible para observación.');
      else rationale.push('No hay evidencia estructurada suficiente para distinguir una prioridad actual defendible.');
      if (input.capacity === 'none') whyNotNow.push('La capacidad de foco declarada es cero.');
      else whyNotNow.push('No se infiere impacto, urgencia, dependencia, coste o retorno desde el texto del candidato.');
    }

    const sourceRefs = candidate.sourceRefs.filter((ref): ref is string => typeof ref === 'string' && ref.length > 0);
    return {
      candidateId: candidate.candidateId,
      kind: candidate.kind,
      statementSnapshot: candidate.statementSnapshot,
      recommendedDisposition,
      recommendedRank: recommendedDisposition === 'address_now' ? 1 : input.blocker ? 1 : null,
      rationale,
      whyNow,
      whyNotNow,
      sourceRefs,
      evidenceQuality: evidenceQuality(candidate),
      humanDisposition: candidate.humanDisposition,
      recommendationSnapshot: {
        recommendationVersion: STRATEGIC_FRAMING_RECOMMENDATION_VERSION,
        inputStateVersion: state.version,
        recommendedDisposition,
        rationale: [...rationale],
        sourceRefs: [...sourceRefs],
      },
    };
  }
}

function normalize(value: string): string { return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase(); }
function matchesStructuredSignal(statement: string, signals: string[]): boolean { const normalized = normalize(statement); return normalized.length > 0 && signals.some((signal) => normalize(signal) === normalized); }

function evidenceQuality(candidate: StrategicFramingPriorityCandidate): StrategicFramingRecommendationEvidenceQuality {
  const refs = candidate.sourceRefs.filter((ref) => typeof ref === 'string' && ref.length > 0).length;
  const strongProvenance = candidate.provenance === 'user_confirmed' || candidate.provenance === 'extracted';
  if (refs >= 2 && candidate.confidence === 'high' && strongProvenance && !candidate.uncertainty) return 'high';
  if (refs > 0 && candidate.confidence !== 'low' && !candidate.uncertainty) return 'medium';
  return 'low';
}
