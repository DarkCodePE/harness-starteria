export type AdaptiveQuestionSource =
  | 'core'
  | 'route'
  | 'method_catalog'
  | 'challenge_type'
  | 'company_context'
  | 'challenge_context'
  | 'previous_answer'
  | 'ai_generated';

export type AdaptiveRouteType =
  | 'explore_validate'
  | 'design_solution'
  | 'implement_handoff'
  | 'plan_coordinate'
  | 'reconstruct_existing'
  | 'lightweight_plan';

export type AdaptiveDepthLevel = 'essential' | 'standard' | 'extended';
export type AdaptiveHealth = 'healthy' | 'attention' | 'blocked' | 'ready_for_decision';
export type StepNumber = 0 | 1 | 2 | 3 | 4;

export type DecisionType =
  | 'continue_experimenting'
  | 'implement'
  | 'scale'
  | 'pause'
  | 'close_with_learning';

export type DecisionReadinessStatus = 'not_ready' | 'conditionally_ready' | 'ready';
export type DecisionReadinessDimension = 'evidence' | 'impact' | 'execution' | 'risk' | 'governance';
export type DecisionReadinessDimensionStatus = 'insufficient' | 'partial' | 'sufficient';
export type GovernanceMode = 'owner_governed' | 'portfolio_governed';
export type DecisionAuthorityType = 'initiative_owner' | 'portfolio_lead';
export type DecisionAuthorityStatus = 'resolved' | 'unassigned' | 'insufficient_context';
export type DecisionAuthorityPurpose = 'methodological_decision' | 'portfolio_review';
export type InitiativeAlignmentType = 'self_initiated' | 'portfolio_initiative' | 'challenge_assigned';
export type InitiativeCompletionRoute = 'owner_completed' | 'portfolio_presented';
export type InitiativeLifecycleProjection = 'active' | 'completed' | 'presented';
export type DecisionRequestStatus = 'pending' | 'resolved' | 'cancelled' | 'superseded';
export type DecisionOutcome = DecisionType;
export type ContinuationRouteType = 'new_cycle' | 'implementation_handoff' | 'scaling_handoff' | 'paused' | 'closed';

export interface DecisionReadinessIssue {
  code: string;
  dimension: DecisionReadinessDimension;
  message: string;
  sourceRefs?: Array<{
    sourceType: string;
    sourceId: string;
  }>;
}

export interface DecisionReadinessAssessment {
  assessmentVersion: 1;
  projectId: string;
  cycleId: string;
  decisionType: DecisionType;
  overallStatus: DecisionReadinessStatus;
  dimensions: Record<DecisionReadinessDimension, DecisionReadinessDimensionStatus>;
  hardBlockers: DecisionReadinessIssue[];
  conditions: DecisionReadinessIssue[];
  unresolvedQuestions: DecisionReadinessIssue[];
  rationale: string[];
  evaluatedAt: Date;
}

export interface DecisionReadinessInput {
  projectId: string;
  cycleId: string;
  decisionType: DecisionType;
  evidenceContext: {
    claimCount: number;
    evidenceCount: number;
    supportingEvidenceCount: number;
    contradictedEvidenceCount: number;
    insufficientEvidenceCount: number;
    supportedClaimCount: number;
    contradictedClaimCount: number;
    insufficientClaimCount: number;
    supportedValidationCount: number;
    contradictedValidationCount: number;
    insufficientValidationCount: number;
  };
  impactContext: {
    declaredCount: number;
    estimatedCount: number;
    validatedCount: number;
    realizedCount: number;
  };
  executionContext: {
    currentStep: StepNumber;
    hasExecutionSignal: boolean;
    hasOperationalReadinessSignal: boolean;
    hasProvenExecutionReadiness: boolean;
    openOperationalBlockerCount: number;
  };
  riskContext: {
    hasRiskSignal: boolean;
    hasProvenRiskReadiness: boolean;
    knownRiskCount: number;
    openHighRiskCount: number;
    openCriticalRiskCount: number;
  };
  governanceContext: {
    hasProjectOwner: boolean;
    hasActiveTeamMember: boolean;
    hasPortfolioContext: boolean;
  };
  learningContext: {
    unresolvedQuestionCount: number;
    capturedLearningCount: number;
  };
}

