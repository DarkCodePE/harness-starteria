import type { PortfolioEntryFixtureV2 } from '../schemas/fixture.schema';
import type { SessionTrace } from '../session/session-types';
import type {
  ContractDimensionNameV2,
  ContractDimensionScoreV2,
  ContractResultV2,
  FailureCodeV2,
  HardCheckResultV2,
} from './evaluation-types-v0.2';

export function scoreContractV2(input: {
  fixture: PortfolioEntryFixtureV2;
  trace: SessionTrace;
  hardChecks: HardCheckResultV2[];
}): {
  dimensions: ContractDimensionScoreV2[];
  contract_score: number;
  contract_result: ContractResultV2;
  hard_failure: boolean;
  failure_codes: FailureCodeV2[];
} {
  const dimensions = buildDimensions(input.fixture, input.trace, input.hardChecks);
  const applicable = dimensions.filter((dimension) => dimension.applicability === 'APPLICABLE');
  const points = applicable.reduce((total, dimension) => total + (dimension.points ?? 0), 0);
  const max = applicable.reduce((total, dimension) => total + dimension.max_points, 0);
  const contractScore = max === 0 ? 1 : points / max;
  const hardFailure = input.hardChecks.some((check) => check.status === 'FAIL' && check.severity === 'HARD_FAILURE');
  const failureCodes = collectFailureCodes(input.hardChecks, dimensions);

  return {
    dimensions,
    contract_score: contractScore,
    contract_result: determineContractResultV2(contractScore, hardFailure),
    hard_failure: hardFailure,
    failure_codes: failureCodes,
  };
}

export function determineContractResultV2(score: number, hardFailure: boolean): ContractResultV2 {
  if (hardFailure) return 'FAIL';
  if (score >= 0.90) return 'PASS';
  if (score >= 0.75) return 'REVIEW';
  return 'FAIL';
}

function buildDimensions(
  fixture: PortfolioEntryFixtureV2,
  trace: SessionTrace,
  hardChecks: HardCheckResultV2[],
): ContractDimensionScoreV2[] {
  return [
    scoreIntent(fixture, trace),
    scoreInitialState(fixture, trace, hardChecks),
    scoreCurrentFrame(fixture, trace, hardChecks),
    scoreContextExtraction(fixture, trace),
    scoreContextFidelity(fixture, hardChecks),
    scoreProvenance(hardChecks),
    scoreReverseAlignment(fixture, trace),
    scoreQuestionPlanning(trace, hardChecks),
    scoreSessionGovernance(trace, hardChecks),
    scoreAuthority(hardChecks),
    scoreStepBoundary(hardChecks),
    scoreCanonicalization(hardChecks),
  ];
}

function scoreIntent(fixture: PortfolioEntryFixtureV2, trace: SessionTrace): ContractDimensionScoreV2 {
  if (fixture.case_type !== 'single_turn' || !fixture.expected.primary_intent?.length) return notApplicable('Intent', 'No explicit intent expectation.');
  const actual = trace.turns.at(-1)?.analysis.primary_intent;
  const passed = actual !== undefined && fixture.expected.primary_intent.includes(actual);
  return applicable('Intent', passed ? 2 : 0, passed ? [] : ['F-INTENT'], `Expected primary_intent ${fixture.expected.primary_intent.join(', ')}, got ${actual ?? 'missing'}.`);
}

function scoreInitialState(fixture: PortfolioEntryFixtureV2, trace: SessionTrace, hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  const mutation = failedCode(hardChecks, 'F-INITIAL_STATE_MUTATION');
  const expected = fixture.case_type === 'single_turn' ? fixture.expected.initial_entry_state : fixture.expected_session.initial_entry_state;
  if (!expected?.length && !mutation) return notApplicable('Initial State', 'No explicit initial_entry_state expectation and no mutation signal.');
  const first = trace.turns[0]?.initial_entry_state;
  const expectationMiss = expected?.length ? !expected.includes(first) : false;
  const failed = mutation || expectationMiss;
  return applicable('Initial State', failed ? 0 : 2, failed ? ['F-INITIAL_STATE_MUTATION'] : [], failed ? 'initial_entry_state violated stability or explicit fixture expectation.' : 'initial_entry_state is stable and matches explicit expectation.');
}

