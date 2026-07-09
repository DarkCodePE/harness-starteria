import type { InitialReview, InitialReviewOutput } from '../domain/types';

const STORAGE_KEY = 'starteria.initialReviews.v1';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function createId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `review-${random}`;
}

function readAll(): InitialReview[] {
  const currentStorage = storage();
  if (!currentStorage) return [];
  try {
    const raw = currentStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(reviews: InitialReview[]): void {
  const currentStorage = storage();
  if (!currentStorage) return;
  currentStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function listInitialReviews(): InitialReview[] {
  return readAll();
}

export function getInitialReview(reviewId: string): InitialReview | null {
  return readAll().find(review => review.id === reviewId) ?? null;
}

export function createInitialReview(inputText: string, contextText?: string): InitialReview {
  const now = new Date().toISOString();
  const review: InitialReview = {
    id: createId(),
    inputText: inputText.trim(),
    contextText: contextText?.trim() || undefined,
    status: 'not_started',
    conversationStage: 'intro',
    answers: {},
    metadata: {
      createdAt: now,
      updatedAt: now,
      source: 'manual',
      version: 1,
    },
    createdAt: now,
    updatedAt: now,
  };
  writeAll([review, ...readAll()]);
  return review;
}

export function updateInitialReview(reviewId: string, patch: Partial<InitialReview>): InitialReview | null {
  const reviews = readAll();
  const current = reviews.find(review => review.id === reviewId);
  if (!current) return null;

  const updated: InitialReview = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    metadata: {
      createdAt: current.metadata?.createdAt ?? current.createdAt,
      updatedAt: new Date().toISOString(),
      source: current.metadata?.source ?? 'manual',
      version: current.metadata?.version ?? 1,
      ...current.metadata,
      ...patch.metadata,
    },
  };

  writeAll(reviews.map(review => (review.id === reviewId ? updated : review)));
  return updated;
}

export function saveInitialReviewOutput(reviewId: string, output: InitialReviewOutput): InitialReview | null {
  return updateInitialReview(reviewId, { output, status: 'generated' });
}

export function markReviewAsConverted(reviewId: string, projectId: string): InitialReview | null {
  const now = new Date().toISOString();
  const current = getInitialReview(reviewId);
  return updateInitialReview(reviewId, {
    convertedProjectId: projectId,
    conversationStage: 'converted',
    status: 'converted_to_project',
    metadata: {
      createdAt: current?.metadata?.createdAt ?? current?.createdAt ?? now,
      updatedAt: now,
      source: current?.metadata?.source ?? 'manual',
      convertedInitiativeId: projectId,
      version: current?.metadata?.version ?? 1,
    },
  });
}

export function abandonInitialReview(reviewId: string): InitialReview | null {
  return updateInitialReview(reviewId, { status: 'abandoned' });
}
