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

// ADR-026: cards del snapshot que el diff del backend puede marcar como cambiadas.
export type SnapshotSectionId =
  | 'understanding'
  | 'challengeType'
  | 'critique'
  | 'questions'
  | 'improvedProposal'
  | 'routePreview';

// ADR-026 (IRC-01): un turno persistido de la conversación del asistente.
export interface ChatEvent {
  id: string;
  role: 'assistant' | 'user' | 'system';
  kind: 'guide' | 'answer' | 'context' | 'doubt' | 'diff_announcement' | 'confirm';
  payload: {
    text?: string;
    questionId?: string;
    answer?: string | null;
    unknown?: boolean;
    changedSections?: SnapshotSectionId[];
    [k: string]: unknown;
  };
  snapshotVersion: number | null;
  createdAt: string;
}

export interface InitiativeReview {
  id: string;
  status: string;
  originalInput: string;
  addedContext: string[];
  challengeId: string | null;
  companyContext?: { companyId: string; areaId?: string } | null;
  snapshot: ReviewSnapshot | null;
  chatEvents?: ChatEvent[]; // ADR-026 (IRC-01): historial rehidratado en GET
  changedSections?: SnapshotSectionId[]; // ADR-026 (IRC-02): devuelto por add-context/strategic-answers
}

export interface ConfirmRouteResult {
  routeConfirmationId: string;
  initiativeId: string;
  overviewUrl: string;
}

export async function createReview(
  originalInput: string,
  addedContext: string[] = [],
  companyContext?: { companyId: string; areaId?: string } | null,
): Promise<InitiativeReview> {
  const payload = {
    originalInput,
    ...(addedContext.length > 0 ? { addedContext } : {}),
    ...(companyContext?.companyId ? { companyContext } : {}),
  };
  const { data } = await api.post<ApiEnvelope<InitiativeReview>>('/initial-reviews', payload);
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
