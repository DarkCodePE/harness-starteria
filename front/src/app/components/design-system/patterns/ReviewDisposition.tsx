import * as React from 'react';

import {
  DomainStatusBadge,
  type ReviewStatus,
} from '../status/DomainStatusBadge';
import type { ReviewDispositionStatus } from './types';

export const REVIEW_DISPOSITION_LABELS: Record<ReviewDispositionStatus, string> = {
  UNREVIEWED: 'Unreviewed',
  REQUIRES_REVIEW: 'Requires review',
  USER_CONFIRMED: 'Human confirmed',
  USER_REJECTED: 'Human rejected',
  SUPERSEDED: 'Superseded',
};

export const REVIEW_DISPOSITION_TO_DOMAIN_STATUS: Record<ReviewDispositionStatus, ReviewStatus> = {
  UNREVIEWED: 'unreviewed',
  REQUIRES_REVIEW: 'requires_review',
  USER_CONFIRMED: 'confirmed',
  USER_REJECTED: 'rejected',
  SUPERSEDED: 'superseded',
};

export type ReviewDispositionProps = {
  status: ReviewDispositionStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
};

export function ReviewDisposition({
  status,
  label,
  showIcon,
  className,
}: ReviewDispositionProps) {
  return (
    <DomainStatusBadge
      status={REVIEW_DISPOSITION_TO_DOMAIN_STATUS[status]}
      label={label ?? REVIEW_DISPOSITION_LABELS[status]}
      showIcon={showIcon}
      className={className}
    />
  );
}
