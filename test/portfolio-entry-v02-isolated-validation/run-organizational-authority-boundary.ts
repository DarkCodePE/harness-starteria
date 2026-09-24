import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadPortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import { HarnessFetchStructuredModelAdapter } from './harness-fetch-structured-model-adapter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_FLEXIBILITY_FIXTURES_v0.1.json');
const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decision-readiness-live-prompt.v0.1.md');
const outputPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_ORGANIZATIONAL_AUTHORITY_BOUNDARY_RERUN_v0.1.json');

const outputSchema = z.object({
  selected_material_gap: z.string(),
  next_action: z.enum(['ASK', 'STOP', 'ROUTE', 'REQUIRE_ORGANIZATIONAL_INPUT']),
  deferred_gaps: z.array(z.string()),
  routing_target: z.string().nullable(),
  stop_rationale: z.string().nullable(),
  visible_synthesis: z.string(),
  visible_question: z.string().nullable(),
  visible_response: z.string(),
}).strict();

const providerJsonSchema = {
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

type TestCase = { id: string; category: 'CF-02' | 'CF-05' | 'AUTH-CTRL-01' | 'AUTH-CTRL-02' | 'AUTH-CTRL-03'; user_goal: string; turns: string[]; expected: string[] };
const fixtures = (JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { cases: Array<{ id: string; user_goal: string; turns: string[] }> }).cases;
const byId = Object.fromEntries(fixtures.map((fixture) => [fixture.id, fixture]));
const cases: TestCase[] = [
  ...Array.from({ length: 15 }, (_, index) => ({ id: `CF-02-${index + 1}`, category: 'CF-02' as const, user_goal: byId['CF-02'].user_goal, turns: byId['CF-02'].turns, expected: ['REQUIRE_ORGANIZATIONAL_INPUT'] })),
  ...Array.from({ length: 10 }, (_, index) => ({ id: `CF-05-${index + 1}`, category: 'CF-05' as const, user_goal: byId['CF-05'].user_goal, turns: byId['CF-05'].turns, expected: ['REQUIRE_ORGANIZATIONAL_INPUT'] })),
  ...Array.from({ length: 5 }, (_, index) => ({ id: `AUTH-CTRL-01-${index + 1}`, category: 'AUTH-CTRL-01' as const, user_goal: 'Aplicar el criterio de dirección a una decisión concreta.', turns: ['La dirección ya ha definido que el criterio prioritario es reducir el riesgo operativo; yo conozco ese criterio y necesito aclarar cómo aplicarlo a estas dos opciones.'], expected: ['ASK', 'STOP', 'ROUTE'] })),
  ...Array.from({ length: 5 }, (_, index) => ({ id: `AUTH-CTRL-02-${index + 1}`, category: 'AUTH-CTRL-02' as const, user_goal: 'Saber si la iniciativa puede continuar esta semana.', turns: ['No sé cuántos usuarios activos tenemos esta semana, pero puedo comprobarlo en el panel de analítica y traer ese dato.'], expected: ['ASK'] })),
  ...Array.from({ length: 5 }, (_, index) => ({ id: `AUTH-CTRL-03-${index + 1}`, category: 'AUTH-CTRL-03' as const, user_goal: 'Presentar una iniciativa ya lista al comité.', turns: ['El comité todavía no ha confirmado quién patrocinará la fase posterior, pero la decisión de presentar la iniciativa ya está tomada y no depende de ese dato.'], expected: ['STOP', 'ROUTE'] })),
];

function semanticErrors(output: z.infer<typeof outputSchema>): string[] {
  if (output.next_action === 'ASK' && output.visible_question === null) return ['ASK requires visible_question'];
  if (output.next_action === 'STOP' && (output.visible_question !== null || output.stop_rationale === null)) return ['STOP action-field inconsistency'];
  if ((output.next_action === 'ROUTE' || output.next_action === 'REQUIRE_ORGANIZATIONAL_INPUT') && output.routing_target === null) return [`${output.next_action} requires routing_target`];
  return [];
}

async function main() {
  const prompt = fs.readFileSync(promptPath, 'utf8');
  const config = loadPortfolioEntryProviderConfig();
  const model = new HarnessFetchStructuredModelAdapter(config);
  const results = [];
  for (const testCase of cases) {
    const result = await model.generate({
      systemPrompt: prompt,
      userPayload: { case_id: testCase.id, user_goal: testCase.user_goal, conversation: testCase.turns, instruction: 'Produce the next visible assistant turn for the latest user context. Do not use an expected response.' },
      outputSchema,
      providerJsonSchema,
      metadata: { candidate_id: 'portfolio-entry-organizational-authority-boundary-v0.1', adapter_mode: 'live_llm_candidate', provider: config.provider, model: config.model, seed_support: 'not_requested' },
      call: { call_id: `organizational-authority-${testCase.id}`, case_id: testCase.category, turn_index: 1, purpose: 'analysis_turn' },
    });
    const output = result.validated_output;
    const errors = output ? semanticErrors(output) : [];
    results.push({ id: testCase.id, category: testCase.category, expected: testCase.expected, actual: output?.next_action ?? null, selected_material_gap: output?.selected_material_gap ?? null, routing_target: output?.routing_target ?? null, visible_synthesis: output?.visible_synthesis ?? null, visible_question: output?.visible_question ?? null, visible_response: output?.visible_response ?? null, semantic_errors: errors, validation_status: output && errors.length === 0 ? 'VALID_OUTPUT' : output ? 'ACTION_FIELD_INCONSISTENCY' : 'PROVIDER_SCHEMA_INVALID', technical_error: result.technical_error, schema_errors: result.schema_errors });
  }
  const payload = { candidate_id: 'portfolio-entry-organizational-authority-boundary-v0.1', provider: config.provider, model: config.model, prompt_path: path.relative(root, promptPath).replaceAll('\\', '/'), requested_runs: cases.length, completed_runs: results.length, frozen_before_execution: true, results };
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, completed: results.length, valid: results.filter((result) => result.validation_status === 'VALID_OUTPUT').length, action_counts: Object.fromEntries([...new Set(results.map((result) => result.category))].map((category) => [category, Object.fromEntries(Object.entries(Object.groupBy(results.filter((result) => result.category === category), (result) => result.actual)).map(([action, values]) => [action, values?.length ?? 0]))])) }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
