import { canTransitionPortfolioEntrySession } from '../domain/portfolio-entry-session.lifecycle';
import { isPortfolioEntrySessionExpired } from '../domain/portfolio-entry-session-expiry';
import type { PortfolioEntrySession } from '../domain/portfolio-entry-session.types';
import { PortfolioEntrySessionError } from './portfolio-entry-session-errors';

export function assertSessionIsActive(session: PortfolioEntrySession, now: Date): void {
  if (isPortfolioEntrySessionExpired(session, now)) {
    throw PortfolioEntrySessionError.expired();
  }
}

export function assertLifecycleTransition(
  session: PortfolioEntrySession,
  nextStatus: PortfolioEntrySession['lifecycleStatus'],
): void {
  if (!canTransitionPortfolioEntrySession(session.lifecycleStatus, nextStatus)) {
    throw PortfolioEntrySessionError.invalidTransition(
      `Invalid Portfolio Entry session lifecycle transition: ${session.lifecycleStatus} -> ${nextStatus}`,
    );
  }
}

export function isSessionConversionEligible(session: PortfolioEntrySession): boolean {
  return (
    session.lifecycleStatus === 'CONFIRMED' &&
    session.confirmation?.status === 'CONFIRMED' &&
    Boolean(session.latestHandoff) &&
    !session.expiredAt
  );
}
