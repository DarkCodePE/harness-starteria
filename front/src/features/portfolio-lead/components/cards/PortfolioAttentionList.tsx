import React from 'react';
import { EmptyState, AttentionItem, type AttentionSeverity } from '../../../../app/components/design-system/patterns';
import type { PortfolioAlert, PortfolioNextAction } from '../../domain/types';

function alertToneToSeverity(tone: PortfolioAlert['tone']): AttentionSeverity {
  if (tone === 'rose') return 'danger';
  if (tone === 'amber' || tone === 'violet') return 'warning';
  if (tone === 'emerald') return 'success';
  return 'info';
}

export function PortfolioAttentionList({
  alerts,
  fallbackAction,
  onNavigate,
}: {
  alerts: PortfolioAlert[];
  fallbackAction: PortfolioNextAction;
  onNavigate: (path: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        eyebrow="Atencion despejada"
        title="No hay alertas operativas criticas ahora"
        description="El portafolio no muestra retos atorados, actores pendientes ni iniciativas frenadas en este momento. El siguiente paso mas util es revisar frentes y confirmar si conviene abrir nuevo trabajo."
        primaryAction={{
          id: 'portfolio-empty-primary',
          label: fallbackAction.label,
          ariaLabel: fallbackAction.label,
        }}
        onAction={() => onNavigate(fallbackAction.path ?? '/portfolio/frentes-estrategicos')}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {alerts.map(alert => (
        <AttentionItem
          key={alert.id}
          severity={alertToneToSeverity(alert.tone)}
          title={alert.title}
          description={alert.description}
          context={alert.contextLabel}
          reason={alert.whyItMatters}
          metadata={alert.recommendedAction ? [{ label: 'Siguiente movimiento', value: alert.recommendedAction }] : undefined}
          primaryAction={alert.actionLabel && alert.actionPath ? {
            id: alert.actionPath,
            label: alert.actionLabel,
            ariaLabel: alert.actionLabel,
          } : undefined}
          onAction={actionId => onNavigate(actionId)}
        />
      ))}
    </div>
  );
}
