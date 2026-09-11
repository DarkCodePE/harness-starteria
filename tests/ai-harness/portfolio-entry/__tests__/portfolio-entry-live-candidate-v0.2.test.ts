import { describe, expect, it, vi } from 'vitest';
import { FetchStructuredModelAdapter } from '../adapters/live-llm-adapter';
import type { StructuredModelGenerateInput } from '../adapters/structured-model-adapter';
import { LivePortfolioEntryAgentAdapter } from '../agent/live-portfolio-entry-agent-adapter';
import { generateLivePortfolioEntryHandoffV2 } from '../handoff/live-handoff-generator';
import { createLiveCandidateManifest } from '../manifests/candidate-manifest';
import { LiveModelExecutionError } from '../model/live-model-error';
import { loadPortfolioEntryHarnessProviderConfig, sanitizeProviderConfig, type PortfolioEntryHarnessProviderConfig } from '../model/provider-config';
import { shouldRetryModelExecution } from '../model/retry-policy';
import { loadResolvedPromptManifest } from '../prompts/prompt-manifest';
import { summarizeStability } from '../reporting/stability';
import { parseArgs } from '../runner';
import { liveFailureArtifact } from '../live/live-runner';
import { portfolioEntryHandoffV2Schema } from '../schemas/handoff.schema';
import { portfolioEntryTurnOutputV2Schema } from '../schemas/model-output.schema';
import type { SessionContext, SessionExecutionResult } from '../session/session-types';

const config: PortfolioEntryHarnessProviderConfig = {
  provider: 'openai_responses',
  model: 'test-model',
  apiKey: 'test-secret',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0,
  timeoutMs: 1_000,
};

