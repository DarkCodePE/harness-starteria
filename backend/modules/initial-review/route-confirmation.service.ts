/**
 * RouteConfirmationService — IR-B4 (ADR-025, PRD §12/§13/§21).
 *
 * "Estoy de acuerdo con esta ruta" → crea la iniciativa (Draft) y abre el Overview.
 * IDEMPOTENTE (RB-IR-017/018): a lo sumo un Project por revisión.
 *
 * REUSO milestone #7 sin acoplar: NO modifica ProjectService.createProject (el archivo
 * que reescribe #122). Llama createProject tal cual (Steps 1–4 + InitiativePortfolioMeta
 * en_step_0) y luego aplica los campos propios de initial-review (origin, snapshot,
 * step0Data) con un update — así IR-B4 no choca con #122.
 */
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { ProjectService } from '../projects/project.service';
import type { ImprovedProposal, StrategicQuestion, InformationReadiness } from './initial-review.types';
import { toCanonicalChallengeType } from './initial-review.types';

export interface ConfirmRouteResult {
  routeConfirmationId: string;
  initiativeId: string;
  overviewUrl: string;
}

export class RouteConfirmationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly projects: ProjectService,
  ) {}

  async confirmRoute(reviewId: string, userId: string, snapshotId?: string): Promise<ConfirmRouteResult> {
    const review = await this.prisma.initialReview.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Revisión inicial', 'INITIAL_REVIEW_NOT_FOUND');
    if (review.ownerId !== userId) throw AppError.forbidden('No puedes confirmar esta revisión.', 'INITIAL_REVIEW_FORBIDDEN');

    // Idempotencia (RB-IR-018): si ya hay un Project, devolver el mismo resultado.
    const existing = await this.prisma.routeConfirmation.findUnique({ where: { reviewId } });
    if (existing?.createdProjectId) return this.result(existing.id, existing.createdProjectId);

    const snapshot = snapshotId
      ? await this.prisma.initialReviewSnapshot.findFirst({ where: { id: snapshotId, reviewId } })
      : await this.prisma.initialReviewSnapshot.findFirst({ where: { reviewId }, orderBy: { version: 'desc' } });
    if (!snapshot) throw AppError.badRequest('La revisión aún no tiene una ruta que confirmar.', 'NO_SNAPSHOT_TO_CONFIRM');

    // Claim idempotente: @@unique(reviewId). Una carrera concurrente falla aquí.
    let confirmation;
    try {
      confirmation = await this.prisma.routeConfirmation.create({
        data: { reviewId, snapshotId: snapshot.id, confirmedBy: userId, selectedChallengeType: snapshot.selectedChallengeType, status: 'pending' },
      });
    } catch {
      const now = await this.prisma.routeConfirmation.findUnique({ where: { reviewId } });
      if (now?.createdProjectId) return this.result(now.id, now.createdProjectId);
      throw AppError.conflict('La confirmación ya está en progreso.', 'ROUTE_CONFIRMATION_IN_PROGRESS');
    }

    // Crea el Project reusando createProject (su propia tx, sin modificar).
    const proposal = (snapshot.improvedProposal ?? {}) as unknown as ImprovedProposal;
    let project;
    try {
      project = await this.projects.createProject(userId, {
        name: this.clampName(proposal.suggestedName),
        description: proposal.improvedDescription ? proposal.improvedDescription.slice(0, 1000) : undefined,
        challengeId: review.challengeId ?? undefined,
        companyContext: (snapshot as any).companyContextSelection ?? undefined,
      } as any);
    } catch (err) {
      // Falla la creación → liberar el claim para permitir reintento (edge §26).
      await this.prisma.routeConfirmation.delete({ where: { id: confirmation.id } }).catch(() => {});
      if (err instanceof AppError) throw err;
      throw AppError.badRequest('No pudimos crear la iniciativa.', 'INITIATIVE_CREATE_FAILED', { hint: 'Tu revisión quedó guardada. Intenta nuevamente.' });
    }

    // Finaliza atómicamente: campos de procedencia + prefill + confirmación + estado.
    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: project.id },
        data: { origin: 'from_initial_review', initialReviewSnapshotId: snapshot.id, step0Data: this.buildStep0Prefill(snapshot) as object },
      }),
      this.prisma.routeConfirmation.update({ where: { id: confirmation.id }, data: { createdProjectId: project.id, status: 'initiative_created' } }),
      this.prisma.initialReview.update({ where: { id: reviewId }, data: { status: 'converted_to_initiative' } }),
    ]);

    return this.result(confirmation.id, project.id);
  }

  /** Step0PrefillFromInitialReview (PRD §13) serializado en Project.step0Data. */
  private buildStep0Prefill(snapshot: any) {
    const proposal = (snapshot.improvedProposal ?? {}) as ImprovedProposal;
    const questions = (snapshot.strategicQuestions ?? []) as StrategicQuestion[];
    const critique = (snapshot.critique ?? {}) as { mainRisk?: string };
    const pending = questions.filter((q) => q.status !== 'answered');
    return {
      source: 'initial_review',
      initialReviewSnapshotId: snapshot.id,
      suggestedName: proposal.suggestedName ?? '',
      challengeType: toCanonicalChallengeType(snapshot.selectedChallengeType),
      contextInitial: snapshot.understandingSummary ?? '',
      initialFocus: proposal.initialFocus ?? '',
      expectedImpact: proposal.expectedImpact ?? '',
      mainRisk: critique.mainRisk ?? '',
      informationReadiness: (snapshot.informationReadiness ?? null) as InformationReadiness | null,
      pendingQuestions: pending,
      nextRecommendedStep: proposal.nextRecommendedStep ?? '',
    };
  }

  private clampName(name?: string): string {
    const n = (name ?? '').trim();
    if (n.length < 3) return 'Iniciativa sin nombre';
    return n.slice(0, 200);
  }

  private result(routeConfirmationId: string, initiativeId: string): ConfirmRouteResult {
    return { routeConfirmationId, initiativeId, overviewUrl: `/initiatives/${initiativeId}/overview` };
  }
}
