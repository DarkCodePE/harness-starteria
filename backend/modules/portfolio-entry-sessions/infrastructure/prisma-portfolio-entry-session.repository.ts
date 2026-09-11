import { Prisma, type PrismaClient } from '@prisma/client';
import { canClaimPortfolioEntrySession } from '../domain/portfolio-entry-session-ownership';
import type { PortfolioEntryConfirmation } from '../domain/portfolio-entry-confirmation.types';
import type {
  PortfolioEntryHandoffRecord,
  PortfolioEntrySession,
  PortfolioEntryTurn,
} from '../domain/portfolio-entry-session.types';
import { PortfolioEntrySessionError } from '../application/portfolio-entry-session-errors';
import type {
  ClaimPortfolioEntrySessionOwnershipInput,
  CreatePortfolioEntrySessionInput,
  PortfolioEntrySessionRepository,
  SavePortfolioEntrySessionStateInput,
} from '../application/portfolio-entry-session.repository';
import type { PortfolioEntryModelExecutionRecord } from '../observability/portfolio-entry-execution-metadata';
import {
  PrismaPortfolioEntrySessionMapper,
  type PrismaPortfolioEntryConfirmationRow,
  type PrismaPortfolioEntryHandoffRow,
  type PrismaPortfolioEntrySessionRow,
} from './prisma-portfolio-entry-session.mapper';

type PrismaTx = Prisma.TransactionClient;

