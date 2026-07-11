/**
 * InitiativeReviewStartPage - entrada previa al Step 0.
 * Crea la revision inicial via API real y navega al resultado guiado.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createReview } from '../services/initiativeReviewClient';
import { trackInitialReviewEvent } from '../services/initialReviewTelemetry';

export function InitiativeReviewStartPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = input.trim().length >= 40 && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const addedContext = context.trim() ? [context.trim()] : [];
      trackInitialReviewEvent('initial_review_started', { source: 'initiatives_new' });
      const review = await createReview(input.trim(), addedContext);
      trackInitialReviewEvent('initial_review_generated', {
        reviewId: review.id,
        snapshotId: review.snapshot?.id,
        snapshotVersion: review.snapshot?.version,
        contextCount: addedContext.length,
      });
      navigate(`/initiatives/review/${review.id}`);
    } catch {
      setError('No pudimos iniciar la revisión. Intenta nuevamente.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">¿Qué iniciativa quieres ordenar?</h1>
      <p className="mt-2 text-sm text-slate-500">
        Describe una idea, problema, oportunidad o proyecto. Starteria lo revisará y te ayudará a convertirlo en una ruta clara.
      </p>

      <label htmlFor="ir-input" className="sr-only">Describe tu iniciativa</label>
      <textarea
        id="ir-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder="Describe lo que quieres hacer..."
        className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
      />

      <label htmlFor="ir-context" className="mt-4 block text-sm font-medium text-slate-700">
        Contexto adicional opcional
      </label>
      <textarea
        id="ir-context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        rows={4}
        placeholder="Agrega restricciones, recursos disponibles, equipo, plazo o información que Starteria deba considerar."
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
      />

      <p className="mt-1 text-xs text-slate-400">
        Escribe al menos 40 caracteres. Evita subir información sensible o confidencial en esta etapa. Los archivos se agregarán cuando el flujo de evidencias esté disponible.
      </p>

      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Revisando...' : 'Revisar mi propuesta'}
      </button>
    </div>
  );
}
