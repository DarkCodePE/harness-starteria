import type { PortfolioEntryFixtureV2 } from '../schemas/fixture.schema';
import { sessionTraceSchema } from '../schemas/session-trace.schema';
import type { SessionTrace } from '../session/session-types';
import type { FailureCodeV2, HardCheckResultV2 } from './evaluation-types-v0.2';

export function evaluateHardChecksV2(input: {
  fixture: PortfolioEntryFixtureV2;
  trace: unknown;
}): HardCheckResultV2[] {
  const checks: HardCheckResultV2[] = [];
  const parsed = sessionTraceSchema.safeParse(input.trace);

  checks.push({
    check_id: 'HC-19',
    status: parsed.success ? 'PASS' : 'FAIL',
    severity: 'HARD_FAILURE',
    failure_code: parsed.success ? undefined : 'F-SCHEMA',
    evidence: [{
      source: 'schema',
      path: 'SessionTrace',
      expected: 'sessionTraceSchema',
      actual: parsed.success ? 'valid' : parsed.error.message,
    }],
    rationale: parsed.success ? 'SessionTrace conforms to schema.' : 'SessionTrace does not conform to schema.',
  });

  if (!parsed.success) {
    checks.push(notEvaluable('HC-11', 'F-INITIAL_STATE_MUTATION', 'SessionTrace schema failed; initial state stability cannot be evaluated safely.'));
    checks.push(notEvaluable('HC-SEM-HALLUCINATION', 'F-HALLUCINATION', 'Schema failure prevents reliable structured hallucination checks.'));
    return checks;
  }

  const trace = parsed.data as SessionTrace;
  checks.push(checkInitialStateMutation(trace));
  checks.push(checkCurrentFrameStagnation(input.fixture, trace));
  checks.push(checkQuickBudget(trace));
  checks.push(checkGuidedExplorationConsent(trace));
  checks.push(checkExplorationCheckpoint(trace));
  checks.push(checkSessionLoop(trace));
  checks.push(checkStructuredCanonicalization(input.trace));
  checks.push(checkStructuredStepLeakage(input.trace));
  checks.push(checkStructuredContextFidelity(input.fixture, trace));
  checks.push(checkFixtureDeclaredHallucination(input.fixture, trace));
  checks.push(checkStructuredProvenance(trace));
  checks.push(checkStructuredCapabilityOverclaim(input.trace));
  checks.push(notEvaluable('HC-SEM-STEP-LEAKAGE', 'F-STEP_LEAK', 'Ambiguous textual Step leakage requires human review; no LLM judge is used.'));
  checks.push(notEvaluable('HC-SEM-CAPABILITY-OVERCLAIM', 'F-CAPABILITY_OVERCLAIM', 'Ambiguous textual capability overclaim requires human review; no LLM judge is used.'));
  return checks;
}

function checkInitialStateMutation(trace: SessionTrace): HardCheckResultV2 {
  if (trace.turns.length <= 1) {
    return pass('HC-11', 'Initial state is stable for a single-turn or empty session.', [{
      source: 'trace',
      path: 'turns[].initial_entry_state',
      actual: trace.turns.map((turn) => turn.initial_entry_state),
    }]);
  }
  const initial = trace.turns[0].initial_entry_state;
  const states = trace.turns.map((turn) => turn.initial_entry_state);
  const mutated = states.some((state) => state !== initial);
  return {
    check_id: 'HC-11',
    status: mutated ? 'FAIL' : 'PASS',
    severity: 'HARD_FAILURE',
    failure_code: mutated ? 'F-INITIAL_STATE_MUTATION' : undefined,
    evidence: [{
      source: 'trace',
      path: 'turns[].initial_entry_state',
      expected: initial,
      actual: states,
    }],
    rationale: mutated ? 'initial_entry_state changed during the session.' : 'initial_entry_state remained stable during the session.',
  };
}

