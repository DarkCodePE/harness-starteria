import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FetchStructuredModelAdapter } from '../model/fetch-structured-model-adapter';
import { loadPortfolioEntryProviderConfig } from '../model/provider-config';
import { loadResolvedPromptManifest } from '../prompts/prompt-manifest';
import { LivePortfolioEntryAgentAdapter } from '../agent/live-portfolio-entry-agent-adapter';
import { LivePortfolioEntryHandoffMaterializer } from '../handoff/live-handoff-materializer';
import { PortfolioEntrySessionController } from '../session/session-controller';
import { createInitialSessionContext } from '../domain/session.types';
import { LiveModelExecutionError } from '../model/live-model-error';

const liveSmoke = process.env.PORTFOLIO_ENTRY_LIVE_SMOKE === '1' ? describe : describe.skip;

liveSmoke('Portfolio Entry real Responses smoke', () => {
  it('analyzes the 200 sales case and generates a provisional handoff', async () => {
    const config = loadPortfolioEntryProviderConfig();
    const prompts = loadResolvedPromptManifest();
    const candidate = {
      candidate_id: 'portfolio-entry-live-smoke',
      adapter_mode: 'live_llm_candidate' as const,
      provider: config.provider,
      model: config.model,
      prompt_manifest_hash: prompts.prompt_manifest_hash,
      contract_manifest_hash: 'portfolio-entry-contract-v0.1',
    };
    const model = new FetchStructuredModelAdapter(config);
    const adapter = new LivePortfolioEntryAgentAdapter(model, candidate, prompts);
    const sessionId = randomUUID();
    const context = createInitialSessionContext({ initial_mode: 'quick_clarification', quick_question_budget: 3 });
    try {
      const result = await new PortfolioEntrySessionController(adapter, { runId: randomUUID(), candidateId: candidate.candidate_id }).execute({
        caseId: sessionId,
        sessionId,
        runId: randomUUID(),
        candidateId: candidate.candidate_id,
        initialUserInput: 'Quiero generar 200 ventas de un nuevo producto hasta diciembre.',
        initialContext: context,
      });
      const turn = result.trace.turns.at(-1);
      expect(turn).toBeDefined();
      if (!turn) return;
      const handoff = await new LivePortfolioEntryHandoffMaterializer(model, candidate, prompts).materialize({
        sessionId, runId: randomUUID(), analysis: turn.analysis, context: result.final_context,
      });
      const summary = {
        provider: config.provider,
        model: config.model,
        analysisStatus: turn.analysis.status,
        initialEntryState: turn.analysis.initial_entry_state,
        currentFrame: turn.analysis.current_frame,
        primaryIntent: turn.analysis.primary_intent,
        clarificationStatus: result.final_context.clarification_status,
        questionCount: turn.questions_asked.length,
        handoffGenerated: Boolean(handoff.handoff),
        handoffSchemaValid: Boolean(handoff.modelExecution?.validated_output),
      };
      console.log(JSON.stringify(summary));
      expect(result.violations).toEqual([]);
      expect(turn.analysis.current_frame === 'portfolio_first' && turn.analysis.initial_entry_state !== 'portfolio_first').toBe(false);
      expect(handoff.modelExecution?.validated_output).not.toBeNull();
    } catch (error) {
      const execution = error instanceof LiveModelExecutionError ? error.result : undefined;
      console.error(JSON.stringify({
        provider: config.provider,
        model: config.model,
        failure: execution?.technical_error ?? (execution?.error_type === 'SCHEMA_ERROR' ? 'schema_error' : 'runtime_error'),
        schemaErrors: execution?.schema_errors,
      }));
      throw error;
    }
  }, 120_000);
});
