import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPortfolioEntryHandoffV2 } from '../../backend/modules/portfolio-entry-runtime/handoff/handoff-builder';
import { portfolioEntryHandoffV2Schema } from '../../backend/modules/portfolio-entry-runtime/domain/handoff.schema';
import { portfolioEntryTurnOutputV2Schema } from '../../backend/modules/portfolio-entry-runtime/domain/model-output.schema';
import { createInitialSessionContext, type PortfolioEntrySessionRunInput } from '../../backend/modules/portfolio-entry-runtime/domain/session.types';
import { PortfolioEntrySessionController } from '../../backend/modules/portfolio-entry-runtime/session/session-controller';
import type { PortfolioEntryAgentAdapterV2, PortfolioEntryAnalyzeTurnInputV2, PortfolioEntryAnalyzeTurnOutputV2 } from '../../backend/modules/portfolio-entry-runtime/agent/portfolio-entry-agent-adapter';

export type IsolatedCase = {
  id: string; type: string; input: string; follow_up?: string; exploration_choice?: 'accept' | 'reject';
  expected?: Record<string, unknown>; hypothesis_id?: string;
};

export type ValidationResult = {
  case_id: string; contract_result: 'PASS' | 'REVIEW' | 'FAIL'; hypothesis_result: 'SUPPORTED' | 'INCONCLUSIVE' | 'CONTRADICTED' | 'N/A';
  failures: string[]; observations: Record<string, unknown>;
};

const currentDir = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(resolve(currentDir, 'fixtures.json'), 'utf8')) as {
  contract_cases: IsolatedCase[]; hypothesis_cases: IsolatedCase[]; regression_v01: IsolatedCase[];
};

function analysis(input: PortfolioEntryAnalyzeTurnInputV2, turn: number): PortfolioEntryAnalyzeTurnOutputV2 {
  const first = turn === 1;
  const isGov = /programa|aceleradora|gobernar/i.test(input.rawInput);
  const isSolution = /solución concreta|probar/i.test(input.rawInput);
  const isProblem = /pierden tiempo|fricción|problema/i.test(input.rawInput);
  const isReporting = /comité|presento/i.test(input.rawInput);
  const initial = first ? (isSolution || isProblem ? 'problem_first' : isGov ? 'portfolio_first' : isReporting ? 'reporting_first' : 'strategy_first') : input.priorAnalysis?.initial_entry_state ?? 'unknown';
  const current = isSolution ? 'initiative_first' : initial;
  const intent = isGov ? 'portfolio_governance' : isSolution ? 'initiative_governance' : isReporting ? 'portfolio_reporting' : 'strategic_goal';
  return {
    analysis: {
      entry_id: input.entryId, analysis_version: '0.2', primary_intent: intent,
      secondary_intents: [], initial_entry_state: initial, current_frame: current,
      extracted_context: { raw_input: input.rawInput }, ambiguities: [], contradictions: [],
      reverse_alignment: { required: isSolution, subject_type: isSolution ? 'initiative' : 'unknown', subject: isSolution ? 'solution candidate' : null, connection_state: isSolution ? 'partial' : 'not_required', status: isSolution ? 'partial' : 'not_required', activation_reason: isSolution ? 'late_solution_detected' : undefined },
      provenance: [{ path: 'raw_input', origin: 'EXTRACTED_FROM_USER_TEXT', review_disposition: 'UNREVIEWED', source_text: input.rawInput }], status: 'ready',
    },
    question_plan: { questions: [], question_count: 0, status: 'no_questions_required', stop_reason: 'sufficient_context' },
  } as PortfolioEntryAnalyzeTurnOutputV2;
}

function adapterFor(caseId: string): PortfolioEntryAgentAdapterV2 {
  return { analyzeTurn: async (input) => {
    const turn = Number(input.entryId.split('-').at(-1)) || 1;
    const result = analysis(input, turn);
    if (caseId === 'PE2-ST-CF-01' && turn === 1) {
      result.question_plan = { questions: [{ id: 'context-1', question: '¿Qué estáis probando exactamente?', question_type: 'clarification', reason_to_ask: 'Aclarar el encuadre actual.', resolves: ['current_frame'], priority: 1, expected_answer_type: 'text' }], question_count: 1, status: 'questions_required' };
    }
    if (caseId === 'PE2-MT-GE-01' && turn === 1) {
      result.question_plan = { questions: [1, 2, 3].map((number) => ({ id: `exploration-${number}`, question: `¿Qué aspecto ${number} necesita más claridad?`, question_type: 'guided_deepening' as const, reason_to_ask: 'Reducir una brecha material.', resolves: [`gap-${number}`], priority: 1, expected_answer_type: 'text' })), question_count: 3, status: 'questions_required' };
    }
    return result;
  } };
}

