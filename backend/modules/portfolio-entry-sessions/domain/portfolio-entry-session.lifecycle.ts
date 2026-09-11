export const PORTFOLIO_ENTRY_SESSION_LIFECYCLE_STATUSES = [
  'ENTRY_CAPTURED',
  'ANALYZING',
  'CLARIFYING',
  'HANDOFF_ELIGIBLE',
  'HANDOFF_GENERATING',
  'HANDOFF_READY',
  'AWAITING_CONFIRMATION',
  'REVISIONS_REQUESTED',
  'CONFIRMED',
  'CONVERSION_ELIGIBLE',
  'EXPIRED',
  'ABANDONED',
] as const;

export type PortfolioEntrySessionLifecycleStatus = (typeof PORTFOLIO_ENTRY_SESSION_LIFECYCLE_STATUSES)[number];

export const PORTFOLIO_ENTRY_EXECUTION_STATUSES = [
  'NOT_STARTED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED_RETRYABLE',
  'FAILED_FINAL',
  'SCHEMA_ERROR',
  'TECHNICAL_ERROR',
] as const;

export type PortfolioEntryExecutionStatus = (typeof PORTFOLIO_ENTRY_EXECUTION_STATUSES)[number];

const allowedTransitions: Record<PortfolioEntrySessionLifecycleStatus, readonly PortfolioEntrySessionLifecycleStatus[]> = {
  ENTRY_CAPTURED: ['ANALYZING', 'ABANDONED', 'EXPIRED'],
  ANALYZING: ['CLARIFYING', 'HANDOFF_ELIGIBLE', 'ABANDONED', 'EXPIRED'],
  CLARIFYING: ['ANALYZING', 'HANDOFF_ELIGIBLE', 'ABANDONED', 'EXPIRED'],
  HANDOFF_ELIGIBLE: ['HANDOFF_GENERATING', 'CLARIFYING', 'ABANDONED', 'EXPIRED'],
  HANDOFF_GENERATING: ['HANDOFF_READY', 'HANDOFF_ELIGIBLE', 'ABANDONED', 'EXPIRED'],
  HANDOFF_READY: ['AWAITING_CONFIRMATION', 'REVISIONS_REQUESTED', 'ABANDONED', 'EXPIRED'],
  AWAITING_CONFIRMATION: ['REVISIONS_REQUESTED', 'CONFIRMED', 'ABANDONED', 'EXPIRED'],
  REVISIONS_REQUESTED: ['ANALYZING', 'CLARIFYING', 'HANDOFF_GENERATING', 'ABANDONED', 'EXPIRED'],
  CONFIRMED: ['CONVERSION_ELIGIBLE', 'REVISIONS_REQUESTED', 'ABANDONED', 'EXPIRED'],
  CONVERSION_ELIGIBLE: ['REVISIONS_REQUESTED', 'ABANDONED', 'EXPIRED'],
  EXPIRED: [],
  ABANDONED: [],
};

export function canTransitionPortfolioEntrySession(
  from: PortfolioEntrySessionLifecycleStatus,
  to: PortfolioEntrySessionLifecycleStatus,
): boolean {
  if (from === to) return true;
  return allowedTransitions[from].includes(to);
}

export function assertPortfolioEntrySessionTransition(
  from: PortfolioEntrySessionLifecycleStatus,
  to: PortfolioEntrySessionLifecycleStatus,
): void {
  if (!canTransitionPortfolioEntrySession(from, to)) {
    throw new Error(`Invalid Portfolio Entry session lifecycle transition: ${from} -> ${to}`);
  }
}
