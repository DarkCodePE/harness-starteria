import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { createPublicDraftFromInput } from '../../../features/public-start/services/publicDraftService';

const PUBLIC_START_INPUT_KEY = 'starteria.publicStart.inputText';
const MIN_INPUT_LENGTH = 30;

export function PublicInitiativeStartPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'empty'>('loading');

  useEffect(() => {
    const inputText = (window.sessionStorage.getItem(PUBLIC_START_INPUT_KEY) ?? '').trim();
    if (inputText.length < MIN_INPUT_LENGTH) {
      setStatus('empty');
      return;
    }

    const timeout = window.setTimeout(() => {
      const draft = createPublicDraftFromInput(inputText);
      navigate(`/public/draft/${draft.id}/edit`, { replace: true });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [navigate]);

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Loader2 size={22} className="animate-spin" />
        </div>
        <h1 className="text-2xl text-slate-950" style={{ fontWeight: 800 }}>Armando tu primer borrador...</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Te llevaremos directo al editor para completar la propuesta.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <AlertCircle size={22} />
      </div>
      <h1 className="text-2xl text-slate-950" style={{ fontWeight: 800 }}>
        Primero escribe una idea, problema u oportunidad para crear tu propuesta.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        Esta pantalla queda solo como respaldo. La experiencia principal comienza desde el compositor público.
      </p>
      <button
        type="button"
        onClick={() => navigate('/public/start')}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700"
        style={{ fontWeight: 800 }}
      >
        <ArrowLeft size={15} />
        Volver a empezar
      </button>
    </section>
  );
}
