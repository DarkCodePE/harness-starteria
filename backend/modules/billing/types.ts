/**
 * Billing & Entitlements — shared contracts (ADR-020/021/022, PRD-005/SPEC-005).
 *
 * These types are the STABLE base the rest of the billing module builds on:
 * - EntitlementService (entitlement.service.ts) — check/meter
 * - SubscriptionService (subscription.service.ts) — lifecycle + webhooks
 * - requireEntitlement middleware — API enforcement (behind a feature flag)
 *
 * Design rules baked in here:
 * - `check()` is read-only (CQRS); `meter()` writes idempotently.
 * - Plan resolution order: User subscription → Organization subscription → Free.
 * - Limits live in Plan.limits (JSON); -1 means unlimited.
 */

/** The set of monetizable actions gated by the entitlement layer. */
export type Feature =
  | 'project_create'
  | 'ai_refine'
  | 'pdf_extract'
  | 'mentor_credit'
  | 'seats'
  | 'exec_export';

export const FEATURES: readonly Feature[] = [
  'project_create',
  'ai_refine',
  'pdf_extract',
  'mentor_credit',
  'seats',
  'exec_export',
] as const;

/**
 * How a feature's usage is counted:
 * - 'metered': consumption accrues within a billing period and resets monthly
 *   (tracked in UsageCounter, metered via UsageEvent). e.g. ai_refine.
 * - 'resource': a point-in-time count of existing rows, NOT period-based — the
 *   limit caps how many can exist concurrently. e.g. project_create (active
 *   projects), seats (org/team members). For these, callers pass the CURRENT
 *   count to check(); meter() is a no-op.
 */
export type FeatureKind = 'metered' | 'resource';

export const FEATURE_KIND: Record<Feature, FeatureKind> = {
  ai_refine: 'metered',
  pdf_extract: 'metered',
  mentor_credit: 'metered',
  exec_export: 'metered',
  project_create: 'resource',
  seats: 'resource',
};

/** Plan.limits shape. -1 = unlimited. Missing key = treated as 0 (deny). */
export type PlanLimits = Partial<Record<Feature, number>>;

/** Result of EntitlementService.check — never mutates state. */
export interface EntitlementResult {
  allowed: boolean;
  /** -1 when unlimited. */
  limit: number;
  /** Remaining within the period/resource budget; Infinity when unlimited. */
  remaining: number;
  /** Resolved plan code (e.g. "free", "starter", "pilot"). */
  planCode: string;
  /**
   * When the feature flag BILLING_ENFORCEMENT_ENABLED is false, `allowed` is
   * forced true (shadow mode) but `wouldAllow` reflects the real verdict, so we
   * can measure how often enforcement WOULD have blocked before turning it on.
   */
  wouldAllow: boolean;
  /** Human-readable reason when blocked (or would-block). */
  reason?: string;
}

/** Args for metering a successful, billable action (idempotent). */
export interface MeterArgs {
  /** Idempotency key — "<feature>:<sourceId>". A repeat counts ONCE. */
  dedupeKey: string;
  qty?: number;
  /** Originating entity id (PdfExtractionRun.id, Project.id, requestId, …). */
  sourceId?: string;
}

/** Normalized webhook event emitted by a BillingPort.verifyWebhook (ADR-021). */
export interface WebhookEvent {
  /** Provider event id — persisted as a dedupeKey for at-least-once safety. */
  eventId: string;
  type:
    | 'subscription.activated'
    | 'subscription.renewed'
    | 'payment.failed'
    | 'subscription.canceled'
    | 'subscription.expired'
    | 'unknown';
  providerSubId?: string;
  providerCustomerId?: string;
  raw?: unknown;
}

/** The current month bucket used as UsageCounter.periodKey. */
export function periodKeyFor(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
