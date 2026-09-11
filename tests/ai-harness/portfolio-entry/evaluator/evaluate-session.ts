import type { PortfolioEntryFixtureV2 } from '../schemas/fixture.schema';
import { sessionTraceSchema } from '../schemas/session-trace.schema';
import type { SessionExecutionResult, SessionTrace } from '../session/session-types';
import { scoreContractV2 } from './contract-scorer-v0.2';
import { evaluateHandoffChecksV2 } from './handoff-checks-v0.2';
import { evaluateHardChecksV2 } from './hard-checks-v0.2';
import { evaluateHypothesesV2 } from './hypothesis-evaluator';
import type { EvaluatedPortfolioEntryResultV2 } from './evaluation-types-v0.2';

export function evaluateSessionV2(input: {
  fixture: PortfolioEntryFixtureV2;
  execution: SessionExecutionResult | SessionTrace | unknown;
  handoff?: unknown;
}): EvaluatedPortfolioEntryResultV2 {
  const rawTrace = extractTrace(input.execution);
  const hardChecks = [
    ...evaluateHardChecksV2({ fixture: input.fixture, trace: rawTrace }),
    ...(input.handoff === undefined ? [] : evaluateHandoffChecksV2({ handoff: input.handoff })),
  ];
  const parsed = sessionTraceSchema.safeParse(rawTrace);

  if (!parsed.success) {
    const failureCodes = [...new Set(hardChecks.filter((check) => check.status === 'FAIL' && check.failure_code).map((check) => check.failure_code!))];
    return {
      case_id: input.fixture.case_id,
      run_id: 'unknown',
      candidate_id: 'unknown',
      fixture_version: input.fixture.fixture_version,
      hard_checks: hardChecks,
      hard_failure: true,
      failure_codes: failureCodes,
      contract_dimensions: [],
      contract_score: 0,
      contract_result: 'FAIL',
      hypothesis_evaluations: [],
      hypothesis_result: 'N/A',
      human_review_pending: Boolean(input.fixture.human_review_required),
      notes: ['SessionTrace schema validation failed; scoring skipped.'],
    };
  }

  const trace = parsed.data as SessionTrace;
  const contract = scoreContractV2({ fixture: input.fixture, trace, hardChecks });
  const hypothesis = evaluateHypothesesV2({ fixture: input.fixture, trace, contractResult: contract.contract_result });

  return {
    case_id: input.fixture.case_id,
    run_id: trace.run_id,
    candidate_id: trace.candidate_id,
    fixture_version: input.fixture.fixture_version,
    hard_checks: hardChecks,
    hard_failure: contract.hard_failure,
    failure_codes: contract.failure_codes,
    contract_dimensions: contract.dimensions,
    contract_score: contract.contract_score,
    contract_result: contract.contract_result,
    hypothesis_evaluations: hypothesis.evaluations,
    hypothesis_result: hypothesis.hypothesis_result,
    human_review_pending: Boolean(input.fixture.human_review_required || hypothesis.hypothesis_result === 'INCONCLUSIVE'),
    notes: [],
  };
}

function extractTrace(execution: SessionExecutionResult | SessionTrace | unknown): unknown {
  if (execution && typeof execution === 'object' && 'trace' in execution) {
    return (execution as { trace: unknown }).trace;
  }
  return execution;
}
