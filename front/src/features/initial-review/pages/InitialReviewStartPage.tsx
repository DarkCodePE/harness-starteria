import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { createInitialReview } from '../services/initialReviewStorage';

const EXAMPLES = [
  'Reducir demoras en el proceso de aprobacion de solicitudes internas',
  'Explorar una nueva forma de aumentar adopcion de clientes activos',
  'Validar si un piloto de onboarding digital puede bajar retrabajo',
];

export function InitialReviewStartPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [contextText, setContextText] = useState('');
  const canSubmit = inputText.trim().length >= 30;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const review = createInitialReview(inputText, contextText);
    navigate(`/initial-reviews/${review.id}/processing`);
  };

  return (
    <div className="min-h-full bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={15} /> Volver al dashboard
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700" style={{ fontWeight: 800 }}>
              <Sparkles size={13} /> Revision inicial guiada
            </span>
            <h1 className="mt-4 text-2xl text-slate-950" style={{ fontWeight: 800 }}>Que iniciativa quieres ordenar?</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Describe una idea, problema, oportunidad o proyecto. Starteria lo revisara y te ayudara a convertirlo en una ruta clara.
            </p>
          </div>

          <label className="block">
            <span className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Describe tu iniciativa</span>
            <textarea
              value={inputText}
              onChange={event => setInputText(event.target.value)}
              rows={7}
              placeholder="Cuenta que quieres mover, que esta pasando hoy y por que podria importar."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map(example => (
              <button
                key={example}
                type="button"
                onClick={() => setInputText(example)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                style={{ fontWeight: 700 }}
              >
                {example}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Mas contexto opcional</span>
            <textarea
              value={contextText}
              onChange={event => setContextText(event.target.value)}
              rows={3}
              placeholder="Area, usuarios afectados, senales que ya viste, restricciones o cualquier dato util."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex gap-3">
              <Lock size={16} className="mt-0.5 shrink-0 text-indigo-600" />
              <p className="text-sm leading-6 text-indigo-800">
                Esta revision es temporal y privada en tu navegador. No se creara una iniciativa hasta que aceptes la ruta recomendada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontWeight: 800 }}
          >
            Revisar mi propuesta
          </button>
          {!canSubmit && (
            <p className="mt-2 text-center text-xs text-slate-400">Escribe al menos 30 caracteres para continuar.</p>
          )}
        </section>
      </div>
    </div>
  );
}
