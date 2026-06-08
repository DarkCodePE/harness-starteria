/**
 * EntitlementService — the read/write surface of the billing entitlement layer
 * (PRD-005 / SPEC-005, ADR-020/021/022, TASK-016).
 *
 * Two responsibilities, cleanly split along CQRS lines:
 *  - check()  — READ-ONLY. Resolves the active plan, computes the current usage
 *               vs. limit, and returns an EntitlementResult. Never mutates state.
 *  - meter()  — IDEMPOTENT WRITE. Records a billable consumption against the
 *               usage ledger (UsageEvent) and increments the period counter
 *               (UsageCounter) atomically. A repeat dedupeKey is a no-op.
 *
 * Plan resolution precedence (resolveActiveSubscription):
 *   1. The USER's own ACTIVE/TRIALING subscription (wins).
 *   2. The USER's organization's ACTIVE/TRIALING subscription (B2B seats).
 *   3. null → implicit FREE plan limits.
 *
 * Shadow mode: when config.billingEnforcementEnabled is false, check() forces
 * `allowed = true` while still reporting the real verdict in `wouldAllow`, so we
 * can measure block-rate before flipping the paywall on.
 *
 * Performance: check() does at most two indexed point reads (Subscription by
 * userId/organizationId, UsageCounter by [subscriptionId, feature, periodKey]).
 * No loops over large sets — well under the <50ms target.
 */
import { prisma } from '../../shared/db/prisma';
import { config } from '../../config';
import type {
  Feature,
  EntitlementResult,
  MeterArgs,
  PlanLimits,
} from './types';
import { FEATURE_KIND, periodKeyFor } from './types';
import { FREE_LIMITS, FREE_PLAN_CODE } from './plans';

const ACTIVE_STATUSES = ['ACTIVE', 'TRIALING'] as const;

/**
 * A Subscription row with its Plan included. We keep the shape loose
 * (`plan.code` / `plan.limits`) so the service stays decoupled from the exact
 * generated Prisma type while remaining type-safe at the call sites we use.
 */
export interface ActiveSubscription {
  id: string;
  plan: {
    code: string;
    limits: unknown;
  };
}

/**
 * Resolve the subscription that governs a user's entitlements.
 *
 * Precedence: the user's OWN active subscription wins over their organization's.
 * Only ACTIVE and TRIALING statuses count as "active" (PAST_DUE/CANCELED/EXPIRED
 * fall through to the next tier, ultimately the implicit Free plan).
 */
export async function resolveActiveSubscription(
  userId: string,
): Promise<ActiveSubscription | null> {
  // 1. User-owned subscription (highest precedence).
  const userSub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES as unknown as string[] } },
    include: { plan: true },
  });
  if (userSub) return userSub as unknown as ActiveSubscription;

  // 2. Fall back to the user's organization subscription (B2B seats).
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
  });
  if (membership) {
    const orgSub = await prisma.subscription.findFirst({
      where: {
        organizationId: membership.organizationId,
        status: { in: ACTIVE_STATUSES as unknown as string[] },
      },
      include: { plan: true },
    });
    if (orgSub) return orgSub as unknown as ActiveSubscription;
  }

  // 3. No active subscription → implicit Free.
  return null;
}

/**
 * Resolve the effective limit map for a subscription. A null subscription (no
 * active plan) yields the implicit Free limits. Missing feature keys are treated
 * as 0 (deny) by the consumers of this map.
 */
export function getLimits(sub: ActiveSubscription | null): PlanLimits {
  if (!sub) return FREE_LIMITS;
  const limits = sub.plan?.limits as PlanLimits | null | undefined;
  return limits ?? FREE_LIMITS;
}

/**
 * READ-ONLY entitlement check. Computes whether `qty` of `feature` would be
 * permitted under the resolved plan, without mutating any state.
 *
 * @param currentCount  For 'resource' features only: the caller's current count
 *                      of existing active rows (e.g. number of active projects).
 *                      Ignored for 'metered' features (those read UsageCounter).
 */
