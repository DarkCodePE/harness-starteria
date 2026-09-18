import { portfolioEntryHandoffV2Schema } from '../domain/handoff.schema';
import type { HandoffGenerationInputV2, HandoffGenerationResultV2 } from './handoff-types';
import { buildValueHandoffEvidenceV2 } from './value-handoff-evidence';

export function buildPortfolioEntryHandoffV2(input: HandoffGenerationInputV2): HandoffGenerationResultV2 {
  const parsed = portfolioEntryHandoffV2Schema.safeParse(input.candidate_source);

  return {
    handoff: parsed.success ? parsed.data : null,
    schema_valid: parsed.success,
    errors: parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    raw_candidate: input.candidate_source,
    trace: input.execution.trace,
    value_delta_evidence: parsed.success
      ? buildValueHandoffEvidenceV2({ execution: input.execution, handoff: parsed.data, analysis: input.final_analysis })
      : null,
  };
}
