import axios from 'axios';
import type {
  PortfolioEntryApiEnvelope,
  PortfolioEntryContinuationResult,
  PortfolioEntryConversionResult,
  PortfolioEntrySessionDto,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const ENTRY_TOKEN_HEADER = 'X-Starteria-Entry-Token';
const IDEMPOTENCY_HEADER = 'Idempotency-Key';

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type PortfolioEntryErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'expired'
  | 'rate_limited'
  | 'provider_output'
  | 'mapping_invalid'
  | 'unavailable'
  | 'timeout'
  | 'server_error'
  | 'network'
  | 'unknown';

export type PortfolioEntryApiError = Error & {
  status?: number;
  kind: PortfolioEntryErrorKind;
  retryAfterSeconds?: number;
};

export type CreatePortfolioEntrySessionResponse = {
  session: PortfolioEntrySessionDto;
  publicAccessToken: string;
};

type MutationOptions = {
  expectedRevision: number;
  idempotencyKey: string;
};

export type SubmitPortfolioEntryMessageInput = MutationOptions & {
  message: string;
  matchedQuestionIds?: string[];
  respondedResolves?: string[];
};

export type GuidedExplorationChoiceInput = MutationOptions & {
  choice: 'accept' | 'provisional_route';
};

export type HandoffConfirmationInput = MutationOptions & {
  acceptedFields?: string[];
  rejectedFields?: string[];
  notes?: string;
};

export type HandoffCorrectionInput = HandoffConfirmationInput & {
  correctedFields: Record<string, unknown>;
};

function authHeaders(credential: string, idempotencyKey?: string): Record<string, string> {
  return {
    [ENTRY_TOKEN_HEADER]: credential,
    ...(idempotencyKey ? { [IDEMPOTENCY_HEADER]: idempotencyKey } : {}),
  };
}

function unwrap<T>(response: { data: PortfolioEntryApiEnvelope<T> }): T {
  return response.data.data;
}

export async function createPortfolioEntrySession(): Promise<CreatePortfolioEntrySessionResponse> {
  const response = await publicApi.post<PortfolioEntryApiEnvelope<CreatePortfolioEntrySessionResponse>>(
    '/public/portfolio-entry/sessions',
    { sourceMetadata: { channel: 'public_start_frontend' } },
  );
  return unwrap(response);
}

export async function getPortfolioEntrySession(
  sessionId: string,
  credential: string,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.get<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}`,
    { headers: authHeaders(credential) },
  );
  return unwrap(response);
}

export async function submitPortfolioEntryMessage(
  sessionId: string,
  credential: string,
  input: SubmitPortfolioEntryMessageInput,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.post<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      expectedRevision: input.expectedRevision,
      message: input.message,
      ...(input.matchedQuestionIds?.length ? { matchedQuestionIds: input.matchedQuestionIds } : {}),
      ...(input.respondedResolves?.length ? { respondedResolves: input.respondedResolves } : {}),
    },
    { headers: authHeaders(credential, input.idempotencyKey) },
  );
  return unwrap(response);
}

export async function chooseGuidedExploration(
  sessionId: string,
  credential: string,
  input: GuidedExplorationChoiceInput,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.post<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/guided-exploration`,
    {
      expectedRevision: input.expectedRevision,
      choice: input.choice,
    },
    { headers: authHeaders(credential, input.idempotencyKey) },
  );
  return unwrap(response);
}

export async function materializePortfolioEntryHandoff(
  sessionId: string,
  credential: string,
  input: MutationOptions,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.post<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/handoff`,
    { expectedRevision: input.expectedRevision },
    { headers: authHeaders(credential, input.idempotencyKey) },
  );
  return unwrap(response);
}

export async function getPortfolioEntryHandoff(
  sessionId: string,
  credential: string,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.get<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/handoff`,
    { headers: authHeaders(credential) },
  );
  return unwrap(response);
}

