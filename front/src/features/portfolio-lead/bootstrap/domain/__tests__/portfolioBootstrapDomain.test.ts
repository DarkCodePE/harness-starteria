import { describe, expect, it } from 'vitest';
import {
  applyProposedMutationToGovernedState,
  canApplyProposedMutation,
  canSetStrategicConnectionStatus,
  canTransitionProvenance,
  deriveAdvancementConditionSeverity,
  derivePortfolioAnchor,
  isForbiddenPortfolioActionLabel,
  portfolioBootstrapFixtures,
  resolveNextBestPortfolioAction,
  resolvePortfolioHomeState,
} from '../index';

const humanConfirmation = {
  confirmedBy: 'portfolio-lead-1',
  confirmedAt: '2026-09-14T10:00:00.000Z',
};

describe('Portfolio Anchor contract', () => {
  it('keeps vague entry context insufficient', () => {
    const anchor = derivePortfolioAnchor({ desiredOutcome: 'innovar mas' });

    expect(anchor.status).toBe('anchor_insufficient');
    expect(anchor.missing).toContain('interpretable_desired_outcome_or_priority');
  });

  it('is sufficient with interpretable priority, minimum context, and proxy business signal', () => {
    const anchor = derivePortfolioAnchor({
      priority: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Ventas y customer success detectan perdida de cuentas medianas durante onboarding.',
      businessSignal: { status: 'proxy', value: 'Tickets y retrasos crecientes', provenance: 'AI_INFERRED' },
    });

    expect(anchor.status).toBe('anchor_provisional');
    expect(anchor.missing).toEqual([]);
  });

  it('does not require baseline, target, sponsor, StrategicFront, Challenge, or confirmed KPI', () => {
    const anchor = derivePortfolioAnchor({
      desiredOutcome: 'Acelerar activacion de cuentas enterprise',
      contextSummary: 'Hay trabajo distribuido en customer success, producto y ventas.',
      decisionToEnable: 'Decidir que iniciativas merecen foco este trimestre',
    });

    expect(anchor.status).toBe('anchor_provisional');
  });

  it('requires resolving critical contradictions before sufficiency', () => {
    const anchor = derivePortfolioAnchor({
      desiredOutcome: 'Expandir enterprise',
      contextSummary: 'Enterprise aparece como foco en una fuente y como area a pausar en otra.',
      businessSignal: { status: 'proxy' },
      criticalContradictions: ['Enterprise priority mismatch'],
    });

    expect(anchor.status).toBe('anchor_insufficient');
    expect(anchor.missing).toContain('critical_contradiction_resolution');
  });

  it('becomes confirmed only through human confirmation', () => {
    const anchor = derivePortfolioAnchor({
      desiredOutcome: 'Reducir abandono en onboarding B2B',
      contextSummary: 'Ventas y customer success detectan perdida de cuentas medianas durante onboarding.',
      businessSignal: { status: 'known', provenance: 'USER_CONFIRMED' },
      humanConfirmation,
    });

    expect(anchor.status).toBe('anchor_confirmed');
  });
});

describe('Portfolio Home states', () => {
  it('maps no resolved anchor to HOME_A', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.vagueEntryNoAnchor)).toBe('HOME_A');
  });

  it('maps provisional anchor to HOME_A even when it is interpretable', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.sufficientProxySignal)).toBe('HOME_A');
  });

  it('maps sufficient anchor with no work to HOME_B', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.confirmedAnchorNoWork)).toBe('HOME_B');
  });

  it('maps detected work with material review pending to HOME_C', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.workDetectedReviewPending)).toBe('HOME_C');
  });

  it('maps first reading without attention to HOME_D', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.firstReadingNoAttention)).toBe('HOME_D');
  });

  it('maps first reading with attention to HOME_E', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.firstReadingWithAttention)).toBe('HOME_E');
  });

  it('maps decision-ready reading to HOME_F', () => {
    expect(resolvePortfolioHomeState(portfolioBootstrapFixtures.decisionReadyReading)).toBe('HOME_F');
  });
});

