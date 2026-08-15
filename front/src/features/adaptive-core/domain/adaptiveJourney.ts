import type { Project, StepStatus } from '../../../app/context/AppContext';
import type { AdaptiveInitiativeCore, StepConfiguration } from './types';
import { ensureAdaptiveCoreForProject } from './adaptiveCore';

export type AdaptiveJourneyStatus = 'current' | 'completed' | 'available' | 'locked' | 'review_pending' | 'blocked';

export interface AdaptiveJourneyStep {
  step: 0 | 1 | 2 | 3 | 4;
  number: 0 | 1 | 2 | 3 | 4;
  name: string;
  title: string;
  shortTitle: string;
  description: string;
  objective: string;
  expectedOutput: string;
  routeType: string;
  depthLevel: string;
  status: AdaptiveJourneyStatus | StepStatus;
  progress: number;
  activeCheckpointCode?: string;
  activeCheckpointTitle?: string;
  checkpointSummary: string[];
  questionsCount: number;
  nextAction: string;
  canNavigate: boolean;
}

const ACTIVE_STEP_STATUSES: StepStatus[] = ['En progreso', 'Enviado', 'Feedback IA', 'Ajustado', 'Sesion experto pendiente' as StepStatus, 'Sesión experto pendiente'];

const STATUS_BY_CHECKPOINT_STATUS: Record<string, AdaptiveJourneyStatus> = {
  completed: 'completed',
  blocked: 'blocked',
  in_progress: 'current',
  ready: 'current',
  locked: 'locked',
};

function normalizeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function getStepConfig(core: AdaptiveInitiativeCore, step: 0 | 1 | 2 | 3 | 4): StepConfiguration | undefined {
  return core.stepConfigurations
    .filter(config => config.step === step)
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
}

function getLegacyStatus(project: Project, step: 0 | 1 | 2 | 3 | 4): AdaptiveJourneyStatus {
  if (step === 0) {
    if (project.step0Status === 'Completado') return 'completed';
    return 'current';
  }
  const legacyStep = project.steps.find(item => item.number === step);
  if (!legacyStep) return 'locked';
  if (legacyStep.status === 'Aprobado') return 'completed';
  if (legacyStep.status === 'Bloqueado') return 'locked';
  if (ACTIVE_STEP_STATUSES.includes(legacyStep.status)) return 'current';
  return project.currentStep === step ? 'available' : 'locked';
}

function calculateAdaptiveStatus(core: AdaptiveInitiativeCore, project: Project, step: 0 | 1 | 2 | 3 | 4): AdaptiveJourneyStatus {
  const signalStep = core.progressSignal?.step;
  const activeCheckpoint = core.activeCheckpoint;
  const config = getStepConfig(core, step);
  const checkpoints = config?.checkpoints ?? [];
  const instances = (core.checkpointInstances ?? []).filter((item: any) => item.step === step || item.stepNumber === step);
  const outputs = (core.stepOutputs ?? []).filter((item: any) => item.step === step || item.stepNumber === step);

  if (outputs.some((item: any) => item.status === 'confirmed')) return 'completed';
  if (activeCheckpoint?.step === step) return STATUS_BY_CHECKPOINT_STATUS[activeCheckpoint.status] ?? 'current';
  if (typeof signalStep === 'number') {
    if (step < signalStep) return 'completed';
    if (step === signalStep) return 'current';
    return 'locked';
  }
  if (instances.some((item: any) => item.status === 'ready' || item.status === 'in_progress')) return 'current';
  if (checkpoints.some(checkpoint => checkpoint.status === 'ready' || checkpoint.status === 'in_progress')) return 'current';
  if (checkpoints.length > 0) return getLegacyStatus(project, step);
  return getLegacyStatus(project, step);
}

function calculateProgress(status: AdaptiveJourneyStatus, config: StepConfiguration | undefined, core: AdaptiveInitiativeCore, step: 0 | 1 | 2 | 3 | 4) {
  if (status === 'completed') return 100;
  if (status === 'locked') return 0;
  const checkpoints = config?.checkpoints ?? [];
  const instances = (core.checkpointInstances ?? []).filter((item: any) => item.step === step || item.stepNumber === step);
  const completed = instances.filter((item: any) => item.status === 'completed').length
    || checkpoints.filter(item => item.status === 'completed').length;
  if (checkpoints.length === 0) return status === 'current' ? 35 : 0;
  return Math.max(15, Math.round((completed / checkpoints.length) * 100));
}

