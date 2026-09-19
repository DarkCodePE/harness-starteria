import { describe, expect, it } from 'vitest';
import type { PortfolioEntryAgentAdapterV2, PortfolioEntryAnalyzeTurnInputV2, PortfolioEntryAnalyzeTurnOutputV2 } from '../agent/portfolio-entry-agent-adapter';
import { createInitialSessionContext, type SessionContext } from '../domain/session.types';
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

  it('reaches handoff readiness only from an explicit sufficient-context signal', async () => {
    const adapter = new ScriptedAdapter([sufficient]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-2', candidateId: 'test' }).execute({
      caseId: 'case-2',
      runId: 'run-2',
      candidateId: 'test',
      initialUserInput: 'Tenemos 18 iniciativas comerciales y una decisión de seguimiento pendiente.',
      initialContext: context(),
    });

    expect(result.final_context.clarification_status).toBe('ready_for_handoff');
    expect(result.stop_reason).toBe('sufficient_context');
  });

  it('does not treat an unqualified no-questions status as sufficient context', async () => {
    const adapter = new ScriptedAdapter([output({ questions: [], question_count: 0, status: 'no_questions_required' })]);
    const result = await new PortfolioEntrySessionController(adapter, { runId: 'run-unqualified', candidateId: 'test' }).execute({
      caseId: 'case-unqualified',
      runId: 'run-unqualified',
      candidateId: 'test',
      initialUserInput: 'El contexto todavía necesita una lectura más específica.',
      initialContext: context(),
    });

    expect(result.final_context.clarification_status).toBe('in_progress');
    expect(result.completed).toBe(false);
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
});
