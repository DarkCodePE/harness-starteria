import * as React from 'react';

import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction } from './types';

export type EmptyStateProps = {
  icon?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  primaryAction?: PatternAction;
  secondaryAction?: PatternAction;
  onAction?: (actionId: string) => void;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  onAction,
  children,
  className,
}: EmptyStateProps) {
  const actions = [
    ...(primaryAction ? [{ ...primaryAction, tone: primaryAction.tone ?? 'primary' as const }] : []),
    ...(secondaryAction ? [{ ...secondaryAction, tone: secondaryAction.tone ?? 'secondary' as const }] : []),
  ];

  return (
    <section
      className={cn(
        'rounded-ds-lg border border-dashed border-border-default bg-background-subtle p-6 text-text-primary md:p-8',
        className,
      )}
      aria-labelledby="empty-state-title"
    >
      <div className="max-w-2xl">
        {icon && (
          <div className="mb-4 flex size-11 items-center justify-center rounded-ds-md border border-border-default bg-surface-default text-brand-primary">
            {icon}
          </div>
        )}
        {eyebrow && (
          <Badge variant="neutral" className="mb-3">
            {eyebrow}
          </Badge>
        )}
        <h2 id="empty-state-title" className="text-xl font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-text-secondary">{description}</div>
        {children && <div className="mt-4 text-sm text-text-secondary">{children}</div>}
        <ReviewActions actions={actions} onAction={onAction} className="mt-5" aria-label="Empty state actions" />
      </div>
    </section>
  );
}
