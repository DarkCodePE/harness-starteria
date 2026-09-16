import React, { useState } from 'react';
import { Check, Play, X } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import type { ProposedActionDto } from '../domain/copilot.types';
import { isActionApproved } from '../domain/copilot.selectors';

export function ApprovalControls({
  action,
  disabled,
  onApprove,
  onReject,
  onExecute,
}: {
  action: ProposedActionDto;
  disabled: boolean;
  onApprove: () => Promise<void> | void;
  onReject: (reason?: string) => Promise<void> | void;
  onExecute: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const approved = isActionApproved(action);
  const completed = action.status === 'completed';

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      {action.approvedAt && action.status !== 'approved' && (
        <p className="mb-3 text-xs text-amber-700">La aprobación previa fue invalidada por una edición. Revisa y aprueba nuevamente.</p>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Razón de rechazo (opcional)"
          disabled={disabled || completed}
          aria-label="Razón de rechazo"
          className="md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void onReject(reason.trim() || undefined)} disabled={disabled || completed}>
            <X className="size-4" />
            Rechazar
          </Button>
          <Button type="button" variant="outline" onClick={() => void onApprove()} disabled={disabled || approved || completed}>
            <Check className="size-4" />
            Aprobar
          </Button>
          <Button
            type="button"
            onClick={() => void onExecute()}
            disabled={disabled || !approved || completed}
            className="bg-slate-950 text-white hover:bg-slate-800"
          >
            <Play className="size-4" />
            Ejecutar
          </Button>
        </div>
      </div>
    </div>
  );
}

