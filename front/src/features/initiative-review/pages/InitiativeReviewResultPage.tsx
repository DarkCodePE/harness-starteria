/**
 * InitiativeReviewResultPage — IR-F1/F3 (ADR-025, PRD Pantalla 3). Revisión guiada:
 * los 6 bloques (Understanding + ChallengeType + Critique + Questions + Proposal + Route)
 * desde el snapshot REAL, y el CTA "Estoy de acuerdo con esta ruta" → confirm-route
 * (crea la iniciativa) → Overview. Todo contra las APIs verificadas IR-B2/B4.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getReview, confirmRoute, type InitiativeReview } from '../services/initiativeReviewClient';
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

  useEffect(() => {
    let cancelled = false;
    if (!reviewId) return;
    (async () => {
      try {
        const r = await getReview(reviewId);
        if (!cancelled) setReview(r);
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

  const onConfirm = async () => {
    if (!reviewId || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmRoute(reviewId);
      navigate(result.overviewUrl); // → /initiatives/:id/overview (no directo a Step 0)
    } catch {
      setError('No pudimos crear la iniciativa. Intenta nuevamente.');
      setConfirming(false);
    }
  };

  if (loading) return <div role="status" className="p-8 text-slate-500">Revisando tu propuesta…</div>;
  if (error && !review) return <div role="alert" className="p-8 text-red-600">{error}</div>;
  if (!review?.snapshot) return <div role="alert" className="p-8 text-red-600">La revisión aún no está lista.</div>;

  const snapshot = review.snapshot;

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Revisemos tu iniciativa antes de empezar</h1>

      <div className="mt-6 grid gap-4">
        <UnderstandingSummaryCard snapshot={snapshot} />
        <ChallengeTypeCard snapshot={snapshot} />
        <CritiqueCard snapshot={snapshot} />
        <QuestionsCard snapshot={snapshot} />
        <ImprovedProposalCard snapshot={snapshot} />
        <RoutePreviewCard snapshot={snapshot} />
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {confirming ? 'Creando tu iniciativa…' : 'Estoy de acuerdo con esta ruta'}
      </button>
    </div>
  );
}
