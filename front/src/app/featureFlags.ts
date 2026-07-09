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
