import { describe, expect, it } from 'vitest';
import { determineContractResultV2, scoreContractV2 } from '../evaluator/contract-scorer-v0.2';
import { evaluateSessionV2 } from '../evaluator/evaluate-session';
import { evaluateHardChecksV2 } from '../evaluator/hard-checks-v0.2';
import { evaluateHypothesesV2 } from '../evaluator/hypothesis-evaluator';
import { FAILURE_TAXONOMY_V2 } from '../evaluator/failure-taxonomy-v0.2';
import { evaluatedPortfolioEntryResultV2Schema } from '../schemas/evaluated-result.schema';
import { multiTurnFixtureV2Schema, type MultiTurnFixtureV2 } from '../schemas/session-fixture.schema';
import { singleTurnFixtureV2Schema, type SingleTurnFixtureV2 } from '../schemas/single-turn-fixture.schema';
import type { SessionTrace, SessionTurnTrace } from '../session/session-types';

describe('portfolio entry evaluation v0.2', () => {
  it('applies exact contract thresholds', () => {
    expect(determineContractResultV2(0.90, false)).toBe('PASS');
    expect(determineContractResultV2(0.75, false)).toBe('REVIEW');
    expect(determineContractResultV2(0.749, false)).toBe('FAIL');
  });

  it('hard failure forces FAIL even when score is at least 0.90', () => {
    expect(determineContractResultV2(0.95, true)).toBe('FAIL');
  });

  it('does not treat NOT_EVALUABLE as PASS or hard failure', () => {
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: trace() });
    const notEvaluable = checks.filter((check) => check.status === 'NOT_EVALUABLE');

    expect(notEvaluable.length).toBeGreaterThan(0);
    expect(notEvaluable.every((check) => check.severity !== 'HARD_FAILURE')).toBe(true);
    expect(checks.filter((check) => check.status === 'PASS').map((check) => check.check_id)).not.toContain(notEvaluable[0].check_id);
  });

  it('does not make all contract dimensions applicable just because a fixture links a hypothesis', () => {
    const fixture = multiFixture({ linked_hypotheses: ['HYP-001'] });
    const checks = evaluateHardChecksV2({ fixture, trace: trace() });
    const contract = scoreContractV2({ fixture, trace: trace(), hardChecks: checks });

    expect(contract.dimensions).toHaveLength(12);
    expect(contract.dimensions.find((dimension) => dimension.dimension === 'Intent')?.applicability).toBe('NOT_APPLICABLE');
    expect(contract.dimensions.filter((dimension) => dimension.applicability === 'APPLICABLE').length).toBeLessThan(12);
  });

  it('allows contract FAIL to coexist with hypothesis INCONCLUSIVE', () => {
    const fixture = multiFixture({ linked_hypotheses: ['HYP-001'] });
    const evaluated = evaluateSessionV2({ fixture, execution: overflowTrace() });

    expect(evaluated.contract_result).toBe('FAIL');
    expect(evaluated.hypothesis_result).toBe('INCONCLUSIVE');
  });

  it('allows contract PASS to coexist with hypothesis INCONCLUSIVE', () => {
    const fixture = multiFixture({ linked_hypotheses: ['HYP-001'] });
    const evaluated = evaluateSessionV2({ fixture, execution: trace() });

    expect(evaluated.contract_result).toBe('PASS');
    expect(evaluated.hypothesis_result).toBe('INCONCLUSIVE');
  });

  it('keeps hypothesis CONTRADICTED reserved for explicit contradiction signals', () => {
    const fixture = multiFixture({ linked_hypotheses: ['HYP-001'] });
    const output = evaluateHypothesesV2({
      fixture,
      trace: {
        ...trace(),
        hypothesis_contradiction_signals: ['HYP-001:CONTRADICTED'],
      } as SessionTrace,
      contractResult: 'PASS',
    });

    expect(output.hypothesis_result).toBe('CONTRADICTED');
  });

  it('does not fail a stable current_frame when no evolution is expected', () => {
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: trace({ frames: ['problem_first', 'problem_first'] }) });

    expect(checks.find((check) => check.check_id === 'HC-CURRENT-FRAME')?.status).toBe('NOT_EVALUABLE');
    expect(checks.some((check) => check.status === 'FAIL' && check.failure_code === 'F-CURRENT_FRAME_STAGNATION')).toBe(false);
  });

  it('detects expected current-frame stagnation only when fixture declares evolution', () => {
    const fixture = multiFixture({
      expected_session: {
        allowed_frame_transitions: [['problem_first', 'initiative_first']],
      },
    });
    const checks = evaluateHardChecksV2({ fixture, trace: trace({ frames: ['problem_first', 'problem_first'] }) });

    expect(checks.find((check) => check.check_id === 'HC-CURRENT-FRAME')?.status).toBe('FAIL');
    expect(checks.find((check) => check.check_id === 'HC-CURRENT-FRAME')?.failure_code).toBe('F-CURRENT_FRAME_STAGNATION');
  });

  it('detects initial state mutation', () => {
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: trace({ initialStates: ['problem_first', 'initiative_first'] }) });

    expect(checks.find((check) => check.check_id === 'HC-11')?.status).toBe('FAIL');
    expect(checks.find((check) => check.check_id === 'HC-11')?.failure_code).toBe('F-INITIAL_STATE_MUTATION');
  });

  it('detects planner overflow even when the controller emitted only the allowed question', () => {
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: overflowTrace() });

    expect(checks.find((check) => check.check_id === 'HC-13')?.status).toBe('FAIL');
    expect(checks.find((check) => check.check_id === 'HC-13')?.evidence[1].actual).toEqual([{
      turn_index: 1,
      available: 1,
      received: 2,
      emitted: 1,
    }]);
  });

  it('passes guided reject when guided mode does not start', () => {
    const rejectTrace = trace({
      modeTransitions: [{
        from_status: 'exploration_offered',
        to_status: 'ended_with_uncertainty',
        from_mode: 'quick_clarification',
        to_mode: 'quick_clarification',
        reason: 'user_rejected_guided_exploration',
        trigger: 'user_choice',
        budget_before: 0,
        budget_after: 0,
      }],
      status: 'ended_with_uncertainty',
      stopReason: 'user_rejected_guided_exploration',
    });
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: rejectTrace });

    expect(checks.find((check) => check.check_id === 'HC-14')?.status).toBe('PASS');
  });

  it('detects silent guided exploration', () => {
    const silentGuided = trace({
      modeTransitions: [{
        from_status: 'in_progress',
        to_status: 'guided_exploration',
        from_mode: 'quick_clarification',
        to_mode: 'guided_exploration',
        reason: 'questions_emitted',
        trigger: 'agent_output',
        budget_before: 0,
        budget_after: 3,
      }],
      explorationRounds: 1,
    });
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: silentGuided });

    expect(checks.find((check) => check.check_id === 'HC-14')?.status).toBe('FAIL');
  });

  it('detects missing exploration checkpoint', () => {
    const missingCheckpoint = trace({
      modeTransitions: [{
        from_status: 'exploration_offered',
        to_status: 'guided_exploration',
        from_mode: 'quick_clarification',
        to_mode: 'guided_exploration',
        reason: 'user_accepted_guided_exploration',
        trigger: 'user_choice',
        budget_before: 0,
        budget_after: 3,
      }],
      explorationRounds: 1,
      stopReason: null,
      status: 'guided_exploration',
    });
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: missingCheckpoint });

    expect(checks.find((check) => check.check_id === 'HC-15')?.status).toBe('FAIL');
  });

  it('maps safety guard to F-SESSION_LOOP without requiring abandoned', () => {
    const guarded = trace({
      executionGuardTriggered: true,
      executionGuardReason: 'max_total_user_turns',
      status: 'in_progress',
    });
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: guarded });

    expect(checks.find((check) => check.check_id === 'HC-SESSION-LOOP')?.failure_code).toBe('F-SESSION_LOOP');
    expect(guarded.clarification_status).not.toBe('abandoned');
  });

  it('returns F-SCHEMA for invalid trace', () => {
    const evaluated = evaluateSessionV2({ fixture: multiFixture(), execution: { case_id: 'bad' } });

    expect(evaluated.contract_result).toBe('FAIL');
    expect(evaluated.failure_codes).toContain('F-SCHEMA');
  });

  it('detects fixture-declared hallucination expectations without semantic guessing', () => {
    const fixture = singleFixture({
      context_expectations: {
        must_not_invent: ['baseline'],
      },
    });
    const checks = evaluateHardChecksV2({
      fixture,
      trace: trace({ extractedContext: { baseline: '10 dias' } }),
    });

    expect(checks.find((check) => check.check_id === 'HC-HALLUCINATION')?.status).toBe('FAIL');
  });

  it('evaluates structured Step leakage and capability overclaim while leaving ambiguous text not evaluable', () => {
    const source = {
      ...trace(),
      turns: [{
        ...trace().turns[0],
        analysis: {
          ...trace().turns[0].analysis,
          step_activation: { step: 'STEP_0' },
          capability_overclaim: ['produces external evidence'],
        },
      }],
    };
    const checks = evaluateHardChecksV2({ fixture: multiFixture(), trace: source });

    expect(checks.find((check) => check.check_id === 'HC-17')?.status).toBe('FAIL');
    expect(checks.find((check) => check.check_id === 'HC-16')?.status).toBe('FAIL');
    expect(checks.find((check) => check.check_id === 'HC-SEM-STEP-LEAKAGE')?.status).toBe('NOT_EVALUABLE');
  });

  it('does not mutate SessionTrace during evaluation', () => {
    const raw = trace();
    const before = JSON.stringify(raw);
    evaluateSessionV2({ fixture: multiFixture(), execution: raw });

    expect(JSON.stringify(raw)).toBe(before);
  });

  it('produces an evaluated result that conforms to schema', () => {
    const evaluated = evaluateSessionV2({ fixture: multiFixture(), execution: trace() });

    expect(evaluatedPortfolioEntryResultV2Schema.parse(evaluated).contract_result).toBe('PASS');
  });

  it('does not use an LLM judge or model call in automatic evaluation', () => {
    const result = evaluateSessionV2({ fixture: multiFixture(), execution: trace() });

    expect(result).not.toBeInstanceOf(Promise);
    expect(result.notes).not.toContain('LLM judge');
  });

  it('defines taxonomy status for new v0.2 failure codes', () => {
    expect(FAILURE_TAXONOMY_V2.find((entry) => entry.code === 'F-HANDOFF')?.status).toBe('HANDOFF_REQUIRED');
    expect(FAILURE_TAXONOMY_V2.find((entry) => entry.code === 'F-SESSION_LOOP')?.status).toBe('ACTIVE_AUTOMATIC_PHASE_3');
    expect(FAILURE_TAXONOMY_V2.find((entry) => entry.code === 'F-UX')?.status).toBe('HUMAN_REVIEW_REQUIRED');
  });
});

