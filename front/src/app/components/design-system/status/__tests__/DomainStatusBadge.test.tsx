import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  DOMAIN_STATUS_CONFIG,
  DOMAIN_STATUS_LABELS,
  DomainStatusBadge,
  type DomainStatus,
} from '../DomainStatusBadge';

const EXPECTED_STATUSES: DomainStatus[] = [
  'draft',
  'active',
  'completed',
  'blocked',
  'closed',
  'unreviewed',
  'requires_review',
  'confirmed',
  'rejected',
  'superseded',
  'info',
  'success',
  'warning',
  'danger',
  'suggested',
];

describe('DomainStatusBadge', () => {
  it('covers the DS-01 semantic status model', () => {
    expect(Object.keys(DOMAIN_STATUS_CONFIG).sort()).toEqual([...EXPECTED_STATUSES].sort());
    expect(Object.keys(DOMAIN_STATUS_LABELS).sort()).toEqual([...EXPECTED_STATUSES].sort());
  });

  it('renders a label and semantic status attribute without deriving business state', () => {
    render(<DomainStatusBadge status="requires_review" />);

    const badge = screen.getByText('Requires review').closest('[data-slot="domain-status-badge"]');
    expect(badge).toHaveAttribute('data-status', 'requires_review');
    expect(badge).toHaveAttribute('aria-label', 'Requires review');
  });

  it('keeps distinct domain meanings even when visual families are related', () => {
    expect(DOMAIN_STATUS_CONFIG.confirmed.description).toBe('Review status: confirmed');
    expect(DOMAIN_STATUS_CONFIG.completed.description).toBe('Workflow status: completed');
    expect(DOMAIN_STATUS_LABELS.confirmed).not.toBe(DOMAIN_STATUS_LABELS.completed);
  });

  it('can render without an icon while retaining text and accessible name', () => {
    render(<DomainStatusBadge status="suggested" showIcon={false} label="Suggested by Starteria" />);

    const badge = screen.getByText('Suggested by Starteria').closest('[data-slot="domain-status-badge"]');
    expect(badge).toHaveAttribute('aria-label', 'Suggested by Starteria');
    expect(badge?.querySelector('svg')).toBeNull();
  });
});
