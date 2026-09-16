import * as React from 'react';
import { Sparkles } from 'lucide-react';

import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction, Rationale } from './types';

export type InlineInsightProps = {
  title?: string;
  children: React.ReactNode;
  rationale?: Rationale;
  actions?: PatternAction[];
  onAction?: (actionId: string) => void;
  className?: string;
};

export function InlineInsight({
  title = 'Starteria insight',
  children,
  rationale,
  actions,
  onAction,
  className,
}: InlineInsightProps) {
  return (
    <aside
      className={cn(
        'rounded-ds-md border border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)] p-4 text-[var(--ai-suggested-text)]',
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--ai-suggested-icon)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <div className="mt-1 text-sm leading-6 text-text-primary">{children}</div>
          {rationale && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer font-medium text-[var(--ai-suggested-text)] focus-ring rounded-ds-sm">
                Why Starteria suggests this
              </summary>
              <div className="mt-2 text-text-secondary">{renderRationale(rationale)}</div>
            </details>
          )}
          <ReviewActions actions={actions} onAction={onAction} className="mt-3" aria-label={`${title} actions`} />
        </div>
      </div>
    </aside>
  );
}

function renderRationale(rationale: Rationale) {
  if (!Array.isArray(rationale)) return rationale;

  return (
    <ul className="list-disc space-y-1 pl-5">
      {rationale.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