export async function check(
  userId: string,
  feature: Feature,
  qty = 1,
  currentCount?: number,
): Promise<EntitlementResult> {
  const sub = await resolveActiveSubscription(userId);
  const limits = getLimits(sub);
  const planCode = sub?.plan?.code ?? FREE_PLAN_CODE;
  const limit = limits[feature] ?? 0;

  // Unlimited: short-circuit. No usage read needed.
  if (limit === -1) {
    return {
      allowed: true,
      limit: -1,
      remaining: Infinity,
      planCode,
      wouldAllow: true,
    };
  }

  let used: number;
  if (FEATURE_KIND[feature] === 'metered') {
    // Period-scoped consumption: read the counter for the current month.
    if (sub) {
      const counter = await prisma.usageCounter.findFirst({
        where: {
          subscriptionId: sub.id,
          feature,
          periodKey: periodKeyFor(new Date()),
        },
      });
      used = counter?.used ?? 0;
    } else {
      // No subscription → no counter rows can exist for it.
      used = 0;
    }
  } else {
    // 'resource': point-in-time count supplied by the caller.
    used = currentCount ?? 0;
  }

  const remaining = Math.max(0, limit - used);
  const wouldAllow = used + qty <= limit;
  // Shadow mode: enforcement off → always allow, but keep the real verdict.
  const allowed = config.billingEnforcementEnabled ? wouldAllow : true;

  const result: EntitlementResult = {
    allowed,
    limit,
    remaining,
    planCode,
    wouldAllow,
  };
  if (!wouldAllow) {
    result.reason =
      limit === 0
        ? `El plan "${planCode}" no incluye esta función (${feature}).`
        : `Has alcanzado el límite de ${limit} para ${feature} en este periodo.`;
  }
  return result;
}

/**
 * IDEMPOTENT WRITE. Records a billable consumption of a metered feature.
 *
 * - Resource features are NOT metered (their "usage" is the live row count), so
 *   they are a no-op here and return { counted: false }.
 * - The UsageEvent ledger is written FIRST and is the idempotency boundary: its
 *   dedupeKey is @unique, so a re-delivery / double-submit hits a P2002 and we
 *   short-circuit to { counted: false } WITHOUT touching the counter.
 * - The UsageCounter increment is done with an atomic `{ increment }` update
 *   (never read-modify-write in JS, to avoid lost updates under concurrency).
 * - Free users (no active subscription) have no subscriptionId, so we still
 *   write a ledger event (subscriptionId: null) for shadow-metering signal but
 *   skip the counter increment (UsageCounter requires a subscriptionId).
 */
export async function meter(
  userId: string,
  feature: Feature,
  args: MeterArgs,
): Promise<{ counted: boolean }> {
  // Only metered features accrue. Resource features are a no-op.
  if (FEATURE_KIND[feature] !== 'metered') {
    return { counted: false };
  }

  const qty = args.qty ?? 1;
  const sub = await resolveActiveSubscription(userId);
  const subscriptionId = sub?.id ?? null;

  // Step 1: ledger write = idempotency boundary.
  try {
    await prisma.usageEvent.create({
      data: {
        subscriptionId,
        feature,
        qty,
        dedupeKey: args.dedupeKey,
        sourceId: args.sourceId,
      },
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      // Re-delivery / double-submit: counts ONCE. No-op.
      return { counted: false };
    }
    throw err;
  }

  // Step 2: increment the period counter (only when we have a subscription).
  // Free users have no counter row to attach to; the ledger event above is the
  // only durable signal for them in shadow mode.
  if (subscriptionId) {
    const periodKey = periodKeyFor(new Date());
    const existing = await prisma.usageCounter.findFirst({
      where: { subscriptionId, feature, periodKey },
    });
    if (existing) {
      // Atomic increment — never read-modify-write the number in JS.
      await prisma.usageCounter.update({
        where: { id: existing.id },
        data: { used: { increment: qty } },
      });
    } else {
      await prisma.usageCounter.create({
        data: { subscriptionId, feature, periodKey, used: qty },
      });
    }
  }

  return { counted: true };
}

/** Prisma "unique constraint failed" → code P2002. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

/** Singleton facade — import this where DI is not wired up. */
export const entitlementService = {
  resolveActiveSubscription,
  getLimits,
  check,
  meter,
};

export default entitlementService;
