import React from 'react';
import type { CopilotConversationStatus } from '../domain/copilot.types';
import { getConversationStatusLabel } from '../domain/copilot.ui-state';

export function CopilotStatusIndicator({ status }: { status: CopilotConversationStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
      {getConversationStatusLabel(status)}
    </span>
  );
}

