import type {
  ConfidentialityLevel,
  Challenge,
  ChallengeCoverageStatus,
  ChallengeStatus,
  ChallengeType,
  ImportedItem,
  ImportedItemStatus,
  Initiative,
  InitiativePortfolioStatus,
  PortfolioStepNumber,
  RiskLevel,
  StepContentStatus,
  StepProgress,
  StepValidationStatus,
  StrategicFrontStatus,
  ContributionType,
  DecisionType,
  EvidenceVerificationStatus,
} from './types';

type NormalizedValue = string;

function normalizeByMap<T extends NormalizedValue>(
  value: string | null | undefined,
  map: Record<string, T>,
  fallback: T,
): T {
  if (!value) return fallback;
  return map[value] ?? map[value.toLowerCase()] ?? fallback;
}

const STRATEGIC_FRONT_STATUS_NORMALIZATION: Record<string, StrategicFrontStatus> = {
  draft: 'draft',
  active: 'with_active_challenges',
  tracking: 'in_tracking',
  paused: 'pending_decision',
  closed: 'closed',
  in_definition: 'in_definition',
  with_active_challenges: 'with_active_challenges',
  in_tracking: 'in_tracking',
  pending_decision: 'pending_decision',
};

const CHALLENGE_STATUS_NORMALIZATION: Record<string, ChallengeStatus> = {
  draft: 'draft',
  listo_para_activar: 'ready_to_activate',
  ready_to_activate: 'ready_to_activate',
  activo_interno: 'activating_team',
  activating_team: 'activating_team',
  publicado: 'active',
  active: 'active',
  recibiendo_iniciativas: 'receiving_initiatives',
  receiving_initiatives: 'receiving_initiatives',
  con_iniciativas_activas: 'in_tracking',
  in_tracking: 'in_tracking',
  pendiente_de_decision: 'pending_decision',
  pending_decision: 'pending_decision',
  cerrado: 'closed',
  closed: 'closed',
};

const CHALLENGE_COVERAGE_NORMALIZATION: Record<string, ChallengeCoverageStatus> = {
  no_coverage: 'no_coverage',
  sin_cobertura: 'no_coverage',
  partial: 'partial',
  cobertura_parcial: 'partial',
  sufficient: 'sufficient',
  cobertura_suficiente: 'sufficient',
  overlapped: 'overlapped',
  resuelto: 'ready_for_decision',
  ready_for_decision: 'ready_for_decision',
  cerrar: 'ready_for_decision',
  needs_reformulation: 'needs_reformulation',
  reformular: 'needs_reformulation',
  necesita_reformulacion: 'needs_reformulation',
};

const INITIATIVE_STATUS_NORMALIZATION: Record<string, InitiativePortfolioStatus> = {
  draft: 'draft',
  imported_pending_validation: 'imported_pending_validation',
  in_step_0: 'in_step_0',
  en_step_0: 'in_step_0',
  in_step_1: 'in_step_1',
  en_step_1: 'in_step_1',
  in_step_2: 'in_step_2',
  en_step_2: 'in_step_2',
  in_step_3: 'in_step_3',
  en_step_3: 'in_step_3',
  in_step_4: 'in_step_4',
  en_step_4: 'in_step_4',
  blocked: 'blocked',
  bloqueada: 'blocked',
  ready_for_decision: 'ready_for_decision',
  lista_para_decision: 'ready_for_decision',
  waiting_for_review: 'imported_pending_validation',
  esperando_revision: 'imported_pending_validation',
  closed: 'closed',
  cerrada: 'closed',
};

const STEP_CONTENT_NORMALIZATION: Record<string, StepContentStatus> = {
  empty: 'empty',
  partial: 'partial',
  complete_preliminary: 'complete_preliminary',
  complete_with_observations: 'complete_with_observations',
  validated: 'validated',
};

const STEP_VALIDATION_NORMALIZATION: Record<string, StepValidationStatus> = {
  not_reviewed: 'not_reviewed',
  ai_reviewed: 'ai_reviewed',
  requires_mentor: 'requires_mentor',
  requires_challenge_owner: 'requires_challenge_owner',
  requires_sponsor: 'requires_sponsor',
  approved: 'approved',
};

const EVIDENCE_VERIFICATION_NORMALIZATION: Record<string, EvidenceVerificationStatus> = {
  unverified: 'unverified',
  ai_detected: 'ai_detected',
  user_confirmed: 'user_confirmed',
  mentor_confirmed: 'mentor_confirmed',
};

