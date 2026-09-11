import type { CandidateManifest } from '../manifests/candidate-manifest';

export type ModelExecutionErrorType =
  | 'TECHNICAL_ERROR'
  | 'SCHEMA_ERROR'
  | 'CONTRACT_FAILURE'
  | 'HYPOTHESIS_RESULT';

export type SeedSupport = 'provided' | 'unavailable' | 'not_requested';

export type ModelExecutionMetadata = {
  call_id: string;
  case_id?: string;
  repeat_index?: number;
  turn_index?: number;
  purpose: 'analysis_turn' | 'handoff_generation' | 'technical_smoke';
  provider: string;
  model: string;
  model_version_if_available?: string;
  temperature?: number;
  seed?: string | number;
  seed_support: SeedSupport;
  duration_ms: number;
  retry_count: number;
  retry_reason?: string;
  usage?: unknown;
};

export type ModelExecutionResult<T> = {
  provider_raw: unknown;
  parsed_output: unknown;
  validated_output: T | null;
  schema_errors: string[];
  execution_metadata: ModelExecutionMetadata;
  error_type?: ModelExecutionErrorType;
  technical_error?: string;
};

export type LiveCandidateMetadata = CandidateManifest & {
  adapter_mode: 'live_llm_candidate';
  model_version_if_available?: string;
  seed_support: SeedSupport;
};
