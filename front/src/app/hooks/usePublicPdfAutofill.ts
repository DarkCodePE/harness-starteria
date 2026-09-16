/* ------------------------------------------------------------------ */
/*  usePublicPdfAutofill.ts - Drives an anonymous PDF extraction run     */
/*                                                                       */
/*  Public (no-login) mirror of `usePdfAutofill.ts`. Differences:        */
/*    - Upload + poll target the `/public/pdf-extract` endpoints.        */
/*    - The run is keyed by the anonymous `draftId` (used as the         */
/*      AutofillContext `initiativeId`), since no real initiative exists  */
/*      yet for an anonymous founder.                                    */
/*    - `upload(file)` performs upload → poll → MERGE_FROM_RUN in one     */
/*      call (the public backend kicks the extraction on upload, so      */
/*      there is no separate "start extraction" step).                   */
/*                                                                       */
/*  The backoff schedule and the 10-minute budget are shared with the    */
/*  authenticated hook to keep timing behaviour identical.               */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError } from '../services/api';
import {
  getPublicExtractionRunStatus,
  listPublicProposals,
  uploadPublicPdf,
} from '../services/publicPdfAutofillService';
import type {
  AutofillProposalDto,
  ExtractionRunStatus,
} from '../services/pdfAutofillService';
import { useAutofillContext } from '../context/AutofillContext';
import { trackAutofillEvent } from '../services/autofillTelemetry';
import {
  BACKOFF_INTERVALS_MS,
  MAX_POLL_DURATION_MS,
  type AutofillHookError,
  type AutofillHookStatus,
} from './usePdfAutofill';

export interface UsePublicPdfAutofillReturn {
  status: AutofillHookStatus | 'uploading';
  uploadProgress: number;
  proposals: AutofillProposalDto[];
  error: AutofillHookError | null;
  /** Upload a PDF for the given anonymous draft, then poll to completion. */
  upload: (file: File) => Promise<{ runId: string } | null>;
  cancel: () => void;
}

function getBackoffDelay(attempt: number): number {
  if (attempt < BACKOFF_INTERVALS_MS.length) {
    return BACKOFF_INTERVALS_MS[attempt];
  }
  return BACKOFF_INTERVALS_MS[BACKOFF_INTERVALS_MS.length - 1];
}

function mapHttpErrorToHookError(err: unknown): AutofillHookError {
  const parsed = parseApiError(err);
  const code = parsed.code;
  if (code === 'AUTOFILL_COST_CEILING' || code === 'COST_CEILING') {
    return { code: 'AUTOFILL_COST_CEILING', message: parsed.message };
  }
  if (code === 'AUTOFILL_RUN_NOT_FOUND' || code === 'NOT_FOUND') {
    return { code: 'AUTOFILL_RUN_NOT_FOUND', message: parsed.message };
  }
  if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
    return { code: 'AUTOFILL_UNAUTHORIZED', message: parsed.message };
  }
  return { code: 'AUTOFILL_UNKNOWN', message: parsed.message };
}

/**
 * @param draftId            anonymous draft id; doubles as the AutofillContext key.
 * @param anonymousSessionId session id created by `publicDraftStorage`.
 */
