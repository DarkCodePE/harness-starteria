import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function createPortfolioEntryRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  scope: string;
}): RequestHandler {
  const store = new Map<string, RateLimitEntry>();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, Math.max(options.windowMs, 1_000));
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const sessionId = req.params.sessionId ? `session:${req.params.sessionId}` : 'no-session';
    const actor = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}`;
    const key = `${options.scope}:${actor}:${sessionId}`;
    const now = Date.now();
    const current = store.get(key);
    const entry = !current || now >= current.resetAt
      ? { count: 0, resetAt: now + options.windowMs }
      : current;

    entry.count += 1;
    store.set(key, entry);

    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.maxRequests - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > options.maxRequests) {
      res.setHeader('Retry-After', String(retryAfter));
      next(AppError.rateLimited(retryAfter));
      return;
    }

    next();
  };
}
