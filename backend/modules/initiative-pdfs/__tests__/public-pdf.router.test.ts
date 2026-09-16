/**
 * Tests for the PUBLIC (no-auth) PDF extraction surface (issue #23).
 *
 * The landing page lets anonymous visitors upload a PDF and get Step0 field
 * proposals WITHOUT logging in. This suite locks the hardened contract:
 *   - rejects non-PDF (mime + extension)
 *   - rejects files > 10MB (stricter than the authenticated 50MB cap)
 *   - happy path returns { runId, draftId }
 *   - run polling returns the public status shape
 *   - proposals endpoint returns the SAME AutofillProposalDto[] (WireAutofillProposal)
 *     shape as the authenticated `listProposals` path
 *   - extraction is invoked with PII redaction ENFORCED (the public path must
 *     never bypass the ai-service redaction pipeline)
 *
 * Hermetic: the ai-service client is fully mocked (mirrors integration-regression.test.ts).
 * No real LLM / network calls. Storage is mocked. No Prisma — the public path is
 * Project-row-free by design (anonymous draft id keys an in-memory run store).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

import type { AiServiceClient } from '../ai-client';
import type { IPdfStorage } from '../storage.service';
import { PublicPdfService } from '../public-pdf.service';
import { buildPublicPdfRouter } from '../public-pdf.router';
import { errorHandler } from '../../../shared/errors/error-handler';

// ─── Mock helpers (mirror integration-regression.test.ts) ──────────────────

function makeStorage(bytes = Buffer.from('%PDF-1.4 stub')): IPdfStorage {
  return {
    savePdf: vi.fn().mockResolvedValue({
      fileKey: 'public-pdf-drafts/draft-1/abc/original.pdf',
      fileSize: bytes.byteLength,
      mimeType: 'application/pdf',
    }),
    readPdf: vi.fn().mockResolvedValue(bytes),
    deletePdf: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(true),
    getMetadata: vi.fn().mockResolvedValue(null),
  };
}

function makeAiClient(overrides: Partial<AiServiceClient> = {}): AiServiceClient {
  return {
    callPdfExtract: vi.fn().mockResolvedValue({ runId: 'ai-default', status: 'pending' }),
    fetchRunState: vi.fn(),
    ...overrides,
  } as unknown as AiServiceClient;
}

// Reusable FieldProposal leaf matching the ai-service shape.
function fp(value: unknown, confidence: number, page = 1, quote = 'q') {
  return { value, confidence, provenance: [{ page, quote, confidence }] };
}

/**
 * Build a tiny Express app that mounts ONLY the public router behind the shared
 * error handler — same wiring as app.ts but isolated for the test.
 */
function makeApp(service: PublicPdfService) {
  const app = express();
  app.use('/api/v1/public/pdf-extract', buildPublicPdfRouter(service, { maxRequests: 1000 }));
  app.use(errorHandler);
  return app;
}

// A minimal-but-valid PDF magic-number buffer.
const PDF_BYTES = Buffer.from('%PDF-1.4\n%stub\n');

