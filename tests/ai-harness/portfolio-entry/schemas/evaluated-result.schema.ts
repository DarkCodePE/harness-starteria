import { z } from 'zod';

const failureCodeSchema = z.enum([
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
  'F-INITIAL_STATE_MUTATION',
  'F-CURRENT_FRAME_STAGNATION',
  'F-CONTEXT_FIDELITY',
  'F-SESSION_LOOP',
  'F-GUIDED_EXPLORATION',
  'F-HANDOFF',
  'F-PRODUCT_VALUE',
  'F-GAP_MAPPING',
  'F-CAPABILITY_OVERCLAIM',
  'F-RECOMMENDATION_FIDELITY',
]);

const hardCheckSchema = z.object({
  check_id: z.string(),
  status: z.enum(['PASS', 'FAIL', 'NOT_EVALUABLE']),
  severity: z.enum(['HARD_FAILURE', 'WARNING', 'INFO']),
  failure_code: failureCodeSchema.optional(),
  evidence: z.array(z.object({
    source: z.enum(['trace', 'turn', 'analysis', 'fixture', 'schema', 'handoff']),
    path: z.string(),
    expected: z.unknown().optional(),
    actual: z.unknown().optional(),
  })),
  rationale: z.string(),
});

const contractDimensionSchema = z.object({
  dimension: z.enum([
    'Intent',
    'Initial State',
    'Current Frame',
    'Context Extraction',
    'Context Fidelity',
    'Provenance',
    'Reverse Alignment',
    'Question Planning',
    'Session Governance',
    'Authority',
    'Step Boundary',
    'Canonicalization',
  ]),
  applicability: z.enum(['APPLICABLE', 'NOT_APPLICABLE']),
  points: z.union([z.literal(0), z.literal(1), z.literal(2)]).nullable(),
  max_points: z.union([z.literal(0), z.literal(2)]),
  failure_codes: z.array(failureCodeSchema),
  rationale: z.string(),
});

const hypothesisEvaluationSchema = z.object({
  hypothesis_id: z.string(),
  result: z.enum(['SUPPORTED', 'INCONCLUSIVE', 'CONTRADICTED', 'N/A']),
  automatic_signals: z.array(z.string()),
  rationale_summary: z.string(),
});

export const evaluatedPortfolioEntryResultV2Schema = z.object({
  case_id: z.string(),
  run_id: z.string(),
  candidate_id: z.string(),
  fixture_version: z.literal('0.2'),
  hard_checks: z.array(hardCheckSchema),
  hard_failure: z.boolean(),
  failure_codes: z.array(failureCodeSchema),
  contract_dimensions: z.array(contractDimensionSchema),
  contract_score: z.number().min(0).max(1),
  contract_result: z.enum(['PASS', 'REVIEW', 'FAIL']),
  hypothesis_evaluations: z.array(hypothesisEvaluationSchema),
  hypothesis_result: z.enum(['SUPPORTED', 'INCONCLUSIVE', 'CONTRADICTED', 'N/A']),
  human_review_pending: z.boolean(),
  notes: z.array(z.string()),
});

export type EvaluatedPortfolioEntryResultV2 = z.infer<typeof evaluatedPortfolioEntryResultV2Schema>;
