import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStrategicFramingLensSuggestions, type StrategicFramingError } from './service';
import type { StrategicLensSuggestion, StrategicLensSuggestionResult } from './types';

export function useStrategicFramingLensSuggestions(stateId: string, stateVersion: number | null) {
  const [result, setResult] = useState<StrategicLensSuggestionResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<StrategicFramingError | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [expandedLens, setExpandedLens] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateId || stateVersion === null) return;
    setStatus('loading');
    setError(null);
    try {
      const next = await getStrategicFramingLensSuggestions(stateId);
      setResult(next);
      setStatus('ready');
    } catch (nextError) {
      setError(nextError as StrategicFramingError);
      setStatus('error');
    }
  }, [stateId, stateVersion]);

  useEffect(() => {
    setHidden(new Set());
    setExpandedLens(null);
    setResult(null);
    setError(null);
    setStatus(stateVersion === null ? 'idle' : 'loading');
    void load();
  }, [load, stateVersion]);

  const suggestions = useMemo(
    () => result?.suggestions.filter((suggestion) => !hidden.has(suggestion.lens)) ?? [],
    [hidden, result],
  );

  const hide = (suggestion: StrategicLensSuggestion) => {
    setHidden((current) => new Set(current).add(suggestion.lens));
    setExpandedLens((current) => current === suggestion.lens ? null : current);
  };

  return {
    result,
    suggestions,
    status,
    error,
    expandedLens,
    hiddenCount: hidden.size,
    retry: load,
    explore: (lens: string) => setExpandedLens((current) => current === lens ? null : lens),
    hide,
    restoreHidden: () => { setHidden(new Set()); setExpandedLens(null); },
  };
}
