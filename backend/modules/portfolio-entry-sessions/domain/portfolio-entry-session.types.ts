import type { PortfolioEntryAnalysisV2 } from '../../portfolio-entry-runtime/domain/analysis.schema';
import type { PortfolioEntryHandoffV2 } from '../../portfolio-entry-runtime/domain/handoff.schema';
import type {
  InteractionMode,
  QuestionRecord,
  SessionContext,
  SessionTransition,
} from '../../portfolio-entry-runtime/domain/session.types';
import type {
  PortfolioEntryExecutionStatus,
  PortfolioEntrySessionLifecycleStatus,
} from './portfolio-entry-session.lifecycle';
import type { PortfolioEntryConfirmation } from './portfolio-entry-confirmation.types';
import type { PortfolioEntryOwnershipState } from './portfolio-entry-session-ownership';

export type PortfolioEntryOrigin = 'public_start' | 'authenticated_portfolio_entry' | 'imported_text';

export type PortfolioEntrySourceMetadata = {
  surface?: string;
  locale?: string;
  userAgentHash?: string;
  ipHash?: string;
  [key: string]: unknown;
};

export type PortfolioEntryVersioning = {
  contractVersion: string;
  runtimeVersion: string;
  schemaVersion: string;
  promptManifestId?: string;
};

export type PortfolioEntryQuestionBudgetState = {
  quickQuestionBudget: 3;
  quickQuestionsAsked: number;
  explorationRound: number;
  questionsAskedCurrentRound: number;
};

export type PortfolioEntrySemanticState = {
  initialEntryState?: PortfolioEntryAnalysisV2['initial_entry_state'];
  currentFrame?: PortfolioEntryAnalysisV2['current_frame'];
  primaryIntent?: PortfolioEntryAnalysisV2['primary_intent'];
  secondaryIntents?: PortfolioEntryAnalysisV2['secondary_intents'];
  extractedContext?: PortfolioEntryAnalysisV2['extracted_context'];
  ambiguities?: PortfolioEntryAnalysisV2['ambiguities'];
  contradictions?: PortfolioEntryAnalysisV2['contradictions'];
  reverseAlignment?: PortfolioEntryAnalysisV2['reverse_alignment'];
  unresolvedContext?: unknown[];
  provenance?: unknown;
  previousQuestions: QuestionRecord[];
  answeredGaps: string[];
};

export type PortfolioEntryHandoffRecord = {
  id: string;
  sessionId: string;
  version: number;
  handoff: PortfolioEntryHandoffV2;
  sourceTurnId?: string;
  status: PortfolioEntryHandoffV2['handoff_status'];
  versioning: PortfolioEntryVersioning;
  createdAt: Date;
  updatedAt: Date;
};

export type PortfolioEntryTurn = {
  id: string;
  sessionId: string;
  turnIndex: number;
  userInput: string;
  emittedQuestions: QuestionRecord[];
  matchedQuestionIds: string[];
  respondedResolves: string[];
  analysisSnapshot: PortfolioEntryAnalysisV2;
  semanticStateAfter: PortfolioEntrySemanticState;
  budgetBefore: number;
  budgetAfter: number;
  transition: SessionTransition;
  provenanceDelta?: unknown;
  versioning: PortfolioEntryVersioning;
  createdAt: Date;
  updatedAt: Date;
};

export type PortfolioEntrySession = {
  id: string;
  ownerUserId?: string | null;
  publicAccessTokenHash?: string | null;
  ownershipState: PortfolioEntryOwnershipState;
  rawEntry: string;
  entryOrigin: PortfolioEntryOrigin;
  sourceMetadata?: PortfolioEntrySourceMetadata;
  lifecycleStatus: PortfolioEntrySessionLifecycleStatus;
  executionStatus: PortfolioEntryExecutionStatus;
  interactionMode: InteractionMode;
  semanticState: PortfolioEntrySemanticState;
  questionBudget: PortfolioEntryQuestionBudgetState;
  latestAnalysis?: PortfolioEntryAnalysisV2 | null;
  latestHandoff?: PortfolioEntryHandoffRecord | null;
  confirmation?: PortfolioEntryConfirmation | null;
  versioning: PortfolioEntryVersioning;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  expiredAt?: Date | null;
};

export function semanticStateFromRuntimeContext(
  context: SessionContext,
  analysis?: PortfolioEntryAnalysisV2,
): PortfolioEntrySemanticState {
  return {
    initialEntryState: analysis?.initial_entry_state,
    currentFrame: analysis?.current_frame,
    primaryIntent: analysis?.primary_intent,
    secondaryIntents: analysis?.secondary_intents,
    extractedContext: analysis?.extracted_context,
    ambiguities: analysis?.ambiguities,
    contradictions: analysis?.contradictions,
    reverseAlignment: analysis?.reverse_alignment,
    provenance: analysis?.provenance,
    previousQuestions: context.previous_questions,
    answeredGaps: context.answered_gaps,
  };
}
