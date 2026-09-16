/**
 * Router for the PUBLIC (no-auth) field-refinement bridge.
 * Mounted at `/api/v1/public/refine-field`. ADR-016 / SPEC-003.
 *
 * Guardrails: per-IP rate limiting (in-memory; same pattern as public-pdf) acts
 * as the cost cap for this LLM-backed public surface (bounds calls/IP/window) +
 * Zod validation in the controller. NO `authenticate`.
 */
import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../../config';
import { AppError } from '../../shared/errors/AppError';
import { RefineFieldService } from './refine-field.service';
import { RefineFieldController } from './refine-field.controller';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

function createIpRateLimiter(windowMs: number, maxRequests: number): RequestHandler {
  const store = new Map<string, RateLimitEntry>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, 60_000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }
    entry.count++;
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfter));
      next(AppError.rateLimited(retryAfter));
      return;
    }
    next();
  };
}

export interface RefineFieldRouterOptions {
  maxRequests?: number;
  windowMs?: number;
}

export function buildRefineFieldRouter(
  service: RefineFieldService,
  options: RefineFieldRouterOptions = {},
): Router {
  const controller = new RefineFieldController(service);
  const router = Router();
  // 30 refinements / 10 min / IP — cost cap proxy for this LLM-backed surface.
  const limiter = createIpRateLimiter(options.windowMs ?? 10 * 60_000, options.maxRequests ?? 30);
  router.post('/', limiter, controller.refine);
  return router;
}

export const refineFieldService = new RefineFieldService({
  baseUrl: config.aiServiceUrl,
  token: config.aiServiceToken,
});

export const refineFieldRouter = buildRefineFieldRouter(refineFieldService);
