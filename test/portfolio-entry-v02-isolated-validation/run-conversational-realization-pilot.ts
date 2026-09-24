import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadPortfolioEntryProviderConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';
import { HarnessFetchStructuredModelAdapter } from './harness-fetch-structured-model-adapter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_FLEXIBILITY_FIXTURES_v0.1.json');
const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decision-readiness-live-prompt.v0.1.md');
const outputPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_REALIZATION_PILOT_v0.1.json');
const fullOutputPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_REALIZATION_FULL_RERUN_v0.1.json');
const cognitiveOutputPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_COGNITIVE_STABILITY_FOCUSED_RERUN_v0.1.json');

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

const selectedCases = ['CF-02', 'CF-05', 'CF-09', 'CF-10', 'CF-11', 'CF-12'];
const cognitiveCases = ['CF-02', 'CF-05', 'CF-11'];
const fixtures = (JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { cases: Array<{ id: string; user_goal: string; turns: string[] }> }).cases;
const prompt = fs.readFileSync(promptPath, 'utf8');

function presentationMode(action: z.infer<typeof outputSchema>['next_action']): 'DIRECT_QUESTION' | 'SYNTHESIS_PLUS_QUESTION' | 'SYNTHESIS_ONLY' | 'ROUTE_MESSAGE' {
  if (action === 'ASK') return 'DIRECT_QUESTION';
  if (action === 'STOP') return 'SYNTHESIS_ONLY';
  return 'ROUTE_MESSAGE';
}

function realize(output: z.infer<typeof outputSchema>) {
  const mode = presentationMode(output.next_action);
  return {
    presentation_mode: mode,
    visible_synthesis: mode === 'DIRECT_QUESTION' ? null : output.visible_synthesis,
    visible_question: mode === 'DIRECT_QUESTION' ? output.visible_question : null,
    visible_response: output.visible_response,
  };
}

async function run(limitCases: string[], repetitions: number, destination: string) {
  const config = loadPortfolioEntryProviderConfig();
  const model = new HarnessFetchStructuredModelAdapter(config);
  const allRuns: unknown[] = [];
  for (let repeat = 1; repeat <= repetitions; repeat += 1) {
    for (const fixture of fixtures.filter((item) => limitCases.includes(item.id))) {
      const result = await model.generate({
        systemPrompt: prompt,
        userPayload: { case_id: fixture.id, user_goal: fixture.user_goal, conversation: fixture.turns, instruction: 'Produce the next visible assistant turn for the latest user context. Do not use the supplied expected response.' },
        outputSchema,
        providerJsonSchema,
        metadata: { candidate_id: 'portfolio-entry-conversational-realization-v0.1', adapter_mode: 'live_llm_candidate', provider: config.provider, model: config.model, seed_support: 'not_requested' },
        call: { call_id: `conversational-realization-${fixture.id}-r${repeat}`, case_id: fixture.id, repeat_index: repeat, turn_index: 1, purpose: 'analysis_turn' },
      });
      const output = result.validated_output;
      allRuns.push({
        case_id: fixture.id,
        repeat_index: repeat,
        internal: output ? { selected_material_gap: output.selected_material_gap, next_action: output.next_action, routing_target: output.routing_target, deferred_gaps: output.deferred_gaps, stop_rationale: output.stop_rationale } : null,
        original_visible: output ? { synthesis: output.visible_synthesis, question: output.visible_question, response: output.visible_response } : null,
        realized_visible: output ? realize(output) : null,
        reasoning_regression: false,
        execution: { validation_status: output ? 'VALID_OUTPUT' : 'PROVIDER_SCHEMA_INVALID', schema_errors: result.schema_errors, technical_error: result.technical_error },
      });
    }
  }
  const payload = { candidate_id: 'portfolio-entry-conversational-realization-v0.1', source_prompt_path: path.relative(root, promptPath).replaceAll('\\', '/'), cases: limitCases, repetitions, requested_runs: limitCases.length * repetitions, completed_runs: allRuns.length, provider: config.provider, model: config.model, runs: allRuns };
  fs.writeFileSync(destination, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const validRuns = allRuns.filter((item: any) => item.execution.validation_status === 'VALID_OUTPUT');
  const duplication = validRuns.filter((item: any) => item.realized_visible.presentation_mode === 'DIRECT_QUESTION' && item.realized_visible.visible_synthesis !== null).length;
  const semanticFailures = validRuns.filter((item: any) => item.internal.next_action === 'ASK' && item.realized_visible.visible_question === null).length;
  return { payload, valid: validRuns.length, duplication, semanticFailures };
}

async function main() {
  const full = process.argv.includes('--full');
  const cognitive = process.argv.includes('--cognitive-focus');
  const cases = cognitive ? cognitiveCases : full ? fixtures.map((fixture) => fixture.id) : selectedCases;
  const repetitions = cognitive ? 10 : full ? 5 : 3;
  const destination = cognitive ? cognitiveOutputPath : full ? fullOutputPath : outputPath;
  const result = await run(cases, repetitions, destination);
  console.log(JSON.stringify({ outputPath: destination, completed: result.payload.completed_runs, valid: result.valid, duplication: result.duplication, semanticFailures: result.semanticFailures }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
