import React from 'react';
import { PortfolioLeadEmptyState } from '../states/PortfolioLeadEmptyState';
import type { ReadyToActivateChallengeCard } from '../../domain/types';

export function PortfolioReadyChallenges({
  items,
  onNavigate,
}: {
  items: ReadyToActivateChallengeCard[];
  onNavigate: (path: string) => void;
}) {
  if (items.length === 0) {
    return (
      <PortfolioLeadEmptyState
        title="No hay retos listos para activar ahora"
        description="Por ahora no hay retos que ya tengan base suficiente para activarse. Conviene revisar frentes o seguir madurando retos."
        primaryAction={{ label: 'Revisar retos', onClick: () => onNavigate('/portfolio/retos') }}
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map(item => (
        <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{item.frontName}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{item.challengeTypeLabel}</span>
              </div>
              <h3 className="mt-3 text-lg text-slate-950" style={{ fontWeight: 700 }}>{item.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.urgencyLabel}</p>
            </div>

            <button
              onClick={() => onNavigate(item.actionPath)}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800"
              style={{ fontWeight: 600 }}
            >
              {item.actionLabel}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ReadyInfo label="Challenge owner" value={item.challengeOwner} />
            <ReadyInfo label="Sponsor visible" value={item.sponsor} />
            <ReadyInfo label="Por que conviene activarlo" value="Ya tiene base suficiente para pasar de definicion a movimiento visible." />
            <ReadyInfo label="Siguiente paso" value="Activa este reto y deja claro como entra al portafolio." />
          </div>
        </article>
      ))}
    </div>
  );
}

function ReadyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
