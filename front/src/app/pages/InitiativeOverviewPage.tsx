/**
 * InitiativeOverviewPage — IR-F2 (ADR-025, PRD §12).
 *
 * Pantalla de transición POST-confirmación: tras aceptar la ruta, el usuario aterriza
 * aquí (no en Step 0). Confirma que la iniciativa fue creada (Draft), muestra el mapa
 * Step 0–4 (Step 0 activo, 1–4 bloqueados), un resumen de la revisión inicial (desde
 * el prefill en step0Data) y el CTA "Empezar Step 0".
 *
 * Independiente del scaffold de #122: lee el Project real vía projectService.getById
 * (que consume la API verificada IR-B2/B4). No aprueba Step 0 (AC-OV-008).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getById } from '../services/projectService';
import { trackInitialReviewEvent } from '../../features/initiative-review/services/initialReviewTelemetry';

const ROUTE_STEPS = [
  { n: 0, name: 'Ordenar contexto' },
  { n: 1, name: 'Definir y validar foco' },
  { n: 2, name: 'Diseñar apuesta' },
  { n: 3, name: 'Probar y aprender' },
  { n: 4, name: 'Presentar propuesta' },
];

const CHALLENGE_TYPE_LABEL: Record<string, string> = {
  correction: 'Corrección',
  growth: 'Crecimiento',
  exploration: 'Exploración',
};

export function InitiativeOverviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) return;
    (async () => {
      try {
        const p = await getById(projectId);
        if (!cancelled) {
          setProject(p);
          trackInitialReviewEvent('initial_review_overview_viewed', {
            initiativeId: projectId,
            snapshotId: p?.initialReviewSnapshotId,
          });
        }
      } catch {
        if (!cancelled) setError('No pudimos cargar tu iniciativa. Intenta nuevamente.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return <div role="status" className="p-8 text-slate-500">Cargando tu iniciativa…</div>;
  }
  if (error || !project) {
    return <div role="alert" className="p-8 text-red-600">{error ?? 'Iniciativa no encontrada.'}</div>;
  }

  const prefill = (project.step0Data ?? {}) as Record<string, any>;
  const pending = Array.isArray(prefill.pendingQuestions) ? prefill.pendingQuestions : [];
  const challengeType = typeof prefill.challengeType === 'string' ? prefill.challengeType : undefined;

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Tu iniciativa está lista para empezar</h1>
        <p className="mt-2 flex items-center gap-2 text-slate-700">
          <span className="font-medium">{project.name}</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Estado: Draft
          </span>
        </p>
        <p className="mt-3 max-w-prose text-sm text-slate-500">
          Starteria ya revisó tu propuesta y preparó una ruta inicial. El siguiente paso es completar el
          Step 0 para aterrizar contexto, alcance, actores y condiciones reales.
        </p>
      </header>

      <section aria-label="Ruta Step 0–4" className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ruta Step 0–4</h2>
        <ol className="mt-3 grid gap-2">
          {ROUTE_STEPS.map((s) => {
            const active = s.n === 0;
            return (
              <li
                key={s.n}
                data-testid={`overview-step-${s.n}`}
                data-state={active ? 'active' : 'locked'}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                  active ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <span>
                  <span className="font-semibold">Step {s.n}</span> — {s.name}
                </span>
                <span className="text-xs font-medium">{active ? 'Activo' : 'Bloqueado'}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-slate-400">
          Cada step se desbloqueará cuando completes el paso anterior con los mínimos necesarios.
        </p>
      </section>

      <section aria-label="Resumen de revisión inicial" className="mt-6 grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resumen de la revisión inicial</h2>
        {challengeType && (
          <p className="text-sm text-slate-700">
            <span className="font-medium">Tipo de reto:</span> {CHALLENGE_TYPE_LABEL[challengeType] ?? challengeType}
          </p>
        )}
        {prefill.mainRisk && (
          <p className="text-sm text-slate-700">
            <span className="font-medium">Riesgo principal:</span> {prefill.mainRisk}
          </p>
        )}
        {prefill.contextInitial && (
          <p className="text-sm text-slate-700">
            <span className="font-medium">Contexto:</span> {prefill.contextInitial}
          </p>
        )}
        {pending.length > 0 && (
          <p className="text-sm text-slate-700">
            <span className="font-medium">Preguntas pendientes:</span> {pending.length} pasan al Step 0.
          </p>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            trackInitialReviewEvent('initial_review_step0_started', {
              initiativeId: projectId,
              snapshotId: project.initialReviewSnapshotId,
            });
            navigate(`/projects/${projectId}/step/0`);
          }}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Empezar Step 0
        </button>
      </div>
    </div>
  );
}
