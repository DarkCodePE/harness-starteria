/**
 * Router for the PUBLIC (no-auth) pilot-lead capture surface.
 *
 * Mounted at `/api/v1/public/pilot-leads` from `backend/app.ts`. NO
 * `authenticate` middleware — anonymous landing visitors submit interest in the
 * pilot. Guardrails: per-IP rate limiting (in-memory; same pattern as the
 * public PDF router) + Zod validation in the controller.
 *
 * Route: POST / → persist lead → 201 { id, pilotCode, status, createdAt }
 */
import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { prisma } from '../../shared/db/prisma';
import { logger } from '../../shared/utils/logger';
import { AppError } from '../../shared/errors/AppError';
import {
  PilotLeadService,
  type PilotLeadStore,
  type PilotLeadNotifier,
} from './pilot-lead.service';
import { PilotLeadController } from './pilot-lead.controller';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** Minimal in-memory per-IP rate limiter (dep-free), mirrors public-pdf. */
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

export interface PilotLeadRouterOptions {
  /** Override the per-IP submit cap (tests use a high value). */
  maxRequests?: number;
  /** Override the rate-limit window. */
  windowMs?: number;
}

/** Build the router around an injected service (tests inject a mocked store). */
export function buildPilotLeadRouter(
  service: PilotLeadService,
  options: PilotLeadRouterOptions = {},
): Router {
  const controller = new PilotLeadController(service);
  const router = Router();
  const limiter = createIpRateLimiter(options.windowMs ?? 10 * 60_000, options.maxRequests ?? 15);
  router.post('/', limiter, controller.create);
  return router;
}

/**
 * Default notifier — logs ids/metadata only (no PII). Channel/email destination
 * is an open product decision (issue #54); wire it here when decided.
 */
const defaultNotifier: PilotLeadNotifier = lead => {
  logger.info(
    { pilotLeadId: lead.id, pilotCode: lead.pilotCode, draftId: lead.draftId, organization: lead.organization ?? undefined },
    'New pilot lead captured',
  );
};

export const pilotLeadService = new PilotLeadService(
  prisma as unknown as PilotLeadStore,
  defaultNotifier,
);

export const pilotLeadRouter = buildPilotLeadRouter(pilotLeadService);
