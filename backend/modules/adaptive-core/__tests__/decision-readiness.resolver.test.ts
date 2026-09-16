import { describe, expect, it } from 'vitest';
import { DecisionReadinessResolver } from '../decision-readiness.resolver';
import type { DecisionReadinessInput, DecisionType } from '../adaptive-core.types';

const resolver = new DecisionReadinessResolver();

function input(overrides: Partial<DecisionReadinessInput> = {}): DecisionReadinessInput {
  return {
    projectId: 'project-readiness',
    cycleId: 'cycle-readiness',
    decisionType: 'implement',
    evidenceContext: {
      claimCount: 1,
      evidenceCount: 1,
      supportingEvidenceCount: 1,
      contradictedEvidenceCount: 0,
      insufficientEvidenceCount: 0,
      supportedClaimCount: 1,
      contradictedClaimCount: 0,
      insufficientClaimCount: 0,
      supportedValidationCount: 1,
      contradictedValidationCount: 0,
      insufficientValidationCount: 0,
    },
    impactContext: {
      declaredCount: 0,
      estimatedCount: 1,
      validatedCount: 0,
      realizedCount: 0,
    },
    executionContext: {
      currentStep: 3,
      hasExecutionSignal: true,
      hasOperationalReadinessSignal: false,
      hasProvenExecutionReadiness: false,
      openOperationalBlockerCount: 0,
    },
    riskContext: {
      hasRiskSignal: true,
      hasProvenRiskReadiness: false,
      knownRiskCount: 1,
      openHighRiskCount: 0,
      openCriticalRiskCount: 0,
    },
    governanceContext: {
      hasProjectOwner: true,
      hasActiveTeamMember: true,
      hasPortfolioContext: false,
    },
    learningContext: {
      unresolvedQuestionCount: 1,
      capturedLearningCount: 1,
    },
    ...overrides,
  };
}

function forDecision(decisionType: DecisionType, overrides: Partial<DecisionReadinessInput> = {}) {
  return resolver.evaluate(input({ ...overrides, decisionType }), new Date('2026-08-19T00:00:00.000Z'));
}

