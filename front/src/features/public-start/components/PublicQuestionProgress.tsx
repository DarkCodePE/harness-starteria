import React from 'react';

interface PublicQuestionProgressProps {
  completed: number;
  total: number;
  missingLabels: string[];
}

export function PublicQuestionProgress({ completed, total, missingLabels }: PublicQuestionProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-900" style={{ fontWeight: 700 }}>Progreso de la propuesta</span>
        <span className="text-indigo-600" style={{ fontWeight: 800 }}>{completed}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
      {missingLabels.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Falta responder</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{missingLabels.join(', ')}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-emerald-600" style={{ fontWeight: 700 }}>
          Ya tienes la base mínima para terminar la propuesta.
        </p>
      )}
    </div>
  );
}
