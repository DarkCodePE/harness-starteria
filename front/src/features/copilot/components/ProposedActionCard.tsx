import React from 'react';
import type { ProposedActionDto, ProposedActionPayload } from '../domain/copilot.types';
import { isCreateStrategicFrontAction } from '../mappers/copilot-dto-mappers';
import { StrategicFrontActionEditor } from './StrategicFrontActionEditor';
import { ApprovalControls } from './ApprovalControls';

export function ProposedActionCard({
  action,
  disabled,
  onSave,
  onApprove,
  onReject,
  onExecute,
}: {
  action: ProposedActionDto;
  disabled: boolean;
  onSave: (payload: ProposedActionPayload) => Promise<void> | void;
  onApprove: () => Promise<void> | void;
  onReject: (reason?: string) => Promise<void> | void;
  onExecute: () => Promise<void> | void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>ACCIÓN PROPUESTA</p>
          <h4 className="mt-1 text-lg text-slate-950" style={{ fontWeight: 700 }}>{action.title}</h4>
          <p className="mt-1 text-sm text-slate-600">{action.explanation}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          v{action.version} · {action.status}
        </span>
      </div>
      {isCreateStrategicFrontAction(action) && (
        <StrategicFrontActionEditor
          action={action}
          disabled={disabled || action.status === 'completed'}
          onSave={onSave}
        />
      )}
      <ApprovalControls
        action={action}
        disabled={disabled}
        onApprove={onApprove}
        onReject={onReject}
        onExecute={onExecute}
      />
    </article>
  );
}

