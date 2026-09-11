import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { FetchStructuredModelAdapter } from '../adapters/live-llm-adapter';
import { LivePortfolioEntryAgentAdapter } from '../agent/live-portfolio-entry-agent-adapter';
import { evaluateSessionV2 } from '../evaluator/evaluate-session';
import type { EvaluatedPortfolioEntryResultV2 } from '../evaluator/evaluation-types-v0.2';
import { loadFixturesV2, selectFixturesV2 } from '../fixtures-v0.2';
import { generateLivePortfolioEntryHandoffV2, type LiveHandoffGenerationOutput } from '../handoff/live-handoff-generator';
import { createLiveCandidateManifest } from '../manifests/candidate-manifest';
import { createContractManifest } from '../manifests/contract-manifest';
import { LiveModelExecutionError } from '../model/live-model-error';
import { loadPortfolioEntryHarnessProviderConfig, sanitizeProviderConfig } from '../model/provider-config';
import { loadResolvedPromptManifest } from '../prompts/prompt-manifest';
import { summarizeStability, type LiveRunObservation } from '../reporting/stability';
import type { PortfolioEntryFixtureV2 } from '../schemas/fixture.schema';
import type { PortfolioEntryHandoffV2 } from '../schemas/handoff.schema';
import type { SingleTurnFixtureV2 } from '../schemas/single-turn-fixture.schema';
import { executePortfolioEntrySession } from '../session/session-executor';
import type { SessionContext, SessionExecutionResult, SessionTrace, SessionTurnTrace } from '../session/session-types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');
const runsRoot = path.join(repoRoot, 'tmp', 'ai-harness', 'portfolio-entry', 'runs');

export type LiveRunnerOptions = {
  caseId?: string;
  suite?: string;
  type?: 'single_turn' | 'multi_turn';
  repeat: number;
  maxCases?: number;
  candidateId?: string;
};

export type LivePortfolioEntryRunResult = {
  run: Record<string, unknown>;
  outputDir: string;
  rawResults: unknown[];
  sessionTraces: SessionTrace[];
  handoffs: unknown[];
  evaluatedResults: EvaluatedPortfolioEntryResultV2[];
  stability: ReturnType<typeof summarizeStability>;
};

