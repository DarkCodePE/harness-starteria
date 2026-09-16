import * as React from 'react';

import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import type { PatternAction } from './types';

type ReviewActionsProps = {
  actions?: PatternAction[];
  onAction?: (actionId: string) => void;
  className?: string;
  'aria-label'?: string;
};

const toneToVariant: Record<NonNullable<PatternAction['tone']>, React.ComponentProps<typeof Button>['variant']> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  destructive: 'destructive',
};

export function ReviewActions({
  actions = [],
  onAction,
  className,
  'aria-label': ariaLabel = 'Review actions',
}: ReviewActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} aria-label={ariaLabel}>
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          size="sm"
          variant={toneToVariant[action.tone ?? 'secondary']}
          disabled={action.disabled}
          aria-label={action.ariaLabel}
          onClick={() => onAction?.(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
