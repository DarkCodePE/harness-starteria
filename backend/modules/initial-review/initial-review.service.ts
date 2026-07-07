/**
 * InitialReviewService — IR-B2 (ADR-025, PRD §20).
 *
 * CRUD + versionado de la revisión inicial guiada. La creación de la INICIATIVA real
 * NO ocurre aquí (RB-IR-001/002) — eso es IR-B4 (confirm-route → createProject). Este
 * servicio solo persiste la revisión y sus snapshots congelados.
 *
 * La generación IA se inyecta (InitialReviewGenerator): IR-B2 usa el mock determinista;
 * IR-B3 inyecta el generador real. El tipo de reto se persiste en el enum de DB (español)
 * y se expone canónico (inglés) en el DTO.
 */
import type { PrismaClient, InitialReview, InitialReviewSnapshot } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import {
  InitialReviewGenerator,
  GeneratedReview,
  StrategicQuestion,
  toDbChallengeType,
  toCanonicalChallengeType,
} from './initial-review.types';
import { CreateInitialReviewInput, StrategicAnswersInput } from './initial-review.schemas';

const READ_ROLES = new Set(['admin', 'mentor']);

export interface InitialReviewDto {
  id: string;
  status: string;
  originalInput: string;
  addedContext: string[];
  challengeId: string | null;
  snapshot: SnapshotDto | null;
}
export interface SnapshotDto {
  id: string;
  version: number;
  understandingSummary: string;
  suggestedChallengeType: string;
  selectedChallengeType: string;
  challengeTypeReason: string;
  informationReadiness: string | null;
  critique: unknown;
  strategicQuestions: unknown;
  improvedProposal: unknown;
  routePreview: unknown;
}