const CHALLENGE_TYPE_NORMALIZATION: Record<string, ChallengeType> = {
  correction: 'correction',
  growth: 'growth',
  exploration: 'exploration',
  correccion: 'correction',
  crecimiento: 'growth',
  exploracion: 'exploration',
};

const CONTRIBUTION_TYPE_NORMALIZATION: Record<string, ContributionType> = {
  discover: 'discover',
  validate: 'validate',
  partially_solve: 'partially_solve',
  directly_solve: 'directly_solve',
  descubrir: 'discover',
  validar: 'validate',
  resolver_parcialmente: 'partially_solve',
  resolver_directamente: 'directly_solve',
};

const CONFIDENTIALITY_NORMALIZATION: Record<string, ConfidentialityLevel> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  no_ai_full_content: 'no_ai_full_content',
};

const IMPORTED_ITEM_STATUS_NORMALIZATION: Record<string, ImportedItemStatus> = {
  detected: 'detected',
  needs_classification: 'needs_classification',
  conflict: 'conflict',
  ready_to_publish: 'ready_to_publish',
  published: 'published',
  discarded: 'discarded',
};

const DECISION_TYPE_NORMALIZATION: Record<string, DecisionType> = {
  continue_validating: 'continue_validating',
  iterate: 'iterate',
  pivot: 'pivot',
  scale_same_area: 'scale_same_area',
  scale_similar_area: 'scale_similar_area',
  transfer_to_it: 'transfer_to_it',
  integrate_to_roadmap: 'integrate_to_roadmap',
  pause: 'pause',
  close_with_learning: 'close_with_learning',
  pasar_a_segunda_fase: 'scale_same_area',
  iterar_desde_otro_angulo: 'iterate',
  transferir_a_ti: 'transfer_to_it',
  transferir_al_area_afectada: 'integrate_to_roadmap',
  evaluar_innovacion_abierta: 'pivot',
  escalar_piloto: 'scale_same_area',
  cerrar_con_aprendizaje: 'close_with_learning',
};

export function normalizeStrategicFrontStatus(status: StrategicFrontStatus | string | null | undefined): StrategicFrontStatus {
  return normalizeByMap(status, STRATEGIC_FRONT_STATUS_NORMALIZATION, 'draft');
}

export function normalizeChallengeStatus(status: ChallengeStatus | string | null | undefined): ChallengeStatus {
  return normalizeByMap(status, CHALLENGE_STATUS_NORMALIZATION, 'draft');
}

export function normalizeChallengeCoverageStatus(
  status: ChallengeCoverageStatus | string | null | undefined,
): ChallengeCoverageStatus {
  return normalizeByMap(status, CHALLENGE_COVERAGE_NORMALIZATION, 'no_coverage');
}

export function normalizeInitiativeStatus(
  status: InitiativePortfolioStatus | string | null | undefined,
): InitiativePortfolioStatus {
  return normalizeByMap(status, INITIATIVE_STATUS_NORMALIZATION, 'draft');
}

export function normalizeStepContentStatus(status: StepContentStatus | string | null | undefined): StepContentStatus {
  return normalizeByMap(status, STEP_CONTENT_NORMALIZATION, 'empty');
}

export function normalizeStepValidationStatus(
  status: StepValidationStatus | string | null | undefined,
): StepValidationStatus {
  return normalizeByMap(status, STEP_VALIDATION_NORMALIZATION, 'not_reviewed');
}

export function normalizeEvidenceVerificationStatus(
  status: EvidenceVerificationStatus | string | null | undefined,
): EvidenceVerificationStatus {
  return normalizeByMap(status, EVIDENCE_VERIFICATION_NORMALIZATION, 'unverified');
}

export function normalizeImportedItemStatus(
  status: ImportedItemStatus | string | null | undefined,
): ImportedItemStatus {
  return normalizeByMap(status, IMPORTED_ITEM_STATUS_NORMALIZATION, 'detected');
}

export function normalizeDecisionType(value: DecisionType | string | null | undefined): DecisionType {
  return normalizeByMap(value, DECISION_TYPE_NORMALIZATION, 'continue_validating');
}

export function normalizeChallengeType(value: ChallengeType | string | null | undefined): ChallengeType {
  return normalizeByMap(value, CHALLENGE_TYPE_NORMALIZATION, 'exploration');
}

