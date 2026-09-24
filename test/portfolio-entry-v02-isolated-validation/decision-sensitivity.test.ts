import { describe, expect, it } from 'vitest';
import fixtures from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_SENSITIVITY_FIXTURES_v0.1.json';
import { runDecisionReadinessFixture, type DecisionReadinessFixture } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

type SensitivityFixture = DecisionReadinessFixture & {
  expected_dimension: string;
  expected_sensitivity: string;
  expected_answer_shape: string;
  expected_action: string;
};

const development = fixtures.development as SensitivityFixture[];

describe('HYP-005.2 decision sensitivity gate', () => {
  it('distinguishes sensitivity, answer shape and action', () => {
    for (const fixture of development) {
      const run = runDecisionReadinessFixture(fixture);
      const actionGapId = 'gap_id' in run.final.next_action ? run.final.next_action.gap_id : undefined;
      const gap = run.final.candidate_gaps.find((candidate) => candidate.id === actionGapId)
        ?? run.final.candidate_gaps.find((candidate) => candidate.dimension === fixture.expected_dimension);
      expect(gap, fixture.id).toBeTruthy();
      expect(gap?.dimension, fixture.id).toBe(fixture.expected_dimension);
      expect(gap?.decision_sensitivity, fixture.id).toBe(fixture.expected_sensitivity);
      expect(gap?.answer_shape, fixture.id).toBe(fixture.expected_answer_shape);
      expect(run.final.next_action.type, fixture.id).toBe(fixture.expected_action);
      if (gap?.current_decision_dependency === 'BLOCKING' || gap?.current_decision_dependency === 'CONSTRAINING') {
        expect(gap.counterfactual_decision_test.plausible_answer_a, fixture.id).toBeTruthy();
        expect(gap.counterfactual_decision_test.plausible_answer_b, fixture.id).toBeTruthy();
        expect(['YES', 'NO', 'UNCLEAR']).toContain(gap.counterfactual_decision_test.decision_branching);
      }
    }
  });

  it('keeps sensitivity and action stable across semantic pairs', () => {
    for (const pair of fixtures.paired_controls) {
      const runs = pair.cases.map((fixture) => runDecisionReadinessFixture(fixture as DecisionReadinessFixture));
      const gaps = runs.map((run) => run.final.selected_gap ?? run.final.candidate_gaps[0]);
      expect(gaps.every(Boolean), pair.pair_id).toBe(true);
      expect(gaps.map((gap) => gap?.decision_sensitivity), pair.pair_id).toEqual([pair.expected_sensitivity, pair.expected_sensitivity]);
      expect(runs.map((run) => run.final.next_action.type), pair.pair_id).toEqual([pair.expected_action, pair.expected_action]);
    }
  });
});
