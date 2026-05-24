import React from 'react';
import { Check, PenLine, X } from 'lucide-react';

export interface PublicAISuggestion {
  questionId: string;
  currentValue: string;
  suggestedValue: string;
  rationale: string;
}

interface PublicAIAssistPanelProps {
  suggestion: PublicAISuggestion | null;
  onApply: () => void;
  onKeep: () => void;
  onEditManually: () => void;
}

export function PublicAIAssistPanel({
  suggestion,
  onApply,
  onKeep,
  onEditManually,
}: PublicAIAssistPanelProps) {
  if (!suggestion) {
    return (
      <aside className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/40 p-5">
        <p className="text-sm text-violet-900" style={{ fontWeight: 750 }}>Sugerencias Starteria</p>
        <p className="mt-2 text-sm leading-6 text-violet-700">
          Usa “Sugerir mejor versión” en cualquier pregunta. La sugerencia no reemplazará tu respuesta hasta que la apliques.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
      <p className="text-sm text-violet-950" style={{ fontWeight: 800 }}>Sugerencia Starteria</p>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs text-violet-700" style={{ fontWeight: 800 }}>Tu respuesta actual</p>
          <p className="mt-1 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-violet-900">
            {suggestion.currentValue || 'Sin respuesta todavía.'}
          </p>
        </div>
        <div>
          <p className="text-xs text-violet-700" style={{ fontWeight: 800 }}>Sugerencia Starteria</p>
          <p className="mt-1 rounded-2xl bg-white p-3 text-sm leading-6 text-violet-950 shadow-sm">
            {suggestion.suggestedValue}
          </p>
        </div>
        <div>
          <p className="text-xs text-violet-700" style={{ fontWeight: 800 }}>Por qué mejora</p>
          <p className="mt-1 text-sm leading-6 text-violet-800">{suggestion.rationale}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-sm text-white transition-colors hover:bg-violet-800"
          style={{ fontWeight: 750 }}
        >
          <Check size={14} />
          Aplicar sugerencia
        </button>
        <button
          type="button"
          onClick={onKeep}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-violet-700 transition-colors hover:bg-violet-100"
          style={{ fontWeight: 750 }}
        >
          <X size={14} />
          Mantener mi versión
        </button>
        <button
          type="button"
          onClick={onEditManually}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-violet-700 transition-colors hover:bg-violet-100"
          style={{ fontWeight: 750 }}
        >
          <PenLine size={14} />
          Editar manualmente
        </button>
      </div>
    </aside>
  );
}
