import { describe, expect, it } from 'vitest';
import fixtures from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_ADVERSARIAL_FIXTURES_v0.1.json';
import { runDecisionReadinessFixture, type DecisionReadinessFixture } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

const development = fixtures.development as (DecisionReadinessFixture & { expected_dimension: string; expected_final_action: string; pair_id?: string })[];
const newHoldout = fixtures.new_holdout as (DecisionReadinessFixture & { expected_dimension: string; expected_final_action: string })[];

const observedDimensions = (run: ReturnType<typeof runDecisionReadinessFixture>) => [
  ...run.evaluations.map((evaluation) => evaluation.selected_gap?.dimension),
  ...run.evaluations.flatMap((evaluation) => evaluation.candidate_gaps.map((gap) => gap.dimension)),
];

describe('HYP-005 adversarial expansion', () => {
  it('runs all new adversarial development cases and preserves structured traces', () => {
    const runs = development.map(runDecisionReadinessFixture);
    expect(runs).toHaveLength(18);
    expect(runs.every((run) => run.violations.length === 0)).toBe(true);
    expect(runs.every((run) => run.evaluations.every((evaluation) => evaluation.rationale_trace.at(-1)?.reconsidered_dimensions.length === 5))).toBe(true);

    const strictPasses = runs.filter((run, index) => {
      const fixture = development[index];
      const finalAction = run.final.next_action.type;
      return observedDimensions(run).includes(fixture.expected_dimension) && finalAction === fixture.expected_final_action;
    });
    // HYP-005.1 intentionally records four changed legacy expectations: the
    // last-mile rule now asks instead of routing for two technical/adoption
    // cases and the capacity pair. The frozen fixtures remain unchanged.
    expect(strictPasses).toHaveLength(15);
  });

  it('keeps paired wording semantically aligned', () => {
    const groups = new Map<string, ReturnType<typeof runDecisionReadinessFixture>[]>();
    development.filter((fixture) => fixture.pair_id).forEach((fixture) => {
      const run = runDecisionReadinessFixture(fixture);
      const current = groups.get(fixture.pair_id!) ?? [];
      current.push(run);
      groups.set(fixture.pair_id!, current);
    });
    for (const runs of groups.values()) {
      expect(runs).toHaveLength(2);
      expect(runs[0].final.next_action.type).toBe(runs[1].final.next_action.type);
      expect(runs[0].final.candidate_gaps.map((gap) => gap.dimension)).toEqual(runs[1].final.candidate_gaps.map((gap) => gap.dimension));
    }
  });

  it('executes new holdouts without rewriting their expectations', () => {
    const runs = newHoldout.map(runDecisionReadinessFixture);
    expect(runs).toHaveLength(3);
    expect(runs.every((run) => run.violations.length === 0)).toBe(true);
    // The pass/fail comparison is reported as evidence; this test only asserts
    // that the frozen holdouts execute and remain observable.
    expect(runs.map((run) => run.case_id)).toEqual(['ADV-HO-01', 'ADV-HO-02', 'ADV-HO-03']);
  });
});
