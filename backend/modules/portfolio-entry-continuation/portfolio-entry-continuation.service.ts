import { createHash, randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { can, type Permission } from '../../shared/authz/permissions';
import { logger } from '../../shared/utils/logger';
import { PortfolioEntryApiError } from '../portfolio-entry/portfolio-entry.errors';
import type { PortfolioEntryIdempotencyRepository } from '../portfolio-entry/application/portfolio-entry-idempotency.repository';

export type PortfolioEntryContinuationResultDto = {
  continuationId: string;
  sessionId: string;
  status: 'CONTINUED';
  destinationRoute: string;
  continuedAt: string;
  /** The grant is produced by this valid continuation, never by registration. */
  portfolioAccessGranted: boolean;
  portfolioScope: {
    kind: 'platform_portfolio_permission';
    userId: string;
    organizationId: string | null;
  };
  context: {
    understanding: unknown;
    desiredOutcome: unknown;
    decisionToEnable: unknown;
    knownContext: unknown;
    unresolvedContext: unknown;
    evidenceOrClarityNeeded: unknown;
    provenanceSummary: unknown;
  };
};

export type ContinuePortfolioEntryInput = {
  sessionId: string;
  expectedRevision: number;
  authenticatedUserId: string;
  permissions: ReadonlySet<Permission>;
  idempotencyKey?: string;
  requestId?: string;
};

export type ReadPortfolioEntryContinuationInput = {
  continuationId: string;
  authenticatedUserId: string;
  permissions: ReadonlySet<Permission>;
};

const IDEMPOTENCY_OPERATION = 'continue_portfolio_session';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const MAPPING_VERSION = 'portfolio-entry-portfolio-continuation-v0.1';

export class PortfolioEntryContinuationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly idempotencyRepository: PortfolioEntryIdempotencyRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async continueToPortfolio(input: ContinuePortfolioEntryInput): Promise<PortfolioEntryContinuationResultDto> {
    if (!input.authenticatedUserId) throw AppError.unauthorized('No autorizado.', 'PORTFOLIO_ENTRY_CONTINUATION_AUTH_REQUIRED');
    if (!input.idempotencyKey) throw PortfolioEntryApiError.missingIdempotencyKey();

    const payload = {
      expectedRevision: input.expectedRevision,
      target: 'PORTFOLIO',
      userId: input.authenticatedUserId,
      permission: 'portfolio:read',
    };
    return this.withIdempotency(input, payload, async () => {
      const continuation = await this.createContinuation(input);
      logger.info({
        requestId: input.requestId,
        sessionId: input.sessionId,
        userId: input.authenticatedUserId,
        continuationId: continuation.continuationId,
      }, 'portfolio_entry_portfolio_continuation_completed');
      return continuation;
    });
  }

  async readContinuation(input: ReadPortfolioEntryContinuationInput): Promise<PortfolioEntryContinuationResultDto> {
    if (!can(input.permissions, 'portfolio:read')) {
      throw AppError.forbidden('No tienes permiso Portfolio para leer esta continuidad.', 'PORTFOLIO_ENTRY_CONTINUATION_PORTFOLIO_PERMISSION_REQUIRED');
    }
    const row = await this.prisma.portfolioEntryPortfolioContinuation.findUnique({
      where: { id: input.continuationId },
    });
    if (!row) throw AppError.notFound('Portfolio Entry continuation', 'PORTFOLIO_ENTRY_CONTINUATION_NOT_FOUND');
    if (row.continuedByUserId !== input.authenticatedUserId) {
      throw AppError.forbidden('No autorizado.', 'PORTFOLIO_ENTRY_CONTINUATION_FORBIDDEN');
    }
    return this.toDto(row);
  }

  private async createContinuation(input: ContinuePortfolioEntryInput): Promise<PortfolioEntryContinuationResultDto> {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const row = await tx.portfolioEntrySession.findUnique({ where: { id: input.sessionId } });
        if (!row) throw AppError.notFound('Portfolio Entry session', 'PORTFOLIO_ENTRY_SESSION_NOT_FOUND');
        if (row.expiresAt <= this.now() || row.expiredAt || row.lifecycleStatus === 'EXPIRED') {
          throw new AppError(410, 'La sesion de Portfolio Entry expiro.', 'PORTFOLIO_ENTRY_SESSION_EXPIRED');
        }
        if (row.ownershipState !== 'CLAIMED' || !row.ownerUserId) {
          throw AppError.conflict('La sesion debe estar reclamada antes de continuar.', 'PORTFOLIO_ENTRY_CONTINUATION_NOT_CLAIMED');
        }
        if (row.ownerUserId !== input.authenticatedUserId) {
          throw AppError.forbidden('No autorizado.', 'PORTFOLIO_ENTRY_CONTINUATION_FORBIDDEN');
        }
        if (row.revision !== input.expectedRevision) {
          throw AppError.conflict('La sesion cambio antes de continuar.', 'PORTFOLIO_ENTRY_SESSION_CONFLICT');
        }
        if (row.continuationProfile !== 'PORTFOLIO_LEAD_ENTRY') {
          throw AppError.conflict('La sesion no tiene perfil Portfolio Lead para esta continuidad.', 'PORTFOLIO_ENTRY_CONTINUATION_PROFILE_FORBIDDEN');
        }
        if (row.lifecycleStatus !== 'CONFIRMED' && row.lifecycleStatus !== 'CONVERSION_ELIGIBLE') {
          throw AppError.conflict('La sesion no esta confirmada para continuar.', 'PORTFOLIO_ENTRY_CONTINUATION_NOT_CONFIRMED');
        }

        const projectConversion = await tx.portfolioEntryConversion.findUnique({ where: { sessionId: input.sessionId } });
        if (projectConversion) {
          throw AppError.conflict('La sesion ya fue convertida a Initiative/Project.', 'PORTFOLIO_ENTRY_CONTINUATION_INCOMPATIBLE_CONVERSION');
        }

        const existing = await tx.portfolioEntryPortfolioContinuation.findUnique({ where: { sessionId: input.sessionId } });
        if (existing) return existing;

        const [handoff, confirmation, user] = await Promise.all([
          tx.portfolioEntryHandoff.findFirst({
            where: { sessionId: input.sessionId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
          }),
          tx.portfolioEntryConfirmation.findFirst({
            where: { sessionId: input.sessionId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
          }),
          tx.user.findUnique({
            where: { id: input.authenticatedUserId },
            select: { id: true, organizationId: true, role: true, roles: true },
          }),
        ]);
        if (!user) throw AppError.unauthorized('No autorizado.', 'PORTFOLIO_ENTRY_CONTINUATION_AUTH_REQUIRED');
        if (!handoff) throw AppError.conflict('La sesion no tiene handoff confirmado.', 'PORTFOLIO_ENTRY_CONTINUATION_HANDOFF_REQUIRED');
        if (!confirmation || confirmation.status !== 'CONFIRMED') {
          throw AppError.conflict('La sesion no tiene confirmacion final.', 'PORTFOLIO_ENTRY_CONTINUATION_CONFIRMATION_REQUIRED');
        }
        if (confirmation.handoffId !== handoff.id) {
          throw AppError.conflict('La confirmacion ya no corresponde al handoff vigente.', 'PORTFOLIO_ENTRY_CONTINUATION_STALE_CONFIRMATION');
        }

        // Portfolio access is a consequence of this validated continuation. Registration
        // remains participant-only, and the primary role is deliberately preserved.
        const effectiveRoles = user.roles.length > 0 ? user.roles : [user.role];
        if (!effectiveRoles.includes('portfolio_lead')) {
          await tx.user.update({
            where: { id: input.authenticatedUserId },
            data: { roles: [...effectiveRoles, 'portfolio_lead'] },
          });
        }

        const continuationId = randomUUID();
        const destinationRoute = `/portfolio/inicio?portfolioEntryContinuationId=${encodeURIComponent(continuationId)}`;
        const scope = {
          kind: 'platform_portfolio_permission',
          userId: input.authenticatedUserId,
          organizationId: user.organizationId,
        };
        const snapshot = buildSourceSnapshot(row, handoff, confirmation);
        const pendingItems = buildPendingItems(handoff.handoffPayload);

        const created = await tx.portfolioEntryPortfolioContinuation.create({
          data: {
            id: continuationId,
            sessionId: input.sessionId,
            handoffId: handoff.id,
            confirmationId: confirmation.id,
            continuedByUserId: input.authenticatedUserId,
            portfolioScope: scope as Prisma.InputJsonValue,
            sourceSnapshot: snapshot as Prisma.InputJsonValue,
            pendingItems: pendingItems as Prisma.InputJsonValue,
            mappingVersion: MAPPING_VERSION,
            destinationRoute,
          },
        });

        const converted = await tx.portfolioEntrySession.updateMany({
          where: {
            id: input.sessionId,
            revision: row.revision,
            ownerUserId: input.authenticatedUserId,
            ownershipState: 'CLAIMED',
            lifecycleStatus: { in: ['CONFIRMED', 'CONVERSION_ELIGIBLE'] },
            continuationProfile: 'PORTFOLIO_LEAD_ENTRY',
          },
          data: {
            lifecycleStatus: 'CONVERTED',
            revision: { increment: 1 },
            updatedAt: this.now(),
            lastActivityAt: this.now(),
          },
        });
        if (converted.count !== 1) {
          throw AppError.conflict('La sesion cambio antes de finalizar la continuidad.', 'PORTFOLIO_ENTRY_SESSION_CONFLICT');
        }

        return created;
      });
      return this.toDto(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === 'P2002' || err.code === 'P2003')
      ) {
        const existing = await this.findContinuationBySession(input.sessionId);
        if (existing) return this.toDto(existing);
        throw AppError.conflict('La continuidad no pudo aplicarse por conflicto de datos.', 'PORTFOLIO_ENTRY_CONTINUATION_CONFLICT');
      }
      throw err;
    }
  }

  private async withIdempotency(
    input: ContinuePortfolioEntryInput,
    payload: unknown,
    run: () => Promise<PortfolioEntryContinuationResultDto>,
  ): Promise<PortfolioEntryContinuationResultDto> {
    const now = this.now();
    const hash = createHash('sha256').update(stableJson(payload)).digest('hex');
    const existing = await this.idempotencyRepository.findActive(IDEMPOTENCY_OPERATION, input.sessionId, input.idempotencyKey!, now);
    if (existing) {
      if (existing.requestPayloadHash !== hash) throw PortfolioEntryApiError.idempotencyConflict();
      if (existing.status === 'COMPLETED') return existing.responseSnapshot as PortfolioEntryContinuationResultDto;
      const continuation = await this.findContinuationBySession(input.sessionId);
      if (continuation) {
        const recovered = this.toDto(continuation);
        await this.idempotencyRepository.complete({ id: existing.id, responseSnapshot: recovered });
        return recovered;
      }
      if (existing.status === 'IN_PROGRESS') throw PortfolioEntryApiError.idempotencyInProgress();
    }

    const record = existing?.status === 'FAILED'
      ? existing
      : await this.idempotencyRepository.create({
        operation: IDEMPOTENCY_OPERATION,
        scope: input.sessionId,
        sessionId: input.sessionId,
        idempotencyKey: input.idempotencyKey!,
        requestPayloadHash: hash,
        expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS),
      });
    if (record.requestPayloadHash !== hash) throw PortfolioEntryApiError.idempotencyConflict();

    try {
      const result = await run();
      await this.idempotencyRepository.complete({ id: record.id, responseSnapshot: result });
      return result;
    } catch (err) {
      await this.idempotencyRepository.markFailed(record.id);
      logger.error({
        requestId: input.requestId,
        sessionId: input.sessionId,
        userId: input.authenticatedUserId,
        err,
      }, 'portfolio_entry_portfolio_continuation_failed');
      throw err;
    }
  }

  private async findContinuationBySession(sessionId: string): Promise<ContinuationRow | null> {
    return this.prisma.portfolioEntryPortfolioContinuation.findUnique({ where: { sessionId } });
  }

  private toDto(row: ContinuationRow): PortfolioEntryContinuationResultDto {
    const snapshot = row.sourceSnapshot as Record<string, unknown>;
    const handoff = (snapshot.handoff ?? {}) as Record<string, unknown>;
    const scope = row.portfolioScope as PortfolioEntryContinuationResultDto['portfolioScope'];
    return {
      continuationId: row.id,
      sessionId: row.sessionId,
      status: 'CONTINUED',
      destinationRoute: row.destinationRoute,
      continuedAt: row.continuedAt.toISOString(),
      portfolioScope: scope,
      portfolioAccessGranted: true,
      context: {
        understanding: handoff.understanding,
        desiredOutcome: handoff.desired_outcome,
        decisionToEnable: handoff.decision_to_enable,
        knownContext: handoff.known_context,
        unresolvedContext: handoff.unresolved_context,
        evidenceOrClarityNeeded: handoff.evidence_or_clarity_needed,
        provenanceSummary: handoff.provenance_summary,
      },
    };
  }
}

