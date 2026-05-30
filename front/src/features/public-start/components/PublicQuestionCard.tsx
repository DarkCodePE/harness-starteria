import React from 'react';
import { Sparkles } from 'lucide-react';

export type PublicEditorQuestionStatus = 'review' | 'missing' | 'confirmed' | 'ai_refined' | 'suggestion_available';

const STATUS_COPY: Record<PublicEditorQuestionStatus, { label: string; className: string }> = {
  review: { label: 'Revisar', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  missing: { label: 'Falta aclarar', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confirmado', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  ai_refined: { label: 'Mejorado con IA', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  suggestion_available: { label: 'Sugerencia disponible', className: 'border-violet-200 bg-violet-50 text-violet-700' },
};

interface PublicQuestionCardProps {
  id: string;
  label: string;
  helper: string;
  value: string;
  status: PublicEditorQuestionStatus;
  onChange: (value: string) => void;
  onSuggest: () => void;
}

export function PublicQuestionCard({
  id,
  label,
  helper,
  value,
  status,
  onChange,
  onSuggest,
}: PublicQuestionCardProps) {
  const statusCopy = STATUS_COPY[status];

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <label htmlFor={id} className="text-sm text-slate-950" style={{ fontWeight: 750 }}>
            {label}
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusCopy.className}`} style={{ fontWeight: 750 }}>
          {statusCopy.label}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={id === 'proposalTitle' ? 2 : 4}
        className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onSuggest}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 transition-colors hover:bg-violet-100"
          style={{ fontWeight: 750 }}
        >
          <Sparkles size={13} />
          Ajustar este punto con IA
        </button>
      </div>
    </article>
  );
}
