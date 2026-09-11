import type { PortfolioEntryAnalysisV2 } from '../schemas/analysis.schema';
import type { PortfolioEntryHandoffV2 } from '../schemas/handoff.schema';
import type { SessionExecutionResult, SessionTrace } from '../session/session-types';

export type HandoffCandidateSourceV2 = PortfolioEntryHandoffV2;

export type HandoffGenerationInputV2 = {
  execution: SessionExecutionResult;
  final_analysis: PortfolioEntryAnalysisV2;
  candidate_source: unknown;
};

export type HandoffGenerationResultV2 = {
  handoff: PortfolioEntryHandoffV2 | null;
  schema_valid: boolean;
  errors: string[];
  raw_candidate: unknown;
  trace: SessionTrace;
};
