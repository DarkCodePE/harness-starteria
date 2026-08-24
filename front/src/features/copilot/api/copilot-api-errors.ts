import { AxiosError } from 'axios';
import { parseApiError } from '../../../app/services/api';
import type { CopilotErrorDto } from '../domain/copilot.types';

type ErrorEnvelope = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    details?: Array<{ field?: string; code?: string; message: string }>;
  };
};

export class CopilotApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryable: boolean;
  readonly details: CopilotErrorDto['details'];

  constructor(error: CopilotErrorDto) {
    super(error.message);
    this.name = 'CopilotApiError';
    this.code = error.code;
    this.status = error.status;
    this.retryable = error.retryable ?? false;
    this.details = error.details;
  }
}

export function normalizeCopilotError(err: unknown): CopilotApiError {
  const maybeAxios = err as AxiosError<ErrorEnvelope>;
  const envelope = maybeAxios.response?.data?.error;
  if (envelope?.code && envelope.message) {
    return new CopilotApiError({
      code: envelope.code,
      message: envelope.message,
      status: maybeAxios.response?.status,
      retryable: envelope.retryable,
      details: envelope.details,
    });
  }

  const parsed = parseApiError(err);
  return new CopilotApiError({
    code: parsed.code,
    message: parsed.message,
    status: maybeAxios.response?.status,
    retryable: false,
    details: parsed.details,
  });
}

export function getCopilotErrorMessage(err: unknown): string {
  const error = err instanceof CopilotApiError ? err : normalizeCopilotError(err);
  if (error.status === 403) return 'No tienes acceso para operar sobre esta propuesta.';
  if (error.status === 404) return 'La conversación o propuesta ya no está disponible.';
  if (error.status === 409) return 'La propuesta cambió. Refresca y revísala antes de continuar.';
  if (error.status === 422) return 'Falta información o hay campos que debes corregir.';
  if (error.status === 503) return 'El Copiloto no está disponible temporalmente.';
  return error.message || 'No pudimos completar la acción.';
}

