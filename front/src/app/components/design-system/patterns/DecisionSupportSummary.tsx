import * as React from 'react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction } from './types';

export type StrategicQuestion = {
  id: string;
  question: React.ReactNode;
  context?: React.ReactNode;
};

export type DecisionSupportSummaryProps = {
  title?: React.ReactNode;
  summary: React.ReactNode;
  keyEvidence?: React.ReactNode[];
  strategicQuestions?: StrategicQuestion[];
  conclusion?: React.ReactNode;
  uncertaintyNote?: React.ReactNode;
  routes?: PatternAction[];
  onAction?: (actionId: string) => void;
  className?: string;
};

export function DecisionSupportSummary({
  title = 'Decision support',
  summary,
  keyEvidence,
  strategicQuestions,
  conclusion,
  uncertaintyNote,
  routes,
  onAction,
  className,
}: DecisionSupportSummaryProps) {
  return (
    <Card className={cn('border-border-default bg-surface-default', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="space-y-4">
          <section aria-label="Decision summary">
            <p className="text-xs font-semibold uppercase text-text-muted">Summary</p>
            <div className="mt-2 text-sm leading-6 text-text-primary">{summary}</div>
          </section>
          {keyEvidence && keyEvidence.length > 0 && (
            <section aria-label="Key evidence">
              <p className="text-xs font-semibold uppercase text-text-muted">Key evidence / context</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-text-secondary">
                {keyEvidence.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {conclusion && (
            <section aria-label="Conclusion" className="rounded-ds-sm border border-border-default bg-background-subtle p-4">
              <p className="text-xs font-semibold uppercase text-text-muted">Conclusion</p>
              <div className="mt-2 text-sm leading-6 text-text-primary">{conclusion}</div>
            </section>
          )}
        </div>
        <div className="space-y-4">
          {strategicQuestions && strategicQuestions.length > 0 && (
            <section aria-label="Strategic questions">
              <p className="text-xs font-semibold uppercase text-text-muted">Strategic questions</p>
              <ol className="mt-2 space-y-2">
                {strategicQuestions.map((item, index) => (
                  <li key={item.id} className="rounded-ds-sm border border-border-default bg-background-subtle p-3 text-sm">
                    <p className="font-medium text-text-primary">{index + 1}. {item.question}</p>
                    {item.context && <div className="mt-1 text-text-secondary">{item.context}</div>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {uncertaintyNote && (
            <section aria-label="Uncertainty note" className="rounded-ds-sm border border-[var(--status-feedback-warning-border)] bg-[var(--status-feedback-warning-surface)] p-3 text-sm text-[var(--status-feedback-warning-text)]">
              {uncertaintyNote}
            </section>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <ReviewActions actions={routes} onAction={onAction} aria-label="Decision routes" />
      </CardFooter>
    </Card>
  );
}