function multiFixture(overrides: Partial<MultiTurnFixtureV2> = {}): MultiTurnFixtureV2 {
  return multiTurnFixtureV2Schema.parse({
    fixture_version: '0.2',
    case_id: 'PE2-MT-EVAL-01',
    case_type: 'multi_turn',
    name: 'Evaluation multi-turn fixture',
    suite: 'evaluation',
    tags: ['contract'],
    evidence_role: 'contract',
    initial_user_message: 'Necesitamos ordenar una iniciativa.',
    session: {
      initial_mode: 'quick_clarification',
      quick_question_budget: 3,
      exploration_policy: 'not_expected',
    },
    response_rules: [],
    expected_session: {},
    ...overrides,
  });
}

function singleFixture(overrides: Partial<SingleTurnFixtureV2> = {}): SingleTurnFixtureV2 {
  return singleTurnFixtureV2Schema.parse({
    fixture_version: '0.2',
    case_id: 'PE2-ST-EVAL-01',
    case_type: 'single_turn',
    name: 'Evaluation single-turn fixture',
    suite: 'evaluation',
    tags: ['contract'],
    evidence_role: 'contract',
    input: 'Necesitamos ordenar una iniciativa.',
    expected: {},
    ...overrides,
  });
}

function trace(overrides: {
  initialStates?: SessionTurnTrace['initial_entry_state'][];
  frames?: SessionTurnTrace['current_frame'][];
  modeTransitions?: SessionTrace['mode_transitions'];
  explorationRounds?: number;
  executionGuardTriggered?: boolean;
  executionGuardReason?: SessionTrace['execution_guard_reason'];
  extractedContext?: Record<string, unknown>;
  stopReason?: string | null;
  status?: SessionTrace['clarification_status'];
} = {}): SessionTrace {
  const initialStates = overrides.initialStates ?? ['problem_first', 'problem_first'];
  const frames = overrides.frames ?? ['problem_first', 'problem_first'];
  const turns = initialStates.map((initialState, index): SessionTurnTrace => ({
    turn_index: index + 1,
    user_input: index === 0 ? 'Input inicial' : 'Respuesta scripted',
    analysis: {
      entry_id: `entry-${index + 1}`,
      analysis_version: 'test-v0.2',
      primary_intent: 'initiative_governance',
      secondary_intents: [],
      initial_entry_state: initialState,
      current_frame: frames[index] ?? frames.at(-1) ?? 'problem_first',
      extracted_context: index === initialStates.length - 1 ? overrides.extractedContext ?? {} : {},
      ambiguities: [],
      contradictions: [],
      reverse_alignment: {
        required: false,
        status: 'not_required',
      },
      provenance: [],
      status: 'ready',
    },
    initial_entry_state: initialState,
    current_frame: frames[index] ?? frames.at(-1) ?? 'problem_first',
    intent: {
      primary_intent: 'initiative_governance',
      secondary_intents: [],
    },
    reverse_alignment: {
      required: false,
      status: 'not_required',
    },
    question_plan: {
      questions: [],
      question_count: 0,
      status: 'no_questions_required',
      stop_reason: 'sufficient_context',
    },
    interaction_mode: 'quick_clarification',
    available_question_budget: 3,
    received_question_count: 0,
    emitted_question_count: 0,
    questions_asked: [],
    budget_overflow: false,
    transition: {
      from_status: index === 0 ? 'not_started' : 'in_progress',
      to_status: 'ready_for_handoff',
      from_mode: 'quick_clarification',
      to_mode: 'quick_clarification',
      reason: 'sufficient_context',
      trigger: 'agent_output',
      budget_before: 3,
      budget_after: 3,
    },
  }));

  return {
    case_id: 'PE2-MT-EVAL-01',
    run_id: 'run-eval',
    candidate_id: 'candidate-eval',
    turns,
    questions_total: 0,
    quick_questions_total: 0,
    exploration_rounds: overrides.explorationRounds ?? 0,
    mode_transitions: overrides.modeTransitions ?? [],
    stop_reason: overrides.stopReason === undefined ? 'sufficient_context' : overrides.stopReason,
    clarification_status: overrides.status ?? 'ready_for_handoff',
    execution_guard_triggered: overrides.executionGuardTriggered ?? false,
    execution_guard_reason: overrides.executionGuardReason,
  };
}

