import type { PortfolioEntryConfirmation } from '../domain/portfolio-entry-confirmation.types';
import type {
  PortfolioEntryHandoffRecord,
  PortfolioEntrySession,
  PortfolioEntryTurn,
} from '../domain/portfolio-entry-session.types';
import type { PortfolioEntryModelExecutionRecord } from '../observability/portfolio-entry-execution-metadata';

export type CreatePortfolioEntrySessionInput = PortfolioEntrySession;

export type SavePortfolioEntrySessionStateInput = {
  session: PortfolioEntrySession;
  expectedUpdatedAt?: Date;
};

export type ClaimPortfolioEntrySessionOwnershipInput = {
  sessionId: string;
  ownerUserId: string;
  now: Date;
};

export interface PortfolioEntrySessionRepository {
  createSession(input: CreatePortfolioEntrySessionInput): Promise<PortfolioEntrySession>;
  findSessionById(sessionId: string): Promise<PortfolioEntrySession | null>;
  findSessionForPublicAccess(sessionId: string, publicAccessTokenHash: string): Promise<PortfolioEntrySession | null>;
  findSessionForOwner(sessionId: string, ownerUserId: string): Promise<PortfolioEntrySession | null>;
  saveSessionState(input: SavePortfolioEntrySessionStateInput): Promise<PortfolioEntrySession>;
  appendTurn(turn: PortfolioEntryTurn, session: PortfolioEntrySession): Promise<PortfolioEntryTurn>;
  appendModelExecution(execution: PortfolioEntryModelExecutionRecord): Promise<PortfolioEntryModelExecutionRecord>;
  saveHandoff(handoff: PortfolioEntryHandoffRecord, session: PortfolioEntrySession): Promise<PortfolioEntryHandoffRecord>;
  saveConfirmation(confirmation: PortfolioEntryConfirmation, session: PortfolioEntrySession): Promise<PortfolioEntryConfirmation>;
  claimOwnership(input: ClaimPortfolioEntrySessionOwnershipInput): Promise<PortfolioEntrySession>;
  touchActivity(sessionId: string, now: Date): Promise<PortfolioEntrySession>;
  markExpired(sessionId: string, now: Date): Promise<PortfolioEntrySession>;
  listTurns(sessionId: string): Promise<PortfolioEntryTurn[]>;
  listModelExecutions(sessionId: string): Promise<PortfolioEntryModelExecutionRecord[]>;
}
