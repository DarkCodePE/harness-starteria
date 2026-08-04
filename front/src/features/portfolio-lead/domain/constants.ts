import type {
  ChallengeCoverageStatusCanonical,
  ChallengeStatusCanonical,
  DecisionType,
  ExecutiveOutputStatus,
  ImportedItemStatus,
  InitiativePortfolioStatus,
  PortfolioRole,
  StatusVisualConfig,
  StepContentStatus,
  StepValidationStatus,
  StrategicFrontStatusCanonical,
  StrategicFrontStatus,
  ImportSessionStatus,
} from './types';

export const PORTFOLIO_LEAD_ROUTE_BASE = '/portfolio';
export const PORTFOLIO_LEAD_HOME_PATH = '/portfolio/inicio';
export const PORTFOLIO_LEAD_DEMO_EMAIL = 'portfolio@starteria.io';

export const PORTFOLIO_LEAD_ALLOWED_ROLES: PortfolioRole[] = ['portfolio_lead'];

export const ACTIVE_FRONT_STATUSES: StrategicFrontStatus[] = [
  'active',
  'tracking',
  'with_active_challenges',
  'in_tracking',
];
export const NON_ACTIVE_INITIATIVE_STATUSES: InitiativePortfolioStatus[] = ['blocked', 'closed', 'bloqueada', 'cerrada'];
export const DECISION_RELEVANT_INITIATIVE_STATUSES: InitiativePortfolioStatus[] = [
  'blocked',
  'ready_for_decision',
  'bloqueada',
  'lista_para_decision',
];
export const FINAL_EXECUTIVE_OUTPUT_STATUSES: ExecutiveOutputStatus[] = [
  'aprobado',
  'aprobado_con_ajustes',
  'rechazado',
  'transferido',
  'escalado_a_segunda_fase',
  'cerrado',
];

export const STRATEGIC_FRONT_STATUS_VISUAL: Record<StrategicFrontStatusCanonical, StatusVisualConfig> = {
  draft: { label: 'Borrador', shortLabel: 'Borrador', tone: 'neutral', iconKey: 'file', description: 'Aun no hay definicion suficiente.' },
  in_definition: { label: 'En definición', shortLabel: 'Definición', tone: 'info', iconKey: 'flag', description: 'Se esta aclarando el frente antes de activarlo.' },
  with_active_challenges: { label: 'Con retos activos', shortLabel: 'Retos activos', tone: 'success', iconKey: 'target', description: 'Ya tiene retos visibles en curso.' },
  in_tracking: { label: 'En seguimiento', shortLabel: 'Seguimiento', tone: 'info', iconKey: 'sparkles', description: 'El frente tiene avance y requiere control cercano.' },
  pending_decision: { label: 'Pendiente de decisión', shortLabel: 'Decisión', tone: 'warning', iconKey: 'decision', description: 'Necesita una definición ejecutiva antes de continuar.' },
  closed: { label: 'Cerrado', shortLabel: 'Cerrado', tone: 'neutral', iconKey: 'lock', description: 'El frente ya no requiere seguimiento activo.' },
};

export const CHALLENGE_STATUS_VISUAL: Record<ChallengeStatusCanonical, StatusVisualConfig> = {
  draft: { label: 'Borrador', shortLabel: 'Borrador', tone: 'neutral', iconKey: 'file' },
  ready_to_activate: { label: 'Listo para activar', shortLabel: 'Listo', tone: 'info', iconKey: 'rocket' },
  activating_team: { label: 'Activando equipo', shortLabel: 'Activando', tone: 'warning', iconKey: 'users', description: 'Ya se esta configurando la modalidad de trabajo.' },
  active: { label: 'Activo', shortLabel: 'Activo', tone: 'success', iconKey: 'target' },
  receiving_initiatives: { label: 'Recibiendo iniciativas', shortLabel: 'Recibiendo', tone: 'success', iconKey: 'sparkles' },
  in_tracking: { label: 'En tracking', shortLabel: 'Tracking', tone: 'info', iconKey: 'flag' },
  pending_decision: { label: 'Pendiente de decisión', shortLabel: 'Decisión', tone: 'warning', iconKey: 'decision' },
  closed: { label: 'Cerrado', shortLabel: 'Cerrado', tone: 'neutral', iconKey: 'lock' },
};