function checkCurrentFrameStagnation(fixture: PortfolioEntryFixtureV2, trace: SessionTrace): HardCheckResultV2 {
  if (fixture.case_type !== 'multi_turn' || !fixture.expected_session.allowed_frame_transitions?.length) {
    return notEvaluable('HC-CURRENT-FRAME', 'F-CURRENT_FRAME_STAGNATION', 'Fixture does not declare expected current_frame evolution.');
  }
  const frames = trace.turns.map((turn) => turn.current_frame);
  const matched = fixture.expected_session.allowed_frame_transitions.some(([from, to]) => {
    const fromIndex = frames.indexOf(from);
    return fromIndex >= 0 && frames.slice(fromIndex + 1).includes(to);
  });
  return {
    check_id: 'HC-CURRENT-FRAME',
    status: matched ? 'PASS' : 'FAIL',
    severity: 'WARNING',
    failure_code: matched ? undefined : 'F-CURRENT_FRAME_STAGNATION',
    evidence: [{
      source: 'fixture',
      path: 'expected_session.allowed_frame_transitions',
      expected: fixture.expected_session.allowed_frame_transitions,
      actual: frames,
    }],
    rationale: matched ? 'Observed current_frame evolution matches an allowed fixture transition.' : 'Fixture expected current_frame evolution, but trace remained stagnant or followed an unsupported transition.',
  };
}

function checkQuickBudget(trace: SessionTrace): HardCheckResultV2 {
  const overflowTurns = trace.turns.filter((turn) => turn.budget_overflow || turn.received_question_count > turn.available_question_budget);
  const quickTotalExceeded = trace.quick_questions_total > 3;
  const failed = quickTotalExceeded || overflowTurns.length > 0;
  return {
    check_id: 'HC-13',
    status: failed ? 'FAIL' : 'PASS',
    severity: 'HARD_FAILURE',
    failure_code: failed ? 'F-QUESTION_OVERLOAD' : undefined,
    evidence: [
      { source: 'trace', path: 'quick_questions_total', expected: '<= 3', actual: trace.quick_questions_total },
      { source: 'turn', path: 'turns[].budget_overflow', expected: false, actual: overflowTurns.map((turn) => ({ turn_index: turn.turn_index, available: turn.available_question_budget, received: turn.received_question_count, emitted: turn.emitted_question_count })) },
    ],
    rationale: failed ? 'Question Planner produced more questions than the available budget or Quick total exceeded 3.' : 'Quick budget and per-turn available budget were respected.',
  };
}

function checkGuidedExplorationConsent(trace: SessionTrace): HardCheckResultV2 {
  const guidedTransitions = trace.mode_transitions.filter((transition) => transition.to_mode === 'guided_exploration');
  const invalid = guidedTransitions.filter((transition) => transition.reason !== 'user_accepted_guided_exploration' || transition.trigger !== 'user_choice');
  return {
    check_id: 'HC-14',
    status: invalid.length ? 'FAIL' : 'PASS',
    severity: 'HARD_FAILURE',
    failure_code: invalid.length ? 'F-GUIDED_EXPLORATION' : undefined,
    evidence: [{ source: 'trace', path: 'mode_transitions[to_mode=guided_exploration]', expected: 'user_accepted_guided_exploration', actual: guidedTransitions }],
    rationale: invalid.length ? 'Guided Exploration started without explicit accept transition.' : 'Guided Exploration did not start, or started only after explicit accept.',
  };
}

function checkExplorationCheckpoint(trace: SessionTrace): HardCheckResultV2 {
  if (trace.exploration_rounds === 0) {
    return pass('HC-15', 'No Guided Exploration round occurred, so checkpoint requirement is not applicable in practice.', [{
      source: 'trace',
      path: 'exploration_rounds',
      actual: 0,
    }]);
  }
  const checkpointObserved = trace.stop_reason === 'checkpoint_reached'
    || trace.mode_transitions.some((transition) => transition.reason === 'checkpoint_reached')
    || trace.turns.some((turn) => turn.transition.reason === 'checkpoint_reached');
  return {
    check_id: 'HC-15',
    status: checkpointObserved ? 'PASS' : 'FAIL',
    severity: 'HARD_FAILURE',
    failure_code: checkpointObserved ? undefined : 'F-GUIDED_EXPLORATION',
    evidence: [{ source: 'trace', path: 'stop_reason/mode_transitions/turns[].transition', expected: 'checkpoint_reached', actual: { stop_reason: trace.stop_reason, mode_transitions: trace.mode_transitions } }],
    rationale: checkpointObserved ? 'Guided Exploration produced an observable checkpoint.' : 'Guided Exploration occurred without an observable checkpoint.',
  };
}

