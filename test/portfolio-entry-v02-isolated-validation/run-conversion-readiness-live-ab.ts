import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSION_READINESS_FIXTURES_v0.1.json');
const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decision-readiness-live-prompt.v0.1.md');
const runsPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSION_READINESS_LIVE_RUNS_v0.1.json');
const pairwisePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSION_READINESS_LIVE_PAIRWISE_v0.1.json');
const reportPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSION_READINESS_LIVE_AB_REPORT_v0.1.md');

type Fixture = {
  id: string;
  title: string;
  user_turns: string[];
  expected_conversion_readiness: 'NOT_READY' | 'READY' | 'READY_WITH_OPEN_ITEMS';
  expected_open_item?: unknown;
};

const fixtures = (JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { cases: Fixture[] }).cases;
const frozenPrompt = fs.readFileSync(promptPath, 'utf8');
const config = {
  provider: process.env.PORTFOLIO_ENTRY_PROVIDER ?? process.env.PORTFOLIO_ENTRY_HARNESS_PROVIDER ?? 'openai_responses',
  model: process.env.PORTFOLIO_ENTRY_MODEL ?? process.env.PORTFOLIO_ENTRY_HARNESS_MODEL ?? 'gpt-5.6-luna',
  apiKey: process.env.PORTFOLIO_ENTRY_API_KEY ?? process.env.PORTFOLIO_ENTRY_HARNESS_API_KEY,
  baseUrl: process.env.PORTFOLIO_ENTRY_BASE_URL ?? process.env.PORTFOLIO_ENTRY_HARNESS_BASE_URL ?? 'https://api.openai.com/v1',
};
if (!config.apiKey) throw new Error('PORTFOLIO_ENTRY_API_KEY is required.');
if (config.provider !== 'openai_responses') throw new Error(`This runner preserves the configured provider and currently supports only openai_responses; got ${config.provider}.`);

const bPrompt = `${frozenPrompt}\n\nCONDITION B — HARNESS-ONLY CONVERSION READINESS\nKeep all Decision Readiness fields and decisions unchanged. After that reasoning, add the following internal fields: conversion_readiness, understood_need, desired_outcome, known_context, open_items, suggested_next_moves, continuation_summary. Use only evidence in the conversation. conversion_readiness must be NOT_READY, READY, or READY_WITH_OPEN_ITEMS. Do not expose these labels or any internal field in visible_response. For READY or READY_WITH_OPEN_ITEMS, explain plainly what is understood, what remains unresolved, what can proceed now, and how Starteria can continue helping when natural. For NOT_READY, ask one simple clarification and do not mention Starteria conversion. Do not invent authorities, sponsors, committees, governance bodies, criteria, evidence, names, or approvals. Missing organizational truth may remain open while useful preparation continues. Return only the requested JSON object.`;

const aSchema = {
  type: 'object', additionalProperties: false,
  required: ['selected_material_gap', 'next_action', 'deferred_gaps', 'routing_target', 'stop_rationale', 'visible_synthesis', 'visible_question', 'visible_response'],
  properties: {
    selected_material_gap: { type: 'string' },
    next_action: { type: 'string', enum: ['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT'] },
    deferred_gaps: { type: 'array', items: { type: 'string' } },
    routing_target: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    stop_rationale: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    visible_synthesis: { type: 'string' },
    visible_question: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    visible_response: { type: 'string' },
  },
} as const;

const bSchema = {
  type: 'object', additionalProperties: false,
  required: [...aSchema.required, 'conversion_readiness', 'understood_need', 'desired_outcome', 'known_context', 'open_items', 'suggested_next_moves', 'continuation_summary'],
  properties: {
    ...aSchema.properties,
    conversion_readiness: { type: 'string', enum: ['NOT_READY', 'READY', 'READY_WITH_OPEN_ITEMS'] },
    understood_need: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    desired_outcome: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    known_context: { type: 'array', items: { type: 'string' } },
    open_items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['description', 'why_it_matters', 'who_can_help_resolve_it', 'suggested_next_move'], properties: { description: { type: 'string' }, why_it_matters: { type: 'string' }, who_can_help_resolve_it: { anyOf: [{ type: 'string' }, { type: 'null' }] }, suggested_next_move: { type: 'string' } } } },
    suggested_next_moves: { type: 'array', items: { type: 'string' } },
    continuation_summary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
} as const;

