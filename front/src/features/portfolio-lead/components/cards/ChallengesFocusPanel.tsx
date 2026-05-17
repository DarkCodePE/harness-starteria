import React from 'react';
import type { ChallengeFocusRecommendation } from '../../domain/types';

export function ChallengesFocusPanel({
  recommendation,
  onNavigate,
}: {
  recommendation: ChallengeFocusRecommendation | null;
  onNavigate: (path: string) => void;
}) {
  if (!recommendation) {
    return (
      <section className="rounded-[32px] border border-slate-900 bg-slate-950 p-6 text-white md:p-8">
        <p className="text-xs text-amber-300" style={{ fontWeight: 700 }}>DONDE ENFOCAR PRIMERO</p>
        <h2 className="mt-2 text-2xl" style={{ fontWeight: 700 }}>Aun no hay retos para priorizar</h2>
        <p className="mt-3 text-sm text-slate-300">Empieza definiendo el primer reto para convertir una prioridad estrategica en trabajo accionable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-slate-900 bg-slate-950 p-6 text-white md:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs text-amber-300" style={{ fontWeight: 700 }}>DONDE ENFOCAR PRIMERO</p>
          <h2 className="mt-2 text-2xl md:text-3xl" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            {recommendation.title}
          </h2>
          <p className="mt-3 text-sm text-slate-300 md:text-base">{recommendation.description}</p>
        </div>

        <button
          onClick={() => onNavigate(recommendation.actionPath)}
          className="rounded-2xl bg-white px-5 py-3 text-sm text-slate-950 transition-colors hover:bg-slate-100"
          style={{ fontWeight: 700 }}
        >
          {recommendation.actionLabel}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DarkMetric label="Frente que activa" value={recommendation.frontName} />
        <DarkMetric label="Por que requiere atencion" value={recommendation.whyItMatters} />
        <DarkMetric label="Que falta" value={recommendation.missingPiece} />
        <DarkMetric label="Riesgo si no actuas" value={recommendation.riskLabel} />
      </div>
    </section>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-300" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-white" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}
