import { describe, expect, it } from 'vitest';
import { evaluateHandoffChecksV2 } from '../evaluator/handoff-checks-v0.2';
import { evaluateSessionV2 } from '../evaluator/evaluate-session';
import { buildPortfolioEntryHandoffV2 } from '../handoff/portfolio-entry-handoff-builder';
import { gapResolutionV2Schema } from '../schemas/gap-resolution.schema';
import { portfolioEntryHandoffV2Schema, type PortfolioEntryHandoffV2 } from '../schemas/handoff.schema';
import { multiTurnFixtureV2Schema, type MultiTurnFixtureV2 } from '../schemas/session-fixture.schema';
import type { SessionExecutionResult, SessionTrace, SessionTurnTrace } from '../session/session-types';

describe('portfolio entry handoff v0.2', () => {
  it('accepts a valid handoff', () => {
    const parsed = portfolioEntryHandoffV2Schema.parse(validHandoff());

    expect(parsed.handoff_status).toBe('ready');
  });

  it('accepts ready, ready_with_uncertainty, and insufficient_input statuses', () => {
    expect(portfolioEntryHandoffV2Schema.parse(validHandoff({ handoff_status: 'ready' })).handoff_status).toBe('ready');
    expect(portfolioEntryHandoffV2Schema.parse(validHandoff({
      handoff_status: 'ready_with_uncertainty',
      unresolved_context: [{
        gap_id: 'gap-1',
        description: 'Falta evidencia externa.',
      }],
    })).handoff_status).toBe('ready_with_uncertainty');
    expect(portfolioEntryHandoffV2Schema.parse(validHandoff({ handoff_status: 'insufficient_input' })).handoff_status).toBe('insufficient_input');
  });

  it('requires recommended approach to remain AI_SUGGESTED and UNREVIEWED', () => {
    expect(portfolioEntryHandoffV2Schema.safeParse(rawHandoff({
      recommended_approach: {
        description: 'Estructurar el portfolio antes de priorizar.',
        origin: 'USER_DECLARED',
        review_disposition: 'UNREVIEWED',
      },
    })).success).toBe(false);

    expect(portfolioEntryHandoffV2Schema.safeParse(rawHandoff({
      recommended_approach: {
        description: 'Estructurar el portfolio antes de priorizar.',
        origin: 'AI_SUGGESTED',
        review_disposition: 'USER_CONFIRMED',
      },
    })).success).toBe(false);
  });

  it('requires alternatives to remain AI_SUGGESTED and UNREVIEWED', () => {
    const parsed = portfolioEntryHandoffV2Schema.safeParse(rawHandoff({
      alternative_approaches: [{
        description: 'Comparar las iniciativas existentes antes de crear una nueva.',
        origin: 'AI_SUGGESTED',
        review_disposition: 'USER_CONFIRMED',
      }],
    }));

    expect(parsed.success).toBe(false);
  });

  it('does not allow USER_CONFIRMED to be introduced in handoff provenance', () => {
    const raw = rawHandoff({
      recommended_approach: {
        description: 'Estructurar el portfolio antes de priorizar.',
        origin: 'AI_SUGGESTED',
        review_disposition: 'USER_CONFIRMED',
      },
    });
    const checks = evaluateHandoffChecksV2({ handoff: raw });

    expect(checks.find((check) => check.check_id === 'HC-HANDOFF-SCHEMA')?.failure_code).toBe('F-SCHEMA');
    expect(checks.some((check) => check.status === 'FAIL' && check.failure_code === 'F-HANDOFF')).toBe(false);
  });

  it('validates GapResolution enums', () => {
    expect(gapResolutionV2Schema.parse({
      gap_id: 'gap-1',
      gap_description: 'Falta evidencia externa.',
      resolution_type: 'REQUIRES_EXTERNAL_EVIDENCE',
      resolution_stage: 'EXTERNAL',
    }).resolution_type).toBe('REQUIRES_EXTERNAL_EVIDENCE');

    expect(gapResolutionV2Schema.safeParse({
      gap_id: 'gap-1',
      gap_description: 'Falta evidencia externa.',
      resolution_type: 'STARTERIA_SOLVES_EVIDENCE',
      resolution_stage: 'EXTERNAL',
    }).success).toBe(false);
  });

  it('detects structured external evidence capability overclaim without broad semantic matching', () => {
    const checks = evaluateHandoffChecksV2({
      handoff: validHandoff({
        gap_resolution_map: [{
          gap_id: 'gap-1',
          gap_description: 'Falta feedback real de clientes.',
          resolution_type: 'REQUIRES_EXTERNAL_EVIDENCE',
          starteria_capability: 'produce_customer_feedback',
          resolution_stage: 'EXTERNAL',
        }],
      }),
    });

    expect(checks.find((check) => check.check_id === 'HC-CAPABILITY-OVERCLAIM-HANDOFF')?.failure_code).toBe('F-CAPABILITY_OVERCLAIM');
  });

  it('allows STEP_0...STEP_4 as conceptual resolution stages without Step activation', () => {
    const checks = evaluateHandoffChecksV2({
      handoff: validHandoff({
        gap_resolution_map: [{
          gap_id: 'gap-1',
          gap_description: 'Falta claridad sobre el problema.',
          resolution_type: 'STARTERIA_CAN_STRUCTURE',
          starteria_capability: 'structure',
          resolution_stage: 'STEP_0',
        }],
      }),
    });

    expect(checks.find((check) => check.check_id === 'HC-GAP-MAP')?.status).toBe('PASS');
    expect(checks.find((check) => check.check_id === 'HC-HANDOFF-STEP-ACTIVATION')?.status).toBe('PASS');
  });

  it('does not silently strip forbidden canonical fields from raw handoff candidates', () => {
    const raw = {
      ...validHandoff(),
      Initiative: { id: 'canonical-initiative' },
    };
    const result = buildPortfolioEntryHandoffV2({
      execution: execution(),
      final_analysis: execution().trace.turns[0].analysis,
      candidate_source: raw,
    });
    const checks = evaluateHandoffChecksV2({ handoff: result.raw_candidate });

    expect(result.schema_valid).toBe(false);
    expect(result.handoff).toBeNull();
    expect(checks.find((check) => check.check_id === 'HC-HANDOFF-CANONICALIZATION')?.failure_code).toBe('F-CANONICALIZATION');
  });

  it('preserves existing and desired program/process as distinct structured context', () => {
    const checks = evaluateHandoffChecksV2({
      handoff: validHandoff({
        known_context: [
          {
            key: 'existing_program_or_process',
            value: 'aceleradora interna existente',
            provenance: { origin: 'USER_DECLARED' },
          },
          {
            key: 'desired_program_or_process',
            value: 'modelo de gobernanza de la aceleradora',
            provenance: { origin: 'AI_INFERRED' },
          },
        ],
      }),
    });

    expect(checks.find((check) => check.check_id === 'HC-EXISTING-DESIRED')?.status).toBe('PASS');
  });

  it('detects structured collapse of existing program into desired program', () => {
    const checks = evaluateHandoffChecksV2({
      handoff: validHandoff({
        known_context: [
          { key: 'existing_program_or_process', value: 'aceleradora interna' },
          { key: 'desired_program_or_process', value: 'aceleradora interna' },
        ],
      }),
    });

    expect(checks.find((check) => check.check_id === 'HC-EXISTING-DESIRED')?.failure_code).toBe('F-CONTEXT_FIDELITY');
  });

  it('detects structured experiment artifacts', () => {
    const checks = evaluateHandoffChecksV2({
      handoff: {
        ...validHandoff(),
        experiment_card: { sample: '100 usuarios' },
      },
    });

    expect(checks.find((check) => check.check_id === 'HC-HANDOFF-EXPERIMENT-ARTIFACT')?.failure_code).toBe('F-STEP_LEAK');
  });

  it('does not mutate SessionTrace when building a handoff', () => {
    const sourceExecution = execution();
    const before = JSON.stringify(sourceExecution.trace);
    buildPortfolioEntryHandoffV2({
      execution: sourceExecution,
      final_analysis: sourceExecution.trace.turns[0].analysis,
      candidate_source: validHandoff(),
    });

    expect(JSON.stringify(sourceExecution.trace)).toBe(before);
  });

  it('does not inspect rawInput to generate recommendation or status', () => {
    const sourceExecution = execution({ userInput: 'Queremos innovar con una aceleradora.' });
    const ready = buildPortfolioEntryHandoffV2({
      execution: sourceExecution,
      final_analysis: sourceExecution.trace.turns[0].analysis,
      candidate_source: validHandoff({
        handoff_status: 'ready',
        recommended_approach: {
          description: 'Estructurar el portfolio actual.',
          origin: 'AI_SUGGESTED',
          review_disposition: 'UNREVIEWED',
        },
      }),
    });
    const insufficient = buildPortfolioEntryHandoffV2({
      execution: sourceExecution,
      final_analysis: sourceExecution.trace.turns[0].analysis,
      candidate_source: validHandoff({
        handoff_status: 'insufficient_input',
        recommended_approach: {
          description: 'Aclarar primero la decision a habilitar.',
          origin: 'AI_SUGGESTED',
          review_disposition: 'UNREVIEWED',
        },
      }),
    });

    expect(ready.handoff?.handoff_status).toBe('ready');
    expect(ready.handoff?.recommended_approach?.description).toBe('Estructurar el portfolio actual.');
    expect(insufficient.handoff?.handoff_status).toBe('insufficient_input');
    expect(insufficient.handoff?.recommended_approach?.description).toBe('Aclarar primero la decision a habilitar.');
  });

  it('does not emit redundant F-HANDOFF for schema failure alone', () => {
    const checks = evaluateHandoffChecksV2({ handoff: { handoff_status: 'ready' } });

    expect(checks.find((check) => check.check_id === 'HC-HANDOFF-SCHEMA')?.failure_code).toBe('F-SCHEMA');
    expect(checks.filter((check) => check.status === 'FAIL').map((check) => check.failure_code)).not.toContain('F-HANDOFF');
  });

  it('appends Handoff checks to evaluation without mutating raw trace', () => {
    const sourceExecution = execution();
    const before = JSON.stringify(sourceExecution.trace);
    const evaluated = evaluateSessionV2({
      fixture: multiFixture(),
      execution: sourceExecution,
      handoff: validHandoff(),
    });

    expect(evaluated.hard_checks.some((check) => check.check_id === 'HC-HANDOFF-SCHEMA')).toBe(true);
    expect(JSON.stringify(sourceExecution.trace)).toBe(before);
  });

  it('keeps contract PASS with hypothesis INCONCLUSIVE representable after Handoff', () => {
    const evaluated = evaluateSessionV2({
      fixture: multiFixture({ linked_hypotheses: ['HYP-002', 'HYP-003', 'HYP-004'] }),
      execution: execution(),
      handoff: validHandoff(),
    });

    expect(evaluated.contract_result).toBe('PASS');
    expect(evaluated.hypothesis_result).toBe('INCONCLUSIVE');
  });

  it('does not use an LLM judge or Live LLM for Handoff checks', () => {
    const result = evaluateHandoffChecksV2({ handoff: validHandoff() });

    expect(result).not.toBeInstanceOf(Promise);
    expect(result.flatMap((check) => check.evidence).some((evidence) => evidence.source === 'handoff')).toBe(true);
  });
});

