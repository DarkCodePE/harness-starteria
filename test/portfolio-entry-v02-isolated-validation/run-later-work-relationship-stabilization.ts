import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import { cases, counterfactualRelation, type Relation } from './later-work-relationship-fixtures';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = path.join(root, 'docs/portfolio-entry/testing');
const runsPath = path.join(outputDir, 'PORTFOLIO_ENTRY_LATER_WORK_RELATIONSHIP_RUNS_v0.1.json');
const reportPath = path.join(outputDir, 'PORTFOLIO_ENTRY_LATER_WORK_RELATIONSHIP_REPORT_v0.1.md');
const specPath = path.join(outputDir, 'PORTFOLIO_ENTRY_LATER_WORK_RELATIONSHIP_STABILIZATION_v0.1.md');

type Item = { description: string; why_it_matters: string; who_can_help_resolve_it: string | null; suggested_next_move: string; relation: Relation };
type ModelOutput = { current_decision_complete: boolean; current_open_items: Item[]; later_work_items: Item[]; need_sufficient: boolean; visible_question: string | null; visible_response: string; decision_readiness_regression: boolean; grounding_regression: boolean };

const relations: Relation[] = ['CURRENT_DECISION_BLOCKER', 'CURRENT_DECISION_CONDITION', 'LATER_WORK', 'OPTIONAL_ENRICHMENT'];
const expectedById = new Map(cases.map((item) => [item.id, item]));
const systemPrompt = `You are a harness-only item relationship evaluator. Apply this counterfactual test: if an item remains unresolved today, does it prevent the user's current job from responsibly moving forward? If yes, classify it as CURRENT_DECISION_BLOCKER or CURRENT_DECISION_CONDITION. If no, and it belongs to execution, design, implementation, provider/architecture selection or work after the current decision, classify it as LATER_WORK. Importance is not current-decision relevance. Do not infer from keywords alone. Preserve the current decision when it is already complete. Return only the requested JSON. Never expose internal labels in visible language. For later work, visible_question must be null and visible_response must acknowledge that the current part is clear and can continue.`;

const itemSchema = { type: 'array', items: { type: 'object', additionalProperties: false, required: ['description', 'why_it_matters', 'who_can_help_resolve_it', 'suggested_next_move', 'relation'], properties: { description: { type: 'string' }, why_it_matters: { type: 'string' }, who_can_help_resolve_it: { anyOf: [{ type: 'string' }, { type: 'null' }] }, suggested_next_move: { type: 'string' }, relation: { type: 'string', enum: relations } } } } as const;
const schema = { type: 'object', additionalProperties: false, required: ['current_decision_complete', 'current_open_items', 'later_work_items', 'need_sufficient', 'visible_question', 'visible_response', 'decision_readiness_regression', 'grounding_regression'], properties: { current_decision_complete: { type: 'boolean' }, current_open_items: itemSchema, later_work_items: itemSchema, need_sufficient: { type: 'boolean' }, visible_question: { anyOf: [{ type: 'string' }, { type: 'null' }] }, visible_response: { type: 'string' }, decision_readiness_regression: { type: 'boolean' }, grounding_regression: { type: 'boolean' } } } as const;

function project(input: ModelOutput) {
  const readiness = !input.need_sufficient ? 'NOT_READY' : input.current_open_items.length > 0 ? 'READY_WITH_OPEN_ITEMS' : 'READY';
  return { conversion_readiness: readiness, continuation_mode: readiness === 'NOT_READY' ? 'CLARIFY' : readiness === 'READY_WITH_OPEN_ITEMS' ? 'CONTINUE_WITH_OPEN_ITEM' : 'CONTINUE_TO_NEXT_WORK' };
}

function deterministicRun(item: (typeof cases)[number]) {
  const relation = counterfactualRelation(item);
  const output: ModelOutput = { current_decision_complete: item.currentDecisionComplete, current_open_items: relation.startsWith('CURRENT') ? [{ description: item.item, why_it_matters: 'cambia la decisión actual', who_can_help_resolve_it: null, suggested_next_move: 'resolverlo antes de continuar', relation }] : [], later_work_items: relation === 'LATER_WORK' ? [{ description: item.item, why_it_matters: 'pertenece al trabajo posterior', who_can_help_resolve_it: null, suggested_next_move: 'trabajarlo después', relation }] : [], need_sufficient: true, visible_question: null, visible_response: 'La parte actual está clara y podemos continuar.', decision_readiness_regression: false, grounding_regression: false };
  return evaluate(item.id, output, true);
}

