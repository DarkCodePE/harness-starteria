import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { ExperimentalPortfolioEntryAgent } from './agent/experimental-portfolio-entry-agent';
import { evaluateHardChecks } from './evaluator/hard-checks';
import { scoreResult } from './evaluator/scorer';
import { loadFixtures, selectFixtures } from './fixtures';
import { runLivePortfolioEntryHarness } from './live/live-runner';
import { createDeterministicBaselineCandidateManifest } from './manifests/candidate-manifest';
import { createContractManifest } from './manifests/contract-manifest';
import { writeReport } from './report';
import type { CaseRunResult, EvaluatedCaseResult, HarnessRun, PortfolioEntryAgentAdapter } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const runsRoot = path.join(repoRoot, 'tmp', 'ai-harness', 'portfolio-entry', 'runs');

type RunnerOptions = {
  adapter?: 'deterministic' | 'live';
  caseId?: string;
  suite?: string;
  type?: 'single_turn' | 'multi_turn';
  repeat: number;
  maxCases?: number;
  candidateId?: string;
};

export async function runPortfolioEntryHarness(
  options: RunnerOptions,
  adapter: PortfolioEntryAgentAdapter = new ExperimentalPortfolioEntryAgent(),
): Promise<{ run: HarnessRun; rawResults: CaseRunResult[]; evaluatedResults: EvaluatedCaseResult[]; outputDir: string }> {
  const fixtures = selectFixtures(loadFixtures(), { caseId: options.caseId, suite: options.suite });
  if (fixtures.length === 0) {
    throw new Error(`No fixtures matched ${options.caseId ? `case ${options.caseId}` : `suite ${options.suite}`}.`);
  }

  const run: HarnessRun = {
    run_id: createRunId(),
    timestamp: new Date().toISOString(),
    cases: fixtures.map((fixture) => fixture.case_id),
    repeat_count: options.repeat,
    agent_implementation_version: 'portfolio-entry-experimental-v0.1',
    model: null,
  };
  const outputDir = path.join(runsRoot, run.run_id);
  fs.mkdirSync(outputDir, { recursive: true });

  const rawResults: CaseRunResult[] = [];
  const evaluatedResults: EvaluatedCaseResult[] = [];

  for (const fixture of fixtures) {
    for (let runIndex = 1; runIndex <= options.repeat; runIndex += 1) {
      const entryId = `${fixture.case_id}-${run.run_id}-${runIndex}`;
      const start = performance.now();
      try {
        const rawOutput = await adapter.analyze({ entryId, rawInput: fixture.input });
        const duration = Math.round(performance.now() - start);
        const rawResult: CaseRunResult = {
          case_id: fixture.case_id,
          run_index: runIndex,
          input: fixture.input,
          raw_output: rawOutput,
          execution_status: 'completed',
          duration_ms: duration,
        };
        rawResults.push(rawResult);
        const hardChecks = evaluateHardChecks(fixture, rawOutput);
        evaluatedResults.push(scoreResult(fixture, rawOutput, hardChecks, runIndex));
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        rawResults.push({
          case_id: fixture.case_id,
          run_index: runIndex,
          input: fixture.input,
          raw_output: null,
          execution_status: 'failed',
          duration_ms: duration,
          error: error instanceof Error ? error.message : String(error),
        });
        evaluatedResults.push({
          case_id: fixture.case_id,
          run_index: runIndex,
          result: 'FAIL',
          hard_fail: true,
          hard_checks: [{ id: 'HC-10', passed: false, message: 'Execution failed before schema validation.', failure_code: 'F-EXECUTION' }],
          automatic_score: 0,
          human_review_required: false,
          failure_codes: ['F-EXECUTION'],
          notes: [error instanceof Error ? error.message : String(error)],
        });
      }
    }
  }

  persistRun(outputDir, run, rawResults, evaluatedResults);
  writeReport(run, evaluatedResults, outputDir);
  return { run, rawResults, evaluatedResults, outputDir };
}

function persistRun(outputDir: string, run: HarnessRun, rawResults: CaseRunResult[], evaluatedResults: EvaluatedCaseResult[]): void {
  const contractManifest = createContractManifest();
  const candidateManifest = createDeterministicBaselineCandidateManifest({
    candidateId: run.agent_implementation_version,
  });

  fs.writeFileSync(path.join(outputDir, 'run.json'), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'contract-manifest.json'), `${JSON.stringify(contractManifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'candidate.json'), `${JSON.stringify(candidateManifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'raw-results.jsonl'), `${rawResults.map((result) => JSON.stringify(result)).join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'evaluated-results.json'), `${JSON.stringify(evaluatedResults, null, 2)}\n`, 'utf8');
}

function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function parseArgs(argv: string[]): RunnerOptions {
  const options: RunnerOptions = { adapter: 'deterministic', repeat: 1 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--adapter') {
      const adapter = argv[++index];
      if (adapter !== 'deterministic' && adapter !== 'live') throw new Error('--adapter must be deterministic or live.');
      options.adapter = adapter;
    } else if (arg === '--case') options.caseId = argv[++index];
    else if (arg === '--suite') options.suite = argv[++index];
    else if (arg === '--type') {
      const type = argv[++index];
      if (type !== 'single_turn' && type !== 'multi_turn') throw new Error('--type must be single_turn or multi_turn.');
      options.type = type;
    }
    else if (arg === '--repeat') options.repeat = Number(argv[++index]);
    else if (arg === '--max-cases') options.maxCases = Number(argv[++index]);
    else if (arg === '--candidate-id') options.candidateId = argv[++index];
    else if (arg === 'all') continue;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.caseId && options.suite) throw new Error('Use either --case or --suite, not both.');
  if (!Number.isInteger(options.repeat) || options.repeat < 1) throw new Error('--repeat must be a positive integer.');
  if (options.maxCases !== undefined && (!Number.isInteger(options.maxCases) || options.maxCases < 1)) throw new Error('--max-cases must be a positive integer.');
  if (options.adapter === 'deterministic' && options.type) throw new Error('--type is only supported with --adapter live.');
  if (options.adapter === 'deterministic' && options.maxCases) throw new Error('--max-cases is only supported with --adapter live.');
  if (options.adapter === 'deterministic' && options.candidateId) throw new Error('--candidate-id is only supported with --adapter live.');
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const runPromise = options.adapter === 'live'
    ? runLivePortfolioEntryHarness({
      caseId: options.caseId,
      suite: options.suite,
      type: options.type,
      repeat: options.repeat,
      maxCases: options.maxCases,
      candidateId: options.candidateId,
    }).then(({ run, evaluatedResults, outputDir }) => ({
      run: {
        run_id: String(run.run_id),
      },
      evaluatedResults: evaluatedResults.map((result) => ({
        result: result.contract_result,
      })),
      outputDir,
    }))
    : runPortfolioEntryHarness(options);

  runPromise
    .then(({ run, evaluatedResults, outputDir }) => {
      const pass = evaluatedResults.filter((result) => result.result === 'PASS').length;
      const review = evaluatedResults.filter((result) => result.result === 'REVIEW').length;
      const fail = evaluatedResults.filter((result) => result.result === 'FAIL').length;
      console.log(`Portfolio Entry harness run ${run.run_id}`);
      console.log(`PASS ${pass} REVIEW ${review} FAIL ${fail}`);
      console.log(`Artifacts: ${outputDir}`);
      if (fail > 0) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
