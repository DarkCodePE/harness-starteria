/**
 * Public (no-auth) PDF extraction service (issue #23).
 *
 * WHY a separate service instead of reusing PdfService directly:
 *   PdfService hard-requires a real `Project` row (`assertProject`) and writes
 *   to several Prisma tables keyed by `projectId` (InitiativePdf,
 *   PdfExtractionRun, PdfFieldProposal, AuditLog). The public landing flow has
 *   NO authenticated user and NO Project — creating Project rows for anonymous
 *   visitors would pollute the portfolio and open an abuse vector.
 *
 *   The LEAST invasive option (documented per the task brief) is an in-memory,
 *   ephemeral run store keyed by the anonymous `draftId`/`runId`. It reuses the
 *   EXACT same building blocks as the authenticated path so behaviour and the
 *   wire contract stay identical:
 *     - `IPdfStorage`            → persist the uploaded bytes (same disk layout)
 *     - `AiServiceClient`        → run the SAME extraction pipeline (PII redaction
 *                                  is enforced via `enforceRedaction: true`)
 *     - `flattenFieldProposals`  → same tree → fieldPath flattening
 *     - `toWireProposal`         → SAME AutofillProposalDto (WireAutofillProposal)
 *                                  the frontend already consumes.
 *
 * Runs live in-process and expire after `RUN_TTL_MS`. This is acceptable for V1
 * (the frontend polls within seconds of upload); a persistent store can be
 * swapped in later behind this same interface without changing the router.
 */

import { randomUUID } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError';
import type { IPdfStorage } from './storage.service';
import type { AiServiceClient } from './ai-client';
import { flattenFieldProposals } from './extraction-flatten';
import { toWireProposal, type WireAutofillProposal } from './wire-proposal';
import { PUBLIC_TARGET_STEP } from './public-pdf.schemas';
import type { ConfidenceBandValue, PdfFieldProposalDTO } from './pdf.types';

/** Public lifecycle — lowercase, matches the frontend run-status contract. */
export type PublicRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PublicStartResult {
  runId: string;
  draftId: string;
}

export interface PublicRunState {
  status: PublicRunStatus;
  errorMessage?: string;
}

interface EphemeralRun {
  runId: string;
  draftId: string;
  anonymousSessionId: string;
  fileName: string;
  fileKey: string;
  /** Upstream ai-service run id (used to poll for completion). */
  aiRunId: string | null;
  status: PublicRunStatus;
  errorMessage?: string;
  /** Cached wire proposals once the upstream run completes. */
  proposals: WireAutofillProposal[] | null;
  createdAt: number;
}

export interface PublicUploadInput {
  draftId: string;
  anonymousSessionId: string;
  fileName: string;
  bytes: Buffer;
  /** Echoed to the ai-service so logs on both sides correlate. */
  requestId?: string;
}

function bandOf(confidence: number): ConfidenceBandValue {
  if (confidence >= 0.8) return 'HIGH';
  if (confidence >= 0.6) return 'MED';
  return 'LOW';
}

/** Map an upstream ai-service status string to the public lowercase enum. */
function mapUpstreamStatus(upstream: string | undefined): PublicRunStatus {
  switch ((upstream ?? '').toLowerCase()) {
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cost_capped':
      return 'failed';
    case 'running':
      return 'running';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'queued';
  }
}

const RUN_TTL_MS = 30 * 60_000; // 30 minutes — anonymous runs are short-lived.

export class PublicPdfService {
  private readonly runs = new Map<string, EphemeralRun>();

  constructor(
    private readonly storage: IPdfStorage,
    private readonly aiClient: AiServiceClient,
    private readonly ttlMs: number = RUN_TTL_MS,
  ) {}

  /**
   * Upload + kick off extraction in one shot (the public contract has a single
   * POST). Returns `{ runId, draftId }`. The run is created BEFORE the upstream
   * call so a failure still leaves a pollable `failed` run (no leaked details).
   */
  async startExtraction(input: PublicUploadInput): Promise<PublicStartResult> {
    this.evictExpired();

    const runId = randomUUID();
    // We key storage by draftId (anonymous "initiative") + runId so the disk
    // layout mirrors the authenticated path and stays sandboxed per draft.
    const saved = await this.storage.savePdf({
      projectId: input.draftId,
      pdfId: runId,
      fileName: input.fileName,
      mimeType: 'application/pdf',
      bytes: input.bytes,
    });

    const run: EphemeralRun = {
      runId,
      draftId: input.draftId,
      anonymousSessionId: input.anonymousSessionId,
      fileName: input.fileName,
      fileKey: saved.fileKey,
      aiRunId: null,
      status: 'queued',
      proposals: null,
      createdAt: Date.now(),
    };
    this.runs.set(runId, run);

    try {
      const ack = await this.aiClient.callPdfExtract({
        projectId: input.draftId,
        pdfId: runId,
        fileName: input.fileName,
        pdfBase64: input.bytes.toString('base64'),
        targetStep: PUBLIC_TARGET_STEP,
        // MANDATORY on the public surface — never bypass PII redaction.
        enforceRedaction: true,
        requestId: input.requestId,
      });
      run.aiRunId = ack.runId ?? null;
      run.status = mapUpstreamStatus(ack.status);
    } catch {
      // Do NOT leak internal error details to anonymous callers — the run row
      // records a generic failure; the next poll surfaces a safe message.
      run.status = 'failed';
      run.errorMessage = 'No se pudo iniciar la extraccion.';
      // Best-effort cleanup of the orphaned blob.
      await this.storage.deletePdf(saved.fileKey).catch(() => undefined);
    }

    return { runId, draftId: input.draftId };
  }

