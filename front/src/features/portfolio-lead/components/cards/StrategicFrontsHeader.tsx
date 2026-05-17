import React from 'react';

export function StrategicFrontsHeader({
  actionLabel,
  onAction,
}: {
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fff6d8_0%,#ffffff_54%,#edf4eb_100%)] p-6 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs text-amber-800" style={{ fontWeight: 700 }}>FRENTES ESTRATEGICOS</p>
          <h1 className="mt-2 text-3xl text-slate-950" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            Frentes estrategicos
          </h1>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            Convierte prioridades del negocio en retos accionables e iniciativas trazables.
          </p>
        </div>

        <button
          onClick={onAction}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white transition-colors hover:bg-slate-800"
          style={{ fontWeight: 700 }}
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
