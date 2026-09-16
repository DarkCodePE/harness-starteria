import { describe, expect, it } from 'vitest';
import { DecisionAuthorityResolver } from '../decision-authority.resolver';
import type { DecisionAuthorityInput, DecisionType } from '../adaptive-core.types';

const resolver = new DecisionAuthorityResolver();

function input(overrides: Partial<DecisionAuthorityInput> = {}): DecisionAuthorityInput {
  return {
    projectId: 'project-authority',
    cycleId: 'cycle-active',
    decisionType: 'implement',
    governanceMode: 'owner_governed',
    initiativeOwnerId: 'owner-1',
    portfolioLeadUserId: null,
    currentUserId: 'owner-1',
    currentUserIsInitiativeOwner: true,
    currentUserIsAssignedPortfolioLead: false,
    currentUserIsActiveTeamMember: true,
    hasExplicitGovernanceConfig: true,
    ...overrides,
  };
}

function evaluate(decisionType: DecisionType, overrides: Partial<DecisionAuthorityInput> = {}) {
  return resolver.evaluate(input({ ...overrides, decisionType }));
}

describe('DecisionAuthorityResolver', () => {
  it('owner_governed lets the canonical owner decide implement', () => {
    const result = evaluate('implement');

    expect(result).toMatchObject({
      governanceMode: 'owner_governed',
      authorityType: 'initiative_owner',
      authorityUserId: 'owner-1',
      authorityStatus: 'resolved',
      currentUserCanDecide: true,
      currentUserCanSubmit: true,
    });
  });

  it('owner_governed keeps a non-owner participant from deciding', () => {
    const result = evaluate('implement', {
      currentUserId: 'participant-1',
      currentUserIsInitiativeOwner: false,
      currentUserIsActiveTeamMember: true,
    });

    expect(result.authorityUserId).toBe('owner-1');
    expect(result.currentUserCanDecide).toBe(false);
    expect(result.currentUserCanSubmit).toBe(false);
  });

  it('portfolio_governed continue_experimenting stays with initiative owner', () => {
    const result = evaluate('continue_experimenting', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
    });

    expect(result.authorityType).toBe('initiative_owner');
    expect(result.authorityUserId).toBe('owner-1');
  });

  it('portfolio_governed implement escalates to portfolio lead', () => {
    const result = evaluate('implement', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
    });

    expect(result.authorityType).toBe('portfolio_lead');
    expect(result.authorityUserId).toBe('portfolio-lead-1');
  });

  it('portfolio_governed scale escalates to portfolio lead', () => {
    const result = evaluate('scale', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
    });

    expect(result.authorityType).toBe('portfolio_lead');
    expect(result.authorityUserId).toBe('portfolio-lead-1');
  });

  it('portfolio_governed owner can submit implement but cannot decide it', () => {
    const result = evaluate('implement', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
    });

    expect(result.currentUserCanDecide).toBe(false);
    expect(result.currentUserCanSubmit).toBe(true);
  });

  it('assigned portfolio lead can decide implement and scale', () => {
    for (const decisionType of ['implement', 'scale'] as const) {
      const result = evaluate(decisionType, {
        governanceMode: 'portfolio_governed',
        portfolioLeadUserId: 'portfolio-lead-1',
        currentUserId: 'portfolio-lead-1',
        currentUserIsInitiativeOwner: false,
        currentUserIsAssignedPortfolioLead: true,
      });

      expect(result.currentUserCanDecide).toBe(true);
      expect(result.currentUserCanSubmit).toBe(true);
    }
  });

  it('a global portfolio_lead-like user not assigned to this initiative cannot decide', () => {
    const result = evaluate('implement', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
      currentUserId: 'other-portfolio-lead',
      currentUserIsInitiativeOwner: false,
      currentUserIsAssignedPortfolioLead: false,
      currentUserIsActiveTeamMember: true,
    });

    expect(result.currentUserCanDecide).toBe(false);
  });

  it('missing portfolio lead assignment is unassigned and cannot decide', () => {
    const result = evaluate('scale', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: null,
    });

    expect(result.authorityType).toBe('portfolio_lead');
    expect(result.authorityStatus).toBe('unassigned');
    expect(result.currentUserCanDecide).toBe(false);
  });

  it('same initiative may resolve different authority by decision type', () => {
    const continueResult = evaluate('continue_experimenting', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
    });
    const implementResult = evaluate('implement', {
      governanceMode: 'portfolio_governed',
      portfolioLeadUserId: 'portfolio-lead-1',
    });

    expect(continueResult.authorityType).toBe('initiative_owner');
    expect(implementResult.authorityType).toBe('portfolio_lead');
  });

  it('portfolio_review context resolves Portfolio Lead for every organizational outcome', () => {
    for (const decisionType of ['continue_experimenting', 'implement', 'scale', 'pause', 'close_with_learning'] as const) {
      const result = evaluate(decisionType, {
        governanceMode: 'portfolio_governed',
        portfolioLeadUserId: 'portfolio-lead-1',
        authorityPurpose: 'portfolio_review',
      });

      expect(result.authorityType).toBe('portfolio_lead');
      expect(result.authorityUserId).toBe('portfolio-lead-1');
    }
  });
});
