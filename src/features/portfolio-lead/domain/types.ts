export type PortfolioRole = 'owner' | 'mentor' | 'admin' | 'sponsor' | 'portfolio_lead';

export type StrategicFrontStatus = 'draft' | 'active' | 'tracking' | 'paused' | 'closed';
export type StrategicFrontPriority = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type ChallengeActivationMode =
  | 'convocatoria_abierta'
  | 'personas_seleccionadas'
  | 'squad_asignado'
  | 'equipo_core_encargado'
  | 'innovacion_abierta_partner_externo'
  | 'mantener_en_definicion';
export type ChallengeActivation = ChallengeActivationMode;
export type ChallengeStatus =
  | 'draft'
  | 'listo_para_activar'
  | 'activo_interno'
  | 'publicado'
  | 'recibiendo_iniciativas'
  | 'con_iniciativas_activas'
  | 'pendiente_de_decision'
  | 'cerrado';
export type ChallengeType = 'correccion' | 'crecimiento' | 'exploracion';
export type StakeholderStatus = 'definido' | 'notificado' | 'confirmado';
export type SponsorStatus = StakeholderStatus;
export type ChallengeOwnerStatus = StakeholderStatus;
export type InvitationStatus = 'pendiente' | 'notificado' | 'confirmado' | 'declinado';
export type SquadRole = 'lider' | 'colaborador';
export type InitiativePortfolioStatus =
  | 'en_step_0'
  | 'en_step_1'
  | 'en_step_2'
  | 'en_step_3'
  | 'en_step_4'
  | 'bloqueada'
  | 'esperando_revision'
  | 'lista_para_decision'
  | 'cerrada';
export type InitiativeStep = 'Step 0' | 'Step 1' | 'Step 2' | 'Step 3' | 'Step 4';
export type ChallengeCoverageStatus =
  | 'sin_cobertura'
  | 'cobertura_parcial'
  | 'cobertura_suficiente'
  | 'resuelto'
  | 'reformular'
  | 'cerrar';
export type InitiativeContributionType =
  | 'descubrir'
  | 'validar'
  | 'resolver_parcialmente'
  | 'resolver_directamente';
export type EstimatedContribution = 'bajo' | 'medio' | 'alto';
export type InitiativeOverlapLevel = 'bajo' | 'medio' | 'alto';
export type PortfolioDecisionOutcome =
  | 'pasar_a_segunda_fase'
  | 'iterar_desde_otro_angulo'
  | 'transferir_a_ti'
  | 'transferir_al_area_afectada'
  | 'evaluar_innovacion_abierta'
  | 'escalar_piloto'
  | 'cerrar_con_aprendizaje';
export type InitiativeStepProgressState = 'completado' | 'en_progreso' | 'pendiente' | 'bloqueado';
export type ExecutiveOutputStatus =
  | 'borrador_ejecutivo'
  | 'listo_para_compartir'
  | 'compartido_con_sponsor'
  | 'compartido_con_gerencia'
  | 'decision_recibida'
  | 'aprobado'
  | 'aprobado_con_ajustes'
  | 'rechazado'
  | 'transferido'
  | 'escalado_a_segunda_fase'
  | 'cerrado';
export type ChallengeActivationUrgency = 'alta' | 'media' | 'baja';
export type ChallengeActivationTimeAvailability = 'muy_poco' | 'acotado' | 'suficiente';
export type ChallengeActivationEffort = 'alto' | 'medio' | 'bajo';
export type ChallengeActivationClarity = 'alta' | 'media' | 'baja';
export type ChallengeActivationSensitivity = 'alta' | 'media' | 'baja';
export type ChallengeActivationCapacity = 'alta' | 'media' | 'baja';
export type ChallengeActivationTechnicalNeed = 'alta' | 'media' | 'baja';
export type ChallengeActivationDependency = 'ninguna' | 'ti' | 'legal' | 'data' | 'operaciones' | 'comercial';

export interface ChallengeActivationInputs {
  urgency: ChallengeActivationUrgency;
  timeAvailable: ChallengeActivationTimeAvailability;
  estimatedEffort: ChallengeActivationEffort;
  challengeClarity: ChallengeActivationClarity;
  informationSensitivity: ChallengeActivationSensitivity;
  internalCapacity: ChallengeActivationCapacity;
  technicalNeed: ChallengeActivationTechnicalNeed;
  sponsorStatus: SponsorStatus;
  dependency: ChallengeActivationDependency;
}

