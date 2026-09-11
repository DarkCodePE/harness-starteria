export const PORTFOLIO_ENTRY_OWNERSHIP_STATES = [
  'ANONYMOUS',
  'CLAIMED',
  'LOCKED',
  'ABANDONED',
] as const;

export type PortfolioEntryOwnershipState = (typeof PORTFOLIO_ENTRY_OWNERSHIP_STATES)[number];

export function canClaimPortfolioEntrySession(input: {
  ownershipState: PortfolioEntryOwnershipState;
  ownerUserId?: string | null;
}): boolean {
  return input.ownershipState === 'ANONYMOUS' && !input.ownerUserId;
}