type ContinuationRow = {
  id: string;
  sessionId: string;
  portfolioScope: Prisma.JsonValue;
  sourceSnapshot: Prisma.JsonValue;
  destinationRoute: string;
  continuedAt: Date;
};

function buildSourceSnapshot(row: any, handoff: any, confirmation: any): Record<string, unknown> {
  return {
    session: {
      id: row.id,
      revision: row.revision,
      rawEntry: row.rawEntry,
      entryOrigin: row.entryOrigin,
      semanticState: row.semanticState,
      continuationProfile: row.continuationProfile,
      contractVersion: row.contractVersion,
      runtimeVersion: row.runtimeVersion,
      schemaVersion: row.schemaVersion,
      promptManifestId: row.promptManifestId,
    },
    handoff: handoff.handoffPayload,
    handoffRef: {
      id: handoff.id,
      version: handoff.version,
      schemaVersion: handoff.schemaVersion,
      runtimeVersion: handoff.runtimeVersion,
      promptManifestId: handoff.promptManifestId,
      createdAt: handoff.createdAt.toISOString(),
    },
    confirmation: {
      id: confirmation.id,
      version: confirmation.version,
      status: confirmation.status,
      acceptedFields: confirmation.acceptedFields,
      correctedFields: confirmation.correctedFields,
      rejectedFields: confirmation.rejectedFields,
      notes: confirmation.notes,
      confirmedAt: confirmation.confirmedAt?.toISOString() ?? null,
    },
  };
}

function buildPendingItems(handoffPayload: Prisma.JsonValue): Record<string, unknown> {
  const handoff = handoffPayload as Record<string, unknown>;
  return {
    unresolved_context: handoff.unresolved_context ?? [],
    evidence_or_clarity_needed: handoff.evidence_or_clarity_needed ?? [],
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  }
  return value;
}
