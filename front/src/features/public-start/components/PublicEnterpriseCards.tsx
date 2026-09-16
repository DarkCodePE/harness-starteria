import React from 'react';
import { BarChart3, Building2, Calendar } from 'lucide-react';

const ENTERPRISE_CARDS = [
  {
    title: 'Dar trazabilidad a mi portafolio de iniciativas',
    icon: BarChart3,
  },
  {
    title: 'Alinear objetivos estratégicos, retos e iniciativas',
    icon: Building2,
  },
];

export function PublicEnterpriseCards() {
  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base text-slate-950" style={{ fontWeight: 760 }}>
            ¿Quieres usar Starteria para una empresa o equipo?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Coordina retos, iniciativas y decisiones sin perder el hilo entre equipos.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm text-white transition-colors hover:bg-slate-800"
          style={{ fontWeight: 700 }}
        >
          <Calendar size={15} />
          Agendar demo enterprise
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {ENTERPRISE_CARDS.map(card => (
          <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
              <card.icon size={17} />
            </div>
            <p className="text-sm text-slate-800" style={{ fontWeight: 700 }}>{card.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
