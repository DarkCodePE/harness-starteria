import type { ConversationalAssessmentResult } from '../domain/copilot.types';
import type { IntentAssessment, SourceReference } from '../domain/copilot.types';

export type CopilotAssessmentAdapterInput = {
  conversationId: string;
  messageId: string;
  content: string;
  organizationId: string;
  userId: string;
  previousAssessment?: IntentAssessment | null;
  sourceReferences?: SourceReference[];
};

export type CopilotAssessmentAdapter = {
  adapterType: string;
  version: string;
  assess(input: CopilotAssessmentAdapterInput): Promise<ConversationalAssessmentResult>;
};