export interface StrategicFront {
  id: string;
  name: string;
  strategicObjective: string;
  whyNow: string;
  sponsorEmail?: string;
  mainKpi: string;
  baseline: string;
  target: string;
  threshold?: string;
  horizon: string;
  endDate?: string;
  area?: string;
  sponsor: string;
  priority: StrategicFrontPriority;
  status: StrategicFrontStatus;
  createdAt: string;
  lastUpdatedAt?: string;
  notes?: string;
  challengeCount: number;
  initiativeCount: number;
}

export interface CreateStrategicFrontInput {
  name: string;
  strategicObjective: string;
  whyNow: string;
  sponsorEmail?: string;
  mainKpi: string;
  baseline: string;
  target: string;
  threshold?: string;
  horizon: string;
  endDate?: string;
  area?: string;
  sponsor: string;
  priority: StrategicFrontPriority;
  status: StrategicFrontStatus;
  notes?: string;
}

export interface ChallengeInvitation {
  id: string;
  value: string;
  status: InvitationStatus;
}

export interface SquadMember {
  id: string;
  value: string;
  role: SquadRole;
}

export interface Challenge {
  id: string;
  name: string;
  strategicFrontId: string;
  challengeType: ChallengeType | '';
  whatWeWantToMove: string;
  objective: string;
  whyNow: string;
  successCriteria: string;
  challengeOwner: string;
  sponsorName?: string;
  sponsorEmail?: string;
  horizon?: string;
  area?: string;
  notes?: string;
  currentMetricValue?: string;
  activationMode: ChallengeActivationMode;
  status: ChallengeStatus;
  createdAt: string;
  lastUpdatedAt?: string;
  challengeOwnerStatus: StakeholderStatus;
  sponsorStatus: StakeholderStatus;
  openCallStatus: 'inactiva' | 'activa';
  selectedPeople: ChallengeInvitation[];
  assignedSquad: SquadMember[];
  initiativeCount: number;
  coverageStatus: ChallengeCoverageStatus;
  visibleToParticipants: boolean;
  publicationNotes: string;
  lastPublishedAt?: string;
  activationInputs: ChallengeActivationInputs;
  activationRecommendationNote: string;
  activationMessageDraft: string;
}

export interface InitiativeDeliverable {
  id: string;
  title: string;
  type: 'Resumen' | 'PDF' | 'Deck' | 'Video' | 'Link';
  note: string;
}

export interface InitiativeStepTimelineEntry {
  step: InitiativeStep;
  state: InitiativeStepProgressState;
  note: string;
}

export interface Initiative {
  id: string;
  name: string;
  strategicFrontId: string;
  challengeId: string;
  teamOwner: string;
  currentStep: InitiativeStep;
  status: InitiativePortfolioStatus;
  mentor: string;
  sponsorTouchpoint: string;
  mainAlert: string;
  nextActionRecommended: string;
  attackedArea: string;
  hypothesisCovered: string;
  mainMetric: string;
  contributionType: InitiativeContributionType;
  estimatedContribution: EstimatedContribution;
  lastActivity: string;
  signalSummary: string;
  mainBlocker: string;
  teamLabel: string;
  requiresSponsor: boolean;
  readyForDecision: boolean;
  blockedDays: number;
  requiresExternalCapability: boolean;
  partialSignal: boolean;
  resolvedCorePart: boolean;
  teamMembers: string[];
  executiveSummary: string;
  experimentSummary: string;
  deliverables: InitiativeDeliverable[];
  aiCommentSummary: string;
  mentorCommentSummary: string;
  decisionRecommendationReason: string;
  stepsTimeline: InitiativeStepTimelineEntry[];
}

export type PortfolioInitiative = Initiative;

export interface InitiativeOverlap {
  id: string;
  challengeId: string;
  initiativeAId: string;
  initiativeBId: string;
  level: InitiativeOverlapLevel;
  rationale: string;
  recommendation: 'seguir' | 'fusionar' | 'reformular_una' | 'dejar_como_backup' | 'cerrar_una';
}

export interface PortfolioDecisionItem {
  id: string;
  challengeId: string;
  initiativeId: string;
  recommendation: PortfolioDecisionOutcome;
  summary: string;
  successReading: string;
  reviewReason: string;
}

