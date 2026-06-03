import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Loader2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import {
  getPendingPilotClaim,
  clearPendingPilotClaim,
  consumePilotClaim,
} from '../../features/public-start/services/publicPilotLeadService';

/**
 * Authenticated landing for the pilot-claim flow (ADR-018). Reached right after
 * the user signs in / signs up with a pending pilot claim. It consumes the claim
 * (server creates the Project from the pilot proposal) and redirects into the
 * project workspace. Idempotent: consuming twice returns the same project.
 */
export function ContinuePilotPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode's double-invoke (consume is idempotent anyway).
    if (ranRef.current) return;
    ranRef.current = true;

    const claim = getPendingPilotClaim();
    if (!claim) {
      navigate('/dashboard', { replace: true });
      return;
    }

    (async () => {
      try {
        const { projectId } = await consumePilotClaim(claim.claimToken);
        clearPendingPilotClaim();
        navigate(`/projects/${projectId}`, { replace: true });
      } catch (err) {
        clearPendingPilotClaim();
        if (axios.isAxiosError(err) && err.response?.status === 410) {
          setError('Tu enlace de continuación expiró. Vuelve a ingresar tu código.');
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('No encontramos tu solicitud. Vuelve a ingresar tu código.');
        } else {
          setError('No pudimos crear tu proyecto ahora mismo. Inténtalo de nuevo en un momento.');
        }
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <section className="mx-auto mt-12 max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle size={22} />
        </div>
        <h1 className="text-xl text-slate-950" style={{ fontWeight: 850 }}>No pudimos continuar tu iniciativa</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{error}</p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/public/continuar')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-indigo-700"
            style={{ fontWeight: 850 }}
          >
            <KeyRound size={15} />
            Ingresar mi código
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeft size={14} />
            Ir al dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-16 flex max-w-lg flex-col items-center text-center">
      <Loader2 size={28} className="animate-spin text-indigo-600" />
      <h1 className="mt-5 text-xl text-slate-950" style={{ fontWeight: 850 }}>Creando tu proyecto…</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Estamos preparando tu iniciativa del piloto en tu espacio de trabajo.
      </p>
    </section>
  );
}
