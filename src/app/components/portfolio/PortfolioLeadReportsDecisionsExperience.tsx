import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Compass,
  ExternalLink,
  FileSearch,
  FileText,
  Filter,
  FolderOpen,
  Download,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  usePortfolioLead,
  type Challenge,
  type ExecutiveOutput,
  type Initiative,
  type PortfolioDecisionItem,
  type PortfolioDecisionOutcome,
  type StrategicFront,
} from '../../portfolio/PortfolioLeadContext';
import {
  challengeTypeLabel,
  executiveOutputStatusLabel,
} from '../../portfolio/portfolioLeadCopy';
import { PortfolioLeadBreadcrumbs, PortfolioLeadEmptyState } from './PortfolioLeadPageElements';

type InitiativeStep = Initiative['stepsTimeline'][number]['step'];
type InitiativeDeliverable = Initiative['deliverables'][number];
type DeliverableStepBucket = InitiativeStep | 'Sin paso claro';

type DecisionRoute =
  | 'continuar_validando'
  | 'iterar_solucion'
  | 'pivotear'
  | 'escalar_misma_area'
  | 'escalar_area_similar'
  | 'escalar_otra_linea'
  | 'transferir_ti_industrializar'
  | 'activar_innovacion_abierta'
  | 'integrar_a_roadmap'
  | 'pausar'
  | 'cerrar_con_aprendizaje';

type DecisionObjective = 'aprender' | 'iterar' | 'escalar' | 'transferir' | 'reportar' | 'cerrar';
type ResultMetric = 'negativo' | 'neutro' | 'positivo' | 'fuerte';
type EvidenceQuality = 'debil' | 'media' | 'fuerte';
type AdoptionLevel = 'baja' | 'media' | 'alta';
type SupportLevel = 'bajo' | 'medio' | 'alto';
type DependencyLevel = 'baja' | 'media' | 'alta';
type SolutionMaturity = 'concepto' | 'prototipo' | 'piloto' | 'operacion_parcial';
type RiskLevel = 'bajo' | 'medio' | 'alto';
type SponsorInterest = 'no' | 'parcial' | 'si';
type ReplicabilityLevel = 'baja' | 'media' | 'alta';
type StrategicValue = 'bajo' | 'medio' | 'alto';

type BoardRouteGroup = 'all' | 'escalar' | 'iterar' | 'pivotear' | 'transferir' | 'pausar' | 'cerrar';
type BoardEvidenceFilter = 'all' | 'suficiente' | 'parcial' | 'insuficiente';
type BoardSponsorFilter = 'all' | 'pendiente' | 'interesado' | 'confirmado';
type BoardCloseStateFilter = 'all' | 'terminada' | 'lista_para_decision' | 'decision_registrada' | 'cerrada';
type BoardTypeFilter = 'all' | Challenge['challengeType'];

type BoardFilters = {
  frontId: string;
  challengeId: string;
  challengeType: BoardTypeFilter;
  closeState: BoardCloseStateFilter;
  routeGroup: BoardRouteGroup;
  evidence: BoardEvidenceFilter;
  sponsor: BoardSponsorFilter;
  search: string;
};

type DecisionDraft = {
  resultMetric: ResultMetric;
  qualitativeEvidence: EvidenceQuality;
  adoptionObserved: AdoptionLevel;
  supportRequired: SupportLevel;
  creatorDependency: DependencyLevel;
  solutionMaturity: SolutionMaturity;
  technicalRisk: RiskLevel;
  sponsorInterest: SponsorInterest;
  replicability: ReplicabilityLevel;
  strategicValue: StrategicValue;
  objective: DecisionObjective;
  selectedRoute?: DecisionRoute;
};

type DecisionRecord = {
  id: string;
  initiativeId: string;
  author: string;
  date: string;
  route: DecisionRoute;
  reason: string;
  evidenceUsed: string[];
  nextStep: string;
  confidence: 'baja' | 'media' | 'alta';
};

type DecisionRecommendation = {
  route: DecisionRoute;
  routeLabel: string;
  confidence: 'baja' | 'media' | 'alta';
  confidenceScore: number;
  why: string;
  evidenceUsed: string[];
  missingValidation: string;
  risks: string[];
  nextSteps: string[];
  decisionRequest: string;
};

type DecisionViewModel = {
  initiative: Initiative;
  challenge: Challenge | null;
  front: StrategicFront | null;
  decisionItem: PortfolioDecisionItem | null;
  output: ExecutiveOutput | null;
  closed: boolean;
  evidenceTitles: string[];
  evidenceCount: number;
  contributionLabel: 'Baja' | 'Media' | 'Alta';
  contributionScore: number;
  scalePotentialLabel: 'Bajo' | 'Medio' | 'Alto';
  scalePotentialScore: number;
  resultSummary: string;
  coverageLabel: string;
  noCloseReason: string;
  recommendation: DecisionRecommendation;
  readyForDecision: boolean;
  evidenceInsufficient: boolean;
};

type BoardRow = {
  viewModel: DecisionViewModel;
  closeState: Exclude<BoardCloseStateFilter, 'all'>;
  routeGroup: Exclude<BoardRouteGroup, 'all'>;
  evidenceState: Exclude<BoardEvidenceFilter, 'all'>;
  sponsorState: Exclude<BoardSponsorFilter, 'all'>;
  highlightedResult: string;
  metricMoved: string;
  evidenceSummary: string;
  deliverablesSummary: string;
  decisionStateLabel: string;
  finalStateLabel: string;
  challengeTypeLabel: string;
  frontName: string;
  challengeName: string;
  ownerName: string;
};

const RESULT_OPTIONS: Array<{ value: ResultMetric; label: string }> = [
  { value: 'negativo', label: 'Negativo' },
  { value: 'neutro', label: 'Neutro' },
  { value: 'positivo', label: 'Positivo' },
  { value: 'fuerte', label: 'Fuerte' },
];

const EVIDENCE_OPTIONS: Array<{ value: EvidenceQuality; label: string }> = [
  { value: 'debil', label: 'Débil' },
  { value: 'media', label: 'Media' },
  { value: 'fuerte', label: 'Fuerte' },
];

const ADOPTION_OPTIONS: Array<{ value: AdoptionLevel; label: string }> = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const SUPPORT_OPTIONS: Array<{ value: SupportLevel; label: string }> = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

const DEPENDENCY_OPTIONS: Array<{ value: DependencyLevel; label: string }> = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const MATURITY_OPTIONS: Array<{ value: SolutionMaturity; label: string }> = [
  { value: 'concepto', label: 'Concepto' },
  { value: 'prototipo', label: 'Prototipo' },
  { value: 'piloto', label: 'Piloto' },
  { value: 'operacion_parcial', label: 'Operación parcial' },
];

const RISK_OPTIONS: Array<{ value: RiskLevel; label: string }> = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

const SPONSOR_OPTIONS: Array<{ value: SponsorInterest; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'si', label: 'Sí' },
];

const REPLICABILITY_OPTIONS: Array<{ value: ReplicabilityLevel; label: string }> = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const STRATEGIC_VALUE_OPTIONS: Array<{ value: StrategicValue; label: string }> = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

const OBJECTIVE_OPTIONS: Array<{ value: DecisionObjective; label: string }> = [
  { value: 'aprender', label: 'Aprender' },
  { value: 'iterar', label: 'Iterar' },
  { value: 'escalar', label: 'Escalar' },
  { value: 'transferir', label: 'Transferir' },
  { value: 'reportar', label: 'Reportar' },
  { value: 'cerrar', label: 'Cerrar' },
];

const ROUTE_OPTIONS: Array<{ value: DecisionRoute; label: string; description: string }> = [
  { value: 'continuar_validando', label: 'Continuar validando', description: 'Todavía falta más evidencia para decidir con confianza.' },
  { value: 'iterar_solucion', label: 'Iterar solución', description: 'La dirección es correcta, pero la solución todavía necesita ajustes.' },
  { value: 'pivotear', label: 'Pivotear', description: 'Conviene cambiar el enfoque de la solución o el problema abordado.' },
  { value: 'escalar_misma_area', label: 'Escalar en la misma área', description: 'Hay tracción suficiente dentro del mismo contexto operativo.' },
  { value: 'escalar_area_similar', label: 'Escalar a área similar', description: 'Puede replicarse en un contexto vecino con poco ajuste.' },
  { value: 'escalar_otra_linea', label: 'Escalar a otra línea de negocio', description: 'La señal es fuerte y el valor estratégico es alto.' },
  { value: 'transferir_ti_industrializar', label: 'Transferir a TI / industrializar', description: 'La solución necesita implementación formal o soporte técnico.' },
  { value: 'activar_innovacion_abierta', label: 'Activar innovación abierta', description: 'El caso requiere aliados externos o una búsqueda abierta.' },
  { value: 'integrar_a_roadmap', label: 'Integrar a roadmap', description: 'Ya hay un camino claro para convertirlo en ejecución formal.' },
  { value: 'pausar', label: 'Pausar', description: 'Conviene frenar la inversión hasta aclarar la situación.' },
  { value: 'cerrar_con_aprendizaje', label: 'Cerrar con aprendizaje', description: 'La iniciativa ya dejó suficiente aprendizaje para documentar el cierre.' },
];

