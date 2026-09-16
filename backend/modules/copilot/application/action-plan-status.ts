import type { ActionPlanStatus, ProposedAction } from '../domain/copilot.types';

const TERMINAL_REJECTION_STATUSES = new Set<ProposedAction['status']>([
  'rejected',
  'blocked',
  'cancelled',
]);

export function deriveActionPlanStatus(actions: ProposedAction[]): ActionPlanStatus {
  if (actions.length === 0) return 'draft';

  if (actions.every((action) => action.status === 'completed')) {
    return 'completed';
  }

  if (actions.some((action) => action.status === 'executing')) {
    return 'executing';
  }

  const completedCount = actions.filter((action) => action.status === 'completed').length;
  const failedCount = actions.filter((action) => action.status === 'failed').length;
  const rejectedOrBlockedCount = actions.filter((action) => TERMINAL_REJECTION_STATUSES.has(action.status)).length;

  if (completedCount > 0 && completedCount < actions.length) {
    return 'partially_completed';
  }

  if (failedCount > 0 && failedCount + rejectedOrBlockedCount === actions.length) {
    return 'failed';
  }

  if (rejectedOrBlockedCount === actions.length) {
    return 'failed';
  }

  const executableActions = actions.filter((action) => !TERMINAL_REJECTION_STATUSES.has(action.status));
  const approvedOrCompleted = executableActions.filter((action) =>
    action.status === 'approved' || action.status === 'completed',
  );

  if (executableActions.length > 0 && approvedOrCompleted.length === executableActions.length) {
    return 'approved';
  }

  if (approvedOrCompleted.length > 0) {
    return 'partially_approved';
  }

  return 'awaiting_confirmation';
}