  /**
   * Poll run state. When the run is still queued/running and we have an
   * upstream id, fetch the latest upstream state and (on completion) cache the
   * flattened wire proposals. Polling failure is non-fatal — we keep the last
   * known state so the frontend can retry.
   */
  async getRun(runId: string): Promise<PublicRunState> {
    const run = this.loadRun(runId);

    if ((run.status === 'queued' || run.status === 'running') && run.aiRunId) {
      try {
        const upstream = await this.aiClient.fetchRunState(run.aiRunId);
        const mapped = mapUpstreamStatus(upstream.status);
        run.status = mapped;
        if (upstream.errorReason && mapped === 'failed') {
          // Keep the message generic — never echo raw upstream internals.
          run.errorMessage = 'La extraccion fallo. Intenta de nuevo.';
        }
        if (mapped === 'completed' && upstream.proposals) {
          run.proposals = this.buildWireProposals(run, upstream.proposals);
        }
      } catch {
        // Non-fatal: leave the run unchanged so the next poll can retry.
      }
    }

    return run.errorMessage
      ? { status: run.status, errorMessage: run.errorMessage }
      : { status: run.status };
  }

  /**
   * Return the AutofillProposalDto[] (WireAutofillProposal[]) for a completed
   * run — the EXACT shape the authenticated `listProposals` path emits.
   * 409 if the run has not completed yet (mirrors PDF_RUN_NOT_READY semantics).
   */
  async listProposals(runId: string): Promise<WireAutofillProposal[]> {
    const run = this.loadRun(runId);

    // Lazy-complete: if we never polled to completion, do it now.
    if (run.status !== 'completed' && run.aiRunId) {
      await this.getRun(runId);
    }

    if (run.status !== 'completed') {
      throw AppError.conflict(
        'La extraccion aun no esta completada.',
        'PDF_RUN_NOT_READY',
        { hint: 'Espera a que el estado sea completed.' },
      );
    }
    return run.proposals ?? [];
  }

  // ─── internals ────────────────────────────────────────────────────────────

  private loadRun(runId: string): EphemeralRun {
    this.evictExpired();
    const run = this.runs.get(runId);
    if (!run) {
      throw AppError.notFound('Extraccion', 'PDF_RUN_NOT_FOUND');
    }
    return run;
  }

  /**
   * Flatten the upstream extraction tree and map each leaf to the wire DTO,
   * reusing the SAME `flattenFieldProposals` + `toWireProposal` boundary as the
   * authenticated path so the contract cannot drift.
   */
  private buildWireProposals(
    run: EphemeralRun,
    extraction: Record<string, unknown>,
  ): WireAutofillProposal[] {
    const flat = flattenFieldProposals(extraction);
    const meta = { pdfId: run.runId, fileName: run.fileName };
    return flat.map((p) => {
      const dto: PdfFieldProposalDTO = {
        id: `${run.runId}:${p.fieldPath}`,
        runId: run.runId,
        fieldPath: p.fieldPath,
        proposedValue: p.value,
        // `provenance` from the flattener is the raw ai-service array; wire
        // transform reads it as `[{ page, quote, confidence }]`.
        provenance: p.provenance as never,
        confidence: p.confidence,
        confidenceBand: p.confidenceBand ?? bandOf(p.confidence),
        status: 'PENDING',
        finalValue: undefined,
        confirmedBy: null,
        confirmedAt: null,
      };
      return toWireProposal(dto, meta);
    });
  }

  private evictExpired(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [id, run] of this.runs) {
      if (run.createdAt < cutoff) {
        this.runs.delete(id);
        // Fire-and-forget blob cleanup; ignore errors (idempotent delete).
        this.storage.deletePdf(run.fileKey).catch(() => undefined);
      }
    }
  }
}
