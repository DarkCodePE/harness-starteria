import React from 'react';
import { PortfolioLeadEmptyState } from '../states/PortfolioLeadEmptyState';
import type { PortfolioDecisionCard } from '../../domain/types';

export function PortfolioDecisionQueue({
  items,
  onNavigate,
}: {
  items: PortfolioDecisionCard[];
  onNavigate: (path: string) => void;
}) {
  if (items.length === 0) {
    return (
      <PortfolioLeadEmptyState
        title="No hay decisiones pendientes ahora"
        description="Todavia no aparece una iniciativa con evidencia o urgencia suficiente para pasar por una definicion ejecutiva."
        primaryAction={{ label: 'Revisar iniciativas', onClick: () => onNavigate('/portfolio/iniciativas') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{item.frontName}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{item.challengeName}</span>
              </div>
              <h3 className="mt-3 text-lg text-slate-950" style={{ fontWeight: 700 }}>{item.initiativeName}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.evidenceSummary}</p>
            </div>

            <button
              onClick={() => onNavigate(item.actionPath)}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800"
              style={{ fontWeight: 600 }}
            >
              {item.actionLabel}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <QueueInfo label="Evidencia disponible" value={item.evidenceLabel} />
            <QueueInfo label="Lectura sugerida" value={item.suggestedRoute} />
            <QueueInfo label="Siguiente paso" value="Convertir evidencia en una definicion ejecutiva clara." />
          </div>
        </article>
      ))}
    </div>
  );
}

function QueueInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
