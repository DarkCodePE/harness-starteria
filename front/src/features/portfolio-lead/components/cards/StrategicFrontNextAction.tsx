import React from 'react';

export function StrategicFrontNextAction({
  title = 'Siguiente accion recomendada',
  description,
  actionLabel,
  onAction,
  compact = false,
}: {
  title?: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${compact ? 'border-slate-200 bg-white p-4' : 'border-amber-200 bg-amber-50 p-5'}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className={`text-xs ${compact ? 'text-slate-500' : 'text-amber-800'}`} style={{ fontWeight: 700 }}>
            {title}
          </p>
          <p className={`mt-2 text-sm ${compact ? 'text-slate-600' : 'text-amber-950'}`} style={{ fontWeight: compact ? 500 : 700 }}>
            {description}
          </p>
        </div>
        <button
          onClick={onAction}
          className={`rounded-2xl px-4 py-3 text-sm transition-colors ${compact ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          style={{ fontWeight: 700 }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