export async function correctPortfolioEntryHandoff(
  sessionId: string,
  credential: string,
  input: HandoffCorrectionInput,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.post<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/handoff/confirmation`,
    {
      expectedRevision: input.expectedRevision,
      action: 'correct',
      correctedFields: input.correctedFields,
      ...(input.acceptedFields?.length ? { acceptedFields: input.acceptedFields } : {}),
      ...(input.rejectedFields?.length ? { rejectedFields: input.rejectedFields } : {}),
      ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    },
    { headers: authHeaders(credential, input.idempotencyKey) },
  );
  return unwrap(response);
}

export async function confirmPortfolioEntryHandoff(
  sessionId: string,
  credential: string,
  input: HandoffConfirmationInput,
): Promise<PortfolioEntrySessionDto> {
  const response = await publicApi.post<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/handoff/confirmation`,
    {
      expectedRevision: input.expectedRevision,
      action: 'confirm',
      ...(input.acceptedFields?.length ? { acceptedFields: input.acceptedFields } : {}),
      ...(input.rejectedFields?.length ? { rejectedFields: input.rejectedFields } : {}),
      ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    },
    { headers: authHeaders(credential, input.idempotencyKey) },
  );
  return unwrap(response);
}

export async function claimPortfolioEntrySession(
  sessionId: string,
  credential: string,
  input: MutationOptions,
): Promise<PortfolioEntrySessionDto> {
  const { default: api } = await import('../../../app/services/api');
  const response = await api.post<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/claim`,
    { expectedRevision: input.expectedRevision },
    { headers: authHeaders(credential, input.idempotencyKey) },
  );
  return unwrap(response);
}

export async function getClaimedPortfolioEntrySession(sessionId: string): Promise<PortfolioEntrySessionDto> {
  const { default: api } = await import('../../../app/services/api');
  const response = await api.get<PortfolioEntryApiEnvelope<PortfolioEntrySessionDto>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}`,
  );
  return unwrap(response);
}

export async function convertPortfolioEntrySession(
  sessionId: string,
  input: MutationOptions,
): Promise<PortfolioEntryConversionResult> {
  const { default: api } = await import('../../../app/services/api');
  const response = await api.post<PortfolioEntryApiEnvelope<PortfolioEntryConversionResult>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/convert`,
    { expectedRevision: input.expectedRevision },
    { headers: { [IDEMPOTENCY_HEADER]: input.idempotencyKey } },
  );
  return unwrap(response);
}

export async function continuePortfolioEntryToPortfolio(
  sessionId: string,
  input: MutationOptions,
): Promise<PortfolioEntryContinuationResult> {
  const { default: api } = await import('../../../app/services/api');
  const response = await api.post<PortfolioEntryApiEnvelope<PortfolioEntryContinuationResult>>(
    `/public/portfolio-entry/sessions/${encodeURIComponent(sessionId)}/continue-portfolio`,
    { expectedRevision: input.expectedRevision },
    { headers: { [IDEMPOTENCY_HEADER]: input.idempotencyKey } },
  );
  return unwrap(response);
}

export async function getPortfolioEntryContinuation(
  continuationId: string,
): Promise<PortfolioEntryContinuationResult> {
  const { default: api } = await import('../../../app/services/api');
  const response = await api.get<PortfolioEntryApiEnvelope<PortfolioEntryContinuationResult>>(
    `/public/portfolio-entry/continuations/${encodeURIComponent(continuationId)}`,
  );
  return unwrap(response);
}

export function normalizePortfolioEntryApiError(err: unknown): PortfolioEntryApiError {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  const retryAfter = axios.isAxiosError(err)
    ? Number(err.response?.headers?.['retry-after'] ?? 0)
    : 0;

  const error = new Error('Portfolio Entry request failed') as PortfolioEntryApiError;
  error.status = status;
  error.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined;
  error.kind = (() => {
    if (!status) return 'network';
    if (status === 400) return 'validation';
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 410) return 'expired';
    if (status === 429) return 'rate_limited';
    if (status === 422) return 'mapping_invalid';
    if (status === 502) return 'provider_output';
    if (status === 503) return 'unavailable';
    if (status === 504) return 'timeout';
    if (status >= 500) return 'server_error';
    return 'unknown';
  })();
  return error;
}
