import { describe, expect, it } from 'vitest';
import fixtures from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_DECISION_READINESS_FIXTURES_v0.1.json';
import { runDecisionReadinessFixture, summarizeBaselineContrast, type DecisionReadinessFixture } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

const development = fixtures.development as DecisionReadinessFixture[];
const holdout = fixtures.holdout as DecisionReadinessFixture[];

describe('HYP-005 deterministic Decision Readiness adapter', () => {
  it('runs all development fixtures without exact question wording', () => {
    const runs = development.map(runDecisionReadinessFixture);
    expect(runs).toHaveLength(5);
    expect(runs.every((run) => run.violations.length === 0)).toBe(true);
    expect(runs.every((run) => run.evaluations.every((evaluation) => evaluation.rationale_trace.at(-1)?.reconsidered_dimensions.length === 5))).toBe(true);

    const byId = Object.fromEntries(runs.map((run) => [run.case_id, run]));
    expect(byId['DR-01'].evaluations[0].selected_gap?.dimension).toBe('EXECUTION_REALITY');
    expect(byId['DR-02'].evaluations[0].selected_gap?.dimension).toBe('RELEVANCE');
    expect(byId['DR-03'].evaluations[1].selected_gap?.dimension).toBe('EXECUTION_REALITY');
    expect(byId['DR-04'].evaluations[1].next_action.type).toBe('REQUIRE_ORGANIZATIONAL_INPUT');
    expect(byId['DR-04'].final.next_action).toEqual({ type: 'REQUIRE_ORGANIZATIONAL_INPUT', gap_id: 'decision-authority' });
    expect(byId['DR-05'].final.next_action.type).toBe('REQUIRE_ORGANIZATIONAL_INPUT');
  });

  it('keeps unknowns out of ASK_NOW loops', () => {
    const run = runDecisionReadinessFixture(holdout.find((item) => item.id === 'H5-HO-B')!);
    expect(run.violations).toEqual([]);
    expect(run.evaluations.some((evaluation) => evaluation.next_action.type === 'REQUIRE_ORGANIZATIONAL_INPUT')).toBe(true);
    expect(run.evaluations.at(-1)?.next_action.type).not.toBe('ASK');
  });

  it('stops early when only later-stage detail remains', () => {
    const run = runDecisionReadinessFixture(holdout.find((item) => item.id === 'H5-HO-C')!);
    expect(run.violations).toEqual([]);
    expect(['STOP', 'ROUTE']).toContain(run.final.next_action.type);
    expect(run.final.candidate_gaps.some((gap) => gap.resolution_type === 'DEFER_TO_LATER_STAGE')).toBe(true);
  });

  it('prioritizes execution over strategy in the non-strategy holdout', () => {
    const run = runDecisionReadinessFixture(holdout.find((item) => item.id === 'H5-HO-A')!);
    expect(run.evaluations[1].candidate_gaps.some((gap) => gap.dimension === 'EXECUTION_REALITY')).toBe(true);
    expect(run.evaluations[1].selected_gap?.dimension).toBe('EXECUTION_REALITY');
  });

  it('exposes a baseline contrast without claiming live validation', () => {
    expect(summarizeBaselineContrast(development[0])).toContain('baseline has no structured cross-dimension trace');
  });
});
