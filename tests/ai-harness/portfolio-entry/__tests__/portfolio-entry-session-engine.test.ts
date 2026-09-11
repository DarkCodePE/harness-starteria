import { describe, expect, it } from 'vitest';
import type { PortfolioEntryAgentAdapterV2, PortfolioEntryAnalyzeTurnOutputV2 } from '../agent/portfolio-entry-agent-adapter-v0.2';
import { DeterministicSessionAdapter } from '../agent/deterministic-session-adapter';
import { questionPlanV2Schema, type PortfolioEntryAnalysisV2, type QuestionPlanV2 } from '../schemas/analysis.schema';
import { multiTurnFixtureV2Schema, type MultiTurnFixtureV2 } from '../schemas/session-fixture.schema';
import { sessionTraceSchema } from '../schemas/session-trace.schema';
import { applyQuestionBudget, consumeQuestionBudget, getAvailableQuestionBudget } from '../session/question-budget';
import { executePortfolioEntrySession } from '../session/session-executor';
import { createInitialSessionContext, type SessionContext } from '../session/session-types';
import { createScriptedResponderState, respondToQuestions } from '../session/scripted-user-responder';

describe('portfolio entry session engine', () => {
  it('starts quick clarification with a total budget of 3', () => {
    const context = createInitialSessionContext(makeFixture().session);

    expect(context.interaction_mode).toBe('quick_clarification');
    expect(context.quick_question_budget).toBe(3);
    expect(context.quick_questions_asked).toBe(0);
    expect(getAvailableQuestionBudget(context)).toBe(3);
  });

  it('accepts zero questions as a valid ready state', async () => {
    const result = await executePortfolioEntrySession(makeFixture(), {
      runId: 'session-test',
      adapter: sequenceAdapter([turnOutput(noQuestions())]),
    });

    expect(result.completed).toBe(true);
    expect(result.trace.questions_total).toBe(0);
    expect(result.trace.clarification_status).toBe('ready_for_handoff');
    expect(sessionTraceSchema.parse(result.trace).case_id).toBe('PE2-MT-SESSION-01');
  });

  it('consumes a 2-3 question plan according to emitted questions', () => {
    const context = createInitialSessionContext(makeFixture().session);
    const twoQuestions = applyQuestionBudget(context, questions(['decision_to_enable', 'success_conditions']), 1);
    const afterTwo = consumeQuestionBudget(context, twoQuestions.emitted_question_count);
    const oneQuestion = applyQuestionBudget(afterTwo, questions(['operating_context']), 2);
    const afterThree = consumeQuestionBudget(afterTwo, oneQuestion.emitted_question_count);

    expect(twoQuestions.emitted_question_count).toBe(2);
    expect(getAvailableQuestionBudget(afterTwo)).toBe(1);
    expect(oneQuestion.emitted_question_count).toBe(1);
    expect(getAvailableQuestionBudget(afterThree)).toBe(0);
  });

  it('does not emit a fourth quick clarification question', async () => {
    const result = await executePortfolioEntrySession(makeFixture(), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable', 'success_conditions', 'operating_context'])),
        turnOutput(questions(['evidence_needed'])),
      ]),
    });

    expect(result.trace.quick_questions_total).toBe(3);
    expect(result.trace.turns[1].available_question_budget).toBe(0);
    expect(result.trace.turns[1].emitted_question_count).toBe(0);
    expect(result.trace.clarification_status).toBe('ended_with_uncertainty');
  });

  it('preserves original question plan when budget overflow occurs', async () => {
    const result = await executePortfolioEntrySession(makeFixture(), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable', 'success_conditions'])),
        turnOutput(questions(['operating_context', 'evidence_needed'])),
        turnOutput(noQuestions()),
      ]),
    });

    const overflowTurn = result.trace.turns[1];
    expect(overflowTurn.available_question_budget).toBe(1);
    expect(overflowTurn.received_question_count).toBe(2);
    expect(overflowTurn.emitted_question_count).toBe(1);
    expect(overflowTurn.question_plan.questions).toHaveLength(2);
    expect(overflowTurn.budget_overflow).toBe(true);
    expect(result.violations).toContain('question_budget_overflow');
  });

  it('requires accept before guided exploration starts', async () => {
    const accepting = await executePortfolioEntrySession(makeFixture({ exploration_policy: 'accept_if_offered' }), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable', 'success_conditions', 'operating_context'])),
        turnOutput(questions(['evidence_needed'])),
        turnOutput(noQuestions('exploration_goal_satisfied')),
      ]),
    });
    const rejecting = await executePortfolioEntrySession(makeFixture({ exploration_policy: 'reject_if_offered' }), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable', 'success_conditions', 'operating_context'])),
        turnOutput(questions(['evidence_needed'])),
      ]),
    });

    expect(accepting.trace.mode_transitions.some((transition) => transition.to_mode === 'guided_exploration')).toBe(true);
    expect(accepting.trace.exploration_rounds).toBe(1);
    expect(rejecting.trace.mode_transitions.some((transition) => transition.to_mode === 'guided_exploration')).toBe(false);
    expect(rejecting.trace.clarification_status).toBe('ended_with_uncertainty');
  });

  it('starts a guided exploration round with local budget and reaches checkpoint', async () => {
    const result = await executePortfolioEntrySession(makeFixture({ exploration_policy: 'accept_if_offered' }), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable', 'success_conditions', 'operating_context'])),
        turnOutput(questions(['evidence_needed'])),
        turnOutput(questions(['quality_guardrails', 'provenance'])),
      ]),
    });

    const guidedTurn = result.trace.turns.find((turn) => turn.interaction_mode === 'guided_exploration');
    expect(guidedTurn?.available_question_budget).toBe(3);
    expect(guidedTurn?.emitted_question_count).toBe(2);
    expect(result.trace.clarification_status).toBe('ended_with_uncertainty');
    expect(result.trace.stop_reason).toBe('checkpoint_reached');
  });

  it('does not treat scripted responses as resolved gaps', async () => {
    const result = await executePortfolioEntrySession(makeFixture(), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable'])),
        turnOutput(noQuestions()),
      ]),
    });

    expect(result.trace.turns[0].scripted_response_result?.responded_resolves).toEqual(['decision_to_enable']);
    expect(result.final_context.answered_gaps).toEqual([]);
  });

  it('uses resolves for scripted responses, respects once, and records unmatched questions', () => {
    const state = createScriptedResponderState();
    const context = createInitialSessionContext(makeFixture().session);
    const budget = applyQuestionBudget(context, questions(['decision_to_enable', 'unknown_gap']), 1);
    const first = respondToQuestions(budget.emitted_questions, [
      { id: 'decision', when_resolves_any: ['decision_to_enable'], response: 'Queremos decidir si vale la pena continuar.', once: true },
    ], state);
    const second = respondToQuestions([budget.emitted_questions[0]], [
      { id: 'decision', when_resolves_any: ['decision_to_enable'], response: 'Queremos decidir si vale la pena continuar.', once: true },
    ], state);

    expect(first.response_rule_ids_used).toEqual(['decision']);
    expect(first.matched_question_ids).toEqual(['q1']);
    expect(first.unmatched_questions.map((question) => question.id)).toEqual(['q2']);
    expect(second.response).toBeNull();
    expect(second.unmatched_questions.map((question) => question.id)).toEqual(['q1']);
  });

  it('stops on safety guard without marking the session abandoned', async () => {
    const result = await executePortfolioEntrySession(makeFixture({ exploration_policy: 'accept_if_offered' }), {
      runId: 'session-test',
      adapter: repeatingAdapter(turnOutput(questions(['decision_to_enable', 'success_conditions', 'operating_context']))),
      safetyLimits: { MAX_TOTAL_USER_TURNS: 1 },
    });

    expect(result.trace.execution_guard_triggered).toBe(true);
    expect(result.trace.execution_guard_reason).toBeDefined();
    expect(result.trace.clarification_status).not.toBe('abandoned');
  });

  it('bases transitions on structured adapter output instead of raw input semantics', async () => {
    const fixture = makeFixture({ initial_user_message: 'Quiero innovar con esto.' });
    const ready = await executePortfolioEntrySession(fixture, {
      runId: 'session-test',
      adapter: sequenceAdapter([turnOutput(noQuestions())]),
    });
    const needsQuestions = await executePortfolioEntrySession(fixture, {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable', 'success_conditions', 'operating_context'])),
        turnOutput(questions(['evidence_needed'])),
      ]),
    });

    expect(ready.trace.clarification_status).toBe('ready_for_handoff');
    expect(needsQuestions.trace.clarification_status).toBe('ended_with_uncertainty');
    expect(ready.trace.turns[0].user_input).toBe(needsQuestions.trace.turns[0].user_input);
  });

  it('preserves late frame evolution and stable initial entry state in trace', async () => {
    const result = await executePortfolioEntrySession(makeFixture(), {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable']), { initial_entry_state: 'problem_first', current_frame: 'problem_first' }),
        turnOutput(noQuestions(), { initial_entry_state: 'problem_first', current_frame: 'initiative_first' }),
      ]),
    });

    expect(result.trace.turns.map((turn) => turn.initial_entry_state)).toEqual(['problem_first', 'problem_first']);
    expect(result.trace.turns.map((turn) => turn.current_frame)).toEqual(['problem_first', 'initiative_first']);
  });

  it('flags interactive multi-turn fixtures that stop before applicable scripted reanalysis', async () => {
    const fixture = makeFixture({
      response_rules: [
        { id: 'decision', when_resolves_any: ['decision_to_enable'], response: 'Queremos decidir que iniciativas continÃºan.', once: true },
      ],
      expected_session: {
        initial_entry_state: ['initiative_first'],
        max_quick_questions: 3,
        min_analysis_turns: 2,
        requires_scripted_reanalysis: true,
      },
    });
    const result = await executePortfolioEntrySession(fixture, {
      runId: 'session-test',
      adapter: sequenceAdapter([
        turnOutput(questions(['decision_to_enable'], 'step_boundary')),
        turnOutput(noQuestions()),
      ]),
    });

    expect(result.trace.turns).toHaveLength(1);
    expect(result.trace.turns[0].scripted_response_result).toBeUndefined();
    expect(findInteractiveExpectationFailures(fixture, result.trace)).toEqual([
      'expected at least 2 analysis turns, got 1',
      'expected scripted reanalysis after applicable questions, got none',
    ]);
  });

  it('runs a deterministic session adapter smoke without changing baseline heuristics', async () => {
    const result = await executePortfolioEntrySession(makeFixture({
      initial_user_message: 'Necesito ordenar esto.',
      response_rules: [{ id: 'subject', when_resolves_any: ['ambiguity'], response: 'Quiero ordenar una iniciativa llamada Atlas.' }],
    }), {
      runId: 'session-test',
      adapter: new DeterministicSessionAdapter(),
    });

    expect(result.trace.turns.length).toBeGreaterThan(0);
    expect(sessionTraceSchema.parse(result.trace).candidate_id).toContain('deterministic');
  });
});

