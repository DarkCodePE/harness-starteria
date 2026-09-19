import { createInitialSessionContext } from '../domain/session.types';
import type { PortfolioEntryAnalysisV2 } from '../domain/analysis.schema';
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
  response: string,
  analysis?: PortfolioEntryAnalysisV2,
): { context: SessionContext; matchedQuestionIds: string[]; respondedResolves: string[] } {
  if (!question || matchedQuestionIds?.length !== 1 || matchedQuestionIds[0] !== question.id) {
    return { context, matchedQuestionIds: [], respondedResolves: [] };
  }
  if (isUnknownAnswer(response)) return { context, matchedQuestionIds: [question.id], respondedResolves: [] };
  // The client may identify the answered question, but it cannot declare a
  // gap resolved. Resolution requires a supported structured value in the
  // post-answer analysis; otherwise remain conservative and unresolved.
  const resolved = deriveSupportedResolves(question, analysis);
  return {
    context: resolved.length === 0 ? context : { ...context, answered_gaps: [...new Set([...context.answered_gaps, ...resolved])] },
    matchedQuestionIds: [question.id],
    respondedResolves: resolved,
  };
}

function deriveSupportedResolves(question: QuestionRecord, analysis?: PortfolioEntryAnalysisV2): string[] {
  if (!analysis) return [];
  return question.resolves.filter((resolve) => resolveIsSupported(resolve, analysis));
}

function resolveIsSupported(resolve: string, analysis: PortfolioEntryAnalysisV2): boolean {
  const normalized = resolve.replace(/^analysis\./, '');
  const candidates = [normalized];
  if (!normalized.includes('.')) candidates.push(`extracted_context.${normalized}`);
  if (normalized.includes('decision_to_enable')) candidates.push('extracted_context.decision_need');
  return candidates.some((path) => hasMeaningfulValue(readPath(analysis, path)));
}

function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0 && !isUnknownAnswer(value);
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  return value !== null && value !== undefined && typeof value === 'object'
    ? Object.values(value as Record<string, unknown>).some(hasMeaningfulValue)
    : value !== undefined && value !== null;
}

export function isUnknownAnswer(response: string): boolean {
  const normalized = response.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?]/g, '').replace(/\s+/g, ' ').trim();
  return [
    'no lo se',
    'no lo se todavia',
    'no tengo esa informacion',
    'todavia no lo se',
    'ya te respondi',
    'no entendi',
    'no estoy seguro',
    'puede ser',
  ].includes(normalized)
    || normalized.startsWith('no entendi ')
    || normalized.startsWith('no estoy seguro ');
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
