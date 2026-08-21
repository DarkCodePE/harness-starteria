import type {
  DecisionAuthorityInput,
  DecisionAuthorityResult,
  DecisionAuthorityStatus,
  DecisionAuthorityType,
  DecisionType,
  GovernanceMode,
} from './adaptive-core.types';

export class DecisionAuthorityResolver {
  evaluate(input: DecisionAuthorityInput): DecisionAuthorityResult {
    const rationale: string[] = [];
    const governanceMode = this.resolveGovernanceMode(input, rationale);
    const authorityType = this.resolveAuthorityType(governanceMode, input.decisionType, input.authorityPurpose);
    const authorityUserId = authorityType === 'initiative_owner'
      ? input.initiativeOwnerId
      : input.portfolioLeadUserId ?? null;
    const authorityStatus = this.resolveAuthorityStatus(governanceMode, authorityType, authorityUserId, input, rationale);
    const currentUserCanDecide = authorityStatus === 'resolved' && authorityUserId === input.currentUserId;
    const currentUserCanSubmit = this.resolveSubmitCapability(input, authorityType, currentUserCanDecide);

    if (authorityType === 'portfolio_lead' && !authorityUserId) {
      rationale.push('La decision requiere Portfolio Lead, pero no hay asignacion persistida para esta iniciativa.');
    }
    if (authorityType === 'portfolio_lead' && input.currentUserIsInitiativeOwner && !currentUserCanDecide) {
      rationale.push('El owner puede preparar o enviar la decision, pero no finalizarla bajo gobierno de portfolio.');
    }
    if (!input.hasExplicitGovernanceConfig && governanceMode === 'owner_governed') {
      rationale.push('Sin configuracion explicita, se usa compatibilidad conservadora owner_governed.');
    }
    if (governanceMode === 'portfolio_governed' && input.authorityPurpose === 'portfolio_review') {
      rationale.push('La iniciativa ya fue presentada a portafolio; el Portfolio Lead determina el resultado organizacional.');
    }

    return {
      assessmentVersion: 1,
      projectId: input.projectId,
      cycleId: input.cycleId,
      decisionType: input.decisionType,
      authorityPurpose: input.authorityPurpose,
      governanceMode,
      authorityType,
      authorityUserId,
      authorityStatus,
      currentUserCanDecide,
      currentUserCanSubmit,
      rationale,
    };
  }

  private resolveGovernanceMode(input: DecisionAuthorityInput, rationale: string[]): GovernanceMode {
    if (input.governanceMode) return input.governanceMode;
    if (input.initiativeOwnerId) return 'owner_governed';
    rationale.push('No existe owner canonico ni configuracion de gobernanza suficiente.');
    return 'owner_governed';
  }

  private resolveAuthorityType(governanceMode: GovernanceMode, decisionType: DecisionType, authorityPurpose?: string): DecisionAuthorityType {
    if (governanceMode === 'owner_governed') return 'initiative_owner';
    if (authorityPurpose === 'portfolio_review') return 'portfolio_lead';
    return decisionType === 'continue_experimenting' || decisionType === 'pause'
      ? 'initiative_owner'
      : 'portfolio_lead';
  }

  private resolveAuthorityStatus(
    governanceMode: GovernanceMode,
    authorityType: DecisionAuthorityType,
    authorityUserId: string | null,
    input: DecisionAuthorityInput,
    rationale: string[],
  ): DecisionAuthorityStatus {
    if (!input.initiativeOwnerId) {
      rationale.push('Falta owner canonico de la iniciativa.');
      return 'insufficient_context';
    }
    if (governanceMode === 'portfolio_governed' && !input.hasExplicitGovernanceConfig) {
      rationale.push('El modo portfolio_governed requiere configuracion persistida explicita.');
      return 'insufficient_context';
    }
    if (authorityType === 'portfolio_lead' && !authorityUserId) return 'unassigned';
    if (!authorityUserId) return 'insufficient_context';
    return 'resolved';
  }

  private resolveSubmitCapability(input: DecisionAuthorityInput, authorityType: DecisionAuthorityType, currentUserCanDecide: boolean) {
    if (currentUserCanDecide) return true;
    if (input.currentUserIsInitiativeOwner) return true;
    if (authorityType === 'portfolio_lead' && input.currentUserIsAssignedPortfolioLead) return true;
    return false;
  }
}