export async function runLivePortfolioEntryHarness(options: LiveRunnerOptions): Promise<LivePortfolioEntryRunResult> {
  const config = loadPortfolioEntryHarnessProviderConfig();
  const promptManifest = loadResolvedPromptManifest();
  const candidate = createLiveCandidateManifest({
    candidateId: options.candidateId ?? `portfolio-entry-live-${config.provider}-${config.model}-${promptManifest.prompt_manifest_hash.slice(0, 8)}`,
    provider: config.provider,
    model: config.model,
    temperature: config.temperature,
    seed: config.seed,
    seedSupport: config.seed === undefined ? 'not_requested' : 'unavailable',
    promptManifestHash: promptManifest.prompt_manifest_hash,
    codeCommit: readGitCommit(),
    codeCommitStatus: readGitCommit() ? 'available' : 'uncommitted',
  });

  const fixtures = selectFixturesV2(loadFixturesV2(), {
    caseId: options.caseId,
    suite: options.suite,
    type: options.type,
    maxCases: options.maxCases,
  });
  if (fixtures.length === 0) throw new Error('No v0.2 fixtures matched the live runner filters.');

  const runId = createRunId();
  const outputDir = path.join(runsRoot, runId);
  fs.mkdirSync(outputDir, { recursive: true });

  const model = new FetchStructuredModelAdapter(config);
  const rawResults: unknown[] = [];
  const sessionTraces: SessionTrace[] = [];
  const handoffs: unknown[] = [];
  const evaluatedResults: EvaluatedPortfolioEntryResultV2[] = [];
  const observations: LiveRunObservation[] = [];

  for (const fixture of fixtures) {
    for (let repeatIndex = 1; repeatIndex <= options.repeat; repeatIndex += 1) {
      const started = performance.now();
      let agent: LivePortfolioEntryAgentAdapter | undefined;
      try {
        agent = new LivePortfolioEntryAgentAdapter(model, candidate, promptManifest, { repeat_index: repeatIndex });
        const execution = fixture.case_type === 'single_turn'
          ? await executeSingleTurnFixture(fixture, { runId, repeatIndex, candidateId: candidate.candidate_id, agent })
          : await executePortfolioEntrySession(fixture, { runId, candidateId: candidate.candidate_id, adapter: agent });
        sessionTraces.push(execution.trace);

        const handoff = await generateLivePortfolioEntryHandoffV2({
          model,
          candidate,
          promptManifest,
          execution,
          repeatIndex,
        });
        handoffs.push(toHandoffArtifact(fixture.case_id, repeatIndex, handoff));

        const evaluated = evaluateSessionV2({ fixture, execution, handoff: handoff.raw_candidate });
        evaluatedResults.push(evaluated);
        observations.push({ case_id: fixture.case_id, repeat_index: repeatIndex, trace: execution.trace, handoff: handoff.handoff, evaluated });
        rawResults.push({
          case_id: fixture.case_id,
          repeat_index: repeatIndex,
          execution_status: 'completed',
          duration_ms: Math.round(performance.now() - started),
          model_executions: [...agent.modelExecutions, handoff.model_execution],
        });
      } catch (error) {
        const rawFailure = liveFailureArtifact(fixture, repeatIndex, error, Math.round(performance.now() - started), agent?.modelExecutions ?? []);
        rawResults.push(rawFailure);
        const evaluated = executionFailureResult(fixture, runId, candidate.candidate_id, error);
        evaluatedResults.push(evaluated);
        observations.push({ case_id: fixture.case_id, repeat_index: repeatIndex, evaluated });
      }
    }
  }

  const stability = summarizeStability(observations);
  const run = {
    run_id: runId,
    timestamp: new Date().toISOString(),
    fixture_version: '0.2',
    adapter: 'live',
    candidate_id: candidate.candidate_id,
    cases: fixtures.map((fixture) => fixture.case_id),
    suite: options.suite,
    type: options.type,
    repeat: options.repeat,
    max_cases: options.maxCases,
    holdout_mode: false,
    human_review_required: fixtures.some((fixture) => fixture.human_review_required),
    git_commit_if_available: candidate.code_commit ?? null,
    provider_config: sanitizeProviderConfig(config),
  };

  persistLiveRun(outputDir, {
    run,
    candidate,
    contractManifest: createContractManifest(),
    promptManifest,
    rawResults,
    sessionTraces,
    handoffs,
    evaluatedResults,
    stability,
  });

  return { run, outputDir, rawResults, sessionTraces, handoffs, evaluatedResults, stability };
}

