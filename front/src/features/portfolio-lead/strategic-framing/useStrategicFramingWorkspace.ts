import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStrategicFramingState, updateStrategicFramingState, type StrategicFramingError } from './service';
import type { StrategicFramingDraft, StrategicFramingState } from './types';

function draftFromState(state: StrategicFramingState): StrategicFramingDraft {
  return { intendedMovement: state.intendedMovement, whyItMatters: state.whyItMatters, movementSignalStatus: state.movementSignalStatus, movementSignalValue: state.movementSignalValue, horizonContext: state.horizonContext, decisionToEnable: state.decisionToEnable, subjectLevel: state.subjectLevel, parentStatus: state.parentStatus, parentLabel: state.parentContext.label };
}

export function useStrategicFramingWorkspace(stateId: string) {
  const [serverState, setServerState] = useState<StrategicFramingState | null>(null);
  const [draft, setDraft] = useState<StrategicFramingDraft | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [error, setError] = useState<StrategicFramingError | null>(null);
  const [conflict, setConflict] = useState(false);
  const dirty = useMemo(() => !!serverState && !!draft && JSON.stringify(draft) !== JSON.stringify(draftFromState(serverState)), [serverState, draft]);

  const load = useCallback(async () => {
    setStatus('loading'); setError(null); setConflict(false);
    try { const next = await getStrategicFramingState(stateId); setServerState(next); setDraft(draftFromState(next)); setStatus('ready'); }
    catch (nextError) { const parsed = nextError as StrategicFramingError; setError(parsed); setStatus('error'); }
  }, [stateId]);
  useEffect(() => { void load(); }, [load]);

  const update = <K extends keyof StrategicFramingDraft>(key: K, value: StrategicFramingDraft[K]) => setDraft(current => current ? { ...current, [key]: value } : current);
  const cancel = () => serverState && setDraft(draftFromState(serverState));
  const save = async () => {
    if (!serverState || !draft || !dirty) return;
    const original = draftFromState(serverState);
    const changed = Object.fromEntries(Object.entries(draft).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(original[key as keyof StrategicFramingDraft]))) as Partial<StrategicFramingDraft>;
    setStatus('saving'); setError(null);
    try { const next = await updateStrategicFramingState(stateId, { ...changed, expectedVersion: serverState.version }); setServerState(next); setDraft(draftFromState(next)); setStatus('ready'); }
    catch (nextError) { const parsed = nextError as StrategicFramingError; setError(parsed); setStatus('ready'); if (parsed.code === 'SF_PROVISIONAL_STATE_STALE') setConflict(true); }
  };
  return { serverState, draft, status, error, conflict, dirty, update, cancel, save, reload: load };
}
