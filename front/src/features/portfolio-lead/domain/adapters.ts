/**
 * adapters.ts — issue #100.
 *
 * Maps the backend `/portfolio` responses into the rich portfolio-lead domain types so
 * the provider can hydrate from real data instead of the mock fixtures. The backend list
 * endpoints return a subset of the domain shape; everything the UI also reads is filled
 * with safe defaults (mirroring how createStrategicFront/createChallenge build new rows).
 *
 * Scope: READ path only. Mutations in the provider stay local for now (follow-up).
 */
import { buildDefaultActivationInputs } from './actions';
import type {
  Challenge,
  Initiative,
  InitiativeStep,
  StrategicFront,
} from './types';

type Raw = Record<string, any>;

function isoDate(value: unknown): string {
  return typeof value === 'string' ? value.split('T')[0] : '';
}

/** Backend `en_step_N` (legacy) → "Step N"; falls back to the project's numeric step. */
function stepLabel(status: unknown, projectCurrentStep?: unknown): InitiativeStep {
  const m = typeof status === 'string' ? /^en_step_([0-4])$/.exec(status) : null;
  if (m) return `Step ${m[1]}` as InitiativeStep;
  if (typeof projectCurrentStep === 'number') {
    const n = Math.min(4, Math.max(0, projectCurrentStep));
    return `Step ${n}` as InitiativeStep;
  }
  return 'Step 0';
}

export function adaptStrategicFront(raw: Raw): StrategicFront {
  return {
    id: raw.id,
    name: raw.name ?? '',
    strategicObjective: raw.strategicObjective ?? '',
    whyNow: raw.whyNow ?? '',
    sponsorEmail: raw.sponsorEmail ?? undefined,
    mainKpi: raw.mainKpi ?? '',
    baseline: raw.baseline ?? '',
    target: raw.target ?? '',
    threshold: raw.threshold ?? undefined,
    horizon: raw.horizon ?? '',
    endDate: raw.endDate ?? undefined,
    area: raw.area ?? undefined,
    sponsor: raw.sponsor ?? '',
    priority: raw.priority ?? 'Media',
    status: raw.status ?? 'draft',
    createdAt: isoDate(raw.createdAt),
    lastUpdatedAt: isoDate(raw.updatedAt) || undefined,
    notes: raw.notes ?? undefined,
    challengeCount: raw._count?.challenges ?? 0,
    initiativeCount: 0,
  };
}

export function adaptChallenge(raw: Raw): Challenge {
  const sponsorStatus = raw.sponsorStatus ?? 'definido';
  return {
    id: raw.id,
    name: raw.name ?? raw.title ?? '',
    strategicFrontId: raw.strategicFrontId,
    challengeType: raw.type ?? raw.challengeType ?? '',
    whatWeWantToMove: raw.whatWeWantToMove ?? '',
    objective: raw.objective ?? '',
    whyNow: raw.whyNow ?? '',
    successCriteria: raw.successCriteria ?? '',
    challengeOwner: raw.challengeOwner ?? '',
    sponsorName: raw.sponsorName ?? undefined,
    sponsorEmail: raw.sponsorEmail ?? undefined,
    horizon: raw.horizon ?? undefined,
    area: raw.area ?? undefined,
    notes: raw.publicationNotes ?? undefined,
    activationMode: raw.activationMode ?? 'convocatoria_abierta',
    status: raw.status ?? 'draft',
    createdAt: isoDate(raw.createdAt),
    lastUpdatedAt: isoDate(raw.updatedAt) || undefined,
    challengeOwnerStatus: raw.challengeOwnerStatus ?? 'definido',
    sponsorStatus,
    openCallStatus: raw.openCallStatus === 'activa' ? 'activa' : 'inactiva',
    selectedPeople: Array.isArray(raw.selectedPeople)
      ? raw.selectedPeople.map((p: Raw) => ({ id: p.id, value: p.value, status: p.status ?? 'definido' }))
      : [],
    assignedSquad: Array.isArray(raw.assignedSquad)
      ? raw.assignedSquad.map((s: Raw) => ({ id: s.id, value: s.value, role: s.role ?? 'colaborador' }))
      : [],
    initiativeCount: raw._count?.initiativeMetas ?? 0,
    coverageStatus: raw.coverageStatus ?? 'sin_cobertura',
    visibleToParticipants: raw.visibleToParticipants ?? false,
    publicationNotes: raw.publicationNotes ?? '',
    lastPublishedAt: isoDate(raw.lastPublishedAt) || undefined,
    activationInputs: buildDefaultActivationInputs(sponsorStatus),
    activationRecommendationNote: '',
    activationMessageDraft: '',
  };
}

export function adaptInitiative(raw: Raw): Initiative {
  const project = raw.project ?? {};
  return {
    id: raw.id,
    projectId: project.id ?? raw.projectId,
    name: project.name ?? raw.name ?? 'Iniciativa',
    strategicFrontId: raw.strategicFrontId ?? '',
    challengeId: raw.challengeId,
    teamOwner: raw.teamOwner ?? project.owner?.name ?? '',
    currentStep: stepLabel(raw.status, project.currentStep),
    status: raw.status ?? 'en_step_0',
    mentor: raw.mentor ?? '',
    sponsorTouchpoint: raw.sponsorTouchpoint ?? '',
    mainAlert: raw.mainAlert ?? '',
    nextActionRecommended: raw.nextActionRecommended ?? '',
    attackedArea: raw.attackedArea ?? '',
    hypothesisCovered: raw.hypothesisCovered ?? '',
    mainMetric: raw.mainMetric ?? '',
    contributionType: raw.contributionType ?? 'descubrir',
    estimatedContribution: raw.estimatedContribution ?? 'bajo',
    lastActivity: raw.lastActivity ?? '',
    signalSummary: raw.signalSummary ?? '',
    mainBlocker: raw.mainBlocker ?? '',
    teamLabel: raw.teamLabel ?? '',
    requiresSponsor: raw.requiresSponsor ?? false,
    readyForDecision: raw.readyForDecision ?? false,
    blockedDays: raw.blockedDays ?? 0,
    requiresExternalCapability: raw.requiresExternalCapability ?? false,
    partialSignal: raw.partialSignal ?? false,
    resolvedCorePart: raw.resolvedCorePart ?? false,
    teamMembers: Array.isArray(raw.teamMembers) ? raw.teamMembers : [],
    executiveSummary: raw.executiveSummary ?? '',
    experimentSummary: raw.experimentSummary ?? '',
    deliverables: Array.isArray(raw.deliverables) ? raw.deliverables : [],
    aiCommentSummary: raw.aiCommentSummary ?? '',
    mentorCommentSummary: raw.mentorCommentSummary ?? '',
    decisionRecommendationReason: raw.decisionRecommendationReason ?? '',
    stepsTimeline: Array.isArray(raw.stepsTimeline) ? raw.stepsTimeline : [],
  };
}
