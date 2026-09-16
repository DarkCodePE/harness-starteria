import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PortfolioLeadEmptyState } from '../states/PortfolioLeadEmptyState';
import type { PortfolioAlert, PortfolioNextAction } from '../../domain/types';

function alertToneClasses(tone: PortfolioAlert['tone']) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
  };
  return tones[tone];
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
      <PortfolioLeadEmptyState
        title="No hay alertas operativas criticas ahora"
        description="El portafolio no muestra retos atorados, actores pendientes ni iniciativas frenadas en este momento. El siguiente paso mas util es revisar frentes y confirmar si conviene abrir nuevo trabajo."
        primaryAction={{
          label: fallbackAction.label,
          onClick: () => onNavigate(fallbackAction.path ?? '/portfolio/frentes-estrategicos'),
        }}
      />
    );
  }

  return (
    <>
      {alerts.map(alert => (
        <article key={alert.id} className={`rounded-2xl border p-4 ${alertToneClasses(alert.tone)}`}>
          <p className="text-sm" style={{ fontWeight: 700 }}>{alert.title}</p>
          <p className="mt-2 text-sm opacity-90">{alert.description}</p>
          {alert.actionLabel && alert.actionPath ? (
            <button
              onClick={() => onNavigate(alert.actionPath)}
              className="mt-4 inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
              style={{ fontWeight: 700 }}
            >
              {alert.actionLabel}
              <ArrowRight size={14} />
            </button>
          ) : null}
        </article>
      ))}
    </>
  );
}