function scoreCurrentFrame(fixture: PortfolioEntryFixtureV2, trace: SessionTrace, hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  const expectedSingle = fixture.case_type === 'single_turn' ? fixture.expected.current_frame : undefined;
  const expectedTransitions = fixture.case_type === 'multi_turn' ? fixture.expected_session.allowed_frame_transitions : undefined;
  const stagnation = hardChecks.find((check) => check.check_id === 'HC-CURRENT-FRAME');
  if (!expectedSingle?.length && !expectedTransitions?.length) return notApplicable('Current Frame', 'No explicit current_frame expectation.');
  if (stagnation?.status === 'FAIL') return applicable('Current Frame', 0, ['F-CURRENT_FRAME_STAGNATION'], stagnation.rationale);
  if (expectedSingle?.length) {
    const actual = trace.turns.at(-1)?.current_frame;
    const passed = actual !== undefined && expectedSingle.includes(actual);
    return applicable('Current Frame', passed ? 2 : 0, passed ? [] : ['F-ENTRY_STATE'], `Expected current_frame ${expectedSingle.join(', ')}, got ${actual ?? 'missing'}.`);
  }
  return applicable('Current Frame', 2, [], 'Expected current_frame evolution was observed.');
}

function scoreContextExtraction(fixture: PortfolioEntryFixtureV2, trace: SessionTrace): ContractDimensionScoreV2 {
  if (fixture.case_type !== 'single_turn' || !fixture.context_expectations?.must_include?.length) return notApplicable('Context Extraction', 'No explicit structured context inclusion expectation.');
  const context = trace.turns.at(-1)?.analysis.extracted_context ?? {};
  const misses = fixture.context_expectations.must_include.filter((expectation) => getPath(context, expectation.path) === undefined);
  return applicable('Context Extraction', misses.length ? 0 : 2, misses.length ? ['F-CONTEXT_FIDELITY'] : [], misses.length ? 'Expected structured context paths are missing.' : 'Expected structured context paths are present.');
}

function scoreContextFidelity(fixture: PortfolioEntryFixtureV2, hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  const hasExpectation = fixture.case_type === 'single_turn' && Boolean(fixture.context_expectations?.must_include?.length || fixture.context_expectations?.must_not_invent?.length);
  const handoffContextFailures = ['F-CONTEXT_FIDELITY', 'F-HALLUCINATION', 'F-GAP_MAPPING', 'F-HANDOFF'].filter((code) => failedCode(hardChecks, code as FailureCodeV2)) as FailureCodeV2[];
  if (!hasExpectation && handoffContextFailures.length === 0) return notApplicable('Context Fidelity', 'No structured context fidelity expectation.');
  if (handoffContextFailures.length > 0) {
    return applicable('Context Fidelity', 0, handoffContextFailures, 'Structured context fidelity, fixture-declared hallucination, or Handoff mapping failed.');
  }
  return applicable('Context Fidelity', 2, [], 'Structured context fidelity expectations passed.');
}

function scoreProvenance(hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  if (failedCode(hardChecks, 'F-PROVENANCE') || failedCode(hardChecks, 'F-AUTHORITY')) {
    return applicable('Provenance', 0, ['F-PROVENANCE'], 'Structured provenance failed or emitted false confirmation.');
  }
  return applicable('Provenance', 2, [], 'Structured provenance did not show an automatic failure.');
}