describe('portfolio entry live candidate v0.2', () => {
  it('preserves provider_raw, parsed_output, and validated_output as separate layers', async () => {
    const validated = turnOutput();
    const providerRaw = { output_text: JSON.stringify(validated), usage: { input_tokens: 10 } };
    const adapter = new FetchStructuredModelAdapter(config, responseFetch(providerRaw));

    const result = await adapter.generate(turnCall(validated));

    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toEqual(validated);
    expect(result.validated_output).toEqual(validated);
    expect(result.provider_raw).not.toBe(result.parsed_output);
    expect(result.parsed_output).not.toBe(result.validated_output);
    expect(result.execution_metadata.usage).toEqual(providerRaw.usage);
  });

  it('uses the same Responses protocol with the DeepSeek base URL', async () => {
    let requestUrl = '';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      requestUrl = String(input);
      return response({ output_text: JSON.stringify(turnOutput()) });
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter({
      ...config,
      provider: 'deepseek_responses',
      model: 'deepseek-v4-flash',
      baseUrl: 'https://api.deepseek.com',
    }, fetchImpl);

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(requestUrl).toBe('https://api.deepseek.com/responses');
    expect(result.error_type).toBeUndefined();
    expect(result.validated_output).not.toBeNull();
  });

  it('extracts DeepSeek Responses message output_text while preserving reasoning in provider_raw', async () => {
    const expected = turnOutput();
    const providerRaw = responsesProviderRaw({
      reasoningText: 'We need answer only structured JSON, then decide.',
      outputText: JSON.stringify(expected),
      model: 'deepseek-flash',
    });
    const adapter = new FetchStructuredModelAdapter({ ...config, provider: 'deepseek_responses' }, responseFetch(providerRaw));

    const result = await adapter.generate(turnCall(expected));

    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toEqual(expected);
    expect(result.validated_output).toEqual(expected);
    expect(result.schema_errors).toEqual([]);
    expect(JSON.stringify(result.provider_raw)).toContain('We need answer only structured JSON');
  });

  it('extracts OpenAI Responses message output_text when reasoning is also present', async () => {
    const expected = turnOutput();
    const providerRaw = responsesProviderRaw({
      reasoningText: 'Internal reasoning before final answer.',
      outputText: JSON.stringify(expected),
      model: 'gpt-5.6-luna',
    });
    const adapter = new FetchStructuredModelAdapter(config, responseFetch(providerRaw));

    const result = await adapter.generate(turnCall(expected));

    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toEqual(expected);
    expect(result.validated_output).toEqual(expected);
    expect(result.schema_errors).toEqual([]);
  });

  it('reports a provider extraction failure when Responses output contains only reasoning', async () => {
    const providerRaw = {
      status: 'completed',
      output: [
        { type: 'reasoning', content: [{ type: 'reasoning_text', text: 'We need answer only structured JSON.' }] },
      ],
    };
    const adapter = new FetchStructuredModelAdapter(config, responseFetch(providerRaw));

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toBeNull();
    expect(result.validated_output).toBeNull();
    expect(result.error_type).toBe('SCHEMA_ERROR');
    expect(result.schema_errors).toEqual(['Provider response did not contain message output_text structured output.']);
  });

  it('reports a real schema parse error when message output_text contains invalid JSON', async () => {
    const providerRaw = responsesProviderRaw({
      reasoningText: 'Reasoning should be ignored.',
      outputText: '{not valid json',
    });
    const adapter = new FetchStructuredModelAdapter(config, responseFetch(providerRaw));

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toBeNull();
    expect(result.validated_output).toBeNull();
    expect(result.error_type).toBe('SCHEMA_ERROR');
    expect(result.schema_errors[0]).toContain('JSON');
  });

  it('never sends arbitrary reasoning_text to JSON.parse as the structured output candidate', async () => {
    const expected = turnOutput();
    const providerRaw = responsesProviderRaw({
      reasoningText: 'We need answer with arbitrary non-JSON reasoning.',
      outputText: JSON.stringify(expected),
    });
    const adapter = new FetchStructuredModelAdapter(config, responseFetch(providerRaw));

    const result = await adapter.generate(turnCall(expected));

    expect(result.error_type).toBeUndefined();
    expect(result.schema_errors).toEqual([]);
    expect(result.parsed_output).toEqual(expected);
  });

  it('resolves provider-specific base URLs without persisting secrets', () => {
    const openai = loadPortfolioEntryHarnessProviderConfig({
      PORTFOLIO_ENTRY_HARNESS_PROVIDER: 'openai_responses',
      PORTFOLIO_ENTRY_HARNESS_MODEL: 'gpt-5.6-luna',
      PORTFOLIO_ENTRY_HARNESS_API_KEY: 'secret-openai',
    });
    const deepseek = loadPortfolioEntryHarnessProviderConfig({
      PORTFOLIO_ENTRY_HARNESS_PROVIDER: 'deepseek_responses',
      PORTFOLIO_ENTRY_HARNESS_MODEL: 'deepseek-v4-flash',
      PORTFOLIO_ENTRY_HARNESS_API_KEY: 'secret-deepseek',
    });

    expect(openai.baseUrl).toBe('https://api.openai.com/v1');
    expect(deepseek.baseUrl).toBe('https://api.deepseek.com');
    expect(JSON.stringify(sanitizeProviderConfig(openai))).not.toContain('secret-openai');
    expect(JSON.stringify(sanitizeProviderConfig(deepseek))).not.toContain('secret-deepseek');
    expect(openai.temperature).toBeUndefined();
    expect(deepseek.temperature).toBeUndefined();
    expect(sanitizeProviderConfig(openai)).not.toHaveProperty('temperature');
  });

  it('parses configured temperature only when the env var is present', () => {
    const providerConfig = loadPortfolioEntryHarnessProviderConfig({
      PORTFOLIO_ENTRY_HARNESS_PROVIDER: 'openai_responses',
      PORTFOLIO_ENTRY_HARNESS_MODEL: 'model-with-temperature',
      PORTFOLIO_ENTRY_HARNESS_API_KEY: 'secret-openai',
      PORTFOLIO_ENTRY_HARNESS_TEMPERATURE: '0.2',
    });

    expect(providerConfig.temperature).toBe(0.2);
  });

  it('preserves schema-invalid output without fabricating an analysis', async () => {
    const parsedButInvalid = { analysis: { primary_intent: 'not-a-contract-value' }, question_plan: { questions: [] } };
    const adapter = new FetchStructuredModelAdapter(config, responseFetch({ output_text: JSON.stringify(parsedButInvalid) }));

    const result = await adapter.generate(turnCall(parsedButInvalid));

    expect(result.error_type).toBe('SCHEMA_ERROR');
    expect(result.parsed_output).toEqual(parsedButInvalid);
    expect(result.validated_output).toBeNull();
    expect(result.schema_errors.length).toBeGreaterThan(0);
  });

  it('does not retry schema or semantic failures', () => {
    expect(shouldRetryModelExecution({ errorType: 'schema_error', attempt: 1 }).retry).toBe(false);
    expect(shouldRetryModelExecution({ errorType: 'contract_failure', attempt: 1 }).retry).toBe(false);
  });

  it('retries one transient technical error and records it', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) throw new Error('temporary transport failure');
      return response({ output_text: JSON.stringify(turnOutput()) });
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter(config, fetchImpl);

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(calls).toBe(2);
    expect(result.validated_output).not.toBeNull();
    expect(result.execution_metadata.retry_count).toBe(1);
    expect(result.execution_metadata.retry_reason).toContain('transport');
  });

  it('omits temperature from the provider request and metadata when it is not configured', async () => {
    let requestPayload: Record<string, unknown> | undefined;
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestPayload = JSON.parse(String(init?.body));
      return response({ output_text: JSON.stringify(turnOutput()) });
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter({ ...config, temperature: undefined }, fetchImpl);

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(requestPayload).toBeDefined();
    expect(requestPayload).not.toHaveProperty('temperature');
    expect(result.execution_metadata).not.toHaveProperty('temperature');
  });

  it('sends configured temperature in the provider request and metadata', async () => {
    let requestPayload: Record<string, unknown> | undefined;
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestPayload = JSON.parse(String(init?.body));
      return response({ output_text: JSON.stringify(turnOutput()) });
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter({ ...config, temperature: 0.2 }, fetchImpl);

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(requestPayload).toMatchObject({ temperature: 0.2 });
    expect(result.execution_metadata.temperature).toBe(0.2);
  });

  it('does not retry provider request schema errors as transport failures', async () => {
    let calls = 0;
    const providerRaw = {
      error: {
        code: 'invalid_json_schema',
        message: "Invalid schema for response_format 'analysis_turn'.",
      },
    };
    const fetchImpl = (async () => {
      calls += 1;
      return {
        ok: false,
        status: 400,
        text: async () => JSON.stringify(providerRaw),
      } as Response;
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter(config, fetchImpl);

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(calls).toBe(1);
    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toBeNull();
    expect(result.validated_output).toBeNull();
    expect(result.error_type).toBe('TECHNICAL_ERROR');
    expect(result.technical_error).toContain('Provider error 400');
    expect(result.execution_metadata.retry_count).toBe(0);
    expect(result.execution_metadata.retry_reason).toBeUndefined();
  });

  it('keeps provider schema HTTP 400 errors at retry_count 0 for handoff generation', async () => {
    let calls = 0;
    const providerRaw = {
      error: {
        code: 'invalid_json_schema',
        message: "Invalid schema for response_format 'handoff_generation'.",
      },
    };
    const fetchImpl = (async () => {
      calls += 1;
      return {
        ok: false,
        status: 400,
        text: async () => JSON.stringify(providerRaw),
      } as Response;
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter(config, fetchImpl);

    const result = await adapter.generate({ ...turnCall(handoff()), outputSchema: portfolioEntryHandoffV2Schema, call: { call_id: 'handoff-1', purpose: 'handoff_generation' } });

    expect(calls).toBe(1);
    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.parsed_output).toBeNull();
    expect(result.validated_output).toBeNull();
    expect(result.error_type).toBe('TECHNICAL_ERROR');
    expect(result.execution_metadata.purpose).toBe('handoff_generation');
    expect(result.execution_metadata.retry_count).toBe(0);
  });

  it('does not retry provider unsupported-parameter 400 errors', async () => {
    let calls = 0;
    const providerRaw = {
      error: {
        code: null,
        param: 'temperature',
        message: "Unsupported parameter: 'temperature' is not supported with this model.",
      },
    };
    const fetchImpl = (async () => {
      calls += 1;
      return {
        ok: false,
        status: 400,
        text: async () => JSON.stringify(providerRaw),
      } as Response;
    }) as typeof fetch;
    const adapter = new FetchStructuredModelAdapter(config, fetchImpl);

    const result = await adapter.generate(turnCall(turnOutput()));

    expect(calls).toBe(1);
    expect(result.provider_raw).toEqual(providerRaw);
    expect(result.execution_metadata.retry_count).toBe(0);
    expect(result.execution_metadata.retry_reason).toBeUndefined();
  });

  it('does not persist the API key in sanitized configuration or candidate metadata', () => {
    const sanitized = sanitizeProviderConfig(config);
    const candidate = createLiveCandidateManifest({
      candidateId: 'candidate-test',
      provider: config.provider,
      model: config.model,
      promptManifestHash: 'prompt-hash',
      contractManifestHash: 'contract-hash',
    });

    expect(JSON.stringify(sanitized)).not.toContain(config.apiKey);
    expect(JSON.stringify(candidate)).not.toContain(config.apiKey);
    expect(candidate).not.toHaveProperty('temperature');
  });

  it('keeps deterministic as the default and gates live-only flags explicitly', () => {
    expect(parseArgs([])).toMatchObject({ adapter: 'deterministic', repeat: 1 });
    expect(parseArgs(['--adapter', 'live', '--type', 'multi_turn', '--repeat', '2', '--max-cases', '1', '--candidate-id', 'candidate-1']))
      .toMatchObject({ adapter: 'live', type: 'multi_turn', repeat: 2, maxCases: 1, candidateId: 'candidate-1' });
    expect(() => parseArgs(['--type', 'single_turn'])).toThrow('--type is only supported');
    expect(() => parseArgs(['--max-cases', '1'])).toThrow('--max-cases is only supported');
    expect(() => parseArgs(['--candidate-id', 'candidate-1'])).toThrow('--candidate-id is only supported');
  });

  it('creates and resolves the prompt manifest with content hashes', () => {
    const manifest = loadResolvedPromptManifest();

    expect(manifest.prompt_version).toBe('0.2');
    expect(manifest.prompt_manifest_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(manifest.files)).toEqual(expect.arrayContaining([
      'agent',
      'skill_01',
      'skill_02',
      'skill_03',
      'skill_04',
      'handoff',
    ]));
    expect(Object.values(manifest.file_hashes).every((hash) => /^[a-f0-9]{64}$/.test(hash))).toBe(true);
  });

  it('keeps session mode under the Session Controller boundary', async () => {
    const model = {
      generate: vi.fn(async () => ({
        provider_raw: { output_text: '{}' },
        parsed_output: turnOutput(),
        validated_output: turnOutput(),
        schema_errors: [],
        execution_metadata: {
          call_id: 'call-1', case_id: 'case-1', repeat_index: 1, turn_index: 1,
          purpose: 'analysis_turn' as const, provider: 'mock', model: 'mock', temperature: 0,
          seed_support: 'not_requested' as const, duration_ms: 1, retry_count: 0,
        },
      })),
    };
    const agent = new LivePortfolioEntryAgentAdapter(model, testCandidate(), loadResolvedPromptManifest());
    const context = sessionContext();
    const output = await agent.analyzeTurn({
      entryId: 'entry-1', sessionId: 'session-1', rawInput: 'Necesitamos ordenar el portfolio.', sessionContext: context,
    });

    expect(output.analysis).toEqual(turnOutput().analysis);
    expect(context.interaction_mode).toBe('quick_clarification');
    expect(output).not.toHaveProperty('interaction_mode');
  });

  it('requires a completed execution before making the separate handoff call', async () => {
    const model = {
      generate: vi.fn(async () => ({
        provider_raw: {}, parsed_output: handoff(), validated_output: handoff(), schema_errors: [],
        execution_metadata: {
          call_id: 'handoff-1', case_id: 'case-1', repeat_index: 1,
          purpose: 'handoff_generation' as const, provider: 'mock', model: 'mock', temperature: 0,
          seed_support: 'not_requested' as const, duration_ms: 1, retry_count: 0,
        },
      })),
    };
    const unfinished = execution(false);

    await expect(generateLivePortfolioEntryHandoffV2({
      model,
      candidate: testCandidate(),
      promptManifest: loadResolvedPromptManifest(),
      execution: unfinished,
      repeatIndex: 1,
    })).rejects.toThrow('completed');
    expect(model.generate).not.toHaveBeenCalled();
  });

  it('keeps every repeat observable and does not select a best run', () => {
    const summary = summarizeStability([
      { case_id: 'case-1', repeat_index: 1, evaluated: { contract_result: 'PASS', failure_codes: [] } as never },
      { case_id: 'case-1', repeat_index: 2, evaluated: { contract_result: 'FAIL', failure_codes: ['F-SCHEMA'] } as never },
      { case_id: 'case-1', repeat_index: 3, evaluated: { contract_result: 'PASS', failure_codes: [] } as never },
    ]);

    expect(summary).toHaveLength(1);
    expect(summary[0].repeat_count).toBe(3);
    expect(summary[0].values.contract_result).toEqual(['PASS', 'FAIL', 'PASS']);
    expect(summary[0].values.contract_result.filter((result) => result === 'PASS')).toHaveLength(2);
    expect(summary[0].values.contract_result.filter((result) => result === 'FAIL')).toHaveLength(1);
    expect(summary[0].values.contract_result).not.toEqual(['PASS']);
  });

  it('keeps multi-turn repeat state independent at the execution boundary', async () => {
    const calls: string[] = [];
    const adapter = {
      analyzeTurn: vi.fn(async (input: { sessionId: string }) => {
        calls.push(input.sessionId);
        return { analysis: turnOutput().analysis, question_plan: turnOutput().question_plan };
      }),
    };

    await adapter.analyzeTurn({ sessionId: 'case-repeat-1' });
    await adapter.analyzeTurn({ sessionId: 'case-repeat-1' });
    await adapter.analyzeTurn({ sessionId: 'case-repeat-2' });
    await adapter.analyzeTurn({ sessionId: 'case-repeat-2' });

    expect(calls).toEqual(['case-repeat-1', 'case-repeat-1', 'case-repeat-2', 'case-repeat-2']);
    expect(new Set(calls.slice(0, 2))).toEqual(new Set(['case-repeat-1']));
    expect(new Set(calls.slice(2))).toEqual(new Set(['case-repeat-2']));
  });

  it('wraps invalid live output as a technical schema execution failure', async () => {
    const model = new FetchStructuredModelAdapter(config, responseFetch({ output_text: JSON.stringify({}) }));
    const agent = new LivePortfolioEntryAgentAdapter(model, testCandidate(), loadResolvedPromptManifest());

    await expect(agent.analyzeTurn({
      entryId: 'entry-1', sessionId: 'session-1', rawInput: 'Entrada', sessionContext: sessionContext(),
    })).rejects.toSatisfy((error: unknown) => error instanceof LiveModelExecutionError && error.result.validated_output === null);
  });

  it('preserves analysis success plus later handoff failure in raw model executions', () => {
    const analysisSuccess = modelExecution('analysis-call', 'analysis_turn', turnOutput(), turnOutput());
    const handoffFailure = modelExecution('handoff-call', 'handoff_generation', null, null, 'TECHNICAL_ERROR');
    const error = new LiveModelExecutionError('Live model did not produce a schema-valid PortfolioEntryHandoff.', handoffFailure);

    const artifact = liveFailureArtifact({ case_id: 'PE2-ST-LIVE-01' }, 1, error, 123, [analysisSuccess]);

    expect(artifact.model_executions).toEqual([analysisSuccess, handoffFailure]);
  });

  it('does not duplicate raw analysis execution when the failing analysis call is already tracked', () => {
    const analysisFailure = modelExecution('analysis-call', 'analysis_turn', null, null, 'SCHEMA_ERROR');
    const error = new LiveModelExecutionError('Live model did not produce a schema-valid PortfolioEntry turn output.', analysisFailure);

    const artifact = liveFailureArtifact({ case_id: 'PE2-ST-LIVE-01' }, 1, error, 123, [analysisFailure]);

    expect(artifact.model_executions).toEqual([analysisFailure]);
  });

  it('keeps Handoff domain unresolved sentinel distinct from null', () => {
    expect(portfolioEntryHandoffV2Schema.safeParse(handoff()).success).toBe(true);
    expect(portfolioEntryHandoffV2Schema.safeParse({ ...handoff(), decision_to_enable: null }).success).toBe(false);
  });
});

function responseFetch(body: unknown): typeof fetch {
  return (async () => response(body)) as typeof fetch;
}

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

function responsesProviderRaw(input: { reasoningText: string; outputText: string; model?: string }) {
  return {
    object: 'response',
    status: 'completed',
    error: null,
    model: input.model ?? 'test-model',
    output: [
      {
        type: 'reasoning',
        status: 'completed',
        content: [{ type: 'reasoning_text', text: input.reasoningText }],
      },
      {
        type: 'message',
        status: 'completed',
        content: [{ type: 'output_text', text: input.outputText }],
      },
    ],
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

function turnCall(output: unknown): StructuredModelGenerateInput<unknown> {
  return {
    call: { call_id: 'call-1', case_id: 'case-1', repeat_index: 1, turn_index: 1, purpose: 'analysis_turn' },
    systemPrompt: 'test',
    userPayload: { rawInput: 'test' },
    outputSchema: portfolioEntryTurnOutputV2Schema,
    providerJsonSchema: {},
  };
}

function turnOutput() {
  return portfolioEntryTurnOutputV2Schema.parse({
    analysis: {
      entry_id: 'entry-1',
      analysis_version: 'live-test-v0.2',
      primary_intent: 'initiative_governance',
      secondary_intents: [],
      initial_entry_state: 'problem_first',
      current_frame: 'problem_first',
      extracted_context: {},
      ambiguities: [],
      contradictions: [],
      reverse_alignment: { required: false, status: 'not_required' },
      provenance: [],
      status: 'ready',
    },
    question_plan: { questions: [], question_count: 0, status: 'no_questions_required', stop_reason: 'sufficient_context' },
  });
}

function handoff() {
  return portfolioEntryHandoffV2Schema.parse({
    understanding: { value: 'El equipo necesita ordenar su portfolio.' },
    desired_outcome: { value: 'Definir una forma clara de gobernar iniciativas.' },
    decision_to_enable: 'unresolved',
    alternative_approaches: [],
    known_context: [],
    unresolved_context: [],
    gap_resolution_map: [],
    evidence_or_clarity_needed: [],
    starteria_path: [{ action: 'structure', description: 'Organizar el contexto.' }],
    recommended_cta: 'Estructurar mi portfolio',
    provenance_summary: [],
    handoff_status: 'ready',
  });
}

function testCandidate() {
  return createLiveCandidateManifest({
    candidateId: 'candidate-test',
    provider: 'mock',
    model: 'mock',
    temperature: 0,
    promptManifestHash: 'prompt-hash',
    contractManifestHash: 'contract-hash',
  });
}

function sessionContext(): SessionContext {
  return {
    interaction_mode: 'quick_clarification',
    quick_question_budget: 3,
    quick_questions_asked: 0,
    exploration_round: 0,
    questions_asked_current_round: 0,
    previous_questions: [],
    answered_gaps: [],
    exploration_goal: null,
    user_exploration_choice: 'not_offered',
    clarification_status: 'in_progress',
    stop_reason: null,
  };
}

function execution(completed: boolean): SessionExecutionResult {
  return {
    completed,
    stop_reason: completed ? 'sufficient_context' : 'questions_required',
    violations: [],
    final_context: sessionContext(),
    trace: {
      case_id: 'case-1', run_id: 'run-1', candidate_id: 'candidate-test', turns: [],
      questions_total: 0, quick_questions_total: 0, exploration_rounds: 0,
      mode_transitions: [], stop_reason: completed ? 'sufficient_context' : 'questions_required',
      clarification_status: completed ? 'ready_for_handoff' : 'in_progress', execution_guard_triggered: false,
    },
  };
}

function modelExecution(
  callId: string,
  purpose: 'analysis_turn' | 'handoff_generation',
  parsedOutput: unknown,
  validatedOutput: unknown,
  errorType?: 'TECHNICAL_ERROR' | 'SCHEMA_ERROR',
) {
  return {
    provider_raw: parsedOutput ? { output_text: JSON.stringify(parsedOutput) } : { error: { message: 'Provider error 400' } },
    parsed_output: parsedOutput,
    validated_output: validatedOutput,
    schema_errors: [],
    execution_metadata: {
      call_id: callId,
      case_id: 'PE2-ST-LIVE-01',
      repeat_index: 1,
      purpose,
      provider: 'mock',
      model: 'mock',
      seed_support: 'not_requested' as const,
      duration_ms: 1,
      retry_count: 0,
    },
    error_type: errorType,
    technical_error: errorType === 'TECHNICAL_ERROR' ? 'Provider error 400' : undefined,
  };
}