function validHandoff() {
  return { understanding: { value: 'La organización necesita ordenar una decisión de portfolio.', provenance: { origin: 'EXTRACTED_FROM_USER_TEXT', source_text: 'input' } }, desired_outcome: { value: 'Contar con claridad para decidir.', provenance: { origin: 'USER_DECLARED', source_text: 'input' } }, decision_to_enable: 'unresolved' as const, alternative_approaches: [], known_context: [], unresolved_context: [{ gap_id: 'decision-context', description: 'Falta contexto organizacional.', provenance: { origin: 'AI_INFERRED' as const } }], gap_resolution_map: [{ gap_id: 'decision-context', gap_description: 'Falta contexto organizacional.', resolution_type: 'REQUIRES_ORGANIZATIONAL_INPUT' as const, resolution_stage: 'PORTFOLIO' as const }], evidence_or_clarity_needed: [{ value: 'Criterios y evidencia para decidir.', provenance: { origin: 'AI_SUGGESTED' as const } }], starteria_path: [{ action: 'structure' as const, description: 'Estructurar la decisión de portfolio.' }], recommended_cta: 'Continuar aclarando la decisión', provenance_summary: [{ origin: 'AI_SUGGESTED' as const }], handoff_status: 'ready_with_uncertainty' as const };
}

export async function executeCase(testCase: IsolatedCase): Promise<ValidationResult> {
  const controller = new PortfolioEntrySessionController(adapterFor(testCase.id), { runId: `run-${testCase.id}`, candidateId: 'portfolio-entry-v0.2-isolated-validation' });
  const input: PortfolioEntrySessionRunInput = { caseId: testCase.id, runId: `run-${testCase.id}`, candidateId: 'portfolio-entry-v0.2-isolated-validation', initialUserInput: testCase.input, initialContext: createInitialSessionContext({ initial_mode: 'quick_clarification', quick_question_budget: 3 }), guidedExplorationChoice: testCase.exploration_choice, followUpResponder: testCase.follow_up ? (questions) => ({ response: testCase.follow_up, matched_question_ids: questions.map((question) => question.id), response_rule_ids_used: [], responded_resolves: questions.flatMap((question) => question.resolves), unmatched_questions: [], fallback_used: false, consumed_once_rule_ids: [] }) : undefined };
  const execution = await controller.execute(input);
  const failures: string[] = [];
  for (const turn of execution.trace.turns) {
    const parsed = portfolioEntryTurnOutputV2Schema.safeParse({ analysis: turn.analysis, question_plan: turn.question_plan });
    if (!parsed.success) failures.push('F-SCHEMA: turn output is not v0.2 schema-conformant');
    if (turn.initial_entry_state !== execution.trace.turns[0]?.initial_entry_state) failures.push('F-INITIAL_STATE_MUTATION: initial_entry_state changed');
    if (turn.emitted_question_count > 3) failures.push('F-QUESTION_OVERLOAD: quick question budget exceeded');
  }
  if (execution.trace.mode_transitions.some((transition) => transition.to_mode === 'guided_exploration') && testCase.exploration_choice !== 'accept') failures.push('F-GUIDED_EXPLORATION: entered without explicit consent');
  const handoff = buildPortfolioEntryHandoffV2({ execution, final_analysis: execution.trace.turns.at(-1)?.analysis ?? analysis({ entryId: `${testCase.id}-1`, sessionId: testCase.id, rawInput: testCase.input, sessionContext: createInitialSessionContext({ initial_mode: 'quick_clarification', quick_question_budget: 3 }) }, 1).analysis, candidate_source: validHandoff() });
  if (!handoff.schema_valid || !portfolioEntryHandoffV2Schema.safeParse(handoff.handoff).success) failures.push('F-HANDOFF: candidate handoff is not schema-conformant');
  const expected = testCase.expected ?? {};
  const final = execution.trace.turns.at(-1);
  if (expected.initial_entry_state && execution.trace.turns[0]?.initial_entry_state !== expected.initial_entry_state) failures.push('F-ENTRY_STATE: unexpected initial entry state');
  if (expected.current_frame && final?.current_frame !== expected.current_frame) failures.push('F-CURRENT_FRAME: unexpected current frame');
  if (expected.primary_intent && final?.analysis.primary_intent !== expected.primary_intent) failures.push('F-INTENT: unexpected primary intent');
  return { case_id: testCase.id, contract_result: failures.length ? 'FAIL' : 'PASS', hypothesis_result: testCase.hypothesis_id ? 'INCONCLUSIVE' : 'N/A', failures, observations: { turns: execution.trace.turns.length, quick_questions_total: execution.trace.quick_questions_total, initial_entry_state: execution.trace.turns[0]?.initial_entry_state, current_frame: final?.current_frame, handoff_status: handoff.handoff?.handoff_status, promotion_status: 'BLOCKED_PENDING_VALIDATION' } };
}

export async function runIsolatedValidation() {
  const results = [] as ValidationResult[];
  for (const testCase of [...fixture.regression_v01, ...fixture.contract_cases, ...fixture.hypothesis_cases]) results.push(await executeCase(testCase));
  return { candidate_id: 'portfolio-entry-v0.2-isolated-validation', promotion_status: 'BLOCKED_PENDING_VALIDATION', contract_conformance: results.filter((r) => r.hypothesis_result === 'N/A'), hypothesis_validation: results.filter((r) => r.hypothesis_result !== 'N/A'), results };
}
