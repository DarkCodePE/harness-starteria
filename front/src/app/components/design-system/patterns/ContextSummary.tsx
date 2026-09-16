import * as React from 'react';

import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import type { PatternAction, PatternDensity } from './types';

export type ContextSummaryItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  metadata?: React.ReactNode;
  source?: React.ReactNode;
  action?: PatternAction;
};

export type ContextSummaryProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  items: ContextSummaryItem[];
  density?: PatternDensity;
  onAction?: (actionId: string) => void;
  className?: string;
};

export function ContextSummary({
  title,
  description,
  items,
  density = 'comfortable',
  onAction,
  className,
}: ContextSummaryProps) {
  return (
    <section className={cn('rounded-ds-md border border-border-default bg-surface-default', density === 'compact' ? 'p-4' : 'p-5', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-base font-semibold text-text-primary">{title}</h2>}
          {description && <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>}
        </div>
      )}
      <dl className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <div key={index} className="border-b border-border-default pb-3 last:border-b-0 md:last:border-b">
            <dt className="text-xs font-medium uppercase text-text-muted">{item.label}</dt>
            <dd className="mt-1 text-sm leading-6 text-text-primary">{item.value}</dd>
            {item.metadata && <div className="mt-1 text-xs text-text-muted">{item.metadata}</div>}
            {item.source && <div className="mt-1 text-xs text-text-secondary">{item.source}</div>}
            {item.action && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => onAction?.(item.action!.id)}
                aria-label={item.action.ariaLabel}
                disabled={item.action.disabled}
              >
                {item.action.label}
              </Button>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
