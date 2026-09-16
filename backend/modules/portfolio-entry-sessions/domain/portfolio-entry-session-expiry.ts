export type PortfolioEntrySessionTtlConfig = {
  ttlMs: number;
};

export function createPortfolioEntryExpiry(now: Date, config: PortfolioEntrySessionTtlConfig): Date {
  if (!Number.isFinite(config.ttlMs) || config.ttlMs <= 0) {
    throw new Error('Portfolio Entry session ttlMs must be a positive finite number.');
  }
  return new Date(now.getTime() + config.ttlMs);
}

export function isPortfolioEntrySessionExpired(input: {
  expiresAt: Date;
  expiredAt?: Date | null;
}, now: Date): boolean {
  return Boolean(input.expiredAt) || input.expiresAt.getTime() <= now.getTime();
}
