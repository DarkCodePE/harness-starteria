/**
 * Plan catalog (PRD-005 §tiers, ADR-020). Source of truth for seeding the `Plan`
 * table and for the implicit "free" plan used when a user has no subscription.
 *
 * Limit semantics (see types.ts FEATURE_KIND):
 * - metered features (ai_refine, pdf_extract, mentor_credit, exec_export) = per
 *   month, reset implicitly via periodKey.
 * - resource features (project_create, seats) = max concurrent count.
 * - -1 = unlimited.
 *
 * NOTE: the credit allotments below are PRD-005 decision-ready HYPOTHESES, to be
 * calibrated against pilot telemetry before BILLING_ENFORCEMENT_ENABLED is
 * flipped on. They are intentionally generous in the interim.
 */
import type { PlanInterval } from '@prisma/client';
import type { Feature, PlanLimits } from './types';

export interface PlanSeed {
  code: string;
  name: string;
  interval: PlanInterval;
  priceCents: number; // in `currency` minor units (PEN céntimos)
  currency: string;
  limits: Required<Record<Feature, number>>;
}

export const PLAN_CATALOG: PlanSeed[] = [
  {
    code: 'free',
    name: 'Free (Explorer)',
    interval: 'MONTH',
    priceCents: 0,
    currency: 'PEN',
    limits: {
      project_create: 1,
      ai_refine: 40,
      pdf_extract: 1,
      mentor_credit: 0,
      seats: 1,
      exec_export: 0,
    },
  },
  {
    code: 'starter',
    name: 'Pro (Innovator)',
    interval: 'MONTH',
    priceCents: 3900, // S/ 39.00
    currency: 'PEN',
    limits: {
      project_create: 5,
      ai_refine: 400,
      pdf_extract: 10,
      mentor_credit: 3,
      seats: 1,
      exec_export: 10,
    },
  },
  {
    code: 'team',
    name: 'Team (Squad)',
    interval: 'MONTH',
    priceCents: 12900, // S/ 129.00
    currency: 'PEN',
    limits: {
      project_create: 15,
      ai_refine: 1500,
      pdf_extract: -1,
      mentor_credit: 15,
      seats: 5,
      exec_export: -1,
    },
  },
  {
    code: 'enterprise',
    name: 'Enterprise (Portfolio)',
    interval: 'YEAR',
    priceCents: 0, // negotiated / invoiced (RUC, SUNAT) — not self-serve
    currency: 'PEN',
    limits: {
      project_create: -1,
      ai_refine: -1,
      pdf_extract: -1,
      mentor_credit: -1,
      seats: -1,
      exec_export: -1,
    },
  },
  {
    // Grandfathering target for existing/pilot users (ADR-020 §grandfather,
    // TASK-019). Generous-but-finite so shadow metering still produces signal.
    code: 'pilot',
    name: 'Founding Pilot',
    interval: 'MONTH',
    priceCents: 0,
    currency: 'PEN',
    limits: {
      project_create: -1,
      ai_refine: -1,
      pdf_extract: -1,
      mentor_credit: -1,
      seats: -1,
      exec_export: -1,
    },
  },
];

/** The limits applied when a user has NO subscription at all (implicit Free). */
export const FREE_LIMITS: PlanLimits = PLAN_CATALOG.find((p) => p.code === 'free')!.limits;
export const FREE_PLAN_CODE = 'free';

export function planByCode(code: string): PlanSeed | undefined {
  return PLAN_CATALOG.find((p) => p.code === code);
}
