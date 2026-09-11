import { portfolioEntryAnalysisSchema, type EvaluatedCaseResult, type Fixture, type HardCheck } from '../types';

export function scoreResult(fixture: Fixture, output: unknown, hardChecks: HardCheck[], runIndex: number): EvaluatedCaseResult {
  const parsed = portfolioEntryAnalysisSchema.safeParse(output);
  const hardFailureCodes = hardChecks
    .filter((check) => !check.passed && check.failure_code)
    .map((check) => check.failure_code!);

  if (!parsed.success) {
    return {
      case_id: fixture.case_id,
      run_index: runIndex,
      result: 'FAIL',
      hard_fail: true,
      hard_checks: hardChecks,
      automatic_score: 0,
      human_review_required: false,
      failure_codes: [...new Set(hardFailureCodes)],
      notes: ['Schema validation failed; semantic scoring skipped.'],
    };
  }

  const analysis = parsed.data;
  let automaticScore = 0;
  const notes: string[] = [];
  const failureCodes = new Set(hardFailureCodes);

  if (!fixture.expected.primary_intent || fixture.expected.primary_intent.includes(analysis.primary_intent)) {
    automaticScore += 2;
  } else {
    failureCodes.add('F-INTENT');
    notes.push(`Expected primary_intent in ${fixture.expected.primary_intent.join(', ')}, got ${analysis.primary_intent}.`);
  }

  if (!fixture.expected.entry_state || fixture.expected.entry_state.includes(analysis.entry_state)) {
    automaticScore += 2;
  } else {
    failureCodes.add('F-ENTRY_STATE');
    notes.push(`Expected entry_state in ${fixture.expected.entry_state.join(', ')}, got ${analysis.entry_state}.`);
  }

  const contextScore = scoreContext(fixture, analysis.extracted_context, notes);
  automaticScore += contextScore;
  if (contextScore < 2) failureCodes.add('F-HALLUCINATION');

  const provenanceScore = analysis.provenance.every((item) => item.review_disposition === 'UNREVIEWED') ? 2 : 0;
  automaticScore += provenanceScore;
  if (provenanceScore < 2) failureCodes.add('F-PROVENANCE');

  const reverseExpected = fixture.expected.reverse_alignment_required;
  if (reverseExpected === undefined || analysis.reverse_alignment_required === reverseExpected) {
    automaticScore += 2;
  } else {
    failureCodes.add('F-REVERSE_ALIGNMENT');
  }

  if (analysis.question_plan.length <= fixture.expected.max_questions) {
    automaticScore += 2;
  } else {
    failureCodes.add('F-QUESTION_OVERLOAD');
  }

  if (analysis.ux_summary && analysis.ux_summary.length > 0 && analysis.ux_summary.length < 420) {
    automaticScore += 2;
  } else {
    failureCodes.add('F-UX');
  }

  const hardFail = hardChecks.some((check) => !check.passed);
  const humanReviewRequired = Object.values(fixture.human_review).some(Boolean);
  const hasExpectationMiss = notes.length > 0 || [...failureCodes].some((code) => !hardFailureCodes.includes(code));
  const result = hardFail ? 'FAIL' : humanReviewRequired || hasExpectationMiss || automaticScore < 12 ? 'REVIEW' : 'PASS';

  return {
    case_id: fixture.case_id,
    run_index: runIndex,
    result,
    hard_fail: hardFail,
    hard_checks: hardChecks,
    automatic_score: automaticScore,
    human_review_required: humanReviewRequired,
    failure_codes: [...failureCodes],
    notes,
  };
}

function scoreContext(fixture: Fixture, context: Record<string, unknown>, notes: string[]): number {
  const entries = Object.entries(fixture.must_include_context);
  if (entries.length === 0) return 2;
  const misses = entries.filter(([key, expected]) => !contextMatches(context[key], expected));
  if (misses.length === 0) return 2;
  for (const [key, expected] of misses) {
    notes.push(`Expected context.${key} to include ${JSON.stringify(expected)}, got ${JSON.stringify(context[key])}.`);
  }
  return misses.length === entries.length ? 0 : 1;
}

function contextMatches(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return expected.every((item) => contextMatches(actual, item));
  }
  if (typeof expected === 'number' || typeof expected === 'boolean') {
    return actual === expected || (Array.isArray(actual) && actual.includes(expected));
  }
  if (typeof expected === 'string') {
    const expectedText = expected.toLowerCase();
    const actualText = Array.isArray(actual) ? actual.join(' ').toLowerCase() : String(actual ?? '').toLowerCase();
    return actualText.includes(expectedText) || expectedText.includes(actualText);
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}
