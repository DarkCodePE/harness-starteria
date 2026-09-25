import { useEffect, useState } from 'react';
import {
  PortfolioHomeEntryContextError,
  readPortfolioHomeEntryContext,
  type PortfolioHomeEntryContext,
} from './portfolioHomeEntryContextClient';

export function usePortfolioHomeEntryContext(continuationId: string | null) {
  const [data, setData] = useState<PortfolioHomeEntryContext | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!continuationId) {
      setData(null);
      setStatus('idle');
      setError(null);
      return () => { cancelled = true; };
    }
    setStatus('loading');
    setError(null);
    readPortfolioHomeEntryContext(continuationId)
      .then((result) => {
        if (!cancelled) { setData(result); setStatus('ready'); }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setStatus('error');
          setError(err instanceof PortfolioHomeEntryContextError ? err.apiError.message : 'No pudimos recuperar este punto de partida.');
        }
      });
    return () => { cancelled = true; };
  }, [continuationId]);

  return { data, status, error };
}
