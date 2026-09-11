import type { PortfolioEntryFixtureV2 } from '../schemas/fixture.schema';

export type ContractResultV2 = 'PASS' | 'REVIEW' | 'FAIL';
export type HypothesisResultV2 = 'SUPPORTED' | 'INCONCLUSIVE' | 'CONTRADICTED' | 'N/A';
export type HardCheckStatusV2 = 'PASS' | 'FAIL' | 'NOT_EVALUABLE';
export type HardCheckSeverityV2 = 'HARD_FAILURE' | 'WARNING' | 'INFO';
export type TaxonomyStatusV2 =
  | 'ACTIVE_AUTOMATIC_PHASE_3'
  | 'DEFINED_BUT_DEFERRED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'HANDOFF_REQUIRED';

export type FailureCodeV2 =
  | 'F-INTENT'
  | 'F-ENTRY_STATE'
  | 'F-HALLUCINATION'
  | 'F-PROVENANCE'
  | 'F-REVERSE_ALIGNMENT'
  | 'F-QUESTION_OVERLOAD'
  | 'F-QUESTION_WEAK'
  | 'F-CANONICALIZATION'
  | 'F-AUTHORITY'
  | 'F-STEP_LEAK'
  | 'F-UX'
  | 'F-SCHEMA'
  | 'F-EXECUTION'
  | 'F-INITIAL_STATE_MUTATION'
  | 'F-CURRENT_FRAME_STAGNATION'
  | 'F-CONTEXT_FIDELITY'
  | 'F-SESSION_LOOP'
  | 'F-GUIDED_EXPLORATION'
  | 'F-HANDOFF'
  | 'F-PRODUCT_VALUE'
  | 'F-GAP_MAPPING'
  | 'F-CAPABILITY_OVERCLAIM'
  | 'F-RECOMMENDATION_FIDELITY';

export type EvaluationEvidenceV2 = {
  source: 'trace' | 'turn' | 'analysis' | 'fixture' | 'schema' | 'handoff';
  path: string;
  expected?: unknown;
  actual?: unknown;
};

export type HardCheckResultV2 = {
  check_id: string;
  status: HardCheckStatusV2;
  severity: HardCheckSeverityV2;
  failure_code?: FailureCodeV2;
  evidence: EvaluationEvidenceV2[];
  rationale: string;
};

export type ContractDimensionNameV2 =
  | 'Intent'
  | 'Initial State'
  | 'Current Frame'
  | 'Context Extraction'
  | 'Context Fidelity'
  | 'Provenance'
  | 'Reverse Alignment'
  | 'Question Planning'
  | 'Session Governance'
  | 'Authority'
  | 'Step Boundary'
  | 'Canonicalization';

export type ContractDimensionScoreV2 = {
  dimension: ContractDimensionNameV2;
  applicability: 'APPLICABLE' | 'NOT_APPLICABLE';
  points: 0 | 1 | 2 | null;
  max_points: 0 | 2;
  failure_codes: FailureCodeV2[];
  rationale: string;
};

export type HypothesisEvaluationV2 = {
  hypothesis_id: string;
  result: HypothesisResultV2;
  automatic_signals: string[];
  rationale_summary: string;
};

export type EvaluatedPortfolioEntryResultV2 = {
  case_id: string;
  run_id: string;
  candidate_id: string;
  fixture_version: PortfolioEntryFixtureV2['fixture_version'];
  hard_checks: HardCheckResultV2[];
  hard_failure: boolean;
  failure_codes: FailureCodeV2[];
  contract_dimensions: ContractDimensionScoreV2[];
  contract_score: number;
  contract_result: ContractResultV2;
  hypothesis_evaluations: HypothesisEvaluationV2[];
  hypothesis_result: HypothesisResultV2;
  human_review_pending: boolean;
  notes: string[];
};
