import type { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

/**
 * Issue #95 — keep InitiativePortfolioMeta.status in sync with real step progress.
 *
 * The portfolio-lead dashboard tracks each iniciativa via InitiativePortfolioMeta.status.
 * Without this, advancing a Step in the purple portal left the dashboard stale until an
 * admin/mentor manually PUT the meta. This derives the status from the project's actual
 * progress and pushes it on every Step transition.
 */

/** Portfolio statuses that track step progress and may be auto-advanced. */
const PROGRESSION_STATUSES = [
  'en_step_0',
  'en_step_1',
  'en_step_2',
  'en_step_3',
  'en_step_4',
] as const;
type ProgressionStatus = (typeof PROGRESSION_STATUSES)[number];

/**
 * Derive the initiative's portfolio status from the project's step progress.
 * Step 0 lives on Project.step0Status (done = COMPLETED); Steps 1-4 are "done" when
 * their status is APPROVED. The initiative is "en_step_N" for the lowest step it has
 * not finished yet (capped at 4).
 */
export function deriveInitiativePortfolioStatus(
  step0Status: string,
  steps: { number: number; status: string }[],
): ProgressionStatus {
  if (step0Status !== 'COMPLETED') return 'en_step_0';
  for (let n = 1; n <= 4; n++) {
    const step = steps.find((s) => s.number === n);
    if (!step || step.status !== 'APPROVED') return `en_step_${n}` as ProgressionStatus;
  }
  return 'en_step_4';
}

/**
 * Best-effort sync of a project's linked initiatives. NEVER throws — a portfolio sync
 * hiccup must not break the step/project flow that triggered it.
 *
 * Only touches initiatives that are (a) linked to a reto AND (b) still in the
 * auto-progression phase (en_step_*). Portfolio-managed states (bloqueada,
 * esperando_revision, lista_para_decision, cerrada) are set by hand and left untouched.
 */
export async function syncInitiativeProgress(
  prisma: PrismaClient,
  projectId: string,
): Promise<void> {
  try {
    const metas = await prisma.initiativePortfolioMeta.findMany({
      where: { projectId, status: { in: PROGRESSION_STATUSES as unknown as any[] } },
      select: { id: true },
    });
    if (metas.length === 0) return;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        step0Status: true,
        steps: { select: { number: true, status: true } },
      },
    });
    if (!project) return;

    const derived = deriveInitiativePortfolioStatus(
      project.step0Status as unknown as string,
      project.steps as unknown as { number: number; status: string }[],
    );

    await prisma.initiativePortfolioMeta.updateMany({
      where: { id: { in: metas.map((m) => m.id) } },
      data: { status: derived as any, currentStep: derived.replace('en_step_', '') },
    });
  } catch (err) {
    logger.error({ err, projectId }, '[portfolio] syncInitiativeProgress failed (non-fatal)');
  }
}
