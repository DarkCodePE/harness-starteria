import { z } from 'zod';
import { portfolioEntryAnalysisV2Schema, questionPlanV2Schema } from './analysis.schema';

export const portfolioEntryTurnOutputV2Schema = z.object({
  analysis: portfolioEntryAnalysisV2Schema,
  question_plan: questionPlanV2Schema,
}).strict();

export type PortfolioEntryTurnOutputV2 = z.infer<typeof portfolioEntryTurnOutputV2Schema>;
