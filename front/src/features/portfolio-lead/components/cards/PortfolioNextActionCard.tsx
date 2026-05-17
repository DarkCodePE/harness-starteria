import React from 'react';
import type { PortfolioNextAction } from '../../domain/types';

export function PortfolioNextActionCard({
  action,
  onNavigate,
}: {
  action: PortfolioNextAction;
  onNavigate: (path: string) => void;
}) {
  const actionPath = action.path ?? '/portfolio/inicio';

  return (
    <section className="rounded-[32px] border border-slate-900 bg-slate-950 p-6 text-white md:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs text-amber-300" style={{ fontWeight: 700 }}>PROXIMA ACCION RECOMENDADA</p>
          <h2 className="mt-2 text-2xl md:text-3xl" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            {action.label}
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
            {action.description}
          </p>
        </div>

        <button
          onClick={() => onNavigate(actionPath)}
          className="rounded-2xl bg-white px-5 py-3 text-sm text-slate-950 transition-colors hover:bg-slate-100"
          style={{ fontWeight: 700 }}
        >
          {action.ctaLabel ?? action.label}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ActionInfoCard label="Contexto" value={action.contextLabel ?? 'Portafolio completo'} />
        <ActionInfoCard label="Impacto esperado" value={action.impactLabel ?? 'Ayuda a mover el portafolio con foco ejecutivo.'} />
        <ActionInfoCard label="Riesgo si no actuas" value={action.riskLabel ?? 'El portafolio puede perder ritmo y claridad.'} />
      </div>
    </section>
  );
}

function ActionInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-300" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-white" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
