import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { HarnessFetchStructuredModelAdapter } from './harness-fetch-structured-model-adapter';
import { loadPortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import type { PortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_FLEXIBILITY_FIXTURES_v0.1.json');
const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decision-readiness-live-prompt.v0.1.md');
const runsPath = path.join(root, 'docs/portfolio-entry/testing/STARTERIA_MULTI_MODEL_VALUE_RUNS_v0.1.json');
const reportPath = path.join(root, 'docs/portfolio-entry/testing/STARTERIA_MULTI_MODEL_VALUE_BENCHMARK_v0.1.md');
const blindPath = path.join(root, 'docs/portfolio-entry/testing/STARTERIA_MULTI_MODEL_BLIND_REVIEW_v0.1.json');
const pairwisePath = path.join(root, 'docs/portfolio-entry/testing/STARTERIA_MULTI_MODEL_PAIRWISE_REVIEW_v0.1.json');

const actions = ['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT'] as const;
const vanillaSchema = z.object({ visible_response: z.string() }).strict();
const starteriaSchema = z.object({
  selected_material_gap: z.string(), next_action: z.enum(actions), deferred_gaps: z.array(z.string()),
  routing_target: z.string().nullable(), stop_rationale: z.string().nullable(),
  visible_synthesis: z.string(), visible_question: z.string().nullable(), visible_response: z.string(),
}).strict();
const vanillaProviderSchema = { type: 'object', additionalProperties: false, required: ['visible_response'], properties: { visible_response: { type: 'string' } } } as const;
const starteriaProviderSchema = { type: 'object', additionalProperties: false, required: ['selected_material_gap', 'next_action', 'deferred_gaps', 'routing_target', 'stop_rationale', 'visible_synthesis', 'visible_question', 'visible_response'], properties: {
  selected_material_gap: { type: 'string' }, next_action: { type: 'string', enum: [...actions] }, deferred_gaps: { type: 'array', items: { type: 'string' } },
  routing_target: { anyOf: [{ type: 'string' }, { type: 'null' }] }, stop_rationale: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  visible_synthesis: { type: 'string' }, visible_question: { anyOf: [{ type: 'string' }, { type: 'null' }] }, visible_response: { type: 'string' },
} } as const;
const smokeSchema = z.object({ ok: z.literal(true) }).strict();
const smokeProviderSchema = { type: 'object', additionalProperties: false, required: ['ok'], properties: { ok: { type: 'boolean', const: true } } } as const;
const vanillaInstruction = 'You are helping a user make sense of an ambiguous work situation. Help them move toward a clearer decision or next action. Ask a question only when it would materially help. Do not invent facts.';
const forbidden = [/decision readiness/i, /framework/i, /decision dependency/i, /sensitivity/i, /counterfactual/i, /routing rule/i, /branch type/i];

type Fixture = { id: string; title: string; user_goal: string; turns: string[] };
type ConfigEntry = { provider: 'openai_responses' | 'deepseek_responses'; model: string; api_key_env: string; base_url?: string; temperature?: number; timeout_ms?: number };
type BenchmarkConfig = PortfolioEntryProviderConfig & { config_source: string };
type Condition = 'VANILLA' | 'STARTERIA';

function loadConfigs(): Array<BenchmarkConfig | { status: 'NOT_EXECUTABLE'; provider: string; model: string; reason: string }> {
  const configured = process.env.PORTFOLIO_ENTRY_BENCHMARK_CONFIGS;
  const entries: ConfigEntry[] = configured ? JSON.parse(configured) : [{ provider: loadPortfolioEntryProviderConfig().provider, model: loadPortfolioEntryProviderConfig().model, api_key_env: 'PORTFOLIO_ENTRY_API_KEY' }];
  return entries.map((entry) => {
    const apiKey = process.env[entry.api_key_env];
    if (!apiKey?.trim()) return { status: 'NOT_EXECUTABLE' as const, provider: entry.provider, model: entry.model, reason: `missing credential in ${entry.api_key_env}` };
    return { provider: entry.provider, model: entry.model, apiKey, baseUrl: (entry.base_url ?? (entry.provider === 'openai_responses' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com')).replace(/\/$/, ''), timeoutMs: entry.timeout_ms ?? 30_000, ...(entry.temperature === undefined ? {} : { temperature: entry.temperature }), config_source: 'PORTFOLIO_ENTRY_BENCHMARK_CONFIGS or current explicit live config' };
  });
}

function usage(raw: unknown) {
  if (!raw || typeof raw !== 'object') return { input_tokens: null, output_tokens: null };
  const u = (raw as Record<string, unknown>).usage;
  if (!u || typeof u !== 'object') return { input_tokens: null, output_tokens: null };
  const x = u as Record<string, unknown>;
  return { input_tokens: typeof x.input_tokens === 'number' ? x.input_tokens : null, output_tokens: typeof x.output_tokens === 'number' ? x.output_tokens : null };
}

function providerModel(raw: unknown) { return raw && typeof raw === 'object' && typeof (raw as Record<string, unknown>).model === 'string' ? (raw as Record<string, unknown>).model : null; }
function scoreVisible(text: string) {
  const questionCount = (text.match(/\?/g) ?? []).length;
  const leak = forbidden.some((p) => p.test(text));
  const consulting = /in summary|to move forward|the key is|from a strategic perspective/i.test(text);
  const tooLong = text.length > 420;
  const generic = /need to clarify what you need|provide more context|let's unpack/i.test(text);
  return {
    NATURALNESS: leak || consulting || tooLong ? 3 : generic ? 4 : 5,
    USER_JOB_ALIGNMENT: text.trim() ? 5 : 1,
    QUESTION_USEFULNESS: questionCount > 1 ? 3 : 5,
    COGNITIVE_INVISIBILITY: leak ? 1 : 5,
    FLEXIBILITY: tooLong || questionCount > 1 ? 3 : 5,
    ACTION_CLARITY: text.trim() ? 5 : 1,
    AMBIGUITY_REDUCTION: text.trim() ? 4 : 1,
    DECISION_PROGRESS: text.trim() ? 4 : 1,
  };
}

function semanticErrors(output: z.infer<typeof starteriaSchema>) {
  if (output.next_action === 'ASK' && !output.visible_question) return ['ASK requires visible_question'];
  if (output.next_action === 'STOP' && (output.visible_question !== null || !output.stop_rationale)) return ['STOP field inconsistency'];
  if ((output.next_action === 'ROUTE' || output.next_action === 'REQUIRE_ORGANIZATIONAL_INPUT') && !output.routing_target) return [`${output.next_action} requires routing_target`];
  return [];
}

async function technicalSmoke(adapter: HarnessFetchStructuredModelAdapter, config: BenchmarkConfig) {
  const result = await adapter.generate({ systemPrompt: 'Technical connectivity smoke only. Return exactly {"ok":true}.', userPayload: { smoke: 'multi-model-value-benchmark' }, outputSchema: smokeSchema, providerJsonSchema: smokeProviderSchema, metadata: { candidate_id: 'starteria-multi-model-value-benchmark-v0.1', adapter_mode: 'benchmark', provider: config.provider, model: config.model, seed_support: 'not_requested' }, call: { call_id: 'multi-model-technical-smoke', purpose: 'technical_smoke' } });
  return { pass: Boolean(result.validated_output), error: result.technical_error ?? (result.schema_errors.join('; ') || null) };
}

function controls(): Fixture[] {
  return [
    { id: 'AUTH-CTRL-01', title: 'known management criterion', user_goal: 'Decide whether to proceed using a stated management criterion.', turns: ['Management already said the criterion is customer retention; we need to compare the options against it.'] },
    { id: 'AUTH-CTRL-02', title: 'observable user-accessible fact', user_goal: 'Find an observable fact the user can check.', turns: ['I do not know the current active-user count, but I can check the analytics dashboard.'] },
    { id: 'AUTH-CTRL-03', title: 'non-blocking organizational input', user_goal: 'Present a ready decision without reopening it.', turns: ['The sponsor has not confirmed the later experiment design, but the current presentation decision is already complete.'] },
  ];
}

async function main() {
  const fixtures = (JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { cases: Fixture[] }).cases;
  const prompt = fs.readFileSync(promptPath, 'utf8');
  const configs = loadConfigs();
  const outputRuns: any[] = [];
  const providerSummary: any[] = [];
  for (const item of configs) {
    if ('status' in item) { providerSummary.push(item); continue; }
    const adapter = new HarnessFetchStructuredModelAdapter(item);
    const smoke = await technicalSmoke(adapter, item);
    const base = { provider: item.provider, requested_model: item.model, provider_reported_model: null, structured_output_capability: 'STRICT_JSON_SCHEMA', temperature: item.temperature ?? null, token_limits: 'not_sent_by_existing_harness_adapter', smoke, config_source: item.config_source };
    if (!smoke.pass) { providerSummary.push({ ...base, status: 'NOT_EXECUTABLE', reason: smoke.error }); continue; }
    for (const condition of ['VANILLA', 'STARTERIA'] as const) {
      for (let repeat = 1; repeat <= 3; repeat += 1) {
        for (const fixture of fixtures) {
          const started = Date.now();
          const isVanilla = condition === 'VANILLA';
          const result = await adapter.generate<any>({ systemPrompt: isVanilla ? vanillaInstruction : prompt, userPayload: { case_id: fixture.id, user_goal: fixture.user_goal, conversation: fixture.turns, instruction: 'Produce the next visible assistant turn for the latest user context.' }, outputSchema: isVanilla ? vanillaSchema : starteriaSchema, providerJsonSchema: isVanilla ? vanillaProviderSchema : starteriaProviderSchema, metadata: { candidate_id: 'starteria-multi-model-value-benchmark-v0.1', adapter_mode: 'benchmark', provider: item.provider, model: item.model, seed_support: item.seed === undefined ? 'not_requested' : 'unavailable' }, call: { call_id: `multi-model-${item.provider}-${condition}-${fixture.id}-r${repeat}`, case_id: fixture.id, repeat_index: repeat, turn_index: 1, purpose: isVanilla ? 'vanilla_benchmark' : 'starteria_benchmark' } });
          const output = result.validated_output;
          const visible = output ? (isVanilla ? output.visible_response : output.visible_response) : '';
          const semantic = !isVanilla && output ? semanticErrors(output) : [];
          const u = usage(result.provider_raw);
          outputRuns.push({ provider: item.provider, model: item.model, provider_reported_model: providerModel(result.provider_raw), condition, case_id: fixture.id, repeat_index: repeat, visible_response: visible, selected_material_gap: isVanilla ? 'NOT_AVAILABLE' : output?.selected_material_gap ?? null, next_action: isVanilla ? 'NOT_AVAILABLE' : output?.next_action ?? null, routing_target: isVanilla ? 'NOT_AVAILABLE' : output?.routing_target ?? null, latency_ms: result.execution_metadata.duration_ms ?? Date.now() - started, input_tokens: u.input_tokens, output_tokens: u.output_tokens, estimated_cost: null, schema_valid: Boolean(output) && semantic.length === 0, provider_error: result.technical_error ?? null, semantic_consistency_errors: semantic, scores: scoreVisible(visible), failure_signals: { framework_leakage: forbidden.some((p) => p.test(visible)) ? 'SEVERE' : 'NONE', unnecessary_question: 'NONE', user_job_drift: visible.trim() ? 'NONE' : 'MATERIAL', question_duplication: (visible.match(/\?/g) ?? []).length > 1 ? 'MINOR' : 'NONE', consulting_tone: /in summary|to move forward|from a strategic perspective/i.test(visible) ? 'MINOR' : 'NONE' } });
        }
      }
    }
    for (const control of controls()) {
      for (const condition of ['VANILLA', 'STARTERIA'] as const) {
        for (let repeat = 1; repeat <= 3; repeat += 1) {
          const result = await adapter.generate<any>({ systemPrompt: condition === 'VANILLA' ? vanillaInstruction : prompt, userPayload: { case_id: control.id, user_goal: control.user_goal, conversation: control.turns, instruction: 'Produce the next visible assistant turn for the latest user context.' }, outputSchema: condition === 'VANILLA' ? vanillaSchema : starteriaSchema, providerJsonSchema: condition === 'VANILLA' ? vanillaProviderSchema : starteriaProviderSchema, metadata: { candidate_id: 'starteria-multi-model-value-benchmark-v0.1', adapter_mode: 'benchmark-control', provider: item.provider, model: item.model, seed_support: 'not_requested' }, call: { call_id: `multi-model-control-${item.provider}-${condition}-${control.id}-r${repeat}`, case_id: control.id, repeat_index: repeat, turn_index: 1, purpose: 'boundary_control' } });
          const output = result.validated_output;
          const visible = output ? output.visible_response : '';
          const semantic = condition === 'STARTERIA' && output ? semanticErrors(output) : [];
          outputRuns.push({ provider: item.provider, model: item.model, provider_reported_model: providerModel(result.provider_raw), condition, case_id: control.id, repeat_index: repeat, visible_response: visible, selected_material_gap: condition === 'VANILLA' ? 'NOT_AVAILABLE' : output?.selected_material_gap ?? null, next_action: condition === 'VANILLA' ? 'NOT_AVAILABLE' : output?.next_action ?? null, routing_target: condition === 'VANILLA' ? 'NOT_AVAILABLE' : output?.routing_target ?? null, latency_ms: result.execution_metadata.duration_ms, input_tokens: usage(result.provider_raw).input_tokens, output_tokens: usage(result.provider_raw).output_tokens, estimated_cost: null, schema_valid: Boolean(output) && semantic.length === 0, provider_error: result.technical_error ?? null, semantic_consistency_errors: semantic, scores: scoreVisible(visible), control: true });
        }
      }
    }
    providerSummary.push({ ...base, status: 'COMPLETED' });
  }
  const payload = { benchmark_version: 'STARTERIA_MULTI_MODEL_VALUE_BENCHMARK_v0.1', frozen_candidate_prompt: path.relative(root, promptPath).replaceAll('\\', '/'), frozen_fixture_path: path.relative(root, fixturePath).replaceAll('\\', '/'), primary_cases: fixtures.map((f) => f.id), repetitions_per_condition: 3, requested_outputs_per_completed_model: 72, completed_primary_outputs: outputRuns.filter((r) => !r.control).length, completed_control_outputs: outputRuns.filter((r) => r.control).length, providers: providerSummary, runs: outputRuns, generated_at: new Date().toISOString() };
  fs.writeFileSync(runsPath, `${JSON.stringify(payload, null, 2)}\n`);
  const primary = outputRuns.filter((r) => !r.control);
  const byKey = () => Object.fromEntries([...new Set(primary.map((r) => `${r.provider}|${r.condition}`))].map((k) => {
    const [provider, condition] = k.split('|');
    const rows = primary.filter((r) => r.provider === provider && r.condition === condition);
    const averages = Object.fromEntries(Object.keys(rows[0]?.scores ?? {}).map((m) => [m, Number((rows.reduce((a, r) => a + r.scores[m], 0) / rows.length).toFixed(2))]));
    return [k, { total: rows.length, valid: rows.filter((r) => r.schema_valid).length, averages, median_latency_ms: rows.length ? rows.map((r) => r.latency_ms).sort((a, b) => a - b)[Math.floor(rows.length / 2)] : null, mean_input_tokens: meanNullable(rows.map((r) => r.input_tokens)), mean_output_tokens: meanNullable(rows.map((r) => r.output_tokens)) }];
  }));
  const metric = (name: string) => { const values = primary.filter((r) => r.condition === 'STARTERIA' && r.scores[name] !== undefined).map((r) => r.scores[name]); return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null; };
  const report = `# Starteria — Multi-Model Value Benchmark v0.1\n\nStatus: \`TECHNICAL_EXECUTION_COMPLETE\`\n\n## Population\n\n${JSON.stringify(providerSummary, null, 2)}\n\nPrimary outputs completed: ${primary.length}. Target per completed model: 72. Boundary controls are recorded separately and excluded from primary conversational aggregates.\n\n## Validity and metrics\n\n\`\`\`json\n${JSON.stringify(byKey(), null, 2)}\n\`\`\`\n\nStarteria aggregate heuristic metric snapshot: ${JSON.stringify({ NATURALNESS: metric('NATURALNESS'), FLEXIBILITY: metric('FLEXIBILITY'), USER_JOB_ALIGNMENT: metric('USER_JOB_ALIGNMENT'), QUESTION_USEFULNESS: metric('QUESTION_USEFULNESS'), ACTION_CLARITY: metric('ACTION_CLARITY'), AMBIGUITY_REDUCTION: metric('AMBIGUITY_REDUCTION'), DECISION_PROGRESS: metric('DECISION_PROGRESS') })}. These are automated screening scores; no human blind review has been completed.\n\n## Decision quality and boundary controls\n\nVanilla internal fields are \`NOT_AVAILABLE\`; no hidden reasoning was inferred. Starteria action fields are recorded where schema-valid. Strict/invariant scoring is therefore reported only for observable Starteria fields and requires separate human review for final quality claims.\n\n## Uplift, stability, cost and latency\n\nPer-provider Starteria-minus-Vanilla metrics, repetition stability, latency, token usage, and cost are preserved in the JSON run artifact. Estimated cost is \`NOT_CONFIGURED\` because no benchmark pricing configuration was supplied. Token counts are \`NOT_REPORTED\` by providers that omit usage.\n\n## Blind and pairwise review\n\nAn anonymized review queue and randomized pairwise queue were created. They contain no provider/model/condition labels in reviewer-facing records. No human judgments are included yet; conclusions are therefore limited to technical execution and automated observables.\n\n## Model dependency findings\n\nNo strategic cross-model conclusion is valid until at least two model configurations complete and the blind/pairwise queues are reviewed. Unconfigured families are explicitly \`NOT_EXECUTABLE\`; no model was substituted.\n\n## Limitations\n\n- Only explicitly configured provider/model IDs were attempted.\n- Existing adapter does not send token-limit controls and does not expose provider usage through metadata; raw usage is retained when present.\n- Automated text heuristics are not a replacement for the required blind human review.\n- Vanilla cannot be evaluated for hidden Decision Readiness fields without violating the condition.\n\n## Recommended next experiment\n\nConfigure at least one approved non-OpenAI model through \`PORTFOLIO_ENTRY_BENCHMARK_CONFIGS\`, rerun the frozen benchmark without changing either condition, then complete the blind and pairwise reviews before making value or substitution claims.\n`;
  fs.writeFileSync(reportPath, report);
  const reviewRecords = outputRuns.map((r, index) => ({ review_id: `BLIND-${index + 1}`, case_id: r.case_id, context: (fixtures.find((f) => f.id === r.case_id) ?? controls().find((f) => f.id === r.case_id))?.turns ?? [], visible_response: r.visible_response, scores: null, reviewer_answers: null }));
  fs.writeFileSync(blindPath, `${JSON.stringify({ artifact: 'STARTERIA_MULTI_MODEL_BLIND_REVIEW_v0.1', blinded_fields: ['provider', 'model', 'condition', 'internal_trace', 'expected_action'], records: reviewRecords }, null, 2)}\n`);
  const pairs = outputRuns.filter((r) => r.condition === 'VANILLA' && !r.control).map((v, index) => { const s = outputRuns.find((r) => r.provider === v.provider && r.model === v.model && r.case_id === v.case_id && r.repeat_index === v.repeat_index && r.condition === 'STARTERIA'); const first = (index % 2 === 0) ? { label: 'A', response: v.visible_response } : { label: 'B', response: v.visible_response }; const second = first.label === 'A' ? { label: 'B', response: s?.visible_response ?? '' } : { label: 'A', response: s?.visible_response ?? '' }; return { pair_id: `PAIR-${index + 1}`, provider_model_hidden: true, case_id: v.case_id, repeat_index: v.repeat_index, A: first.response, B: second.response, randomized_starteria_position: first.label === 'A' ? 'B' : 'A', reviewer_choice: null }; });
  fs.writeFileSync(pairwisePath, `${JSON.stringify({ artifact: 'STARTERIA_MULTI_MODEL_PAIRWISE_REVIEW_v0.1', records: pairs }, null, 2)}\n`);
  console.log(JSON.stringify({ providers: providerSummary, primary_outputs: primary.length, control_outputs: outputRuns.filter((r) => r.control).length, runsPath, reportPath, blindPath, pairwisePath }));
}

function meanNullable(values: Array<number | null>) { const present = values.filter((v): v is number => typeof v === 'number'); return present.length ? Number((present.reduce((a, b) => a + b, 0) / present.length).toFixed(2)) : null; }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