describe('DecisionReadinessResolver', () => {
  it('is decision-specific for the same initiative facts', () => {
    expect(forDecision('continue_experimenting').overallStatus).toBe('ready');
    expect(forDecision('implement').overallStatus).toBe('conditionally_ready');
    expect(forDecision('scale').overallStatus).toBe('not_ready');
  });

  it('does not treat missing evidence as sufficient', () => {
    const assessment = forDecision('implement', {
      evidenceContext: {
        claimCount: 1,
        evidenceCount: 0,
        supportingEvidenceCount: 0,
        contradictedEvidenceCount: 0,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 0,
        contradictedClaimCount: 0,
        insufficientClaimCount: 0,
        supportedValidationCount: 0,
        contradictedValidationCount: 0,
        insufficientValidationCount: 0,
      },
    });

    expect(assessment.dimensions.evidence).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('does not count contradicted evidence as validated support', () => {
    const assessment = forDecision('implement', {
      evidenceContext: {
        claimCount: 1,
        evidenceCount: 1,
        supportingEvidenceCount: 0,
        contradictedEvidenceCount: 1,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 0,
        contradictedClaimCount: 1,
        insufficientClaimCount: 0,
        supportedValidationCount: 0,
        contradictedValidationCount: 1,
        insufficientValidationCount: 0,
      },
    });

    expect(assessment.dimensions.evidence).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
    expect(assessment.rationale).toContain('La evidencia contradicha se mantiene como aprendizaje, pero no cuenta como soporte validado.');
  });

  it('keeps scale not_ready when impact is only declared', () => {
    const assessment = forDecision('scale', {
      impactContext: {
        declaredCount: 1,
        estimatedCount: 0,
        validatedCount: 0,
        realizedCount: 0,
      },
    });

    expect(assessment.dimensions.impact).toBe('insufficient');
    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('does not make scale ready from heuristic execution and risk signals', () => {
    const assessment = forDecision('scale', {
      impactContext: {
        declaredCount: 0,
        estimatedCount: 0,
        validatedCount: 1,
        realizedCount: 0,
      },
      executionContext: {
        currentStep: 4,
        hasExecutionSignal: true,
        hasOperationalReadinessSignal: true,
        hasProvenExecutionReadiness: false,
        openOperationalBlockerCount: 0,
      },
      riskContext: {
        hasRiskSignal: true,
        hasProvenRiskReadiness: false,
        knownRiskCount: 1,
        openHighRiskCount: 0,
        openCriticalRiskCount: 0,
      },
      governanceContext: {
        hasProjectOwner: true,
        hasActiveTeamMember: true,
        hasPortfolioContext: true,
      },
    });

    expect(assessment.dimensions.impact).toBe('sufficient');
    expect(assessment.dimensions.execution).toBe('partial');
    expect(assessment.dimensions.risk).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('does not let missing execution become unconditional implement readiness', () => {
    const assessment = forDecision('implement', {
      executionContext: {
        currentStep: 0,
        hasExecutionSignal: false,
        hasOperationalReadinessSignal: false,
        hasProvenExecutionReadiness: false,
        openOperationalBlockerCount: 0,
      },
      governanceContext: {
        hasProjectOwner: true,
        hasActiveTeamMember: true,
        hasPortfolioContext: true,
      },
    });

    expect(assessment.dimensions.execution).toBe('insufficient');
    expect(assessment.overallStatus).toBe('conditionally_ready');
    expect(assessment.conditions.some((issue) => issue.dimension === 'execution')).toBe(true);
  });

  it('allows pause readiness while implement is not_ready', () => {
    const sparse = {
      evidenceContext: {
        claimCount: 0,
        evidenceCount: 0,
        supportingEvidenceCount: 0,
        contradictedEvidenceCount: 0,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 0,
        contradictedClaimCount: 0,
        insufficientClaimCount: 0,
        supportedValidationCount: 0,
        contradictedValidationCount: 0,
        insufficientValidationCount: 0,
      },
      impactContext: {
        declaredCount: 0,
        estimatedCount: 0,
        validatedCount: 0,
        realizedCount: 0,
      },
      learningContext: {
        unresolvedQuestionCount: 1,
        capturedLearningCount: 0,
      },
    };

    expect(forDecision('pause', sparse).overallStatus).toBe('ready');
    expect(forDecision('implement', sparse).overallStatus).toBe('not_ready');
  });

  it('allows close_with_learning on contradicted thesis when learning exists', () => {
    const assessment = forDecision('close_with_learning', {
      evidenceContext: {
        claimCount: 1,
        evidenceCount: 1,
        supportingEvidenceCount: 0,
        contradictedEvidenceCount: 1,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 0,
        contradictedClaimCount: 1,
        insufficientClaimCount: 0,
        supportedValidationCount: 0,
        contradictedValidationCount: 1,
        insufficientValidationCount: 0,
      },
      learningContext: {
        unresolvedQuestionCount: 0,
        capturedLearningCount: 1,
      },
    });

    expect(assessment.overallStatus).toBe('ready');
  });

  it('keeps governance readiness separate from authority', () => {
    const assessment = forDecision('implement', {
      governanceContext: {
        hasProjectOwner: true,
        hasActiveTeamMember: true,
        hasPortfolioContext: true,
      },
    });

    expect(assessment.dimensions.governance).toBe('sufficient');
    expect(assessment).not.toHaveProperty('authorityGranted');
    expect(assessment).not.toHaveProperty('organizationalDecision');
  });

  it('ignores raw overallStatus supplied outside the normalized policy contract', () => {
    const assessment = resolver.evaluate(input({
      decisionType: 'scale',
      overallStatus: 'ready',
      evidenceContext: {
        claimCount: 0,
        evidenceCount: 0,
        supportingEvidenceCount: 0,
        contradictedEvidenceCount: 0,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 0,
        contradictedClaimCount: 0,
        insufficientClaimCount: 0,
        supportedValidationCount: 0,
        contradictedValidationCount: 0,
        insufficientValidationCount: 0,
      },
    } as any));

    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('does not make raw supporting Evidence sufficient without a supported Claim', () => {
    const assessment = forDecision('implement', {
      evidenceContext: {
        claimCount: 1,
        evidenceCount: 1,
        supportingEvidenceCount: 1,
        contradictedEvidenceCount: 0,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 0,
        contradictedClaimCount: 0,
        insufficientClaimCount: 0,
        supportedValidationCount: 0,
        contradictedValidationCount: 0,
        insufficientValidationCount: 0,
      },
    });

    expect(assessment.dimensions.evidence).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('uses supported Claim verification as canonical evidence support', () => {
    const assessment = forDecision('implement', {
      evidenceContext: {
        claimCount: 1,
        evidenceCount: 1,
        supportingEvidenceCount: 1,
        contradictedEvidenceCount: 0,
        insufficientEvidenceCount: 0,
        supportedClaimCount: 1,
        contradictedClaimCount: 0,
        insufficientClaimCount: 0,
        supportedValidationCount: 1,
        contradictedValidationCount: 0,
        insufficientValidationCount: 0,
      },
    });

    expect(assessment.dimensions.evidence).toBe('sufficient');
    expect(assessment.overallStatus).toBe('conditionally_ready');
  });

  it('keeps contradicted and insufficient Claims as non-support', () => {
    const assessment = forDecision('implement', {
      evidenceContext: {
        claimCount: 2,
        evidenceCount: 2,
        supportingEvidenceCount: 0,
        contradictedEvidenceCount: 1,
        insufficientEvidenceCount: 1,
        supportedClaimCount: 0,
        contradictedClaimCount: 1,
        insufficientClaimCount: 1,
        supportedValidationCount: 0,
        contradictedValidationCount: 1,
        insufficientValidationCount: 1,
      },
    });

    expect(assessment.dimensions.evidence).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('does not treat operational field signals as proven execution readiness', () => {
    const assessment = forDecision('scale', {
      impactContext: {
        declaredCount: 0,
        estimatedCount: 0,
        validatedCount: 1,
        realizedCount: 0,
      },
      executionContext: {
        currentStep: 4,
        hasExecutionSignal: true,
        hasOperationalReadinessSignal: true,
        hasProvenExecutionReadiness: false,
        openOperationalBlockerCount: 0,
      },
      riskContext: {
        hasRiskSignal: true,
        hasProvenRiskReadiness: true,
        knownRiskCount: 1,
        openHighRiskCount: 0,
        openCriticalRiskCount: 0,
      },
      governanceContext: {
        hasProjectOwner: true,
        hasActiveTeamMember: true,
        hasPortfolioContext: true,
      },
    });

    expect(assessment.dimensions.execution).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
  });

  it('does not treat risk field signals as proven risk readiness', () => {
    const assessment = forDecision('scale', {
      impactContext: {
        declaredCount: 0,
        estimatedCount: 0,
        validatedCount: 1,
        realizedCount: 0,
      },
      executionContext: {
        currentStep: 4,
        hasExecutionSignal: true,
        hasOperationalReadinessSignal: true,
        hasProvenExecutionReadiness: true,
        openOperationalBlockerCount: 0,
      },
      riskContext: {
        hasRiskSignal: true,
        hasProvenRiskReadiness: false,
        knownRiskCount: 1,
        openHighRiskCount: 0,
        openCriticalRiskCount: 0,
      },
      governanceContext: {
        hasProjectOwner: true,
        hasActiveTeamMember: true,
        hasPortfolioContext: true,
      },
    });

    expect(assessment.dimensions.risk).toBe('partial');
    expect(assessment.overallStatus).toBe('not_ready');
  });
});
