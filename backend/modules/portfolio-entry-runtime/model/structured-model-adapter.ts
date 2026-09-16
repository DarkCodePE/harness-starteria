import type { ZodType } from 'zod';
import type { LiveCandidateMetadata, ModelExecutionResult } from './model-execution-types';

export type StructuredModelGenerateInput<T> = {
  systemPrompt: string;
  userPayload: unknown;
  outputSchema: ZodType<T>;
  providerJsonSchema?: unknown;
  metadata: LiveCandidateMetadata;
  call: {
    call_id: string;
    purpose: 'analysis_turn' | 'handoff_generation' | 'technical_smoke';
    case_id?: string;
    repeat_index?: number;
    turn_index?: number;
  };
};

export interface StructuredModelAdapter {
  generate<T>(input: StructuredModelGenerateInput<T>): Promise<ModelExecutionResult<T>>;
}
