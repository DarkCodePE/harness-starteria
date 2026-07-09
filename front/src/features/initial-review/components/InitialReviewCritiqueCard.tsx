import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';
import type { InitialReviewOutput } from '../domain/types';

export function InitialReviewCritiqueCard({ critique }: { critique: InitialReviewOutput['critique'] }) {
  const items = [
    { label: 'Lo solido', value: critique.solid, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Lo debil', value: critique.weak, icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'Lo riesgoso', value: critique.risky, icon: ShieldAlert, tone: 'text-red-700 bg-red-50 border-red-100' },
    { label: 'Conviene ajustar', value: critique.recommendedAdjustment, icon: Wrench, tone: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base text-slate-900" style={{ fontWeight: 800 }}>Mirada critica</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.tone}`}>
            <div className="flex items-center gap-2">
              <item.icon size={16} />
              <p className="text-sm" style={{ fontWeight: 800 }}>{item.label}</p>
            </div>
            <p className="mt-2 text-sm leading-6">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
