/**
 * Bridge service: forwards a field-refinement request to the ai-service
 * (ADR-011 pattern: X-Internal-Token, request-id propagation). ADR-016.
 *
 * The ai-service endpoint is a stateless LangChain chain (ADR-006) at
 * `POST /api/v1/ai/refine-field`. On any failure/timeout we throw an AppError;
 * the frontend then falls back to a local heuristic, so the editor never breaks.
 */
import { AppError } from '../../shared/errors/AppError';
import type { RefineFieldBody } from './refine-field.schemas';

export interface RefineFieldResult {
  suggestedValue: string;
  rationale: string;
  confidence: number;
}

type FetchFn = typeof fetch;

export interface RefineFieldServiceConfig {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
}

export class RefineFieldService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchFn;

  constructor(cfg: RefineFieldServiceConfig, fetchFn: FetchFn = fetch) {
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
    this.token = cfg.token;
    this.timeoutMs = cfg.timeoutMs ?? 8000;
    this.fetchFn = fetchFn;
  }

  async refine(input: RefineFieldBody, requestId?: string): Promise<RefineFieldResult> {
    const url = `${this.baseUrl}/api/v1/ai/refine-field`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.token,
          ...(requestId ? { 'X-Request-Id': requestId } : {}),
        },
        body: JSON.stringify({
          field: input.field,
          currentValue: input.currentValue ?? '',
          draftContext: input.draftContext ?? null,
        }),
        signal: controller.signal,
      });
    } catch {
      // Network error / timeout (abort) → frontend falls back to heuristic.
      throw AppError.internal('El servicio de IA no está disponible. Intenta de nuevo.');
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw AppError.internal('El servicio de IA respondió con un error.');
    }

    const data = (await response.json().catch(() => null)) as Partial<RefineFieldResult> | null;
    if (
      !data ||
      typeof data.suggestedValue !== 'string' ||
      typeof data.rationale !== 'string' ||
      typeof data.confidence !== 'number'
    ) {
      throw AppError.internal('La respuesta del servicio de IA no es válida.');
    }

    return {
      suggestedValue: data.suggestedValue,
      rationale: data.rationale,
      confidence: data.confidence,
    };
  }
}
