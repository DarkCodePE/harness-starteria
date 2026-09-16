import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DomainStatusBadge } from '../../status';
import { AISuggestionPanel } from '../AISuggestionPanel';
import { HumanReviewBlock } from '../HumanReviewBlock';
import { InlineInsight } from '../InlineInsight';
import { ProposedMutationCard } from '../ProposedMutationCard';
import {
  REVIEW_DISPOSITION_TO_DOMAIN_STATUS,
  ReviewDisposition,
} from '../ReviewDisposition';

describe('DS-03 AI / human / review patterns', () => {
  it('renders AI suggestion and human confirmation with distinct authority labels', () => {
    render(
      <div>
        <AISuggestionPanel suggestion="Review the scope before activation." />
        <HumanReviewBlock
          title="Portfolio Lead confirmation"
          reviewer="Mara Diaz"
          role="Portfolio Lead"
          status="USER_CONFIRMED"
          comment="Confirmed after reviewing evidence."
        />
      </div>,
    );

    expect(screen.getByText('Starteria suggestion')).toBeInTheDocument();
    expect(screen.getByText('Mara Diaz')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Lead')).toBeInTheDocument();
    expect(screen.getByText('Human confirmed')).toBeInTheDocument();
  });

  it('maps review dispositions deterministically to DS-01 review statuses', () => {
    expect(REVIEW_DISPOSITION_TO_DOMAIN_STATUS).toEqual({
      UNREVIEWED: 'unreviewed',
      REQUIRES_REVIEW: 'requires_review',
      USER_CONFIRMED: 'confirmed',
      USER_REJECTED: 'rejected',
      SUPERSEDED: 'superseded',
    });

    render(<ReviewDisposition status="REQUIRES_REVIEW" />);
    expect(screen.getByText('Requires review').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'requires_review',
    );
  });

  it('emits ProposedMutationCard actions without mutating displayed values', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <ProposedMutationCard
        current="Current framing"
        suggestion="Suggested framing"
        actions={[{ id: 'apply', label: 'Apply', tone: 'primary' }]}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onAction).toHaveBeenCalledWith('apply');
    expect(screen.getByText('Current framing')).toBeInTheDocument();
    expect(screen.getByText('Suggested framing')).toBeInTheDocument();
  });

  it('HumanReviewBlock identifies reviewer and role', () => {
    render(
      <HumanReviewBlock
        title="Mentor review"
        reviewer="Nadia Torres"
        role="Mentor"
        status="USER_REJECTED"
      />,
    );

    expect(screen.getByText('Mentor review')).toBeInTheDocument();
    expect(screen.getByText('Nadia Torres')).toBeInTheDocument();
    expect(screen.getByText('Mentor')).toBeInTheDocument();
    expect(screen.getByText('Human rejected')).toBeInTheDocument();
  });

  it('AISuggestionPanel supports optional actions', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <AISuggestionPanel
        suggestion="Use a narrower pilot."
        actions={[
          { id: 'apply', label: 'Apply', tone: 'primary' },
          { id: 'keep', label: 'Keep mine', tone: 'secondary' },
        ]}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Keep mine' }));
    expect(onAction).toHaveBeenCalledWith('keep');
  });

  it('AI patterns support loading and error states', () => {
    const { rerender } = render(<AISuggestionPanel state="loading" loadingLabel="Analyzing evidence..." />);
    expect(screen.getByText('Analyzing evidence...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing evidence...').closest('[aria-busy]')).toHaveAttribute(
      'aria-busy',
      'true',
    );

    rerender(<AISuggestionPanel state="error" />);
    expect(screen.getByText("We couldn't generate this analysis.")).toBeInTheDocument();
    expect(screen.getByText('Your information is still saved.')).toBeInTheDocument();
  });

  it('exposes accessible labels and expandable rationale for inline insight', async () => {
    const user = userEvent.setup();

    render(
      <InlineInsight title="Starteria insight" rationale={['Same KPI']}>
        This may need review.
      </InlineInsight>,
    );

    expect(screen.getByLabelText('Starteria insight')).toBeInTheDocument();
    await user.click(screen.getByText('Why Starteria suggests this'));
    expect(screen.getByText('Same KPI')).toBeInTheDocument();
  });

  it('keeps DomainStatusBadge regression coverage available', () => {
    render(<DomainStatusBadge status="suggested" />);
    expect(screen.getByText('Starteria suggested').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'suggested',
    );
  });
});
