import type {
  Challenge,
  ChallengeCoverageStatus,
  ChallengeStatus,
  ChallengeType,
  ConfidentialityLevel,
  ContributionType,
  DecisionType,
  ExecutiveOutputStatus,
  Initiative,
  InitiativePortfolioStatus,
  PortfolioDecisionOutcome,
  ImportSessionStatus,
  ImportedItemStatus,
  StrategicFrontStatus,
  StatusCopy,
  StepContentStatus,
  StepValidationStatus,
} from './types';
import {
  normalizeChallengeCoverageStatus,
  normalizeChallengeStatus,
  normalizeChallengeType,
  normalizeConfidentialityLevel,
  normalizeContributionType,
  normalizeDecisionType,
  normalizeInitiativeStatus,
  normalizeStrategicFrontStatus,
} from './rules';

export const STRATEGIC_FRONT_STATUS_COPY: Record<
  | 'draft'
  | 'in_definition'
  | 'with_active_challenges'
  | 'in_tracking'
  | 'pending_decision'
  | 'closed',
  StatusCopy
> = {
  draft: { label: 'Borrador', shortLabel: 'Borrador', description: 'Aun no hay una definicion consolidada.', visualIntent: 'neutral' },
  in_definition: { label: 'En definicion', shortLabel: 'Definicion', description: 'Se esta aclarando el frente antes de activarlo.', visualIntent: 'info' },
  with_active_challenges: { label: 'Con retos activos', shortLabel: 'Retos activos', description: 'Ya tiene retos visibles en curso.', visualIntent: 'success' },
  in_tracking: { label: 'En seguimiento', shortLabel: 'Seguimiento', description: 'Tiene avance y necesita control cercano.', visualIntent: 'info' },
  pending_decision: { label: 'Pendiente de decision', shortLabel: 'Decision', description: 'Pide una definicion ejecutiva.', visualIntent: 'warning' },
  closed: { label: 'Cerrado', shortLabel: 'Cerrado', description: 'Ya no requiere seguimiento activo.', visualIntent: 'neutral' },
};

export const CHALLENGE_STATUS_COPY: Record<
  | 'draft'
  | 'ready_to_activate'
  | 'activating_team'
  | 'active'
  | 'receiving_initiatives'
  | 'in_tracking'
  | 'pending_decision'
  | 'closed',
  StatusCopy
> = {
  draft: { label: 'Borrador', shortLabel: 'Borrador', visualIntent: 'neutral' },
  ready_to_activate: { label: 'Listo para activar', shortLabel: 'Listo', visualIntent: 'info' },
  activating_team: { label: 'Activando equipo', shortLabel: 'Activando', description: 'Ya se esta configurando la modalidad de trabajo.', visualIntent: 'warning' },
  active: { label: 'Activo', shortLabel: 'Activo', visualIntent: 'success' },
  receiving_initiatives: { label: 'Recibiendo iniciativas', shortLabel: 'Recibiendo', visualIntent: 'success' },
  in_tracking: { label: 'En tracking', shortLabel: 'Tracking', visualIntent: 'info' },
  pending_decision: { label: 'Pendiente de decision', shortLabel: 'Decision', visualIntent: 'warning' },
  closed: { label: 'Cerrado', shortLabel: 'Cerrado', visualIntent: 'neutral' },
};

export const CHALLENGE_COVERAGE_COPY: Record<
  | 'no_coverage'
  | 'partial'
  | 'sufficient'
  | 'overlapped'
  | 'ready_for_decision'
  | 'needs_reformulation',
  StatusCopy
> = {
  no_coverage: { label: 'Sin cobertura', shortLabel: 'Sin cobertura', visualIntent: 'danger' },
  partial: { label: 'Cobertura parcial', shortLabel: 'Parcial', visualIntent: 'warning' },
  sufficient: { label: 'Cobertura suficiente', shortLabel: 'Suficiente', visualIntent: 'success' },
  overlapped: { label: 'Cobertura superpuesta', shortLabel: 'Superpuesta', visualIntent: 'purple' },
  ready_for_decision: { label: 'Lista para decision', shortLabel: 'Decision', visualIntent: 'info' },
  needs_reformulation: { label: 'Necesita reformulacion', shortLabel: 'Reformular', visualIntent: 'warning' },
};

export const INITIATIVE_STATUS_COPY: Record<
  | 'draft'
  | 'imported_pending_validation'
  | 'in_step_0'
  | 'in_step_1'
  | 'in_step_2'
  | 'in_step_3'
  | 'in_step_4'
  | 'blocked'
  | 'ready_for_decision'
  | 'closed',
  StatusCopy
