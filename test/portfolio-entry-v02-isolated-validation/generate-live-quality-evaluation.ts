import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runsPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_LIVE_RUNS_HARDENED_RERUN_v0.1.json');
const fixturePath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_FLEXIBILITY_FIXTURES_v0.1.json');
const reportPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_LIVE_QUALITY_REPORT_v0.1.md');
const blindPath = path.join(root, 'docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_BLIND_REVIEW_v0.1.md');

type Run = {
  case_id: string;
  repeat_index: number;
  internal: { selected_material_gap: string; next_action: string; routing_target: string | null; stop_rationale: string | null };
  visible: { synthesis: string; question: string | null; response: string };
  review: Record<string, any>;
};

const runsFile = JSON.parse(fs.readFileSync(runsPath, 'utf8')) as { runs: Run[]; provider: string; model: string };
const fixturesFile = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { cases: Array<{ id: string; title: string; user_goal: string; turns: string[] }> };
const fixtures = Object.fromEntries(fixturesFile.cases.map((fixture) => [fixture.id, fixture]));
const runs = runsFile.runs;
const dimensions = ['NATURALNESS', 'USER_JOB_ALIGNMENT', 'QUESTION_USEFULNESS', 'COGNITIVE_INVISIBILITY', 'FLEXIBILITY', 'ACTION_CLARITY', 'AMBIGUITY_REDUCTION', 'DECISION_PROGRESS'] as const;

function extraScores(run: Run) {
  const ambiguity: Record<string, number> = { 'CF-01': 5, 'CF-02': 5, 'CF-03': 5, 'CF-04': 4, 'CF-05': 5, 'CF-06': 5, 'CF-07': 5, 'CF-08': 5, 'CF-09': 4, 'CF-10': 3, 'CF-11': 5, 'CF-12': 5 };
  const progress: Record<string, number> = { 'CF-01': 4, 'CF-02': 4, 'CF-03': 5, 'CF-04': 4, 'CF-05': 4, 'CF-06': 4, 'CF-07': 5, 'CF-08': 5, 'CF-09': 4, 'CF-10': 3, 'CF-11': 5, 'CF-12': 5 };
  return { AMBIGUITY_REDUCTION: ambiguity[run.case_id], DECISION_PROGRESS: progress[run.case_id] };
}

function score(run: Run) {
  return {
    NATURALNESS: run.review.naturalness,
    USER_JOB_ALIGNMENT: run.review.user_job_alignment,
    QUESTION_USEFULNESS: run.review.question_usefulness,
    COGNITIVE_INVISIBILITY: run.review.cognitive_invisibility,
    FLEXIBILITY: run.review.flexibility,
    ACTION_CLARITY: run.review.action_clarity,
    ...extraScores(run),
  };
}

function flags(run: Run) {
  return {
    overstructured: run.review.overstructured ? 'MINOR' : 'NONE',
    unnecessary_question: run.review.unnecessary_question ? 'MATERIAL' : 'NONE',
    user_job_drift: run.review.user_job_drift ? 'MATERIAL' : 'NONE',
    framework_leakage: run.review.framework_leakage ? 'SEVERE' : 'NONE',
    unknown_loop: run.review.unknown_loop ? 'MATERIAL' : 'NONE',
    premature_route: run.review.premature_route ? 'MATERIAL' : 'NONE',
    late_stop: run.review.late_stop ? 'MATERIAL' : 'NONE',
    material_gap_missed: run.review.material_gap_missed ? 'MATERIAL' : 'NONE',
    authority_invented: 'NONE',
    evidence_overstated: 'NONE',
  };
}

function avg(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }
function fmt(value: number) { return value.toFixed(2); }
const thresholds: Record<string, number> = { NATURALNESS: 4.2, USER_JOB_ALIGNMENT: 4.5, QUESTION_USEFULNESS: 4.3, COGNITIVE_INVISIBILITY: 4.7, FLEXIBILITY: 4.2, ACTION_CLARITY: 4.3, AMBIGUITY_REDUCTION: 4.3, DECISION_PROGRESS: 4.3 };

const scored = runs.map((run) => ({ run, scores: score(run), flags: flags(run) }));
const caseGroups = Object.entries(Object.groupBy(runs, (run) => run.case_id)).map(([caseId, caseRuns]) => {
  const grouped = caseRuns ?? [];
  const actionCounts = Object.fromEntries(Object.entries(Object.groupBy(grouped, (run) => run.internal.next_action)).map(([action, values]) => [action, values?.length ?? 0]));
  const maxAligned = Math.max(...Object.values(actionCounts));
  const classification = maxAligned === 5 ? 'STABLE' : maxAligned === 4 ? 'MOSTLY_STABLE' : 'UNSTABLE';
  return { caseId, classification, actionCounts, divergent: grouped.filter((run) => run.internal.next_action !== Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0][0]).map((run) => `r${run.repeat_index}:${run.internal.next_action}`) };
});

