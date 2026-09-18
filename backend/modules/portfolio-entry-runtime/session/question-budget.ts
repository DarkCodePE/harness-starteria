import type { QuestionPlanV2 } from '../domain/analysis.schema';
import type { QuestionBudgetApplication, QuestionRecord, SessionContext } from '../domain/session.types';

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
  const emitted = questionPlan.questions
    .filter((question) => !context.previous_questions.some((previous) => (
      previous.id === question.id || normalizeQuestion(previous.question) === normalizeQuestion(question.question)
    )))
    .slice(0, available)
    .map<QuestionRecord>((question) => ({
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

function normalizeQuestion(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
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
