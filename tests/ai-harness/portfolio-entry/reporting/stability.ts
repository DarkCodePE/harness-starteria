import type { EvaluatedPortfolioEntryResultV2 } from '../evaluator/evaluation-types-v0.2';
import type { PortfolioEntryHandoffV2 } from '../schemas/handoff.schema';
import type { SessionTrace } from '../session/session-types';

export type LiveRunObservation = {
  case_id: string;
  repeat_index: number;
  trace?: SessionTrace;
  handoff?: PortfolioEntryHandoffV2 | null;
  evaluated?: EvaluatedPortfolioEntryResultV2;
};

export type StabilitySummary = {
  case_id: string;
  repeat_count: number;
  stable: boolean;
  values: {
    primary_intent: string[];
    initial_entry_state: string[];
    final_current_frame: string[];
    reverse_alignment: string[];
    question_counts: number[];
    quick_questions_total: number[];
    handoff_status: string[];
    hard_failures: boolean[];
    failure_codes: string[][];
    contract_result: string[];
  };
};

export function summarizeStability(observations: LiveRunObservation[]): StabilitySummary[] {
  const byCase = new Map<string, LiveRunObservation[]>();
  for (const observation of observations) {
    byCase.set(observation.case_id, [...(byCase.get(observation.case_id) ?? []), observation]);
  }

  return [...byCase.entries()].map(([caseId, caseObservations]) => {
    const values: StabilitySummary['values'] = {
      primary_intent: caseObservations.map((item) => item.trace?.turns.at(-1)?.intent.primary_intent ?? 'missing'),
      initial_entry_state: caseObservations.map((item) => item.trace?.turns[0]?.initial_entry_state ?? 'missing'),
      final_current_frame: caseObservations.map((item) => item.trace?.turns.at(-1)?.current_frame ?? 'missing'),
      reverse_alignment: caseObservations.map((item) => String(item.trace?.turns.at(-1)?.reverse_alignment.status ?? item.trace?.turns.at(-1)?.reverse_alignment.required ?? 'missing')),
      question_counts: caseObservations.map((item) => item.trace?.questions_total ?? -1),
      quick_questions_total: caseObservations.map((item) => item.trace?.quick_questions_total ?? -1),
      handoff_status: caseObservations.map((item) => item.handoff?.handoff_status ?? 'missing'),
      hard_failures: caseObservations.map((item) => item.evaluated?.hard_failure ?? true),
      failure_codes: caseObservations.map((item) => item.evaluated?.failure_codes ?? ['missing']),
      contract_result: caseObservations.map((item) => item.evaluated?.contract_result ?? 'missing'),
    };

    return {
      case_id: caseId,
      repeat_count: caseObservations.length,
      stable: Object.values(values).every((items) => new Set(items.map((item) => JSON.stringify(item))).size <= 1),
      values,
    };
  });
}
