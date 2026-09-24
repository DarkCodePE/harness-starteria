export type NormalizedAction = 'ASK' | 'STOP' | 'ROUTE' | 'REQUIRE_ORGANIZATIONAL_INPUT' | 'NOT_AVAILABLE';
export type DecisionLossSeverity = 'NONE' | 'MINOR' | 'MATERIAL' | 'SEVERE' | 'NOT_AVAILABLE';

export type BaselineNormalizedTrace = {
  case_id: string;
  selected_question_or_gap: string | null;
  inferred_dimension: string | null;
  action: NormalizedAction;
  question_count: number | null;
  consecutive_same_dimension_count: number | null;
  explicit_unknown_reasked: boolean | null;
  stop_state: 'CORRECT_STOP' | 'PREMATURE_STOP' | 'LATE_STOP' | 'NOT_AVAILABLE';
  routing_state: 'CORRECT_ROUTE' | 'PREMATURE_ROUTE' | 'MISSED_ROUTE' | 'NOT_AVAILABLE';
  step_leakage: boolean | null;
  authority_issue: boolean | null;
  evidence_gap_preserved: boolean | null;
  execution_status: 'EXECUTED' | 'BASELINE_NOT_EXECUTABLE';
  source: string;
};

export type CommonHarnessEvaluation = {
  case_id: string;
  expectation_mode: 'STRICT_ACTION' | 'INVARIANT_BASED' | 'BASELINE_NOT_EXECUTABLE';
  action_result: 'PASS' | 'FAIL' | 'ACCEPTABLE_VARIATION' | 'BASELINE_NOT_EXECUTABLE';
  invariant_result: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  questions_to_sufficiency: number | null;
  local_depth_issue: boolean | null;
  explicit_unknown_loop: boolean | null;
  premature_route: boolean | null;
  unnecessary_question: boolean | null;
  premature_stop: boolean | null;
  late_stop: boolean | null;
  authority_error: boolean | null;
  evidence_error: boolean | null;
  step_leakage: boolean | null;
  decision_loss_severity: DecisionLossSeverity;
};

const actionOf = (value: unknown): NormalizedAction => {
  if (value === 'ASK' || value === 'STOP' || value === 'ROUTE' || value === 'REQUIRE_ORGANIZATIONAL_INPUT') return value;
  return 'NOT_AVAILABLE';
};

/**
 * Baseline-only normalization. It consumes observable historical output when
 * present and never infers Decision Readiness fields from missing output.
 */
export function normalizeBaselineObservable(input: {
  case_id: string;
  action?: unknown;
  selected_question_or_gap?: string | null;
  inferred_dimension?: string | null;
  question_count?: number | null;
  consecutive_same_dimension_count?: number | null;
  explicit_unknown_reasked?: boolean | null;
  stop_state?: BaselineNormalizedTrace['stop_state'];
  routing_state?: BaselineNormalizedTrace['routing_state'];
  step_leakage?: boolean | null;
  authority_issue?: boolean | null;
  evidence_gap_preserved?: boolean | null;
  source: string;
}): BaselineNormalizedTrace {
  return {
    case_id: input.case_id,
    selected_question_or_gap: input.selected_question_or_gap ?? null,
    inferred_dimension: input.inferred_dimension ?? null,
    action: actionOf(input.action),
    question_count: input.question_count ?? null,
    consecutive_same_dimension_count: input.consecutive_same_dimension_count ?? null,
    explicit_unknown_reasked: input.explicit_unknown_reasked ?? null,
    stop_state: input.stop_state ?? 'NOT_AVAILABLE',
    routing_state: input.routing_state ?? 'NOT_AVAILABLE',
    step_leakage: input.step_leakage ?? null,
    authority_issue: input.authority_issue ?? null,
    evidence_gap_preserved: input.evidence_gap_preserved ?? null,
    execution_status: 'EXECUTED',
    source: input.source,
  };
}

export function baselineNotExecutable(case_id: string, source: string): BaselineNormalizedTrace {
  return normalizeBaselineObservable({ case_id, source: `${source} — no replayable observable trace` });
}
