/**
 * requireEntitlement — API-level paywall/limit middleware (TASK-017, ADR-020/004).
 *
 * Composes AFTER `authenticate` (and any `requireRole`). It:
 *  1. resolves the user's plan from the DB at the call site (NOT the JWT — ADR-004,
 *     so a downgrade/cancel takes effect immediately), via EntitlementService.check.
 *  2. attaches `req.entitlement` for downstream use.
 *  3. behind the feature flag `BILLING_ENFORCEMENT_ENABLED`:
 *       - flag OFF (shadow mode, the launch default): NEVER blocks. It logs when it
 *         WOULD have blocked and still meters usage, so we collect real
 *         distributions before turning the paywall on.
 *       - flag ON: blocks with 403 ENTITLEMENT_EXCEEDED when over budget.
 *  4. for `metered` features, meters ONCE on a successful (2xx) response via a
 *     `res.finish` hook, using `<feature>:<requestId>` as the idempotency key
 *     (a re-tried request with the same id counts once — ADR-020). `resource`
 *     features (project_create, seats) are gated by a live count and never metered.
 *
 * Public/unauthenticated routes (no `req.user`) are skipped — usage there can't be
 * attributed to a subscription. Metering on the anonymous public AI path is a
 * separate concern (see WIRING MAP below).
 *
 * ─── WIRING MAP (the 6 monetizable call sites, SPEC-005 §componentes) ──────────
 *   project_create  → projects/project.router.ts  POST /            [LIVE, resource]
 *   seats           → users/user.router.ts         POST /:projectId/team/invite [LIVE, resource]
 *   pdf_extract     → initiative-pdfs/pdf.router.ts POST /:id/pdfs/:pdfId/extract [LIVE, metered]
 *   exec_export     → portfolio/portfolio.router.ts POST …/executive-outputs     [LIVE, metered]
 *   ai_refine       → authenticated AI invoke path  [PENDING: no authenticated /ai
 *                     route is mounted yet; the public /refine-field path is
 *                     unauthenticated so it can't be attributed to a user. Wire when
 *                     the authenticated AI bridge lands.]
 *   mentor_credit   → participante mentor-booking route [PENDING: only mentor-side
 *                     /mentor/reviews exists today; wire on the booking endpoint
 *                     when it lands, alongside the Project.mentorCredits decrement.]
 */
import type { Request, Response, NextFunction } from 'express';
import { entitlementService } from './entitlement.service';
import { FEATURE_KIND, type Feature } from './types';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

interface RequireEntitlementOptions {
  /** How many units this request consumes (default 1). */
  qty?: number;
  /**
   * For `resource` features (project_create, seats): a function returning the
   * CURRENT count of existing rows, so check() can compare against the limit.
   */
  resourceCount?: (req: Request) => Promise<number> | number;
  /** Override the idempotency key for metering (default `<feature>:<requestId>`). */
  dedupeKey?: (req: Request) => string;
}

export function requireEntitlement(
  feature: Feature,
  options: RequireEntitlementOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        // Unauthenticated/public route — cannot attribute to a subscription.
        next();
        return;
      }

      const qty = options.qty ?? 1;
      const currentCount = options.resourceCount
        ? await options.resourceCount(req)
        : undefined;

      const result = await entitlementService.check(userId, feature, qty, currentCount);
      req.entitlement = result;

      if (!result.allowed) {
        // Enforcement ON and over budget.
        next(
          AppError.forbidden(
            result.reason || 'Has alcanzado el límite de tu plan.',
            'ENTITLEMENT_EXCEEDED',
          ),
        );
        return;
      }

      if (!result.wouldAllow) {
        // Shadow mode: we let it through but record that the paywall WOULD trigger.
        logger.warn(
          { userId, feature, planCode: result.planCode, limit: result.limit },
          '[entitlement] shadow: would block (enforcement off)',
        );
      }

      if (FEATURE_KIND[feature] === 'metered') {
        const dedupeKey = options.dedupeKey
          ? options.dedupeKey(req)
          : `${feature}:${req.requestId ?? 'no-req-id'}`;
        res.once('finish', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            entitlementService
              .meter(userId, feature, { dedupeKey, sourceId: req.requestId })
              .catch((err) =>
                logger.error({ err, feature, userId }, '[entitlement] meter failed'),
              );
          }
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      entitlement?: import('./types').EntitlementResult;
    }
  }
}
