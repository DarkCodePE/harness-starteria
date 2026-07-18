export function isInitialReviewEnabled(): boolean {
  const envValue = import.meta.env.VITE_ENABLE_INITIAL_REVIEW;
  const envEnabled = envValue === 'true';
  let storageValue: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      storageValue = window.localStorage.getItem('starteria.initialReview.enabled');
    } catch {
      storageValue = null;
    }
  }

  return envEnabled || storageValue === 'true';
}

/**
 * ADR-026 (IRC-03): revisión inicial conversacional (asistente a la derecha).
 * Off por defecto; se enciende con VITE_ENABLE_INITIATIVE_REVIEW_CHAT=true o el override
 * de localStorage. Se activará por defecto en IRC-07 cuando la suite e2e esté verde.
 */
export function isInitiativeReviewChatEnabled(): boolean {
  const envEnabled = import.meta.env.VITE_ENABLE_INITIATIVE_REVIEW_CHAT === 'true';
  let storageValue: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      storageValue = window.localStorage.getItem('starteria.initiativeReviewChat.enabled');
    } catch {
      storageValue = null;
    }
  }

  return envEnabled || storageValue === 'true';
}

export function getInitialReviewFlagDebug() {
  const envValue = import.meta.env.VITE_ENABLE_INITIAL_REVIEW;
  let storageValue: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      storageValue = window.localStorage.getItem('starteria.initialReview.enabled');
    } catch {
      storageValue = null;
    }
  }

  return {
    envValue,
    storageValue,
    enabled: envValue === 'true' || storageValue === 'true',
  };
}
