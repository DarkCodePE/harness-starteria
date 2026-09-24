import { describe, expect, it } from 'vitest';
import fixtures from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_COUNTERFACTUAL_BRANCH_FIXTURES_v0.1.json';
import capacity from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CAPACITY_BLOCKING_v0.2.1.json';
import laterCapacity from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_CAPACITY_FIXTURES_v0.2.json';
import { runDecisionReadinessFixture, type DecisionReadinessFixture } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

type BranchFixture = DecisionReadinessFixture & { expected_branch: string; expected_dependency: string; expected_sensitivity: string };
const gapFor = (run: ReturnType<typeof runDecisionReadinessFixture>, fixture: BranchFixture) => run.final.candidate_gaps.find((gap) => gap.decision_branch_type === fixture.expected_branch) ?? run.final.selected_gap;

describe('HYP-005.3 counterfactual branch classification', () => {
  it('uses consequence branches for dependency and sensitivity', () => {
    for (const fixture of fixtures.cases as BranchFixture[]) {
      const run = runDecisionReadinessFixture(fixture);
      const gap = gapFor(run, fixture);
      expect(gap, fixture.id).toBeTruthy();
      expect(gap?.decision_branch_type, fixture.id).toBe(fixture.expected_branch);
      expect(gap?.current_decision_dependency, fixture.id).toBe(fixture.expected_dependency);
      expect(gap?.decision_sensitivity, fixture.id).toBe(fixture.expected_sensitivity);
      expect(run.violations, fixture.id).toEqual([]);
    }
  });

  it('passes unchanged CAP blocking and later-stage fixtures', () => {
    const blocking = runDecisionReadinessFixture((capacity.development[0]) as DecisionReadinessFixture);
    const blockingGap = blocking.final.candidate_gaps.find((gap) => gap.dimension === 'EXECUTION_REALITY');
    expect(blocking.final.next_action.type).toBe('ASK');
    expect(blockingGap?.current_decision_dependency).toBe('BLOCKING');
    expect(blockingGap?.decision_sensitivity).toBe('HIGH');
    expect(['ENABLEMENT_CHANGE', 'ROUTE_CHANGE']).toContain(blockingGap?.decision_branch_type);
    expect(blockingGap?.answerability).toBe('USER_CAN_ANSWER');

    const later = runDecisionReadinessFixture((laterCapacity.development[1]) as DecisionReadinessFixture);
    expect(['ROUTE', 'STOP']).toContain(later.final.next_action.type);
    expect(later.final.candidate_gaps.some((gap) => gap.decision_branch_type === 'NO_MATERIAL_CHANGE' && gap.current_decision_dependency === 'NON_BLOCKING' && gap.decision_sensitivity === 'LOW')).toBe(true);
  });
});
