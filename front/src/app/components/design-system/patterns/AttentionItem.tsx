import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction } from './types';

export type AttentionSeverity = 'info' | 'warning' | 'danger' | 'success';

export type AttentionItemProps = {
  severity: AttentionSeverity;
  title: React.ReactNode;
  description: React.ReactNode;
  context?: React.ReactNode;
  reason?: React.ReactNode;
  metadata?: Array<{ label: string; value: React.ReactNode }>;
  primaryAction?: PatternAction;
  secondaryAction?: PatternAction;
  onAction?: (actionId: string) => void;
  className?: string;
};

const severityConfig = {
  info: {
    label: 'Info',
    icon: Info,
    className: 'border-[var(--status-feedback-info-border)] bg-[var(--status-feedback-info-surface)] text-[var(--status-feedback-info-text)]',
    badge: 'info' as const,
  },
  warning: {
    label: 'Warning',
    icon: AlertCircle,
    className: 'border-[var(--status-feedback-warning-border)] bg-[var(--status-feedback-warning-surface)] text-[var(--status-feedback-warning-text)]',
    badge: 'warning' as const,
  },
  danger: {
    label: 'Blocked',
    icon: XCircle,
    className: 'border-[var(--status-feedback-danger-border)] bg-[var(--status-feedback-danger-surface)] text-[var(--status-feedback-danger-text)]',
    badge: 'danger' as const,
  },
  success: {
    label: 'Resolved',
    icon: CheckCircle2,
    className: 'border-[var(--status-feedback-success-border)] bg-[var(--status-feedback-success-surface)] text-[var(--status-feedback-success-text)]',
    badge: 'success' as const,
  },
};

export function AttentionItem({
  severity,
  title,
  description,
  context,
  reason,
  metadata,
  primaryAction,
  secondaryAction,
  onAction,
  className,
}: AttentionItemProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;
  const actions = [
    ...(primaryAction ? [{ ...primaryAction, tone: primaryAction.tone ?? 'secondary' as const }] : []),
    ...(secondaryAction ? [{ ...secondaryAction, tone: secondaryAction.tone ?? 'ghost' as const }] : []),
  ];

  return (
    <article className={cn('rounded-ds-md border p-4', config.className, className)} data-severity={severity}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Icon aria-hidden="true" className="size-4" />
            <Badge variant={config.badge}>{config.label}</Badge>
            {context && <span className="text-sm font-medium">{context}</span>}
          </div>
          <h3 className="mt-3 text-base font-semibold">{title}</h3>
          <div className="mt-1 text-sm leading-6">{description}</div>
          {reason && <div className="mt-2 text-sm opacity-90">{reason}</div>}
          {metadata && metadata.length > 0 && (
            <dl className="mt-3 flex flex-wrap gap-2">
              {metadata.map((item) => (
                <div key={item.label} className="rounded-ds-sm border border-current/20 bg-white/50 px-2 py-1 text-xs">
                  <dt className="font-medium">{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <ReviewActions actions={actions} onAction={onAction} className="md:justify-end" aria-label={`${config.label} attention actions`} />
      </div>
    </article>
  );
}