describe('Next Best Portfolio Action', () => {
  it('prioritizes critical conflicts before any other movement', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.criticalConflict).id).toBe('resolve_information_conflict');
  });

  it('asks to complete the anchor when context is insufficient', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.vagueEntryNoAnchor).id).toBe('complete_portfolio_anchor');
  });

  it('asks to complete the anchor when context is only provisional', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.sufficientProxySignal).id).toBe('complete_portfolio_anchor');
  });

  it('asks to bring existing work when anchor is sufficient and no work exists', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.confirmedAnchorNoWork).id).toBe('bring_existing_work');
  });

  it('asks for proposed structure review when material staging is pending', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.workDetectedReviewPending).id).toBe('review_proposed_structure');
  });

  it('asks for blockers only when they affect movement', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.blockerAffectsMovement).id).toBe('review_blocking_condition');
  });

  it('asks for decision review before generic attention', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.decisionReadyReading).id).toBe('review_decision');
  });

  it('uses attention review after a published reading with attention signals', () => {
    expect(resolveNextBestPortfolioAction(portfolioBootstrapFixtures.firstReadingWithAttention).id).toBe('review_portfolio_attention');
  });

  it('never returns Initiative Owner or Step launcher labels', () => {
    const actions = Object.values(portfolioBootstrapFixtures).map((fixture) => resolveNextBestPortfolioAction(fixture));

    expect(actions.some((action) => isForbiddenPortfolioActionLabel(action.label))).toBe(false);
  });
});

describe('Provenance and canonicalization guards', () => {
  it('blocks AI_SUGGESTED to USER_CONFIRMED without human confirmation', () => {
    expect(canTransitionProvenance('AI_SUGGESTED', 'USER_CONFIRMED')).toBe(false);
    expect(canTransitionProvenance('AI_SUGGESTED', 'USER_CONFIRMED', true)).toBe(true);
  });

  it('blocks AI_INFERRED to CANONICAL direct transition', () => {
    expect(canTransitionProvenance('AI_INFERRED', 'CANONICAL', true)).toBe(false);
  });

  it('does not apply rejected or unconfirmed material proposed mutations', () => {
    const state = { priority: 'Original' };
    const rejected = applyProposedMutationToGovernedState(state, {
      id: 'm1',
      fieldPath: 'priority',
      proposedValue: { priority: 'Nueva' },
      status: 'rejected',
      provenance: 'AI_INFERRED',
      material: true,
    });

    expect(rejected).toBe(state);
    expect(canApplyProposedMutation({
      id: 'm2',
      fieldPath: 'priority',
      proposedValue: { priority: 'Nueva' },
      status: 'confirmed',
      provenance: 'AI_INFERRED',
      material: true,
    })).toBe(false);
  });

  it('applies material proposed mutations only after human confirmation', () => {
    const state = { priority: 'Original' };
    const next = applyProposedMutationToGovernedState(state, {
      id: 'm3',
      fieldPath: 'priority',
      proposedValue: { priority: 'Nueva' },
      status: 'confirmed',
      provenance: 'AI_INFERRED',
      material: true,
      humanConfirmation,
    });

    expect(next.priority).toBe('Nueva');
  });
});

describe('Strategic Connection guards', () => {
  it('allows AI to propose only non-confirmed connection states', () => {
    expect(canSetStrategicConnectionStatus({ actor: 'ai', status: 'probable_alignment' })).toBe(true);
    expect(canSetStrategicConnectionStatus({ actor: 'ai', status: 'confirmed_alignment' })).toBe(false);
  });

  it('requires a human checkpoint for confirmed alignment or misalignment', () => {
    expect(canSetStrategicConnectionStatus({ actor: 'user', status: 'confirmed_misalignment' })).toBe(false);
    expect(canSetStrategicConnectionStatus({ actor: 'user', status: 'confirmed_misalignment', humanConfirmation })).toBe(true);
  });
});

describe('Advancement Conditions', () => {
  it('treats missing context as attention by default, not blocking', () => {
    expect(deriveAdvancementConditionSeverity({ type: 'business_signal', missing: true })).toBe('attention');
  });

  it('marks missing context as blocking only when it affects movement', () => {
    expect(deriveAdvancementConditionSeverity({
      type: 'critical_dependency',
      missing: true,
      affectsMovement: true,
    })).toBe('blocking');
  });
});

describe('Portfolio Bootstrap fixtures', () => {
  it('provides the ten required PR-1 fixture cases', () => {
    expect(Object.keys(portfolioBootstrapFixtures)).toHaveLength(10);
  });
});
