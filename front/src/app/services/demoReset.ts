const STORAGE_PREFIXES = [
  'starteria.publicStart.',
  'starteria.publicPilot.',
  'starteria.pendingPublicDraftId',
  'starteria.demo.',
];

function removeMatchingKeys(storage: Storage | null) {
  if (!storage) return;
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean) as string[];
  keys.forEach(key => {
    if (STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
      storage.removeItem(key);
    }
  });
}

export function resetStarteriaDemoStorage() {
  if (typeof window === 'undefined') return;
  removeMatchingKeys(window.sessionStorage);
  removeMatchingKeys(window.localStorage);
}

