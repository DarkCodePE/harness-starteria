export class PortfolioEntrySessionError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PortfolioEntrySessionError';
  }

  static notFound(): PortfolioEntrySessionError {
    return new PortfolioEntrySessionError('PORTFOLIO_ENTRY_SESSION_NOT_FOUND', 'Portfolio Entry session not found.');
  }

  static unauthorized(): PortfolioEntrySessionError {
    return new PortfolioEntrySessionError('PORTFOLIO_ENTRY_SESSION_UNAUTHORIZED', 'Portfolio Entry session access denied.');
  }

  static expired(): PortfolioEntrySessionError {
    return new PortfolioEntrySessionError('PORTFOLIO_ENTRY_SESSION_EXPIRED', 'Portfolio Entry session expired.');
  }

  static invalidTransition(message: string): PortfolioEntrySessionError {
    return new PortfolioEntrySessionError('PORTFOLIO_ENTRY_SESSION_INVALID_TRANSITION', message);
  }

  static invalidOwnershipClaim(): PortfolioEntrySessionError {
    return new PortfolioEntrySessionError('PORTFOLIO_ENTRY_SESSION_INVALID_OWNERSHIP_CLAIM', 'Portfolio Entry session cannot be claimed.');
  }
}
