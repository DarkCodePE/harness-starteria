import React, { useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const remaining = Math.max(0, MIN_INPUT_LENGTH - value.trim().length);
  const canSubmit = remaining === 0 && !loading;

  const focusInput = () => {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const selectExample = (example: string) => {
    onChange(example);
    focusInput();
  };

  return (
    <section className="mx-auto w-full max-w-[980px]">
      <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/70 px-4 py-4 md:px-5 md:py-5">
          <label htmlFor="public-start-input" className="sr-only">
            Describe tu idea inicial
          </label>
          <textarea
            ref={textareaRef}
            id="public-start-input"
            value={value}
            onChange={event => onChange(event.target.value)}
            rows={5}
            placeholder="Ej. Quiero reducir el tiempo de aprobación de solicitudes internas porque hoy se pierde seguimiento entre áreas."
            className="min-h-[140px] w-full resize-none border-0 bg-transparent px-1 py-1 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400 md:min-h-[170px] md:text-lg"
          />

          <div className="mt-3 border-t border-slate-200/80 pt-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <PublicUploadButton onUnavailable={onUploadUnavailable} />
                <button
                  type="button"
                  onClick={() => selectExample(PUBLIC_START_EXAMPLES[0])}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm shadow-slate-200/60 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                  style={{ fontWeight: 720 }}
                >
                  <Eye size={14} />
                  Ver ejemplo guiado
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <p className={`text-xs leading-5 sm:max-w-[190px] ${remaining === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {remaining === 0 ? 'Listo para continuar.' : `${remaining} caracteres más para continuar.`}
                </p>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)] transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-200 disabled:text-violet-700 disabled:shadow-none sm:w-auto sm:min-w-[238px]"
                  style={{ fontWeight: 850 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creando propuesta...
                    </>
                  ) : (
                    <>
                      <span>{PUBLIC_START_COPY.createFirstDraft}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            {notice}
          </div>
        )}
      </div>

      <div className="mx-auto mt-4">
        <PublicExampleChips onSelect={selectExample} />
      </div>
    </section>
  );
}
