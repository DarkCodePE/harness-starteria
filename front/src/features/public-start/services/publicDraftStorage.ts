import type { PublicDraft } from '../domain/types';

const SESSION_ID_KEY = 'starteria.publicStart.anonymousSessionId';
const DRAFTS_KEY = 'starteria.publicStart.drafts';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function createId(prefix: string): string {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${randomId}`;
}

function readDrafts(): PublicDraft[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts: PublicDraft[]): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function getAnonymousSessionId(): string {
  const storage = getStorage();
  if (!storage) return createId('anon');

  const existing = storage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const next = createId('anon');
  storage.setItem(SESSION_ID_KEY, next);
  return next;
}

export function savePublicDraft(draft: PublicDraft): PublicDraft {
  const drafts = readDrafts();
  const nextDrafts = [draft, ...drafts.filter(item => item.id !== draft.id)];
  writeDrafts(nextDrafts);
  return draft;
}

export function getPublicDraft(draftId: string): PublicDraft | null {
  return readDrafts().find(draft => draft.id === draftId) ?? null;
}

export function updatePublicDraft(draftId: string, patch: Partial<PublicDraft>): PublicDraft | null {
  const drafts = readDrafts();
  const current = drafts.find(draft => draft.id === draftId);
  if (!current) return null;

  const updated: PublicDraft = {
    ...current,
    ...patch,
    id: current.id,
    anonymousSessionId: current.anonymousSessionId,
    updatedAt: new Date().toISOString(),
  };

  writeDrafts(drafts.map(draft => (draft.id === draftId ? updated : draft)));
  return updated;
}

export function discardPublicDraft(draftId: string): PublicDraft | null {
  return updatePublicDraft(draftId, { status: 'discarded' });
}

export function isPublicDraftExpired(draft: PublicDraft): boolean {
  return new Date(draft.expiresAt).getTime() <= Date.now();
}

export function listPublicDrafts(): PublicDraft[] {
  const drafts = readDrafts();
  return drafts.map(draft =>
    isPublicDraftExpired(draft) && draft.status !== 'converted' && draft.status !== 'discarded'
      ? { ...draft, status: 'expired' }
      : draft,
  );
}

export function createPublicDraftId(): string {
  return createId('draft');
}
