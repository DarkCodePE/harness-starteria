import { describe, expect, it } from 'vitest';
import { loadFixtures } from '../fixtures';
import { createDeterministicBaselineCandidateManifest } from '../manifests/candidate-manifest';
import { createContractManifest } from '../manifests/contract-manifest';
import { portfolioEntryAnalysisV2Schema } from '../schemas/analysis.schema';
import { projectLegacyFixtureToV2Compatibility } from '../schemas/fixture.schema';
import { multiTurnFixtureV2Schema } from '../schemas/session-fixture.schema';
import { singleTurnFixtureV2Schema } from '../schemas/single-turn-fixture.schema';

describe('portfolio entry harness v0.2 compatibility boundary', () => {
  it('projects legacy v0.1 entry_state to initial_entry_state and current_frame without rewriting fixtures', () => {
    const fixture = loadFixtures().find((item) => item.case_id === 'PE-B03')!;
    const projected = projectLegacyFixtureToV2Compatibility(fixture);

    expect(projected.fixture_version).toBe('0.1');
    expect(projected.case_type).toBe('single_turn');
    expect(projected.expected.initial_entry_state).toEqual(['solution_first']);
    expect(projected.expected.current_frame).toEqual(['solution_first']);
    expect(projected.source_fixture).toBe(fixture);
  });

  it('validates a v0.2 single-turn fixture shape', () => {
    const parsed = singleTurnFixtureV2Schema.parse({
      fixture_version: '0.2',
      case_id: 'PE2-ST-GOV-01',
      case_type: 'single_turn',
      name: 'Programa con reglas compartidas',
      suite: 'portfolio-governance',
      tags: ['single-turn', 'contract'],
      evidence_role: 'contract',
      linked_findings: ['FND-001'],
      input: 'Tenemos un programa con muchas ideas, pero no esta claro cuales pasan a piloto.',
      expected: {
        initial_entry_state: ['portfolio_first'],
        current_frame: ['portfolio_first'],
        primary_intent: ['portfolio_governance'],
        secondary_intents_any_of: ['portfolio_prioritization'],
        max_questions: 3,
      },
      context_expectations: {
        must_not_invent: ['baseline', 'target'],
      },
      prohibited_behaviors: ['no_canonicalization', 'no_step_activation'],
    });

    expect(parsed.case_type).toBe('single_turn');
    expect(parsed.expected.primary_intent).toEqual(['portfolio_governance']);
  });

  it('validates a v0.2 multi-turn fixture shape without executing it', () => {
    const parsed = multiTurnFixtureV2Schema.parse({
      fixture_version: '0.2',
      case_id: 'PE2-MT-01',
      case_type: 'multi_turn',
      name: 'Problem to initiative',
      suite: 'state-evolution',
      tags: ['multi-turn', 'contract'],
      evidence_role: 'contract',
      initial_user_message: 'Los equipos pierden mucho tiempo haciendo inspecciones.',
      session: {
        initial_mode: 'quick_clarification',
        quick_question_budget: 3,
        exploration_policy: 'not_expected',
      },
      response_rules: [{
        id: 'solution-emerges',
        when_resolves_any: ['expected_change', 'business_intent'],
        response: 'Ya estamos probando una tecnologia para automatizar parte del recorrido.',
      }],
      expected_session: {
        initial_entry_state: ['problem_first'],
        allowed_frame_transitions: [['problem_first', 'initiative_first']],
        late_reverse_alignment_required: true,
        max_quick_questions: 3,
        min_analysis_turns: 2,
        requires_scripted_reanalysis: true,
        handoff_required: true,
      },
      hard_assertions: ['no_initial_state_mutation'],
    });

    expect(parsed.case_type).toBe('multi_turn');
    expect(parsed.expected_session.late_reverse_alignment_required).toBe(true);
    expect(parsed.expected_session.min_analysis_turns).toBe(2);
    expect(parsed.expected_session.requires_scripted_reanalysis).toBe(true);
  });

  it('validates a minimal PortfolioEntryAnalysis v0.2 shape', () => {
    const parsed = portfolioEntryAnalysisV2Schema.parse({
      entry_id: 'entry-1',
      analysis_version: '0.2-test',
      primary_intent: 'portfolio_governance',
      secondary_intents: ['portfolio_prioritization'],
      initial_entry_state: 'portfolio_first',
      current_frame: 'portfolio_first',
      extracted_context: {},
      ambiguities: [],
      contradictions: [],
      reverse_alignment: {
        required: false,
        status: 'not_required',
      },
      provenance: [],
      status: 'ready',
    });

    expect(parsed.initial_entry_state).toBe('portfolio_first');
    expect(parsed.current_frame).toBe('portfolio_first');
  });

  it('creates manifests with real v0.2 contract versions including Skill 03', () => {
    const contractManifest = createContractManifest();
    const candidateManifest = createDeterministicBaselineCandidateManifest();

    expect(contractManifest.contracts.clarification_handoff).toBe('0.2.1');
    expect(contractManifest.contracts.skill_03).toBe('0.2');
    expect(candidateManifest.adapter_mode).toBe('deterministic_baseline');
    expect(candidateManifest.contract_manifest_hash).toHaveLength(64);
  });
});
