import React from 'react';
import { ArrowRight, Eye, Loader2 } from 'lucide-react';
import { PUBLIC_START_COPY } from '../domain/copy';
import { PUBLIC_START_EXAMPLES, PublicExampleChips } from './PublicExampleChips';
import { PublicUploadButton } from './PublicUploadButton';

interface PublicQuickInputProps {
  value: string;
  notice: string | null;
  loading?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onUploadUnavailable: () => void;
}

const MIN_INPUT_LENGTH = 30;

export function PublicQuickInput({
  value,
  notice,
  loading = false,
  onChange,
  onSubmit,
  onUploadUnavailable,
}: PublicQuickInputProps) {
  const remaining = Math.max(0, MIN_INPUT_LENGTH - value.trim().length);
  const canSubmit = remaining === 0 && !loading;

  return (
    <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 md:p-5">
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-3">
        <label htmlFor="public-start-input" className="sr-only">
          Describe tu idea inicial
        </label>
        <textarea
          id="public-start-input"
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={5}
          placeholder="Ej. Quiero reducir el tiempo que toma aprobar solicitudes internas porque hoy se pierde seguimiento entre áreas."
          className="min-h-[150px] w-full resize-none border-0 bg-transparent px-3 py-3 text-base leading-7 text-slate-900 outline-none placeholder:text-slate-400"
        />

        <div className="flex flex-col gap-3 border-t border-slate-200 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-xs ${remaining === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {remaining === 0 ? 'Listo para armar un borrador editable.' : `Escribe ${remaining} caracteres más para continuar.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <PublicUploadButton onUnavailable={onUploadUnavailable} />
            <button
              type="button"
              onClick={() => onChange(PUBLIC_START_EXAMPLES[0])}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-50"
              style={{ fontWeight: 750 }}
            >
              <Eye size={14} />
              Ver ejemplo guiado
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontWeight: 800 }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Armando borrador...
                </>
              ) : (
                <>
                  {PUBLIC_START_COPY.createFirstDraft}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {notice}
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs uppercase text-slate-400" style={{ fontWeight: 800, letterSpacing: '0.08em' }}>
          Prueba con una iniciativa concreta
        </p>
        <PublicExampleChips onSelect={onChange} />
      </div>
    </section>
  );
}
