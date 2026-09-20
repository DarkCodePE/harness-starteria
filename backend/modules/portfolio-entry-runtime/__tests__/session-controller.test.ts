import { describe, expect, it } from 'vitest';
import type { PortfolioEntryAgentAdapterV2, PortfolioEntryAnalyzeTurnInputV2, PortfolioEntryAnalyzeTurnOutputV2 } from '../agent/portfolio-entry-agent-adapter';
import { createInitialSessionContext, type SessionContext } from '../domain/session.types';
import { applyAnswerResolution } from '../session/single-turn-result';
import { PortfolioEntrySessionController } from '../session/session-controller';

class ScriptedAdapter implements PortfolioEntryAgentAdapterV2 {
  calls: PortfolioEntryAnalyzeTurnInputV2[] = [];

  constructor(private readonly outputs: PortfolioEntryAnalyzeTurnOutputV2[]) {}

  async analyzeTurn(input: PortfolioEntryAnalyzeTurnInputV2): Promise<PortfolioEntryAnalyzeTurnOutputV2> {
    this.calls.push(input);
    return this.outputs[Math.min(this.calls.length - 1, this.outputs.length - 1)];
  }
}

function context(overrides: Partial<SessionContext> = {}): SessionContext {
  return { ...createInitialSessionContext({ initial_mode: 'quick_clarification', quick_question_budget: 3 }), ...overrides };
}

function output(questionPlan: PortfolioEntryAnalyzeTurnOutputV2['question_plan']): PortfolioEntryAnalyzeTurnOutputV2 {
  return {
    analysis: {
      entry_id: 'entry-1',
      analysis_version: 'test',
      primary_intent: 'portfolio_governance',
      secondary_intents: [],
      initial_entry_state: 'portfolio_first',
      current_frame: 'portfolio_first',
      extracted_context: {
        summary: 'Tenemos 18 iniciativas comerciales y necesitamos decidir dónde concentrar seguimiento.',
        decision_need: 'concentrar seguimiento',
      },
      ambiguities: [],
      contradictions: [],
      reverse_alignment: { required: false, connection_state: 'not_required' },
      provenance: [],
      status: questionPlan.status === 'no_questions_required' ? 'ready' : 'pending',
    },
    question_plan: questionPlan,
  };
}

const sufficient = output({
  questions: [],
  question_count: 0,
  status: 'no_questions_required',
  stop_reason: 'sufficient_context',
});

const materialQuestion = output({
  questions: [{
    id: 'decision-gap',
    question: '¿Qué decisión necesita habilitar esta lectura?',
    reason_to_ask: 'Puede cambiar el enfoque recomendado.',
    resolves: ['decision_to_enable'],
    priority: 1,
    expected_answer_type: 'decision',
  }],
  question_count: 1,
  status: 'questions_required',
});

const batchedQuestions = output({
  questions: [
    { id: 'q1', question: 'Primera pregunta material', reason_to_ask: 'r', resolves: ['gap-1'], priority: 1, expected_answer_type: 'text' },
    { id: 'q2', question: 'Segunda pregunta material', reason_to_ask: 'r', resolves: ['gap-2'], priority: 2, expected_answer_type: 'text' },
    { id: 'q3', question: 'Tercera pregunta material', reason_to_ask: 'r', resolves: ['gap-3'], priority: 3, expected_answer_type: 'text' },
  ],
  question_count: 3,
  status: 'questions_required',
});

