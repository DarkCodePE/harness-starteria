/* ------------------------------------------------------------------ */
/*  publicFieldRefineService.ts — HTTP layer for the PUBLIC (anonymous)  */
/*  field refinement (PRD-003 / SPEC-003 / ADR-016).                     */
/*                                                                       */
/*  Calls the backend bridge `POST /public/refine-field`, which forwards */
/*  to the ai-service LangChain chain (ADR-006). The payload is NO-PII   */
/*  (the public draft is anonymous). Callers MUST fall back to a local   */
/*  heuristic on rejection so the editor never breaks.                   */
/* ------------------------------------------------------------------ */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const publicApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

export interface FieldRefineResult {
  suggestedValue: string;
  rationale: string;
  confidence: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Refine a single field via the real AI bridge. Rejects on any
 * network/timeout/4xx/5xx — the caller falls back to a local heuristic.
 */
export async function refinePublicField(
  field: string,
  currentValue: string,
  draftContext: Record<string, unknown> = {},
): Promise<FieldRefineResult> {
  const { data } = await publicApi.post<ApiResponse<FieldRefineResult>>('/public/refine-field', {
    field,
    currentValue,
    draftContext,
  });
  return data.data;
}
