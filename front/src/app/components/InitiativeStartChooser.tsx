/* ------------------------------------------------------------------ */
/*  InitiativeStartChooser.tsx — Option C first-run "how to start" panel */
/*                                                                       */
/*  Shown on a brand-new initiative (step0Status='No iniciado', 0% de    */
/*  avance) IN PLACE OF the always-on PDF uploader banner. Lets the user */
/*  pick between seeding everything from a document (PDF autofill, fills  */
/*  Pasos 0–4) or building the base manually (Paso 0). Pure/prop-driven   */
/*  so it can be unit-tested in isolation (the parent owns the gating).  */
/* ------------------------------------------------------------------ */

import React from 'react';
import { Sparkles, ClipboardList, Upload, ChevronRight } from 'lucide-react';

export interface InitiativeStartChooserProps {
  /** When false the PDF/IA option is hidden (feature flag off). */
  autofillEnabled: boolean;
  /** "Empezar en blanco" → navigate to the Paso 0 manual form. */
  onChooseManual: () => void;
  /** "Tengo un documento" → reveal the PDF uploader. */
  onChooseUpload: () => void;
}

export function InitiativeStartChooser({
  autofillEnabled,
  onChooseManual,
  onChooseUpload,
}: InitiativeStartChooserProps) {
  return (
    <section
      aria-label="Cómo quieres empezar tu iniciativa"
      className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 mb-6"
    >
      <h2 className="text-lg text-slate-900" style={{ fontWeight: 700 }}>
        ¿Cómo quieres empezar tu iniciativa?
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Puedes partir de un documento y dejar que la IA proponga los campos, o
        construir tu base paso a paso. Podrás cambiar de opción cuando quieras.
      </p>

      <div className={`mt-5 grid gap-3 ${autofillEnabled ? 'sm:grid-cols-2' : ''}`}>
        {autofillEnabled && (
          <button
            type="button"
            onClick={onChooseUpload}
            data-testid="start-option-upload"
            className="group flex h-full flex-col rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Sparkles size={18} />
              </span>
              <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>
                Tengo un documento
              </span>
              <span
                className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700"
                style={{ fontWeight: 600 }}
              >
                Más rápido
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Sube un PDF (plan, propuesta, deck) y un agente IA rellenará los
              Pasos 0–4 con tu evidencia. Tú revisas y confirmas cada campo.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1 text-xs text-amber-700"
              style={{ fontWeight: 600 }}
            >
              <Upload size={13} /> Subir documento
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onChooseManual}
          data-testid="start-option-manual"
          className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <ClipboardList size={18} />
            </span>
            <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>
              Empezar en blanco
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Completa el Paso 0 a tu ritmo con preguntas guiadas. Ideal si aún no
            tienes un documento que resuma tu iniciativa.
          </p>
          <span
            className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-700"
            style={{ fontWeight: 600 }}
          >
            Ir al Paso 0
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </section>
  );
}