export interface DecisionAuthorityResult {
  assessmentVersion: 1;
  projectId: string;
  cycleId: string;
  decisionType: DecisionType;
  authorityPurpose?: DecisionAuthorityPurpose;
  governanceMode: GovernanceMode;
  authorityType: DecisionAuthorityType;
  authorityUserId: string | null;
  authorityStatus: DecisionAuthorityStatus;
  currentUserCanDecide: boolean;
  currentUserCanSubmit: boolean;
  rationale: string[];
}

export interface DecisionAuthorityInput {
  projectId: string;
  cycleId: string;
  decisionType: DecisionType;
  governanceMode: GovernanceMode | null;
  initiativeOwnerId: string | null;
  portfolioLeadUserId?: string | null;
  currentUserId: string;
  authorityPurpose?: DecisionAuthorityPurpose;
  currentUserIsInitiativeOwner: boolean;
  currentUserIsAssignedPortfolioLead: boolean;
  currentUserIsActiveTeamMember: boolean;
  hasExplicitGovernanceConfig: boolean;
}

export interface InitiativeAlignmentInput {
  projectId: string;
  governanceMode: GovernanceMode | null;
  hasExplicitGovernanceConfig: boolean;
  challengeId?: string | null;
  strategicFrontId?: string | null;
}

export interface InitiativeAlignmentResult {
  projectId: string;
  alignmentType: InitiativeAlignmentType;
  governanceMode: GovernanceMode;
  portfolioAligned: boolean;
  sourceChallengeId?: string | null;
  sourcePortfolioContextId?: string | null;
  rationale: string[];
}

export interface InitiativeCompletionRoutingInput {
  projectId: string;
  cycleId: string;
  methodologicalCompletion: boolean;
  alignment: InitiativeAlignmentResult;
}

export interface InitiativeCompletionRoutingResult {
  projectId: string;
  cycleId: string;
  alignmentType: InitiativeAlignmentType;
  governanceMode: GovernanceMode;
  route: InitiativeCompletionRoute;
  methodologicalCompletion: boolean;
  initiativeCompleted: boolean;
  portfolioReviewRequired: boolean;
  lifecycleProjection: InitiativeLifecycleProjection;
  rationale: string[];
}

export interface InitiativeHistoryResult {
  projectId: string;
  summary: {
    name: string;
    status: string;
    currentStep: number;
    ownerId: string | null;
  };
  alignment: InitiativeAlignmentResult;
  completionRouting: InitiativeCompletionRoutingResult;
  lifecycleProjection: InitiativeLifecycleProjection;
  cycles: Array<{
    id: string;
    cycleNumber: number;
    status: string;
    parentCycleId: string | null;
    basedOnCycleId: string | null;
    triggerType: string;
    triggerRefId: string | null;
    startStep: number;
    currentStep: number;
    completedAt: Date | null;
    stepStates: Array<{
      stepNumber: number;
      state: string;
      inheritedFromCycleId: string | null;
      inheritedFromOutputId: string | null;
    }>;
    confirmedOutputs: Array<{
      id: string;
      stepNumber: number;
      version: number;
      status: string;
      outputKey: string;
      outputJson: unknown;
      confirmedAt: Date | null;
      sourceConfigurationId: string | null;
    }>;
  }>;
  evidence: Array<{
    id: string;
    name: string | null;
    truthStatus: string | null;
    sourceRefId: string | null;
    targetClaimId: string | null;
  }>;
  sourceRefs: Array<{
    id: string;
    sourceType: string;
    reference: string;
  }>;
  truthClaims: Array<{
    id: string;
    statement: string;
    verificationState: string | null;
  }>;
}

