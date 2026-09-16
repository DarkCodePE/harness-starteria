export const MAX_TECHNICAL_RETRIES = 1;

export type RetryDecision = {
  retry: boolean;
  reason?: string;
};

export function shouldRetryModelExecution(input: {
  errorType: 'timeout' | 'rate_limit' | 'transport' | 'provider_5xx' | 'provider_auth' | 'provider_request_error' | 'schema_invalid' | 'schema_error' | 'contract_failure' | 'content_refusal';
  attempt: number;
  maxRetries?: number;
}): RetryDecision {
  const maxRetries = input.maxRetries ?? MAX_TECHNICAL_RETRIES;
  const retryable = input.errorType === 'timeout'
    || input.errorType === 'rate_limit'
    || input.errorType === 'transport'
    || input.errorType === 'provider_5xx';

  if (!retryable) return { retry: false };
  if (input.attempt > maxRetries) return { retry: false };
  return { retry: true, reason: input.errorType };
}