export function usePublicPdfAutofill(
  draftId: string | undefined,
  anonymousSessionId: string | undefined,
): UsePublicPdfAutofillReturn {
  const { dispatch } = useAutofillContext();

  const [status, setStatus] = useState<AutofillHookStatus | 'uploading'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [proposals, setProposals] = useState<AutofillProposalDto[]>([]);
  const [error, setError] = useState<AutofillHookError | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    if (mountedRef.current) setStatus('idle');
  }, [stopPolling]);

  const finalizeRun = useCallback(
    async (runId: string) => {
      if (!draftId) return;
      try {
        const list = await listPublicProposals(runId);
        if (!mountedRef.current || cancelledRef.current) return;
        setProposals(list);
        // The anonymous draftId is the AutofillContext key for the public path.
        dispatch({ type: 'MERGE_FROM_RUN', initiativeId: draftId, proposals: list });
        setStatus('done');
        trackAutofillEvent('autofill_run_completed', {
          initiativeId: draftId,
          runId,
          count: list.length,
        });
      } catch (err) {
        if (!mountedRef.current) return;
        setError(mapHttpErrorToHookError(err));
        setStatus('failed');
        trackAutofillEvent('autofill_run_failed', { initiativeId: draftId, runId });
      }
    },
    [draftId, dispatch],
  );

  // Awaitable poll loop. Resolves `true` once proposals are merged (run
  // completed), `false` on terminal failure/timeout/cancel. Unlike the
  // authenticated hook's fire-and-forget `poll`, this lets `upload` await the
  // run to completion so callers can navigate AFTER proposals are merged into
  // the (app-level) AutofillContext — surviving the page transition.
  const pollUntilTerminal = useCallback(
    async (runId: string): Promise<boolean> => {
      const startedAt = Date.now();
      let attempt = 0;
      while (Date.now() - startedAt < MAX_POLL_DURATION_MS) {
        if (cancelledRef.current || !mountedRef.current) return false;
        await new Promise<void>((resolve) => {
          timerRef.current = setTimeout(resolve, getBackoffDelay(attempt));
        });
        if (cancelledRef.current || !mountedRef.current) return false;

        let response: { status: ExtractionRunStatus; errorMessage?: string };
        try {
          response = await getPublicExtractionRunStatus(runId);
        } catch (err) {
          // 5xx → retry with next backoff; 4xx → abort.
          const hookError = mapHttpErrorToHookError(err);
          if (hookError.code === 'AUTOFILL_UNKNOWN') {
            attempt += 1;
            continue;
          }
          if (mountedRef.current) {
            setError(hookError);
            setStatus('failed');
          }
          trackAutofillEvent('autofill_run_failed', { initiativeId: draftId, runId });
          return false;
        }
        if (cancelledRef.current || !mountedRef.current) return false;

        if (response.status === 'completed') {
          await finalizeRun(runId);
          return !cancelledRef.current && mountedRef.current;
        }
        if (response.status === 'failed' || response.status === 'cancelled') {
          if (mountedRef.current) {
            setStatus('failed');
            setError({
              code: 'AUTOFILL_UNKNOWN',
              message:
                response.errorMessage ??
                'La extracción no pudo completarse. Reintenta más tarde.',
            });
          }
          trackAutofillEvent('autofill_run_failed', { initiativeId: draftId, runId });
          return false;
        }
        // queued / running / partial → keep polling
        attempt += 1;
      }

      if (mountedRef.current) {
        setStatus('timeout');
        setError({
          code: 'AUTOFILL_TIMEOUT',
          message:
            'La extracción tarda más de lo normal. Puedes reintentarlo o continuar manualmente.',
        });
      }
      trackAutofillEvent('autofill_run_failed', {
        initiativeId: draftId,
        runId,
        reason: 'timeout',
      });
      return false;
    },
    [draftId, finalizeRun],
  );

  const upload = useCallback(
    async (file: File): Promise<{ runId: string } | null> => {
      if (!draftId || !anonymousSessionId) return null;
      cancelledRef.current = false;
      stopPolling();
      setError(null);
      setProposals([]);
      setUploadProgress(0);
      setStatus('uploading');

      let runId: string;
      try {
        trackAutofillEvent('pdf_upload_started', { initiativeId: draftId });
        const result = await uploadPublicPdf(
          file,
          anonymousSessionId,
          draftId,
          (pct) => {
            if (mountedRef.current) setUploadProgress(pct);
          },
        );
        runId = result.runId;
      } catch (err) {
        const hookError = mapHttpErrorToHookError(err);
        if (mountedRef.current) {
          setError(hookError);
          setStatus('failed');
        }
        trackAutofillEvent('pdf_upload_failed', { initiativeId: draftId });
        return null;
      }

      if (cancelledRef.current || !mountedRef.current) return null;
      trackAutofillEvent('pdf_upload_completed', { initiativeId: draftId, runId });
      trackAutofillEvent('autofill_run_started', { initiativeId: draftId, runId });
      setStatus('running');

      // Await the run to completion (merges proposals into AutofillContext).
      const merged = await pollUntilTerminal(runId);
      return merged ? { runId } : null;
    },
    [draftId, anonymousSessionId, pollUntilTerminal, stopPolling],
  );

  return { status, uploadProgress, proposals, error, upload, cancel };
}
