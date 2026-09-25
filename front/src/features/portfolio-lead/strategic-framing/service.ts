import api, { parseApiError, type AuthError } from '../../../app/services/api';
import type { StrategicFramingDraft, StrategicFramingState } from './types';

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

export type StrategicFramingError = AuthError;
