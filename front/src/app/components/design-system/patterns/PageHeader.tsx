import * as React from 'react';

import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction, PatternDensity } from './types';

export type PageHeaderMetaItem = {
  label: string;
  value: React.ReactNode;
};

export type PageHeaderProps = {
  breadcrumb?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: React.ReactNode;
  metadata?: PageHeaderMetaItem[];
  primaryAction?: PatternAction;
  secondaryActions?: PatternAction[];
  onAction?: (actionId: string) => void;
  density?: PatternDensity;
  className?: string;
};

export function PageHeader({
  breadcrumb,
  eyebrow,
  title,
  description,
  status,
  metadata,
  primaryAction,
  secondaryActions = [],
  onAction,
  density = 'comfortable',
  className,
}: PageHeaderProps) {
  const actions = [
    ...(primaryAction ? [{ ...primaryAction, tone: primaryAction.tone ?? 'primary' as const }] : []),
    ...secondaryActions,
  ];

  return (
    <header
      className={cn(
        'rounded-ds-lg border border-border-default bg-surface-default text-text-primary',
        density === 'compact' ? 'p-4' : 'p-6 md:p-8',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {breadcrumb && <div className="text-sm text-text-muted">{breadcrumb}</div>}
          {eyebrow && (
            <Badge variant="neutral" className="w-fit">
              {eyebrow}
            </Badge>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn('font-semibold leading-tight', density === 'compact' ? 'text-2xl' : 'text-3xl')}>
              {title}
            </h1>
            {status}
          </div>
          {description && <div className="max-w-3xl text-sm leading-6 text-text-secondary md:text-base">{description}</div>}
          {metadata && metadata.length > 0 && (
            <dl className="flex flex-wrap gap-2">
              {metadata.map((item) => (
                <div
                  key={item.label}
                  className="rounded-ds-sm border border-border-default bg-background-subtle px-3 py-2 text-sm"
                >
                  <dt className="text-xs font-medium text-text-muted">{item.label}</dt>
                  <dd className="mt-0.5 text-text-primary">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <ReviewActions
          actions={actions}
          onAction={onAction}
          className="lg:justify-end"
          aria-label="Page actions"
        />
      </div>
    </header>
  );
}
