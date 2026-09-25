import { describe, expect, it } from 'vitest';
import { cases, counterfactualRelation } from './later-work-relationship-fixtures';

describe('PORTFOLIO_ENTRY later-work relationship stabilization', () => {
  it('passes the frozen CR-ADV-05 and five focused controls', () => {
    expect(cases).toHaveLength(6);
    expect(cases.map(counterfactualRelation)).toEqual(cases.map((item) => item.expected));
  });

  it('keeps current_open_items restricted to current decision relations', () => {
    const currentRelations: Relation[] = ['CURRENT_DECISION_BLOCKER', 'CURRENT_DECISION_CONDITION'];
    expect(cases.filter((item) => !currentRelations.includes(counterfactualRelation(item)) && !item.currentDecisionComplete)).toEqual([]);
  });
});