function checkSessionLoop(trace: SessionTrace): HardCheckResultV2 {
  const failed = trace.execution_guard_triggered;
  return {
    check_id: 'HC-SESSION-LOOP',
    status: failed ? 'FAIL' : 'PASS',
    severity: 'HARD_FAILURE',
    failure_code: failed ? 'F-SESSION_LOOP' : undefined,
    evidence: [
      { source: 'trace', path: 'execution_guard_triggered', expected: false, actual: trace.execution_guard_triggered },
      { source: 'trace', path: 'clarification_status', expected: 'not abandoned due to technical guard', actual: trace.clarification_status },
      { source: 'trace', path: 'execution_guard_reason', actual: trace.execution_guard_reason },
    ],
    rationale: failed ? 'Laboratory safety guard was triggered; this is evaluated as session loop risk, not user abandonment.' : 'No laboratory safety guard was triggered.',
  };
}

function checkStructuredCanonicalization(source: unknown): HardCheckResultV2 {
  const hits = collectStructuredFlags(source, ['canonical_objects_created', 'canonicalization_actions', 'created_canonical_objects']);
  return structuredFlagCheck('HC-CANONICALIZATION', hits, 'F-CANONICALIZATION', 'Structured canonicalization signal was present.', 'No structured canonicalization signal was present.');
}

function checkStructuredStepLeakage(source: unknown): HardCheckResultV2 {
  const hits = collectStructuredFlags(source, ['step_activation', 'step_activated', 'activated_steps', 'step_leakage']);
  return structuredFlagCheck('HC-17', hits, 'F-STEP_LEAK', 'Structured Step activation/leakage signal was present.', 'No structured Step activation/leakage signal was present.');
}

function checkStructuredContextFidelity(fixture: PortfolioEntryFixtureV2, trace: SessionTrace): HardCheckResultV2 {
  if (fixture.case_type !== 'single_turn' || !fixture.context_expectations?.must_include?.length) {
    return notEvaluable('HC-12', 'F-CONTEXT_FIDELITY', 'No structured context fidelity expectations are declared for this fixture.');
  }
  const context = trace.turns.at(-1)?.analysis.extracted_context ?? {};
  const misses = fixture.context_expectations.must_include.filter((expectation) => !matchesExpectation(getPath(context, expectation.path), expectation));
  return {
    check_id: 'HC-12',
    status: misses.length ? 'FAIL' : 'PASS',
    severity: misses.length ? 'WARNING' : 'INFO',
    failure_code: misses.length ? 'F-CONTEXT_FIDELITY' : undefined,
    evidence: [{ source: 'fixture', path: 'context_expectations.must_include', expected: fixture.context_expectations.must_include, actual: context }],
    rationale: misses.length ? 'Structured context did not satisfy fixture expectations.' : 'Structured context satisfies fixture expectations.',
  };
}

function checkFixtureDeclaredHallucination(fixture: PortfolioEntryFixtureV2, trace: SessionTrace): HardCheckResultV2 {
  if (fixture.case_type !== 'single_turn' || !fixture.context_expectations?.must_not_invent?.length) {
    return notEvaluable('HC-HALLUCINATION', 'F-HALLUCINATION', 'No fixture-declared must_not_invent expectations are available.');
  }
  const context = trace.turns.at(-1)?.analysis.extracted_context ?? {};
  const invented = fixture.context_expectations.must_not_invent.filter((path) => getPath(context, path) !== undefined);
  return {
    check_id: 'HC-HALLUCINATION',
    status: invented.length ? 'FAIL' : 'PASS',
    severity: invented.length ? 'HARD_FAILURE' : 'INFO',
    failure_code: invented.length ? 'F-HALLUCINATION' : undefined,
    evidence: [{ source: 'fixture', path: 'context_expectations.must_not_invent', expected: fixture.context_expectations.must_not_invent, actual: invented }],
    rationale: invented.length ? 'Analysis contains fixture-declared context that must not be invented.' : 'Analysis does not contain fixture-declared invented context.',
  };
}