async function executeSingleTurnFixture(
  fixture: SingleTurnFixtureV2,
  input: { runId: string; repeatIndex: number; candidateId: string; agent: LivePortfolioEntryAgentAdapter },
): Promise<SessionExecutionResult> {
  const context = createSingleTurnSessionContext();
  const output = await input.agent.analyzeTurn({
    entryId: `${fixture.case_id}-${input.runId}-${input.repeatIndex}-1`,
    sessionId: `${fixture.case_id}-${input.runId}-${input.repeatIndex}`,
    rawInput: fixture.input,
    sessionContext: context,
  });
  const turn: SessionTurnTrace = {
    turn_index: 1,
    user_input: fixture.input,
    analysis: output.analysis,
    initial_entry_state: output.analysis.initial_entry_state,
    current_frame: output.analysis.current_frame,
    intent: {
      primary_intent: output.analysis.primary_intent,
      secondary_intents: output.analysis.secondary_intents,
    },
    reverse_alignment: output.analysis.reverse_alignment,
    question_plan: output.question_plan,
    interaction_mode: 'quick_clarification',
    available_question_budget: 3,
    received_question_count: output.question_plan.question_count,
    emitted_question_count: output.question_plan.question_count,
    questions_asked: output.question_plan.questions.map((question) => ({
      id: question.id,
      question: question.question,
      question_type: question.question_type,
      resolves: question.resolves,
      turn_index: 1,
      interaction_mode: 'quick_clarification',
      asked_at_budget_remaining: 3,
    })),
    budget_overflow: output.question_plan.question_count > 3,
    transition: {
      from_status: 'not_started',
      to_status: output.question_plan.status === 'questions_required' ? 'ended_with_uncertainty' : 'ready_for_handoff',
      from_mode: 'quick_clarification',
      to_mode: 'quick_clarification',
      reason: output.question_plan.stop_reason ?? output.question_plan.status ?? 'single_turn_completed',
      trigger: 'agent_output',
      budget_before: 3,
      budget_after: Math.max(0, 3 - output.question_plan.question_count),
    },
  };
  const trace: SessionTrace = {
    case_id: fixture.case_id,
    run_id: input.runId,
    candidate_id: input.candidateId,
    turns: [turn],
    questions_total: output.question_plan.question_count,
    quick_questions_total: output.question_plan.question_count,
    exploration_rounds: 0,
    mode_transitions: [turn.transition],
    stop_reason: turn.transition.reason,
    clarification_status: turn.transition.to_status,
    execution_guard_triggered: false,
  };
  return {
    trace,
    final_context: {
      ...context,
      quick_questions_asked: output.question_plan.question_count,
      previous_questions: turn.questions_asked,
      clarification_status: turn.transition.to_status,
      stop_reason: turn.transition.reason,
    },
    completed: true,
    stop_reason: turn.transition.reason,
    violations: turn.budget_overflow ? ['question_budget_overflow'] : [],
  };
}

function createSingleTurnSessionContext(): SessionContext {
  return {
    interaction_mode: 'quick_clarification',
    quick_question_budget: 3,
    quick_questions_asked: 0,
    exploration_round: 0,
    questions_asked_current_round: 0,
    previous_questions: [],
    answered_gaps: [],
    exploration_goal: null,
    user_exploration_choice: 'not_offered',
    clarification_status: 'not_started',
    stop_reason: null,
  };
}

export function liveFailureArtifact(
  fixture: Pick<PortfolioEntryFixtureV2, 'case_id'>,
  repeatIndex: number,
  error: unknown,
  durationMs: number,
  priorModelExecutions: unknown[] = [],
): Record<string, unknown> {
  if (error instanceof LiveModelExecutionError) {
    return {
      case_id: fixture.case_id,
      repeat_index: repeatIndex,
      execution_status: 'failed',
      error_type: error.result.error_type ?? 'SCHEMA_ERROR',
      duration_ms: durationMs,
      model_executions: appendModelExecutionIfMissing(priorModelExecutions, error.result),
    };
  }
  return {
    case_id: fixture.case_id,
    repeat_index: repeatIndex,
    execution_status: 'failed',
    error_type: 'TECHNICAL_ERROR',
    duration_ms: durationMs,
    error: error instanceof Error ? error.message : String(error),
  };
}

function appendModelExecutionIfMissing(modelExecutions: unknown[], result: unknown): unknown[] {
  if (modelExecutions.includes(result)) return modelExecutions;
  return [...modelExecutions, result];
}

function executionFailureResult(
  fixture: PortfolioEntryFixtureV2,
  runId: string,
  candidateId: string,
  error: unknown,
): EvaluatedPortfolioEntryResultV2 {
  const failureCode = error instanceof LiveModelExecutionError ? 'F-SCHEMA' : 'F-EXECUTION';
  return {
    case_id: fixture.case_id,
    run_id: runId,
    candidate_id: candidateId,
    fixture_version: '0.2',
    hard_checks: [{
      check_id: error instanceof LiveModelExecutionError ? 'HC-LIVE-SCHEMA' : 'HC-LIVE-EXECUTION',
      status: 'FAIL',
      severity: 'HARD_FAILURE',
      failure_code: failureCode,
      evidence: [{
        source: error instanceof LiveModelExecutionError ? 'schema' : 'trace',
        path: 'live_model_execution',
        actual: error instanceof LiveModelExecutionError ? error.result.schema_errors : error instanceof Error ? error.message : String(error),
      }],
      rationale: error instanceof LiveModelExecutionError ? 'Live model output did not validate; no artificial analysis was created.' : 'Live execution failed before evaluation could complete.',
    }],
    hard_failure: true,
    failure_codes: [failureCode],
    contract_dimensions: [],
    contract_score: 0,
    contract_result: 'FAIL',
    hypothesis_evaluations: [],
    hypothesis_result: 'N/A',
    human_review_pending: Boolean(fixture.human_review_required),
    notes: [error instanceof Error ? error.message : String(error)],
  };
}