const routeLabelMap: Record<DecisionRoute, string> = ROUTE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<DecisionRoute, string>);

const routeToPortfolioOutcome: Record<DecisionRoute, PortfolioDecisionOutcome> = {
  continuar_validando: 'iterar_desde_otro_angulo',
  iterar_solucion: 'iterar_desde_otro_angulo',
  pivotear: 'iterar_desde_otro_angulo',
  escalar_misma_area: 'escalar_piloto',
  escalar_area_similar: 'escalar_piloto',
  escalar_otra_linea: 'pasar_a_segunda_fase',
  transferir_ti_industrializar: 'transferir_a_ti',
  activar_innovacion_abierta: 'evaluar_innovacion_abierta',
  integrar_a_roadmap: 'pasar_a_segunda_fase',
  pausar: 'iterar_desde_otro_angulo',
  cerrar_con_aprendizaje: 'cerrar_con_aprendizaje',
};

const FILTER_TYPE_OPTIONS: Array<{ value: BoardTypeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'correccion', label: 'Corrección' },
  { value: 'crecimiento', label: 'Crecimiento' },
  { value: 'exploracion', label: 'Exploración' },
];

const FILTER_CLOSE_OPTIONS: Array<{ value: BoardCloseStateFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'terminada', label: 'Terminada' },
  { value: 'lista_para_decision', label: 'Lista para decisión' },
  { value: 'decision_registrada', label: 'Decisión registrada' },
  { value: 'cerrada', label: 'Cerrada' },
];

const FILTER_ROUTE_OPTIONS: Array<{ value: BoardRouteGroup; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'escalar', label: 'Escalar' },
  { value: 'iterar', label: 'Iterar' },
  { value: 'pivotear', label: 'Pivotear' },
  { value: 'transferir', label: 'Transferir' },
  { value: 'pausar', label: 'Pausar' },
  { value: 'cerrar', label: 'Cerrar' },
];

const FILTER_EVIDENCE_OPTIONS: Array<{ value: BoardEvidenceFilter; label: string }> = [
  { value: 'all', label: 'Toda' },
  { value: 'suficiente', label: 'Suficiente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'insuficiente', label: 'Insuficiente' },
];

const FILTER_SPONSOR_OPTIONS: Array<{ value: BoardSponsorFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'interesado', label: 'Interesado' },
  { value: 'confirmado', label: 'Confirmado' },
];

const STEP_ORDER: InitiativeStep[] = ['Step 0', 'Step 1', 'Step 2', 'Step 3', 'Step 4'];

function coverageLabel(value: string) {
  const labels: Record<string, string> = {
    sin_cobertura: 'Sin cobertura',
    cobertura_parcial: 'Cobertura parcial',
    cobertura_suficiente: 'Cobertura suficiente',
    resuelto: 'Resuelto',
    reformular: 'Necesita reformulación',
    cerrar: 'Cerrar',
  };
  return labels[value] ?? value;
}

function formatTodayLabel() {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
}

function contributionLabel(score: number): 'Baja' | 'Media' | 'Alta' {
  if (score >= 7) return 'Alta';
  if (score >= 4) return 'Media';
  return 'Baja';
}

function potentialLabel(score: number): 'Bajo' | 'Medio' | 'Alto' {
  if (score >= 7) return 'Alto';
  if (score >= 4) return 'Medio';
  return 'Bajo';
}

function confidenceLabel(score: number): 'baja' | 'media' | 'alta' {
  if (score >= 8) return 'alta';
  if (score >= 5) return 'media';
  return 'baja';
}

function toneForLevel(value: string) {
  const tones: Record<string, string> = {
    alta: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    alto: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    media: 'border-amber-200 bg-amber-50 text-amber-700',
    medio: 'border-amber-200 bg-amber-50 text-amber-700',
    baja: 'border-slate-200 bg-slate-50 text-slate-600',
    bajo: 'border-slate-200 bg-slate-50 text-slate-600',
    debil: 'border-rose-200 bg-rose-50 text-rose-700',
    fuerte: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    negativo: 'border-rose-200 bg-rose-50 text-rose-700',
    neutro: 'border-slate-200 bg-slate-50 text-slate-600',
    positivo: 'border-amber-200 bg-amber-50 text-amber-700',
    concepto: 'border-slate-200 bg-slate-50 text-slate-600',
    prototipo: 'border-amber-200 bg-amber-50 text-amber-700',
    piloto: 'border-violet-200 bg-violet-50 text-violet-700',
    operacion_parcial: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pendiente: 'border-amber-200 bg-amber-50 text-amber-700',
    validado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    aprender: 'border-slate-200 bg-slate-50 text-slate-600',
    iterar: 'border-amber-200 bg-amber-50 text-amber-700',
    escalar: 'border-violet-200 bg-violet-50 text-violet-700',
    transferir: 'border-amber-200 bg-amber-50 text-amber-700',
    reportar: 'border-sky-200 bg-sky-50 text-sky-700',
    cerrar: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    si: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    parcial: 'border-amber-200 bg-amber-50 text-amber-700',
    no: 'border-slate-200 bg-slate-50 text-slate-600',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  };
  return tones[value] ?? 'border-slate-200 bg-slate-50 text-slate-600';
}

function scoreValue<T extends string>(value: T, mapping: Record<T, number>) {
  return mapping[value];
}

function getRouteTone(route: DecisionRoute) {
  if (route.includes('cerrar')) return 'emerald';
  if (route.includes('escalar') || route.includes('integrar')) return 'violet';
  if (route.includes('transferir') || route.includes('activar')) return 'amber';
  if (route.includes('pausar')) return 'slate';
  return 'sky';
}

function getRouteBadgeText(route: DecisionRoute) {
  return routeLabelMap[route];
}

function getEvidenceHighlight(initiative: Initiative) {
  const titles = initiative.deliverables.slice(0, 3).map(item => item.title);
  return titles.length > 0 ? titles.join(' · ') : 'Sin entregables visibles';
}

function getEvidenceState(initiative: Initiative): Exclude<BoardEvidenceFilter, 'all'> {
  if (initiative.deliverables.length === 0 || initiative.partialSignal) return 'insuficiente';
  if (initiative.deliverables.length === 1) return 'parcial';
  return 'suficiente';
}

function getRouteGroup(route: DecisionRoute): Exclude<BoardRouteGroup, 'all'> {
  if (route.includes('escalar') || route.includes('integrar')) return 'escalar';
  if (route.includes('transferir') || route.includes('activar')) return 'transferir';
  if (route.includes('pausar')) return 'pausar';
  if (route.includes('cerrar')) return 'cerrar';
  if (route.includes('pivot')) return 'pivotear';
  return 'iterar';
}

function getSponsorState(challenge: Challenge | null): Exclude<BoardSponsorFilter, 'all'> {
  if (!challenge || challenge.sponsorStatus === 'definido') return 'pendiente';
  if (challenge.sponsorStatus === 'notificado') return 'interesado';
  return 'confirmado';
}

function inferDeliverableStep(deliverable: InitiativeDeliverable): DeliverableStepBucket {
  const text = `${deliverable.title} ${deliverable.note}`.toLowerCase();
  if (/(deck|presentaci|story|cierre|roadmap|plan ejecutivo|presentación ejecutiva)/i.test(text)) return 'Step 4';
  if (/(resultado|aprendiz|experimento|piloto|test|prueba|métrica|metrica|hallazgo)/i.test(text)) return 'Step 3';
  if (/(hmw|idea|matriz|selecci|test card|protot|mockup|mvp|flujo|soluci|valid)/i.test(text)) return 'Step 2';
  if (/(entrevista|contexto|aline|restric|foco|problema|evidencia|investig|insight)/i.test(text)) return 'Step 1';
  return 'Step 0';
}

function getStepLabel(step: InitiativeStep | DeliverableStepBucket) {
  return step;
}