export interface DecisionRequestResult {
  id: string;
  projectId: string;
  sourceCycleId: string;
  requestedById: string;
  requestedAt: Date;
  status: DecisionRequestStatus;
  authorityType: DecisionAuthorityType;
  authorityUserId: string | null;
  readinessSnapshotJson: unknown;
  authoritySnapshotJson: unknown;
  decisionPackageSnapshotJson: unknown;
  recommendationSnapshotJson: unknown | null;
  presentationSnapshotJson: unknown | null;
  requestVersion: number;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionResult {
  id: string;
  projectId: string;
  sourceCycleId: string;
  decisionRequestId: string;
  outcome: DecisionOutcome;
  decidedById: string;
  decidedAt: Date;
  rationale: string;
  conditionsJson: unknown | null;
  authoritySnapshotJson: unknown;
  readinessSnapshotJson: unknown;
  recommendationSnapshotJson: unknown | null;
  packageSnapshotJson: unknown;
  presentationSnapshotJson: unknown;
  idempotencyKey: string;
  createdAt: Date;
}

export interface ContinuationRouteResult {
  id: string;
  projectId: string;
  decisionId: string;
  routeType: ContinuationRouteType;
  resultingCycleId: string | null;
  handoffId: string | null;
  appliedAt: Date;
  idempotencyKey: string | null;
  createdAt: Date;
}

export interface DecisionEffectsResult {
  decision: DecisionResult;
  route: ContinuationRouteResult;
  lifecycleProjection: string;
  resultingCycleId: string | null;
  handoff: unknown | null;
  closureSummary: unknown | null;
}

export type CriticalChangeScope =
  | 'execution'
  | 'experiment'
  | 'solution'
  | 'hypothesis'
  | 'focus'
  | 'challenge';

export type ChangeTransition =
  | 'same_cycle'
  | 'new_cycle'
  | 'return_to_prior_direction'
  | 'derived_initiative_recommended';

export interface CriticalChangeCandidate {
  sourceCycleId: string;
  changeScope: CriticalChangeScope;
  field?: string | null;
  previousValue?: unknown;
  nextValue: unknown;
  reason?: string | null;
  requestedTransition?: ChangeTransition | null;
  basedOnCycleId?: string | null;
  requestedReentryStep?: StepNumber | null;
}

export interface CriticalChangeDependencyResult {
  changeScope: CriticalChangeScope;
  field?: string | null;
  potentiallyAffectedSteps: StepNumber[];
  potentiallyAffectedCheckpoints: string[];
  potentiallyAffectedOutputIds: string[];
  invalidatedSteps: StepNumber[];
  rationale: string[];
}

export interface ChangeImpactResult {
  assessmentVersion: 1;
  sourceCycleId: string;
  changeScope: CriticalChangeScope;
  affectedSteps: StepNumber[];
  affectedCheckpoints: string[];
  affectedOutputIds: string[];
  earliestAffectedStep: StepNumber | null;
  confirmedContractAffected: boolean;
  materialChange: boolean;
  transition: ChangeTransition;
  reentryStep: StepNumber | null;
  basedOnCycleId?: string | null;
  inheritedSteps: StepNumber[];
  reopenedSteps: StepNumber[];
  pendingSteps: StepNumber[];
  historicalOnlySteps: StepNumber[];
  identityChange: boolean;
  derivedInitiativeRecommended: boolean;
  rationale: string[];
}

export interface CriticalChangeUserOutcome {
  headline: string;
  message: string;
  preservedSteps: StepNumber[];
  reviewSteps: StepNumber[];
  downstreamSteps: StepNumber[];
  recommendedAction:
    | 'continue_current_iteration'
    | 'resume_from_step'
    | 'return_to_prior_direction'
    | 'create_derived_initiative';
  recommendedStep: StepNumber | null;
}

export interface MaterializedQuestion {
  id: string;
  prompt: string;
  purpose: string;
  clarifiesVariable: string;
  answerType: 'single_choice' | 'multi_choice' | 'free_text' | 'evidence_link' | 'date' | 'owner';
  reason: string;
  source: AdaptiveQuestionSource;
  sourceRefs: string[];
  required: boolean;
  checkpointKey: string;
  configurationVersion: number;
  allowsUnknown: boolean;
  contextDerived?: boolean;
  confirmationRequired?: boolean;
}

export interface Step0AlignmentBrief {
  intention: string;
  origin: string;
  challengeType: string;
  objective: string;
  scope: string;
  inclusions: string[];
  exclusions: string[];
  output: string;
  adoption: string;
  outcome: string;
  actors: string[];
  restrictions: string[];
  facts: string[];
  signals: string[];
  assumptions: string[];
  priorityHypothesis: string;
  validationQuestions: string[];
  decisionCriteria: string;
  availableEvidence: string[];
  missingInformation: string[];
}

export interface AdaptiveCoreState {
  schemaVersion: 'PRD-03-v0.4';
  masterContext: Record<string, unknown>;
  activeStepConfigurationId: string;
  stepConfigurations: Record<string, unknown>[];
  activeCheckpoint: Record<string, unknown> | null;
  checkpointInstances: Record<string, unknown>[];
  stepOutputs: Record<string, unknown>[];
  progressSignal: Record<string, unknown> | null;
  events: Record<string, unknown>[];
  cycle?: {
    id: string;
    cycleNumber: number;
    startStep: number;
    currentStep: number;
    status: string;
  };
  legacyFallback: boolean;
}