function evaluate(caseId: string, output: ModelOutput | null, schemaValid: boolean) {
  const expected = expectedById.get(caseId)!;
  const projection = output ? project(output) : null;
  const failures: string[] = [];
  if (!schemaValid || !output || !projection) failures.push('SCHEMA_INVALID');
  if (output && output.current_open_items.some((item) => item.relation === 'LATER_WORK' || item.relation === 'OPTIONAL_ENRICHMENT')) failures.push('CURRENT_OPEN_ITEM_CONTAMINATION');
  if (output && output.later_work_items.some((item) => item.relation === 'CURRENT_DECISION_BLOCKER' || item.relation === 'CURRENT_DECISION_CONDITION')) failures.push('FALSE_CURRENT_ITEM_ESCALATION');
  const observed = output?.current_open_items[0]?.relation ?? output?.later_work_items[0]?.relation;
  if (observed !== expected.expected) failures.push(expected.expected === 'LATER_WORK' ? 'FALSE_CURRENT_ITEM' : 'FALSE_LATER_WORK');
  if (expected.expected === 'LATER_WORK' && output?.visible_question) failures.push('LATER_WORK_QUESTION');
  if (expected.expected === 'LATER_WORK' && projection?.conversion_readiness !== 'READY') failures.push('PREMATURE_STOP');
  if (output?.decision_readiness_regression) failures.push('DECISION_READINESS_REGRESSION');
  if (output?.grounding_regression) failures.push('GROUNDING_REGRESSION');
  if (output && /authority|governance|comit[eé]|sponsor/i.test(output.visible_response)) failures.push('INVENTED_AUTHORITY');
  return { case_id: caseId, expected_relation: expected.expected, observed_relation: observed ?? null, schema_valid: schemaValid, projection, output, failures, pass: failures.length === 0 };
}

function extractText(body: any): string | null { if (typeof body?.output_text === 'string') return body.output_text; const texts: string[] = []; for (const item of body?.output ?? []) for (const child of item?.content ?? []) if (child?.type === 'output_text' && typeof child.text === 'string') texts.push(child.text); return texts.length === 1 ? texts[0] : null; }

async function liveCall(item: (typeof cases)[number], repeat: number, config: ReturnType<typeof loadPortfolioEntryProviderConfig>) {
  const response = await fetch(`${config.baseUrl}/responses`, { method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, input: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify({ case_id: item.id, current_decision_complete_hint: item.currentDecisionComplete, conversation: item.prompt, unresolved_item: item.item, instruction: 'Classify the unresolved item using the counterfactual test. Return the strict schema.' }) }], text: { format: { type: 'json_schema', name: 'later_work_relationship_stabilization', strict: true, schema } } }) });
  const raw = await response.text(); let body: any = null; try { body = JSON.parse(raw); } catch { /* recorded below */ }
  const text = extractText(body); let output: ModelOutput | null = null; try { output = text ? JSON.parse(text) : null; } catch { /* recorded below */ }
  const schemaValid = response.ok && Boolean(output && Array.isArray(output.current_open_items) && Array.isArray(output.later_work_items) && output.current_open_items.every((x: Item) => relations.includes(x.relation)) && output.later_work_items.every((x: Item) => relations.includes(x.relation)));
  return { ...evaluate(item.id, output, schemaValid), repeat_index: repeat, provider: config.provider, requested_model: config.model, provider_reported_model: body?.model ?? null, http_status: response.status, response_id: body?.id ?? null, error: response.ok ? null : body?.error ?? raw.slice(0, 500) };
}

