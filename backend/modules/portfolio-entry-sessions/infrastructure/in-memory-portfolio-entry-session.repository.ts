import type { PortfolioEntryConfirmation } from '../domain/portfolio-entry-confirmation.types';
import { canClaimPortfolioEntrySession } from '../domain/portfolio-entry-session-ownership';
import type {
  PortfolioEntryHandoffRecord,
  PortfolioEntrySession,
  PortfolioEntryTurn,
} from '../domain/portfolio-entry-session.types';
import type {
  ClaimPortfolioEntrySessionOwnershipInput,
  CreatePortfolioEntrySessionInput,
  PortfolioEntrySessionRepository,
  SavePortfolioEntrySessionStateInput,
} from '../application/portfolio-entry-session.repository';
import { PortfolioEntrySessionError } from '../application/portfolio-entry-session-errors';
import type { PortfolioEntryModelExecutionRecord } from '../observability/portfolio-entry-execution-metadata';

export class InMemoryPortfolioEntrySessionRepository implements PortfolioEntrySessionRepository {
  private readonly sessions = new Map<string, PortfolioEntrySession>();
  private readonly turns = new Map<string, PortfolioEntryTurn[]>();
  private readonly executions = new Map<string, PortfolioEntryModelExecutionRecord[]>();
  private readonly handoffs = new Map<string, PortfolioEntryHandoffRecord[]>();
  private readonly confirmations = new Map<string, PortfolioEntryConfirmation[]>();

  async createSession(input: CreatePortfolioEntrySessionInput): Promise<PortfolioEntrySession> {
    this.sessions.set(input.id, cloneSession(input));
    this.turns.set(input.id, []);
    this.executions.set(input.id, []);
    this.handoffs.set(input.id, []);
    this.confirmations.set(input.id, []);
    return cloneSession(input);
  }

  async findSessionById(sessionId: string): Promise<PortfolioEntrySession | null> {
    return cloneNullableSession(this.sessions.get(sessionId) ?? null);
  }

  async findSessionForPublicAccess(
    sessionId: string,
    publicAccessTokenHash: string,
  ): Promise<PortfolioEntrySession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.publicAccessTokenHash) return null;
    if (session.publicAccessTokenHash !== publicAccessTokenHash) return null;
    return cloneSession(session);
  }

  async findSessionForOwner(sessionId: string, ownerUserId: string): Promise<PortfolioEntrySession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.ownerUserId !== ownerUserId || session.ownershipState !== 'CLAIMED') return null;
    return cloneSession(session);
  }

  async saveSessionState(input: SavePortfolioEntrySessionStateInput): Promise<PortfolioEntrySession> {
    if (!this.sessions.has(input.session.id)) throw PortfolioEntrySessionError.notFound();
    this.sessions.set(input.session.id, cloneSession(input.session));
    return cloneSession(input.session);
  }

  async appendTurn(turn: PortfolioEntryTurn, session: PortfolioEntrySession): Promise<PortfolioEntryTurn> {
    const existing = this.turns.get(turn.sessionId);
    if (!existing || !this.sessions.has(turn.sessionId)) throw PortfolioEntrySessionError.notFound();
    const expectedIndex = existing.length + 1;
    if (turn.turnIndex !== expectedIndex) {
      throw new Error(`Portfolio Entry turns must be appended in order. Expected ${expectedIndex}, got ${turn.turnIndex}.`);
    }
    const stored = cloneTurn(turn);
    existing.push(stored);
    this.sessions.set(session.id, cloneSession(session));
    return cloneTurn(stored);
  }

  async appendModelExecution(
    execution: PortfolioEntryModelExecutionRecord,
  ): Promise<PortfolioEntryModelExecutionRecord> {
    const existing = this.executions.get(execution.sessionId);
    if (!existing || !this.sessions.has(execution.sessionId)) throw PortfolioEntrySessionError.notFound();
    const stored = cloneExecution(execution);
    existing.push(stored);
    return cloneExecution(stored);
  }

  async saveHandoff(handoff: PortfolioEntryHandoffRecord, session: PortfolioEntrySession): Promise<PortfolioEntryHandoffRecord> {
    const existing = this.handoffs.get(handoff.sessionId);
    if (!existing || !this.sessions.has(handoff.sessionId)) throw PortfolioEntrySessionError.notFound();
    const latestVersion = existing.at(-1)?.version ?? 0;
    if (handoff.version !== latestVersion + 1) {
      throw new Error(`Portfolio Entry handoff versions must be sequential. Expected ${latestVersion + 1}, got ${handoff.version}.`);
    }
    const stored = cloneHandoff(handoff);
    existing.push(stored);
    this.sessions.set(session.id, cloneSession(session));
    return cloneHandoff(stored);
  }

  async saveConfirmation(
    confirmation: PortfolioEntryConfirmation,
    session: PortfolioEntrySession,
  ): Promise<PortfolioEntryConfirmation> {
    const existing = this.confirmations.get(confirmation.sessionId);
    if (!existing || !this.sessions.has(confirmation.sessionId)) throw PortfolioEntrySessionError.notFound();
    const latestVersion = existing.at(-1)?.version ?? 0;
    if (confirmation.version !== latestVersion + 1) {
      throw new Error(`Portfolio Entry confirmation versions must be sequential. Expected ${latestVersion + 1}, got ${confirmation.version}.`);
    }
    const stored = cloneConfirmation(confirmation);
    existing.push(stored);
    this.sessions.set(session.id, cloneSession(session));
    return cloneConfirmation(stored);
  }

  async claimOwnership(input: ClaimPortfolioEntrySessionOwnershipInput): Promise<PortfolioEntrySession> {
    const session = this.sessions.get(input.sessionId);
    if (!session) throw PortfolioEntrySessionError.notFound();
    if (!canClaimPortfolioEntrySession(session)) throw PortfolioEntrySessionError.invalidOwnershipClaim();
    const claimed: PortfolioEntrySession = {
      ...cloneSession(session),
      ownerUserId: input.ownerUserId,
      ownershipState: 'CLAIMED',
      updatedAt: input.now,
      lastActivityAt: input.now,
    };
    this.sessions.set(claimed.id, cloneSession(claimed));
    return cloneSession(claimed);
  }

  async touchActivity(sessionId: string, now: Date): Promise<PortfolioEntrySession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw PortfolioEntrySessionError.notFound();
    if (session.expiredAt || session.lifecycleStatus === 'EXPIRED') throw PortfolioEntrySessionError.expired();
    const touched = { ...cloneSession(session), updatedAt: now, lastActivityAt: now };
    this.sessions.set(sessionId, touched);
    return cloneSession(touched);
  }

  async markExpired(sessionId: string, now: Date): Promise<PortfolioEntrySession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw PortfolioEntrySessionError.notFound();
    const expired: PortfolioEntrySession = {
      ...cloneSession(session),
      lifecycleStatus: 'EXPIRED',
      expiredAt: session.expiredAt ?? now,
      updatedAt: now,
    };
    this.sessions.set(sessionId, expired);
    return cloneSession(expired);
  }

  async listTurns(sessionId: string): Promise<PortfolioEntryTurn[]> {
    return (this.turns.get(sessionId) ?? []).map(cloneTurn);
  }

  async listModelExecutions(sessionId: string): Promise<PortfolioEntryModelExecutionRecord[]> {
    return (this.executions.get(sessionId) ?? []).map(cloneExecution);
  }
}