function validHandoff(overrides: Partial<Record<keyof PortfolioEntryHandoffV2, unknown>> = {}): PortfolioEntryHandoffV2 {
  return portfolioEntryHandoffV2Schema.parse(rawHandoff(overrides));
}

function rawHandoff(overrides: Partial<Record<keyof PortfolioEntryHandoffV2, unknown>> = {}): Record<string, unknown> {
  return {
    understanding: {
      value: 'Starteria entendio que el equipo necesita ordenar iniciativas antes de priorizar.',
      provenance: { origin: 'AI_INFERRED' },
    },
    desired_outcome: {
      value: 'Definir una forma clara de gobernar iniciativas.',
      provenance: { origin: 'EXTRACTED_FROM_USER_TEXT' },
    },
    decision_to_enable: {
      value: 'Decidir que iniciativas avanzan a preparacion.',
      provenance: { origin: 'AI_INFERRED' },
    },
    recommended_approach: {
      description: 'Estructurar el portfolio antes de seleccionar iniciativas.',
      rationale: 'La entrada habla de priorizacion y gobernanza.',
      origin: 'AI_SUGGESTED',
      review_disposition: 'UNREVIEWED',
    },
    alternative_approaches: [{
      description: 'Aclarar primero las decisiones que el portfolio debe habilitar.',
      origin: 'AI_SUGGESTED',
      review_disposition: 'UNREVIEWED',
    }],
    known_context: [{
      key: 'operating_context',
      value: 'equipo corporativo con varias iniciativas',
      provenance: { origin: 'EXTRACTED_FROM_USER_TEXT' },
    }],
    unresolved_context: [],
    gap_resolution_map: [{
      gap_id: 'gap-1',
      gap_description: 'Falta claridad sobre criterios de priorizacion.',
      resolution_type: 'STARTERIA_CAN_STRUCTURE',
      starteria_capability: 'structure',
      resolution_stage: 'PORTFOLIO',
      provenance: { origin: 'AI_INFERRED' },
    }],
    evidence_or_clarity_needed: [{
      value: 'Aclarar que decision debe habilitar el portfolio.',
      provenance: { origin: 'AI_INFERRED' },
    }],
    starteria_path: [{
      action: 'structure',
      description: 'Convertir la entrada en contexto organizado para trabajo posterior.',
    }],
    recommended_cta: 'Estructurar mi portfolio',
    provenance_summary: [{ origin: 'AI_INFERRED' }],
    handoff_status: 'ready',
    ...overrides,
  };
}

