import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { InitialReviewOutput } from '../domain/types';

export function InitialReviewRoutePreview({ routePreview }: { routePreview: InitialReviewOutput['routePreview'] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base text-slate-900" style={{ fontWeight: 800 }}>Ruta recomendada Step 0-4</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {routePreview.map(item => (
          <div key={item.step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs text-white" style={{ fontWeight: 800 }}>
              {item.step === 0 ? <CheckCircle2 size={16} /> : item.step}
            </div>
            <p className="text-sm text-slate-900" style={{ fontWeight: 800 }}>Step {item.step}: {item.name}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.whatWillHappen}</p>
            <p className="mt-3 text-xs text-slate-700" style={{ fontWeight: 700 }}>{item.expectedOutput}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
