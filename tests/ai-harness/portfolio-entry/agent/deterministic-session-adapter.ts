import { ExperimentalPortfolioEntryAgent } from './experimental-portfolio-entry-agent';
import type {
  PortfolioEntryAgentAdapterV2,
  PortfolioEntryAnalyzeTurnInputV2,
  PortfolioEntryAnalyzeTurnOutputV2,
} from './portfolio-entry-agent-adapter-v0.2';
import type { PortfolioEntryAnalysis } from '../types';

export class DeterministicSessionAdapter implements PortfolioEntryAgentAdapterV2 {
  constructor(private readonly baseline = new ExperimentalPortfolioEntryAgent()) {}

  async analyzeTurn(input: PortfolioEntryAnalyzeTurnInputV2): Promise<PortfolioEntryAnalyzeTurnOutputV2> {
    const legacy = await this.baseline.analyze({ entryId: input.entryId, rawInput: input.rawInput });
    return projectLegacyAnalysisToTurnOutputV2(legacy, input.priorAnalysis?.initial_entry_state);
  }
}

export function projectLegacyAnalysisToTurnOutputV2(
  legacy: PortfolioEntryAnalysis,
  stableInitialEntryState = legacy.entry_state,
): PortfolioEntryAnalyzeTurnOutputV2 {
  return {
    analysis: {
      entry_id: legacy.entry_id,
      analysis_version: `${legacy.analysis_version}+session-v0.2-projection`,
      primary_intent: legacy.primary_intent === 'unknown' ? 'unknown' : legacy.primary_intent,
      secondary_intents: legacy.secondary_intents,
      initial_entry_state: stableInitialEntryState,
      current_frame: legacy.entry_state,
      extracted_context: legacy.extracted_context,
      ambiguities: legacy.ambiguities,
      contradictions: legacy.contradictions,
      reverse_alignment: {
        required: legacy.reverse_alignment_required,
        subject_type: legacy.reverse_alignment_gap.subject_type,
        subject: legacy.reverse_alignment_gap.subject,
        connection_state: legacy.reverse_alignment_gap.connection_state,
        present_links: legacy.reverse_alignment_gap.present_links,
        missing_links: legacy.reverse_alignment_gap.missing_links,
        suggested_focus: legacy.reverse_alignment_gap.suggested_focus,
        status: legacy.reverse_alignment_gap.connection_state,
      },
      provenance: legacy.provenance,
      status: legacy.analysis_status === 'ready' && legacy.question_plan.length > 0 ? 'pending' : legacy.analysis_status,
    },
    question_plan: {
      questions: legacy.question_plan.map((question) => ({
        ...question,
        question_type: legacy.reverse_alignment_required ? 'reverse_alignment' : 'clarification',
      })),
      question_count: legacy.question_plan.length,
      status: legacy.question_plan.length > 0 ? 'questions_required' : 'no_questions_required',
      stop_reason: legacy.question_plan.length > 0 ? undefined : 'sufficient_context',
    },
  };
}