export class InitialReviewService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly generator: InitialReviewGenerator,
  ) {}

  /** POST /initial-reviews — crea la revisión (processing → generated) + snapshot v1. */
  async createReview(userId: string, data: CreateInitialReviewInput): Promise<InitialReviewDto> {
    const review = await this.prisma.initialReview.create({
      data: {
        ownerId: userId,
        status: 'processing',
        originalInput: data.originalInput,
        addedContext: data.addedContext ?? undefined,
        sourceFileIds: data.sourceFileIds ?? undefined,
        challengeId: data.challengeId ?? undefined,
      },
    });

    try {
      const gen = await this.generator.generate({ originalInput: data.originalInput, addedContext: data.addedContext });
      const snapshot = await this.persistSnapshot(review, 1, data.addedContext, data.sourceFileIds, gen, userId);
      const updated = await this.prisma.initialReview.update({ where: { id: review.id }, data: { status: 'generated' } });
      return this.toDto(updated, snapshot);
    } catch (err) {
      if (err instanceof AppError) throw err;
      await this.prisma.initialReview.update({ where: { id: review.id }, data: { status: 'failed' } }).catch(() => {});
      throw AppError.badRequest('No pudimos generar la revisión inicial.', 'INITIAL_REVIEW_GEN_FAILED', {
        hint: 'Tu información quedó guardada como borrador. Intenta nuevamente.',
      });
    }
  }

  /** GET /initial-reviews/:id — dueño o admin/mentor. */
  async getReview(id: string, userId: string, role: string): Promise<InitialReviewDto> {
    const review = await this.requireReadable(id, userId, role);
    const snapshot = await this.latestSnapshot(id);
    return this.toDto(review, snapshot);
  }

  /** GET /initial-reviews/:id/snapshot — último snapshot congelado. */
  async getLatestSnapshot(id: string, userId: string, role: string): Promise<SnapshotDto> {
    await this.requireReadable(id, userId, role);
    const snapshot = await this.latestSnapshot(id);
    if (!snapshot) throw AppError.notFound('Snapshot', 'SNAPSHOT_NOT_FOUND', { hint: 'La revisión aún no se ha generado.' });
    return this.toSnapshotDto(snapshot);
  }

  /** POST /initial-reviews/:id/add-context — agrega contexto y regenera (nueva versión). */
  async addContext(id: string, userId: string, context: string): Promise<InitialReviewDto> {
    const review = await this.requireOwned(id, userId);
    if (review.status === 'converted_to_initiative') {
      throw AppError.conflict('La revisión ya fue convertida en iniciativa.', 'INITIAL_REVIEW_ALREADY_CONVERTED');
    }
    const merged = [...this.asStringArray(review.addedContext), context];
    const nextVersion = await this.nextVersion(id);
    const gen = await this.generator.generate({ originalInput: review.originalInput, addedContext: merged });
    const snapshot = await this.persistSnapshot(review, nextVersion, merged, this.asStringArray(review.sourceFileIds), gen, userId);
    const updated = await this.prisma.initialReview.update({ where: { id }, data: { addedContext: merged, status: 'updated' } });
    return this.toDto(updated, snapshot);
  }

  /** POST /initial-reviews/:id/strategic-answers — guarda respuestas en el snapshot vigente. */
  async saveStrategicAnswers(id: string, userId: string, input: StrategicAnswersInput): Promise<InitialReviewDto> {
    const review = await this.requireOwned(id, userId);
    const snapshot = await this.latestSnapshot(id);
    if (!snapshot) throw AppError.notFound('Snapshot', 'SNAPSHOT_NOT_FOUND');

    const questions = (snapshot.strategicQuestions as unknown as StrategicQuestion[]) ?? [];
    const merged = questions.map((q) => {
      const a = input.answers.find((x) => x.id === q.id);
      if (!a) return q;
      if (a.unknown) return { ...q, answer: undefined, status: 'unknown' as const };
      return { ...q, answer: a.answer, status: (a.answer ? 'answered' : q.status) as StrategicQuestion['status'] };
    });
    const updatedSnapshot = await this.prisma.initialReviewSnapshot.update({
      where: { id: snapshot.id },
      data: { strategicQuestions: merged as unknown as object },
    });
    return this.toDto(review, updatedSnapshot);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async persistSnapshot(
    review: InitialReview,
    version: number,
    addedContext: string[] | undefined,
    sourceFileIds: string[] | undefined,
    gen: GeneratedReview,
    createdBy: string,
  ): Promise<InitialReviewSnapshot> {
    const dbType = toDbChallengeType(gen.suggestedChallengeType);
    return this.prisma.initialReviewSnapshot.create({
      data: {
        reviewId: review.id,
        version,
        originalInput: review.originalInput,
        addedContext: addedContext ?? undefined,
        sourceFileIds: sourceFileIds ?? undefined,
        understandingSummary: gen.understandingSummary,
        suggestedChallengeType: dbType,
        selectedChallengeType: dbType, // el usuario aún no lo cambió
        challengeTypeReason: gen.challengeTypeReason,
        informationReadiness: gen.informationReadiness ?? null,
        critique: gen.critique as unknown as object,
        strategicQuestions: gen.strategicQuestions as unknown as object,
        improvedProposal: gen.improvedProposal as unknown as object,
        routePreview: gen.routePreview as unknown as object,
        createdBy,
      },
    });
  }

  private async latestSnapshot(reviewId: string): Promise<InitialReviewSnapshot | null> {
    return this.prisma.initialReviewSnapshot.findFirst({ where: { reviewId }, orderBy: { version: 'desc' } });
  }

  private async nextVersion(reviewId: string): Promise<number> {
    const agg = await this.prisma.initialReviewSnapshot.aggregate({ where: { reviewId }, _max: { version: true } });
    return (agg._max.version ?? 0) + 1;
  }

  private async requireOwned(id: string, userId: string): Promise<InitialReview> {
    const review = await this.prisma.initialReview.findUnique({ where: { id } });
    if (!review) throw AppError.notFound('Revisión inicial', 'INITIAL_REVIEW_NOT_FOUND');
    if (review.ownerId !== userId) throw AppError.forbidden('No puedes editar esta revisión.', 'INITIAL_REVIEW_FORBIDDEN');
    return review;
  }

  private async requireReadable(id: string, userId: string, role: string): Promise<InitialReview> {
    const review = await this.prisma.initialReview.findUnique({ where: { id } });
    if (!review) throw AppError.notFound('Revisión inicial', 'INITIAL_REVIEW_NOT_FOUND');
    if (review.ownerId !== userId && !READ_ROLES.has(role)) {
      throw AppError.forbidden('No tienes acceso a esta revisión.', 'INITIAL_REVIEW_FORBIDDEN');
    }
    return review;
  }

  private asStringArray(v: unknown): string[] {
    return Array.isArray(v) ? (v as string[]) : [];
  }

  private toDto(review: InitialReview, snapshot: InitialReviewSnapshot | null): InitialReviewDto {
    return {
      id: review.id,
      status: review.status,
      originalInput: review.originalInput,
      addedContext: this.asStringArray(review.addedContext),
      challengeId: review.challengeId ?? null,
      snapshot: snapshot ? this.toSnapshotDto(snapshot) : null,
    };
  }

  private toSnapshotDto(s: InitialReviewSnapshot): SnapshotDto {
    return {
      id: s.id,
      version: s.version,
      understandingSummary: s.understandingSummary,
      suggestedChallengeType: toCanonicalChallengeType(s.suggestedChallengeType),
      selectedChallengeType: toCanonicalChallengeType(s.selectedChallengeType),
      challengeTypeReason: s.challengeTypeReason,
      informationReadiness: s.informationReadiness ?? null,
      critique: s.critique,
      strategicQuestions: s.strategicQuestions,
      improvedProposal: s.improvedProposal,
      routePreview: s.routePreview,
    };
  }
}
