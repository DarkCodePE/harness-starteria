import type {
  Challenge,
  ChallengeActivationMode,
  ChallengeCoverageStatus,
  ChallengeStatus,
  ChallengeType,
  ExecutiveOutputStatus,
  Initiative,
  InitiativePortfolioStatus,
  PortfolioDecisionOutcome,
  StrategicFrontStatus,
} from './types';
import { getPendingDecisions } from './selectors';

export function challengeStatusLabel(status: ChallengeStatus) {
  const labels: Record<ChallengeStatus, string> = {
    draft: 'Draft',
    listo_para_activar: 'Listo para activar',
    activo_interno: 'Activo interno',
    publicado: 'Publicado',
    recibiendo_iniciativas: 'Recibiendo iniciativas',
    con_iniciativas_activas: 'Con iniciativas activas',
    pendiente_de_decision: 'Pendiente de decision',
    cerrado: 'Cerrado',
  };
  return labels[status];
}

export function strategicFrontStatusLabel(status: StrategicFrontStatus) {
  const labels: Record<StrategicFrontStatus, string> = {
    draft: 'Borrador',
    active: 'Activo',
    tracking: 'En seguimiento',
    paused: 'Pausado',
    closed: 'Cerrado',
  };
  return labels[status];
}

export function activationLabel(mode: ChallengeActivationMode) {
  const labels: Record<ChallengeActivationMode, string> = {
    convocatoria_abierta: 'Convocatoria abierta',
    personas_seleccionadas: 'Personas seleccionadas',
    squad_asignado: 'Squad asignado',
    equipo_core_encargado: 'Equipo core encargado',
    innovacion_abierta_partner_externo: 'Innovacion abierta / partner externo',
    mantener_en_definicion: 'Mantener en definicion',
  };
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
  };
  return labels[value];
}

export function challengeTypeLabel(type: ChallengeType | '') {
  const labels: Record<ChallengeType, string> = {
    correccion: 'Correccion',
    crecimiento: 'Crecimiento',
    exploracion: 'Exploracion',
  };
  return type ? labels[type] : 'Sin clasificar todavia';
}

export function coverageLabel(value: ChallengeCoverageStatus | 'necesita_reformulacion') {
  const labels: Record<ChallengeCoverageStatus | 'necesita_reformulacion', string> = {
    sin_cobertura: 'Sin cobertura',
    cobertura_parcial: 'Cobertura parcial',
    cobertura_suficiente: 'Cobertura suficiente',
    resuelto: 'Resuelto',
    reformular: 'Reformular',
    cerrar: 'Cerrar',
    necesita_reformulacion: 'Necesita reformulacion',
  };
  return labels[value];
}

export function publicationToneClasses(status: ChallengeStatus) {
  switch (status) {
    case 'pendiente_de_decision':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'con_iniciativas_activas':
    case 'recibiendo_iniciativas':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'publicado':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'activo_interno':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'listo_para_activar':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'cerrado':
      return 'border-slate-300 bg-slate-200 text-slate-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

export function initiativeStatusLabel(status: InitiativePortfolioStatus) {
  const labels: Record<InitiativePortfolioStatus, string> = {
    en_step_0: 'En Step 0',
    en_step_1: 'En Step 1',
    en_step_2: 'En Step 2',
    en_step_3: 'En Step 3',
    en_step_4: 'En Step 4',
    bloqueada: 'Bloqueada',
    esperando_revision: 'Esperando revision',
    lista_para_decision: 'Lista para decision',
    cerrada: 'Cerrada',
  };
  return labels[status];
}

export function portfolioDecisionLabel(outcome: PortfolioDecisionOutcome) {
  const labels: Record<PortfolioDecisionOutcome, string> = {
    pasar_a_segunda_fase: 'Pasar a segunda fase',
    iterar_desde_otro_angulo: 'Iterar desde otro angulo',
    transferir_a_ti: 'Transferir a TI',
    transferir_al_area_afectada: 'Transferir al area afectada',
    evaluar_innovacion_abierta: 'Evaluar innovacion abierta',
    escalar_piloto: 'Escalar piloto',
    cerrar_con_aprendizaje: 'Cerrar con aprendizaje',
  };
  return labels[outcome];
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
  const active = related.filter(item => !['bloqueada', 'cerrada'].includes(item.status)).length;
  const blocked = related.filter(item => item.status === 'bloqueada').length;
  const ready = getPendingDecisions(related).filter(item => item.status !== 'bloqueada').length;

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
