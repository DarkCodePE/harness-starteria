import * as React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction, Rationale } from './types';

export type ProposedMutationCardProps = {
  title?: string;
  current: React.ReactNode;
  suggestion: React.ReactNode;
  why?: Rationale;
  actions?: PatternAction[];
  onAction?: (actionId: string) => void;
  className?: string;
};

export function ProposedMutationCard({
  title = 'Proposed change',
  current,
  suggestion,
  why,
  actions,
  onAction,
  className,
}: ProposedMutationCardProps) {
  return (
    <Card className={cn('border-[var(--ai-suggested-border)]', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4 text-[var(--ai-suggested-icon)]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ComparisonBlock label="Current">{current}</ComparisonBlock>
        <div className="flex justify-center text-text-muted" aria-hidden="true">
          <ArrowDown className="size-4" />
        </div>
        <ComparisonBlock
          label="Starteria suggestion"
          className="border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)]"
        >
          {suggestion}
        </ComparisonBlock>
        {why && (
          <section aria-label="Why">
            <p className="text-xs font-semibold uppercase text-text-muted">Why</p>
            <div className="mt-2 text-sm leading-6 text-text-secondary">{renderRationale(why)}</div>
          </section>
        )}
      </CardContent>
      <CardFooter>
        <ReviewActions actions={actions} onAction={onAction} aria-label={`${title} actions`} />
      </CardFooter>
    </Card>
  );
}

function ComparisonBlock({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-ds-sm border border-border-default bg-surface-default p-4', className)}>
      <p className="text-xs font-semibold uppercase text-text-muted">{label}</p>
      <div className="mt-2 text-sm leading-6 text-text-primary">{children}</div>
    </section>
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