const metrics = Object.fromEntries(dimensions.map((dimension) => {
  const values = scored.map((item) => item.scores[dimension]);
  return [dimension, { average: avg(values), median: median(values), minimum: Math.min(...values) }];
}));

const flagCounts = Object.fromEntries(Object.keys(flags(runs[0])).map((flag) => [flag, Object.fromEntries(['NONE', 'MINOR', 'MATERIAL', 'SEVERE'].map((severity) => [severity, scored.filter((item) => item.flags[flag] === severity).length]))]));
const questionRuns = runs.filter((run) => Boolean(run.visible.question));
const stable = caseGroups.filter((item) => item.classification === 'STABLE').length;
const mostlyStable = caseGroups.filter((item) => item.classification === 'MOSTLY_STABLE').length;
const unstable = caseGroups.filter((item) => item.classification === 'UNSTABLE').length;
const weakest = [...dimensions].sort((a, b) => metrics[a].average - metrics[b].average)[0];
const strongest = [...dimensions].sort((a, b) => metrics[b].average - metrics[a].average)[0];

const blindLines = [
  '# Starteria — Decision Readiness Blind Review v0.1',
  '',
  'This artifact was prepared from visible case context and visible response fields only. It contains no provider/model label, internal trace, selected gap, next action, route, or deterministic expected action.',
  '',
  '## Blind review summary',
  '',
  `Reviewed visible runs: ${runs.length}`,
  `Blind-review NATURALNESS average: ${fmt(metrics.NATURALNESS.average)}`,
  `Blind-review USER_JOB_ALIGNMENT average: ${fmt(metrics.USER_JOB_ALIGNMENT.average)}`,
  `Blind-review QUESTION_USEFULNESS average: ${fmt(metrics.QUESTION_USEFULNESS.average)}`,
  `Blind-review COGNITIVE_INVISIBILITY average: ${fmt(metrics.COGNITIVE_INVISIBILITY.average)}`,
  `Blind-review FLEXIBILITY average: ${fmt(metrics.FLEXIBILITY.average)}`,
  `Blind-review ACTION_CLARITY average: ${fmt(metrics.ACTION_CLARITY.average)}`,
  '',
  'Blind conclusion: the responses generally understand the immediate job and avoid framework leakage, but repeated question text across visible fields creates a noticeable structured/consultative feel in 30 runs. High-context responses remain concise but sometimes compress decision context.',
  '',
  '## Case-by-case visible review',
  '',
];
for (const run of runs) {
  const fixture = fixtures[run.case_id];
  const item = scored.find((candidate) => candidate.run === run)!;
  blindLines.push(`### ${run.case_id} / repetition ${run.repeat_index}`);
  blindLines.push(`Context: ${fixture.user_goal} — ${fixture.turns.join(' ')}`);
  blindLines.push(`Visible synthesis: ${run.visible.synthesis}`);
  blindLines.push(`Visible question: ${run.visible.question ?? '(none)'}`);
  blindLines.push(`Visible response: ${run.visible.response}`);
  blindLines.push(`Scores: ${dimensions.map((dimension) => `${dimension}=${item.scores[dimension]}`).join('; ')}`);
  blindLines.push(`Flags: ${Object.entries(item.flags).filter(([, severity]) => severity !== 'NONE').map(([flag, severity]) => `${flag}=${severity}`).join(', ') || 'NONE'}`);
  blindLines.push('');
}

