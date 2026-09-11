import { portfolioEntryHandoffV2Schema } from '../schemas/handoff.schema';
import type { HandoffGenerationInputV2, HandoffGenerationResultV2 } from './handoff-types';

export function buildPortfolioEntryHandoffV2(input: HandoffGenerationInputV2): HandoffGenerationResultV2 {
  const parsed = portfolioEntryHandoffV2Schema.safeParse(input.candidate_source);

  return {
    handoff: parsed.success ? parsed.data : null,
    schema_valid: parsed.success,
    errors: parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    raw_candidate: input.candidate_source,
    trace: input.execution.trace,
  };
}