export type PortfolioDecision = PortfolioDecisionItem;

export interface ExecutiveTimelineEntry {
  label: string;
  note: string;
}

export interface ExecutiveOutput {
  id: string;
  challengeId: string;
  initiativeId: string;
  recommendation: PortfolioDecisionOutcome;
  status: ExecutiveOutputStatus;
  whyNow: string;
  kpiToMove: string;
  approachSummary: string;
  scopeSummary: string;
  evidenceSummary: string;
  keyDeliverableSummary: string;
  cautionSummary: string;
  recommendationWhy: string;
  secondaryOptions: string;
  managementNeeds: string[];
  nextStepSummary: string;
  nextStepOwner: string;
  nextStepHorizon: string;
  nextStepExpectedResult: string;
  timeline: ExecutiveTimelineEntry[];
}

export type ExecutiveReport = ExecutiveOutput;

export interface EvidenceSummary {
  label: string;
  value: string;
  tone?: 'positive' | 'neutral' | 'risk';
}

export interface PortfolioAlert {
  id: string;
  tone: 'slate' | 'amber' | 'rose' | 'violet' | 'sky' | 'emerald';
  type?: 'decision' | 'activation' | 'coverage' | 'stakeholder' | 'blocker';
  title: string;
  description: string;
  contextLabel?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  actionLabel?: string;
  actionPath?: string;
  frontId?: string;
  challengeId?: string;
  initiativeId?: string;
}

export interface PortfolioNextAction {
  label: string;
  description: string;
  ctaLabel?: string;
  contextLabel?: string;
  impactLabel?: string;
  riskLabel?: string;
  path?: string;
  frontId?: string;
  challengeId?: string;
  initiativeId?: string;
}

export interface CreateChallengeInput {
  name: string;
  strategicFrontId: string;
  challengeType: ChallengeType | '';
  whatWeWantToMove: string;
  objective: string;
  whyNow: string;
  successCriteria: string;
  challengeOwner: string;
  sponsorName?: string;
  sponsorEmail?: string;
  horizon?: string;
  area?: string;
  notes?: string;
  challengeOwnerStatus?: StakeholderStatus;
  sponsorStatus?: StakeholderStatus;
  activationInputs?: Partial<ChallengeActivationInputs>;
  activationMode: ChallengeActivationMode;
  status: ChallengeStatus;
}

export interface PortfolioLeadState {
  strategicFronts: StrategicFront[];
  challenges: Challenge[];
  initiatives: Initiative[];
  initiativeOverlaps: InitiativeOverlap[];
  portfolioDecisions: PortfolioDecisionItem[];
  executiveOutputs: ExecutiveOutput[];
}

export interface PortfolioLeadSummary {
  fronts: number;
  activeFronts: number;
  challenges: number;
  activeChallenges: number;
  challengesReadyToActivate: number;
  initiatives: number;
  activeInitiatives: number;
  blockedInitiatives: number;
  pendingDecisions: number;
  executiveOutputs: number;
}

export interface PortfolioHomeBannerAction {
  label: string;
  path?: string;
  tone?: 'primary' | 'secondary' | 'ghost';
}

export interface PortfolioHomeSummaryCard {
  id: string;
  label: string;
  value: string;
  microcopy: string;
  tone: 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'slate';
  icon: 'fronts' | 'challenges' | 'activation' | 'blockers' | 'decisions';
  path?: string;
}

export interface PortfolioFrontOverviewCard {
  id: string;
  name: string;
  objective?: string;
  executiveState: 'En definición' | 'En curso' | 'Requiere atención' | 'Bloqueado' | 'Listo para decisión' | 'Cerrado';
  executiveTone: 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  mainKpi: string;
  progressPercent: number;
  progressLabel: string;
  stateReadout?: string;
  detail: string;
  challengesCount: number;
  initiativesCount: number;
  pendingDecisionsCount: number;
  createdLabel: string;
  lastActivityLabel: string;
  alerts: string[];
  nextAction: string;
  nextActionDescription: string;
  actionLabel: string;
  actionPath: string;
}

