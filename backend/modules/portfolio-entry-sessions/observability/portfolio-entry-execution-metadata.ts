import type { ModelExecutionPurpose } from '../../portfolio-entry-runtime/model/model-execution-types';

export type PortfolioEntryModelExecutionRecord = {
  id: string;
  sessionId: string;
  turnId?: string | null;
  handoffId?: string | null;
  purpose: ModelExecutionPurpose;
  provider: string;
  requestedModel: string;
  providerReportedModel?: string | null;
  callId: string;
  durationMs: number;
  retryCount: number;
  usage?: unknown;
  technicalError?: string | null;
  schemaErrors: string[];
  parsedOutputPresent: boolean;
  validatedOutputPresent: boolean;
  createdAt: Date;
};
