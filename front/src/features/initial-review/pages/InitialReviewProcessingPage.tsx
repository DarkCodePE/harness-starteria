import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { generateInitialReviewOutput } from '../domain/mockGenerator';
import { getInitialReview, saveInitialReviewOutput, updateInitialReview } from '../services/initialReviewStorage';

const STEPS = [
  'Entendiendo que quieres mover.',
  'Detectando tipo de reto.',
  'Revisando claridad y faltantes.',
  'Preparando mirada critica.',
  'Construyendo ruta de avance.',
];

export function InitialReviewProcessingPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const review = reviewId ? getInitialReview(reviewId) : null;

  const run = () => {
    if (!reviewId) return;
    const current = getInitialReview(reviewId);
    if (!current) {
      setError('No encontramos esta revision inicial.');
      return;
    }

    setError(null);
    updateInitialReview(reviewId, { status: 'processing' });
    setActiveStep(0);

    STEPS.forEach((_, index) => {
      window.setTimeout(() => setActiveStep(index + 1), 260 * (index + 1));
    });

    window.setTimeout(() => {
      try {
        const latest = getInitialReview(reviewId);
        if (!latest) throw new Error('INITIAL_REVIEW_NOT_FOUND');
        const output = generateInitialReviewOutput(latest);
        saveInitialReviewOutput(reviewId, output);
        navigate(`/initial-reviews/${reviewId}`);
      } catch {
        updateInitialReview(reviewId, { status: 'failed' });
        setError('No pudimos generar la revision. Puedes reintentar sin perder tu texto.');
      }
    }, 1600);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  if (!review) {
    return (
      <div className="p-6 text-center text-slate-500">
        Revision no encontrada.
        <button onClick={() => navigate('/initiatives/new')} className="ml-2 text-indigo-600">Crear otra</button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Loader2 size={22} className="animate-spin" />
          </div>
          <h1 className="text-xl text-slate-950" style={{ fontWeight: 800 }}>Preparando tu revision inicial</h1>
          <p className="mt-2 text-sm text-slate-500">Estamos ordenando la propuesta antes de crear cualquier iniciativa.</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const done = activeStep > index;
            const active = activeStep === index;
            return (
              <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-400'}`}>
                  {done ? <CheckCircle2 size={15} /> : active ? <Loader2 size={14} className="animate-spin" /> : index + 1}
                </span>
                <p className="text-sm text-slate-700" style={{ fontWeight: done || active ? 700 : 500 }}>{step}</p>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={run}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white"
              style={{ fontWeight: 700 }}
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
