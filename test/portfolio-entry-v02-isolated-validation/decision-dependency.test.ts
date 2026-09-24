import { describe, expect, it } from 'vitest';
import fixtures from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_DEPENDENCY_FIXTURES_v0.1.json';
import { runDecisionReadinessFixture, type DecisionReadinessFixture } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

const cases = fixtures.development as (DecisionReadinessFixture & {
  expected_dimension: string;
  expected_dependency: string;
  expected_answerability: string;
  expected_action: string;
  expected_execution_classification: string;
})[];

describe('HYP-005.1 decision dependency', () => {
  it('classifies dependency and answerability before routing', () => {
    for (const fixture of cases) {
      const run = runDecisionReadinessFixture(fixture);
      const actionGapId = run.final.next_action.type === 'ASK' || run.final.next_action.type === 'REQUIRE_ORGANIZATIONAL_INPUT' || run.final.next_action.type === 'ROUTE'
        ? run.final.next_action.gap_id
        : undefined;
      const gap = run.final.candidate_gaps.find((candidate) => candidate.id === actionGapId)
        ?? run.final.candidate_gaps.find((candidate) => candidate.dimension === fixture.expected_dimension);
      expect(gap, fixture.id).toBeTruthy();
      expect(gap?.current_decision_dependency, fixture.id).toBe(fixture.expected_dependency);
      expect(gap?.answerability, fixture.id).toBe(fixture.expected_answerability);
      expect(gap?.execution_gap_classification, fixture.id).toBe(fixture.expected_execution_classification);
      expect(run.final.next_action.type, fixture.id).toBe(fixture.expected_action);
    }
  });

  it('keeps semantic blocker and later-stage pairs aligned', () => {
    for (const pair of fixtures.paired_controls) {
      const runs = pair.cases.map((fixture) => runDecisionReadinessFixture(fixture as DecisionReadinessFixture));
      const gaps = runs.map((run) => run.final.candidate_gaps.find((candidate) => candidate.current_decision_dependency === pair.expected_dependency));
      expect(gaps.every(Boolean), pair.pair_id).toBe(true);
      expect(gaps.map((gap) => gap?.current_decision_dependency), pair.pair_id).toEqual([pair.expected_dependency, pair.expected_dependency]);
      expect(runs.map((run) => run.final.next_action.type), pair.pair_id).toEqual([pair.expected_action, pair.expected_action]);
    }
  });
});
