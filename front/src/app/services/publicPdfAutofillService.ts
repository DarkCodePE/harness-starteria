/* ------------------------------------------------------------------ */
/*  publicPdfAutofillService.ts - HTTP layer for the PUBLIC (anonymous)  */
/*  PDF autofill flow (issues #24 / #25).                                */
/*                                                                       */
/*  This is a lean, unauthenticated mirror of `pdfAutofillService.ts`.   */
/*  It targets the three public endpoints (relative to `/api/v1`):       */
/*    - POST /public/pdf-extract                multipart upload          */
/*    - GET  /public/pdf-extract/runs/:runId    status poll              */
/*    - GET  /public/pdf-extract/runs/:runId/proposals                   */
/*                                                                       */
/*  Unlike the authenticated service it does NOT attach a JWT, so it     */
/*  uses a bare axios instance (no auth interceptor). Cookies are still  */
/*  sent (`withCredentials`) so the backend can scope the anonymous      */
/*  session if it chooses to. Proposal shapes are reused verbatim from   */
/*  `pdfAutofillService.ts`.                                             */
/* ------------------------------------------------------------------ */

import axios from 'axios';
import type {
  AutofillProposalDto,
  ExtractionRunStatus,
} from './pdfAutofillService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Bare axios instance: no Authorization header, no 401-refresh redirect.
// Anonymous drafts must never be bounced to /auth on a transient 401.
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ---------- DTOs specific to the public flow ----------

export interface PublicExtractStartResult {
  runId: string;
  draftId: string;
}

export interface PublicExtractionRunStatusResponse {
  status: ExtractionRunStatus;
  errorMessage?: string;
}

// ---------- Endpoints ----------

/**
 * Upload a PDF for anonymous extraction.
 *
 * Sends multipart `file` plus the `anonymousSessionId` and `draftId` fields,
 * exactly as the public backend contract expects. Returns `{ runId, draftId }`.
 */
export async function uploadPublicPdf(
  file: File,
  anonymousSessionId: string,
  draftId: string,
  onProgress?: (pct: number) => void,
): Promise<PublicExtractStartResult> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('anonymousSessionId', anonymousSessionId);
  formData.append('draftId', draftId);

  const { data } = await publicApi.post<ApiResponse<PublicExtractStartResult>>(
    '/public/pdf-extract',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
  );
  return data.data;
}

/** Poll the status of a public extraction run. */
export async function getPublicExtractionRunStatus(
  runId: string,
): Promise<PublicExtractionRunStatusResponse> {
  const { data } = await publicApi.get<ApiResponse<PublicExtractionRunStatusResponse>>(
    `/public/pdf-extract/runs/${encodeURIComponent(runId)}`,
  );
  return data.data;
}

/** Fetch all proposals for a completed public run. */
export async function listPublicProposals(
  runId: string,
): Promise<AutofillProposalDto[]> {
  const { data } = await publicApi.get<ApiResponse<AutofillProposalDto[]>>(
    `/public/pdf-extract/runs/${encodeURIComponent(runId)}/proposals`,
  );
  return data.data;
}