function buildDefaultDecisionDraft(initiative: Initiative, challenge: Challenge | null, front: StrategicFront | null): DecisionDraft {
  const evidenceCount = initiative.deliverables.length;
  const contribution: Record<Initiative['estimatedContribution'], ResultMetric> = {
    bajo: 'neutro',
    medio: 'positivo',
    alto: 'fuerte',
  };

  return {
    resultMetric: contribution[initiative.estimatedContribution],
    qualitativeEvidence: evidenceCount >= 3 ? 'fuerte' : evidenceCount >= 1 ? 'media' : 'debil',
    adoptionObserved: initiative.status === 'cerrada' || initiative.currentStep === 'Step 4' ? 'alta' : initiative.currentStep === 'Step 3' ? 'media' : 'baja',
    supportRequired: initiative.requiresExternalCapability ? 'alto' : initiative.requiresSponsor ? 'medio' : 'bajo',
    creatorDependency: initiative.teamMembers.length <= 1 ? 'alta' : initiative.teamMembers.length <= 2 ? 'media' : 'baja',
    solutionMaturity: initiative.status === 'cerrada' || initiative.currentStep === 'Step 4'
      ? 'operacion_parcial'
      : initiative.readyForDecision
        ? 'piloto'
        : initiative.currentStep === 'Step 3'
          ? 'prototipo'
          : 'concepto',
    technicalRisk: initiative.requiresExternalCapability || /tecnic|integraci|sistema/i.test(initiative.mainBlocker) ? 'alto' : initiative.partialSignal ? 'medio' : 'bajo',
    sponsorInterest: challenge?.sponsorStatus === 'confirmado' ? 'si' : challenge?.sponsorStatus === 'notificado' ? 'parcial' : 'no',
    replicability: initiative.contributionType === 'resolver_directamente' ? 'alta' : initiative.contributionType === 'resolver_parcialmente' ? 'media' : 'baja',
    strategicValue: front?.priority === 'Critica' || front?.priority === 'Alta' ? 'alto' : front?.priority === 'Media' ? 'medio' : 'bajo',
    objective: initiative.status === 'cerrada'
      ? 'cerrar'
      : initiative.readyForDecision || initiative.currentStep === 'Step 4'
        ? 'escalar'
        : 'iterar',
  };
}

function buildDecisionRecommendation(initiative: Initiative, challenge: Challenge | null, front: StrategicFront | null, draft: DecisionDraft): DecisionRecommendation {
  const metricWeights: Record<ResultMetric, number> = { negativo: 0, neutro: 1, positivo: 2, fuerte: 3 };
  const evidenceWeights: Record<EvidenceQuality, number> = { debil: 0, media: 1, fuerte: 3 };
  const adoptionWeights: Record<AdoptionLevel, number> = { baja: 0, media: 1, alta: 2 };
  const supportWeights: Record<SupportLevel, number> = { bajo: 0, medio: 1, alto: 2 };
  const dependencyWeights: Record<DependencyLevel, number> = { baja: 0, media: 1, alta: 2 };
  const maturityWeights: Record<SolutionMaturity, number> = { concepto: 0, prototipo: 1, piloto: 2, operacion_parcial: 3 };
  const riskWeights: Record<RiskLevel, number> = { bajo: 0, medio: 1, alto: 2 };
  const sponsorWeights: Record<SponsorInterest, number> = { no: 0, parcial: 1, si: 2 };
  const replicabilityWeights: Record<ReplicabilityLevel, number> = { baja: 0, media: 1, alta: 2 };
  const strategicWeights: Record<StrategicValue, number> = { bajo: 0, medio: 1, alto: 2 };

  const resultScore = scoreValue(draft.resultMetric, metricWeights);
  const evidenceScore = scoreValue(draft.qualitativeEvidence, evidenceWeights);
  const adoptionScore = scoreValue(draft.adoptionObserved, adoptionWeights);
  const supportScore = scoreValue(draft.supportRequired, supportWeights);
  const dependencyScore = scoreValue(draft.creatorDependency, dependencyWeights);
  const maturityScore = scoreValue(draft.solutionMaturity, maturityWeights);
  const riskScore = scoreValue(draft.technicalRisk, riskWeights);
  const sponsorScore = scoreValue(draft.sponsorInterest, sponsorWeights);
  const replicabilityScore = scoreValue(draft.replicability, replicabilityWeights);
  const strategicScore = scoreValue(draft.strategicValue, strategicWeights);

  const hasMetricMovement = resultScore >= 2;
  const evidenceGap = draft.qualitativeEvidence === 'debil' || resultScore <= 1 || evidenceScore <= 0;

  const evidenceUsed = [
    `Resultado de métrica: ${draft.resultMetric}`,
    `Evidencia cualitativa: ${draft.qualitativeEvidence}`,
    `Adopción observada: ${draft.adoptionObserved}`,
    `Madurez de solución: ${draft.solutionMaturity.replace('_', ' ')}`,
    `Evidencia visible: ${getEvidenceHighlight(initiative)}`,
  ];

  const chooseScaleRoute = (): DecisionRoute => {
    if (draft.technicalRisk === 'alto' || draft.supportRequired === 'alto') return 'transferir_ti_industrializar';
    if (draft.sponsorInterest === 'si' && draft.strategicValue === 'alto' && draft.replicability === 'alta') {
      return draft.adoptionObserved === 'alta' ? 'escalar_otra_linea' : 'escalar_area_similar';
    }
    if (draft.replicability === 'alta') return 'escalar_misma_area';
    if (draft.replicability === 'media') return 'escalar_area_similar';
    return 'integrar_a_roadmap';
  };

  let route: DecisionRoute = 'continuar_validando';

  if (draft.objective === 'cerrar') {
    route = evidenceGap ? 'pausar' : 'cerrar_con_aprendizaje';
  } else if (draft.objective === 'transferir') {
    route = draft.technicalRisk === 'alto' || draft.supportRequired === 'alto'
      ? 'transferir_ti_industrializar'
      : 'escalar_area_similar';
  } else if (draft.objective === 'escalar') {
    route = evidenceGap || !hasMetricMovement ? 'iterar_solucion' : chooseScaleRoute();
  } else if (draft.objective === 'reportar') {
    route = evidenceGap ? 'continuar_validando' : 'integrar_a_roadmap';
  } else if (draft.objective === 'aprender') {
    route = evidenceGap ? 'continuar_validando' : 'cerrar_con_aprendizaje';
  } else {
    route = evidenceGap || !hasMetricMovement ? 'iterar_solucion' : (draft.solutionMaturity === 'concepto' ? 'iterar_solucion' : chooseScaleRoute());
  }

  if (evidenceGap && ['escalar_misma_area', 'escalar_area_similar', 'escalar_otra_linea', 'transferir_ti_industrializar', 'activar_innovacion_abierta', 'integrar_a_roadmap'].includes(route)) {
    route = draft.objective === 'transferir' ? 'transferir_ti_industrializar' : 'iterar_solucion';
  }

  if (draft.solutionMaturity === 'concepto' && route !== 'continuar_validando' && route !== 'iterar_solucion') {
    route = evidenceGap ? 'continuar_validando' : 'iterar_solucion';
  }

  const confidenceRaw = resultScore + evidenceScore + adoptionScore + maturityScore + strategicScore + sponsorScore + replicabilityScore - riskScore - supportScore - dependencyScore;
  const routeIsEscalation = ['escalar_misma_area', 'escalar_area_similar', 'escalar_otra_linea', 'transferir_ti_industrializar', 'activar_innovacion_abierta', 'integrar_a_roadmap'].includes(route);
  const confidenceBase = confidenceLabel(confidenceRaw);
  const confidence: 'baja' | 'media' | 'alta' = routeIsEscalation && (evidenceGap || !hasMetricMovement)
    ? (confidenceBase === 'alta' ? 'media' : confidenceBase)
    : confidenceBase;

  const risks: string[] = [];
  if (draft.technicalRisk === 'alto') risks.push('Riesgo técnico alto.');
  if (draft.supportRequired === 'alto') risks.push('Requiere mucho soporte para avanzar.');
  if (draft.creatorDependency === 'alta') risks.push('La solución depende demasiado del equipo creador.');
  if (draft.sponsorInterest === 'no' && route.includes('escalar')) risks.push('El sponsor todavía no muestra interés visible.');
  if (draft.qualitativeEvidence === 'debil') risks.push('La evidencia cualitativa sigue siendo débil.');

  const missingValidation: string[] = [];
  if (draft.qualitativeEvidence === 'debil') missingValidation.push('Falta evidencia cualitativa más sólida.');
  if (!hasMetricMovement) missingValidation.push('Falta una métrica movida lo bastante visible para sostener una escalada.');
  if (draft.adoptionObserved === 'baja') missingValidation.push('Falta observar adopción real fuera del equipo creador.');
  if (draft.solutionMaturity === 'concepto' || draft.solutionMaturity === 'prototipo') missingValidation.push('La solución aún no llega a una madurez de piloto.');
  if (draft.sponsorInterest === 'no' && ['escalar_misma_area', 'escalar_area_similar', 'escalar_otra_linea', 'integrar_a_roadmap'].includes(route)) {
    missingValidation.push('Todavía falta sponsor interesado para sostener el siguiente paso.');
  }

  const nextStepsByRoute: Record<DecisionRoute, string[]> = {
    continuar_validando: [
      'Recoger una nueva señal con mayor alcance o contexto.',
      'Definir qué validación falta antes de pedir decisión.',
    ],
    iterar_solucion: [
      'Ajustar la solución y volver a probar en un alcance pequeño.',
      'Revisar qué hipótesis cambió y cómo afecta el resultado.',
    ],
    pivotear: [
      'Cambiar el enfoque de la solución o el problema abordado.',
      'Replantear la hipótesis antes de seguir invirtiendo.',
    ],
    escalar_misma_area: [
      'Extender la solución al mismo contexto operativo.',
      'Definir sponsor, responsable y fecha de siguiente hito.',
    ],
    escalar_area_similar: [
      'Probar la solución en un área vecina con contexto parecido.',
      'Validar qué ajustes menores necesita para replicarse.',
    ],
    escalar_otra_linea: [
      'Presentar el caso a una línea de negocio con mayor alcance.',
      'Alinear narrativa, sponsor y nivel de inversión requerido.',
    ],
    transferir_ti_industrializar: [
      'Formalizar el traspaso técnico y definir responsables de industrialización.',
      'Documentar dependencias, riesgos y alcance de implementación.',
    ],
    activar_innovacion_abierta: [
      'Abrir búsqueda de aliados o soluciones externas.',
      'Redactar el problema y los criterios de selección.',
    ],
    integrar_a_roadmap: [
      'Llevar el caso al roadmap formal con sponsor y fecha.',
      'Traducir el aprendizaje en una iniciativa de ejecución.',
    ],
    pausar: [
      'Pausar la inversión hasta aclarar la brecha principal.',
      'Revisar si conviene retomar, transferir o cerrar.',
    ],
    cerrar_con_aprendizaje: [
      'Documentar lo aprendido y el criterio de cierre.',
      'Comunicar la decisión al sponsor o comité con evidencia.',
    ],
  };

  const decisionRequestByRoute: Record<DecisionRoute, string> = {
    continuar_validando: '¿Autorizas continuar validando antes de escalar o cerrar?',
    iterar_solucion: '¿Apruebas iterar la solución y volver a probar?',
    pivotear: '¿Autoriza pivotear el enfoque de esta iniciativa?',
    escalar_misma_area: '¿Apruebas escalarla dentro de la misma área?',
    escalar_area_similar: '¿Apruebas llevarla a un área similar?',
    escalar_otra_linea: '¿Autorizas escalarla a otra línea de negocio?',
    transferir_ti_industrializar: '¿Autorizas transferirla a TI para industrializarla?',
    activar_innovacion_abierta: '¿Autorizas activar innovación abierta para este caso?',
    integrar_a_roadmap: '¿Apruebas integrarla al roadmap formal?',
    pausar: '¿Aprobamos pausar esta iniciativa temporalmente?',
    cerrar_con_aprendizaje: '¿Apruebas cerrarla y documentar el aprendizaje?',
  };

  return {
    route,
    routeLabel: routeLabelMap[route],
    confidence,
    confidenceScore: confidenceRaw,
    why: `La iniciativa muestra resultado ${draft.resultMetric}, evidencia ${draft.qualitativeEvidence} y adopción ${draft.adoptionObserved}. Con madurez ${draft.solutionMaturity.replace('_', ' ')} y valor estratégico ${draft.strategicValue}, la ruta más prudente es ${routeLabelMap[route].toLowerCase()}.`,
    evidenceUsed,
    missingValidation: missingValidation.length > 0 ? missingValidation.join(' ') : 'No faltan validaciones críticas visibles.',
    risks,
    nextSteps: nextStepsByRoute[route],
    decisionRequest: decisionRequestByRoute[route],
  };
}

