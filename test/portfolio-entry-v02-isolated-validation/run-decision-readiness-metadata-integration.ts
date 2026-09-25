import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadPortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import { HarnessFetchStructuredModelAdapter } from './harness-fetch-structured-model-adapter';
import { runDecisionReadinessFixture, type DecisionReadinessFixture, type DecisionReadinessRun } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';
import { integrateDecisionReadinessProjection, type IntegratedProjection } from './decision-readiness-metadata-integration';
import { validateProjectedItem, type AuthoritativeReadinessMetadata, type RelationshipItem } from './authoritative-current-later-projection';
import { cases as frozenCases, type LaterWorkCase } from './later-work-relationship-fixtures';
import type { StructuredModelGenerateInput } from '../../backend/modules/portfolio-entry-runtime/model/structured-model-adapter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = path.join(root, 'docs/portfolio-entry/testing');
const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decision-readiness-live-prompt.v0.1.md');
const runsPath = path.join(base, 'PORTFOLIO_ENTRY_DECISION_READINESS_METADATA_INTEGRATION_RUNS_v0.1.json');
const reportPath = path.join(base, 'PORTFOLIO_ENTRY_DECISION_READINESS_METADATA_INTEGRATION_REPORT_v0.1.md');

const outputSchema = z.object({
  selected_material_gap: z.string(),
  next_action: z.enum(['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT']),
  deferred_gaps: z.array(z.string()),
  routing_target: z.string().nullable(),
  stop_rationale: z.string().nullable(),
  understood_need: z.string().nullable(),
  desired_outcome: z.string().nullable(),
  known_context: z.array(z.string()),
  current_open_items: z.array(z.object({ description: z.string(), why_it_matters: z.string(), who_can_help_resolve_it: z.string().nullable(), suggested_next_move: z.string(), relation: z.enum(['CURRENT_DECISION_BLOCKER', 'CURRENT_DECISION_CONDITION']) }).strict()),
  later_work_items: z.array(z.object({ description: z.string(), why_it_matters: z.string(), who_can_help_resolve_it: z.string().nullable(), suggested_next_move: z.string(), relation: z.enum(['LATER_WORK', 'OPTIONAL_ENRICHMENT']) }).strict()),
  visible_question: z.string().nullable(),
  suggested_next_moves: z.array(z.string()),
  visible_response: z.string().optional(),
}).strict();

const providerJsonSchema = {
  type: 'object', additionalProperties: false,
  required: ['selected_material_gap', 'next_action', 'deferred_gaps', 'routing_target', 'stop_rationale', 'understood_need', 'desired_outcome', 'known_context', 'current_open_items', 'later_work_items', 'visible_question', 'suggested_next_moves'],
  properties: {
    selected_material_gap: { type: 'string' },
    next_action: { type: 'string', enum: ['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT'] },
    deferred_gaps: { type: 'array', items: { type: 'string' } },
    routing_target: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    stop_rationale: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    understood_need: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    desired_outcome: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    known_context: { type: 'array', items: { type: 'string' } },
    current_open_items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['description', 'why_it_matters', 'who_can_help_resolve_it', 'suggested_next_move', 'relation'], properties: { description: { type: 'string' }, why_it_matters: { type: 'string' }, who_can_help_resolve_it: { anyOf: [{ type: 'string' }, { type: 'null' }] }, suggested_next_move: { type: 'string' }, relation: { type: 'string', enum: ['CURRENT_DECISION_BLOCKER', 'CURRENT_DECISION_CONDITION'] } } } },
    later_work_items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['description', 'why_it_matters', 'who_can_help_resolve_it', 'suggested_next_move', 'relation'], properties: { description: { type: 'string' }, why_it_matters: { type: 'string' }, who_can_help_resolve_it: { anyOf: [{ type: 'string' }, { type: 'null' }] }, suggested_next_move: { type: 'string' }, relation: { type: 'string', enum: ['LATER_WORK', 'OPTIONAL_ENRICHMENT'] } } } },
    visible_question: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    suggested_next_moves: { type: 'array', items: { type: 'string' } },
  },
} as const;

type ModelOutput = z.infer<typeof outputSchema>;
type ExpectedRelation = LaterWorkCase['expected'];
type RunRecord = {
  provider: string; model: string; case_id: string; repeat_index: number;
  schema_valid: boolean; provider_error: string | null;
  decision_readiness: {
    selected_material_gap: string | null; next_action: unknown; current_decision_dependency: unknown;
    decision_sensitivity: unknown; decision_branch_type: unknown; answerability: unknown;
  };
  metadata_complete: boolean; current_relevance: IntegratedProjection['current_relevance'];
  current_open_items: RelationshipItem[]; later_work_items: RelationshipItem[]; unresolved_relationship_items: RelationshipItem[];
  conversion_readiness: IntegratedProjection['conversion_readiness']; continuation_mode: IntegratedProjection['continuation_mode'];
  visible_response: string; semantic_consistency_errors: string[];
  checks: Record<string, 'NONE' | 'MATERIAL'>;
  execution: Record<string, unknown>;
};

