import type { ReactNode } from 'react';

export type ReviewDispositionStatus =
  | 'UNREVIEWED'
  | 'REQUIRES_REVIEW'
  | 'USER_CONFIRMED'
  | 'USER_REJECTED'
  | 'SUPERSEDED';

export type PatternActionTone = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type PatternAction = {
  id: string;
  label: string;
  tone?: PatternActionTone;
  disabled?: boolean;
  ariaLabel?: string;
};

export type PatternDensity = 'comfortable' | 'compact';

export type ProvenanceItem = {
  label: string;
  value?: ReactNode;
};

export type Rationale = ReactNode | ReactNode[];
