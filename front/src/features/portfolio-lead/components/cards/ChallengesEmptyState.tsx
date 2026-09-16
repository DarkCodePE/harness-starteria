import React from 'react';
import { PortfolioLeadEmptyState } from '../states/PortfolioLeadEmptyState';

export function ChallengesEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <PortfolioLeadEmptyState
      title={title}
      description={description}
      primaryAction={{ label: actionLabel, onClick: onAction }}
      secondaryAction={secondaryAction}
    />
  );
}
