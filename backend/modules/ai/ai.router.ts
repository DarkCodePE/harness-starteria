/**
 * Authenticated AI bridge — PRD-005 / SPEC-005, issue #85 (`ai_refine` call site).
 *
 * Mounted at `/api/v1/ai`. UNLIKE the public `/api/v1/public/refine-field` surface
 * (anonymous, IP-rate-limited, ADR-016), this router runs behind `authenticate`,
 * so every refinement is attributable to a `userId` and can be metered by the
 * entitlement layer.
 *
 * `ai_refine` is a `metered` feature (FEATURE_KIND): in shadow mode
 * (`BILLING_ENFORCEMENT_ENABLED=false`, the launch default) `requireEntitlement`
 * records a `UsageEvent` on a successful (2xx) response but NEVER blocks — we
 * collect real distributions first. With the flag ON it enforces the plan's
 * monthly AI allowance (ADR-020/004).
 *
 * It reuses the same `RefineFieldService` bridge to the ai-service
 * (ADR-006/011/016) as the public path — only the auth + metering envelope
 * differs, so the LLM contract stays in one place.
 */
import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireEntitlement } from '../billing/entitlement.middleware';
import { RefineFieldController } from '../public-ai/refine-field.controller';
import { refineFieldService } from '../public-ai';

export function buildAiRouter(controller: RefineFieldController): Router {
  const router = Router();
  router.use(authenticate);
  // metered → shadow meters once on a 2xx (dedupeKey `ai_refine:<requestId>`).
  router.post('/refine-field', requireEntitlement('ai_refine'), controller.refine);
  return router;
}

export const aiRouter = buildAiRouter(new RefineFieldController(refineFieldService));