function makeFixture(overrides: Partial<MultiTurnFixtureV2> & {
  exploration_policy?: MultiTurnFixtureV2['session']['exploration_policy'];
  initial_user_message?: string;
  response_rules?: MultiTurnFixtureV2['response_rules'];
} = {}): MultiTurnFixtureV2 {
  return multiTurnFixtureV2Schema.parse({
    fixture_version: '0.2',
    case_id: 'PE2-MT-SESSION-01',
    case_type: 'multi_turn',
    name: 'Session engine fixture',
    suite: 'session-engine',
    tags: ['multi-turn', 'session'],
    evidence_role: 'contract',
    initial_user_message: overrides.initial_user_message ?? 'Necesitamos ordenar una iniciativa nueva.',
    session: {
      initial_mode: 'quick_clarification',
      quick_question_budget: 3,
      exploration_policy: overrides.exploration_policy ?? 'reject_if_offered',
    },
    response_rules: overrides.response_rules ?? [
      { id: 'decision', when_resolves_any: ['decision_to_enable'], response: 'Queremos decidir si conviene continuar.', once: true },
      { id: 'success', when_resolves_any: ['success_conditions'], response: 'Exito seria reducir tiempos de aprobacion.' },
      { id: 'operating', when_resolves_any: ['operating_context'], response: 'El equipo de operaciones lo usaria este trimestre.' },
      { id: 'evidence', when_resolves_any: ['evidence_needed'], response: 'Tenemos datos historicos, pero falta revisarlos.' },
      { id: 'guardrails', when_resolves_any: ['quality_guardrails'], response: 'No queremos inventar metricas.' },
      { id: 'provenance', when_resolves_any: ['provenance'], response: 'Eso viene de entrevistas internas.' },
    ],
    expected_session: {
      initial_entry_state: ['initiative_first'],
      max_quick_questions: 3,
    },
    ...overrides,
  });
}

