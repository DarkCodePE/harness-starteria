export type ChallengeType = 'correction' | 'growth' | 'exploration';

export type InitialReviewStatus =
  | 'not_started'
  | 'in_progress'
  | 'one_pager_ready'
  | 'route_ready'
  | 'confirmed'
  | 'converted_to_initiative'
  | 'draft'
  | 'processing'
  | 'generated'
  | 'updated'
  | 'route_confirmed'
  | 'converted_to_project'
  | 'abandoned'
  | 'failed';

export type InitialReviewConversationStage =
  | 'intro'
  | 'understanding'
  | 'challenge_type'
  | 'motivation'
  | 'stakeholder'
  | 'first_action'
  | 'critical_analysis'
  | 'one_pager'
  | 'route_confirmation'
  | 'converted';

export type StrategicQuestionStatus = 'unanswered' | 'answered' | 'unknown';

export interface InitialReviewStrategicQuestion {
  id: string;
  question: string;
  options: string[];
  allowsUnknown: boolean;
  answer?: string;
  status: StrategicQuestionStatus;
  shouldCarryToStep0: boolean;
}

export interface InitialReviewOutput {
  understandingSummary: string;
  suggestedChallengeType: ChallengeType;
  challengeTypeReason: string;
  confidenceScore?: number;
  critique: {
    solid: string;
    weak: string;
    risky: string;
    recommendedAdjustment: string;
    mainRisk?: string;
  };
  strategicQuestions: InitialReviewStrategicQuestion[];
  improvedProposal: {
    suggestedName: string;
    proposal: string;
    initialFocus: string;
    expectedImpact: string;
    nextRecommendedStep: string;
  };
  routePreview: Array<{
    step: 0 | 1 | 2 | 3 | 4;
    name: string;
    whatWillHappen: string;
    expectedOutput: string;
  }>;
}

export interface InitialReview {
  id: string;
  inputText: string;
  contextText?: string;
  status: InitialReviewStatus;
  conversationStage?: InitialReviewConversationStage;
  answers?: {
    understandingConfirmed?: boolean;
    adjustedContext?: string;
    challengeType?: ChallengeType | 'not_sure';
    challengeTypeSuggested?: boolean;
    motivation?: string;
    stakeholder?: string;
    evidence?: string;
    expectedOutcome?: string;
    riskContext?: string;
    firstAction?: string;
    additionalContext?: string;
    fileContext?: {
      name: string;
      note: string;
      addedAt: string;
    };
  };
  output?: InitialReviewOutput;
  selectedChallengeType?: ChallengeType;
  convertedProjectId?: string;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    confirmedAt?: string;
    convertedInitiativeId?: string;
    source?: 'manual' | 'public_draft' | 'portfolio_linked';
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InitialReviewArtifactMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface InitialReviewOnePager {
  title: string;
  whatToMove: string;
  challengeType: ChallengeType;
  whyNow: string;
  impactedAudience: string;
  initialEvidence: string;
  mainRisk: string;
  pendingQuestions: string[];
  recommendedRoute: string;
  nextStep: string;
}

export interface InitialReviewArtifact {
  id: string;
  initiativeId: string;
  source: 'initial_review_chat';
  status: 'completed' | 'converted_to_initiative';
  createdAt: string;
  updatedAt: string;
  conversation: InitialReviewArtifactMessage[];
  answers: Record<string, string>;
  onePager: InitialReviewOnePager;
}

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  correction: 'Correccion',
  growth: 'Crecimiento',
  exploration: 'Exploracion',
};