describe('public-pdf.router — POST /api/v1/public/pdf-extract', () => {
  let service: PublicPdfService;
  let ai: AiServiceClient;
  let storage: IPdfStorage;

  beforeEach(() => {
    storage = makeStorage();
    ai = makeAiClient();
    service = new PublicPdfService(storage, ai);
  });

  it('happy path → 202 { runId, draftId } and invokes ai-service with redaction ENFORCED', async () => {
    const app = makeApp(service);

    const res = await request(app)
      .post('/api/v1/public/pdf-extract')
      .field('anonymousSessionId', 'anon-session-123')
      .field('draftId', 'draft-abc')
      .attach('file', PDF_BYTES, { filename: 'plan.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(202);
    expect(res.body?.data?.draftId).toBe('draft-abc');
    expect(typeof res.body?.data?.runId).toBe('string');
    expect(res.body.data.runId.length).toBeGreaterThan(0);

    // ai-service was called exactly once...
    expect(ai.callPdfExtract).toHaveBeenCalledOnce();
    const callArg = (ai.callPdfExtract as any).mock.calls[0][0];
    // ...with PII redaction enforced (public path MUST NOT bypass it)...
    expect(callArg.enforceRedaction).toBe(true);
    // ...scoped to step0 (always, for the public landing flow)...
    expect(callArg.targetStep).toBe('step_0');
    // ...and keyed by the anonymous draftId (no real Project row).
    expect(callArg.projectId).toBe('draft-abc');
  });

  it('rejects a non-PDF mime type → 400 PDF_MIME_INVALID, ai-service NOT called', async () => {
    const app = makeApp(service);

    const res = await request(app)
      .post('/api/v1/public/pdf-extract')
      .field('anonymousSessionId', 'anon-1')
      .field('draftId', 'draft-1')
      .attach('file', Buffer.from('hello'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('PDF_MIME_INVALID');
    expect(ai.callPdfExtract).not.toHaveBeenCalled();
  });

  it('rejects a .exe extension even when mime claims application/pdf → 400, ai-service NOT called', async () => {
    const app = makeApp(service);

    const res = await request(app)
      .post('/api/v1/public/pdf-extract')
      .field('anonymousSessionId', 'anon-1')
      .field('draftId', 'draft-1')
      .attach('file', PDF_BYTES, { filename: 'evil.exe', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(ai.callPdfExtract).not.toHaveBeenCalled();
  });

  it('rejects a file larger than 10MB → 400 PDF_TOO_LARGE, ai-service NOT called', async () => {
    const app = makeApp(service);
    // 10MB + 1 byte, starting with the PDF magic number so only the size check trips.
    const tooBig = Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.alloc(10 * 1024 * 1024 + 1, 0x20),
    ]);

    const res = await request(app)
      .post('/api/v1/public/pdf-extract')
      .field('anonymousSessionId', 'anon-1')
      .field('draftId', 'draft-1')
      .attach('file', tooBig, { filename: 'huge.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('PDF_TOO_LARGE');
    expect(ai.callPdfExtract).not.toHaveBeenCalled();
  });

  it('rejects missing draftId / anonymousSessionId → 400 (boundary validation)', async () => {
    const app = makeApp(service);
    const res = await request(app)
      .post('/api/v1/public/pdf-extract')
      .field('anonymousSessionId', 'anon-1')
      // draftId intentionally omitted
      .attach('file', PDF_BYTES, { filename: 'plan.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(ai.callPdfExtract).not.toHaveBeenCalled();
  });
});

describe('public-pdf.router — GET runs/:runId and runs/:runId/proposals', () => {
  it('run status reflects the lowercase public lifecycle and proposals match the AutofillProposalDto shape', async () => {
    const storage = makeStorage();
    const ai = makeAiClient({
      callPdfExtract: vi.fn().mockResolvedValue({ runId: 'ai-xyz', status: 'pending' }),
      fetchRunState: vi.fn().mockResolvedValue({
        runId: 'ai-xyz',
        status: 'completed',
        costUsd: 0.05,
        proposals: {
          step0: { origen: fp('Rigidez operativa', 0.91, 3, 'El Reto: Rigidez') },
          extraction_metadata: { model: 'gpt-5', language: 'es', pages: 12 },
        },
      }),
    } as unknown as Partial<AiServiceClient>);
    const service = new PublicPdfService(storage, ai);
    const app = makeApp(service);

    // 1) Start extraction.
    const start = await request(app)
      .post('/api/v1/public/pdf-extract')
      .field('anonymousSessionId', 'anon-1')
      .field('draftId', 'draft-xyz')
      .attach('file', PDF_BYTES, { filename: 'plan.pdf', contentType: 'application/pdf' });
    expect(start.status).toBe(202);
    const runId = start.body.data.runId;

    // 2) Poll run state → completed (lowercase public enum).
    const run = await request(app).get(`/api/v1/public/pdf-extract/runs/${runId}`);
    expect(run.status).toBe(200);
    expect(run.body.data.status).toBe('completed');

    // 3) Proposals → WireAutofillProposal[] (same shape as authenticated listProposals).
    const proposals = await request(app).get(
      `/api/v1/public/pdf-extract/runs/${runId}/proposals`,
    );
    expect(proposals.status).toBe(200);
    const list = proposals.body.data;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(1);

    const p = list[0];
    expect(p.fieldPath).toBe('step0.origen');
    expect(p.proposedValue).toBe('Rigidez operativa');
    expect(p.status).toBe('unconfirmed');
    expect(p.confidenceBand).toBe('high');
    expect(p.runId).toBe(runId);
    // Provenance must be the wire-shaped single entry with the frontend keys.
    expect(p.provenance.sourcePdfName).toBe('plan.pdf');
    expect(p.provenance.pageNumbers).toEqual([3]);
    expect(p.provenance.quotedExcerpt).toBe('El Reto: Rigidez');
    expect(p.provenance.confidenceBand).toBe('high');
  });

  it('unknown runId → 404 PDF_RUN_NOT_FOUND, no internal details leaked', async () => {
    const service = new PublicPdfService(makeStorage(), makeAiClient());
    const app = makeApp(service);
    const res = await request(app).get(
      '/api/v1/public/pdf-extract/runs/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('PDF_RUN_NOT_FOUND');
  });
});
