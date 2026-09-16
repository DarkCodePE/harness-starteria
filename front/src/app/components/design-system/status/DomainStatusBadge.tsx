import * as React from 'react';
import {
  AlertCircle,
  Archive,
  Ban,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  Info,
  Lock,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';

export type WorkflowStatus = 'draft' | 'active' | 'completed' | 'blocked' | 'closed';
export type ReviewStatus = 'unreviewed' | 'requires_review' | 'confirmed' | 'rejected' | 'superseded';
export type FeedbackStatus = 'info' | 'success' | 'warning' | 'danger';
export type AIStatus = 'suggested';

export type DomainStatus = WorkflowStatus | ReviewStatus | FeedbackStatus | AIStatus;

type DomainStatusConfig = {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className: string;
  iconClassName: string;
};

export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  blocked: 'Blocked',
  closed: 'Closed',
  unreviewed: 'Unreviewed',
  requires_review: 'Requires review',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  superseded: 'Superseded',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  suggested: 'Starteria suggested',
};

export const DOMAIN_STATUS_CONFIG: Record<DomainStatus, DomainStatusConfig> = {
  draft: {
    label: DOMAIN_STATUS_LABELS.draft,
    description: 'Workflow status: draft',
    icon: CircleDashed,
    className: 'border-[var(--status-workflow-draft-border)] bg-[var(--status-workflow-draft-surface)] text-[var(--status-workflow-draft-text)]',
    iconClassName: 'text-[var(--status-workflow-draft-icon)]',
  },
  active: {
    label: DOMAIN_STATUS_LABELS.active,
    description: 'Workflow status: active',
    icon: Clock3,
    className: 'border-[var(--status-workflow-active-border)] bg-[var(--status-workflow-active-surface)] text-[var(--status-workflow-active-text)]',
    iconClassName: 'text-[var(--status-workflow-active-icon)]',
  },
  completed: {
    label: DOMAIN_STATUS_LABELS.completed,
    description: 'Workflow status: completed',
    icon: CheckCircle2,
    className: 'border-[var(--status-workflow-completed-border)] bg-[var(--status-workflow-completed-surface)] text-[var(--status-workflow-completed-text)]',
    iconClassName: 'text-[var(--status-workflow-completed-icon)]',
  },
  blocked: {
    label: DOMAIN_STATUS_LABELS.blocked,
    description: 'Workflow status: blocked',
    icon: Lock,
    className: 'border-[var(--status-workflow-blocked-border)] bg-[var(--status-workflow-blocked-surface)] text-[var(--status-workflow-blocked-text)]',
    iconClassName: 'text-[var(--status-workflow-blocked-icon)]',
  },
  closed: {
    label: DOMAIN_STATUS_LABELS.closed,
    description: 'Workflow status: closed',
    icon: Archive,
    className: 'border-[var(--status-workflow-closed-border)] bg-[var(--status-workflow-closed-surface)] text-[var(--status-workflow-closed-text)]',
    iconClassName: 'text-[var(--status-workflow-closed-icon)]',
  },
  unreviewed: {
    label: DOMAIN_STATUS_LABELS.unreviewed,
    description: 'Review status: unreviewed',
    icon: Circle,
    className: 'border-[var(--status-review-unreviewed-border)] bg-[var(--status-review-unreviewed-surface)] text-[var(--status-review-unreviewed-text)]',
    iconClassName: 'text-[var(--status-review-unreviewed-icon)]',
  },
  requires_review: {
    label: DOMAIN_STATUS_LABELS.requires_review,
    description: 'Review status: requires review',
    icon: AlertCircle,
    className: 'border-[var(--status-review-requires-review-border)] bg-[var(--status-review-requires-review-surface)] text-[var(--status-review-requires-review-text)]',
    iconClassName: 'text-[var(--status-review-requires-review-icon)]',
  },
  confirmed: {
    label: DOMAIN_STATUS_LABELS.confirmed,
    description: 'Review status: confirmed',
    icon: CheckCircle2,
    className: 'border-[var(--status-review-confirmed-border)] bg-[var(--status-review-confirmed-surface)] text-[var(--status-review-confirmed-text)]',
    iconClassName: 'text-[var(--status-review-confirmed-icon)]',
  },
  rejected: {
    label: DOMAIN_STATUS_LABELS.rejected,
    description: 'Review status: rejected',
    icon: XCircle,
    className: 'border-[var(--status-review-rejected-border)] bg-[var(--status-review-rejected-surface)] text-[var(--status-review-rejected-text)]',
    iconClassName: 'text-[var(--status-review-rejected-icon)]',
  },
  superseded: {
    label: DOMAIN_STATUS_LABELS.superseded,
    description: 'Review status: superseded',
    icon: Archive,
    className: 'border-[var(--status-review-superseded-border)] bg-[var(--status-review-superseded-surface)] text-[var(--status-review-superseded-text)]',
    iconClassName: 'text-[var(--status-review-superseded-icon)]',
  },
  info: {
    label: DOMAIN_STATUS_LABELS.info,
    description: 'Feedback status: info',
    icon: Info,
    className: 'border-[var(--status-feedback-info-border)] bg-[var(--status-feedback-info-surface)] text-[var(--status-feedback-info-text)]',
    iconClassName: 'text-[var(--status-feedback-info-icon)]',
  },
  success: {
    label: DOMAIN_STATUS_LABELS.success,
    description: 'Feedback status: success',
    icon: CheckCircle2,
    className: 'border-[var(--status-feedback-success-border)] bg-[var(--status-feedback-success-surface)] text-[var(--status-feedback-success-text)]',
    iconClassName: 'text-[var(--status-feedback-success-icon)]',
  },
  warning: {
    label: DOMAIN_STATUS_LABELS.warning,
    description: 'Feedback status: warning',
    icon: AlertCircle,
    className: 'border-[var(--status-feedback-warning-border)] bg-[var(--status-feedback-warning-surface)] text-[var(--status-feedback-warning-text)]',
    iconClassName: 'text-[var(--status-feedback-warning-icon)]',
  },
  danger: {
    label: DOMAIN_STATUS_LABELS.danger,
    description: 'Feedback status: danger',
    icon: Ban,
    className: 'border-[var(--status-feedback-danger-border)] bg-[var(--status-feedback-danger-surface)] text-[var(--status-feedback-danger-text)]',
    iconClassName: 'text-[var(--status-feedback-danger-icon)]',
  },
  suggested: {
    label: DOMAIN_STATUS_LABELS.suggested,
    description: 'AI status: Starteria suggested',
    icon: Sparkles,
    className: 'border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)] text-[var(--ai-suggested-text)]',
    iconClassName: 'text-[var(--ai-suggested-icon)]',
  },
};

export type DomainStatusBadgeProps = {
  status: DomainStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
};

export function DomainStatusBadge({
  status,
  label,
  showIcon = true,
  className,
}: DomainStatusBadgeProps) {
  const config = DOMAIN_STATUS_CONFIG[status];
  const Icon = config.icon;
  const visibleLabel = label ?? config.label;

  return (
    <Badge
      variant="outline"
      data-slot="domain-status-badge"
      data-status={status}
      aria-label={visibleLabel}
      title={config.description}
      className={cn(
        'gap-1.5 rounded-md px-2 py-0.5 text-[var(--type-caption-size)] font-medium leading-[var(--type-caption-line-height)]',
        config.className,
        className,
      )}
    >
      {showIcon && <Icon aria-hidden="true" className={cn('size-3.5', config.iconClassName)} />}
      <span>{visibleLabel}</span>
    </Badge>
  );
}