function scoreReverseAlignment(fixture: PortfolioEntryFixtureV2, trace: SessionTrace): ContractDimensionScoreV2 {
  const expected = fixture.case_type === 'single_turn' ? fixture.expected.reverse_alignment_required : fixture.expected_session.late_reverse_alignment_required;
  if (expected === undefined) return notApplicable('Reverse Alignment', 'No explicit reverse alignment expectation.');
  const observed = fixture.case_type === 'multi_turn'
    ? trace.turns.some((turn) => turn.reverse_alignment.required === expected)
    : trace.turns.at(-1)?.reverse_alignment.required === expected;
  return applicable('Reverse Alignment', observed ? 2 : 0, observed ? [] : ['F-REVERSE_ALIGNMENT'], observed ? 'Reverse alignment expectation passed.' : 'Reverse alignment expectation failed.');
}

function scoreQuestionPlanning(trace: SessionTrace, hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  if (failedCode(hardChecks, 'F-QUESTION_OVERLOAD')) return applicable('Question Planning', 0, ['F-QUESTION_OVERLOAD'], 'Question plan exceeded available budget.');
  const emptyResolves = trace.turns.flatMap((turn) => turn.question_plan.questions).some((question) => question.resolves.length === 0);
  return applicable('Question Planning', emptyResolves ? 1 : 2, emptyResolves ? ['F-QUESTION_WEAK'] : [], emptyResolves ? 'At least one question has empty resolves.' : 'Question plans stayed within budget and include resolves.');
}

function scoreSessionGovernance(trace: SessionTrace, hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  const failed = ['F-QUESTION_OVERLOAD', 'F-GUIDED_EXPLORATION', 'F-SESSION_LOOP'].filter((code) => failedCode(hardChecks, code as FailureCodeV2)) as FailureCodeV2[];
  return applicable('Session Governance', failed.length ? 0 : 2, failed, failed.length ? 'Session governance hard checks failed.' : `Session governance passed for ${trace.turns.length} turn(s).`);
}

function scoreAuthority(hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  const failures = ['F-AUTHORITY', 'F-CAPABILITY_OVERCLAIM'].filter((code) => failedCode(hardChecks, code as FailureCodeV2)) as FailureCodeV2[];
  return failures.length
    ? applicable('Authority', 0, failures, 'Authority or structured capability violation detected.')
    : applicable('Authority', 2, [], 'No structured authority violation detected.');
}

function scoreStepBoundary(hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  return failedCode(hardChecks, 'F-STEP_LEAK')
    ? applicable('Step Boundary', 0, ['F-STEP_LEAK'], 'Structured Step leakage detected.')
    : applicable('Step Boundary', 2, [], 'No structured Step leakage detected.');
}

function scoreCanonicalization(hardChecks: HardCheckResultV2[]): ContractDimensionScoreV2 {
  return failedCode(hardChecks, 'F-CANONICALIZATION')
    ? applicable('Canonicalization', 0, ['F-CANONICALIZATION'], 'Structured canonicalization detected.')
    : applicable('Canonicalization', 2, [], 'No structured canonicalization detected.');
}

function applicable(
  dimension: ContractDimensionNameV2,
  points: 0 | 1 | 2,
  failureCodes: FailureCodeV2[],
  rationale: string,
): ContractDimensionScoreV2 {
  return {
    dimension,
    applicability: 'APPLICABLE',
    points,
    max_points: 2,
    failure_codes: failureCodes,
    rationale,
  };
}

function notApplicable(dimension: ContractDimensionNameV2, rationale: string): ContractDimensionScoreV2 {
  return {
    dimension,
    applicability: 'NOT_APPLICABLE',
    points: null,
    max_points: 0,
    failure_codes: [],
    rationale,
  };
}

function failedCode(hardChecks: HardCheckResultV2[], code: FailureCodeV2): boolean {
  return hardChecks.some((check) => check.status === 'FAIL' && check.failure_code === code);
}

function collectFailureCodes(hardChecks: HardCheckResultV2[], dimensions: ContractDimensionScoreV2[]): FailureCodeV2[] {
  return [...new Set([
    ...hardChecks.filter((check) => check.status === 'FAIL' && check.failure_code).map((check) => check.failure_code!),
    ...dimensions.flatMap((dimension) => dimension.failure_codes),
  ])];
}

function getPath(source: Record<string, unknown>, dottedPath: string): unknown {
  return dottedPath.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}
