import type { Step0Data } from '../../../app/context/AppContext';

const STEP0_PREFILL_KEY_PREFIX = 'starteria.publicStart.step0Prefill:';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function getStep0PrefillKey(projectId: string): string {
  return `${STEP0_PREFILL_KEY_PREFIX}${projectId}`;
}

export function getStep0Prefill(projectId: string): Step0Data | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(getStep0PrefillKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Step0Data) : null;
  } catch {
    return null;
  }
}

export function saveStep0Prefill(projectId: string, data: Step0Data): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(getStep0PrefillKey(projectId), JSON.stringify(data));
}

export function clearStep0Prefill(projectId: string): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(getStep0PrefillKey(projectId));
}

export function hasStep0Prefill(projectId: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(getStep0PrefillKey(projectId)) !== null;
}
