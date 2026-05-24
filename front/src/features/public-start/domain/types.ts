export type PublicDraftStatus = 'created' | 'edited' | 'converted' | 'expired' | 'discarded';

export type PublicDraftSourceType = 'text' | 'file' | 'demo';

export type PublicQuestionStatus = 'pending' | 'answered' | 'skipped';

export type PublicSuggestedChallengeType = 'correction' | 'growth' | 'exploration';

export interface PublicAIRecommendation {
  summary: string;
  goodPoints: string[];
  missing: string[];
  nextAction: string;
  confidenceScore?: number;
}

export interface PublicQuestion {
  id: string;
  label: string;
  helper?: string;
  status: PublicQuestionStatus;
  answer?: string;
}

export interface PublicDraftOutput {
  proposalTitle: string;
  whatToMove: string;
  whyNow: string;
  impactedAudience: string;
  initialEvidence?: string;
  suggestedStakeholder?: string;
  supportNeeded?: string;
  decisionRequested?: string;
  suggestedChallengeType: PublicSuggestedChallengeType;
  suggestedKpiOrSignal?: string;
  missingCriticalFields: string[];
  risks: string[];
  nextRecommendedAction: string;
  confidenceScore?: number;
}

export interface PublicDraft {
  id: string;
  anonymousSessionId: string;
  mode: 'initiative';
  inputText: string;
  sourceType: PublicDraftSourceType;
  aiOutput: PublicDraftOutput;
  status: PublicDraftStatus;
  questions?: PublicQuestion[];
  aiRecommendation?: PublicAIRecommendation;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  convertedByUserId?: string;
  convertedProjectId?: string;
}
