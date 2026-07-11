/**
 * InitiativeReviewResultPage - revision guiada API-backed.
 * Muestra el snapshot real, permite responder preguntas/agregar contexto y confirma
 * la ruta para crear la iniciativa Draft antes de aterrizar en Overview.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  addContext,
  confirmRoute,
  getReview,
  saveStrategicAnswers,
  type InitiativeReview,
} from '../services/initiativeReviewClient';
import { trackInitialReviewEvent } from '../services/initialReviewTelemetry';
import {
  UnderstandingSummaryCard,
  ChallengeTypeCard,
  CritiqueCard,
  QuestionsCard,
  ImprovedProposalCard,
  RoutePreviewCard,
} from '../components/ReviewCards';

export function InitiativeReviewResultPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<InitiativeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [contextText, setContextText] = useState('');
  const [addingContext, setAddingContext] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!reviewId) return;
    (async () => {
      try {
        const r = await getReview(reviewId);
        if (!cancelled) {
          setReview(r);
          if (r.snapshot) {
            trackInitialReviewEvent('initial_review_generated', {
              reviewId: r.id,
              snapshotId: r.snapshot.id,
              snapshotVersion: r.snapshot.version,
            });
          }
        }
      } catch {
        if (!cancelled) setError('No pudimos cargar la revision.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  const onAddContext = async () => {
    if (!reviewId || !contextText.trim() || addingContext) return;
    setAddingContext(true);
    setError(null);
    try {
      const next = await addContext(reviewId, contextText.trim());
      setReview(next);
      setContextText('');
      trackInitialReviewEvent('initial_review_context_added', {
        reviewId,
        snapshotId: next.snapshot?.id,
        snapshotVersion: next.snapshot?.version,
        contextCount: next.addedContext.length,
      });
    } catch {
      setError('No pudimos agregar ese contexto. Intenta nuevamente.');
    } finally {
      setAddingContext(false);
    }
  };

  const onAnswerQuestion = async (questionId: string, answer: string, unknown = false) => {
    if (!reviewId || answeringQuestionId) return;
    setAnsweringQuestionId(questionId);
    setError(null);
    try {
      const next = await saveStrategicAnswers(reviewId, [{ id: questionId, ...(unknown ? { unknown: true } : { answer }) }]);
      setReview(next);
      trackInitialReviewEvent('initial_review_question_answered', {
        reviewId,
        questionId,
        unknown,
        snapshotId: next.snapshot?.id,
        snapshotVersion: next.snapshot?.version,
      });
    } catch {
      setError('No pudimos guardar la respuesta. Intenta nuevamente.');
    } finally {
      setAnsweringQuestionId(null);
    }
  };

  const onConfirm = async () => {
    if (!reviewId || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmRoute(reviewId);
      trackInitialReviewEvent('initial_review_route_confirmed', {
        reviewId,
        initiativeId: result.initiativeId,
        snapshotId: review?.snapshot?.id,
        snapshotVersion: review?.snapshot?.version,
      });
      navigate(result.overviewUrl);
    } catch {
      trackInitialReviewEvent('initial_review_route_confirm_failed', { reviewId });
      setError('No pudimos crear la iniciativa. Intenta nuevamente.');
      setConfirming(false);
    }
  };

  if (loading) return <div role="status" className="p-8 text-slate-500">Revisando tu propuesta...</div>;
  if (error && !review) return <div role="alert" className="p-8 text-red-600">{error}</div>;
  if (!review?.snapshot) return <div role="alert" className="p-8 text-red-600">La revision aun no esta lista.</div>;

  const snapshot = review.snapshot;

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Revisemos tu iniciativa antes de empezar</h1>

      <div className="mt-6 grid gap-4">
        <UnderstandingSummaryCard snapshot={snapshot} />
        <ChallengeTypeCard snapshot={snapshot} />
        <CritiqueCard snapshot={snapshot} />
        <QuestionsCard snapshot={snapshot} answeringQuestionId={answeringQuestionId} onAnswer={onAnswerQuestion} />
        <ImprovedProposalCard snapshot={snapshot} />
        <RoutePreviewCard snapshot={snapshot} />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Agregar contexto antes de confirmar</h2>
        <p className="mt-2 text-sm text-slate-600">
          Si falta informacion clave, agrega restricciones, recursos, alcance o senales esperadas. Starteria regenerara el snapshot y mantendra historial.
        </p>
        <textarea
          aria-label="Agregar contexto antes de confirmar"
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          rows={3}
          placeholder="Ejemplo: solo tenemos dos semanas, el equipo disponible es de operaciones y legal debe aprobar cambios."
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
        <button
          type="button"
          onClick={onAddContext}
          disabled={!contextText.trim() || addingContext}
          className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addingContext ? 'Actualizando revision...' : 'Actualizar revision'}
        </button>
      </section>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {confirming ? 'Creando tu iniciativa...' : 'Estoy de acuerdo con esta ruta'}
      </button>
    </div>
  );
}
