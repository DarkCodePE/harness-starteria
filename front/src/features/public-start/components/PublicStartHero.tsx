import React from 'react';
import { ArrowDown, CheckCircle2, CircleDashed, Sparkles } from 'lucide-react';
import { Badge } from '../../../app/components/ui/badge';
import { PUBLIC_START_COPY } from '../domain/copy';

export function PublicStartHero() {
  return (
    <section className="max-w-3xl">
      <Badge variant="secondary" className="mb-4 gap-1.5 border-indigo-100 bg-white/80 shadow-sm">
        <Sparkles size={12} />
        Entrada publica
      </Badge>
      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] text-slate-950 md:text-6xl">
        {PUBLIC_START_COPY.headline}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
        {PUBLIC_START_COPY.subtitle}
      </p>
    </section>
  );
}

const FLOW = ['Strategic Priority', 'Challenge', 'Initiatives', 'Evidence', 'Decision'];

export function PublicStarteriaPreview() {
  return (
    <aside className="relative overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 p-5 text-white shadow-2xl shadow-indigo-950/20 md:p-6">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-200">Ejemplo de lectura Starteria</p>
            <h2 className="mt-2 text-2xl font-semibold">Portfolio</h2>
          </div>
          <Badge variant="secondary" className="border-white/10 bg-white/10 text-white">
            Ilustrativo
          </Badge>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/7 p-4">
          <p className="text-xs text-slate-400">Strategic outcome</p>
          <p className="mt-1 text-lg font-semibold">Crecimiento PyME</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Prioridad conectada con retos, iniciativas y evidencia antes de preparar una decision.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {FLOW.map((item, index) => (
            <div key={item}>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item}</p>
                  <p className="text-xs text-slate-400">{previewDescription(item)}</p>
                </div>
                {index < 3 ? <CircleDashed size={16} className="text-cyan-200" /> : <CheckCircle2 size={16} className="text-cyan-200" />}
              </div>
              {index < FLOW.length - 1 ? (
                <div className="flex h-5 items-center pl-7 text-cyan-200">
                  <ArrowDown size={14} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-sm font-semibold text-cyan-100">Starteria contextual insight</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            La decision no depende solo de actividad: falta revisar cobertura, evidencia y siguiente movimiento.
          </p>
        </div>
      </div>
    </aside>
  );
}

function previewDescription(item: string) {
  switch (item) {
    case 'Strategic Priority':
      return 'Que se quiere mover';
    case 'Challenge':
      return 'Donde actuar';
    case 'Initiatives':
      return 'Trabajo conectado';
    case 'Evidence':
      return 'Que sabemos';
    default:
      return 'Que habilita avanzar';
  }
}
