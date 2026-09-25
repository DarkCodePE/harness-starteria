import api, { parseApiError, type AuthError } from '../../../app/services/api';
import type { StrategicFramingDraft, StrategicFramingState, StrategicLensSuggestionResult } from './types';

type Envelope<T> = { success: true; data: T };
export type StrategicFramingCorrection = Partial<StrategicFramingDraft> & { expectedVersion: number; reason?: string | null };

export async function getStrategicFramingState(stateId: string): Promise<StrategicFramingState> {
  try {
    const { data } = await api.get<Envelope<StrategicFramingState>>(`/strategic-framing/states/${encodeURIComponent(stateId)}`);
    return data.data;
  } catch (error) { throw parseApiError(error); }
}

export async function updateStrategicFramingState(stateId: string, correction: StrategicFramingCorrection): Promise<StrategicFramingState> {
  try {
    const { data } = await api.patch<Envelope<StrategicFramingState>>(`/strategic-framing/states/${encodeURIComponent(stateId)}`, correction);
    return data.data;
  } catch (error) { throw parseApiError(error); }
}

export async function getStrategicFramingLensSuggestions(stateId: string): Promise<StrategicLensSuggestionResult> {
  try {
    const { data } = await api.get<Envelope<StrategicLensSuggestionResult>>(`/strategic-framing/states/${encodeURIComponent(stateId)}/lens-suggestions`);
    return data.data;
  } catch (error) { throw parseApiError(error); }
}

export type StrategicFramingEntryInput =
  | { sourceMode: 'public_entry'; bootstrapSessionId: string }
  | { sourceMode: 'enterprise_direct'; intendedMovement: string; whyItMatters?: string | null; movementSignalValue?: string | null; decisionToEnable?: string | null }
  | { sourceMode: 'existing_portfolio'; sourceType: 'strategic_front' | 'challenge' | 'initiative'; sourceId: string };

export type StrategicFramingEntryResult = {
  state: StrategicFramingState;
  reused: boolean;
  sourceMode: StrategicFramingEntryInput['sourceMode'];
  workspacePath: string;
};

export async function createOrReuseStrategicFramingFromSource(input: StrategicFramingEntryInput, idempotencyKey?: string): Promise<StrategicFramingEntryResult> {
  try {
    const { data } = await api.post<Envelope<StrategicFramingEntryResult>>('/strategic-framing/states/from-source', input, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined);
    return data.data;
  } catch (error) { throw parseApiError(error); }
}

export type StrategicFramingError = AuthError;
