import type { PortfolioBootstrapResponse } from '../services/portfolioBootstrapClient';

export function makeBootstrap(status: NonNullable<PortfolioBootstrapResponse['anchor']>['status']): PortfolioBootstrapResponse {
  return {
    sourceContinuation: { id: 'cont-1', sessionId: 'entry-session-1' },
    bootstrapSession: {
      id: 'bs-1',
      userId: 'user-1',
      organizationId: null,
      sourceContinuationId: 'cont-1',
      status: status === 'anchor_confirmed' || status === 'anchor_sufficient' ? 'awaiting_work_intake' : 'awaiting_anchor_review',
      bootstrapPhase: status === 'anchor_confirmed' || status === 'anchor_sufficient' ? 'B2_WORK_INTAKE' : 'B1_ANCHOR',
      existingWorkStatus: 'unknown',
      createdAt: '2026-09-14T10:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
    },
    anchor: {
      id: 'anchor-1',
      bootstrapSessionId: 'bs-1',
      outcomeStatement: status === 'anchor_insufficient' ? 'innovar mas' : 'Reducir abandono en onboarding B2B',
      contextSummary: status === 'anchor_insufficient' ? null : 'Customer success y producto reportan retrasos en activacion.',
      decisionToEnable: status === 'anchor_insufficient' ? null : 'Decidir foco del trimestre',
      businessSignalStatus: status === 'anchor_conflicting' ? 'conflicting' : 'proxy',
      businessSignalValue: 'Aumento sostenido de tickets durante onboarding',
      status,
      sourceRefs: { source: 'PortfolioEntryPortfolioContinuation' },
      provenanceStatus: status === 'anchor_confirmed' ? 'user_confirmed' : 'extracted',
      confirmedBy: status === 'anchor_confirmed' ? 'user-1' : null,
      confirmedAt: status === 'anchor_confirmed' ? '2026-09-14T10:00:00.000Z' : null,
      version: 1,
      createdAt: '2026-09-14T10:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
    },
    importBatches: [],
    workItems: [],
    proposedMutations: [],
    latestAnalysisRun: null,
    strategicConnections: [],
    advancementConditions: [],
    latestReading: null,
  };
}

export function makeBootstrapWithWorkItems(): PortfolioBootstrapResponse {
  const base = makeBootstrap('anchor_confirmed');
  return {
    ...base,
    bootstrapSession: {
      ...base.bootstrapSession,
      status: 'awaiting_structuring',
      bootstrapPhase: 'B3_PROVISIONAL_STRUCTURING',
      existingWorkStatus: 'has_work',
    },
    workItems: [
      {
        id: 'wi-1',
        bootstrapSessionId: 'bs-1',
        rawLabel: 'Nuevo onboarding digital',
        proposedName: 'Nuevo onboarding digital',
        proposedPurpose: null,
        sourceType: 'pasted_text',
        status: 'detected',
        currentStateHint: null,
        ownerCandidate: null,
        sourceRefs: { sourceType: 'pasted_text', rawInput: 'Nuevo onboarding digital' },
        createdBy: 'user-1',
        createdAt: '2026-09-14T10:01:00.000Z',
        updatedAt: '2026-09-14T10:01:00.000Z',
      },
    ],
  };
}

