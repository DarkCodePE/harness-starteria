import React from 'react';
import { PortfolioLeadEmptyState } from '../states/PortfolioLeadEmptyState';

export function StrategicFrontEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <PortfolioLeadEmptyState
      title={title}
      description={description}
      primaryAction={{ label: actionLabel, onClick: onAction }}
    />
  );
}
