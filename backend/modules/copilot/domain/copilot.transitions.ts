import type { ActionPlan } from './copilot.types';

export function isSupersededPlan(plan: Pick<ActionPlan, 'status' | 'supersededById'>): boolean {
  return plan.status === 'superseded' || Boolean(plan.supersededById);
}

export function assertPlanIsCurrent(plan: Pick<ActionPlan, 'id' | 'status' | 'supersededById'>): void {
  if (isSupersededPlan(plan)) {
    throw new Error(`ActionPlan ${plan.id} is superseded`);
  }
}
