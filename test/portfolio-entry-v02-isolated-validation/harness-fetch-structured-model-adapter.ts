import { performance } from 'node:perf_hooks';
import type { PortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import type { ModelExecutionResult } from '../../backend/modules/portfolio-entry-runtime/model/model-execution-types';
import type { StructuredModelAdapter, StructuredModelGenerateInput } from '../../backend/modules/portfolio-entry-runtime/model/structured-model-adapter';

export class HarnessFetchStructuredModelAdapter implements StructuredModelAdapter {
  constructor(private readonly config: PortfolioEntryProviderConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  async generate<T>(input: StructuredModelGenerateInput<T>): Promise<ModelExecutionResult<T>> {
    const started = performance.now();
    try {
      const raw = await this.callProvider(input);
      const parsed = parseProviderOutput(raw);
      const durationMs = Math.round(performance.now() - started);
      if (!parsed.success) return this.result(input, raw, null, null, [parsed.error], durationMs, 'SCHEMA_ERROR');
      const validated = input.outputSchema.safeParse(parsed.output);
      if (!validated.success) {
        return this.result(input, raw, parsed.output, null, validated.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`), durationMs, 'SCHEMA_ERROR');
      }
      return this.result(input, raw, parsed.output, validated.data, [], durationMs);
    } catch (error) {
      const durationMs = Math.round(performance.now() - started);
      return {
        provider_raw: null,
        parsed_output: null,
        validated_output: null,
        schema_errors: [],
        execution_metadata: this.metadata(input, durationMs),
        error_type: 'TECHNICAL_ERROR',
        technical_error: error instanceof Error ? error.message : 'Provider transport failure',
      };
    }
  }

  private async callProvider<T>(input: StructuredModelGenerateInput<T>): Promise<unknown> {
    const response = await this.fetchImpl(`${this.config.baseUrl}/responses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        ...(this.config.temperature !== undefined ? { temperature: this.config.temperature } : {}),
        input: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: JSON.stringify(input.userPayload) },
        ],
        text: input.providerJsonSchema ? {
          format: { type: 'json_schema', name: input.call.purpose, strict: true, schema: input.providerJsonSchema },
        } : { format: { type: 'json_object' } },
      }),
    });
    const bodyText = await response.text();
    let body: unknown = bodyText;
    try { body = JSON.parse(bodyText); } catch { /* preserve non-JSON body for diagnostics */ }
    if (!response.ok) {
      const error = body && typeof body === 'object' && 'error' in body ? (body as { error?: unknown }).error : undefined;
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : 'unspecified';
      throw new Error(`Provider request failed: provider=${this.config.provider} model=${this.config.model} status=${response.status} error=${code}`);
    }
    return body;
  }

  private result<T>(input: StructuredModelGenerateInput<T>, raw: unknown, parsed: unknown, validated: T | null, schemaErrors: string[], durationMs: number, errorType?: 'SCHEMA_ERROR'): ModelExecutionResult<T> {
    return { provider_raw: raw, parsed_output: parsed, validated_output: validated, schema_errors: schemaErrors, execution_metadata: this.metadata(input, durationMs), ...(errorType ? { error_type: errorType } : {}) };
  }

  private metadata<T>(input: StructuredModelGenerateInput<T>, durationMs: number): ModelExecutionResult<T>['execution_metadata'] {
    return {
      call_id: input.call.call_id,
      case_id: input.call.case_id,
      repeat_index: input.call.repeat_index,
      turn_index: input.call.turn_index,
      purpose: input.call.purpose,
      provider: this.config.provider,
      requested_model: this.config.model,
      model: this.config.model,
      seed: this.config.seed,
      seed_support: this.config.seed === undefined ? 'not_requested' : 'unavailable',
      duration_ms: durationMs,
      retry_count: 0,
      usage: undefined,
      fallback_used: false,
    };
  }
}

function parseProviderOutput(raw: unknown): { success: true; output: unknown } | { success: false; error: string } {
  const text = extractText(raw);
  if (!text) return { success: false, error: 'Provider response did not contain structured output text.' };
  try { return { success: true, output: JSON.parse(text) }; } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Invalid provider JSON' }; }
}

function extractText(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return typeof raw === 'string' ? raw : null;
  const record = raw as Record<string, unknown>;
  if (typeof record.output_text === 'string') return record.output_text;
  if (!Array.isArray(record.output)) return null;
  const texts: string[] = [];
  for (const item of record.output) {
    if (!item || typeof item !== 'object' || (item as Record<string, unknown>).type !== 'message') continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const child of content) {
      if (!child || typeof child !== 'object') continue;
      const childRecord = child as Record<string, unknown>;
      if (childRecord.type === 'output_text' && typeof childRecord.text === 'string') texts.push(childRecord.text);
    }
  }
  return texts.length === 1 ? texts[0] : null;
}
