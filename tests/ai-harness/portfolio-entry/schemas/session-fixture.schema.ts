import { z } from 'zod';
import { portfolioEntryFrameV2Schema } from './analysis.schema';
import { fixtureBaseV2Schema } from './single-turn-fixture.schema';

export const scriptedResponseRuleV2Schema = z.object({
  id: z.string().optional(),
  when_resolves_any: z.array(z.string()).min(1),
  response: z.string(),
  once: z.boolean().optional(),
});

export const frameTransitionV2Schema = z.tuple([
  portfolioEntryFrameV2Schema,
  portfolioEntryFrameV2Schema,
]);

export const multiTurnFixtureV2Schema = fixtureBaseV2Schema.extend({
  case_type: z.literal('multi_turn'),
  initial_user_message: z.string().min(1),
  session: z.object({
    initial_mode: z.literal('quick_clarification'),
    quick_question_budget: z.literal(3),
    exploration_policy: z.enum([
      'accept_if_offered',
      'reject_if_offered',
      'not_expected',
    ]),
  }),
  response_rules: z.array(scriptedResponseRuleV2Schema),
  expected_session: z.object({
    initial_entry_state: z.array(portfolioEntryFrameV2Schema).optional(),
    allowed_frame_transitions: z.array(frameTransitionV2Schema).optional(),
    late_reverse_alignment_required: z.boolean().optional(),
    max_quick_questions: z.number().int().min(0).max(3).optional(),
    min_analysis_turns: z.number().int().min(1).optional(),
    requires_scripted_reanalysis: z.boolean().optional(),
    handoff_required: z.boolean().optional(),
    allowed_handoff_status: z.array(z.string()).optional(),
  }),
  hard_assertions: z.array(z.string()).optional(),
});

export type MultiTurnFixtureV2 = z.infer<typeof multiTurnFixtureV2Schema>;
