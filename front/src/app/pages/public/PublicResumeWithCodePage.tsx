import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import {
  resumeWithPilotCode,
  trackPilotInterestEvent,
} from '../../../features/public-start/services/publicPilotLeadService';

const PILOT_CODE_REGEX = /^ST-PILOT-[A-Z0-9]{4}$/;

/**
 * Public "continue with your code" entry: the applicant types the
 * `ST-PILOT-XXXX` code from their confirmation email to resume their
 * initiative. On success we rehydrate the one-pager into a fresh draft and
 * route into the existing `/auth/continue/:draftId` flow.
 */
export function PublicResumeWithCodePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<{ name: string } | null>(null);

  const normalized = code.trim().toUpperCase();
  const isValid = PILOT_CODE_REGEX.test(normalized);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await resumeWithPilotCode(normalized);
      trackPilotInterestEvent('pilot_interest_started', { source: 'resume_code', pilotCode: result.pilotCode });

      if (result.draftId) {
        navigate(`/auth/continue/${result.draftId}`);
        return;
      }
      // Lead found but the proposal snapshot wasn't recoverable (legacy capture).
      setRecovered({ name: result.name });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('No encontramos ese código. Revisa que esté completo (ST-PILOT-XXXX) y vuelve a intentar.');
      } else if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError('El código no tiene el formato esperado (ST-PILOT-XXXX).');
      } else {
        setError('No pudimos recuperar tu iniciativa ahora mismo. Inténtalo de nuevo en un momento.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (recovered) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle size={22} />
        </div>
        <h1 className="text-2xl text-slate-950" style={{ fontWeight: 850 }}>
          Encontramos tu postulación, {recovered.name}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Tu código es válido, pero esta postulación no guardó una copia de la propuesta para retomarla
          automáticamente. Puedes crear una nueva propuesta — será rápido.
        </p>
        <button
          type="button"
          onClick={() => navigate('/public/start')}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700"
          style={{ fontWeight: 850 }}
        >
          <ArrowRight size={15} />
          Crear nueva propuesta
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <KeyRound size={22} />
      </div>
      <h1 className="text-center text-2xl text-slate-950" style={{ fontWeight: 850 }}>
        Continúa tu iniciativa
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-500">
        Ingresa el código de postulación que te enviamos por correo para retomar tu propuesta donde la dejaste.
      </p>

      <form onSubmit={handleSubmit} className="mt-7">
        <label htmlFor="pilot-code" className="block text-sm text-slate-700" style={{ fontWeight: 700 }}>
          Código de postulación
        </label>
        <input
          id="pilot-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoFocus
          placeholder="ST-PILOT-XXXX"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm uppercase tracking-wide text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        {error && (
          <p className="mt-3 flex items-start gap-2 text-sm text-rose-600">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={!isValid || loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          style={{ fontWeight: 850 }}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Recuperando…
            </>
          ) : (
            <>
              <ArrowRight size={15} />
              Continuar
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/public/start')}
        className="mx-auto mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft size={14} />
        Empezar una propuesta nueva
      </button>
    </section>
  );
}
