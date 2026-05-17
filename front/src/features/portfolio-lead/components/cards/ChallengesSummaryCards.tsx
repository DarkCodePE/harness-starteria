import React from 'react';
import type { ChallengesSummary } from '../../domain/types';

export function ChallengesSummaryCards({ summary }: { summary: ChallengesSummary }) {
  const items = [
    ['Total de retos', summary.totalChallenges, 'Base visible de retos del portafolio.'],
    ['Listos para activar', summary.readyToActivate, 'Ya tienen base suficiente para pasar a activacion.'],
    ['Retos activos', summary.activeChallenges, 'Ya estan publicados y deberian generar trabajo visible.'],
    ['Sin cobertura', summary.challengesWithoutCoverage, 'Aun no producen iniciativas asociadas.'],
    ['Cobertura parcial', summary.partialCoverageChallenges, 'Ya avanzan, pero todavia no cubren bien el reto.'],
    ['Con decisiones pendientes', summary.challengesWithPendingDecision, 'Ya tienen casos maduros esperando definicion.'],
    ['Con bloqueos', summary.blockedChallenges, 'Tienen iniciativas trabadas que frenan el avance.'],
  ] as const;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>RESUMEN OPERATIVO</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Lee activacion, cobertura y decisiones desde una sola vista</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cada numero te ayuda a identificar si el reto ya esta listo para activarse, si ya genera cobertura o si necesita una decision.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-3xl text-slate-950" style={{ fontWeight: 700 }}>{value}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
