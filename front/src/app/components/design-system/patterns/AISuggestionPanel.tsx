import * as React from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';
import { ReviewActions } from './ReviewActions';
import type { PatternAction, ProvenanceItem, Rationale } from './types';

export type AISuggestionPanelState = 'ready' | 'loading' | 'error';

export type AISuggestionPanelProps = {
  title?: string;
  suggestion?: React.ReactNode;
  why?: Rationale;
  provenance?: ProvenanceItem[];
  actions?: PatternAction[];
  onAction?: (actionId: string) => void;
  state?: AISuggestionPanelState;
  loadingLabel?: string;
  errorTitle?: string;
  errorDescription?: string;
  className?: string;
};

export function AISuggestionPanel({
  title = 'Starteria suggests',
  suggestion,
  why,
  provenance,
  actions,
  onAction,
  state = 'ready',
  loadingLabel = 'Preparing a synthesis...',
  errorTitle = "We couldn't generate this analysis.",
  errorDescription = 'Your information is still saved.',
  className,
}: AISuggestionPanelProps) {
  if (state === 'loading') {
    return (
      <Card
        className={cn('border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)]', className)}
        aria-busy="true"
      >
        <CardContent className="flex items-center gap-3 py-5 text-[var(--ai-suggested-text)]">
          <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
          <span className="text-sm font-medium">{loadingLabel}</span>
        </CardContent>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Alert variant="danger" className={className}>
        <AlertCircle />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>
          <p>{errorDescription}</p>
          <ReviewActions actions={actions} onAction={onAction} className="mt-3" aria-label="AI error actions" />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={cn('border-[var(--ai-suggested-border)] bg-[var(--ai-suggested-surface)]', className)}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4 text-[var(--ai-suggested-icon)]" />
          <Badge
            variant="outline"
            className="border-[var(--ai-suggested-border)] bg-surface-default text-[var(--ai-suggested-text)]"
          >
            Starteria suggestion
          </Badge>
        </div>
        <CardTitle className="text-[var(--ai-suggested-text)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestion && (
          <section aria-label="Suggestion" className="rounded-ds-sm border border-[var(--ai-suggested-border)] bg-surface-default p-4">
            <p className="text-xs font-semibold uppercase text-text-muted">Suggestion</p>
            <div className="mt-2 text-sm leading-6 text-text-primary">{suggestion}</div>
          </section>
        )}
        {why && (
          <section aria-label="Why">
            <p className="text-xs font-semibold uppercase text-text-muted">Why</p>
            <div className="mt-2 text-sm leading-6 text-text-secondary">{renderRationale(why)}</div>
          </section>
        )}
        {provenance && provenance.length > 0 && (
          <section aria-label="Source context">
            <p className="text-xs font-semibold uppercase text-text-muted">Source context</p>
            <dl className="mt-2 grid gap-2 text-sm text-text-secondary">
              {provenance.map((item) => (
                <div key={item.label} className="flex flex-wrap gap-1">
                  <dt className="font-medium text-text-primary">{item.label}</dt>
                  {item.value && <dd>{item.value}</dd>}
                </div>
              ))}
            </dl>
          </section>
        )}
      </CardContent>
      <CardFooter>
        <ReviewActions actions={actions} onAction={onAction} aria-label={`${title} actions`} />
      </CardFooter>
    </Card>
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
