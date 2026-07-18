/**
 * InitiativeReviewResultPage - revisión guiada API-backed.
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
import { AssistantPanel, type ChatMessage } from '../components/chat/AssistantPanel';
import { isInitiativeReviewChatEnabled } from '../../../app/featureFlags';

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
            trackInitialReviewEvent('route_preview_viewed', {
              reviewId: r.id,
              snapshotId: r.snapshot.id,
              snapshotVersion: r.snapshot.version,
            });
          }
        }
      } catch {
        if (!cancelled) setError('No pudimos cargar la revisión.');
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
      trackInitialReviewEvent('route_confirmed', {
        reviewId,
        initiativeId: result.initiativeId,
        snapshotId: review?.snapshot?.id,
        snapshotVersion: review?.snapshot?.version,
      });
      trackInitialReviewEvent('initiative_created_from_route', {
        reviewId,
        initiativeId: result.initiativeId,
        snapshotId: review?.snapshot?.id,
        snapshotVersion: review?.snapshot?.version,
      });
      navigate(result.overviewUrl);
    } catch {
      trackInitialReviewEvent('route_confirm_failed', { reviewId });
      setError('No pudimos crear la iniciativa. Intenta nuevamente.');
      setConfirming(false);
    }
  };

  if (loading) return <div role="status" className="p-8 text-slate-500">Revisando tu propuesta...</div>;
  if (error && !review) return <div role="alert" className="p-8 text-red-600">{error}</div>;
  if (!review?.snapshot) return <div role="alert" className="p-8 text-red-600">La revisión aún no está lista.</div>;

  const snapshot = review.snapshot;
  const chatEnabled = isInitiativeReviewChatEnabled();

  // IRC-03: envío desde el chat. Reutiliza el flujo real de addContext (sin mocks). El
  // orquestador completo (agenda, modos, dudas) llega en IRC-04.
  const onChatSend = async (text: string) => {
    if (!reviewId || addingContext) return;
    setAddingContext(true);
    setError(null);
    try {
      const next = await addContext(reviewId, text);
      setReview(next);
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

  // IRC-03: bienvenida estática. IRC-04 la hará dinámica (agenda + preguntas + historial
  // rehidratado desde review.chatEvents).
  const chatMessages: ChatMessage[] = [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Revisé tu propuesta. Cuéntame lo que falte —restricciones, recursos, alcance o señales esperadas— y actualizaré tu iniciativa. También puedes responder las preguntas estratégicas del panel.',
    },
  ];

  // Contenido de la columna de la iniciativa (izquierda). La sección de "Agregar contexto"
  // por textarea se oculta cuando el chat está activo: el asistente cumple esa función.
  const snapshotColumn = (
    <>
      <div className="grid gap-4">
        <UnderstandingSummaryCard snapshot={snapshot} />
        <ChallengeTypeCard snapshot={snapshot} />
        <CritiqueCard snapshot={snapshot} />
        <QuestionsCard snapshot={snapshot} answeringQuestionId={answeringQuestionId} onAnswer={onAnswerQuestion} />
        <ImprovedProposalCard snapshot={snapshot} />
        <RoutePreviewCard snapshot={snapshot} />
      </div>

      {review.companyContext?.companyId && (
        <section className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-sm font-semibold text-indigo-900">Como influyo el contexto de tu empresa</h2>
          <p className="mt-2 text-sm text-indigo-800">
            Al confirmar esta ruta, Starteria creara un snapshot versionado del contexto de empresa seleccionado y lo usara para ajustar esfuerzo, riesgos, actores, indicadores, viabilidad y lenguaje de la iniciativa.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-indigo-800">
            <li>Informacion considerada: empresa seleccionada, area opcional, fuentes procesadas y version disponible al confirmar.</li>
            <li>Informacion faltante: aprobaciones internas, recursos disponibles y criterios de escalamiento si no han sido completados.</li>
            <li>La informacion agregada aqui no actualiza automaticamente el contexto de empresa.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setContextText('Agregar solo a este analisis: ')}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Agregar solo a este analisis
            </button>
            <a
              href="/companies"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Completar contexto de empresa
            </a>
          </div>
        </section>
      )}

      {!chatEnabled && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Agregar contexto antes de confirmar</h2>
          <p className="mt-2 text-sm text-slate-600">
            Si falta información clave, agrega restricciones, recursos, alcance o señales esperadas. Starteria regenerará el snapshot y mantendrá historial.
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
            {addingContext ? 'Actualizando revisión...' : 'Actualizar revisión'}
          </button>
        </section>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {confirming ? 'Creando tu iniciativa...' : 'Estoy de acuerdo con esta ruta'}
      </button>
    </>
  );

  const heading = <h1 className="text-2xl font-semibold text-slate-900">Revisemos tu iniciativa antes de empezar</h1>;

  // Flag OFF: layout de una columna (comportamiento actual, sin cambios).
  if (!chatEnabled) {
    return (
      <div className="mx-auto max-w-2xl p-6 md:p-8">
        {heading}
        <div className="mt-6">{snapshotColumn}</div>
      </div>
    );
  }

  // Flag ON (ADR-026): iniciativa a la izquierda, asistente a la derecha. En <1024px la
  // columna del asistente se apila debajo (bottom-sheet) con altura propia.
  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      {heading}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        <div className="min-w-0">{snapshotColumn}</div>
        <div className="h-[70vh] lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
          <AssistantPanel messages={chatMessages} onSend={onChatSend} busy={addingContext} />
        </div>
      </div>
    </div>
  );
}
