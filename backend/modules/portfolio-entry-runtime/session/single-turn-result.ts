import { createInitialSessionContext } from '../domain/session.types';
import type { ClarificationStatus, InteractionMode, QuestionRecord, SessionContext, SessionTurnTrace } from '../domain/session.types';

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
