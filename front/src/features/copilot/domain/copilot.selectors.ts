import type { ActionExecutionDto, ActionPlanDto, ProposedActionDto } from './copilot.types';

export function getPrimaryAction(plan: ActionPlanDto | null): ProposedActionDto | null {
  return plan?.proposedActions[0] ?? null;
}

export function isActionApproved(action: ProposedActionDto | null): boolean {
  return action?.status === 'approved';
}

export function isActionTerminal(action: ProposedActionDto | null): boolean {
  return !!action && ['completed', 'failed', 'rejected', 'blocked', 'cancelled'].includes(action.status);
}

export function isExecutionTerminal(execution: ActionExecutionDto | null): boolean {
  return !!execution && ['completed', 'failed', 'idempotent_replay', 'partially_completed', 'manual_review_required'].includes(execution.status);
}

export function getLatestExecution(executions: ActionExecutionDto[]): ActionExecutionDto | null {
  return executions
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}