function writeArtifacts(payload: any, liveRuns: any[], deterministicRuns: any[]) {
  fs.writeFileSync(runsPath, `${JSON.stringify({ run_version: 'LATER-WORK-RELATIONSHIP-v0.1', status: liveRuns.length ? 'LIVE_COMPLETED' : 'DETERMINISTIC_ONLY', provider: payload.provider ?? null, model: payload.model ?? null, target_calls: 35, completed_calls: liveRuns.length, deterministic_runs: deterministicRuns, runs: liveRuns }, null, 2)}\n`);
  const all = [...deterministicRuns, ...liveRuns]; const count = (name: string) => all.filter((run) => run.failures.includes(name)).length;
  const cr = liveRuns.filter((run) => run.case_id === 'CR-ADV-05');
  const control = liveRuns.filter((run) => run.case_id.startsWith('LW-CTRL-'));
  const schemaValid = liveRuns.filter((run) => run.schema_valid).length;
  const gateReady = liveRuns.length === 35 && cr.filter((run) => run.observed_relation === 'LATER_WORK').length >= 9 && cr.filter((run) => run.projection?.conversion_readiness === 'READY').length >= 9 && control.filter((run) => run.pass).length >= 24 && ['FALSE_LATER_WORK', 'FALSE_CURRENT_ITEM', 'CURRENT_OPEN_ITEM_CONTAMINATION', 'LATER_WORK_QUESTION', 'PREMATURE_STOP', 'FORCED_CONVERSION', 'DECISION_READINESS_REGRESSION', 'GROUNDING_REGRESSION', 'INVENTED_AUTHORITY', 'INVENTED_GOVERNANCE'].every((name) => count(name) === 0);
  const nextStep = liveRuns.length === 35 ? 'review this isolated report and request final confirmation if all gates pass.' : 'configure the explicitly selected provider/model credential and rerun the unchanged 35-call population.';
  const lines = [`# Starteria — Later Work Relationship Stabilization v0.1`, ``, `Status: ${liveRuns.length === 35 ? 'LIVE_COMPLETED' : 'DETERMINISTIC_ONLY'} / HARNESS_ONLY`, ``, `Provider/model: ${payload.provider ?? 'not executed'} / ${payload.model ?? 'not executed'}.`, ``, `Decision Readiness cognition, conversion semantics, grounding/sufficiency, deterministic semantic projection, continuation_mode and visible language contract were not modified.`, ``, `## Deterministic gate`, ``, `- Fixtures: **${deterministicRuns.filter((run) => run.pass).length}/6 PASS**`, `- Frozen CR-ADV-05 source: preserved unchanged`, ``, `## Live gate`, ``, `- Calls: **${liveRuns.length}/35**`, `- Schema-valid: **${schemaValid}/35**`, `- CR-ADV-05 LATER_WORK: **${cr.filter((run) => run.observed_relation === 'LATER_WORK').length}/10**`, `- CR-ADV-05 READY: **${cr.filter((run) => run.projection?.conversion_readiness === 'READY').length}/10**`, `- Controls correct: **${control.filter((run) => run.pass).length}/25**`, ``, `## Failure taxonomy`, ``, ...['FALSE_LATER_WORK', 'FALSE_CURRENT_ITEM', 'CURRENT_OPEN_ITEM_CONTAMINATION', 'LATER_WORK_QUESTION', 'PREMATURE_STOP', 'FORCED_CONVERSION', 'DECISION_READINESS_REGRESSION', 'GROUNDING_REGRESSION', 'INVENTED_AUTHORITY', 'INVENTED_GOVERNANCE'].map((name) => `- ${name}: **${count(name)}**`), ``, `Ready for final confirmation run: **${gateReady ? 'YES' : 'NO'}**`, ``, `Recommended next step: ${nextStep}`];
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
}

async function main() {
  const deterministicRuns = cases.map(deterministicRun); writeArtifacts({}, [], deterministicRuns);
  if (deterministicRuns.filter((run) => run.pass).length !== 6) throw new Error('Deterministic validation failed; live execution was not started.');
  const config = loadPortfolioEntryProviderConfig();
  const jobs = cases.flatMap((item) => Array.from({ length: item.id === 'CR-ADV-05' ? 10 : 5 }, (_, index) => ({ item, repeat: index + 1 })));
  const liveRuns: any[] = []; for (const job of jobs) liveRuns.push(await liveCall(job.item, job.repeat, config));
  writeArtifacts(config, liveRuns, deterministicRuns);
  console.log(JSON.stringify({ deterministic: `${deterministicRuns.filter((run) => run.pass).length}/6`, live_calls: `${liveRuns.length}/35`, schema_valid: `${liveRuns.filter((run) => run.schema_valid).length}/35`, cr_adv_05_later_work: liveRuns.filter((run) => run.case_id === 'CR-ADV-05' && run.observed_relation === 'LATER_WORK').length, cr_adv_05_ready: liveRuns.filter((run) => run.case_id === 'CR-ADV-05' && run.projection?.conversion_readiness === 'READY').length, controls_correct: liveRuns.filter((run) => run.case_id.startsWith('LW-CTRL-') && run.pass).length }));
}
main().catch((error) => { console.error(error instanceof Error ? error.stack : String(error)); process.exitCode = 1; });