function sequenceAdapter(outputs: PortfolioEntryAnalyzeTurnOutputV2[]): PortfolioEntryAgentAdapterV2 {
  let index = 0;
  return {
    async analyzeTurn() {
      return outputs[Math.min(index++, outputs.length - 1)];
    },
  };
}

function repeatingAdapter(output: PortfolioEntryAnalyzeTurnOutputV2): PortfolioEntryAgentAdapterV2 {
  return {
    async analyzeTurn() {
      return output;
    },
  };
}

function turnOutput(
  questionPlan: QuestionPlanV2,
  state: Partial<Pick<PortfolioEntryAnalysisV2, 'initial_entry_state' | 'current_frame' | 'status'>> = {},
): PortfolioEntryAnalyzeTurnOutputV2 {
  return {
    analysis: {
      entry_id: 'entry-test',
      analysis_version: 'test-v0.2',
      primary_intent: 'initiative_governance',
      secondary_intents: [],
      initial_entry_state: state.initial_entry_state ?? 'initiative_first',
      current_frame: state.current_frame ?? 'initiative_first',
      extracted_context: {},
      ambiguities: [],
      contradictions: [],
      reverse_alignment: {
        required: false,
        status: 'not_required',
      },
      provenance: [],
      status: state.status ?? (questionPlan.status === 'questions_required' ? 'pending' : 'ready'),
    },
    question_plan: questionPlan,
  };
}

