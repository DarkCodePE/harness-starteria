import { z } from 'zod';
import { portfolioEntryFrameV2Schema, portfolioEntryIntentV2Schema } from './analysis.schema';

export const fixtureEvidenceRoleV2Schema = z.enum([
  'regression',
  'contract',
  'hypothesis',
  'benchmark',
  'holdout',
]);

export const fixtureBaseV2Schema = z.object({
  fixture_version: z.literal('0.2'),
  case_id: z.string().min(1),
  name: z.string().min(1),
  suite: z.string().min(1),
  tags: z.array(z.string()),
  evidence_role: fixtureEvidenceRoleV2Schema,
  linked_findings: z.array(z.string()).optional(),
  linked_hypotheses: z.array(z.string()).optional(),
  human_review_required: z.boolean().optional(),
});

export const contextExpectationV2Schema = z.object({
  path: z.string(),
  expected: z.unknown().optional(),
  any_of: z.array(z.unknown()).optional(),
});

export const singleTurnFixtureV2Schema = fixtureBaseV2Schema.extend({
  case_type: z.literal('single_turn'),
  input: z.string().min(1),
  expected: z.object({
    initial_entry_state: z.array(portfolioEntryFrameV2Schema).optional(),
    current_frame: z.array(portfolioEntryFrameV2Schema).optional(),
    primary_intent: z.array(portfolioEntryIntentV2Schema).optional(),
    secondary_intents_any_of: z.array(portfolioEntryIntentV2Schema).optional(),
    reverse_alignment_required: z.boolean().optional(),
    subject_type: z.array(z.enum(['solution', 'initiative', 'unknown'])).optional(),
    max_questions: z.number().int().min(0).max(3).optional(),
  }),
  context_expectations: z.object({
    must_include: z.array(contextExpectationV2Schema).optional(),
    must_not_invent: z.array(z.string()).optional(),
    ambiguities_expected: z.array(z.string()).optional(),
  }).optional(),
  prohibited_behaviors: z.array(z.string()).optional(),
  scoring_dimensions: z.array(z.string()).optional(),
});

export type SingleTurnFixtureV2 = z.infer<typeof singleTurnFixtureV2Schema>;
