import * as React from 'react';
import { Sparkles, UserRound } from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import { ReviewDisposition } from './ReviewDisposition';
import type { PatternAction, ReviewDispositionStatus } from './types';

export type ReviewSummarySource = 'ai' | 'human';

export type ReviewSummaryProps = {
  source: ReviewSummarySource;
  title: React.ReactNode;
  disposition: ReviewDispositionStatus;
  summary: React.ReactNode;
  reviewer?: React.ReactNode;
  role?: React.ReactNode;
  strengths?: React.ReactNode[];
  gaps?: React.ReactNode[];
  nextAction?: React.ReactNode;
  actions?: PatternAction[];
  onAction?: (actionId: string) => void;
  className?: string;
};

export function ReviewSummary({
  source,
  title,
  disposition,
  summary,
  reviewer,
  role,
  strengths,
  gaps,
  nextAction,
  actions,
  onAction,
  className,
}: ReviewSummaryProps) {
  const isAi = source === 'ai';
  const Icon = isAi ? Sparkles : UserRound;

  return (
    <Card
      className={cn(
        isAi ? 'border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)]' : 'border-border-default bg-surface-default',
        className,
      )}
      data-source={source}
    >
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Icon aria-hidden="true" className={cn('size-4', isAi && 'text-[var(--ai-suggested-icon)]')} />
            {title}
          </CardTitle>
          <ReviewDisposition status={disposition} />
        </div>
        {(reviewer || role) && (
          <p className="text-sm text-text-secondary">
            {reviewer && <span className="font-medium text-text-primary">{reviewer}</span>}
            {role && <span> {role}</span>}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm leading-6 text-text-primary">{summary}</div>
        <SummaryList title="Strengths" items={strengths} />
        <SummaryList title="Gaps" items={gaps} />
        {nextAction && (
          <section aria-label="Review next action" className="rounded-ds-sm border border-border-default bg-surface-default p-3 text-sm text-text-secondary">
            {nextAction}
          </section>
        )}
      </CardContent>
      <CardFooter>
        <ReviewActions actions={actions} onAction={onAction} aria-label={`${title} actions`} />
      </CardFooter>
    </Card>
  );
}

function SummaryList({ title, items }: { title: string; items?: React.ReactNode[] }) {
  if (!items?.length) return null;

  return (
    <section aria-label={title}>
      <p className="text-xs font-semibold uppercase text-text-muted">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-text-secondary">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
