/**
 * Pilot grandfathering script (TASK-015 seed half, ADR-020 §grandfather).
 *
 * Grants a MANUAL subscription on the `pilot` plan to every existing User who
 * does not already have any Subscription. The operation is idempotent: a second
 * run grants 0 subscriptions.
 *
 * Safe to import without side effects — no DB calls happen at module load time.
 * To run directly: tsx backend/modules/billing/grandfather.ts
 */
import { prisma } from '../../shared/db/prisma';

export interface GrandfatherOptions {
  /** Plan code to grant. Defaults to 'pilot'. */
  planCode?: string;
}

export interface GrandfatherResult {
  /** Number of users who received a new Subscription. */
  granted: number;
  /** Number of users skipped because they already had a Subscription. */
  skipped: number;
  /**
   * Informational count of users who own a Project with `pilotLeadId != null`.
   * These users are covered by the same loop (they get the pilot plan if they
   * have no subscription yet) — no special branch is needed. Exposed here for
   * observability / shadow-metering signal.
   */
  pilotRedeemers: number;
}

/**
 * Grants the pilot plan subscription to every user without an existing
 * subscription.
 *
 * Processing note: users are loaded with a single `findMany` for now. For very
 * large datasets this should be replaced with cursor-based pagination —
 * TODO: harden with `cursor` + `take` batches when user count exceeds ~10k.
 */
export async function grandfatherExistingUsers(
  opts: GrandfatherOptions = {},
): Promise<GrandfatherResult> {
  const planCode = opts.planCode ?? 'pilot';

  // Resolve the Plan row. Must exist — run seedPlans() first if missing.
  const plan = await prisma.plan.findFirst({ where: { code: planCode } });
  if (!plan) {
    throw new Error(
      `Plan with code "${planCode}" not found. ` +
        'Run seedPlans() (backend/modules/billing/seed-plans.ts) before grandfathering.',
    );
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1); // ~365 days (respects leap years)

  // Count pilot-code redeemers for observability. A pilot redeemer is a user
  // who owns at least one Project with pilotLeadId != null.
  // TODO: replace findMany with batched cursor pagination for large datasets.
  const pilotRedeemers = await prisma.project.count({
    where: { pilotLeadId: { not: null } },
  });

  const users = await prisma.user.findMany({ select: { id: true } });

  let granted = 0;
  let skipped = 0;

  for (const user of users) {
    // Idempotency check: skip if any subscription already exists for this user.
    const existing = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.subscription.create({
      data: {
        planId: plan.id,
        userId: user.id,
        status: 'ACTIVE',
        provider: 'MANUAL',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    granted++;
  }

  return { granted, skipped, pilotRedeemers };
}

// Run directly: tsx backend/modules/billing/grandfather.ts
export async function runGrandfatherExistingUsers(): Promise<void> {
  const result = await grandfatherExistingUsers();
  console.log(
    `grandfather: granted=${result.granted} skipped=${result.skipped} pilotRedeemers=${result.pilotRedeemers}`,
  );
}
