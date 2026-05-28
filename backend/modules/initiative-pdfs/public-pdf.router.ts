/**
 * Router for the PUBLIC (no-auth) PDF extraction surface (issue #23).
 *
 * Mounted at `/api/v1/public/pdf-extract` from `backend/app.ts`. UNLIKE
 * `pdfRouter`, this router has NO `authenticate` middleware — anonymous landing
 * visitors use it. Every request therefore passes through hardened guardrails:
 *   - per-IP rate limiting (in-memory; V1 — documented in the return report)
 *   - a 10 MB hard cap + PDF mime/extension check (`publicMultipart`)
 *   - Zod validation of the opaque draftId / anonymousSessionId fields
 *
 * Routes:
 *   POST /                      → upload + start extraction → { runId, draftId }
 *   GET  /runs/:runId           → { status, errorMessage? }
 *   GET  /runs/:runId/proposals → AutofillProposalDto[]
 */

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../../config';
import { AppError } from '../../shared/errors/AppError';
import { LocalDiskPdfStorage } from './storage.service';
import { AiServiceClient } from './ai-client';
import { PublicPdfService } from './public-pdf.service';
import { PublicPdfController } from './public-pdf.controller';
import { publicMultipart } from './public-multipart';
import { MAX_PUBLIC_PDF_BYTES } from './public-pdf.schemas';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Minimal in-memory rate limiter keyed by IP (dep-free; no express-rate-limit
 * in the tree). V1: 20 uploads / 10 min per IP. The GET poll routes are NOT
 * limited here (the frontend polls frequently); only the expensive POST is.
 */
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

export interface PublicPdfRouterOptions {
  /** Override the per-IP upload cap (tests use a high value). */
  maxRequests?: number;
  /** Override the rate-limit window. */
  windowMs?: number;
}

/**
 * Build the public router around an already-constructed service. Exported so
 * tests can inject a service backed by mocked storage + ai-client.
 */
export function buildPublicPdfRouter(
  service: PublicPdfService,
  options: PublicPdfRouterOptions = {},
): Router {
  const controller = new PublicPdfController(service);
  const router = Router();

  const limiter = createIpRateLimiter(
    options.windowMs ?? 10 * 60_000,
    options.maxRequests ?? 20,
  );

  // Upload + start extraction. Rate-limit → multipart parse/guardrails → controller.
  router.post('/', limiter, publicMultipart({ maxBytes: MAX_PUBLIC_PDF_BYTES }), controller.extract);

  // Poll run state.
  router.get('/runs/:runId', controller.getRun);

  // List proposals for a completed run.
  router.get('/runs/:runId/proposals', controller.listProposals);

  return router;
}

/**
 * Production composition root — wires the same storage + ai-client as the
 * authenticated path (`pdf.router.ts`) so behaviour stays identical.
 */
function buildDefaultService(): PublicPdfService {
  const storage = new LocalDiskPdfStorage(config.localStorageDir);
  const aiClient = new AiServiceClient({
    baseUrl: config.aiServiceUrl,
    token: config.aiServiceToken,
  });
  return new PublicPdfService(storage, aiClient);
}

export const publicPdfRouter = buildPublicPdfRouter(buildDefaultService());