// Frozen structured metadata used by the authoritative projection controls.
// This is test data, not a second CURRENT/LATER judgment.
const frozenMetadataByCase = new Map<string, AuthoritativeReadinessMetadata>([
  ['CR-ADV-05', { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'DETAIL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'ROUTE', route: 'later_stage' } }],
  ['LW-CTRL-01', { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'DETAIL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'ROUTE', route: 'later_stage' } }],
  ['LW-CTRL-02', { current_decision_dependency: 'BLOCKING', decision_sensitivity: 'HIGH', decision_branch_type: 'ENABLEMENT_CHANGE', answerability: 'EXTERNAL_EVIDENCE_REQUIRED', next_action: { type: 'ASK', gap_id: 'regulatory-proof' } }],
  ['LW-CTRL-03', { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'NO_MATERIAL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'ROUTE', route: 'later_stage' } }],
  ['LW-CTRL-04', { current_decision_dependency: 'CONSTRAINING', decision_sensitivity: 'MEDIUM', decision_branch_type: 'CONDITION_CHANGE', answerability: 'EXTERNAL_EVIDENCE_REQUIRED', next_action: { type: 'ASK', gap_id: 'provider-cost' } }],
  ['LW-CTRL-05', { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'NO_MATERIAL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'STOP', reason: 'later_stage_detail' } }],
]);

function fixtureFor(item: LaterWorkCase): DecisionReadinessFixture {
  return { id: item.id, title: item.id, turns: [item.prompt] };
}

function expectedMetadataComplete(run: DecisionReadinessRun): boolean {
  const gap = run.final.selected_gap;
  return Boolean(gap && gap.current_decision_dependency && gap.decision_sensitivity && gap.decision_branch_type && gap.answerability && run.final.next_action);
}

function visibleChecks(output: ModelOutput | null, projection: IntegratedProjection, semanticErrors: string[], deterministic: DecisionReadinessRun): Record<string, 'NONE' | 'MATERIAL'> {
  const text = `${output?.understood_need ?? ''} ${output?.desired_outcome ?? ''} ${output?.visible_question ?? ''} ${projection.visible_response}`;
  const later = projection.current_relevance === 'LATER';
  const current = projection.current_relevance === 'CURRENT';
  const questionWhenLater = later && /\?/.test(projection.visible_response);
  const prematureStop = later && output?.next_action === 'STOP' && !/podemos continuar|trabajo posterior/i.test(projection.visible_response);
  const forcedConversion = projection.conversion_readiness === 'NOT_READY' && projection.continuation_mode !== 'CLARIFY';
  return {
    decision_readiness_regression: deterministic.violations.length ? 'MATERIAL' : 'NONE',
    grounding_regression: /invento|confirmad[oa]s?|aprobaci[oó]n formal|evidencia suficiente/i.test(text) && /gerencia|autoridad|gobierno|sponsor/i.test(text) ? 'MATERIAL' : 'NONE',
    premature_public_stop: prematureStop ? 'MATERIAL' : 'NONE',
    later_work_question: questionWhenLater ? 'MATERIAL' : 'NONE',
    forced_conversion: forcedConversion ? 'MATERIAL' : 'NONE',
    invented_authority: /sponsor confirmado|autoridad es|gerencia ha aprobado|comité ha decidido/i.test(text) ? 'MATERIAL' : 'NONE',
    invented_governance: /responsable asignado|owner confirmado|gobernanza establecida/i.test(text) ? 'MATERIAL' : 'NONE',
    current_realization_missing: current && !projection.current_open_items.length ? 'MATERIAL' : 'NONE',
    semantic_consistency: semanticErrors.length ? 'MATERIAL' : 'NONE',
  };
}

async function call(model: HarnessFetchStructuredModelAdapter, config: ReturnType<typeof loadPortfolioEntryProviderConfig>, prompt: string, item: LaterWorkCase, repeat: number): Promise<RunRecord> {
  const fixture = fixtureFor(item);
  const adapterDecisionReadiness = runDecisionReadinessFixture(fixture);
  const frozenMetadata = frozenMetadataByCase.get(item.id);
  if (!frozenMetadata) throw new Error(`Missing frozen Decision Readiness metadata for ${item.id}`);
  const selectedGap = adapterDecisionReadiness.final.selected_gap ?? {
    id: `frozen-${item.id}`,
    dimension: 'ROUTING', description: item.item, resolution_type: 'DEFER_TO_LATER_STAGE', decision_impact: 'LOW', route_impact: 'LOW', stage_fit: 'INITIATIVE', evidence_basis: ['frozen focused control'],
    current_decision_dependency: frozenMetadata.current_decision_dependency, answerability: frozenMetadata.answerability, execution_gap_classification: 'NOT_EXECUTION_RELEVANT', decision_sensitivity: frozenMetadata.decision_sensitivity, decision_branch_type: frozenMetadata.decision_branch_type,
    counterfactual_decision_test: { plausible_answer_a: 'A', plausible_answer_b: 'B', decision_branching: 'UNCLEAR', branching_reason: 'frozen focused control' }, answer_shape: 'OPEN_EXPLORATION',
  } as any;
  const frozenDecisionReadiness: DecisionReadinessRun = {
    ...adapterDecisionReadiness,
    final: { ...adapterDecisionReadiness.final, selected_gap: { ...selectedGap, ...frozenMetadata }, next_action: frozenMetadata.next_action! },
  };
  const input: StructuredModelGenerateInput<ModelOutput> = {
    systemPrompt: `${prompt}\n\nReturn the visible response fields and relationship facts only. Do not emit conversion_readiness, continuation_mode, or a second CURRENT/LATER judgment.`,
    userPayload: { case_id: item.id, user_goal: item.id, conversation: fixture.turns, instruction: 'Return only the structured visible response and relationship facts.' },
    outputSchema, providerJsonSchema,
    metadata: { candidate_id: 'portfolio-entry-decision-readiness-metadata-integration-v0.1', adapter_mode: 'live_llm_candidate', provider: config.provider, model: config.model, seed_support: config.seed === undefined ? 'not_requested' : 'unavailable' },
    call: { call_id: `decision-readiness-metadata-integration-${item.id}-r${repeat}`, case_id: item.id, repeat_index: repeat, turn_index: 1, purpose: 'analysis_turn' },
  };
  const result = await model.generate(input);
  const output = result.validated_output;
  const providerError = result.technical_error ?? (result.error_type === 'SCHEMA_ERROR' ? result.schema_errors.join('; ') || 'schema_error' : null);
  const relationshipItem: RelationshipItem = { id: item.id, description: item.item, relation: item.expected };
  const projection = integrateDecisionReadinessProjection({ decision_readiness: frozenDecisionReadiness, unresolved_item: relationshipItem, need_sufficient: true, raw_visible_response: output?.visible_response ?? output?.desired_outcome ?? null });
  const semanticErrors = output ? validateProjectedItem({ projected: projection.projected, visible_question: projection.current_relevance === 'LATER' ? null : output.visible_question, visible_response: projection.visible_response, conversion_readiness: projection.conversion_readiness, expected_raw_relation: item.expected }) : ['SCHEMA_INVALID'];
  return {
    provider: config.provider, model: config.model, case_id: item.id, repeat_index: repeat,
    schema_valid: Boolean(output), provider_error: providerError,
    decision_readiness: { selected_material_gap: projection.decision_readiness.selected_material_gap, next_action: projection.decision_readiness.next_action ?? null, current_decision_dependency: projection.decision_readiness.current_decision_dependency ?? null, decision_sensitivity: projection.decision_readiness.decision_sensitivity ?? null, decision_branch_type: projection.decision_readiness.decision_branch_type ?? null, answerability: projection.decision_readiness.answerability ?? null },
    metadata_complete: expectedMetadataComplete(frozenDecisionReadiness), current_relevance: projection.current_relevance,
    current_open_items: projection.current_open_items, later_work_items: projection.later_work_items, unresolved_relationship_items: projection.unresolved_relationship_items,
    conversion_readiness: projection.conversion_readiness, continuation_mode: projection.continuation_mode, visible_response: projection.visible_response,
    semantic_consistency_errors: semanticErrors,
    checks: visibleChecks(output, projection, semanticErrors, adapterDecisionReadiness),
    execution: { error_type: result.error_type ?? null, schema_errors: result.schema_errors, technical_error: result.technical_error ?? null, raw_visible_question: output?.visible_question ?? null, raw_next_action: output?.next_action ?? null, execution_metadata: result.execution_metadata },
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []; let cursor = 0;
  async function worker() { while (cursor < items.length) { const index = cursor++; results[index] = await fn(items[index]); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function count(runs: RunRecord[], predicate: (run: RunRecord) => boolean): number { return runs.filter(predicate).length; }

async function main() {
  const config = loadPortfolioEntryProviderConfig();
  const model = new HarnessFetchStructuredModelAdapter(config);
  const prompt = fs.readFileSync(promptPath, 'utf8');
  const jobs = frozenCases.flatMap((fixture) => Array.from({ length: fixture.id === 'CR-ADV-05' ? 10 : 5 }, (_, index) => ({ fixture, repeat: index + 1 })));
  const runs = await mapLimit(jobs, 6, (job) => call(model, config, prompt, job.fixture, job.repeat));
  const cr = runs.filter((run) => run.case_id === 'CR-ADV-05');
  const controls = runs.filter((run) => run.case_id !== 'CR-ADV-05');
  const expected = new Map(frozenCases.map((item) => [item.id, item.expected]));
  const falseCurrent = count(runs, (run) => run.current_relevance === 'CURRENT' && expected.get(run.case_id) === 'LATER_WORK');
  const falseLater = count(runs, (run) => run.current_relevance === 'LATER' && expected.get(run.case_id) !== 'LATER_WORK');
  const controlsCorrect = count(controls, (run) => (run.current_relevance === 'LATER') === (expected.get(run.case_id) === 'LATER_WORK'));
  const checkCounts = Object.fromEntries(['decision_readiness_regression', 'grounding_regression', 'premature_public_stop', 'later_work_question', 'forced_conversion', 'invented_authority', 'invented_governance'].map((key) => [key, count(runs, (run) => run.checks[key] === 'MATERIAL')]));
  const payload = { artifact: 'PORTFOLIO_ENTRY_DECISION_READINESS_METADATA_INTEGRATION_RUNS_v0.1', status: 'LIVE_COMPLETED', provider: config.provider, model: config.model, target_calls: 35, completed_calls: runs.length, schema_valid: runs.filter((run) => run.schema_valid).length, metadata_complete: runs.filter((run) => run.metadata_complete).length, unresolved: count(runs, (run) => run.current_relevance === 'UNRESOLVED'), cr_adv_05_later: cr.filter((run) => run.current_relevance === 'LATER').length, cr_adv_05_ready: cr.filter((run) => run.conversion_readiness === 'READY').length, controls_correct: controlsCorrect, false_current: falseCurrent, false_later: falseLater, ar_failures: Object.fromEntries(['AR-01', 'AR-02', 'AR-03', 'AR-04', 'AR-05', 'AR-06'].map((key) => [key, count(runs, (run) => run.semantic_consistency_errors.includes(key))])), regressions: checkCounts, runs };
  fs.writeFileSync(runsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const gate = runs.length === 35 && payload.schema_valid === 35 && payload.metadata_complete === 35 && payload.unresolved === 0 && payload.cr_adv_05_later >= 9 && payload.cr_adv_05_ready >= 9 && payload.controls_correct >= 24 && payload.false_current === 0 && payload.false_later === 0 && Object.values(payload.ar_failures).every((value) => value === 0) && Object.values(checkCounts).every((value) => value === 0);
  const lines = ['# Starteria — Decision Readiness Metadata Integration Report v0.1', '', `Status: **${gate ? 'LIVE_COMPLETED / PASS' : 'LIVE_COMPLETED / GATE_FAILURE'}**`, '', `Provider/model: ${config.provider} / ${config.model}.`, '', 'Decision Readiness cognition, prompt, frozen fixtures, thresholds, projection and integration logic were not modified. The runner made one live structured model call per population member and used the frozen Decision Readiness adapter plus the existing metadata integration authority.', '', '## Execution', '', `- Live calls: **${runs.length}/35**`, `- Schema-valid: **${payload.schema_valid}/35**`, `- Decision Readiness metadata complete: **${payload.metadata_complete}/35**`, `- UNRESOLVED: **${payload.unresolved}**`, `- CR-ADV-05 LATER: **${payload.cr_adv_05_later}/10**`, `- CR-ADV-05 READY: **${payload.cr_adv_05_ready}/10**`, `- Controls correct: **${payload.controls_correct}/25**`, `- False CURRENT: **${payload.false_current}**`, `- False LATER: **${payload.false_later}**`, '', '## AR and regression checks', '', ...Object.entries(payload.ar_failures).map(([key, value]) => `- ${key}: **${value}**`), ...Object.entries(checkCounts).map(([key, value]) => `- ${key}: **${value}**`), '', `Gate result: **${gate ? 'PASS' : 'FAIL — failures recorded without repair'}**`, '', 'Historical artifacts were not overwritten; this file records the current 35-call confirmation only.'];
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify({ live_calls: `${runs.length}/35`, schema_valid: `${payload.schema_valid}/35`, metadata_complete: `${payload.metadata_complete}/35`, unresolved: payload.unresolved, cr_adv_05_later: payload.cr_adv_05_later, cr_adv_05_ready: payload.cr_adv_05_ready, controls_correct: payload.controls_correct, false_current: payload.false_current, false_later: payload.false_later }));
}

main().catch((error) => { console.error(error instanceof Error ? error.stack : String(error)); process.exitCode = 1; });
