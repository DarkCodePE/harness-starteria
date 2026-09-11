import type { StructuredModelAdapter } from '../adapters/structured-model-adapter';
import type { CandidateManifest } from '../manifests/candidate-manifest';
import { LiveModelExecutionError } from '../model/live-model-error';
import type { ModelExecutionResult } from '../model/model-execution-types';
import { portfolioEntryHandoffProviderJsonSchema } from '../model/portfolio-entry-json-schemas';
import { composeHandoffSystemPrompt, type ResolvedPromptManifest } from '../prompts/prompt-manifest';
import { portfolioEntryHandoffV2Schema, type PortfolioEntryHandoffV2 } from '../schemas/handoff.schema';
import type { SessionExecutionResult } from '../session/session-types';
import { buildPortfolioEntryHandoffV2 } from './portfolio-entry-handoff-builder';
import type { HandoffGenerationResultV2 } from './handoff-types';

export type LiveHandoffGenerationOutput = HandoffGenerationResultV2 & {
  model_execution: ModelExecutionResult<PortfolioEntryHandoffV2>;
};

export async function generateLivePortfolioEntryHandoffV2(input: {
  model: StructuredModelAdapter;
  candidate: CandidateManifest & { adapter_mode: 'live_llm_candidate'; seed_support?: 'provided' | 'unavailable' | 'not_requested' };
  promptManifest: ResolvedPromptManifest;
  execution: SessionExecutionResult;
  repeatIndex?: number;
}): Promise<LiveHandoffGenerationOutput> {
  if (!input.execution.completed) {
    throw new Error('Live Handoff generation requires a completed or closing SessionExecutionResult.');
  }

  const finalAnalysis = input.execution.trace.turns.at(-1)?.analysis;
  if (!finalAnalysis) {
    throw new Error('Live Handoff generation requires final analysis.');
  }

  const modelExecution = await input.model.generate({
    systemPrompt: composeHandoffSystemPrompt(input.promptManifest),
    userPayload: {
      final_analysis: finalAnalysis,
      final_context: input.execution.final_context,
      trace_summary: {
        case_id: input.execution.trace.case_id,
        turns: input.execution.trace.turns.length,
        questions_total: input.execution.trace.questions_total,
        quick_questions_total: input.execution.trace.quick_questions_total,
        exploration_rounds: input.execution.trace.exploration_rounds,
        clarification_status: input.execution.trace.clarification_status,
        stop_reason: input.execution.trace.stop_reason,
      },
      candidate: safeCandidatePayload(input.candidate),
    },
    outputSchema: portfolioEntryHandoffV2Schema,
    providerJsonSchema: portfolioEntryHandoffProviderJsonSchema,
    metadata: {
      ...input.candidate,
      seed_support: input.candidate.seed_support ?? (input.candidate.seed === undefined ? 'not_requested' : 'unavailable'),
    },
    call: {
      call_id: `${input.execution.trace.run_id}-${input.execution.trace.case_id}-handoff`,
      purpose: 'handoff_generation',
      case_id: input.execution.trace.case_id,
      repeat_index: input.repeatIndex,
    },
  });

  if (!modelExecution.validated_output) {
    throw new LiveModelExecutionError('Live model did not produce a schema-valid PortfolioEntryHandoff.', modelExecution);
  }

  return {
    ...buildPortfolioEntryHandoffV2({
      execution: input.execution,
      final_analysis: finalAnalysis,
      candidate_source: modelExecution.validated_output,
    }),
    model_execution: modelExecution,
  };
}

function safeCandidatePayload(candidate: CandidateManifest): Record<string, unknown> {
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
