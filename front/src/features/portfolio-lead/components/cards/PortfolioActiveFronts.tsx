import React from 'react';
import { PortfolioLeadEmptyState } from '../states/PortfolioLeadEmptyState';
import type { ActiveFrontCard } from '../../domain/types';

export function PortfolioActiveFronts({
  items,
  onNavigate,
}: {
  items: ActiveFrontCard[];
  onNavigate: (path: string) => void;
}) {
  if (items.length === 0) {
    return (
      <PortfolioLeadEmptyState
        title="No hay frentes activos ahora"
        description="Sin frentes activos no hay una prioridad estrategica clara en movimiento. Conviene activar el primer frente o revisar por que se detuvieron."
        primaryAction={{ label: 'Revisar frentes', onClick: () => onNavigate('/portfolio/frentes-estrategicos') }}
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {items.map(item => (
        <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>FRENTE ACTIVO</p>
          <h3 className="mt-2 text-lg text-slate-950" style={{ fontWeight: 700 }}>{item.name}</h3>
          <p className="mt-2 text-sm text-slate-600">KPI principal: {item.mainKpi}</p>

          <div className="mt-5 grid gap-3">
            <FrontInfo label="Cobertura" value={item.coverageLabel} />
            <FrontInfo label="Retos asociados" value={`${item.challengesCount}`} />
            <FrontInfo label="Iniciativas asociadas" value={`${item.initiativesCount}`} />
            <FrontInfo label="Siguiente accion" value={item.nextActionLabel} />
          </div>

          <button
            onClick={() => onNavigate(item.actionPath)}
            className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors hover:bg-slate-100"
            style={{ fontWeight: 700 }}
          >
            {item.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}

function FrontInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
