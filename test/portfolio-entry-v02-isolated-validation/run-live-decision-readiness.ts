import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { HarnessFetchStructuredModelAdapter } from './harness-fetch-structured-model-adapter';
import type { StructuredModelGenerateInput } from '../../backend/modules/portfolio-entry-runtime/model/structured-model-adapter';
import { loadPortfolioEntryProviderConfig as loadConfig } from '../../backend/modules/portfolio-entry-runtime/model/provider-config';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_FLEXIBILITY_FIXTURES_v0.1.json');
const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decision-readiness-live-prompt.v0.1.md');
const outputPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_LIVE_RUNS_HARDENED_RERUN_v0.1.json');

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

const technicalSmokeSchema = z.object({ ok: z.literal(true) }).strict();

const technicalSmokeProviderSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['ok'],
  properties: { ok: { type: 'boolean', const: true } },
} as const;

const providerJsonSchema = {
  type: 'object', additionalProperties: false, required: [
    'selected_material_gap', 'next_action', 'deferred_gaps', 'routing_target',
    'stop_rationale', 'visible_synthesis', 'visible_question', 'visible_response',
  ], properties: {
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

const forbidden = [/decision dependency/i, /dependencia de decisión/i, /sensitivity/i, /sensibilidad/i, /branch type/i, /tipo de rama/i, /counterfactual/i, /contrafactual/i, /\brouting\b/i, /Decision Readiness/i, /framework/i, /score/i, /dimension/i];
const questions = (value: string) => (value.match(/\?/g) ?? []).length;

type Fixture = { id: string; title: string; user_goal: string; turns: string[]; user_response: string };
type Review = { naturalness: number; user_job_alignment: number; question_usefulness: number; cognitive_invisibility: number; flexibility: number; action_clarity: number; overstructured: boolean; unnecessary_question: boolean; user_job_drift: boolean; framework_leakage: boolean; unknown_loop: boolean; premature_route: boolean; late_stop: boolean; material_gap_missed: boolean };

type CandidateOutput = z.infer<typeof outputSchema>;

function semanticErrors(output: CandidateOutput): string[] {
  switch (output.next_action) {
    case 'ASK':
      return output.visible_question !== null ? [] : ['ASK requires visible_question'];
    case 'STOP':
      return output.visible_question === null && output.stop_rationale !== null
        ? []
        : ['STOP requires visible_question=null and stop_rationale!=null'];
    case 'ROUTE':
      return output.routing_target !== null ? [] : ['ROUTE requires routing_target'];
    case 'REQUIRE_ORGANIZATIONAL_INPUT':
      return output.routing_target !== null ? [] : ['REQUIRE_ORGANIZATIONAL_INPUT requires routing_target'];
  }
}

const semanticSmokeCases = [
  { id: 'SMOKE-ASK-01', goal: 'Decidir si continuar con una iniciativa.', turn: 'Tenemos una opción viable, pero falta confirmar qué capacidad real tendremos el próximo mes.' },
  { id: 'SMOKE-ASK-02', goal: 'Entender qué priorizar.', turn: 'Hay varias opciones y no está claro qué resultado pesa más para decidir.' },
  { id: 'SMOKE-ASK-03', goal: 'Saber si el lanzamiento puede continuar.', turn: 'La decisión está cerca, pero falta aclarar una condición operativa que puede cambiarla.' },
  { id: 'SMOKE-STOP-01', goal: 'Presentar una iniciativa lista.', turn: 'La iniciativa tiene owner, presupuesto, capacidad y criterio de decisión acordado; sólo queda trabajo posterior.' },
  { id: 'SMOKE-STOP-02', goal: 'Saber qué hacer ahora.', turn: 'La decisión de continuar ya está tomada; los detalles técnicos se resolverán en una etapa posterior.' },
  { id: 'SMOKE-ROUTE-01', goal: 'Saber quién debe decidir el siguiente paso.', turn: 'El equipo tiene evidencia suficiente y el comité debe decidir si se pasa a operación.' },
  { id: 'SMOKE-ROUTE-02', goal: 'Preparar una decisión.', turn: 'El caso está listo para la revisión del comité ejecutivo y necesitamos llevarlo a esa instancia.' },
  { id: 'SMOKE-ROUTE-03', goal: 'Resolver el siguiente paso.', turn: 'La decisión corresponde al sponsor del portfolio, no al equipo que ejecuta.' },
  { id: 'SMOKE-ORG-01', goal: 'Saber cómo resolver una excepción.', turn: 'Sólo gerencia puede confirmar si existe una excepción al plan anual.' },
  { id: 'SMOKE-ORG-02', goal: 'Confirmar autoridad para continuar.', turn: 'La iniciativa depende de una aprobación organizacional que todavía no está confirmada.' },
] as const;

async function runTechnicalSmoke(model: HarnessFetchStructuredModelAdapter, config: ReturnType<typeof loadConfig>) {
  const result = await model.generate({
    systemPrompt: 'Technical connectivity smoke only. Return exactly {"ok":true}.',
    userPayload: { smoke: 'portfolio-entry-live-provider-authentication' },
    outputSchema: technicalSmokeSchema,
    providerJsonSchema: technicalSmokeProviderSchema,
    metadata: {
      candidate_id: 'portfolio-entry-decision-readiness-live-v0.1',
      adapter_mode: 'live_llm_candidate',
      provider: config.provider,
      model: config.model,
      seed_support: config.seed === undefined ? 'not_requested' : 'unavailable',
    },
    call: { call_id: 'decision-readiness-live-technical-smoke', purpose: 'technical_smoke' },
  });

  if (!result.validated_output) {
    const reason = result.technical_error ?? (result.error_type === 'SCHEMA_ERROR' ? 'schema_error' : 'invalid_smoke_output');
    throw new Error(`Technical smoke failed: provider=${config.provider} model=${config.model} reason=${reason}`);
  }

  return { provider: config.provider, model: config.model, status: 'PASS' as const };
}

async function runSemanticSmoke(model: HarnessFetchStructuredModelAdapter, config: ReturnType<typeof loadConfig>, prompt: string) {
  const results = [] as Array<{ id: string; valid: boolean; semantic_errors: string[]; action?: CandidateOutput['next_action']; schema_errors: string[] }>;
  for (const smokeCase of semanticSmokeCases) {
    const result = await model.generate<CandidateOutput>({
      systemPrompt: prompt,
      userPayload: {
        case_id: smokeCase.id,
        user_goal: smokeCase.goal,
        conversation: [smokeCase.turn],
        instruction: 'Produce the next visible assistant turn for the latest user context. Do not use an expected response.',
      },
      outputSchema,
      providerJsonSchema,
      metadata: { candidate_id: 'portfolio-entry-decision-readiness-live-v0.1', adapter_mode: 'live_llm_candidate', provider: config.provider, model: config.model, seed_support: config.seed === undefined ? 'not_requested' : 'unavailable' },
      call: { call_id: `decision-readiness-live-semantic-smoke-${smokeCase.id}`, case_id: smokeCase.id, turn_index: 1, purpose: 'analysis_turn' },
    });
    const output = result.validated_output;
    const errors = output ? semanticErrors(output) : [];
    results.push({ id: smokeCase.id, valid: Boolean(output) && errors.length === 0, semantic_errors: errors, action: output?.next_action, schema_errors: result.schema_errors });
  }
  const valid = results.filter((result) => result.valid).length;
  const semanticFailures = results.filter((result) => result.semantic_errors.length > 0).length;
  const schemaFailureCounts = Object.fromEntries(
    [...new Set(results.flatMap((result) => result.schema_errors))]
      .map((error) => [error, results.filter((result) => result.schema_errors.includes(error)).length]),
  );
  if (valid < 9 || semanticFailures > 0) {
    throw new Error(`Semantic smoke failed: valid=${valid}/${results.length} semantic_consistency_failures=${semanticFailures} schema_errors=${JSON.stringify(schemaFailureCounts)}`);
  }
  return { valid, total: results.length, semantic_consistency_failures: semanticFailures, action_counts: Object.fromEntries([...new Set(results.map((result) => result.action).filter(Boolean))].map((action) => [action, results.filter((result) => result.action === action).length])) };
}

function reviewVisible(fixture: Fixture, output: z.infer<typeof outputSchema>): Review {
  const text = `${output.visible_synthesis} ${output.visible_question ?? ''} ${output.visible_response}`;
  const count = questions(text);
  const leakage = forbidden.some((pattern) => pattern.test(text));
  const overstructured = count > 1 || /^(1\.|2\.|3\.|- )/m.test(text);
  const unnecessary = output.next_action === 'ASK' && !output.visible_question;
  const drift = text.trim().length === 0 || output.visible_response.trim().length === 0;
  const actionClear = output.next_action === 'ASK' ? Boolean(output.visible_question) : Boolean(output.visible_response.trim());
  return {
    naturalness: leakage || overstructured ? 2 : text.length > 360 ? 4 : 5,
    user_job_alignment: drift ? 2 : 5,
    question_usefulness: unnecessary ? 2 : output.next_action === 'ASK' ? 5 : 4,
    cognitive_invisibility: leakage ? 1 : 5,
    flexibility: overstructured ? 2 : 5,
    action_clarity: actionClear ? 5 : 2,
    overstructured,
    unnecessary_question: unnecessary,
    user_job_drift: drift,
    framework_leakage: leakage,
    unknown_loop: false,
    premature_route: false,
    late_stop: output.next_action === 'STOP' && fixture.turns.length > 1,
    material_gap_missed: output.selected_material_gap.trim() === '',
  };
}

async function main() {
  const config = loadConfig();
  const model = new HarnessFetchStructuredModelAdapter(config);
  const smoke = await runTechnicalSmoke(model, config);
  const prompt = fs.readFileSync(promptPath, 'utf8');
  const semanticSmoke = await runSemanticSmoke(model, config, prompt);
  if (process.argv.includes('--smoke-only')) {
    console.log(JSON.stringify({ smoke, semantic_smoke: semanticSmoke }));
    return;
  }

  const fixtures = (JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { cases: Fixture[] }).cases;
  const runs: unknown[] = [];
  for (let repeat = 1; repeat <= 5; repeat += 1) {
    for (const fixture of fixtures) {
      const input: StructuredModelGenerateInput<z.infer<typeof outputSchema>> = {
        systemPrompt: prompt,
        userPayload: { case_id: fixture.id, user_goal: fixture.user_goal, conversation: fixture.turns, instruction: 'Produce the next visible assistant turn for the latest user context. Do not use the supplied expected response.' },
        outputSchema,
        providerJsonSchema,
        metadata: { candidate_id: 'portfolio-entry-decision-readiness-live-v0.1', adapter_mode: 'live_llm_candidate', provider: config.provider, model: config.model, seed_support: config.seed === undefined ? 'not_requested' : 'unavailable' },
        call: { call_id: `decision-readiness-live-${fixture.id}-r${repeat}`, case_id: fixture.id, repeat_index: repeat, turn_index: 1, purpose: 'analysis_turn' },
      };
      const result = await model.generate(input);
      const output = result.validated_output;
      const semanticConsistencyErrors = output ? semanticErrors(output) : [];
      runs.push({ case_id: fixture.id, repeat_index: repeat, provider: config.provider, model: config.model, status: output && semanticConsistencyErrors.length === 0 ? 'PASS' : 'FAIL', internal: output ? { selected_material_gap: output.selected_material_gap, next_action: output.next_action, deferred_gaps: output.deferred_gaps, routing_target: output.routing_target, stop_rationale: output.stop_rationale } : null, visible: output ? { synthesis: output.visible_synthesis, question: output.visible_question, response: output.visible_response } : null, review: output && semanticConsistencyErrors.length === 0 ? reviewVisible(fixture, output) : null, execution: { validation_status: output ? (semanticConsistencyErrors.length === 0 ? 'VALID_OUTPUT' : 'ACTION_FIELD_INCONSISTENCY') : 'PROVIDER_SCHEMA_INVALID', error_type: result.error_type, schema_errors: result.schema_errors, semantic_consistency_errors: semanticConsistencyErrors, technical_error: result.technical_error, metadata: result.execution_metadata } });
    }
  }
  const payload = { run_version: 'HYP-005-live-candidate-v0.1', candidate_id: 'portfolio-entry-decision-readiness-live-v0.1', provider: config.provider, model: config.model, repetitions_per_case: 5, requested_runs: 60, completed_runs: runs.length, prompt_path: path.relative(root, promptPath).replaceAll('\\', '/'), fixture_path: path.relative(root, fixturePath).replaceAll('\\', '/'), generated_at: new Date().toISOString(), runs };
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ smoke, semantic_smoke: semanticSmoke, outputPath, provider: config.provider, model: config.model, completed_runs: runs.length }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