function getCheckpointCode(checkpoint: StepConfiguration['checkpoints'][number] | NonNullable<AdaptiveInitiativeCore['activeCheckpoint']>) {
  return 'checkpointKey' in checkpoint ? checkpoint.checkpointKey : checkpoint.code;
}

function getCheckpointTitle(checkpoint: StepConfiguration['checkpoints'][number] | NonNullable<AdaptiveInitiativeCore['activeCheckpoint']>) {
  if ('title' in checkpoint) return checkpoint.title;
  return checkpoint.checkpointKey;
}

export function resolveAuthoritativeAdaptiveCore(serverCore?: AdaptiveInitiativeCore | null): AdaptiveInitiativeCore | null {
  return serverCore ?? null;
}

export function resolveLegacyAdaptivePreview(project: Project): AdaptiveInitiativeCore {
  return ensureAdaptiveCoreForProject(project);
}

/**
 * @deprecated Use resolveAuthoritativeAdaptiveCore for operational journey state.
 * This legacy helper only exists for preview/migration contexts and must not
 * drive checkpoint unlocks, progression, confirmations, or current step state.
 */
export function resolveAdaptiveCoreForProject(project: Project, serverCore?: AdaptiveInitiativeCore | null): AdaptiveInitiativeCore {
  return serverCore ?? resolveLegacyAdaptivePreview(project);
}

export function buildAdaptiveJourney(project: Project, core: AdaptiveInitiativeCore, canNavigate: (step: number) => boolean): AdaptiveJourneyStep[] {
  const activeCheckpoint = core.activeCheckpoint;
  return ([0, 1, 2, 3, 4] as const).map(step => {
    const config = getStepConfig(core, step);
    const legacyStep = step === 0 ? null : project.steps.find(item => item.number === step);
    const status = calculateAdaptiveStatus(core, project, step);
    const progress = calculateProgress(status, config, core, step);
    const checkpoint = activeCheckpoint?.step === step
      ? activeCheckpoint
      : config?.checkpoints.find(item => item.status === 'ready' || item.status === 'in_progress') ?? config?.checkpoints[0];
    const checkpointSummary = config?.checkpoints.map(item => `${item.code}: ${item.title}`) ?? [];
    const questionsCount = config?.checkpoints.reduce((sum, item) => sum + (item.questions?.length ?? 0), 0) ?? 0;

    return {
      step,
      number: step,
      name: normalizeText(config?.visibleName, step === 0 ? 'Base inicial adaptativa' : legacyStep?.name ?? `Step ${step}`),
      title: normalizeText(config?.visibleName, step === 0 ? 'Base inicial adaptativa' : legacyStep?.name ?? `Step ${step}`),
      shortTitle: step === 0 ? 'Step 0' : `Step ${step}`,
      description: normalizeText(config?.stablePurpose, legacyStep?.name ?? 'Trabajo pendiente de configurar.'),
      objective: normalizeText(config?.objective, 'Completar el trabajo requerido para avanzar.'),
      expectedOutput: normalizeText(config?.expectedOutput, 'Output pendiente de configurar.'),
      routeType: normalizeText(config?.routeType, core.masterContext?.routeType ?? 'adaptive'),
      depthLevel: normalizeText(config?.depthLevel, core.masterContext?.depthLevel ?? 'standard'),
      status,
      progress,
      activeCheckpointCode: checkpoint ? getCheckpointCode(checkpoint) : undefined,
      activeCheckpointTitle: checkpoint ? getCheckpointTitle(checkpoint) : undefined,
      checkpointSummary,
      questionsCount,
      nextAction: core.progressSignal?.step === step
        ? normalizeText(core.progressSignal.nextAction, checkpoint ? `Continuar ${getCheckpointCode(checkpoint)}.` : `Continuar Step ${step}.`)
        : checkpoint
          ? `Revisar ${getCheckpointCode(checkpoint)}: ${getCheckpointTitle(checkpoint)}.`
          : `Continuar Step ${step}.`,
      canNavigate: step === 0 ? canNavigate(0) : canNavigate(step),
    };
  });
}

export function getCurrentAdaptiveJourneyStep(journey: AdaptiveJourneyStep[]) {
  return journey.find(item => item.status === 'current' || item.status === 'blocked' || item.status === 'review_pending')
    ?? journey.find(item => item.status === 'available')
    ?? journey[0];
}

export function getAdaptiveJourneyProgress(journey: AdaptiveJourneyStep[]) {
  if (journey.length === 0) return 0;
  return Math.round(journey.reduce((sum, item) => sum + item.progress, 0) / journey.length);
}