describe('Portfolio Entry session controller', () => {
  it('keeps clarification open when the planner requires a material question', async () => {
    const adapter = new ScriptedAdapter([materialQuestion]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-1', candidateId: 'test' }).execute({
      caseId: 'case-1',
      runId: 'run-1',
      candidateId: 'test',
      initialUserInput: 'Tenemos iniciativas y necesitamos ordenar la atención.',
      initialContext: context(),
    });

    expect(result.final_context.clarification_status).toBe('in_progress');
    expect(result.trace.questions_total).toBe(1);
    expect(result.completed).toBe(false);
  });

  it('offers an explicit checkpoint after sufficient context', async () => {
    const adapter = new ScriptedAdapter([sufficient]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-2', candidateId: 'test' }).execute({
      caseId: 'case-2',
      runId: 'run-2',
      candidateId: 'test',
      initialUserInput: 'Tenemos 18 iniciativas comerciales y una decisión de seguimiento pendiente.',
      initialContext: context(),
    });

    expect(result.final_context.clarification_status).toBe('exploration_offered');
    expect(result.final_context.stop_reason).toBeNull();
    expect(result.completed).toBe(false);
  });

  it('moves from the sufficient-context checkpoint to a provisional handoff', async () => {
    const adapter = new ScriptedAdapter([sufficient]);
    const offered = await new PortfolioEntrySessionController(adapter, { runId: 'run-2a', candidateId: 'test' }).execute({
      caseId: 'case-2a',
      runId: 'run-2a',
      candidateId: 'test',
      initialUserInput: 'Tenemos 18 iniciativas comerciales y una decisión de seguimiento pendiente.',
      initialContext: context(),
    });
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-2a', candidateId: 'test' }).execute({
      caseId: 'case-2a',
      runId: 'run-2a',
      candidateId: 'test',
      initialUserInput: '',
      initialContext: offered.final_context,
      guidedExplorationChoice: 'provisional_route',
    });

    expect(result.final_context.clarification_status).toBe('ready_for_handoff');
    expect(result.final_context.user_exploration_choice).toBe('provisional_route');
    expect(result.stop_reason).toBe('user_chose_provisional_route');
  });

  it('moves from the sufficient-context checkpoint to guided exploration on accept', async () => {
    const adapter = new ScriptedAdapter([sufficient, materialQuestion]);
    const offered = await new PortfolioEntrySessionController(adapter, { runId: 'run-2b', candidateId: 'test' }).execute({
      caseId: 'case-2b',
      runId: 'run-2b',
      candidateId: 'test',
      initialUserInput: 'Tenemos 18 iniciativas comerciales y una decisión de seguimiento pendiente.',
      initialContext: context(),
    });
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-2b', candidateId: 'test' }).execute({
      caseId: 'case-2b',
      runId: 'run-2b',
      candidateId: 'test',
      initialUserInput: '',
      initialContext: offered.final_context,
      guidedExplorationChoice: 'accept',
    });

    expect(result.final_context.clarification_status).toBe('guided_exploration');
    expect(result.final_context.interaction_mode).toBe('guided_exploration');
    expect(result.final_context.exploration_round).toBe(1);
  });

  it('converges an unqualified no-questions status to the exploration checkpoint', async () => {
    const adapter = new ScriptedAdapter([output({ questions: [], question_count: 0, status: 'no_questions_required' })]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-unqualified', candidateId: 'test' }).execute({
      caseId: 'case-unqualified',
      runId: 'run-unqualified',
      candidateId: 'test',
      initialUserInput: 'El contexto todavía necesita una lectura más específica.',
      initialContext: context(),
    });

    expect(result.final_context.clarification_status).toBe('exploration_offered');
    expect(result.trace.turns[0]?.transition.reason).toBe('no_new_material_question');
    expect(result.completed).toBe(false);
  });

  it('converges after the third answered question without emitting a fourth', async () => {
    const adapter = new ScriptedAdapter([
      output({ ...materialQuestion.question_plan, questions: [{ ...materialQuestion.question_plan.questions[0], id: 'q1', resolves: ['gap-1'] }] }),
      output({ ...materialQuestion.question_plan, questions: [{ ...materialQuestion.question_plan.questions[0], id: 'q2', resolves: ['gap-2'] }] }),
      output({ ...materialQuestion.question_plan, questions: [{ ...materialQuestion.question_plan.questions[0], id: 'q3', resolves: ['gap-3'] }] }),
    ]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-third', candidateId: 'test' }).execute({
      caseId: 'case-third',
      runId: 'run-third',
      candidateId: 'test',
      initialUserInput: 'Tenemos un portafolio amplio y debemos decidir dónde concentrar esfuerzo.',
      initialContext: context({
        quick_questions_asked: 2,
        previous_questions: [
          { id: 'q0', question: 'Primera pregunta', resolves: ['gap-0'], turn_index: 1, interaction_mode: 'quick_clarification', asked_at_budget_remaining: 3 },
          { id: 'q-before', question: 'Segunda pregunta', resolves: ['gap-before'], turn_index: 2, interaction_mode: 'quick_clarification', asked_at_budget_remaining: 2 },
        ],
      }),
      followUpResponder: (questions) => ({
        response: 'La decisión es priorizar las iniciativas que presentaremos al comité.',
        matched_question_ids: [questions[0].id],
        response_rule_ids_used: [],
        responded_resolves: questions[0].resolves,
        unmatched_questions: [],
        fallback_used: false,
        consumed_once_rule_ids: [],
      }),
    });

    expect(result.final_context.quick_questions_asked).toBe(3);
    expect(result.trace.questions_total).toBe(1);
    expect(result.trace.turns.at(-1)?.questions_asked).toEqual([]);
    expect(result.final_context.clarification_status).toBe('exploration_offered');
  });

  it('keeps Guided Exploration opt-in and starts a new exploration round on accept', async () => {
    const adapter = new ScriptedAdapter([materialQuestion]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-3', candidateId: 'test' }).execute({
      caseId: 'case-3',
      runId: 'run-3',
      candidateId: 'test',
      initialUserInput: '',
      initialContext: context({ clarification_status: 'exploration_offered' }),
      guidedExplorationChoice: 'accept',
    });

    expect(result.final_context.clarification_status).toBe('guided_exploration');
    expect(result.final_context.interaction_mode).toBe('guided_exploration');
    expect(result.final_context.exploration_round).toBe(1);
  });

  it('turns the provisional-route choice into a handoff-ready checkpoint without inventing a decision', async () => {
    const adapter = new ScriptedAdapter([]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-4', candidateId: 'test' }).execute({
      caseId: 'case-4',
      runId: 'run-4',
      candidateId: 'test',
      initialUserInput: '',
      initialContext: context({ clarification_status: 'exploration_offered' }),
      guidedExplorationChoice: 'provisional_route',
    });

    expect(result.final_context.clarification_status).toBe('ready_for_handoff');
    expect(result.final_context.user_exploration_choice).toBe('provisional_route');
    expect(adapter.calls).toHaveLength(0);
  });

  it('does not emit a fourth question when the quick budget is exhausted', async () => {
    const adapter = new ScriptedAdapter([materialQuestion]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-5', candidateId: 'test' }).execute({
      caseId: 'case-5',
      runId: 'run-5',
      candidateId: 'test',
      initialUserInput: 'Todavía falta una aclaración material.',
      initialContext: context({ quick_questions_asked: 3 }),
    });

    expect(result.trace.questions_total).toBe(0);
    expect(result.final_context.clarification_status).toBe('exploration_offered');
  });

  it('does not repeat a question after an unusable answer', async () => {
    const adapter = new ScriptedAdapter([materialQuestion]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-6', candidateId: 'test' }).execute({
      caseId: 'case-6',
      runId: 'run-6',
      candidateId: 'test',
      initialUserInput: 'No lo sé todavía.',
      initialContext: context({
        previous_questions: [{
          id: 'decision-gap',
          question: '¿Qué decisión necesita habilitar esta lectura?',
          resolves: ['decision_to_enable'],
          turn_index: 1,
          interaction_mode: 'quick_clarification',
          asked_at_budget_remaining: 3,
        }],
      }),
    });

    expect(result.trace.turns[0]?.questions_asked).toEqual([]);
    expect(result.trace.questions_total).toBe(0);
  });

  it('normalizes a provider batch to one question and consumes one budget slot', async () => {
    const adapter = new ScriptedAdapter([batchedQuestions]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-batch', candidateId: 'test' }).execute({
      caseId: 'case-batch', runId: 'run-batch', candidateId: 'test',
      initialUserInput: 'Hay varios gaps materiales.', initialContext: context(),
    });

    expect(result.trace.turns[0]?.questions_asked).toHaveLength(1);
    expect(result.trace.turns[0]?.questions_asked[0]?.id).toBe('q1');
    expect(result.final_context.quick_questions_asked).toBe(1);
    expect(result.violations).toContain('question_budget_overflow');
  });

  it('answers a question without resolving its gap for an unknown response', async () => {
    const adapter = new ScriptedAdapter([materialQuestion, sufficient]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-unknown', candidateId: 'test' }).execute({
      caseId: 'case-unknown', runId: 'run-unknown', candidateId: 'test',
      initialUserInput: 'Necesito aclarar una decision.', initialContext: context(),
      followUpResponder: (questions) => ({
        response: 'No lo sé todavía.', matched_question_ids: [questions[0].id], response_rule_ids_used: [],
        responded_resolves: questions[0].resolves, unmatched_questions: [], fallback_used: false, consumed_once_rule_ids: [],
      }),
    });

    expect(result.trace.turns[0]?.scripted_response_result?.matched_question_ids).toEqual(['decision-gap']);
    expect(result.trace.turns[0]?.scripted_response_result?.responded_resolves).toEqual([]);
    expect(result.final_context.answered_gaps).toEqual([]);
  });

  it('derives a supported resolution from post-answer structured analysis, not client resolves', () => {
    const question = { id: 'decision-gap', question: '¿Qué decisión?', resolves: ['decision_to_enable'] };
    const answer = applyAnswerResolution(
      context(),
      { ...question, turn_index: 1, interaction_mode: 'quick_clarification', asked_at_budget_remaining: 3 },
      ['decision-gap'],
      'La gerencia debe decidir qué iniciativas financiar primero.',
      output({ questions: [], question_count: 0, status: 'no_questions_required', stop_reason: 'sufficient_context' }).analysis,
    );

    expect(answer.matchedQuestionIds).toEqual(['decision-gap']);
    expect(answer.respondedResolves).toEqual(['decision_to_enable']);
    expect(answer.context.answered_gaps).toEqual(['decision_to_enable']);
  });

  it.each(['No lo sé todavía.', 'Ya te respondí.', 'No entendí.', 'No estoy seguro.', 'Puede ser.'])('keeps low-information answer unresolved: %s', (response) => {
    const question = { id: 'decision-gap', question: '¿Qué decisión?', resolves: ['decision_to_enable'] };
    const answer = applyAnswerResolution(
      context(),
      { ...question, turn_index: 1, interaction_mode: 'quick_clarification', asked_at_budget_remaining: 3 },
      ['decision-gap'],
      response,
      output({ questions: [], question_count: 0, status: 'no_questions_required', stop_reason: 'sufficient_context' }).analysis,
    );

    expect(answer.matchedQuestionIds).toEqual(['decision-gap']);
    expect(answer.respondedResolves).toEqual([]);
    expect(answer.context.answered_gaps).toEqual([]);
  });
});