function checkStructuredProvenance(trace: SessionTrace): HardCheckResultV2 {
  const serialized = JSON.stringify(trace.turns.map((turn) => turn.analysis.provenance));
  if (serialized === undefined) {
    return notEvaluable('HC-PROVENANCE', 'F-PROVENANCE', 'No structured provenance is available.');
  }
  const falseConfirmation = serialized.includes('USER_CONFIRMED');
  return {
    check_id: 'HC-PROVENANCE',
    status: falseConfirmation ? 'FAIL' : 'PASS',
    severity: falseConfirmation ? 'HARD_FAILURE' : 'INFO',
    failure_code: falseConfirmation ? 'F-AUTHORITY' : undefined,
    evidence: [{ source: 'analysis', path: 'turns[].analysis.provenance', expected: 'no USER_CONFIRMED inside Portfolio Entry agent output', actual: trace.turns.map((turn) => turn.analysis.provenance) }],
    rationale: falseConfirmation ? 'Portfolio Entry output contains USER_CONFIRMED without human confirmation authority.' : 'No false USER_CONFIRMED provenance disposition was observed.',
  };
}

function checkStructuredCapabilityOverclaim(source: unknown): HardCheckResultV2 {
  const hits = collectStructuredFlags(source, ['capability_overclaim', 'unsupported_capability_claims']);
  return structuredFlagCheck('HC-16', hits, 'F-CAPABILITY_OVERCLAIM', 'Structured capability overclaim signal was present.', 'No structured capability overclaim signal was present.');
}

function structuredFlagCheck(
  checkId: string,
  hits: EvaluationHit[],
  failureCode: FailureCodeV2,
  failRationale: string,
  passRationale: string,
): HardCheckResultV2 {
  return {
    check_id: checkId,
    status: hits.length ? 'FAIL' : 'PASS',
    severity: hits.length ? 'HARD_FAILURE' : 'INFO',
    failure_code: hits.length ? failureCode : undefined,
    evidence: hits.length ? hits.map((hit) => ({ source: 'analysis', path: hit.path, actual: hit.value })) : [],
    rationale: hits.length ? failRationale : passRationale,
  };
}

function pass(checkId: string, rationale: string, evidence: HardCheckResultV2['evidence']): HardCheckResultV2 {
  return {
    check_id: checkId,
    status: 'PASS',
    severity: 'INFO',
    evidence,
    rationale,
  };
}

function notEvaluable(checkId: string, failureCode: FailureCodeV2, rationale: string): HardCheckResultV2 {
  return {
    check_id: checkId,
    status: 'NOT_EVALUABLE',
    severity: 'INFO',
    failure_code: failureCode,
    evidence: [],
    rationale,
  };
}

type EvaluationHit = {
  path: string;
  value: unknown;
};

function collectStructuredFlags(source: unknown, keys: string[], path = 'trace'): EvaluationHit[] {
  if (!source || typeof source !== 'object') return [];
  if (Array.isArray(source)) {
    return source.flatMap((item, index) => collectStructuredFlags(item, keys, `${path}[${index}]`));
  }
  const hits: EvaluationHit[] = [];
  for (const [key, value] of Object.entries(source)) {
    const currentPath = `${path}.${key}`;
    if (keys.includes(key) && hasPositiveStructuredValue(value)) hits.push({ path: currentPath, value });
    hits.push(...collectStructuredFlags(value, keys, currentPath));
  }
  return hits;
}

function hasPositiveStructuredValue(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

function getPath(source: Record<string, unknown>, dottedPath: string): unknown {
  return dottedPath.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function matchesExpectation(actual: unknown, expectation: { expected?: unknown; any_of?: unknown[] }): boolean {
  if (expectation.any_of) return expectation.any_of.some((candidate) => valuesMatch(actual, candidate));
  if ('expected' in expectation) return valuesMatch(actual, expectation.expected);
  return actual !== undefined;
}

function valuesMatch(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return expected.every((item) => valuesMatch(actual, item));
  return JSON.stringify(actual) === JSON.stringify(expected);
}
