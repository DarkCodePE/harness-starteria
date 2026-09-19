export type PortfolioEntryNextAction =
  | 'submit_message'
  | 'answer_clarification'
  | 'offer_guided_exploration'
  | 'generate_handoff'
  | 'review_handoff'
  | 'claim_or_close'
  | 'closed';

export type PortfolioEntryLifecycleStatus =
  | 'ENTRY_CAPTURED'
  | 'ANALYZING'
  | 'CLARIFYING'
  | 'HANDOFF_ELIGIBLE'
  | 'HANDOFF_GENERATING'
  | 'HANDOFF_READY'
  | 'AWAITING_CONFIRMATION'
  | 'REVISIONS_REQUESTED'
  | 'CONFIRMED'
  | 'CONVERSION_ELIGIBLE'
  | 'CONVERTED'
  | 'EXPIRED'
  | 'ABANDONED';

export type PortfolioEntryQuestion = {
  id: string;
  question: string;
  question_type?: string;
  resolves: string[];
  turn_index: number;
  interaction_mode: 'quick_clarification' | 'guided_exploration';
  asked_at_budget_remaining: number;
};

export type PortfolioEntrySessionDto = {
  id: string;
  lifecycleStatus: PortfolioEntryLifecycleStatus;
  executionStatus: string;
  continuationProfile?: 'PORTFOLIO_LEAD_ENTRY' | 'INITIATIVE_ENTRY';
  revision: number;
  expiresAt: string;
  ownership: {
    state: 'ANONYMOUS' | 'CLAIMED';
    ownerUserId?: string;
  };
  conversation: Array<{
    id: string;
    turnIndex: number;
    userInput: string;
    emittedQuestions: PortfolioEntryQuestion[];
    matchedQuestionIds?: string[];
    respondedResolves: string[];
    createdAt: string;
  }>;
  clarification: {
    interactionMode: 'quick_clarification' | 'guided_exploration';
    quickQuestionBudget: 3;
    quickQuestionsAsked: number;
    explorationRound: number;
    questionsAskedCurrentRound: number;
    previousQuestions: PortfolioEntryQuestion[];
    answeredGaps: string[];
  };
  semanticProjection: {
    initialEntryState?: string;
    currentFrame?: string;
    primaryIntent?: string;
    reverseAlignment?: unknown;
    ambiguities?: unknown[];
    contradictions?: unknown[];
  };
  nextAction: PortfolioEntryNextAction;
  handoff?: PortfolioEntryHandoffDto;
  confirmation?: PortfolioEntryConfirmationDto;
};

export type ProvenanceOrigin = 'USER_DECLARED' | 'EXTRACTED_FROM_USER_TEXT' | 'AI_INFERRED' | 'AI_SUGGESTED';
export type ReviewDisposition = 'UNREVIEWED' | 'USER_CONFIRMED' | 'USER_REJECTED' | 'SUPERSEDED';

export type ProvenancedText = {
  value: string;
  provenance?: {
    origin: ProvenanceOrigin;
    source_path?: string;
    source_text?: string;
  };
};

export type SuggestedApproach = {
  description: string;
  rationale?: string;
  assumption?: string;
  origin: 'AI_SUGGESTED';
  review_disposition: 'UNREVIEWED';
  provenance?: Array<{
    origin: ProvenanceOrigin;
    source_path?: string;
    source_text?: string;
  }>;
};

export type GapResolutionType =
  | 'STARTERIA_CAN_STRUCTURE'
  | 'STARTERIA_CAN_GUIDE'
  | 'STARTERIA_CAN_TRACK'
  | 'REQUIRES_ORGANIZATIONAL_INPUT'
  | 'REQUIRES_EXTERNAL_EVIDENCE'
  | 'OUT_OF_SCOPE';

export type GapResolution = {
  gap_id: string;
  gap_description: string;
  resolution_type: GapResolutionType;
  starteria_capability?: string;
  resolution_stage: string;
  provenance?: {
    origin: ProvenanceOrigin;
    source_path?: string;
    source_text?: string;
  };
};

export type PortfolioEntryHandoff = {
  understanding: ProvenancedText;
  desired_outcome: ProvenancedText;
  decision_to_enable: ProvenancedText | 'unresolved';
  recommended_approach?: SuggestedApproach;
  alternative_approaches: SuggestedApproach[];
  known_context: Array<{ key: string; value: string; provenance?: ProvenancedText['provenance'] }>;
  unresolved_context: Array<{ gap_id: string; description: string; provenance?: ProvenancedText['provenance'] }>;
  gap_resolution_map: GapResolution[];
  evidence_or_clarity_needed: ProvenancedText[];
  starteria_path: Array<{ action: string; description: string }>;
  recommended_cta: string;
  provenance_summary: Array<{ origin: ProvenanceOrigin; source_path?: string; source_text?: string }>;
  handoff_status: 'ready' | 'ready_with_uncertainty' | 'insufficient_input';
};

export type PortfolioEntryHandoffDto = {
  id: string;
  version: number;
  status: PortfolioEntryHandoff['handoff_status'];
  reviewDisposition: 'UNREVIEWED';
  handoff: PortfolioEntryHandoff;
  createdAt: string;
};

export type PortfolioEntryConfirmationDto = {
  id: string;
  version: number;
  status: 'UNREVIEWED' | 'PARTIALLY_CONFIRMED' | 'CONFIRMED' | 'REVISIONS_REQUESTED';
  acceptedFields: string[];
  correctedFields: Record<string, unknown>;
  rejectedFields: string[];
  notes?: string;
  confirmedAt?: string | null;
  createdAt: string;
};

export type PortfolioEntryApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type StoredPortfolioEntrySession = {
  sessionId: string;
  credential: string;
};

export type PendingPortfolioEntryClaim = StoredPortfolioEntrySession;

export type ClaimedPortfolioEntrySessionRef = {
  sessionId: string;
};

export type PortfolioEntryConversionResult = {
  conversionId: string;
  sessionId: string;
  projectId: string;
  status: 'CONVERTED';
  destinationRoute: string;
  convertedAt: string;
};

export type PortfolioEntryContinuationResult = {
  continuationId: string;
  sessionId: string;
  status: 'CONTINUED';
  destinationRoute: string;
  continuedAt: string;
  portfolioAccessGranted: boolean;
  portfolioScope: {
    kind: 'platform_portfolio_permission';
    userId: string;
    organizationId: string | null;
  };
  context: {
    understanding?: unknown;
    desiredOutcome?: unknown;
    decisionToEnable?: unknown;
    knownContext?: unknown;
    unresolvedContext?: unknown;
    evidenceOrClarityNeeded?: unknown;
    provenanceSummary?: unknown;
  };
};