function overflowTrace(): SessionTrace {
  const base = trace({ initialStates: ['problem_first'], frames: ['problem_first'] });
  return {
    ...base,
    questions_total: 1,
    quick_questions_total: 1,
    turns: [{
      ...base.turns[0],
      available_question_budget: 1,
      received_question_count: 2,
      emitted_question_count: 1,
      budget_overflow: true,
      question_plan: {
        status: 'questions_required',
        question_count: 2,
        questions: [
          {
            id: 'q1',
            question: 'Pregunta 1',
            question_type: 'clarification',
            reason_to_ask: 'Aclarar decision',
            resolves: ['decision_to_enable'],
            priority: 1,
            expected_answer_type: 'free_text',
          },
          {
            id: 'q2',
            question: 'Pregunta 2',
            question_type: 'clarification',
            reason_to_ask: 'Aclarar evidencia',
            resolves: ['evidence_needed'],
            priority: 2,
            expected_answer_type: 'free_text',
          },
        ],
      },
      questions_asked: [{
        id: 'q1',
        question: 'Pregunta 1',
        question_type: 'clarification',
        resolves: ['decision_to_enable'],
        turn_index: 1,
        interaction_mode: 'quick_clarification',
        asked_at_budget_remaining: 1,
      }],
    }],
  };
}
