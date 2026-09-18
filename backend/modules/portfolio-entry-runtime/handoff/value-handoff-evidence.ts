import type { PortfolioEntryHandoffV2 } from '../domain/handoff.schema';
import type { PortfolioEntryAnalysisV2 } from '../domain/analysis.schema';
import type { SessionExecutionResult } from '../domain/session.types';

export type ValueHandoffEvidenceV2 = {
  metric: 'value_delta';
  evaluation: 'HUMAN_REVIEW_REQUIRED';
  automatic_checks: {
    recommendation_present: boolean;
    rationale_present: boolean;
    recommendation_is_contextual: boolean;
    starteria_path_is_actionable: boolean;
    material_gaps_are_mapped: boolean;
    decision_status_is_explicit: boolean;
    repeat_only_risk: boolean;
  };
  baseline: {
    initial_input: string;
    input_terms: string[];
  };
  handoff: {
    recommendation: string | null;
    rationale: string | null;
    decision: string | 'unresolved';
    path_actions: string[];
    gap_ids: string[];
  };
  session: {
    turns: number;
    questions_total: number;
    clarification_status: string;
  };
};

/**
 * Collects machine-checkable evidence for the qualitative value_delta metric.
 * The signal is a screening aid, not a substitute for human review.
 */
export function buildValueHandoffEvidenceV2(input: {
  execution: SessionExecutionResult;
  handoff: PortfolioEntryHandoffV2;
  analysis: PortfolioEntryAnalysisV2;
}): ValueHandoffEvidenceV2 {
  const initialInput = input.execution.trace.turns[0]?.user_input ?? '';
  const inputTerms = meaningfulTerms(initialInput);
  const recommendation = input.handoff.recommended_approach?.description ?? null;
  const rationale = input.handoff.recommended_approach?.rationale ?? null;
  const recommendationTerms = meaningfulTerms(`${recommendation ?? ''} ${rationale ?? ''}`);
  const recommendationIsContextual = inputTerms.some((term) => recommendationTerms.includes(term));
  const pathActions = input.handoff.starteria_path.map((item) => item.action);
  const gapIds = input.handoff.gap_resolution_map.map((gap) => gap.gap_id);
  const materialGapsAreMapped = input.handoff.unresolved_context.every((gap) => gapIds.includes(gap.gap_id));
  const decisionStatusIsExplicit = input.handoff.decision_to_enable === 'unresolved'
    || input.handoff.decision_to_enable.value.trim().length > 0;
  const checks = {
    recommendation_present: Boolean(recommendation),
    rationale_present: Boolean(rationale),
    recommendation_is_contextual: recommendationIsContextual,
    starteria_path_is_actionable: new Set(pathActions).size >= 3,
    material_gaps_are_mapped: materialGapsAreMapped,
    decision_status_is_explicit: decisionStatusIsExplicit,
    repeat_only_risk: !recommendation || !rationale || !recommendationIsContextual,
  };
  return {
    metric: 'value_delta',
    evaluation: 'HUMAN_REVIEW_REQUIRED',
    automatic_checks: checks,
    baseline: { initial_input: initialInput, input_terms: inputTerms },
    handoff: {
      recommendation,
      rationale,
      decision: input.handoff.decision_to_enable === 'unresolved' ? 'unresolved' : input.handoff.decision_to_enable.value,
      path_actions: pathActions,
      gap_ids: gapIds,
    },
    session: {
      turns: input.execution.trace.turns.length,
      questions_total: input.execution.trace.questions_total,
      clarification_status: input.execution.trace.clarification_status,
    },
  };
}

function meaningfulTerms(value: string): string[] {
  return [...new Set(value.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9áéíóúüñ]+/i)
    .filter((term) => term.length > 3 && !STOP_WORDS.has(term)))];
}

const STOP_WORDS = new Set(['para', 'esta', 'este', 'como', 'desde', 'entre', 'sobre', 'cuando', 'debe', 'deben', 'hacer', 'antes', 'despues', 'situation']);
