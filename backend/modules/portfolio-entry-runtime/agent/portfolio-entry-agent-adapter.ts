import type { PortfolioEntryAnalysisV2, QuestionPlanV2 } from '../domain/analysis.schema';
import type { SessionContext } from '../domain/session.types';
import type { ModelExecutionResult } from '../model/model-execution-types';

export type PortfolioEntryAnalyzeTurnInputV2 = {
  entryId: string;
  sessionId: string;
  rawInput: string;
  priorAnalysis?: PortfolioEntryAnalysisV2;
  sessionContext: SessionContext;
  candidate?: unknown;
};

export type PortfolioEntryAnalyzeTurnOutputV2 = {
  analysis: PortfolioEntryAnalysisV2;
  question_plan: QuestionPlanV2;
  modelExecution?: ModelExecutionResult<unknown>;
};

export interface PortfolioEntryAgentAdapterV2 {
  analyzeTurn(input: PortfolioEntryAnalyzeTurnInputV2): Promise<PortfolioEntryAnalyzeTurnOutputV2>;
}
