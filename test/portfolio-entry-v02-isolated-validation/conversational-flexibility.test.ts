import { describe, expect, it } from 'vitest';
import fixtures from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSATIONAL_FLEXIBILITY_FIXTURES_v0.1.json';
import { runDecisionReadinessFixture, type DecisionReadinessFixture } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

type Review = { naturalness: number; user_job_alignment: number; question_usefulness: number; cognitive_invisibility: number; flexibility: number; action_clarity: number };
type ConversationalFixture = DecisionReadinessFixture & { user_goal: string; assistant_visible_turns: string[]; user_response: string; next_assistant_turn: string; review: Review };

const forbiddenVisibleLanguage = [
  /decision dependency/i,
  /dependencia de decision/i,
  /sensitivity/i,
  /sensibilidad/i,
  /branch type/i,
  /tipo de rama/i,
  /counterfactual/i,
  /contrafactual/i,
  /\brouting\b/i,
];

const questionCount = (text: string) => (text.match(/\?/g) ?? []).length;

describe('HYP-005 conversational flexibility and clarity-to-action', () => {
  it('keeps internal reasoning invisible and visible turns simple', () => {
    for (const fixture of fixtures.cases as ConversationalFixture[]) {
      const run = runDecisionReadinessFixture(fixture);
      const visible = fixture.assistant_visible_turns.join(' ');
      expect(run.case_id, fixture.id).toBe(fixture.id);
      expect(forbiddenVisibleLanguage.some((pattern) => pattern.test(visible)), fixture.id).toBe(false);
      expect(fixture.assistant_visible_turns.every((turn) => questionCount(turn) <= 1), fixture.id).toBe(true);
      expect(fixture.review.naturalness).toBeGreaterThanOrEqual(1);
      expect(fixture.review.naturalness).toBeLessThanOrEqual(5);
      expect(fixture.review.action_clarity).toBeGreaterThanOrEqual(1);
      expect(fixture.review.action_clarity).toBeLessThanOrEqual(5);
    }
  });

  it('covers the required conversational situations', () => {
    expect((fixtures.cases as ConversationalFixture[])).toHaveLength(12);
    expect((fixtures.cases as ConversationalFixture[]).map((fixture) => fixture.id)).toEqual([
      'CF-01', 'CF-02', 'CF-03', 'CF-04', 'CF-05', 'CF-06', 'CF-07', 'CF-08', 'CF-09', 'CF-10', 'CF-11', 'CF-12',
    ]);
  });
});