function mapRouteToOutcome(route: DecisionRoute): PortfolioDecisionOutcome {
  return routeToPortfolioOutcome[route];
}

function buildDecisionViewModel(
  initiative: Initiative,
  challenge: Challenge | null,
  front: StrategicFront | null,
  decisionItem: PortfolioDecisionItem | null,
  output: ExecutiveOutput | null,
): DecisionViewModel {
  const closed = initiative.currentStep === 'Step 4' || initiative.status === 'lista_para_decision' || initiative.status === 'cerrada';
  const ownerPending = challenge?.challengeOwnerStatus !== 'confirmado';
  const sponsorPending = challenge?.sponsorStatus !== 'confirmado';
  const evidenceTitles = initiative.deliverables.slice(0, 3).map(item => item.title);
  const evidenceCount = initiative.deliverables.length;
  const contributionScore = initiative.estimatedContribution === 'alto' ? 8 : initiative.estimatedContribution === 'medio' ? 5 : 2;
  const scalePotentialScore = initiative.contributionType === 'resolver_directamente'
    ? 8
    : initiative.contributionType === 'resolver_parcialmente'
      ? 5
      : 3;
  const coverage = challenge ? coverageLabel(challenge.coverageStatus) : 'Sin cobertura';
  const noCloseReason = closed ? 'Cierre visible' : getNoCloseCause(initiative, sponsorPending, ownerPending);
  const draft = buildDefaultDecisionDraft(initiative, challenge, front);
  const recommendation = buildDecisionRecommendation(initiative, challenge, front, draft);

  return {
    initiative,
    challenge,
    front,
    decisionItem,
    output,
    closed,
    evidenceTitles,
    evidenceCount,
    contributionLabel: contributionLabel(contributionScore),
    contributionScore,
    scalePotentialLabel: potentialLabel(scalePotentialScore),
    scalePotentialScore,
    resultSummary: decisionItem?.successReading ?? initiative.executiveSummary ?? initiative.signalSummary,
    coverageLabel: coverage,
    noCloseReason,
    recommendation,
    readyForDecision: closed,
    evidenceInsufficient: evidenceCount === 0 || initiative.partialSignal,
  };
}

function getNoCloseCause(initiative: Initiative, sponsorPending: boolean, ownerPending: boolean) {
  if (ownerPending || !initiative.teamOwner.trim()) return 'Falta de owner';
  if (sponsorPending || (initiative.requiresSponsor && !initiative.sponsorTouchpoint.trim())) return 'Falta de sponsor';
  if (initiative.requiresExternalCapability || /tecnic|integraci|sistema/i.test(initiative.mainBlocker)) return 'Bloqueo técnico';
  if (initiative.partialSignal || initiative.currentStep !== 'Step 4' || initiative.status === 'esperando_revision') return 'Evidencia insuficiente';
  if (/reto|enfoque|defini/i.test(initiative.mainBlocker)) return 'Reto mal definido';
  return 'Otra causa';
}

function getDecisionStateLabel(hasDecision: boolean, initiative: Initiative, readyForDecision: boolean) {
  if (hasDecision) return 'Decisión registrada';
  if (initiative.status === 'cerrada') return 'Cerrada';
  if (readyForDecision) return 'Lista para decisión';
  return 'Terminada';
}

function getCloseState(hasDecision: boolean, initiative: Initiative, readyForDecision: boolean): Exclude<BoardCloseStateFilter, 'all'> {
  if (hasDecision) return 'decision_registrada';
  if (initiative.status === 'cerrada') return 'cerrada';
  if (readyForDecision) return 'lista_para_decision';
  return 'terminada';
}

function getFinalStateLabel(hasDecision: boolean, initiative: Initiative) {
  if (hasDecision) return 'Decisión registrada';
  if (initiative.status === 'cerrada') return 'Cerrada';
  if (initiative.currentStep === 'Step 4') return 'Terminada';
  return 'Terminada';
}