export class PrismaPortfolioEntrySessionRepository implements PortfolioEntrySessionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly mapper = new PrismaPortfolioEntrySessionMapper(),
  ) {}

  async createSession(input: CreatePortfolioEntrySessionInput): Promise<PortfolioEntrySession> {
    const row = await this.prisma.portfolioEntrySession.create({
      data: this.mapper.sessionCreateData(input),
    });
    return this.mapper.toSession(row);
  }

  async findSessionById(sessionId: string): Promise<PortfolioEntrySession | null> {
    return this.findSession({ id: sessionId });
  }

  async findSessionForPublicAccess(
    sessionId: string,
    publicAccessTokenHash: string,
  ): Promise<PortfolioEntrySession | null> {
    return this.findSession({
      id: sessionId,
      publicAccessTokenHash,
    });
  }

  async findSessionForOwner(sessionId: string, ownerUserId: string): Promise<PortfolioEntrySession | null> {
    return this.findSession({
      id: sessionId,
      ownerUserId,
      ownershipState: 'CLAIMED',
    });
  }

  async saveSessionState(input: SavePortfolioEntrySessionStateInput): Promise<PortfolioEntrySession> {
    assertNextRevision(input.session, input.expectedRevision);
    const result = await this.prisma.portfolioEntrySession.updateMany({
      where: { id: input.session.id, revision: input.expectedRevision },
      data: this.mapper.sessionMutableData(input.session),
    });
    if (result.count !== 1) throw await this.conflictOrNotFound(input.session.id);
    return this.requireSession(input.session.id);
  }

  async appendTurn(
    turn: PortfolioEntryTurn,
    session: PortfolioEntrySession,
    expectedRevision: number,
  ): Promise<PortfolioEntryTurn> {
    assertSameSession(turn.sessionId, session.id);
    assertNextRevision(session, expectedRevision);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.portfolioEntrySession.updateMany({
          where: { id: session.id, revision: expectedRevision },
          data: this.mapper.sessionMutableData(session),
        });
        if (updated.count !== 1) throw PortfolioEntrySessionError.conflict();
        const row = await tx.portfolioEntryTurn.create({
          data: this.mapper.turnCreateData(turn),
        });
        return this.mapper.toTurn(row);
      });
    } catch (err) {
      throw mapPrismaConflict(err);
    }
  }

  async appendModelExecution(
    execution: PortfolioEntryModelExecutionRecord,
  ): Promise<PortfolioEntryModelExecutionRecord> {
    await this.assertSessionExists(execution.sessionId);
    await this.assertChildReferencesBelongToSession(this.prisma, execution);
    try {
      const row = await this.prisma.portfolioEntryModelExecution.create({
        data: this.mapper.modelExecutionCreateData(execution),
      });
      return this.mapper.toModelExecution(row);
    } catch (err) {
      throw mapPrismaConflict(err);
    }
  }

  async saveHandoff(
    handoff: PortfolioEntryHandoffRecord,
    session: PortfolioEntrySession,
    expectedRevision: number,
  ): Promise<PortfolioEntryHandoffRecord> {
    assertSameSession(handoff.sessionId, session.id);
    assertNextRevision(session, expectedRevision);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (handoff.sourceTurnId) {
          await this.assertTurnBelongsToSession(tx, handoff.sourceTurnId, handoff.sessionId);
        }
        const updated = await tx.portfolioEntrySession.updateMany({
          where: { id: session.id, revision: expectedRevision },
          data: this.mapper.sessionMutableData(session),
        });
        if (updated.count !== 1) throw PortfolioEntrySessionError.conflict();
        const row = await tx.portfolioEntryHandoff.create({
          data: this.mapper.handoffCreateData(handoff),
        });
        return this.mapper.toHandoff(row);
      });
    } catch (err) {
      throw mapPrismaConflict(err);
    }
  }

  async saveConfirmation(
    confirmation: PortfolioEntryConfirmation,
    session: PortfolioEntrySession,
    expectedRevision: number,
  ): Promise<PortfolioEntryConfirmation> {
    assertSameSession(confirmation.sessionId, session.id);
    assertNextRevision(session, expectedRevision);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.assertHandoffBelongsToSession(tx, confirmation.handoffId, confirmation.sessionId);
        const updated = await tx.portfolioEntrySession.updateMany({
          where: { id: session.id, revision: expectedRevision },
          data: this.mapper.sessionMutableData(session),
        });
        if (updated.count !== 1) throw PortfolioEntrySessionError.conflict();
        const row = await tx.portfolioEntryConfirmation.create({
          data: this.mapper.confirmationCreateData(confirmation),
        });
        return this.mapper.toConfirmation(row);
      });
    } catch (err) {
      throw mapPrismaConflict(err);
    }
  }

  async claimOwnership(input: ClaimPortfolioEntrySessionOwnershipInput): Promise<PortfolioEntrySession> {
    const existing = await this.prisma.portfolioEntrySession.findUnique({ where: { id: input.sessionId } });
    if (!existing) throw PortfolioEntrySessionError.notFound();
    if (existing.revision !== input.expectedRevision) throw PortfolioEntrySessionError.conflict();
    if (!canClaimPortfolioEntrySession(existing)) throw PortfolioEntrySessionError.invalidOwnershipClaim();

    const result = await this.prisma.portfolioEntrySession.updateMany({
      where: {
        id: input.sessionId,
        revision: input.expectedRevision,
        ownershipState: 'ANONYMOUS',
        ownerUserId: null,
      },
      data: {
        ownerUserId: input.ownerUserId,
        ownershipState: 'CLAIMED',
        revision: { increment: 1 },
        updatedAt: input.now,
        lastActivityAt: input.now,
      },
    });
    if (result.count !== 1) throw PortfolioEntrySessionError.conflict();
    return this.requireSession(input.sessionId);
  }

  async touchActivity(sessionId: string, now: Date, expectedRevision: number): Promise<PortfolioEntrySession> {
    const existing = await this.prisma.portfolioEntrySession.findUnique({ where: { id: sessionId } });
    if (!existing) throw PortfolioEntrySessionError.notFound();
    if (existing.revision !== expectedRevision) throw PortfolioEntrySessionError.conflict();
    if (existing.expiredAt || existing.lifecycleStatus === 'EXPIRED') throw PortfolioEntrySessionError.expired();

    const result = await this.prisma.portfolioEntrySession.updateMany({
      where: {
        id: sessionId,
        revision: expectedRevision,
        expiredAt: null,
        lifecycleStatus: { not: 'EXPIRED' },
      },
      data: {
        revision: { increment: 1 },
        updatedAt: now,
        lastActivityAt: now,
      },
    });
    if (result.count !== 1) throw PortfolioEntrySessionError.conflict();
    return this.requireSession(sessionId);
  }

  async markExpired(sessionId: string, now: Date, expectedRevision: number): Promise<PortfolioEntrySession> {
    const existing = await this.prisma.portfolioEntrySession.findUnique({ where: { id: sessionId } });
    if (!existing) throw PortfolioEntrySessionError.notFound();
    if (existing.revision !== expectedRevision) throw PortfolioEntrySessionError.conflict();

    const result = await this.prisma.portfolioEntrySession.updateMany({
      where: {
        id: sessionId,
        revision: expectedRevision,
        expiredAt: null,
        lifecycleStatus: { not: 'EXPIRED' },
      },
      data: {
        lifecycleStatus: 'EXPIRED',
        expiredAt: now,
        revision: { increment: 1 },
        updatedAt: now,
      },
    });
    if (result.count !== 1) throw PortfolioEntrySessionError.conflict();
    return this.requireSession(sessionId);
  }

  async listTurns(sessionId: string): Promise<PortfolioEntryTurn[]> {
    const rows = await this.prisma.portfolioEntryTurn.findMany({
      where: { sessionId },
      orderBy: [{ turnIndex: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.mapper.toTurn(row));
  }

  async listModelExecutions(sessionId: string): Promise<PortfolioEntryModelExecutionRecord[]> {
    const rows = await this.prisma.portfolioEntryModelExecution.findMany({
      where: { sessionId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.mapper.toModelExecution(row));
  }

  private async findSession(where: Prisma.PortfolioEntrySessionWhereInput): Promise<PortfolioEntrySession | null> {
    const row = await this.prisma.portfolioEntrySession.findFirst({ where });
    if (!row) return null;
    return this.toFullSession(row);
  }

  private async requireSession(sessionId: string): Promise<PortfolioEntrySession> {
    const session = await this.findSessionById(sessionId);
    if (!session) throw PortfolioEntrySessionError.notFound();
    return session;
  }

  private async toFullSession(row: PrismaPortfolioEntrySessionRow): Promise<PortfolioEntrySession> {
    const [handoffRow, confirmationRow] = await Promise.all([
      this.prisma.portfolioEntryHandoff.findFirst({
        where: { sessionId: row.id },
        orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.portfolioEntryConfirmation.findFirst({
        where: { sessionId: row.id },
        orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);
    return this.mapper.toSession(
      row,
      handoffRow ? this.mapper.toHandoff(handoffRow as PrismaPortfolioEntryHandoffRow) : null,
      confirmationRow ? this.mapper.toConfirmation(confirmationRow as PrismaPortfolioEntryConfirmationRow) : null,
    );
  }

  private async assertSessionExists(sessionId: string): Promise<void> {
    const existing = await this.prisma.portfolioEntrySession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!existing) throw PortfolioEntrySessionError.notFound();
  }

  private async assertChildReferencesBelongToSession(
    tx: PrismaClient | PrismaTx,
    execution: PortfolioEntryModelExecutionRecord,
  ): Promise<void> {
    if (execution.turnId) await this.assertTurnBelongsToSession(tx, execution.turnId, execution.sessionId);
    if (execution.handoffId) await this.assertHandoffBelongsToSession(tx, execution.handoffId, execution.sessionId);
  }

  private async assertTurnBelongsToSession(tx: PrismaClient | PrismaTx, turnId: string, sessionId: string): Promise<void> {
    const turn = await tx.portfolioEntryTurn.findUnique({
      where: { id: turnId },
      select: { sessionId: true },
    });
    if (!turn || turn.sessionId !== sessionId) throw PortfolioEntrySessionError.conflict();
  }

  private async assertHandoffBelongsToSession(tx: PrismaClient | PrismaTx, handoffId: string, sessionId: string): Promise<void> {
    const handoff = await tx.portfolioEntryHandoff.findUnique({
      where: { id: handoffId },
      select: { sessionId: true },
    });
    if (!handoff || handoff.sessionId !== sessionId) throw PortfolioEntrySessionError.conflict();
  }

  private async conflictOrNotFound(sessionId: string): Promise<PortfolioEntrySessionError> {
    const exists = await this.prisma.portfolioEntrySession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    return exists ? PortfolioEntrySessionError.conflict() : PortfolioEntrySessionError.notFound();
  }
}

function assertSameSession(childSessionId: string, sessionId: string): void {
  if (childSessionId !== sessionId) throw PortfolioEntrySessionError.conflict();
}

function assertNextRevision(session: PortfolioEntrySession, expectedRevision: number): void {
  if (session.revision !== expectedRevision + 1) {
    throw PortfolioEntrySessionError.conflict();
  }
}

function mapPrismaConflict(err: unknown): never {
  if (err instanceof PortfolioEntrySessionError) throw err;
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === 'P2002' || err.code === 'P2003')
  ) {
    throw PortfolioEntrySessionError.conflict();
  }
  throw err;
}
