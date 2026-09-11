import { z } from 'zod';
import { portfolioEntryAnalysisV2Schema, questionPlanV2Schema } from './analysis.schema';

const interactionModeSchema = z.enum(['quick_clarification', 'guided_exploration']);
const clarificationStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'exploration_offered',
  'guided_exploration',
  'ready_for_handoff',
  'ended_with_uncertainty',
  'abandoned',
]);

const questionRecordSchema = z.object({
  id: z.string(),
  question: z.string(),
  question_type: z.string().optional(),
  resolves: z.array(z.string()),
  turn_index: z.number().int().min(1),
  interaction_mode: interactionModeSchema,
  asked_at_budget_remaining: z.number().int().min(0),
});

const scriptedResponseResultSchema = z.object({
  response: z.string().nullable(),
  matched_question_ids: z.array(z.string()),
  response_rule_ids_used: z.array(z.string()),
  responded_resolves: z.array(z.string()),
  unmatched_questions: z.array(questionRecordSchema),
  fallback_used: z.boolean(),
  consumed_once_rule_ids: z.array(z.string()),
});

const sessionTransitionSchema = z.object({
  from_status: clarificationStatusSchema,
  to_status: clarificationStatusSchema,
  from_mode: interactionModeSchema,
  to_mode: interactionModeSchema,
  reason: z.string(),
  trigger: z.enum(['agent_output', 'user_choice', 'budget', 'checkpoint', 'safety_guard', 'scripted_responder']),
  budget_before: z.number().int().min(0),
  budget_after: z.number().int().min(0),
  guard_triggered: z.boolean().optional(),
  guard_reason: z.string().optional(),
});

export const sessionTurnTraceSchema = z.object({
  turn_index: z.number().int().min(1),
  user_input: z.string(),
  analysis: portfolioEntryAnalysisV2Schema,
  initial_entry_state: portfolioEntryAnalysisV2Schema.shape.initial_entry_state,
  current_frame: portfolioEntryAnalysisV2Schema.shape.current_frame,
  intent: z.object({
    primary_intent: portfolioEntryAnalysisV2Schema.shape.primary_intent,
    secondary_intents: portfolioEntryAnalysisV2Schema.shape.secondary_intents,
  }),
  reverse_alignment: portfolioEntryAnalysisV2Schema.shape.reverse_alignment,
  question_plan: questionPlanV2Schema,
  interaction_mode: interactionModeSchema,
  available_question_budget: z.number().int().min(0),
  received_question_count: z.number().int().min(0),
  emitted_question_count: z.number().int().min(0),
  questions_asked: z.array(questionRecordSchema),
  budget_overflow: z.boolean(),
  scripted_response_result: scriptedResponseResultSchema.optional(),
  transition: sessionTransitionSchema,
  provenance_delta: z.unknown().optional(),
});

export const sessionTraceSchema = z.object({
  case_id: z.string(),
  run_id: z.string(),
  candidate_id: z.string(),
  turns: z.array(sessionTurnTraceSchema),
  questions_total: z.number().int().min(0),
  quick_questions_total: z.number().int().min(0),
  exploration_rounds: z.number().int().min(0),
  mode_transitions: z.array(sessionTransitionSchema),
  stop_reason: z.string().nullable(),
  clarification_status: clarificationStatusSchema,
  execution_guard_triggered: z.boolean(),
  execution_guard_reason: z.string().optional(),
});

export type SessionTraceV2 = z.infer<typeof sessionTraceSchema>;
