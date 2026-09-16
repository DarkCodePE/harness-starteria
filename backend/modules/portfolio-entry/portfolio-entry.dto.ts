import type { PortfolioEntryConfirmation } from '../portfolio-entry-sessions/domain/portfolio-entry-confirmation.types';
import type {
  PortfolioEntryHandoffRecord,
  PortfolioEntrySession,
  PortfolioEntryTurn,
} from '../portfolio-entry-sessions/domain/portfolio-entry-session.types';

export type PortfolioEntrySessionClientDto = {
  id: string;
  lifecycleStatus: PortfolioEntrySession['lifecycleStatus'];
  executionStatus: PortfolioEntrySession['executionStatus'];
  continuationProfile?: PortfolioEntrySession['continuationProfile'];
  revision: number;
  expiresAt: string;
  ownership: {
    state: PortfolioEntrySession['ownershipState'];
    ownerUserId?: string;
  };
  conversation: Array<{
    id: string;
    turnIndex: number;
    userInput: string;
    emittedQuestions: PortfolioEntryTurn['emittedQuestions'];
    respondedResolves: string[];
    createdAt: string;
  }>;
  clarification: {
    interactionMode: PortfolioEntrySession['interactionMode'];
    quickQuestionBudget: 3;
    quickQuestionsAsked: number;
    explorationRound: number;
    questionsAskedCurrentRound: number;
    previousQuestions: PortfolioEntrySession['semanticState']['previousQuestions'];
    answeredGaps: string[];
  };
  semanticProjection: {
    initialEntryState?: PortfolioEntrySession['semanticState']['initialEntryState'];
    currentFrame?: PortfolioEntrySession['semanticState']['currentFrame'];
    primaryIntent?: PortfolioEntrySession['semanticState']['primaryIntent'];
    reverseAlignment?: PortfolioEntrySession['semanticState']['reverseAlignment'];
    ambiguities?: PortfolioEntrySession['semanticState']['ambiguities'];
    contradictions?: PortfolioEntrySession['semanticState']['contradictions'];
  };
  nextAction: 'submit_message' | 'answer_clarification' | 'offer_guided_exploration' | 'generate_handoff' | 'review_handoff' | 'claim_or_close' | 'closed';
  handoff?: PortfolioEntryHandoffClientDto;
  confirmation?: PortfolioEntryConfirmationClientDto;
};

export type PortfolioEntryHandoffClientDto = {
  id: string;
  version: number;
  status: PortfolioEntryHandoffRecord['status'];
  reviewDisposition: 'UNREVIEWED';
  handoff: PortfolioEntryHandoffRecord['handoff'];
  createdAt: string;
};

export type PortfolioEntryConfirmationClientDto = {
  id: string;
  version: number;
  status: PortfolioEntryConfirmation['status'];
  acceptedFields: string[];
  correctedFields: PortfolioEntryConfirmation['correctedFields'];
  rejectedFields: string[];
  notes?: string;
  confirmedAt?: string | null;
  createdAt: string;
};

export function toPortfolioEntrySessionClientDto(
  session: PortfolioEntrySession,
  turns: PortfolioEntryTurn[],
): PortfolioEntrySessionClientDto {
  return {
    id: session.id,
    lifecycleStatus: session.lifecycleStatus,
    executionStatus: session.executionStatus,
    continuationProfile: session.continuationProfile ?? undefined,
    revision: session.revision,
    expiresAt: session.expiresAt.toISOString(),
    ownership: {
      state: session.ownershipState,
      ownerUserId: session.ownerUserId ?? undefined,
    },
    conversation: turns.map((turn) => ({
      id: turn.id,
      turnIndex: turn.turnIndex,
      userInput: turn.userInput,
      emittedQuestions: turn.emittedQuestions,
      respondedResolves: turn.respondedResolves,
      createdAt: turn.createdAt.toISOString(),
    })),
    clarification: {
      interactionMode: session.interactionMode,
      quickQuestionBudget: session.questionBudget.quickQuestionBudget,
      quickQuestionsAsked: session.questionBudget.quickQuestionsAsked,
      explorationRound: session.questionBudget.explorationRound,
      questionsAskedCurrentRound: session.questionBudget.questionsAskedCurrentRound,
      previousQuestions: session.semanticState.previousQuestions,
      answeredGaps: session.semanticState.answeredGaps,
    },
    semanticProjection: {
      initialEntryState: session.semanticState.initialEntryState,
      currentFrame: session.semanticState.currentFrame,
      primaryIntent: session.semanticState.primaryIntent,
      reverseAlignment: session.semanticState.reverseAlignment,
      ambiguities: session.semanticState.ambiguities,
      contradictions: session.semanticState.contradictions,
    },
    nextAction: deriveNextAction(session),
    handoff: session.latestHandoff ? toHandoffClientDto(session.latestHandoff) : undefined,
    confirmation: session.confirmation ? toConfirmationClientDto(session.confirmation) : undefined,
  };
}

export function toHandoffClientDto(handoff: PortfolioEntryHandoffRecord): PortfolioEntryHandoffClientDto {
  return {
    id: handoff.id,
    version: handoff.version,
    status: handoff.status,
    reviewDisposition: 'UNREVIEWED',
    handoff: handoff.handoff,
    createdAt: handoff.createdAt.toISOString(),
  };
}

function toConfirmationClientDto(confirmation: PortfolioEntryConfirmation): PortfolioEntryConfirmationClientDto {
  return {
    id: confirmation.id,
    version: confirmation.version,
    status: confirmation.status,
    acceptedFields: confirmation.acceptedFields,
    correctedFields: confirmation.correctedFields,
    rejectedFields: confirmation.rejectedFields,
    notes: confirmation.notes,
    confirmedAt: confirmation.confirmedAt?.toISOString() ?? null,
    createdAt: confirmation.createdAt.toISOString(),
  };
}

function deriveNextAction(session: PortfolioEntrySession): PortfolioEntrySessionClientDto['nextAction'] {
  if (session.semanticState.runtimeClarificationStatus === 'exploration_offered') return 'offer_guided_exploration';
  if (session.lifecycleStatus === 'ENTRY_CAPTURED' || session.lifecycleStatus === 'CLARIFYING') {
    const lastTransition = session.semanticState.previousQuestions.at(-1);
    return lastTransition ? 'answer_clarification' : 'submit_message';
  }
  if (session.lifecycleStatus === 'HANDOFF_ELIGIBLE') return 'generate_handoff';
  if (session.lifecycleStatus === 'HANDOFF_READY' || session.lifecycleStatus === 'AWAITING_CONFIRMATION') return 'review_handoff';
  if (session.lifecycleStatus === 'CONFIRMED' || session.lifecycleStatus === 'REVISIONS_REQUESTED') return 'claim_or_close';
  return 'closed';
}