export function normalizeContributionType(value: ContributionType | string | null | undefined): ContributionType {
  return normalizeByMap(value, CONTRIBUTION_TYPE_NORMALIZATION, 'discover');
}

export function normalizeConfidentialityLevel(
  value: ConfidentialityLevel | string | null | undefined,
): ConfidentialityLevel {
  return normalizeByMap(value, CONFIDENTIALITY_NORMALIZATION, 'medium');
}

export function getConfidentialityAllowsFullAIProcessing(level: ConfidentialityLevel | string | null | undefined) {
  return normalizeConfidentialityLevel(level) !== 'no_ai_full_content';
}

export function isChallengeReadyToActivate(challenge: Pick<Challenge, 'challengeOwner' | 'challengeOwnerStatus' | 'sponsorStatus' | 'visibleToParticipants' | 'activationMode' | 'selectedPeople' | 'assignedSquad' | 'openCallStatus'> | null | undefined) {
  if (!challenge) return false;
  if (challenge.visibleToParticipants) return false;
  if (!challenge.challengeOwner.trim()) return false;
  if (challenge.challengeOwnerStatus !== 'confirmado') return false;
  if (challenge.sponsorStatus !== 'confirmado') return false;
  if (challenge.activationMode === 'convocatoria_abierta') return challenge.openCallStatus === 'activa';
  if (challenge.activationMode === 'personas_seleccionadas') return challenge.selectedPeople.length > 0;
  if (challenge.activationMode === 'squad_asignado' || challenge.activationMode === 'equipo_core_encargado') {
    return challenge.assignedSquad.length > 0;
  }
  if (challenge.activationMode === 'innovacion_abierta_partner_externo') {
    return challenge.selectedPeople.length > 0 || challenge.assignedSquad.length > 0;
  }
  return false;
}

export function canChallengeReceiveInitiatives(challenge: Pick<Challenge, 'status' | 'visibleToParticipants' | 'openCallStatus' | 'activationMode'> | null | undefined) {
  if (!challenge) return false;
  if (!challenge.visibleToParticipants) return false;
  const status = normalizeChallengeStatus(challenge.status);
  return status === 'active' || status === 'receiving_initiatives' || status === 'in_tracking';
}

export function isInitiativeReadyForDecision(initiative: Pick<Initiative, 'status' | 'currentStep' | 'readyForDecision'> | null | undefined) {
  if (!initiative) return false;
  const status = normalizeInitiativeStatus(initiative.status);
  return initiative.readyForDecision || initiative.currentStep === 'Step 4' || status === 'ready_for_decision';
}

export function canImportedItemBePublished(item: Pick<ImportedItem, 'status' | 'confidenceScore' | 'missingCriticalFields' | 'duplicateOfItemId'> | null | undefined) {
  if (!item) return false;
  return normalizeImportedItemStatus(item.status) === 'ready_to_publish'
    && item.confidenceScore >= 0.7
    && item.missingCriticalFields.length === 0
    && !item.duplicateOfItemId;
}

export function getStepProgressRiskLevel(stepProgress: Pick<StepProgress, 'contentStatus' | 'validationStatus' | 'completionScore' | 'missingCriticalFields' | 'risks'> | null | undefined): RiskLevel {
  if (!stepProgress) return 'medium';

  const contentStatus = normalizeStepContentStatus(stepProgress.contentStatus);
  const validationStatus = normalizeStepValidationStatus(stepProgress.validationStatus);
  const criticalCount = stepProgress.missingCriticalFields.length;
  const riskSignals = stepProgress.risks.length;

  if (validationStatus === 'requires_sponsor' || validationStatus === 'requires_challenge_owner') return 'high';
  if (contentStatus === 'empty' || stepProgress.completionScore < 35 || criticalCount >= 2 || riskSignals >= 3) return 'high';
  if (contentStatus === 'partial' || contentStatus === 'complete_with_observations' || stepProgress.completionScore < 75 || criticalCount > 0 || riskSignals > 0) {
    return 'medium';
  }
  return 'low';
}

export function normalizePortfolioStep(step: PortfolioStepNumber | number | string | null | undefined): PortfolioStepNumber {
  const numeric = typeof step === 'number' ? step : Number(step);
  if (Number.isNaN(numeric)) return 0;
  return Math.min(Math.max(Math.round(numeric), 0), 4) as PortfolioStepNumber;
}