export const CHALLENGE_COVERAGE_VISUAL: Record<ChallengeCoverageStatusCanonical, StatusVisualConfig> = {
  no_coverage: { label: 'Sin cobertura', shortLabel: 'Sin cobertura', tone: 'danger', iconKey: 'alert' },
  partial: { label: 'Cobertura parcial', shortLabel: 'Parcial', tone: 'warning', iconKey: 'flag' },
  sufficient: { label: 'Cobertura suficiente', shortLabel: 'Suficiente', tone: 'success', iconKey: 'check' },
  overlapped: { label: 'Cobertura superpuesta', shortLabel: 'Superpuesta', tone: 'purple', iconKey: 'sparkles' },
  ready_for_decision: { label: 'Lista para decisión', shortLabel: 'Decisión', tone: 'info', iconKey: 'decision' },
  needs_reformulation: { label: 'Necesita reformulación', shortLabel: 'Reformular', tone: 'warning', iconKey: 'flag' },
};

export const INITIATIVE_STATUS_VISUAL: Record<InitiativePortfolioStatus, StatusVisualConfig> = {
  draft: { label: 'Borrador', shortLabel: 'Borrador', tone: 'neutral', iconKey: 'file' },
  imported_pending_validation: { label: 'Pendiente de validación', shortLabel: 'Validar', tone: 'warning', iconKey: 'alert' },
  in_step_0: { label: 'En Step 0', shortLabel: 'Step 0', tone: 'info', iconKey: 'flag' },
  in_step_1: { label: 'En Step 1', shortLabel: 'Step 1', tone: 'info', iconKey: 'flag' },
  in_step_2: { label: 'En Step 2', shortLabel: 'Step 2', tone: 'info', iconKey: 'flag' },
  in_step_3: { label: 'En Step 3', shortLabel: 'Step 3', tone: 'info', iconKey: 'flag' },
  in_step_4: { label: 'En Step 4', shortLabel: 'Step 4', tone: 'info', iconKey: 'flag' },
  blocked: { label: 'Bloqueada', shortLabel: 'Bloqueada', tone: 'danger', iconKey: 'alert' },
  ready_for_decision: { label: 'Lista para decisión', shortLabel: 'Decisión', tone: 'purple', iconKey: 'decision' },
  closed: { label: 'Cerrada', shortLabel: 'Cerrada', tone: 'neutral', iconKey: 'lock' },
  en_step_0: { label: 'En Step 0', shortLabel: 'Step 0', tone: 'info', iconKey: 'flag' },
  en_step_1: { label: 'En Step 1', shortLabel: 'Step 1', tone: 'info', iconKey: 'flag' },
  en_step_2: { label: 'En Step 2', shortLabel: 'Step 2', tone: 'info', iconKey: 'flag' },
  en_step_3: { label: 'En Step 3', shortLabel: 'Step 3', tone: 'info', iconKey: 'flag' },
  en_step_4: { label: 'En Step 4', shortLabel: 'Step 4', tone: 'info', iconKey: 'flag' },
  bloqueada: { label: 'Bloqueada', shortLabel: 'Bloqueada', tone: 'danger', iconKey: 'alert' },
  esperando_revision: { label: 'Pendiente de validación', shortLabel: 'Validar', tone: 'warning', iconKey: 'alert' },
  lista_para_decision: { label: 'Lista para decisión', shortLabel: 'Decisión', tone: 'purple', iconKey: 'decision' },
  cerrada: { label: 'Cerrada', shortLabel: 'Cerrada', tone: 'neutral', iconKey: 'lock' },
};

export const STEP_CONTENT_STATUS_VISUAL: Record<StepContentStatus, StatusVisualConfig> = {
  empty: { label: 'Vacío', shortLabel: 'Vacío', tone: 'neutral', iconKey: 'file' },
  partial: { label: 'Parcial', shortLabel: 'Parcial', tone: 'warning', iconKey: 'flag' },
  complete_preliminary: { label: 'Completo preliminar', shortLabel: 'Preliminar', tone: 'info', iconKey: 'sparkles' },
  complete_with_observations: { label: 'Completo con observaciones', shortLabel: 'Observaciones', tone: 'warning', iconKey: 'alert' },
  validated: { label: 'Validado', shortLabel: 'Validado', tone: 'success', iconKey: 'check' },
};

