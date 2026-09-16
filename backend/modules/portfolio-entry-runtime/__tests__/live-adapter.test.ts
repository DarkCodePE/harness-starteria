import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { LivePortfolioEntryAgentAdapter } from '../agent/live-portfolio-entry-agent-adapter';
import { FetchStructuredModelAdapter } from '../model/fetch-structured-model-adapter';
import type { StructuredModelAdapter } from '../model/structured-model-adapter';
import type { ModelExecutionResult } from '../model/model-execution-types';
import { createInitialSessionContext } from '../domain/session.types';

describe('Portfolio Entry live adapter', () => {
  it('maps the validated Phase 5 structured response into the Runtime contract', async () => {
    const output = {
      analysis: { initial_entry_state: 'initiative_first', current_frame: 'initiative_first' },
      question_plan: { questions: [], question_count: 0, status: 'no_questions_required', stop_reason: 'sufficient_context' },
    };
    const execution = {
      provider_raw: { output: [] },
      parsed_output: output,
      validated_output: output,
      schema_errors: [],
      execution_metadata: {
        call_id: 'call-1', purpose: 'analysis_turn' as const, provider: 'openai_responses', model: 'gpt-5.6-luna',
        duration_ms: 12, retry_count: 0, seed_support: 'not_requested' as const,
      },
    } as ModelExecutionResult<unknown>;
    const model: StructuredModelAdapter = { generate: vi.fn().mockResolvedValue(execution) };
    const adapter = new LivePortfolioEntryAgentAdapter(model, {
      candidate_id: 'test-live', adapter_mode: 'live_llm_candidate', provider: 'openai_responses', model: 'gpt-5.6-luna',
      prompt_manifest_hash: 'prompt-hash', contract_manifest_hash: 'contract-hash',
    }, {
      prompt_version: '0.2', files: { agent: 'agent.md', skill_01: 'entry-01-intent-detection.md', skill_02: 'entry-02-context-extraction.md', skill_03: 'entry-03-reverse-alignment.md', skill_04: 'entry-04-question-planner.md', handoff: 'handoff.md' },
      file_hashes: {}, prompt_manifest_hash: 'prompt-hash',
    });

    const result = await adapter.analyzeTurn({
      entryId: 'session-turn-1', sessionId: 'session-1', rawInput: 'Entrada corporativa',
      sessionContext: createInitialSessionContext({ initial_mode: 'quick_clarification', quick_question_budget: 3 }),
    });

    expect(result.analysis).toEqual(output.analysis);
    expect(result.question_plan).toEqual(output.question_plan);
    expect(result.modelExecution?.execution_metadata.provider).toBe('openai_responses');
    expect(model.generate).toHaveBeenCalledWith(expect.objectContaining({ providerJsonSchema: expect.any(Object) }));
  });

  it('records requested and provider-reported model metadata from the provider call', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        model: 'gpt-5.6-luna-2026-09-12',
        output: [{
          type: 'message',
          content: [{ type: 'output_text', text: '{"ok":true}' }],
        }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });
    const adapter = new FetchStructuredModelAdapter({
      provider: 'openai_responses',
      model: 'gpt-5.6-luna',
      apiKey: 'test-key',
      baseUrl: 'https://provider.test/v1',
      timeoutMs: 1000,
    }, fetchImpl);

    const result = await adapter.generate({
      systemPrompt: 'system',
      userPayload: { input: 'test' },
      outputSchema: z.object({ ok: z.literal(true) }),
      metadata: {
        provider: 'openai_responses',
        model: 'gpt-5.6-luna',
        seed_support: 'not_requested',
      },
      call: { call_id: 'call-1', purpose: 'technical_smoke' },
    });

    expect(result.execution_metadata.requested_model).toBe('gpt-5.6-luna');
    expect(result.execution_metadata.provider_reported_model).toBe('gpt-5.6-luna-2026-09-12');
    expect(result.execution_metadata.model).toBe('gpt-5.6-luna');
  });
});
