import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PUBLIC_START_COPY } from '../domain/copy';

export function PublicConfidentialityNotice() {
  return (
    <div className="mx-auto flex max-w-[980px] items-center gap-2 rounded-ds-lg border border-[var(--status-feedback-warning-border)] bg-[var(--status-feedback-warning-surface)] px-3.5 py-2 text-xs text-[var(--status-feedback-warning-text)]">
      <ShieldCheck size={14} className="shrink-0" />
      <p className="leading-5">{PUBLIC_START_COPY.confidentialityNotice}</p>
    </div>
  );
}