function multiFixture(overrides: Partial<MultiTurnFixtureV2> = {}): MultiTurnFixtureV2 {
  return multiTurnFixtureV2Schema.parse({
    fixture_version: '0.2',
    case_id: 'PE2-MT-HANDOFF-01',
    case_type: 'multi_turn',
    name: 'Handoff fixture',
    suite: 'handoff',
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

function execution(overrides: { userInput?: string } = {}): SessionExecutionResult {
  const trace = sessionTrace(overrides);
  return {
    trace,
    final_context: {
      interaction_mode: 'quick_clarification',
      quick_question_budget: 3,
      quick_questions_asked: 0,
      exploration_round: 0,
      questions_asked_current_round: 0,
      previous_questions: [],
      answered_gaps: [],
      exploration_goal: null,
      user_exploration_choice: 'not_offered',
      clarification_status: 'ready_for_handoff',
      stop_reason: 'sufficient_context',
    },
    completed: true,
    stop_reason: 'sufficient_context',
    violations: [],
  };
}

function sessionTrace(overrides: { userInput?: string } = {}): SessionTrace {
  const turn: SessionTurnTrace = {
    turn_index: 1,
    user_input: overrides.userInput ?? 'Necesitamos ordenar una iniciativa.',
    analysis: {
      entry_id: 'entry-1',
      analysis_version: 'test-v0.2',
      primary_intent: 'initiative_governance',
      secondary_intents: [],
      initial_entry_state: 'problem_first',
      current_frame: 'problem_first',
      extracted_context: {},
      ambiguities: [],
      contradictions: [],
      reverse_alignment: {
        required: false,
        status: 'not_required',
      },
      provenance: [],
      status: 'ready',
    },
    initial_entry_state: 'problem_first',
    current_frame: 'problem_first',
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
      from_status: 'not_started',
      to_status: 'ready_for_handoff',
      from_mode: 'quick_clarification',
      to_mode: 'quick_clarification',
      reason: 'sufficient_context',
      trigger: 'agent_output',
      budget_before: 3,
      budget_after: 3,
    },
  };

  return {
    case_id: 'PE2-MT-HANDOFF-01',
    run_id: 'run-handoff',
    candidate_id: 'candidate-handoff',
    turns: [turn],
    questions_total: 0,
    quick_questions_total: 0,
    exploration_rounds: 0,
    mode_transitions: [],
    stop_reason: 'sufficient_context',
    clarification_status: 'ready_for_handoff',
    execution_guard_triggered: false,
  };
}
