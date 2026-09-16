import React from 'react';
import { Sparkles } from 'lucide-react';
import { PUBLIC_START_COPY } from '../domain/copy';

export function PublicStartHero() {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white/80 px-3 py-1 text-xs text-violet-700 shadow-sm shadow-violet-100/60">
        <Sparkles size={12} />
        <span style={{ fontWeight: 750 }}>Entrada pública</span>
      </div>
      <h1 className="text-3xl text-slate-950 md:text-[2.65rem]" style={{ fontWeight: 900, lineHeight: 1.05 }}>
        {PUBLIC_START_COPY.headline}
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
        {PUBLIC_START_COPY.subtitle}
      </p>
    </section>
  );
}