export interface PortfolioImportantChangeCard {
  id: string;
  impactLabel?: 'Impacto alto' | 'Impacto medio' | 'Impacto bajo';
  frontName: string;
  itemName: string;
  whyItMatters: string;
  risk: string;
  suggestedAction: string;
  actionLabel: string;
  actionPath?: string;
  tone: 'amber' | 'rose' | 'violet' | 'sky' | 'emerald' | 'slate';
  type: string;
}

export interface PortfolioPendingDecisionRow {
  id: string;
  decision: string;
  frontName: string;
  itemName: string;
  evidenceLevel: string;
  urgency: string;
  actionLabel: string;
  actionPath: string;
}

export interface PortfolioRecentActivityItem {
  id: string;
  label: string;
  description: string;
  timeLabel: string;
  tone: 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'slate';
}

export interface PortfolioWelcomeBannerActionGroup {
  primary: PortfolioHomeBannerAction;
  secondary: PortfolioHomeBannerAction;
  tertiary: PortfolioHomeBannerAction;
}

export interface PortfolioHomeExperienceModel {
  banner: {
    title: string;
    subtitle: string;
    actions: PortfolioWelcomeBannerActionGroup;
  };
  summaryCards: PortfolioHomeSummaryCard[];
  strategicFronts: PortfolioFrontOverviewCard[];
  importantChanges: PortfolioImportantChangeCard[];
  pendingDecisions: PortfolioPendingDecisionRow[];
  recentActivity: PortfolioRecentActivityItem[];
}

export interface PortfolioDecisionCard {
  id: string;
  initiativeId: string;
  initiativeName: string;
  challengeId: string;
  challengeName: string;
  frontId: string;
  frontName: string;
  evidenceLabel: string;
  evidenceSummary: string;
  suggestedRoute: string;
  evidenceLevel?: string;
  urgency?: string;
  actionLabel: string;
  actionPath: string;
}

export interface ReadyToActivateChallengeCard {
  id: string;
  name: string;
  frontId: string;
  frontName: string;
  challengeTypeLabel: string;
  urgencyLabel: string;
  challengeOwner: string;
  sponsor: string;
  actionLabel: string;
  actionPath: string;
}

export interface ActiveFrontCard {
  id: string;
  name: string;
  mainKpi: string;
  coverageLabel: string;
  challengesCount: number;
  initiativesCount: number;
  nextActionLabel: string;
  actionLabel: string;
  actionPath: string;
}

export interface PortfolioHomeHeader {
  title: string;
  summaryLine: string;
  supportingLine: string;
}

export interface PortfolioHomeEmptyState {
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
}

export interface HomeCommandCenterModel {
  header: PortfolioHomeHeader;
  nextAction: PortfolioNextAction;
  summary: PortfolioLeadSummary;
  alerts: PortfolioAlert[];
  pendingDecisions: PortfolioDecisionCard[];
  readyToActivateChallenges: ReadyToActivateChallengeCard[];
  activeFronts: ActiveFrontCard[];
  emptyState: PortfolioHomeEmptyState | null;
}

export interface StrategicFrontCardModel {
  id: string;
  name: string;
  strategicObjective: string;
  whyNow: string;
  sponsorEmail?: string;
  mainKpi: string;
  baseline: string;
  target: string;
  threshold?: string;
  horizon: string;
  endDate?: string;
  area?: string;
  sponsor: string;
  priority: StrategicFrontPriority;
  status: StrategicFrontStatus;
  statusLabel: string;
  lastUpdatedAt?: string;
  notes?: string;
  coverageStatus: 'sin_cobertura' | 'cobertura_parcial' | 'cobertura_suficiente' | 'necesita_reformulacion';
  coverageLabel: string;
  challengesCount: number;
  initiativesCount: number;
  blockedInitiativesCount: number;
  pendingDecisionsCount: number;
  areaLabel: string;
  relevantBlocker: string;
  nextActionLabel: string;
  nextActionDescription: string;
  actionLabel: string;
  actionPath: string;
  focusReason: string;
}

export interface StrategicFrontsSummary {
  totalFronts: number;
  activeFronts: number;
  frontsWithoutChallenges: number;
  partialCoverageFronts: number;
  frontsPendingDecision: number;
}

export interface StrategicFrontFocusRecommendation {
  frontId: string;
  frontName: string;
  title: string;
  description: string;
  whyItMatters: string;
  missingPiece: string;
  actionLabel: string;
  actionPath: string;
  impactLabel: string;
  riskLabel: string;
}