function toHandoffArtifact(caseId: string, repeatIndex: number, handoff: LiveHandoffGenerationOutput): Record<string, unknown> {
  return {
    case_id: caseId,
    repeat_index: repeatIndex,
    handoff: handoff.handoff,
    schema_valid: handoff.schema_valid,
    errors: handoff.errors,
    raw_candidate: handoff.raw_candidate,
    model_execution: handoff.model_execution,
  };
}

function persistLiveRun(outputDir: string, input: {
  run: unknown;
  candidate: unknown;
  contractManifest: unknown;
  promptManifest: unknown;
  rawResults: unknown[];
  sessionTraces: SessionTrace[];
  handoffs: unknown[];
  evaluatedResults: EvaluatedPortfolioEntryResultV2[];
  stability: unknown;
}): void {
  fs.writeFileSync(path.join(outputDir, 'run.json'), `${JSON.stringify(input.run, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'candidate.json'), `${JSON.stringify(input.candidate, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'contract-manifest.json'), `${JSON.stringify(input.contractManifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'prompt-manifest.json'), `${JSON.stringify(input.promptManifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'raw-results.jsonl'), `${input.rawResults.map((result) => JSON.stringify(result)).join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'session-traces.jsonl'), `${input.sessionTraces.map((trace) => JSON.stringify(trace)).join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'handoffs.jsonl'), `${input.handoffs.map((handoff) => JSON.stringify(handoff)).join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'evaluated-results.json'), `${JSON.stringify(input.evaluatedResults, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'stability.json'), `${JSON.stringify(input.stability, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'REPORT.md'), buildLiveReport(input.run, input.evaluatedResults, input.stability), 'utf8');
}

function buildLiveReport(run: unknown, results: EvaluatedPortfolioEntryResultV2[], stability: unknown): string {
  const runRecord = run as Record<string, unknown>;
  const counts = {
    PASS: results.filter((result) => result.contract_result === 'PASS').length,
    REVIEW: results.filter((result) => result.contract_result === 'REVIEW').length,
    FAIL: results.filter((result) => result.contract_result === 'FAIL').length,
  };
  const failures = new Map<string, number>();
  for (const result of results) {
    for (const code of result.failure_codes) failures.set(code, (failures.get(code) ?? 0) + 1);
  }
  return [
    'PORTFOLIO ENTRY LIVE HARNESS RUN',
    '',
    `Run ID: ${String(runRecord.run_id)}`,
    `Candidate: ${String(runRecord.candidate_id)}`,
    `Provider/model: ${JSON.stringify(runRecord.provider_config)}`,
    `Repeat: ${String(runRecord.repeat)}`,
    '',
    'CONTRACT CONFORMANCE',
    `PASS: ${counts.PASS}`,
    `REVIEW: ${counts.REVIEW}`,
    `FAIL: ${counts.FAIL}`,
    '',
    'INDIVIDUAL RESULTS',
    ...results.map((result) => `${result.case_id}: ${result.contract_result} (${result.failure_codes.join(', ') || 'no failures'})`),
    '',
    'FAILURE DISTRIBUTION',
    ...([...failures.entries()].map(([code, count]) => `${code}: ${count}`)),
    '',
    'STABILITY',
    JSON.stringify(stability, null, 2),
    '',
    'HUMAN REVIEW',
    'Pending / not implemented in Phase 5.',
    '',
  ].join('\n');
}

function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function readGitCommit(): string | undefined {
  return process.env.PORTFOLIO_ENTRY_HARNESS_CODE_COMMIT || undefined;
}
