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
 * ADR-026 (IRC-07): revisión inicial conversacional (asistente a la derecha).
 * ON por defecto. Se puede DESACTIVAR con VITE_ENABLE_INITIATIVE_REVIEW_CHAT=false o el
 * override de localStorage (valor 'false'). Cualquier otro valor deja el chat activo.
 */
export function isInitiativeReviewChatEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_INITIATIVE_REVIEW_CHAT === 'false') return false;

  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage.getItem('starteria.initiativeReviewChat.enabled') === 'false') return false;
    } catch {
      /* localStorage inaccesible → se mantiene el default on */
    }
  }

  return true;
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
