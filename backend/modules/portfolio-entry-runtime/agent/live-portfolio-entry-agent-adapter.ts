import type {
  PortfolioEntryAgentAdapterV2,
  PortfolioEntryAnalyzeTurnInputV2,
  PortfolioEntryAnalyzeTurnOutputV2,
} from './portfolio-entry-agent-adapter';
import type { StructuredModelAdapter } from '../model/structured-model-adapter';
import type { ModelExecutionResult } from '../model/model-execution-types';
import { LiveModelExecutionError } from '../model/live-model-error';
import { portfolioEntryTurnProviderJsonSchema } from '../model/provider-json-schemas';
import { composeAnalysisSystemPrompt, type ResolvedPromptManifest } from '../prompts/prompt-manifest';
import { portfolioEntryTurnOutputV2Schema, type PortfolioEntryTurnOutputV2 } from '../domain/model-output.schema';

export type PortfolioEntryLiveCandidate = {
  candidate_id: string;
  adapter_mode: 'live_llm_candidate';
  provider: string;
  model: string;
  temperature?: number;
  seed?: string | number;
  prompt_manifest_hash: string;
  contract_manifest_hash: string;
  seed_support?: 'provided' | 'unavailable' | 'not_requested';
};

export class LivePortfolioEntryAgentAdapter implements PortfolioEntryAgentAdapterV2 {
  readonly modelExecutions: ModelExecutionResult<PortfolioEntryTurnOutputV2>[] = [];

  constructor(
    private readonly model: StructuredModelAdapter,
    private readonly candidate: PortfolioEntryLiveCandidate,
    private readonly promptManifest: ResolvedPromptManifest,
    private readonly runContext: { repeat_index?: number } = {},
  ) {}

  async analyzeTurn(input: PortfolioEntryAnalyzeTurnInputV2): Promise<PortfolioEntryAnalyzeTurnOutputV2> {
    const result = await this.model.generate({
      systemPrompt: composeAnalysisSystemPrompt(this.promptManifest),
      userPayload: {
        rawInput: input.rawInput,
        priorAnalysis: input.priorAnalysis,
        sessionContext: input.sessionContext,
        available_question_budget: input.sessionContext.interaction_mode === 'quick_clarification'
          ? Math.max(0, input.sessionContext.quick_question_budget - input.sessionContext.quick_questions_asked)
          : Math.max(0, 3 - input.sessionContext.questions_asked_current_round),
        candidate: safeCandidatePayload(this.candidate),
      },
      outputSchema: portfolioEntryTurnOutputV2Schema,
      providerJsonSchema: portfolioEntryTurnProviderJsonSchema,
      metadata: {
        ...this.candidate,
        seed_support: this.candidate.seed_support ?? (this.candidate.seed === undefined ? 'not_requested' : 'unavailable'),
      },
      call: {
        call_id: `${input.sessionId}-turn-${input.entryId}`,
        purpose: 'analysis_turn',
        case_id: input.sessionId.split('-').slice(0, 4).join('-'),
        repeat_index: this.runContext.repeat_index,
        turn_index: Number(input.entryId.split('-').at(-1)) || undefined,
      },
    });
    this.modelExecutions.push(result);

    if (!result.validated_output) {
      throw new LiveModelExecutionError('Live model did not produce a schema-valid PortfolioEntry turn output.', result);
    }

    const validated = result.validated_output as unknown as PortfolioEntryAnalyzeTurnOutputV2;
    return { ...validated, modelExecution: result };
  }
}

function safeCandidatePayload(candidate: PortfolioEntryLiveCandidate): Record<string, unknown> {
  return {
    candidate_id: candidate.candidate_id,
    adapter_mode: candidate.adapter_mode,
    provider: candidate.provider,
    model: candidate.model,
    temperature: candidate.temperature,
    seed: candidate.seed,
    seed_support: candidate.seed_support,
    prompt_manifest_hash: candidate.prompt_manifest_hash,
    contract_manifest_hash: candidate.contract_manifest_hash,
  };
}
