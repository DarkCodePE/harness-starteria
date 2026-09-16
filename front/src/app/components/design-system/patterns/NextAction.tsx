import * as React from 'react';

import { Badge } from '../../ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction } from './types';

export type NextActionProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  status?: React.ReactNode;
  context?: React.ReactNode;
  primaryAction: PatternAction;
  secondaryAction?: PatternAction;
  onAction?: (actionId: string) => void;
  className?: string;
};

export function NextAction({
  eyebrow = 'Next action',
  title,
  description,
  status,
  context,
  primaryAction,
  secondaryAction,
  onAction,
  className,
}: NextActionProps) {
  const actions = [
    { ...primaryAction, tone: primaryAction.tone ?? 'primary' as const },
    ...(secondaryAction ? [{ ...secondaryAction, tone: secondaryAction.tone ?? 'secondary' as const }] : []),
  ];

  return (
    <Card className={cn('border-border-strong bg-surface-default', className)}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{eyebrow}</Badge>
          {status}
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-w-3xl text-sm leading-6 text-text-secondary md:text-base">{description}</div>
        {context && (
          <div className="rounded-ds-sm border border-border-default bg-background-subtle p-3 text-sm text-text-secondary">
            {context}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <ReviewActions actions={actions} onAction={onAction} aria-label="Next action controls" />
      </CardFooter>
    </Card>
  );
}
