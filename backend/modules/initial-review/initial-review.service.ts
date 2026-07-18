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
import type {
  PrismaClient,
  InitialReview,
  InitialReviewSnapshot,
  InitialReviewChatEvent,
  InitialReviewChatRole,
  InitialReviewChatEventKind,
} from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { calculateContextScore } from '../companies/context-score';
import {
  InitialReviewGenerator,
  GeneratedReview,
  StrategicQuestion,
  toDbChallengeType,
  toCanonicalChallengeType,
} from './initial-review.types';
import { CreateInitialReviewInput, StrategicAnswersInput } from './initial-review.schemas';

const READ_ROLES = new Set(['admin', 'mentor']);
const COMPANY_READ_ROLES = new Set(['OWNER', 'CURATOR', 'EDITOR', 'VIEWER']);

export interface InitialReviewDto {
  id: string;
  status: string;
  originalInput: string;
  addedContext: string[];
  challengeId: string | null;
  companyContext: unknown | null;
  snapshot: SnapshotDto | null;
  chatEvents: ChatEventDto[]; // ADR-026 (IRC-01): historial conversacional del asistente
}

/** ADR-026 (IRC-01): un turno persistido de la conversación del asistente. */
export interface ChatEventDto {
  id: string;
  role: InitialReviewChatRole;
  kind: InitialReviewChatEventKind;
  payload: unknown; // forma según `kind` (ver ADR-026): { text?, questionId?, changedSections?, ... }
  snapshotVersion: number | null;
  createdAt: string; // ISO-8601
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
  companyContext: unknown | null;
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
        companyContextSelection: data.companyContext ?? undefined,
        challengeId: data.challengeId ?? undefined,
      },
    });

    try {
      const companyContext = await this.buildCompanyContextForGeneration(userId, data.companyContext);
      const gen = await this.generator.generate({ originalInput: data.originalInput, addedContext: data.addedContext, companyContext });
      const snapshot = await this.persistSnapshot(review, 1, data.addedContext, data.sourceFileIds, gen, userId, companyContext ?? data.companyContext);
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

  /** GET /initial-reviews/:id — dueño o admin/mentor. Rehidrata el historial de chat (ADR-026). */
  async getReview(id: string, userId: string, role: string): Promise<InitialReviewDto> {
    const review = await this.requireReadable(id, userId, role);
    const snapshot = await this.latestSnapshot(id);
    const chatEvents = await this.chatEventsFor(id);
    return this.toDto(review, snapshot, chatEvents);
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
    const companyContext = await this.buildCompanyContextForGeneration(userId, (review as any).companyContextSelection);
    const gen = await this.generator.generate({ originalInput: review.originalInput, addedContext: merged, companyContext });
    const snapshot = await this.persistSnapshot(review, nextVersion, merged, this.asStringArray(review.sourceFileIds), gen, userId, companyContext ?? (review as any).companyContextSelection);
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
    companyContext?: unknown,
  ): Promise<InitialReviewSnapshot> {
    const dbType = toDbChallengeType(gen.suggestedChallengeType);
    return this.prisma.initialReviewSnapshot.create({
      data: {
        reviewId: review.id,
        version,
        originalInput: review.originalInput,
        addedContext: addedContext ?? undefined,
        sourceFileIds: sourceFileIds ?? undefined,
        companyContextSelection: (companyContext ?? undefined) as any,
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

  private async buildCompanyContextForGeneration(userId: string, selection: unknown): Promise<unknown | null> {
    const selected = (selection && typeof selection === 'object' ? selection : {}) as { companyId?: string; areaId?: string };
    if (!selected.companyId) return null;
    const [company, entries, sources, version, areas] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: selected.companyId }, include: { memberships: true } }),
      this.prisma.companyContextEntry.findMany({ where: { companyId: selected.companyId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.contextSource.findMany({ where: { companyId: selected.companyId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      this.prisma.companyContextVersion.findFirst({ where: { companyId: selected.companyId, status: { in: ['PUBLISHED', 'DRAFT'] as any } }, orderBy: { versionNumber: 'desc' } }),
      this.prisma.companyArea.findMany({ where: { companyId: selected.companyId, status: 'ACTIVE' as any }, include: { contexts: { orderBy: { version: 'desc' }, take: 1 } } }),
    ]);
    if (!company || company.deletedAt) throw AppError.notFound('Empresa', 'COMPANY_NOT_FOUND');
    const membership = company.memberships.find((m: any) => m.userId === userId && m.status === 'APPROVED');
    const canRead = company.ownerUserId === userId || Boolean(membership && COMPANY_READ_ROLES.has(membership.role)) || company.scope === 'ORGANIZATION';
    if (!canRead) throw AppError.forbidden('No tienes acceso a esta empresa.', 'COMPANY_ACCESS_DENIED');
    const score = calculateContextScore(entries as any, sources as any);
    const area = selected.areaId ? areas.find((item: any) => item.id === selected.areaId) : null;
    return {
      companyId: company.id,
      areaId: area?.id,
      companyVersionId: version?.id ?? null,
      companyVersionNumber: version?.versionNumber ?? null,
      contextScore: score.score,
      contextLevel: score.level,
      contextLevelLabel: score.label,
      missing: score.missing,
      company: {
        id: company.id,
        name: company.name,
        sector: company.sector,
        country: company.country,
        employeeRange: company.employeeRange,
        websiteUrl: company.websiteUrl,
        linkedinUrl: company.linkedinUrl,
        scope: company.scope,
      },
      area: area ? {
        id: area.id,
        name: area.name,
        description: area.description,
        leadRole: area.leadRole,
        context: area.contexts[0] ?? null,
      } : null,
      confirmedInformation: entries
        .filter((entry: any) => entry.verificationStatus === 'USER_CONFIRMED')
        .map((entry: any) => ({ dimension: entry.dimension, fieldKey: entry.fieldKey, value: entry.valueJson })),
      inferredInformation: entries
        .filter((entry: any) => entry.verificationStatus === 'INFERRED' || entry.sourceType === 'AGENT_INFERENCE')
        .map((entry: any) => ({ dimension: entry.dimension, fieldKey: entry.fieldKey, value: entry.valueJson, sourceType: entry.sourceType })),
      entries: entries.map((entry: any) => ({
        dimension: entry.dimension,
        fieldKey: entry.fieldKey,
        value: entry.valueJson,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        confidence: entry.confidence,
        verificationStatus: entry.verificationStatus,
      })),
      sources: sources.map((source: any) => ({
        id: source.id,
        sourceType: source.sourceType,
        url: source.url,
        originalFilename: source.originalFilename,
        status: source.status,
        processedAt: source.processedAt,
      })),
    };
  }

  private toDto(
    review: InitialReview,
    snapshot: InitialReviewSnapshot | null,
    chatEvents: ChatEventDto[] = [],
  ): InitialReviewDto {
    return {
      id: review.id,
      status: review.status,
      originalInput: review.originalInput,
      addedContext: this.asStringArray(review.addedContext),
      challengeId: review.challengeId ?? null,
      companyContext: (review as any).companyContextSelection ?? null,
      snapshot: snapshot ? this.toSnapshotDto(snapshot) : null,
      chatEvents,
    };
  }

  /**
   * ADR-026 (IRC-01): historial conversacional del asistente, orden cronológico.
   * Desempate por `id` cuando dos eventos comparten `createdAt` (ms), para un orden
   * determinista independiente de la resolución del timestamp.
   */
  private async chatEventsFor(reviewId: string): Promise<ChatEventDto[]> {
    const events = await this.prisma.initialReviewChatEvent.findMany({
      where: { reviewId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return events.map((e) => this.toChatEventDto(e));
  }

  private toChatEventDto(e: InitialReviewChatEvent): ChatEventDto {
    return {
      id: e.id,
      role: e.role,
      kind: e.kind,
      payload: e.payload,
      snapshotVersion: e.snapshotVersion ?? null,
      createdAt: e.createdAt.toISOString(),
    };
  }

  /**
   * ADR-026 (IRC-01): primitiva de escritura del historial conversacional. Reutilizada
   * por add-context / strategic-answers / confirm-route (IRC-02/04/06). El parámetro `tx`
   * permite persistir el evento en la misma transacción que la regeneración del snapshot.
   */
  async appendChatEvent(
    reviewId: string,
    event: {
      role: InitialReviewChatRole;
      kind: InitialReviewChatEventKind;
      payload: unknown;
      snapshotVersion?: number | null;
    },
    tx: { initialReviewChatEvent: PrismaClient['initialReviewChatEvent'] } = this.prisma,
  ): Promise<ChatEventDto> {
    const created = await tx.initialReviewChatEvent.create({
      data: {
        reviewId,
        role: event.role,
        kind: event.kind,
        payload: (event.payload ?? {}) as object,
        snapshotVersion: event.snapshotVersion ?? null,
      },
    });
    return this.toChatEventDto(created);
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
      companyContext: (s as any).companyContextSelection ?? null,
    };
  }
}