> = {
  draft: { label: 'Borrador', shortLabel: 'Borrador', visualIntent: 'neutral' },
  imported_pending_validation: { label: 'Pendiente de validacion', shortLabel: 'Validar', visualIntent: 'warning' },
  in_step_0: { label: 'En Step 0', shortLabel: 'Step 0', visualIntent: 'info' },
  in_step_1: { label: 'En Step 1', shortLabel: 'Step 1', visualIntent: 'info' },
  in_step_2: { label: 'En Step 2', shortLabel: 'Step 2', visualIntent: 'info' },
  in_step_3: { label: 'En Step 3', shortLabel: 'Step 3', visualIntent: 'info' },
  in_step_4: { label: 'En Step 4', shortLabel: 'Step 4', visualIntent: 'info' },
  blocked: { label: 'Bloqueada', shortLabel: 'Bloqueada', visualIntent: 'danger' },
  ready_for_decision: { label: 'Lista para decision', shortLabel: 'Decision', visualIntent: 'purple' },
  closed: { label: 'Cerrada', shortLabel: 'Cerrada', visualIntent: 'neutral' },
};

export const STEP_CONTENT_STATUS_COPY: Record<
  'empty' | 'partial' | 'complete_preliminary' | 'complete_with_observations' | 'validated',
  StatusCopy
> = {
  empty: { label: 'Vacio', shortLabel: 'Vacio', visualIntent: 'neutral' },
  partial: { label: 'Parcial', shortLabel: 'Parcial', visualIntent: 'warning' },
  complete_preliminary: { label: 'Completo preliminar', shortLabel: 'Preliminar', visualIntent: 'info' },
  complete_with_observations: { label: 'Completo con observaciones', shortLabel: 'Observaciones', visualIntent: 'warning' },
  validated: { label: 'Validado', shortLabel: 'Validado', visualIntent: 'success' },
};

export const STEP_VALIDATION_STATUS_COPY: Record<
  'not_reviewed' | 'ai_reviewed' | 'requires_mentor' | 'requires_challenge_owner' | 'requires_sponsor' | 'approved',
  StatusCopy
> = {
  not_reviewed: { label: 'Sin revisar', shortLabel: 'Sin revisar', visualIntent: 'neutral' },
  ai_reviewed: { label: 'Revisado por IA', shortLabel: 'IA', visualIntent: 'info' },
  requires_mentor: { label: 'Requiere mentor', shortLabel: 'Mentor', visualIntent: 'warning' },
  requires_challenge_owner: { label: 'Requiere challenge owner', shortLabel: 'Owner', visualIntent: 'warning' },
  requires_sponsor: { label: 'Requiere sponsor', shortLabel: 'Sponsor', visualIntent: 'warning' },
  approved: { label: 'Aprobado', shortLabel: 'Aprobado', visualIntent: 'success' },
};

export const IMPORT_SESSION_STATUS_COPY: Record<ImportSessionStatus, StatusCopy> = {
  uploaded: { label: 'Cargado', shortLabel: 'Cargado', visualIntent: 'info' },
  processing: { label: 'Procesando', shortLabel: 'Procesando', visualIntent: 'warning' },
  review_required: { label: 'Requiere revision', shortLabel: 'Revision', visualIntent: 'warning' },
  partially_published: { label: 'Parcialmente publicado', shortLabel: 'Parcial', visualIntent: 'info' },
  published: { label: 'Publicado', shortLabel: 'Publicado', visualIntent: 'success' },
  failed: { label: 'Fallo', shortLabel: 'Fallo', visualIntent: 'danger' },
};

export const IMPORTED_ITEM_STATUS_COPY: Record<ImportedItemStatus, StatusCopy> = {
  detected: { label: 'Detectado', shortLabel: 'Detectado', visualIntent: 'info' },
  needs_classification: { label: 'Requiere clasificacion', shortLabel: 'Clasificar', visualIntent: 'warning' },
  conflict: { label: 'En conflicto', shortLabel: 'Conflicto', visualIntent: 'danger' },
  ready_to_publish: { label: 'Listo para publicar', shortLabel: 'Publicar', visualIntent: 'success' },
  published: { label: 'Publicado', shortLabel: 'Publicado', visualIntent: 'success' },
  discarded: { label: 'Descartado', shortLabel: 'Descartado', visualIntent: 'neutral' },
};

export const DECISION_TYPE_COPY: Record<DecisionType, StatusCopy> = {
  continue_validating: { label: 'Seguir validando', shortLabel: 'Validar', visualIntent: 'info' },
  iterate: { label: 'Iterar', shortLabel: 'Iterar', visualIntent: 'warning' },
  pivot: { label: 'Pivotar', shortLabel: 'Pivot', visualIntent: 'purple' },
  scale_same_area: { label: 'Escalar misma area', shortLabel: 'Escalar', visualIntent: 'success' },
  scale_similar_area: { label: 'Escalar area similar', shortLabel: 'Escalar', visualIntent: 'success' },
  transfer_to_it: { label: 'Transferir a TI', shortLabel: 'TI', visualIntent: 'info' },
  integrate_to_roadmap: { label: 'Integrar a roadmap', shortLabel: 'Roadmap', visualIntent: 'info' },
  pause: { label: 'Pausar', shortLabel: 'Pausar', visualIntent: 'warning' },
  close_with_learning: { label: 'Cerrar con aprendizaje', shortLabel: 'Cerrar', visualIntent: 'neutral' },
};