function InfoCard({ label, value, helper }: { label: string; value?: React.ReactNode; helper?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-2 text-base font-semibold text-slate-950">
        {value ?? 'No definido'}
      </div>
      {helper ? (
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function Pill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneForLevel(tone)}`}>
      {children}
    </span>
  );
}

function DecisionInputSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value as T)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DecisionRoutePicker({
  selectedRoute,
  recommendedRoute,
  onChange,
}: {
  selectedRoute: DecisionRoute;
  recommendedRoute: DecisionRoute;
  onChange: (route: DecisionRoute) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ROUTE_OPTIONS.map(option => {
        const isSelected = selectedRoute === option.value;
        const isRecommended = recommendedRoute === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-3xl border p-4 text-left transition ${isSelected ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{option.label}</p>
              {isRecommended ? (
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${isSelected ? 'border-white/30 text-white' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
                  Recomendada
                </span>
              ) : null}
            </div>
            <p className={`mt-2 text-sm ${isSelected ? 'text-white/85' : 'text-slate-600'}`}>{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function StepStateTone(state: string) {
  if (state === 'completado') return 'emerald';
  if (state === 'en_progreso') return 'amber';
  if (state === 'bloqueado') return 'rose';
  return 'slate';
}

function StepBadge({ step, state, note, evidence }: { step: InitiativeStep; state: string; note: string; evidence: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{step}</p>
        <Pill tone={StepStateTone(state)}>{state.replace('_', ' ')}</Pill>
      </div>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
      <p className="mt-3 text-xs text-slate-500">Output principal</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{evidence}</p>
    </div>
  );
}

function DecisionRecommendationPanel({
  viewModel,
  draft,
}: {
  viewModel: DecisionViewModel;
  draft: DecisionDraft;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-slate-700" />
        <p className="text-xs font-semibold text-slate-500">RECOMENDACIÓN IA</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoCard label="Ruta recomendada" value={viewModel.recommendation.routeLabel} helper="La IA prioriza evidencia, madurez y capacidad de escalamiento." />
        <InfoCard label="Nivel de confianza" value={viewModel.recommendation.confidence.toUpperCase()} helper={`Score interno ${Math.max(0, viewModel.recommendation.confidenceScore)}`} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoCard label="Por qué recomienda esta ruta" value={viewModel.recommendation.why} />
        <InfoCard label="Decisión solicitada" value={viewModel.recommendation.decisionRequest} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoCard
          label="Evidencia usada"
          value={viewModel.recommendation.evidenceUsed.join(' · ')}
          helper="Incluye resultado, evidencia cualitativa, adopción y madurez."
        />
        <InfoCard
          label="Qué falta validar"
          value={viewModel.recommendation.missingValidation}
          helper="Si esta parte sigue débil, evita escalar con confianza alta."
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoCard label="Riesgos" value={viewModel.recommendation.risks.length > 0 ? viewModel.recommendation.risks.join(' · ') : 'Sin riesgos críticos visibles'} />
        <InfoCard label="Próximos pasos" value={viewModel.recommendation.nextSteps.join(' · ')} />
      </div>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">Límite de escalamiento</p>
        <p className="mt-2 text-sm text-amber-800">
          {viewModel.recommendation.route.includes('escalar') && (viewModel.evidenceInsufficient || viewModel.recommendation.confidence === 'baja')
            ? 'La evidencia todavía no permite recomendar una escalada con confianza alta.'
            : 'La recomendación se ajusta al nivel de evidencia disponible.'}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone={getRouteTone(viewModel.recommendation.route)}>{viewModel.recommendation.routeLabel}</Pill>
        <Pill tone={draft.objective}>{OBJECTIVE_OPTIONS.find(option => option.value === draft.objective)?.label ?? draft.objective}</Pill>
      </div>
    </section>
  );
}

function ExecutiveReportComposer({
  viewModel,
  draft,
}: {
  viewModel: DecisionViewModel;
  draft: DecisionDraft;
}) {
  const initiative = viewModel.initiative;
  const challenge = viewModel.challenge;
  const front = viewModel.front;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <FileSearch size={16} className="text-slate-700" />
        <p className="text-xs font-semibold text-slate-500">REPORTE EJECUTIVO</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Esta salida estructura el caso para sponsor, comité o gerencia. No reemplaza la decisión; la deja lista para una conversación ejecutiva.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoCard label="Objetivo estratégico" value={front?.strategicObjective ?? 'Sin objetivo visible'} />
        <InfoCard label="Frente estratégico" value={front?.name ?? 'Portafolio completo'} />
        <InfoCard label="Reto abordado" value={challenge?.name ?? 'Sin reto visible'} />
        <InfoCard label="Iniciativa revisada" value={initiative.name} />
        <InfoCard label="Qué se hizo" value={initiative.experimentSummary || initiative.executiveSummary || 'Sin resumen visible'} />
        <InfoCard label="Qué se construyó" value={initiative.deliverables.slice(0, 3).map(item => item.title).join(' · ') || 'Sin entregables visibles'} />
        <InfoCard label="Qué evidencia se obtuvo" value={viewModel.evidenceTitles.length > 0 ? viewModel.evidenceTitles.join(' · ') : 'Sin entregables visibles'} />
        <InfoCard label="Qué métrica se movió" value={initiative.mainMetric} />
        <InfoCard label="Qué aprendimos" value={viewModel.resultSummary || initiative.signalSummary || 'Sin lectura visible'} />
        <InfoCard label="Riesgos y dependencias" value={[initiative.mainBlocker, draft.technicalRisk, draft.creatorDependency].filter(Boolean).join(' · ')} />
        <InfoCard label="Recomendación IA" value={viewModel.recommendation.routeLabel} />
        <InfoCard label="Decisión solicitada" value={viewModel.recommendation.decisionRequest} />
        <InfoCard label="Próximo paso" value={viewModel.recommendation.nextSteps[0] ?? 'Definir siguiente paso'} />
      </div>
    </section>
  );
}

function decisionStateTone(value: string) {
  if (value.includes('registrada')) return 'emerald';
  if (value.includes('Lista')) return 'violet';
  if (value.includes('Cerrada')) return 'slate';
  return 'amber';
}

function evidenceStateTone(value: string) {
  if (value === 'suficiente') return 'emerald';
  if (value === 'parcial') return 'amber';
  return 'rose';
}

function routeGroupTone(value: string) {
  if (value === 'escalar') return 'violet';
  if (value === 'iterar') return 'amber';
  if (value === 'transferir') return 'sky';
  if (value === 'pausar') return 'rose';
  if (value === 'cerrar') return 'emerald';
  return 'slate';
}

function getDeliverableState(deliverable: InitiativeDeliverable, step: DeliverableStepBucket) {
  const text = `${deliverable.title} ${deliverable.note}`.toLowerCase();
  if (step === 'Step 4' || /(final|cierre|ejecutivo|roadmap|presentaci|deck)/i.test(text)) return 'validado';
  if (step === 'Step 0' || step === 'Step 1' || /(borrador|pendiente|draft)/i.test(text)) return 'pendiente';
  return 'débil';
}

function EvidenceFileRow({
  deliverable,
  step,
}: {
  deliverable: InitiativeDeliverable;
  step: DeliverableStepBucket;
}) {
  const fileState = getDeliverableState(deliverable, step);
  const hasLink = false;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{deliverable.title}</p>
          <p className="mt-1 text-xs text-slate-500">{deliverable.type}</p>
        </div>
        <Pill tone={fileState}>{fileState}</Pill>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
        <p><span className="font-semibold text-slate-500">Step:</span> {getStepLabel(step)}</p>
        <p><span className="font-semibold text-slate-500">Fecha:</span> No registrado</p>
        <p><span className="font-semibold text-slate-500">Subido por:</span> No registrado</p>
        <p><span className="font-semibold text-slate-500">Estado:</span> {fileState}</p>
      </div>
      <p className="mt-3 text-sm text-slate-600">{deliverable.note || 'Sin nota visible'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={!hasLink}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">
            <ExternalLink size={12} />
            Abrir
          </span>
        </button>
        <button
          disabled={!hasLink}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">
            <FileText size={12} />
            Copiar link
          </span>
        </button>
        <button
          disabled={!hasLink}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">
            <Download size={12} />
            Descargar
          </span>
        </button>
        {!hasLink ? <span className="text-xs text-slate-500">Sin enlace disponible para este archivo.</span> : null}
      </div>
    </div>
  );
}

function DecisionDrawer({
  viewModel,
  draft,
  onChangeDraft,
  onClose,
  onSave,
  onPrepareReport,
  onRequestMissingInfo,
  savedRecord,
  history,
}: {
  viewModel: DecisionViewModel;
  draft: DecisionDraft;
  onChangeDraft: (partial: Partial<DecisionDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  onPrepareReport: () => void;
  onRequestMissingInfo: () => void;
  savedRecord: DecisionRecord | null;
  history: DecisionRecord[];
}) {
  const { initiative, challenge, front } = viewModel;

  if (!initiative) {
    return null;
  }

  const currentRecommendation = buildDecisionRecommendation(initiative, challenge, front, draft);
  const currentViewModel: DecisionViewModel = {
    ...viewModel,
    recommendation: currentRecommendation,
    evidenceInsufficient: draft.qualitativeEvidence === 'debil' || draft.resultMetric === 'negativo' || draft.adoptionObserved === 'baja',
  };
  const selectedRoute = draft.selectedRoute ?? savedRecord?.route ?? currentRecommendation.route;
  const routeTone = getRouteTone(selectedRoute);
  const currentDecisionLabel = savedRecord ? routeLabelMap[savedRecord.route] : 'Sin decisión registrada';

  const deliverableBuckets = initiative.deliverables.reduce<Record<DeliverableStepBucket, InitiativeDeliverable[]>>((acc, deliverable) => {
    const step = inferDeliverableStep(deliverable);
    acc[step].push(deliverable);
    return acc;
  }, {
    'Step 0': [],
    'Step 1': [],
    'Step 2': [],
    'Step 3': [],
    'Step 4': [],
    'Sin paso claro': [],
  });

  const timelineBuckets = STEP_ORDER.map(step => {
    const entry = initiative.stepsTimeline.find(item => item.step === step);
    const evidence = deliverableBuckets[step].slice(0, 2).map(item => item.title).join(' · ') || 'Sin evidencia asociada visible';
    return {
      step,
      state: entry?.state ?? 'pendiente',
      note: entry?.note ?? 'Sin comentario visible',
      evidence,
    };
  });

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/40">
      <div className="h-full w-full max-w-5xl overflow-y-auto bg-[#fbfaf7] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">CIERRE DE INICIATIVA</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{initiative.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Este espacio sirve para revisar cierres y tomar decisiones. El trabajo operativo vive dentro de cada iniciativa.
              </p>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Cerrar panel">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={getRouteTone(currentRecommendation.route)}>{currentRecommendation.routeLabel}</Pill>
              <Pill tone={viewModel.coverageLabel}>{viewModel.coverageLabel}</Pill>
              <Pill tone={viewModel.contributionLabel}>{`Contribución ${viewModel.contributionLabel.toLowerCase()}`}</Pill>
              <Pill tone={viewModel.scalePotentialLabel}>{`Escalamiento ${viewModel.scalePotentialLabel.toLowerCase()}`}</Pill>
              {savedRecord ? <Pill tone="alta">Decisión registrada</Pill> : <Pill tone="baja">Decisión pendiente</Pill>}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Resumen ejecutivo" value={initiative.executiveSummary || initiative.signalSummary || 'Sin resumen visible'} />
              <InfoCard label="Frente estratégico" value={front?.name ?? 'Portafolio completo'} />
              <InfoCard label="Reto asociado" value={challenge?.name ?? 'Sin reto visible'} />
              <InfoCard label="Owner" value={initiative.teamOwner || 'No definido'} />
              <InfoCard label="Equipo" value={initiative.teamLabel || initiative.teamMembers.join(' · ') || 'No definido'} />
              <InfoCard label="Mentor" value={initiative.mentor || 'No definido'} />
              <InfoCard label="Sponsor relacionado" value={challenge?.sponsorName ?? challenge?.sponsorStatus ?? 'No definido'} />
              <InfoCard label="Estado final" value={getFinalStateLabel(Boolean(savedRecord), initiative)} />
              <InfoCard label="Fecha de cierre" value={formatTodayLabel()} helper="Fecha de referencia generada al revisar este caso." />
              <InfoCard label="Salida ejecutiva" value={viewModel.output ? executiveOutputStatusLabel(viewModel.output.status) : 'Sin salida ejecutiva'} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">QUÉ ABORDÓ</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoCard label="Problema, oportunidad o incertidumbre" value={initiative.attackedArea || challenge?.whatWeWantToMove || 'Sin definición visible'} />
              <InfoCard label="Qué parte del reto cubrió" value={initiative.hypothesisCovered || challenge?.successCriteria || 'Sin cobertura visible'} />
              <InfoCard label="Hipótesis principal" value={initiative.decisionRecommendationReason || initiative.signalSummary || 'Sin hipótesis visible'} />
              <InfoCard label="Tipo de contribución" value={initiative.contributionType.replace('_', ' ')} helper="Descubrir, validar, resolver parcialmente o resolver directamente." />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">QUÉ LOGRÓ</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoCard label="Resultado principal" value={viewModel.resultSummary || initiative.signalSummary || 'Sin resultado visible'} />
              <InfoCard label="Métrica movida" value={initiative.mainMetric} />
              <InfoCard label="Baseline" value={front?.baseline ?? challenge?.currentMetricValue ?? 'No registrado'} />
              <InfoCard label="Resultado obtenido" value={initiative.signalSummary || 'No registrado'} />
              <InfoCard label="Variación" value={initiative.mainAlert || 'No registrado'} />
              <InfoCard label="Nivel de adopción" value={draft.adoptionObserved} />
              <InfoCard label="Impacto observado" value={initiative.aiCommentSummary || initiative.mentorCommentSummary || 'Sin observación visible'} />
              <InfoCard label="Limitaciones del resultado" value={initiative.mainBlocker || 'Sin limitaciones visibles'} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">QUÉ CONSTRUYÓ</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoCard label="Propuesta de solución" value={initiative.experimentSummary || 'Sin propuesta visible'} />
              <InfoCard label="Prototipo o demo" value={initiative.deliverables.slice(0, 2).map(item => item.title).join(' · ') || 'Sin prototipo visible'} />
              <InfoCard label="Link o archivo del prototipo" value="Sin enlace registrado" helper="Los metadatos de archivo todavía no incluyen enlace directo." />
              <InfoCard label="Flujo, mockup, automatización, dashboard o MVP" value={initiative.deliverables.map(item => item.title).join(' · ') || 'Sin entregables visibles'} />
              <InfoCard label="Alcance del prototipo" value={initiative.readyForDecision ? 'Alcance listo para revisión ejecutiva' : 'Alcance exploratorio o parcial'} />
              <InfoCard label="Qué quedó fuera" value={initiative.mainAlert || 'Sin definición visible'} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">EVIDENCIA Y ARCHIVOS</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              La asociación por step es estimada cuando el archivo no trae metadatos explícitos.
            </p>
            <div className="mt-4 space-y-4">
              {STEP_ORDER.map(step => (
                <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step}</p>
                      <p className="text-xs text-slate-500">
                        {step === 'Step 0' ? 'Contexto inicial y alineamiento' :
                          step === 'Step 1' ? 'Foco, entrevistas, restricciones y métricas' :
                          step === 'Step 2' ? 'HMW, ideas, selección y test card' :
                          step === 'Step 3' ? 'Resultados, aprendizajes y métricas' :
                          'Deck final, storytelling y presentación ejecutiva'}
                      </p>
                    </div>
                    <Pill tone={StepStateTone(initiative.stepsTimeline.find(item => item.step === step)?.state ?? 'pendiente')}>
                      {initiative.stepsTimeline.find(item => item.step === step)?.state ?? 'pendiente'}
                    </Pill>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <InfoCard
                      label="Estado final"
                      value={initiative.stepsTimeline.find(item => item.step === step)?.state ?? 'pendiente'}
                      helper="Lectura basada en la línea de tiempo de la iniciativa."
                    />
                    <InfoCard
                      label="Output principal"
                      value={initiative.stepsTimeline.find(item => item.step === step)?.note ?? 'Sin comentario visible'}
                    />
                    <InfoCard
                      label="Evidencia clave"
                      value={deliverableBuckets[step].slice(0, 2).map(item => item.title).join(' · ') || 'Sin evidencia visible'}
                    />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {deliverableBuckets[step].length > 0 ? (
                      deliverableBuckets[step].map(deliverable => (
                        <EvidenceFileRow key={deliverable.id} deliverable={deliverable} step={step} />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                        No hay archivos visibles para este step.
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sin paso claro</p>
                    <p className="text-xs text-slate-500">Archivos que no traen una referencia clara al step.</p>
                  </div>
                  <Pill tone={deliverableBuckets['Sin paso claro'].length > 0 ? 'amber' : 'slate'}>
                    {deliverableBuckets['Sin paso claro'].length > 0 ? 'Con archivos' : 'Sin archivos'}
                  </Pill>
                </div>
                <div className="mt-4 grid gap-3">
                  {deliverableBuckets['Sin paso claro'].length > 0 ? (
                    deliverableBuckets['Sin paso claro'].map(deliverable => (
                      <EvidenceFileRow key={deliverable.id} deliverable={deliverable} step="Sin paso claro" />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      No hay archivos sin asociación visible.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">LECTURA STEP 0–4</p>
            </div>
            <div className="mt-4 grid gap-3">
              {timelineBuckets.map(item => (
                <StepBadge
                  key={item.step}
                  step={item.step}
                  state={item.state}
                  note={`${item.note} · Comentario IA o mentor: ${initiative.aiCommentSummary || initiative.mentorCommentSummary || 'Sin comentario visible'}`}
                  evidence={item.evidence}
                />
              ))}
            </div>
          </section>

          <DecisionRecommendationPanel viewModel={currentViewModel} draft={draft} />
          <ExecutiveReportComposer viewModel={currentViewModel} draft={draft} />

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">DECISIÓN DEL PORTFOLIO LEAD</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoCard label="Decisión tomada" value={currentDecisionLabel} />
              <InfoCard label="Razón de la decisión" value={savedRecord?.reason ?? currentRecommendation.why} />
              <InfoCard label="Evidencia usada" value={savedRecord?.evidenceUsed.join(' · ') ?? currentRecommendation.evidenceUsed.join(' · ')} />
              <InfoCard label="Responsable del siguiente paso" value={savedRecord?.author ?? 'Valeria Castro'} />
              <InfoCard label="Fecha objetivo" value={savedRecord?.date ?? formatTodayLabel()} />
              <InfoCard label="Sponsor o gerente a involucrar" value={challenge?.sponsorName ?? 'Sponsor pendiente'} />
              <InfoCard label="Próxima acción" value={savedRecord?.nextStep ?? currentRecommendation.nextSteps[0] ?? 'Definir siguiente paso'} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onSave} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                Registrar decisión
              </button>
              <button onClick={onPrepareReport} className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
                Generar reporte ejecutivo
              </button>
              <button onClick={onRequestMissingInfo} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                Solicitar información faltante
              </button>
              <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                Volver a bandeja
              </button>
            </div>
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${toneForLevel(routeTone)}`}>
              {currentRecommendation.decisionRequest}
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">RUTAS DE DECISIÓN</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">Selecciona una ruta si quieres registrar una decisión distinta de la sugerida.</p>
            <div className="mt-4">
              <DecisionRoutePicker
                selectedRoute={selectedRoute}
                recommendedRoute={currentRecommendation.route}
                onChange={route => onChangeDraft({ selectedRoute: route })}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FileSearch size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">DECISIONES REGISTRADAS</p>
            </div>
            {history.length > 0 ? (
              <div className="mt-4 space-y-3">
                {history.map(item => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{routeLabelMap[item.route]}</p>
                      <p className="text-xs text-slate-500">{item.date} · {item.author}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                    <p className="mt-2 text-xs text-slate-500">Evidencia: {item.evidenceUsed.join(' · ')}</p>
                    <p className="mt-1 text-xs text-slate-500">Próximo paso: {item.nextStep}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Todavía no has registrado una decisión para esta iniciativa.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function BoardTable({
  rows,
  onReview,
}: {
  rows: BoardRow[];
  onReview: (initiativeId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Iniciativa</th>
              <th className="px-4 py-3">Frente estratégico</th>
              <th className="px-4 py-3">Reto asociado</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Tipo de reto</th>
              <th className="px-4 py-3">Qué logró</th>
              <th className="px-4 py-3">Métrica movida</th>
              <th className="px-4 py-3">Evidencia</th>
              <th className="px-4 py-3">Entregables finales</th>
              <th className="px-4 py-3">Ruta IA sugerida</th>
              <th className="px-4 py-3">Estado de decisión</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map(row => (
              <tr key={row.viewModel.initiative.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <p className="font-semibold text-slate-950">{row.viewModel.initiative.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.highlightedResult}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{row.frontName}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{row.challengeName}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{row.ownerName}</td>
                <td className="px-4 py-4">
                  <Pill tone="slate">{row.challengeTypeLabel || 'Sin tipo'}</Pill>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{row.highlightedResult}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{row.metricMoved}</td>
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm text-slate-700">{row.evidenceSummary}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.evidenceState}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-xs text-sm text-slate-700">{row.deliverablesSummary}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Pill tone={routeGroupTone(row.routeGroup)}>{row.viewModel.recommendation.routeLabel}</Pill>
                    <span className="text-xs text-slate-500">{row.viewModel.recommendation.routeLabel}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Pill tone={decisionStateTone(row.decisionStateLabel)}>{row.decisionStateLabel}</Pill>
                    <span className="text-xs text-slate-500">{row.finalStateLabel}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onReview(row.viewModel.initiative.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Ver cierre <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {rows.map(row => (
          <article key={row.viewModel.initiative.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-950">{row.viewModel.initiative.name}</p>
                <p className="mt-1 text-sm text-slate-600">{row.challengeName}</p>
                <p className="mt-1 text-xs text-slate-500">{row.frontName} · {row.ownerName}</p>
              </div>
              <Pill tone={decisionStateTone(row.decisionStateLabel)}>{row.decisionStateLabel}</Pill>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Qué logró" value={row.highlightedResult} />
              <InfoCard label="Métrica movida" value={row.metricMoved} />
              <InfoCard label="Evidencia" value={row.evidenceSummary} />
              <InfoCard label="Entregables" value={row.deliverablesSummary} />
              <InfoCard label="Ruta IA sugerida" value={row.viewModel.recommendation.routeLabel} />
              <InfoCard label="Tipo de reto" value={row.challengeTypeLabel || 'Sin tipo'} />
            </div>
            <button
              onClick={() => onReview(row.viewModel.initiative.id)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver cierre <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function matchSearch(row: BoardRow, search: string) {
  if (!search.trim()) return true;
  const haystack = [
    row.viewModel.initiative.name,
    row.frontName,
    row.challengeName,
    row.ownerName,
    row.highlightedResult,
    row.metricMoved,
    row.evidenceSummary,
    row.deliverablesSummary,
    row.viewModel.recommendation.routeLabel,
  ].join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function matchesFilters(row: BoardRow, filters: BoardFilters) {
  return (
    (filters.frontId === 'all' || row.viewModel.front?.id === filters.frontId) &&
    (filters.challengeId === 'all' || row.viewModel.challenge?.id === filters.challengeId) &&
    (filters.challengeType === 'all' || row.viewModel.challenge?.challengeType === filters.challengeType) &&
    (filters.closeState === 'all' || row.closeState === filters.closeState) &&
    (filters.routeGroup === 'all' || row.routeGroup === filters.routeGroup) &&
    (filters.evidence === 'all' || row.evidenceState === filters.evidence) &&
    (filters.sponsor === 'all' || row.sponsorState === filters.sponsor) &&
    matchSearch(row, filters.search)
  );
}

function buildBoardRow(
  initiative: Initiative,
  challenge: Challenge | null,
  front: StrategicFront | null,
  decisionItem: PortfolioDecisionItem | null,
  output: ExecutiveOutput | null,
  savedDecision: DecisionRecord | null,
): BoardRow {
  const viewModel = buildDecisionViewModel(initiative, challenge, front, decisionItem, output);
  const hasDecision = Boolean(savedDecision);
  const closeState = getCloseState(hasDecision, initiative, viewModel.readyForDecision);
  const routeGroup = getRouteGroup(viewModel.recommendation.route);
  const evidenceState = getEvidenceState(initiative);
  const sponsorState = getSponsorState(challenge);
  const highlightedResult = viewModel.resultSummary || initiative.signalSummary || 'Sin resultado visible';
  const metricMoved = initiative.mainMetric || 'No registrado';
  const evidenceSummary = viewModel.evidenceTitles.length > 0 ? viewModel.evidenceTitles.join(' · ') : 'Sin evidencia visible';
  const deliverablesSummary = initiative.deliverables.length > 0
    ? initiative.deliverables.slice(0, 3).map(item => item.title).join(' · ')
    : 'Sin entregables visibles';
  const decisionStateLabel = getDecisionStateLabel(hasDecision, initiative, viewModel.readyForDecision);
  const finalStateLabel = getFinalStateLabel(hasDecision, initiative);

  return {
    viewModel,
    closeState,
    routeGroup,
    evidenceState,
    sponsorState,
    highlightedResult,
    metricMoved,
    evidenceSummary,
    deliverablesSummary,
    decisionStateLabel,
    finalStateLabel,
    challengeTypeLabel: challenge?.challengeType ? challengeTypeLabel(challenge.challengeType) : 'Sin tipo',
    frontName: front?.name ?? 'Portafolio completo',
    challengeName: challenge?.name ?? 'Sin reto visible',
    ownerName: initiative.teamOwner || 'No definido',
  };
}

export function PortfolioLeadReportsDecisionsExperience({ basePath }: { basePath: '/portfolio/decisiones' | '/portfolio/reportes' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { strategicFronts, challenges, initiatives, portfolioDecisions, executiveOutputs, createExecutiveOutput } = usePortfolioLead();
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, DecisionDraft>>({});
  const [decisionHistory, setDecisionHistory] = useState<Record<string, DecisionRecord[]>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>({
    frontId: 'all',
    challengeId: 'all',
    challengeType: 'all',
    closeState: 'all',
    routeGroup: 'all',
    evidence: 'all',
    sponsor: 'all',
    search: '',
  });

  const selectedInitiativeId = searchParams.get('initiativeId') ?? '';

  const allRows = useMemo(() => {
    return initiatives
      .filter(initiative => initiative.currentStep === 'Step 4' || initiative.status === 'lista_para_decision' || initiative.status === 'cerrada')
      .map(initiative => {
        const challenge = challenges.find(item => item.id === initiative.challengeId) ?? null;
        const front = strategicFronts.find(item => item.id === initiative.strategicFrontId) ?? null;
        const decisionItem = portfolioDecisions.find(item => item.initiativeId === initiative.id) ?? null;
        const output = executiveOutputs.find(item => item.initiativeId === initiative.id) ?? null;
        const savedDecision = decisionHistory[initiative.id]?.[0] ?? null;
        return buildBoardRow(initiative, challenge, front, decisionItem, output, savedDecision);
      })
      .sort((a, b) => {
        const stateRank: Record<Exclude<BoardCloseStateFilter, 'all'>, number> = {
          lista_para_decision: 0,
          decision_registrada: 1,
          cerrada: 2,
          terminada: 3,
        };
        if (stateRank[a.closeState] !== stateRank[b.closeState]) {
          return stateRank[a.closeState] - stateRank[b.closeState];
        }
        if (b.viewModel.contributionScore !== a.viewModel.contributionScore) {
          return b.viewModel.contributionScore - a.viewModel.contributionScore;
        }
        return b.viewModel.evidenceCount - a.viewModel.evidenceCount;
      });
  }, [challenges, decisionHistory, executiveOutputs, initiatives, portfolioDecisions, strategicFronts]);

  const rows = useMemo(() => allRows.filter(row => matchesFilters(row, filters)), [allRows, filters]);

  const selectedInitiative = initiatives.find(item => item.id === selectedInitiativeId) ?? null;
  const selectedChallenge = selectedInitiative ? challenges.find(item => item.id === selectedInitiative.challengeId) ?? null : null;
  const selectedFront = selectedInitiative ? strategicFronts.find(item => item.id === selectedInitiative.strategicFrontId) ?? null : null;
  const selectedDecisionItem = selectedInitiative ? portfolioDecisions.find(item => item.initiativeId === selectedInitiative.id) ?? null : null;
  const selectedOutput = selectedInitiative ? executiveOutputs.find(item => item.initiativeId === selectedInitiative.id) ?? null : null;
  const drawerModel = selectedInitiative
    ? buildDecisionViewModel(selectedInitiative, selectedChallenge, selectedFront, selectedDecisionItem, selectedOutput)
    : null;

  const focusModel = rows[0]?.viewModel ?? drawerModel;

  const updateQuery = (initiativeId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!initiativeId) next.delete('initiativeId');
    else next.set('initiativeId', initiativeId);
    const query = next.toString();
    navigate(query ? `${basePath}?${query}` : basePath);
  };

  const updateDraft = (initiativeId: string, partial: Partial<DecisionDraft>) => {
    const baseInitiative = initiatives.find(item => item.id === initiativeId);
    if (!baseInitiative) return;
    const baseChallenge = challenges.find(item => item.id === baseInitiative.challengeId) ?? null;
    const baseFront = strategicFronts.find(item => item.id === baseInitiative.strategicFrontId) ?? null;
    const defaultDraft = buildDefaultDecisionDraft(baseInitiative, baseChallenge, baseFront);
    setDecisionDrafts(prev => ({
      ...prev,
      [initiativeId]: {
        ...(prev[initiativeId] ?? defaultDraft),
        ...partial,
      },
    }));
  };

  const saveDecision = () => {
    if (!drawerModel) return;
    const draft = decisionDrafts[drawerModel.initiative.id] ?? buildDefaultDecisionDraft(drawerModel.initiative, drawerModel.challenge, drawerModel.front);
    const recommendation = buildDecisionRecommendation(drawerModel.initiative, drawerModel.challenge, drawerModel.front, draft);
    const route = draft.selectedRoute ?? recommendation.route;
    const record: DecisionRecord = {
      id: (globalThis.crypto?.randomUUID?.() ?? `decision-${Date.now()}`),
      initiativeId: drawerModel.initiative.id,
      author: 'Valeria Castro',
      date: formatTodayLabel(),
      route,
      reason: recommendation.why,
      evidenceUsed: recommendation.evidenceUsed,
      nextStep: recommendation.nextSteps[0] ?? 'Definir siguiente paso',
      confidence: recommendation.confidence,
    };
    setDecisionHistory(prev => ({
      ...prev,
      [drawerModel.initiative.id]: [record, ...(prev[drawerModel.initiative.id] ?? [])].slice(0, 5),
    }));
    setFeedback(`Decisión guardada para ${drawerModel.initiative.name}.`);
  };

  const prepareExecutiveOutput = () => {
    const model = drawerModel ?? focusModel;
    if (!model) return;
    const draft = decisionDrafts[model.initiative.id] ?? buildDefaultDecisionDraft(model.initiative, model.challenge, model.front);
    const route = draft.selectedRoute ?? buildDecisionRecommendation(model.initiative, model.challenge, model.front, draft).route;
    const output = executiveOutputs.find(item => item.initiativeId === model.initiative.id)
      ?? createExecutiveOutput(model.initiative.id, mapRouteToOutcome(route));
    if (!output) return;
    navigate(`/portfolio/salida-ejecutiva?outputId=${encodeURIComponent(output.id)}`);
  };

  const requestMissingInfo = () => {
    setFeedback('Se solicitó información faltante para la iniciativa seleccionada.');
  };

  const emptyBoard = allRows.length === 0;
  const filteredOut = allRows.length > 0 && rows.length === 0;

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <PortfolioLeadBreadcrumbs items={[{ label: 'Portfolio Lead', path: '/portfolio/inicio' }, { label: 'Iniciativas terminadas y decisiones' }]} />

      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f7f3e4_0%,#ffffff_52%,#eef3ea_100%)] p-6 md:p-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div>
            <p className="text-xs font-semibold text-slate-500">BANDEJA EJECUTIVA DEL PORTAFOLIO</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Iniciativas terminadas y decisiones
            </h1>
            <p className="mt-3 max-w-4xl text-sm text-slate-600">
              Revisa las iniciativas que ya llegaron a cierre, compara sus resultados, consulta sus evidencias y define la siguiente ruta: escalar, iterar, transferir, pausar o cerrar con aprendizaje.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={prepareExecutiveOutput}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                disabled={!focusModel}
              >
                Preparar reporte ejecutivo
              </button>
              <button
                onClick={() => navigate('/portfolio/iniciativas')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Ir a iniciativas activas
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">GUÍA EJECUTIVA</p>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Este espacio sirve para revisar cierres y tomar decisiones. El trabajo operativo vive dentro de cada iniciativa.
            </p>
            <div className="mt-4 grid gap-3">
              <InfoCard label="Qué verás aquí" value="Iniciativas terminadas, evidencia, entregables y ruta sugerida por IA." />
              <InfoCard label="Qué no reemplaza" value="El workspace operativo de iniciativas." />
            </div>
          </aside>
        </div>
      </section>

      {feedback ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-700" />
              <h2 className="text-xl font-semibold text-slate-950">Filtros</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Filtra por frente, reto o estado para encontrar rápidamente las iniciativas que ya pueden convertirse en decisión.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 xl:block">
            {rows.length} resultados visibles
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Frente estratégico</span>
            <select
              value={filters.frontId}
              onChange={event => setFilters(prev => ({ ...prev, frontId: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="all">Todos</option>
              {strategicFronts.map(front => (
                <option key={front.id} value={front.id}>{front.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Reto</span>
            <select
              value={filters.challengeId}
              onChange={event => setFilters(prev => ({ ...prev, challengeId: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="all">Todos</option>
              {challenges.map(challenge => (
                <option key={challenge.id} value={challenge.id}>{challenge.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Tipo de reto</span>
            <select
              value={filters.challengeType}
              onChange={event => setFilters(prev => ({ ...prev, challengeType: event.target.value as BoardTypeFilter }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {FILTER_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Estado de cierre</span>
            <select
              value={filters.closeState}
              onChange={event => setFilters(prev => ({ ...prev, closeState: event.target.value as BoardCloseStateFilter }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {FILTER_CLOSE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Ruta IA sugerida</span>
            <select
              value={filters.routeGroup}
              onChange={event => setFilters(prev => ({ ...prev, routeGroup: event.target.value as BoardRouteGroup }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {FILTER_ROUTE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Evidencia</span>
            <select
              value={filters.evidence}
              onChange={event => setFilters(prev => ({ ...prev, evidence: event.target.value as BoardEvidenceFilter }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {FILTER_EVIDENCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-500">Sponsor</span>
            <select
              value={filters.sponsor}
              onChange={event => setFilters(prev => ({ ...prev, sponsor: event.target.value as BoardSponsorFilter }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              {FILTER_SPONSOR_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 md:col-span-2 xl:col-span-2">
            <span className="text-xs font-semibold text-slate-500">Búsqueda</span>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
                placeholder="Busca por nombre de iniciativa, owner o palabra clave"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none"
              />
            </div>
          </label>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Filtra por frente, reto o estado para encontrar rápidamente las iniciativas que ya pueden convertirse en decisión.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <FileSearch size={17} className="text-slate-700" />
              <h2 className="text-xl font-semibold text-slate-950">Bandeja ejecutiva</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              La prioridad visual es comparar cierres, no navegar el trabajo operativo. Cada fila deja claro qué hizo, qué evidencia dejó y qué decisión pide ahora.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {rows.length} iniciativas visibles
          </div>
        </div>

        {emptyBoard ? (
          <div className="mt-6">
            <PortfolioLeadEmptyState
              title="Aún no hay iniciativas terminadas"
              description="Cuando una iniciativa complete su cierre, aparecerá aquí para revisión ejecutiva, decisión y reporte."
              primaryAction={{ label: 'Ver iniciativas en curso', onClick: () => navigate('/portfolio/iniciativas') }}
            />
          </div>
        ) : filteredOut ? (
          <div className="mt-6">
            <PortfolioLeadEmptyState
              title="No hay iniciativas con estos filtros"
              description="Ajusta los filtros o revisa iniciativas terminadas de otros frentes o retos."
              primaryAction={{ label: 'Limpiar filtros', onClick: () => setFilters({
                frontId: 'all',
                challengeId: 'all',
                challengeType: 'all',
                closeState: 'all',
                routeGroup: 'all',
                evidence: 'all',
                sponsor: 'all',
                search: '',
              }) }}
              secondaryAction={{ label: 'Ir a iniciativas activas', onClick: () => navigate('/portfolio/iniciativas') }}
            />
          </div>
        ) : (
          <div className="mt-6">
            <BoardTable rows={rows} onReview={initiativeId => updateQuery(initiativeId)} />
          </div>
        )}
      </section>

      {drawerModel ? (
        <DecisionDrawer
          viewModel={drawerModel}
          draft={decisionDrafts[drawerModel.initiative.id] ?? buildDefaultDecisionDraft(drawerModel.initiative, drawerModel.challenge, drawerModel.front)}
          onChangeDraft={partial => updateDraft(drawerModel.initiative.id, partial)}
          onClose={() => updateQuery(null)}
          onSave={saveDecision}
          onPrepareReport={prepareExecutiveOutput}
          onRequestMissingInfo={requestMissingInfo}
          savedRecord={decisionHistory[drawerModel.initiative.id]?.[0] ?? null}
          history={decisionHistory[drawerModel.initiative.id] ?? []}
        />
      ) : null}
    </div>
  );
}