export function makeBootstrapWithProposedMutations(): PortfolioBootstrapResponse {
  const base = makeBootstrapWithWorkItems();
  return {
    ...base,
    bootstrapSession: {
      ...base.bootstrapSession,
      status: 'awaiting_material_review',
      bootstrapPhase: 'B4_MATERIAL_REVIEW',
    },
    latestAnalysisRun: {
      id: 'run-1',
      bootstrapSessionId: 'bs-1',
      status: 'completed',
      analyzerMode: 'deterministic',
      inputVersion: 'input-v1',
      outputVersion: 'portfolio-bootstrap-analysis-output-v0.1',
      error: null,
      createdBy: 'user-1',
      createdAt: '2026-09-14T10:02:00.000Z',
      completedAt: '2026-09-14T10:02:01.000Z',
    },
    proposedMutations: [
      {
        id: 'pm-1',
        bootstrapSessionId: 'bs-1',
        analysisRunId: 'run-1',
        targetType: 'strategic_connection',
        targetId: 'wi-1',
        mutationType: 'create',
        currentValue: null,
        originalProposedValue: null,
        proposedValue: {
          workItemId: 'wi-1',
          status: 'probable_alignment',
          rationale: 'Comparte lenguaje con el Anchor.',
        },
        rationale: 'Comparte lenguaje con el Anchor.',
        reviewNote: null,
        sourceRefs: { workItemId: 'wi-1', anchorId: 'anchor-1' },
        provenanceStatus: 'ai_suggested',
        uncertainty: 'medium',
        materiality: 'material',
        confirmationRequired: true,
        status: 'proposed',
        reviewedBy: null,
        reviewedAt: null,
        correctedBy: null,
        correctedAt: null,
        createdAt: '2026-09-14T10:02:00.000Z',
        updatedAt: '2026-09-14T10:02:00.000Z',
      },
      {
        id: 'pm-2',
        bootstrapSessionId: 'bs-1',
        analysisRunId: 'run-1',
        targetType: 'advancement_condition',
        targetId: 'wi-1',
        mutationType: 'create',
        currentValue: null,
        originalProposedValue: null,
        proposedValue: {
          workItemId: 'wi-1',
          type: 'business_signal',
          statement: 'Falta una senal de negocio observable para decidir siguiente paso.',
          status: 'signal_unknown',
          severity: 'attention',
          movementAffected: 'decide_next',
        },
        rationale: 'Falta una senal de negocio observable para decidir siguiente paso.',
        reviewNote: null,
        sourceRefs: { workItemId: 'wi-1' },
        provenanceStatus: 'ai_inferred',
        uncertainty: 'medium',
        materiality: 'material',
        confirmationRequired: true,
        status: 'proposed',
        reviewedBy: null,
        reviewedAt: null,
        correctedBy: null,
        correctedAt: null,
        createdAt: '2026-09-14T10:02:00.000Z',
        updatedAt: '2026-09-14T10:02:00.000Z',
      },
    ],
    strategicConnections: [],
    advancementConditions: [],
    latestReading: null,
  };
}

export function makeBootstrapWithFirstReading(homeState: 'HOME_D' | 'HOME_E' = 'HOME_E'): PortfolioBootstrapResponse {
  const base = makeBootstrapWithProposedMutations();
  const attention = homeState === 'HOME_E'
    ? [{
      type: 'missing_business_signal' as const,
      title: 'Falta senal de negocio',
      statement: 'Falta una senal de negocio observable para decidir siguiente paso.',
      whyItMatters: 'Sin una senal observable, cuesta decidir si este trabajo contribuye al movimiento buscado.',
      severity: 'attention' as const,
      sourceRefs: { mutationId: 'pm-2' },
      nextAction: 'Revisar senal de negocio faltante',
    }]
    : [];
  return {
    ...base,
    bootstrapSession: {
      ...base.bootstrapSession,
      status: 'reading_published',
      bootstrapPhase: 'B5_FIRST_READING',
    },
    latestReading: {
      id: 'reading-1',
      bootstrapSessionId: 'bs-1',
      anchorId: 'anchor-1',
      version: 1,
      summary: 'Intentamos mover: Reducir abandono en onboarding B2B.',
      totalWorkItems: 1,
      confirmedConnections: 1,
      uncertainConnections: homeState === 'HOME_E' ? 1 : 0,
      signalGapCount: homeState === 'HOME_E' ? 1 : 0,
      unresolvedDependencyCount: 0,
      decisionPathGapCount: 0,
      requiredContextGapCount: 0,
      ownershipGapCount: 0,
      possibleMisalignmentCount: 0,
      confirmedMisalignmentCount: 0,
      primaryAttentionItems: attention,
      nextBestAction: homeState === 'HOME_E' ? 'Revisar senal de negocio faltante' : 'Mantener y revisar la lectura inicial del portfolio',
      sourceBootstrapVersion: 'abcdef1234567890',
      sourceAnchorVersion: 1,
      sourceSnapshot: {
        workItems: [{ id: 'wi-1' }],
        strategicConnections: [{ id: 'sc-1' }],
        advancementConditions: homeState === 'HOME_E' ? [{ id: 'ac-1' }] : [],
        unresolvedProposals: [],
      },
      stateHash: 'abcdef1234567890',
      homeState,
      publishedBy: 'user-1',
      publishedAt: '2026-09-14T10:03:00.000Z',
      createdAt: '2026-09-14T10:03:00.000Z',
      updatedAt: '2026-09-14T10:03:00.000Z',
    },
  };
}