export const STEP_VALIDATION_STATUS_VISUAL: Record<StepValidationStatus, StatusVisualConfig> = {
  not_reviewed: { label: 'Sin revisar', shortLabel: 'Sin revisar', tone: 'neutral', iconKey: 'file' },
  ai_reviewed: { label: 'Revisado por IA', shortLabel: 'IA', tone: 'info', iconKey: 'sparkles' },
  requires_mentor: { label: 'Requiere mentor', shortLabel: 'Mentor', tone: 'warning', iconKey: 'users' },
  requires_challenge_owner: { label: 'Requiere challenge owner', shortLabel: 'Owner', tone: 'warning', iconKey: 'users' },
  requires_sponsor: { label: 'Requiere sponsor', shortLabel: 'Sponsor', tone: 'warning', iconKey: 'users' },
  approved: { label: 'Aprobado', shortLabel: 'Aprobado', tone: 'success', iconKey: 'check' },
};

export const IMPORT_SESSION_STATUS_VISUAL: Record<ImportSessionStatus, StatusVisualConfig> = {
  uploaded: { label: 'Cargado', shortLabel: 'Cargado', tone: 'info', iconKey: 'file' },
  processing: { label: 'Procesando', shortLabel: 'Procesando', tone: 'warning', iconKey: 'sparkles' },
  review_required: { label: 'Requiere revisión', shortLabel: 'Revisión', tone: 'warning', iconKey: 'alert' },
  partially_published: { label: 'Parcialmente publicado', shortLabel: 'Parcial', tone: 'info', iconKey: 'flag' },
  published: { label: 'Publicado', shortLabel: 'Publicado', tone: 'success', iconKey: 'check' },
  failed: { label: 'Falló', shortLabel: 'Falló', tone: 'danger', iconKey: 'alert' },
};

export const IMPORTED_ITEM_STATUS_VISUAL: Record<ImportedItemStatus, StatusVisualConfig> = {
  detected: { label: 'Detectado', shortLabel: 'Detectado', tone: 'info', iconKey: 'sparkles' },
  needs_classification: { label: 'Requiere clasificación', shortLabel: 'Clasificar', tone: 'warning', iconKey: 'flag' },
  conflict: { label: 'En conflicto', shortLabel: 'Conflicto', tone: 'danger', iconKey: 'alert' },
  ready_to_publish: { label: 'Listo para publicar', shortLabel: 'Publicar', tone: 'success', iconKey: 'rocket' },
  published: { label: 'Publicado', shortLabel: 'Publicado', tone: 'success', iconKey: 'check' },
  discarded: { label: 'Descartado', shortLabel: 'Descartado', tone: 'neutral', iconKey: 'lock' },
};

export const DECISION_TYPE_VISUAL: Record<DecisionType, StatusVisualConfig> = {
  continue_validating: { label: 'Seguir validando', shortLabel: 'Validar', tone: 'info', iconKey: 'sparkles' },
  iterate: { label: 'Iterar', shortLabel: 'Iterar', tone: 'warning', iconKey: 'flag' },
  pivot: { label: 'Pivotar', shortLabel: 'Pivot', tone: 'purple', iconKey: 'decision' },
  scale_same_area: { label: 'Escalar misma área', shortLabel: 'Escalar', tone: 'success', iconKey: 'rocket' },
  scale_similar_area: { label: 'Escalar área similar', shortLabel: 'Escalar', tone: 'success', iconKey: 'rocket' },
  transfer_to_it: { label: 'Transferir a TI', shortLabel: 'TI', tone: 'info', iconKey: 'users' },
  integrate_to_roadmap: { label: 'Integrar a roadmap', shortLabel: 'Roadmap', tone: 'info', iconKey: 'flag' },
  pause: { label: 'Pausar', shortLabel: 'Pausar', tone: 'warning', iconKey: 'alert' },
  close_with_learning: { label: 'Cerrar con aprendizaje', shortLabel: 'Cerrar', tone: 'neutral', iconKey: 'check' },
};