function cloneNullableSession(session: PortfolioEntrySession | null): PortfolioEntrySession | null {
  return session ? cloneSession(session) : null;
}

function cloneSession(session: PortfolioEntrySession): PortfolioEntrySession {
  return {
    ...session,
    sourceMetadata: cloneJson(session.sourceMetadata),
    semanticState: cloneJson(session.semanticState),
    questionBudget: cloneJson(session.questionBudget),
    latestAnalysis: cloneJson(session.latestAnalysis),
    latestHandoff: session.latestHandoff ? cloneHandoff(session.latestHandoff) : null,
    confirmation: session.confirmation ? cloneConfirmation(session.confirmation) : null,
    versioning: { ...session.versioning },
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    lastActivityAt: new Date(session.lastActivityAt),
    expiresAt: new Date(session.expiresAt),
    expiredAt: session.expiredAt ? new Date(session.expiredAt) : null,
  };
}

function cloneTurn(turn: PortfolioEntryTurn): PortfolioEntryTurn {
  return {
    ...turn,
    emittedQuestions: cloneJson(turn.emittedQuestions),
    matchedQuestionIds: [...turn.matchedQuestionIds],
    respondedResolves: [...turn.respondedResolves],
    analysisSnapshot: cloneJson(turn.analysisSnapshot),
    semanticStateAfter: cloneJson(turn.semanticStateAfter),
    transition: cloneJson(turn.transition),
    provenanceDelta: cloneJson(turn.provenanceDelta),
    versioning: { ...turn.versioning },
    createdAt: new Date(turn.createdAt),
    updatedAt: new Date(turn.updatedAt),
  };
}

function cloneHandoff(handoff: PortfolioEntryHandoffRecord): PortfolioEntryHandoffRecord {
  return {
    ...handoff,
    handoff: cloneJson(handoff.handoff),
    versioning: { ...handoff.versioning },
    createdAt: new Date(handoff.createdAt),
    updatedAt: new Date(handoff.updatedAt),
  };
}

function cloneConfirmation(confirmation: PortfolioEntryConfirmation): PortfolioEntryConfirmation {
  return {
    ...confirmation,
    acceptedFields: [...confirmation.acceptedFields],
    correctedFields: cloneJson(confirmation.correctedFields),
    rejectedFields: [...confirmation.rejectedFields],
    confirmedAt: confirmation.confirmedAt ? new Date(confirmation.confirmedAt) : null,
    createdAt: new Date(confirmation.createdAt),
    updatedAt: new Date(confirmation.updatedAt),
  };
}

function cloneExecution(execution: PortfolioEntryModelExecutionRecord): PortfolioEntryModelExecutionRecord {
  return {
    ...execution,
    usage: cloneJson(execution.usage),
    schemaErrors: [...execution.schemaErrors],
    createdAt: new Date(execution.createdAt),
  };
}

function cloneJson<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}
