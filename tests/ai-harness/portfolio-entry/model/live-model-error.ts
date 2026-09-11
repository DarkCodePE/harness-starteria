import type { ModelExecutionResult } from './model-execution-types';

export class LiveModelExecutionError<T = unknown> extends Error {
  constructor(
    message: string,
    readonly result: ModelExecutionResult<T>,
  ) {
    super(message);
    this.name = 'LiveModelExecutionError';
  }
}
