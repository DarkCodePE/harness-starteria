import type { StructuredModelAdapter } from '../model/structured-model-adapter';
import type { PortfolioEntryHandoffMaterializer } from './handoff-materializer';
import type { PortfolioEntryAnalysisV2 } from '../domain/analysis.schema';
import type { SessionContext } from '../domain/session.types';
import { LiveModelExecutionError } from '../model/live-model-error';
import type { ModelExecutionResult } from '../model/model-execution-types';
import { portfolioEntryHandoffProviderJsonSchema } from '../model/provider-json-schemas';
import { composeHandoffSystemPrompt, type ResolvedPromptManifest } from '../prompts/prompt-manifest';
import { portfolioEntryHandoffV2Schema, type PortfolioEntryHandoffV2 } from '../domain/handoff.schema';
import type { SessionExecutionResult } from '../domain/session.types';
import { buildPortfolioEntryHandoffV2 } from './handoff-builder';

export type LiveHandoffGenerationOutput = ReturnType<typeof buildPortfolioEntryHandoffV2> & {
  model_execution: ModelExecutionResult<PortfolioEntryHandoffV2>;
};

export async function generateLivePortfolioEntryHandoffV2(input: {
  model: StructuredModelAdapter;
  candidate: PortfolioEntryLiveHandoffCandidate;
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

function safeCandidatePayload(candidate: PortfolioEntryLiveHandoffCandidate): Record<string, unknown> {
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

export type PortfolioEntryLiveHandoffCandidate = {
  candidate_id: string;
  adapter_mode: 'live_llm_candidate';
  provider: string;
  model: string;
  prompt_manifest_hash: string;
  contract_manifest_hash: string;
  temperature?: number;
  seed?: string | number;
  seed_support?: 'provided' | 'unavailable' | 'not_requested';
};

export class LivePortfolioEntryHandoffMaterializer implements PortfolioEntryHandoffMaterializer {
  constructor(
    private readonly model: StructuredModelAdapter,
    private readonly candidate: PortfolioEntryLiveHandoffCandidate,
    private readonly promptManifest: ResolvedPromptManifest,
  ) {}

  async materialize(input: { sessionId: string; runId: string; analysis: PortfolioEntryAnalysisV2; context: SessionContext }): Promise<{ handoff: PortfolioEntryHandoffV2; modelExecution?: ModelExecutionResult<unknown> }> {
    const execution = this.syntheticExecution(input);
    const generated = await generateLivePortfolioEntryHandoffV2({
      model: this.model,
      candidate: this.candidate,
      promptManifest: this.promptManifest,
      execution,
    });
    if (!generated.handoff || !generated.schema_valid) throw new Error('Live handoff output was not schema-valid.');
    return { handoff: generated.handoff, modelExecution: generated.model_execution };
  }

  private syntheticExecution(input: { sessionId: string; runId: string; analysis: PortfolioEntryAnalysisV2; context: SessionContext }): SessionExecutionResult {
    return {
      trace: {
        case_id: input.sessionId,
        run_id: input.runId,
        candidate_id: this.candidate.candidate_id,
        turns: [{ analysis: input.analysis } as SessionExecutionResult['trace']['turns'][number]],
        questions_total: input.context.previous_questions.length,
        quick_questions_total: input.context.quick_questions_asked,
        exploration_rounds: input.context.exploration_round,
        mode_transitions: [],
        stop_reason: input.context.stop_reason,
        clarification_status: input.context.clarification_status,
        execution_guard_triggered: false,
      },
      final_context: input.context,
      completed: true,
      stop_reason: input.context.stop_reason,
      violations: [],
    };
  }
}
