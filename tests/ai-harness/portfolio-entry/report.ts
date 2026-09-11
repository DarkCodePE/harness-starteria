import fs from 'node:fs';
import path from 'node:path';
import type { EvaluatedCaseResult, HarnessRun } from './types';

export function writeReport(run: HarnessRun, results: EvaluatedCaseResult[], outputDir: string): string {
  const counts = {
    PASS: results.filter((result) => result.result === 'PASS').length,
    REVIEW: results.filter((result) => result.result === 'REVIEW').length,
    FAIL: results.filter((result) => result.result === 'FAIL').length,
  };
  const hardFails = results.filter((result) => result.hard_fail).length;
  const failurePatternLines = buildFailurePatternLines(results);
  const caseLines = results.map((result) => {
    const codes = result.failure_codes.length ? ` (${result.failure_codes.join(', ')})` : '';
    return `${result.case_id} run ${result.run_index}: ${result.result}${codes}`;
  });
  const stabilityLines = buildStabilityLines(results);

  const report = [
    'PORTFOLIO ENTRY HARNESS RUN',
    '',
    `Run ID: ${run.run_id}`,
    `Date: ${run.timestamp}`,
    `Cases: ${run.cases.length}`,
    `Repeat count: ${run.repeat_count}`,
    `Model: ${run.model ?? 'none'}`,
    `Agent version: ${run.agent_implementation_version}`,
    '',
    'SUMMARY',
    `PASS: ${counts.PASS}`,
    `REVIEW: ${counts.REVIEW}`,
    `FAIL: ${counts.FAIL}`,
    `Hard fails: ${hardFails}`,
    '',
    'FAILURE PATTERNS',
    ...(failurePatternLines.length ? failurePatternLines : ['None']),
    '',
    'STABILITY',
    ...(stabilityLines.length ? stabilityLines : ['Not applicable']),
    '',
    'CASE RESULTS',
    ...caseLines,
    '',
    'HUMAN REVIEW',
    'Intent quality: [ ] 0 [ ] 1 [ ] 2',
    'Question quality: [ ] 0 [ ] 1 [ ] 2',
    'UX synthesis: [ ] 0 [ ] 1 [ ] 2',
    'Reviewer notes:',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(outputDir, 'REPORT.md'), report, 'utf8');
  return report;
}

function buildFailurePatternLines(results: EvaluatedCaseResult[]): string[] {
  const counts = new Map<string, number>();
  for (const result of results) {
    for (const code of result.failure_codes) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([code, count]) => `${code}: ${count}`);
}

function buildStabilityLines(results: EvaluatedCaseResult[]): string[] {
  const byCase = new Map<string, EvaluatedCaseResult[]>();
  for (const result of results) {
    byCase.set(result.case_id, [...(byCase.get(result.case_id) ?? []), result]);
  }
  return [...byCase.entries()]
    .filter(([, caseResults]) => caseResults.length > 1)
    .map(([caseId, caseResults]) => {
      const signature = new Set(caseResults.map((result) => `${result.result}:${result.failure_codes.join('|')}`));
      return `${caseId}: ${signature.size === 1 ? 'STABLE' : 'REVIEW'}`;
    });
}
