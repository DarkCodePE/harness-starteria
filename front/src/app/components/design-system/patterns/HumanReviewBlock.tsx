import * as React from 'react';
import { CheckCircle2, UserRound } from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import { ReviewDisposition } from './ReviewDisposition';
import type { PatternAction, ReviewDispositionStatus } from './types';

export type HumanReviewBlockProps = {
  title: string;
  reviewer: string;
  role: string;
  status: ReviewDispositionStatus;
  comment?: React.ReactNode;
  timestamp?: React.ReactNode;
  actions?: PatternAction[];
  onAction?: (actionId: string) => void;
  className?: string;
};

export function HumanReviewBlock({
  title,
  reviewer,
  role,
  status,
  comment,
  timestamp,
  actions,
  onAction,
  className,
}: HumanReviewBlockProps) {
  return (
    <Card className={cn('border-border-strong bg-surface-default', className)}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-4 text-text-secondary" />
            {title}
          </CardTitle>
          <ReviewDisposition status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <CheckCircle2 aria-hidden="true" className="size-4 text-[var(--status-review-confirmed-icon)]" />
          <span className="font-medium text-text-primary">{reviewer}</span>
          <span>{role}</span>
          {timestamp && <span>{timestamp}</span>}
        </div>
      </CardHeader>
      {comment && (
        <CardContent>
          <div className="rounded-ds-sm border border-border-default bg-background-subtle p-4 text-sm leading-6 text-text-primary">
            {comment}
          </div>
        </CardContent>
      )}
      <CardFooter>
        <ReviewActions actions={actions} onAction={onAction} aria-label={`${title} actions`} />
      </CardFooter>
    </Card>
  );
}
