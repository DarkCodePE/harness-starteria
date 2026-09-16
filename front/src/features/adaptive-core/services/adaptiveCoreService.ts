import api from '../../../app/services/api';
import type { AdaptiveInitiativeCore } from '../domain/types';

export interface TruthBinding {
  claimId: string;
  evidenceIds: string[];
  sourceRefIds: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function getAdaptiveCore(projectId: string): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.get<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core`);
  return data.data;
}

export async function confirmAdaptiveCheckpoint(
  projectId: string,
  input: {
    idempotencyKey: string;
    checkpointKey: string;
    responses: Record<string, unknown>;
    truthBindings?: TruthBinding;
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/checkpoints/confirm`, input);
  return data.data;
}

export async function confirmStep0Brief(
  projectId: string,
  input: {
    idempotencyKey: string;
    brief: Record<string, unknown>;
    confirmed: boolean;
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/step0/brief/confirm`, input);
  return data.data;
}

export async function confirmStep1Output(
  projectId: string,
  input: {
    idempotencyKey: string;
    brief: Record<string, unknown>;
    confirmed: boolean;
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/step1/output/confirm`, input);
  return data.data;
}

export async function confirmStep2Output(
  projectId: string,
  input: {
    idempotencyKey: string;
    brief: Record<string, unknown>;
    confirmed: boolean;
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/step2/output/confirm`, input);
  return data.data;
}

export async function confirmStep3Output(
  projectId: string,
  input: {
    idempotencyKey: string;
    brief: Record<string, unknown>;
    confirmed: boolean;
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/step3/output/confirm`, input);
  return data.data;
}

export async function confirmStep4Output(
  projectId: string,
  input: {
    idempotencyKey: string;
    brief: Record<string, unknown>;
    confirmed: boolean;
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/step4/output/confirm`, input);
  return data.data;
}

export async function registerCriticalChange(
  projectId: string,
  input: {
    idempotencyKey: string;
    field: 'scope' | 'company_or_area' | 'challenge_type' | 'route' | 'hypothesis' | 'target_date' | 'critical_restriction' | 'selected_bet';
    previousValue?: unknown;
    nextValue: unknown;
    reason?: string;
    confirmed: boolean;
    action?: 'update_route' | 'keep_previous_route' | 'split_phases' | 'back_and_edit';
  },
): Promise<AdaptiveInitiativeCore> {
  const { data } = await api.post<ApiResponse<AdaptiveInitiativeCore>>(`/projects/${projectId}/adaptive-core/critical-change`, input);
  return data.data;
}
