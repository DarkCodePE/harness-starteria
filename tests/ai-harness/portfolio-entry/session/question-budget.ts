import type { QuestionPlanV2 } from '../schemas/analysis.schema';
import type { QuestionBudgetApplication, QuestionRecord, SessionContext } from './session-types';

export function getAvailableQuestionBudget(context: SessionContext): number {
  if (context.interaction_mode === 'quick_clarification') {
    return Math.max(0, context.quick_question_budget - context.quick_questions_asked);
  }
  return Math.max(0, 3 - context.questions_asked_current_round);
}

export function applyQuestionBudget(
  context: SessionContext,
  questionPlan: QuestionPlanV2,
  turnIndex: number,
): QuestionBudgetApplication {
  const available = getAvailableQuestionBudget(context);
  const received = questionPlan.question_count;
  const emitted = questionPlan.questions.slice(0, available).map<QuestionRecord>((question) => ({
    id: question.id,
    question: question.question,
    question_type: question.question_type,
    resolves: question.resolves,
    turn_index: turnIndex,
    interaction_mode: context.interaction_mode,
    asked_at_budget_remaining: available,
  }));

  return {
    available_question_budget: available,
    received_question_count: received,
    emitted_question_count: emitted.length,
    emitted_questions: emitted,
    overflow: received > available,
  };
}

export function consumeQuestionBudget(context: SessionContext, emittedQuestionCount: number): SessionContext {
  if (emittedQuestionCount === 0) return context;
  if (context.interaction_mode === 'quick_clarification') {
    return {
      ...context,
      quick_questions_asked: context.quick_questions_asked + emittedQuestionCount,
    };
  }
  return {
    ...context,
    questions_asked_current_round: context.questions_asked_current_round + emittedQuestionCount,
  };
}
