import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { FetchStructuredModelAdapter } from '../../backend/modules/portfolio-entry-runtime/model/fetch-structured-model-adapter';
import { loadPortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import { HarnessFetchStructuredModelAdapter } from './harness-fetch-structured-model-adapter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_STRUCTURED_OUTPUT_WIRING_AUDIT_v0.1.json');

const minimalSchema = z.object({
  next_action: z.enum(['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT']),
  routing_target: z.string().nullable(),
  visible_question: z.string().nullable(),
  stop_rationale: z.string().nullable(),
  deferred_gaps: z.array(z.string()),
}).strict();

const providerSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    next_action: { type: 'string', enum: ['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT'] },
    routing_target: { type: ['string', 'null'] },
    visible_question: { type: ['string', 'null'] },
    stop_rationale: { type: ['string', 'null'] },
    deferred_gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['next_action', 'routing_target', 'visible_question', 'stop_rationale', 'deferred_gaps'],
} as const;

function outputText(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.output_text === 'string') return record.output_text;
  if (!Array.isArray(record.output)) return null;
  for (const item of record.output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const child of content) {
      if (!child || typeof child !== 'object') continue;
      const childRecord = child as Record<string, unknown>;
      if (childRecord.type === 'output_text' && typeof childRecord.text === 'string') return childRecord.text;
    }
  }
  return null;
}

function responseSnapshot(raw: unknown) {
  if (!raw || typeof raw !== 'object') return { kind: typeof raw };
  const record = raw as Record<string, unknown>;
  const text = outputText(raw);
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
  return {
    provider_model: record.model,
    output_text_json: parsed,
    output_field_presence: parsed && typeof parsed === 'object'
      ? Object.fromEntries(['next_action', 'routing_target', 'visible_question', 'stop_rationale', 'deferred_gaps'].map((key) => [key, Object.prototype.hasOwnProperty.call(parsed, key)]))
      : null,
    output_field_nulls: parsed && typeof parsed === 'object'
      ? Object.fromEntries(['routing_target', 'visible_question', 'stop_rationale'].map((key) => [key, (parsed as Record<string, unknown>)[key] === null]))
      : null,
  };
}

async function main() {
  const config = loadPortfolioEntryProviderConfig();
  const useHarnessAdapter = process.argv.includes('--harness');
  const requests: unknown[] = [];
  const responses: unknown[] = [];
  const capturedFetch: typeof fetch = async (input, init) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, any>;
    requests.push({
      endpoint_path: new URL(String(input)).pathname,
      method: init?.method,
      header_names: Object.keys((init?.headers ?? {}) as Record<string, string>).sort(),
      model: body.model,
      text_format: body.text?.format,
    });
    const response = await fetch(input, init);
    const clone = response.clone();
    let bodyJson: unknown;
    try { bodyJson = JSON.parse(await clone.text()); } catch { bodyJson = { non_json: true }; }
    responses.push({ status: response.status, ok: response.ok, body: responseSnapshot(bodyJson) });
    return response;
  };

  const model = useHarnessAdapter
    ? new HarnessFetchStructuredModelAdapter(config, capturedFetch)
    : new FetchStructuredModelAdapter(config, capturedFetch);
  const calls = [];
  for (let index = 1; index <= 5; index += 1) {
    const result = await model.generate({
      systemPrompt: 'Return ASK with a visible question. Return null for fields that do not apply.',
      userPayload: { audit_call: index },
      outputSchema: minimalSchema,
      providerJsonSchema: providerSchema,
      metadata: { candidate_id: 'portfolio-entry-structured-output-wiring-audit', adapter_mode: 'live_llm_candidate', provider: config.provider, model: config.model, seed_support: 'not_requested' },
      call: { call_id: `structured-output-wiring-audit-${index}`, purpose: 'technical_smoke' },
    });
    calls.push({
      index,
      validation_status: result.validated_output ? 'VALID_OUTPUT' : 'PROVIDER_SCHEMA_INVALID',
      schema_errors: result.schema_errors,
      parsed_output: result.parsed_output,
      validated_output: result.validated_output,
    });
  }

  const snapshot = {
    audit: 'HARNESS_ONLY_STRUCTURED_OUTPUT_WIRING',
    provider: config.provider,
    model: config.model,
    structured_output_mode: requests[0] && (requests[0] as any).text_format?.type === 'json_schema' ? 'STRICT_JSON_SCHEMA' : 'UNKNOWN',
    request_snapshot: requests[0],
    serialized_provider_schema: providerSchema,
    source_schema_summary: { zod: 'object, strict, all five fields required; nullable string fields' },
    calls,
    raw_provider_responses_first_three: responses.slice(0, 3),
    parser_observation: { shared_adapter_removes_nulls_before_zod: true, source_function: 'removeProviderNullOptionals' },
  };
  const finalOutputPath = useHarnessAdapter ? outputPath.replace(/\.json$/, '.harness.json') : outputPath;
  fs.writeFileSync(finalOutputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  const valid = calls.filter((call) => call.validation_status === 'VALID_OUTPUT').length;
  console.log(JSON.stringify({ outputPath: finalOutputPath, valid, total: calls.length, provider: config.provider, model: config.model, adapter: useHarnessAdapter ? 'harness_null_preserving' : 'shared_runtime' }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
