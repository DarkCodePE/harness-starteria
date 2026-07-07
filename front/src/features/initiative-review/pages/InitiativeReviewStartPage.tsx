/**
 * InitiativeReviewStartPage — IR-F1/F3 (ADR-025, PRD Pantalla 1). Entrada inicial:
 * el usuario describe su idea → crea la revisión vía API real → navega al Result.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createReview } from '../services/initiativeReviewClient';

export function InitiativeReviewStartPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = input.trim().length >= 10 && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const review = await createReview(input.trim());
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
        placeholder="Describe lo que quieres hacer…"
        className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
      />

      <p className="mt-1 text-xs text-slate-400">
        Evita subir información sensible o confidencial en esta etapa.
      </p>

      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Revisando…' : 'Revisar mi propuesta'}
      </button>
    </div>
  );
}