function noQuestions(stopReason: QuestionPlanV2['stop_reason'] = 'sufficient_context'): QuestionPlanV2 {
  return questionPlanV2Schema.parse({
    questions: [],
    question_count: 0,
    status: 'no_questions_required',
    stop_reason: stopReason,
  });
}

function questions(resolves: string[], stopReason?: QuestionPlanV2['stop_reason']): QuestionPlanV2 {
  return questionPlanV2Schema.parse({
    questions: resolves.map((resolve, index) => ({
      id: `q${index + 1}`,
      question: `Pregunta ${index + 1}`,
      question_type: 'clarification',
      reason_to_ask: `Aclarar ${resolve}`,
      resolves: [resolve],
      priority: Math.min(index + 1, 3),
      expected_answer_type: 'free_text',
    })),
    question_count: resolves.length,
    status: 'questions_required',
    stop_reason: stopReason,
  });
}

function findInteractiveExpectationFailures(fixture: MultiTurnFixtureV2, trace: { turns: Array<{ questions_asked: Array<{ resolves: string[] }>; scripted_response_result?: { response: string | null } }> }): string[] {
  const failures: string[] = [];
  const minTurns = fixture.expected_session.min_analysis_turns;
  if (minTurns !== undefined && trace.turns.length < minTurns) {
    failures.push(`expected at least ${minTurns} analysis turns, got ${trace.turns.length}`);
  }
  if (fixture.expected_session.requires_scripted_reanalysis) {
    const hasApplicableQuestion = trace.turns.some((turn) => turn.questions_asked.some((question) => question.resolves.some((resolve) => fixture.response_rules.some((rule) => rule.when_resolves_any.includes(resolve) || rule.when_resolves_any.includes('*')))));
    const hasScriptedResponse = trace.turns.some((turn) => Boolean(turn.scripted_response_result?.response));
    if (hasApplicableQuestion && !hasScriptedResponse) {
      failures.push('expected scripted reanalysis after applicable questions, got none');
    }
  }
  return failures;
}
