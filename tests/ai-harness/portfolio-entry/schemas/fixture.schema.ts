import { z } from 'zod';
import type { Fixture as LegacyFixtureV01 } from '../types';
import { multiTurnFixtureV2Schema, type MultiTurnFixtureV2 } from './session-fixture.schema';
import { singleTurnFixtureV2Schema, type SingleTurnFixtureV2 } from './single-turn-fixture.schema';

export const portfolioEntryFixtureV2Schema = z.discriminatedUnion('case_type', [
  singleTurnFixtureV2Schema,
  multiTurnFixtureV2Schema,
]);

export type PortfolioEntryFixtureV2 = z.infer<typeof portfolioEntryFixtureV2Schema>;

export type ProjectedLegacyFixtureV01 = {
  fixture_version: '0.1';
  case_type: 'single_turn';
  case_id: string;
  suite: string;
  name: string;
  input: string;
  expected: {
    initial_entry_state?: string[];
    current_frame?: string[];
    primary_intent?: string[];
    secondary_intents_any_of?: string[];
    reverse_alignment_required?: boolean;
    max_questions: number;
  };
  source_fixture: LegacyFixtureV01;
};

export function projectLegacyFixtureToV2Compatibility(fixture: LegacyFixtureV01): ProjectedLegacyFixtureV01 {
  return {
    fixture_version: '0.1',
    case_type: 'single_turn',
    case_id: fixture.case_id,
    suite: fixture.suite,
    name: fixture.name,
    input: fixture.input,
    expected: {
      initial_entry_state: fixture.expected.entry_state,
      current_frame: fixture.expected.entry_state,
      primary_intent: fixture.expected.primary_intent,
      secondary_intents_any_of: fixture.expected.secondary_intents,
      reverse_alignment_required: fixture.expected.reverse_alignment_required,
      max_questions: fixture.expected.max_questions,
    },
    source_fixture: fixture,
  };
}

export function parsePortfolioEntryFixtureV2(input: unknown): PortfolioEntryFixtureV2 {
  return portfolioEntryFixtureV2Schema.parse(input);
}

export function isMultiTurnFixtureV2(fixture: PortfolioEntryFixtureV2): fixture is MultiTurnFixtureV2 {
  return fixture.case_type === 'multi_turn';
}

export function isSingleTurnFixtureV2(fixture: PortfolioEntryFixtureV2): fixture is SingleTurnFixtureV2 {
  return fixture.case_type === 'single_turn';
}
