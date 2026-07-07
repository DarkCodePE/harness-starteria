/**
 * initiativeReviewClient — IR-F3 (ADR-025). Frontend snapshot-REST que consume las
 * APIs reales de la revisión inicial (IR-B2/B4), NO un mock. Contrato canónico (inglés).
 *
 * FE de referencia del backend #128, independiente del scaffold conversacional de #122.
 */
import api from '../../../app/services/api';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export type CanonicalChallengeType = 'correction' | 'growth' | 'exploration';

export interface ReviewSnapshot {
  id: string;
  version: number;
  understandingSummary: string;
  suggestedChallengeType: CanonicalChallengeType;
  selectedChallengeType: CanonicalChallengeType;
  challengeTypeReason: string;
  informationReadiness: string | null;
  critique: { solid: string; weak: string; risky: string; recommendedAdjustment: string; mainRisk?: string };
  strategicQuestions: Array<{ id: string; question: string; options: string[]; allowsUnknown: boolean; answer?: string; status: string }>;
  improvedProposal: { suggestedName: string; improvedDescription: string; initialFocus: string; expectedImpact: string; nextRecommendedStep: string };
  routePreview: Array<{ step: number; name: string; whatWillHappen: string; expectedOutput: string; status: string }>;
}

export interface InitiativeReview {
  id: string;
  status: string;
  originalInput: string;
  addedContext: string[];
  challengeId: string | null;
  snapshot: ReviewSnapshot | null;
}

export interface ConfirmRouteResult {
  routeConfirmationId: string;
  initiativeId: string;
  overviewUrl: string;
}

export async function createReview(originalInput: string): Promise<InitiativeReview> {
  const { data } = await api.post<ApiEnvelope<InitiativeReview>>('/initial-reviews', { originalInput });
  return data.data;
}

export async function getReview(id: string): Promise<InitiativeReview> {
  const { data } = await api.get<ApiEnvelope<InitiativeReview>>(`/initial-reviews/${id}`);
  return data.data;
}

export async function addContext(id: string, context: string): Promise<InitiativeReview> {
  const { data } = await api.post<ApiEnvelope<InitiativeReview>>(`/initial-reviews/${id}/add-context`, { context });
  return data.data;
}

export async function saveStrategicAnswers(
  id: string,
  answers: Array<{ id: string; answer?: string; unknown?: boolean }>,
): Promise<InitiativeReview> {
  const { data } = await api.post<ApiEnvelope<InitiativeReview>>(`/initial-reviews/${id}/strategic-answers`, { answers });
  return data.data;
}

export async function confirmRoute(id: string): Promise<ConfirmRouteResult> {
  const { data } = await api.post<ApiEnvelope<ConfirmRouteResult>>(`/initial-reviews/${id}/confirm-route`, {});
  return data.data;
}