export const CHALLENGE_TYPE_COPY: Record<'correction' | 'growth' | 'exploration', StatusCopy> = {
  correction: { label: 'Correccion', shortLabel: 'Correccion', visualIntent: 'info' },
  growth: { label: 'Crecimiento', shortLabel: 'Crecimiento', visualIntent: 'success' },
  exploration: { label: 'Exploracion', shortLabel: 'Exploracion', visualIntent: 'purple' },
};

export const CONTRIBUTION_TYPE_COPY: Record<'discover' | 'validate' | 'partially_solve' | 'directly_solve', StatusCopy> = {
  discover: { label: 'Descubrir', shortLabel: 'Descubrir', visualIntent: 'info' },
  validate: { label: 'Validar', shortLabel: 'Validar', visualIntent: 'warning' },
  partially_solve: { label: 'Resolver parcialmente', shortLabel: 'Parcial', visualIntent: 'purple' },
  directly_solve: { label: 'Resolver directamente', shortLabel: 'Directo', visualIntent: 'success' },
};

export const CONFIDENTIALITY_LEVEL_COPY: Record<ConfidentialityLevel, StatusCopy> = {
  low: { label: 'Baja', shortLabel: 'Baja', visualIntent: 'success' },
  medium: { label: 'Media', shortLabel: 'Media', visualIntent: 'info' },
  high: { label: 'Alta', shortLabel: 'Alta', visualIntent: 'warning' },
  no_ai_full_content: { label: 'Sin IA', shortLabel: 'Sin IA', visualIntent: 'danger' },
};

export const PORTFOLIO_DECISION_OUTCOME_COPY: Record<
  'pasar_a_segunda_fase' | 'iterar_desde_otro_angulo' | 'transferir_a_ti' | 'transferir_al_area_afectada' | 'evaluar_innovacion_abierta' | 'escalar_piloto' | 'cerrar_con_aprendizaje',
  StatusCopy
> = {
  pasar_a_segunda_fase: { label: 'Pasar a segunda fase', shortLabel: 'Segunda fase', visualIntent: 'info' },
  iterar_desde_otro_angulo: { label: 'Iterar desde otro angulo', shortLabel: 'Iterar', visualIntent: 'warning' },
  transferir_a_ti: { label: 'Transferir a TI', shortLabel: 'TI', visualIntent: 'info' },
  transferir_al_area_afectada: { label: 'Transferir al area afectada', shortLabel: 'Area', visualIntent: 'info' },
  evaluar_innovacion_abierta: { label: 'Evaluar innovacion abierta', shortLabel: 'Innovacion', visualIntent: 'purple' },
  escalar_piloto: { label: 'Escalar piloto', shortLabel: 'Escalar', visualIntent: 'success' },
  cerrar_con_aprendizaje: { label: 'Cerrar con aprendizaje', shortLabel: 'Cerrar', visualIntent: 'neutral' },
};

function copyLabel(map: Record<string, StatusCopy>, value: string) {
  return map[value] ?? { label: value, shortLabel: value };
}

export function challengeStatusLabel(status: ChallengeStatus) {
  return copyLabel(CHALLENGE_STATUS_COPY, normalizeChallengeStatus(status)).label;
}

export function strategicFrontStatusLabel(status: StrategicFrontStatus) {
  return copyLabel(STRATEGIC_FRONT_STATUS_COPY, normalizeStrategicFrontStatus(status)).label;
}

export function activationLabel(mode: Challenge['activationMode']) {
  const labels = {
    convocatoria_abierta: 'Convocatoria abierta',
    personas_seleccionadas: 'Personas seleccionadas',
    squad_asignado: 'Squad asignado',
    equipo_core_encargado: 'Equipo core encargado',
    innovacion_abierta_partner_externo: 'Innovacion abierta / partner externo',
    mantener_en_definicion: 'Mantener en definicion',
  } as const;
  return labels[mode];
}

export function challengeActivationStateLabel(
  value: 'solo_definido' | 'listo_para_activar' | 'activo_interno' | 'publicado',
) {
  const labels = {
    solo_definido: 'Solo definido',
    listo_para_activar: 'Listo para activar',
    activo_interno: 'Activo interno',
    publicado: 'Publicado',
  } as const;
  return labels[value];
}

