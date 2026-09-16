import React from 'react';
import type { ActionExecutionDto, ActionPlanDto, ProposedActionDto, ProposedActionPayload } from '../domain/copilot.types';
import { ProposedActionCard } from './ProposedActionCard';

function executionBlocksActionControls(execution: ActionExecutionDto | null, actionId: string): boolean {
  return (
    execution?.proposedActionId === actionId &&
    ['completed', 'idempotent_replay', 'partially_completed', 'manual_review_required'].includes(execution.status)
  );
}

export function ActionPlanCard({
  plan,
  disabled,
  onSaveAction,
  onApproveAction,
  onRejectAction,
  onExecuteAction,
  activeExecution,
}: {
  plan: ActionPlanDto | null;
  disabled: boolean;
  activeExecution: ActionExecutionDto | null;
  onSaveAction: (action: ProposedActionDto, payload: ProposedActionPayload) => Promise<void> | void;
  onApproveAction: (action: ProposedActionDto) => Promise<void> | void;
  onRejectAction: (action: ProposedActionDto, reason?: string) => Promise<void> | void;
  onExecuteAction: (action: ProposedActionDto) => Promise<void> | void;
}) {
  if (!plan) return null;
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5" aria-label="Action Plan">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>ACTION PLAN</p>
          <h3 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>{plan.summary}</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          v{plan.version} · {plan.status}
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {plan.proposedActions.map((action) => (
          <ProposedActionCard
            key={action.id}
            action={action}
            disabled={disabled || executionBlocksActionControls(activeExecution, action.id)}
            onSave={(payload) => onSaveAction(action, payload)}
            onApprove={() => onApproveAction(action)}
            onReject={(reason) => onRejectAction(action, reason)}
            onExecute={() => onExecuteAction(action)}
          />
        ))}
      </div>
    </section>
  );
}
