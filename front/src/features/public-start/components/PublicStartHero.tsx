import React from 'react';
import { Sparkles } from 'lucide-react';
import { PUBLIC_START_COPY } from '../domain/copy';

export function PublicStartHero() {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs text-indigo-700 shadow-sm">
        <Sparkles size={13} />
        <span style={{ fontWeight: 750 }}>Creador público con IA</span>
      </div>
      <h1 className="text-4xl text-slate-950 md:text-6xl" style={{ fontWeight: 820, lineHeight: 1.02 }}>
        {PUBLIC_START_COPY.headline}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
        Describe una oportunidad, problema o idea. Starteria la ordena en una propuesta clara para presentarla, validarla o seguir desarrollándola.
      </p>
    </section>
  );
}