export function challengeTypeLabel(type: ChallengeType | '') {
  if (!type) return 'Sin clasificar todavia';
  return copyLabel(CHALLENGE_TYPE_COPY, normalizeChallengeType(type)).label;
}

export function contributionTypeLabel(type: ContributionType | '') {
  if (!type) return 'Sin contribucion';
  return copyLabel(CONTRIBUTION_TYPE_COPY, normalizeContributionType(type)).label;
}

export function confidentialityLevelLabel(level: ConfidentialityLevel) {
  return copyLabel(CONFIDENTIALITY_LEVEL_COPY, normalizeConfidentialityLevel(level)).label;
}

export function coverageLabel(value: ChallengeCoverageStatus | 'necesita_reformulacion') {
  return copyLabel(CHALLENGE_COVERAGE_COPY, normalizeChallengeCoverageStatus(value)).label;
}

export function publicationToneClasses(status: ChallengeStatus) {
  switch (normalizeChallengeStatus(status)) {
    case 'pending_decision':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'in_tracking':
    case 'receiving_initiatives':
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'ready_to_activate':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'activating_team':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'closed':
      return 'border-slate-300 bg-slate-200 text-slate-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

export function initiativeStatusLabel(status: InitiativePortfolioStatus) {
  return copyLabel(INITIATIVE_STATUS_COPY, normalizeInitiativeStatus(status)).label;
}

export function portfolioDecisionLabel(outcome: DecisionType | PortfolioDecisionOutcome) {
  const legacy = PORTFOLIO_DECISION_OUTCOME_COPY[outcome as keyof typeof PORTFOLIO_DECISION_OUTCOME_COPY];
  if (legacy) return legacy.label;
  return copyLabel(DECISION_TYPE_COPY, normalizeDecisionType(outcome)).label;
}

export function stepContentStatusLabel(status: StepContentStatus) {
  return copyLabel(STEP_CONTENT_STATUS_COPY, status).label;
}

export function stepValidationStatusLabel(status: StepValidationStatus) {
  return copyLabel(STEP_VALIDATION_STATUS_COPY, status).label;
}

export function importSessionStatusLabel(status: ImportSessionStatus) {
  return copyLabel(IMPORT_SESSION_STATUS_COPY, status).label;
}

export function importedItemStatusLabel(status: ImportedItemStatus) {
  return copyLabel(IMPORTED_ITEM_STATUS_COPY, status).label;
}

export function decisionTypeLabel(status: DecisionType) {
  return copyLabel(DECISION_TYPE_COPY, status).label;
}

export function executiveOutputStatusLabel(status: ExecutiveOutputStatus) {
  const labels: Record<ExecutiveOutputStatus, string> = {
    borrador_ejecutivo: 'Borrador ejecutivo',
    listo_para_compartir: 'Listo para compartir',
    compartido_con_sponsor: 'Compartido con sponsor',
    compartido_con_gerencia: 'Compartido con gerencia',
    decision_recibida: 'Decision recibida',
    aprobado: 'Aprobado',
    aprobado_con_ajustes: 'Aprobado con ajustes',
    rechazado: 'Rechazado',
    transferido: 'Transferido',
    escalado_a_segunda_fase: 'Escalado a segunda fase',
    cerrado: 'Cerrado',
  };
  return labels[status];
}

export function participantCtaLabel(challenge: Challenge, invited: boolean) {
  void challenge;
  void invited;
  return 'Abrir reto';
}

export function challengeExecutiveSummary(challenge: Challenge, initiatives: Initiative[]) {
  const related = initiatives.filter(item => item.challengeId === challenge.id);
  const active = related.filter(item => {
    const status = normalizeInitiativeStatus(item.status);
    return status !== 'blocked' && status !== 'closed';
  }).length;
  const blocked = related.filter(item => normalizeInitiativeStatus(item.status) === 'blocked').length;
  const ready = related.filter(item => item.readyForDecision || item.currentStep === 'Step 4' || normalizeInitiativeStatus(item.status) === 'ready_for_decision').length;

  let nextAction = 'Mantener seguimiento del reto.';
  if (!challenge.visibleToParticipants) {
    nextAction = 'Publicar el reto para que llegue a participantes.';
  } else if (related.length === 0) {
    nextAction = challenge.activationMode === 'convocatoria_abierta'
      ? 'Esperar postulaciones o reforzar la difusion.'
      : challenge.activationMode === 'personas_seleccionadas'
        ? 'Dar seguimiento a las invitaciones pendientes.'
        : 'Confirmar que el squad arranque la primera iniciativa.';
  } else if (ready > 0) {
    nextAction = 'Llevar las iniciativas listas a la cola de decisiones.';
  } else if (blocked > 0) {
    nextAction = 'Destrabar las iniciativas bloqueadas o redefinir su destino.';
  }

  return {
    total: related.length,
    active,
    blocked,
    ready,
    nextAction,
  };
}