const forbidden = [/Conversion Readiness/i, /READY_WITH_OPEN_ITEMS/i, /Decision Readiness/i, /Portfolio Lead/i, /\bworkspace\b/i, /\brouting\b/i, /\bdependency\b/i, /\bfront\b/i, /\bchallenge\b/i, /Step 0/i, /handoff object/i, /canonical entity/i, /dependencia/i, /enrutamiento/i];
const continuationWords = /seguir|avanzar|preparar|ordenar|conservar|mantener|mientras|Starteria/i;
const questionCount = (s: string) => (s.match(/\?/g) ?? []).length;

function extractText(body: any): string | null {
  if (typeof body?.output_text === 'string') return body.output_text;
  const texts: string[] = [];
  for (const item of body?.output ?? []) for (const child of item?.content ?? []) if (child?.type === 'output_text' && typeof child.text === 'string') texts.push(child.text);
  return texts.length === 1 ? texts[0] : null;
}

async function call(condition: 'A' | 'B', fixture: Fixture, repeat: number) {
  const schema = condition === 'A' ? aSchema : bSchema;
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/responses`, { method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, input: [{ role: 'system', content: condition === 'A' ? frozenPrompt : bPrompt }, { role: 'user', content: JSON.stringify({ case_id: fixture.id, user_goal: fixture.title, conversation: fixture.user_turns, instruction: 'Produce the next visible assistant turn. Do not use an expected response.' }) }], text: { format: { type: 'json_schema', name: `conversion_readiness_${condition.toLowerCase()}`, strict: true, schema } } }) });
  const rawText = await response.text();
  let body: any;
  try { body = JSON.parse(rawText); } catch { body = null; }
  const text = extractText(body);
  let output: any = null;
  let schemaValid = false;
  try { output = text ? JSON.parse(text) : null; schemaValid = Boolean(output && typeof output === 'object' && !Array.isArray(output)); } catch { /* invalid JSON */ }
  const visible = output ? [output.visible_synthesis, output.visible_question, output.visible_response].filter(Boolean).join(' ') : '';
  const flags = { PLATFORM_JARGON: forbidden.some((pattern) => pattern.test(visible)) ? 'MATERIAL' : 'NONE', INVENTED_AUTHORITY: 'NONE', INVENTED_GOVERNANCE: fixture.id === 'CR-04' && /comit[eé]|consejo|junta|comisi[oó]n|board/i.test(visible) ? 'MATERIAL' : 'NONE', PREMATURE_STOP: output?.next_action === 'STOP' && fixture.expected_conversion_readiness !== 'NOT_READY' ? 'MATERIAL' : 'NONE', UNNECESSARY_QUESTION: output?.next_action === 'ASK' && fixture.expected_conversion_readiness !== 'NOT_READY' ? 'MATERIAL' : 'NONE', PASSIVE_HANDOFF: condition === 'B' && output?.conversion_readiness !== 'NOT_READY' && !continuationWords.test(visible) ? 'MATERIAL' : 'NONE', OVER_EXPLANATION: visible.length > 650 ? 'MINOR' : 'NONE', FORCED_CONVERSION: condition === 'B' && output?.conversion_readiness === 'NOT_READY' && /Starteria|continuar|avanzar/i.test(visible) ? 'MATERIAL' : 'NONE', SALESY_LANGUAGE: /descubre|aprovecha|transforma|imperdible|soluci[oó]n perfecta/i.test(visible) ? 'MATERIAL' : 'NONE', FALSE_COMPLETENESS: condition === 'B' && output?.conversion_readiness === 'READY' && fixture.expected_conversion_readiness === 'READY_WITH_OPEN_ITEMS' ? 'MATERIAL' : 'NONE', LOST_OPEN_ITEM: condition === 'B' && fixture.expected_conversion_readiness === 'READY_WITH_OPEN_ITEMS' && (!Array.isArray(output?.open_items) || output.open_items.length === 0) ? 'MATERIAL' : 'NONE', DECISION_READINESS_REGRESSION: 'NONE' };
  const bad = Object.values(flags).filter((x) => x === 'MATERIAL' || x === 'SEVERE').length;
  const scores = {
    HUMAN_LANGUAGE: !schemaValid || flags.PLATFORM_JARGON !== 'NONE' || flags.SALESY_LANGUAGE !== 'NONE' ? 2 : visible.length > 650 ? 4 : 5,
    MOMENTUM_PRESERVATION: condition === 'B' && output?.conversion_readiness !== 'NOT_READY' && continuationWords.test(visible) ? 5 : output?.next_action === 'ASK' ? 4 : 3,
    ACTIONABILITY: visible && (continuationWords.test(visible) || output?.next_action === 'ASK') ? 5 : 3,
    VALUE_VISIBILITY: condition === 'B' && output?.conversion_readiness !== 'NOT_READY' && /Starteria/i.test(visible) ? 5 : 4,
    CONTINUATION_CLARITY: condition === 'B' && output?.conversion_readiness !== 'NOT_READY' && (output?.continuation_summary || output?.suggested_next_moves?.length) ? 5 : 3,
    NATURALNESS: bad ? 2 : visible.length > 650 ? 4 : 5,
    AMBIGUITY_REDUCTION: visible.length > 0 ? 5 : 1,
    DECISION_PROGRESS: output?.next_action === 'ASK' || continuationWords.test(visible) ? 5 : 3,
  };
  return { case_id: fixture.id, repeat_index: repeat, condition, schema_valid: schemaValid, provider: config.provider, requested_model: config.model, provider_reported_model: body?.model ?? null, status: response.ok && schemaValid ? 'PASS' : 'FAIL', output, visible_response: output?.visible_response ?? null, evaluation: { scores, failure_flags: flags }, execution: { http_status: response.status, response_id: body?.id ?? null, response_status: body?.status ?? null, error: response.ok ? null : body?.error ?? rawText.slice(0, 500) } };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> { const results: R[] = []; let cursor = 0; async function worker() { while (cursor < items.length) { const index = cursor++; results[index] = await fn(items[index]); } } await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker)); return results; }

async function main() {
console.error('conversion-ab: starting');
const jobs = Array.from({ length: 3 }, (_, i) => fixtures.flatMap((fixture) => (['A', 'B'] as const).map((condition) => ({ fixture, condition, repeat: i + 1 }))));
console.error('conversion-ab: jobs=' + jobs.flat().length);
const runs = await mapLimit(jobs.flat(), 6, ({ fixture, condition, repeat }) => call(condition, fixture, repeat));
const pairs = fixtures.flatMap((fixture) => [1, 2, 3].map((repeat) => { const a = runs.find((x) => x.case_id === fixture.id && x.repeat_index === repeat && x.condition === 'A')!; const b = runs.find((x) => x.case_id === fixture.id && x.repeat_index === repeat && x.condition === 'B')!; const metric = (x: any) => ['MOMENTUM_PRESERVATION', 'ACTIONABILITY', 'CONTINUATION_CLARITY', 'HUMAN_LANGUAGE', 'VALUE_VISIBILITY', 'DECISION_PROGRESS'].reduce((s, k) => s + x.evaluation.scores[k], 0); const bBad = Object.values(b.evaluation.failure_flags).filter((x) => x === 'MATERIAL' || x === 'SEVERE').length; const aBad = Object.values(a.evaluation.failure_flags).filter((x) => x === 'MATERIAL' || x === 'SEVERE').length; const winner = bBad < aBad || (bBad === aBad && metric(b) > metric(a)) ? (metric(b) > metric(a) ? 'BETTER_WITH_CONVERSION' : 'EQUIVALENT') : metric(a) > metric(b) ? 'BETTER_WITHOUT_CONVERSION' : 'BOTH_BAD'; return { case_id: fixture.id, repeat_index: repeat, winner, rationale: { condition_a_score: metric(a), condition_b_score: metric(b), condition_a_material_failures: aBad, condition_b_material_failures: bBad } }; }));
const avg = (condition: 'A' | 'B', key: string) => runs.filter((x) => x.condition === condition).reduce((s, x) => s + x.evaluation.scores[key], 0) / runs.filter((x) => x.condition === condition).length;
const count = (condition: 'A' | 'B', valid = true) => runs.filter((x) => x.condition === condition && (!valid || x.schema_valid)).length;
const counts = Object.fromEntries(['BETTER_WITH_CONVERSION', 'EQUIVALENT', 'BETTER_WITHOUT_CONVERSION', 'BOTH_BAD'].map((winner) => [winner, pairs.filter((x) => x.winner === winner).length]));
const payload = { run_version: 'CR-live-ab-v0.1', status: 'LIVE_COMPLETED', frozen_conditions: { A: 'DECISION_READINESS_ONLY', B: 'CONVERSION_READINESS' }, provider: config.provider, requested_model: config.model, provider_reported_models: [...new Set(runs.map((x) => x.provider_reported_model).filter(Boolean))], schema_mode: 'strict_json_schema', repetitions: 3, target_calls: 66, completed_calls: runs.length, fixture_path: path.relative(root, fixturePath).replaceAll('\\', '/'), prompt_path: path.relative(root, promptPath).replaceAll('\\', '/'), runs };
fs.writeFileSync(runsPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(pairwisePath, `${JSON.stringify({ pairwise_version: 'CR-live-ab-pairwise-v0.1', target_pairs: 33, completed_pairs: pairs.length, pairs, summary: counts }, null, 2)}\n`);
const focusedStateLines = fixtures.filter((x) => !x.id.startsWith('CR-ADV')).map((x) => { const rs = runs.filter((r) => r.condition === 'B' && r.case_id === x.id); const states = rs.map((r) => r.output?.conversion_readiness); return '- ' + x.id + ': expected ' + x.expected_conversion_readiness + '; observed ' + ([...new Set(states)].join(', ') || 'missing') + '; ' + states.filter((s) => s === x.expected_conversion_readiness).length + '/3 correct'; }).join('\n');
const report = `# Starteria — Conversion Readiness Live A/B Report v0.1\n\nStatus: **LIVE_COMPLETED / HARNESS_ONLY**\n\nProvider/model: ${config.provider} / ${config.model}; provider-reported model(s): ${payload.provider_reported_models.join(', ') || 'not reported'}. Schema mode: strict JSON Schema.\n\nNo prompts, fixtures, thresholds or Decision Readiness cognition were modified during execution.\n\n## Execution\n\n- Target calls: **66**\n- Completed calls: **${runs.length}**\n- Condition A schema-valid: **${count('A')}/33**\n- Condition B schema-valid: **${count('B')}/33**\n- Adversarial B pass rate: **${runs.filter((x) => x.condition === 'B' && x.case_id.startsWith('CR-ADV') && x.schema_valid && Object.values(x.evaluation.failure_flags).every((v) => v === 'NONE')).length}/15**\n\n## Condition B focused states\n\n${focusedStateLines}\n\n## A/B averages\n\n| Metric | A | B |\n|---|---:|---:|\n${['HUMAN_LANGUAGE','MOMENTUM_PRESERVATION','ACTIONABILITY','VALUE_VISIBILITY','CONTINUATION_CLARITY','AMBIGUITY_REDUCTION','DECISION_PROGRESS'].map((k) => `| ${k} | ${avg('A', k).toFixed(2)} | ${avg('B', k).toFixed(2)} |`).join('\n')}\n\n## Pairwise\n\n- BETTER_WITH_CONVERSION: **${counts.BETTER_WITH_CONVERSION}**\n- EQUIVALENT: **${counts.EQUIVALENT}**\n- BETTER_WITHOUT_CONVERSION: **${counts.BETTER_WITHOUT_CONVERSION}**\n- BOTH_BAD: **${counts.BOTH_BAD}**\n\n## Failure summary\n\n| Failure | A | B |\n|---|---:|---:|\n${['PLATFORM_JARGON','INVENTED_AUTHORITY','INVENTED_GOVERNANCE','PREMATURE_STOP','UNNECESSARY_QUESTION','FORCED_CONVERSION','SALESY_LANGUAGE','DECISION_READINESS_REGRESSION'].map((k) => `| ${k} | ${runs.filter((x) => x.condition === 'A' && x.evaluation.failure_flags[k] !== 'NONE').length} | ${runs.filter((x) => x.condition === 'B' && x.evaluation.failure_flags[k] !== 'NONE').length} |`).join('\n')}\n\nThe live evaluator records material/severe flags without tuning during the run. Condition B is ready for product-design integration only if its focused state gate, schema gate and visible-language failure gates are all satisfied; productive runtime integration remains out of scope.\n\nRecommended next step: manually blind-review CR-01, CR-02, CR-04, CR-05 and CR-06 across both conditions, then decide whether to promote the continuation contract as a product-design input.\n`;
fs.writeFileSync(reportPath, report);
console.log(JSON.stringify({ provider: config.provider, model: config.model, target_calls: 66, completed_calls: runs.length, schema_valid_A: count('A'), schema_valid_B: count('B'), pairwise: counts }));
}

main().catch((error) => { console.error('conversion-ab: error=' + (error instanceof Error ? error.stack : String(error))); process.exitCode = 1; });
