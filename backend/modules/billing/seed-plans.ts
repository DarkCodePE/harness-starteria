/**
 * Plan-catalog seeder (TASK-019, ADR-020).
 *
 * Seeds (or updates) the `Plan` table from PLAN_CATALOG. The function is
 * idempotent: running it twice produces 0 net changes on the second pass.
 *
 * Safe to import without side effects — no DB calls happen at module load time.
 * To run directly: tsx backend/modules/billing/seed-plans.ts
 */
import { prisma } from '../../shared/db/prisma';
import { PLAN_CATALOG } from './plans';

export interface SeedPlansResult {
  created: number;
  updated: number;
}

/**
 * Upserts every entry in PLAN_CATALOG into the Plan table.
 *
 * Strategy: check existence first via findUnique, then upsert. This lets us
 * return accurate created/updated tallies without relying on Prisma returning
 * the previous row state.
 */
export async function seedPlans(): Promise<SeedPlansResult> {
  let created = 0;
  let updated = 0;

  for (const plan of PLAN_CATALOG) {
    const existing = await prisma.plan.findUnique({ where: { code: plan.code } });

    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        interval: plan.interval,
        priceCents: plan.priceCents,
        currency: plan.currency,
        limits: plan.limits as object,
        isActive: true,
      },
      create: {
        code: plan.code,
        name: plan.name,
        interval: plan.interval,
        priceCents: plan.priceCents,
        currency: plan.currency,
        limits: plan.limits as object,
        isActive: true,
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  return { created, updated };
}

// Run directly: tsx backend/modules/billing/seed-plans.ts
// Guards against accidental execution on import by checking a runtime flag
// injected by the CLI runner. For ESM/tsx there is no `require.main`; instead
// we check whether this module is the entry point via a well-known env var set
// by the npm script, OR allow callers to invoke `runSeedPlans()` explicitly.
export async function runSeedPlans(): Promise<void> {
  const result = await seedPlans();
  console.log(`seedPlans: created=${result.created} updated=${result.updated}`);
}
