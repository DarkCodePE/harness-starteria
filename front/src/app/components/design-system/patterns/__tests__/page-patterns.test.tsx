import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DomainStatusBadge } from '../../status';
import { AttentionItem } from '../AttentionItem';
import { DecisionSupportSummary } from '../DecisionSupportSummary';
import { EmptyState } from '../EmptyState';
import { NextAction } from '../NextAction';
import { PageHeader } from '../PageHeader';
import { ReviewSummary } from '../ReviewSummary';

describe('DS-04 page-level patterns', () => {
  it('PageHeader renders title, optional actions and status composition', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <PageHeader
        title="Challenge detail"
        status={<DomainStatusBadge status="requires_review" />}
        primaryAction={{ id: 'primary', label: 'Primary action' }}
        secondaryActions={[{ id: 'secondary', label: 'Secondary action', tone: 'secondary' }]}
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Challenge detail' })).toBeInTheDocument();
    expect(screen.getByText('Requires review')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Primary action' }));
    expect(onAction).toHaveBeenCalledWith('primary');
  });

  it('EmptyState allows optional primary action and preserves accessible structure', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        title="No challenges yet"
        description="Create one when product logic says it is time."
        primaryAction={{ id: 'create', label: 'Create challenge' }}
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No challenges yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create challenge' }));
    expect(onAction).toHaveBeenCalledWith('create');
  });

  it('NextAction emits primary and secondary actions without domain decision inputs', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <NextAction
        title="Complete evidence"
        description="The caller supplies the next action."
        primaryAction={{ id: 'continue', label: 'Continue' }}
        secondaryAction={{ id: 'later', label: 'Later', tone: 'secondary' }}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Later' }));
    expect(onAction).toHaveBeenNthCalledWith(1, 'continue');
    expect(onAction).toHaveBeenNthCalledWith(2, 'later');
  });

  it('AttentionItem renders severity deterministically and keeps actions accessible', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <AttentionItem
        severity="danger"
        title="Decision blocked"
        description="The severity is supplied externally."
        primaryAction={{ id: 'resolve', label: 'Resolve blocker', ariaLabel: 'Resolve blocker' }}
        onAction={onAction}
      />,
    );

    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Decision blocked').closest('[data-severity]')).toHaveAttribute('data-severity', 'danger');
    await user.click(screen.getByRole('button', { name: 'Resolve blocker' }));
    expect(onAction).toHaveBeenCalledWith('resolve');
  });

  it('ReviewSummary supports AI and human sources distinctly', () => {
    render(
      <div>
        <ReviewSummary
          source="ai"
          title="AI review"
          disposition="REQUIRES_REVIEW"
          summary="AI summary"
        />
        <ReviewSummary
          source="human"
          title="Mentor review"
          disposition="USER_CONFIRMED"
          reviewer="Mara"
          role="Mentor"
          summary="Human summary"
        />
      </div>,
    );

    expect(screen.getByText('AI review').closest('[data-source]')).toHaveAttribute('data-source', 'ai');
    expect(screen.getByText('Mentor review').closest('[data-source]')).toHaveAttribute('data-source', 'human');
    expect(screen.getByText('Mara')).toBeInTheDocument();
  });

  it('DecisionSupportSummary renders supplied strategic questions and routes', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <DecisionSupportSummary
        summary="Decision synthesis"
        strategicQuestions={[
          { id: 'q1', question: 'What evidence matters most?' },
          { id: 'q2', question: 'What should change next?' },
        ]}
        routes={[{ id: 'iterate', label: 'Iterate', tone: 'primary' }]}
        onAction={onAction}
      />,
    );

    expect(screen.getByText(/What evidence matters most\?/)).toBeInTheDocument();
    expect(screen.getByText(/What should change next\?/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Iterate' }));
    expect(onAction).toHaveBeenCalledWith('iterate');
  });
});