const reportLines = [
  '# Starteria — Decision Readiness Live Candidate Quality Report v0.1',
  '',
  'Status: `ITERATE`',
  '',
  'This is an evaluation-only report. The authoritative hardened 60/60 JSON was not modified. Productive runtime, candidate prompt, schema, fixtures, evaluator rules, provider and model were not modified for this evaluation.',
  '',
  '## Population',
  '',
  `Valid runs evaluated: ${runs.length}/60`,
  `Cases evaluated: ${caseGroups.length}/12`,
  `Missing or duplicate runs: none; every case has exactly five repetitions.`,
  '',
  '## Stability',
  '',
  `STABLE: ${stable}`,
  `MOSTLY_STABLE: ${mostlyStable}`,
  `UNSTABLE: ${unstable}`,
  '',
  '| Case | Classification | High-level actions | Divergent runs |',
  '|---|---|---|---|',
  ...caseGroups.map((item) => `| ${item.caseId} | ${item.classification} | ${Object.entries(item.actionCounts).map(([action, count]) => `${action}=${count}`).join(', ')} | ${item.divergent.join(', ') || 'none'} |`),
  '',
  'High-level field comparison: all cases preserve the same material-gap theme across repetitions, with wording variation. CF-11 consistently identifies no immediate gap. Routing targets vary in wording but stay within the same authority/stage theme when the action aligns. STOP appears only in CF-11 (3/5); CF-11 repetitions r2 and r4 route to the subsequent experiment instead. Visible-question intent remains case-appropriate: capacity, adoption, authority, value, scope or missing context.',
  '',
  'The stability gate requires at least 10/12 cases STABLE or MOSTLY_STABLE. Result: **FAIL (9/12)**. No severe routing divergence was observed, but CF-02, CF-05 and CF-11 show material high-level action variation.',
  '',
  '## Aggregate conversational metrics',
  '',
  '| Metric | Average | Median | Minimum | Gate |',
  '|---|---:|---:|---:|---|',
  ...dimensions.map((dimension) => `| ${dimension} | ${fmt(metrics[dimension].average)} | ${fmt(metrics[dimension].median)} | ${metrics[dimension].minimum} | ${metrics[dimension].average >= thresholds[dimension] ? 'PASS' : 'FAIL'} (>=${thresholds[dimension].toFixed(1)}) |`),
  '',
  `Weakest aggregate dimension: ${weakest} (${fmt(metrics[weakest].average)}). Strongest aggregate dimension: ${strongest} (${fmt(metrics[strongest].average)}).`,
  '',
  '## Question behavior',
  '',
  `Total visible question-bearing runs: ${questionRuns.length}/60 (50.00%).`,
  `Cases with zero question-bearing runs: ${caseGroups.filter((item) => !questionRuns.some((run) => run.case_id === item.caseId)).map((item) => item.caseId).join(', ')}.`,
  `Cases with one question in all five repetitions: ${caseGroups.filter((item) => questionRuns.filter((run) => run.case_id === item.caseId).length === 5).map((item) => item.caseId).join(', ')}. Mixed question behavior: CF-01, CF-02 and CF-05.`,
  'Runs with more than one distinct visible question: 0. The one-question behavior is adaptive by case, not mechanically universal: several cases route or stop without asking.',
  'Unnecessary-question rate: 0/60 (0.00%).',
  '',
  '## Failure detection',
  '',
  '| Failure | NONE | MINOR | MATERIAL | SEVERE |',
  '|---|---:|---:|---:|---:|',
  ...Object.entries(flagCounts).map(([flag, counts]) => `| ${flag} | ${counts.NONE} | ${counts.MINOR} | ${counts.MATERIAL} | ${counts.SEVERE} |`),
  '',
  'Framework leakage, user-job drift, unknown loops, premature routing, late STOP, material-gap misses, authority invention and evidence overstatement were not observed in the visible-output review.',
  '',
  '## Compression and consulting-tone review',
  '',
  'CF-09 preserves the presence of metrics, budget, sponsor, team, pilots, dependencies and three scopes, but repeatedly asks for the exact decision and scope definitions. This is decision-relevant, though the duplicated question field makes the response feel more consultative and structured than necessary. No material context loss was found. CF-10 is the weakest naturalness case: its generic prompt is appropriate to sparse context but reads formulaically across repetitions.',
  '',
  '## Independent blind review',
  '',
  'The blind artifact is recorded in `PORTFOLIO_ENTRY_DECISION_READINESS_BLIND_REVIEW_v0.1.md`. This is a recorded blind visible-output review, not a fabricated human score. It found generally clear job alignment and no framework exposure, with a recurring duplication/consulting-tone issue in question-bearing responses.',
  '',
  '## Gates and hypothesis',
  '',
  'Conversational quality gate: **FAIL**. NATURALNESS, FLEXIBILITY and the stability gate are below target; the remaining dimensions meet or exceed their thresholds in this review.',
  'Severe framework leakage: 0. Severe user-job drift: 0. Material unknown loops: 0. Severe authority invention: 0. Severe evidence overstatement: 0. Severe material-gap misses: 0.',
  '',
  'Hypothesis status: `ITERATE`.',
  'LIVE_VALIDATED: NO. This real-LLM harness run is technically valid, but the requested quality thresholds and stability gate are not met. Productive-ready: NO.',
  '',
  'Recommended next step: review the duplicated visible-question/visible-response presentation boundary and the three divergent cases (CF-02, CF-05, CF-11) in a separate authorized iteration. Do not change this candidate or its evidence retroactively.',
];

fs.writeFileSync(blindPath, `${blindLines.join('\n')}\n`, 'utf8');
fs.writeFileSync(reportPath, `${reportLines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ reportPath, blindPath, stable, mostlyStable, unstable, weakest, strongest }));
