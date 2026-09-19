import { createInitialSessionContext } from '../domain/session.types';
import type { ClarificationStatus, InteractionMode, QuestionRecord, SessionContext, SessionTurnTrace } from '../domain/session.types';

export function latestActiveQuestion(turns: Array<{ emittedQuestions: QuestionRecord[] }>): QuestionRecord | null {
  const latest = turns.at(-1)?.emittedQuestions ?? [];
  if (latest.length === 0) return null;
  return [...latest].sort((left, right) => left.asked_at_budget_remaining - right.asked_at_budget_remaining || left.id.localeCompare(right.id))[0] ?? null;
}

export function applyAnswerResolution(
  context: SessionContext,
  question: QuestionRecord | null,
  matchedQuestionIds: string[] | undefined,
  respondedResolves: string[] | undefined,
  response: string,
): { context: SessionContext; matchedQuestionIds: string[]; respondedResolves: string[] } {
  if (!question || matchedQuestionIds?.length !== 1 || matchedQuestionIds[0] !== question.id) {
    return { context, matchedQuestionIds: [], respondedResolves: [] };
  }
  if (isUnknownAnswer(response)) return { context, matchedQuestionIds: [question.id], respondedResolves: [] };
  const allowed = new Set(question.resolves);
  const resolved = [...new Set((respondedResolves ?? []).filter((gap) => allowed.has(gap)))];
  return {
    context: resolved.length === 0 ? context : { ...context, answered_gaps: [...new Set([...context.answered_gaps, ...resolved])] },
    matchedQuestionIds: [question.id],
    respondedResolves: resolved,
  };
}

export function isUnknownAnswer(response: string): boolean {
  const normalized = response.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?]/g, '').replace(/\s+/g, ' ').trim();
  return ['no lo se', 'no lo se todavia', 'no tengo esa informacion', 'todavia no lo se'].includes(normalized);
}

export function createSessionContextFromPersistedProjection(input: {
  interactionMode: InteractionMode;
  quickQuestionsAsked: number;
  explorationRound: number;
  questionsAskedCurrentRound: number;
  previousQuestions: QuestionRecord[];
  answeredGaps: string[];
  lifecycleStatus: string;
  runtimeClarificationStatus?: ClarificationStatus;
}): SessionContext {
  const context = createInitialSessionContext({ initial_mode: input.interactionMode, quick_question_budget: 3 });
  return {
    ...context,
    quick_questions_asked: input.quickQuestionsAsked,
    exploration_round: input.explorationRound,
    questions_asked_current_round: input.questionsAskedCurrentRound,
    previous_questions: input.previousQuestions,
    answered_gaps: input.answeredGaps,
    clarification_status: input.runtimeClarificationStatus ?? (input.lifecycleStatus === 'ENTRY_CAPTURED'
      ? 'not_started'
      : input.lifecycleStatus === 'HANDOFF_ELIGIBLE'
        ? 'ready_for_handoff'
        : 'in_progress'),
  };
}

export function normalizePortfolioEntryTurnForPersistence(turn: SessionTurnTrace, turnIndex: number): SessionTurnTrace {
  return normalizeTurnIndex(turn, turnIndex);
}

function normalizeTurnIndex(turn: SessionTurnTrace, turnIndex: number): SessionTurnTrace {
  return {
    ...turn,
    turn_index: turnIndex,
    questions_asked: turn.questions_asked.map((question: QuestionRecord) => ({ ...question, turn_index: turnIndex })),
  };
}