export interface ChallengeActivationReadiness {
  challengeId: string;
  activationState: 'solo_definido' | 'listo_para_activar' | 'activo_interno' | 'publicado';
  activationStateLabel: string;
  readyToActivate: boolean;
  missingItems: string[];
}

export interface ChallengeActivationRecommendationModel {
  challengeId: string;
  recommendedMode: ChallengeActivationMode;
  recommendedModeLabel: string;
  justification: string;
  risks: string[];
  missingItems: string[];
  nextSteps: string[];
  confidenceLabel: 'Alta' | 'Media' | 'Baja';
  confidenceScore: number;
  sponsorRisk: boolean;
}

export interface ChallengeCardModel {
  id: string;
  name: string;
  frontId: string;
  frontName: string;
  challengeTypeLabel: string;
  whatWeWantToMove: string;
  mainSignalLabel: string;
  urgencyLabel: string;
  horizonLabel: string;
  challengeOwner: string;
  sponsor: string;
  status: ChallengeStatus;
  statusLabel: string;
  activationMode: ChallengeActivationMode;
  activationModeLabel: string;
  activationState: ChallengeActivationReadiness['activationState'];
  activationStateLabel: string;
  coverageStatus: ChallengeCoverageStatus;
  coverageLabel: string;
  initiativesCount: number;
  blockedInitiativesCount: number;
  pendingDecisionsCount: number;
  nextActionLabel: string;
  nextActionDescription: string;
  actionLabel: string;
  actionPath: string;
  focusReason: string;
  relevantBlocker: string;
}

export interface ChallengesSummary {
  totalChallenges: number;
  readyToActivate: number;
  activeChallenges: number;
  challengesWithoutCoverage: number;
  partialCoverageChallenges: number;
  challengesWithPendingDecision: number;
  blockedChallenges: number;
}

export interface ChallengesByActivationState {
  soloDefinidos: ChallengeCardModel[];
  listosParaActivar: ChallengeCardModel[];
  activosInternos: ChallengeCardModel[];
  publicados: ChallengeCardModel[];
}

export interface ChallengeFocusRecommendation {
  challengeId: string;
  challengeName: string;
  frontName: string;
  title: string;
  description: string;
  whyItMatters: string;
  missingPiece: string;
  riskLabel: string;
  actionLabel: string;
  actionPath: string;
}

export interface PortfolioLeadContextValue extends PortfolioLeadState {
  createStrategicFront: (input: CreateStrategicFrontInput) => StrategicFront;
  updateStrategicFront: (frontId: string, input: CreateStrategicFrontInput) => void;
  updateStrategicFrontStatus: (frontId: string, status: StrategicFrontStatus) => void;
  createChallenge: (input: CreateChallengeInput) => Challenge;
  updateChallenge: (challengeId: string, input: Partial<Challenge>) => void;
  updateChallengeActivationMode: (challengeId: string, mode: ChallengeActivationMode) => void;
  updateChallengeActivationInputs: (challengeId: string, input: Partial<ChallengeActivationInputs>) => void;
  updateChallengeStakeholderStatus: (
    challengeId: string,
    stakeholder: 'challengeOwnerStatus' | 'sponsorStatus',
    status: StakeholderStatus,
  ) => void;
  acceptChallengeActivationRecommendation: (challengeId: string) => void;
  updateChallengeActivationRecommendationNote: (challengeId: string, note: string) => void;
  updateChallengeActivationMessageDraft: (challengeId: string, draft: string) => void;
  activateOpenCall: (challengeId: string) => void;
  addSelectedPerson: (challengeId: string, value: string) => void;
  updateSelectedPersonStatus: (challengeId: string, invitationId: string, status: InvitationStatus) => void;
  addSquadMember: (challengeId: string, value: string, role: SquadRole) => void;
  updateSquadMemberRole: (challengeId: string, memberId: string, role: SquadRole) => void;
  confirmAssignedSquad: (challengeId: string) => void;
  activateChallenge: (challengeId: string) => void;
  publishChallenge: (challengeId: string) => void;
  loadChallengeCoverageDemo: (challengeId: string) => void;
  createExecutiveOutput: (initiativeId: string, recommendation: PortfolioDecisionOutcome) => ExecutiveOutput | null;
  updateExecutiveOutputStatus: (outputId: string, status: ExecutiveOutputStatus) => void;
}

