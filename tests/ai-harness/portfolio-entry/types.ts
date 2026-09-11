import { z } from 'zod';

export const INTENTS = [
  'strategic_goal',
  'portfolio_alignment',
  'portfolio_tracking',
  'portfolio_prioritization',
  'portfolio_reporting',
  'initiative_governance',
  'unknown',
] as const;

export const ENTRY_STATES = [
  'strategy_first',
  'portfolio_first',
  'initiative_first',
  'solution_first',
  'problem_first',
  'opportunity_first',
  'decision_first',
  'reporting_first',
  'unknown',
] as const;

export const PROVENANCE_ORIGINS = [
  'USER_DECLARED',
  'EXTRACTED_FROM_USER_TEXT',
  'AI_INFERRED',
  'AI_SUGGESTED',
] as const;

export const REVIEW_DISPOSITIONS = [
  'UNREVIEWED',
  'USER_CONFIRMED',
  'USER_REJECTED',
  'SUPERSEDED',
] as const;

export const ANALYSIS_STATUSES = [
  'pending',
  'ready',
  'insufficient_input',
  'failed',
  'superseded',
] as const;

export const FAILURE_CODES = [
  'F-INTENT',
  'F-ENTRY_STATE',
  'F-HALLUCINATION',
  'F-PROVENANCE',
  'F-REVERSE_ALIGNMENT',
  'F-QUESTION_OVERLOAD',
  'F-QUESTION_WEAK',
  'F-CANONICALIZATION',
  'F-AUTHORITY',
  'F-STEP_LEAK',
  'F-UX',
  'F-SCHEMA',
  'F-EXECUTION',
] as const;

export const PROHIBITED_BEHAVIORS = [
  'create_organization',
  'create_strategic_front',
  'create_challenge',
  'create_initiative',
  'create_project',
  'create_step',
  'create_decision',
  'activate_step_0',
  'confirm_alignment',
  'decide_continuity',
  'invent_evidence',
] as const;

export const provenanceEntrySchema = z.object({
  path: z.string(),
  origin: z.enum(PROVENANCE_ORIGINS),
  review_disposition: z.enum(REVIEW_DISPOSITIONS),
  source_text: z.string().optional(),
});

export const questionItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  reason_to_ask: z.string(),
  resolves: z.array(z.string()),
  priority: z.number().int().min(1).max(3),
  expected_answer_type: z.string(),
});

export const reverseAlignmentGapSchema = z.object({
  subject_type: z.enum(['solution', 'initiative', 'unknown']),
  subject: z.string().nullable(),
  connection_state: z.enum(['not_required', 'partial', 'required', 'insufficient_input']),
  present_links: z.array(z.string()),
  missing_links: z.array(z.string()),
  suggested_focus: z.string().nullable(),
});

export const portfolioEntryAnalysisSchema = z.object({
  entry_id: z.string(),
  analysis_version: z.string(),
  analysis_status: z.enum(ANALYSIS_STATUSES),
  primary_intent: z.enum(INTENTS),
  secondary_intents: z.array(z.enum(INTENTS)),
  entry_state: z.enum(ENTRY_STATES),
  extracted_context: z.record(z.unknown()),
  ambiguities: z.array(z.string()),
  contradictions: z.array(z.string()),
  missing_critical_context: z.array(z.string()),
  reverse_alignment_required: z.boolean(),
  reverse_alignment_gap: reverseAlignmentGapSchema,
  question_plan: z.array(questionItemSchema),
  provenance: z.array(provenanceEntrySchema),
  prohibited_actions: z.array(z.string()).default([]),
  agent_trace_summary: z.object({
    skills_executed: z.array(z.string()),
    provider: z.string(),
    model: z.string().nullable(),
  }),
  ux_summary: z.string().optional(),
});

export const fixtureSchema = z.object({
  case_id: z.string().regex(/^PE-[A-I]\d{2}$/),
  suite: z.string().regex(/^[A-I]$/),
  name: z.string(),
  input: z.string().min(1),
  expected: z.object({
    entry_state: z.array(z.enum(ENTRY_STATES)).optional(),
    primary_intent: z.array(z.enum(INTENTS)).optional(),
    secondary_intents: z.array(z.enum(INTENTS)).optional(),
    reverse_alignment_required: z.boolean().optional(),
    analysis_status: z.array(z.enum(ANALYSIS_STATUSES)).optional(),
    max_questions: z.number().int().min(0).max(3).default(3),
  }),
  must_include_context: z.record(z.unknown()).default({}),
  must_not_include_context: z.array(z.string()).default([]),
  prohibited_values: z.record(z.array(z.unknown())).default({}),
  prohibited_behaviors: z.array(z.enum(PROHIBITED_BEHAVIORS)).default([]),
  human_review: z.object({
    intent_quality: z.boolean().default(false),
    question_quality: z.boolean().default(false),
    ux_synthesis_quality: z.boolean().default(false),
  }).default({}),
});

export const hardCheckSchema = z.object({
  id: z.string(),
  passed: z.boolean(),
  message: z.string(),
  failure_code: z.enum(FAILURE_CODES).optional(),
});

export type Intent = (typeof INTENTS)[number];
export type EntryState = (typeof ENTRY_STATES)[number];
export type FailureCode = (typeof FAILURE_CODES)[number];
export type Fixture = z.infer<typeof fixtureSchema>;
export type PortfolioEntryAnalysis = z.infer<typeof portfolioEntryAnalysisSchema>;
export type HardCheck = z.infer<typeof hardCheckSchema>;

export interface PortfolioEntryAgentAdapter {
  analyze(input: {
    entryId: string;
    rawInput: string;
  }): Promise<PortfolioEntryAnalysis>;
}

export interface CaseRunResult {
  case_id: string;
  run_index: number;
  input: string;
  raw_output: unknown;
  execution_status: 'completed' | 'failed';
  duration_ms: number;
  error?: string;
}

export interface EvaluatedCaseResult {
  case_id: string;
  run_index: number;
  result: 'PASS' | 'REVIEW' | 'FAIL';
  hard_fail: boolean;
  hard_checks: HardCheck[];
  automatic_score: number;
  human_review_required: boolean;
  failure_codes: FailureCode[];
  notes: string[];
}

export interface HarnessRun {
  run_id: string;
  timestamp: string;
  cases: string[];
  repeat_count: number;
  agent_implementation_version: string;
  model: string | null;
}
