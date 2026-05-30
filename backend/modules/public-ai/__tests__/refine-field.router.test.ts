/**
 * Contract tests for the PUBLIC (no-auth) field-refinement bridge (ADR-016).
 * Hermetic: `fetch` to the ai-service is injected as a fake. Locks:
 *   - happy path forwards to ai-service and returns { suggestedValue, rationale, confidence }
 *   - forwards X-Internal-Token + the (no-PII) body
 *   - upstream non-200 → 500 (frontend then falls back to heuristic)
 *   - upstream timeout/abort → 500
 *   - invalid body (empty field) → 400
 */
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

import { RefineFieldService } from '../refine-field.service';
import { buildRefineFieldRouter } from '../refine-field.router';
import { errorHandler } from '../../../shared/errors/error-handler';

function makeApp(fetchFn: typeof fetch) {
  const service = new RefineFieldService({ baseUrl: 'http://ai:8001', token: 'tok-123', timeoutMs: 200 }, fetchFn);
  const app = express();
  app.use(express.json());
  app.use('/api/v1/public/refine-field', buildRefineFieldRouter(service, { maxRequests: 1000 }));
  app.use(errorHandler);
  return app;
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

const VALID = { field: 'whatToMove', currentValue: 'ordenar proyectos', draftContext: { suggestedChallengeType: 'correction' } };

describe('POST /api/v1/public/refine-field', () => {
  it('forwards to ai-service and returns the structured result', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ suggestedValue: 'Ordenar la gestión de proyectos.', rationale: 'Más claro.', confidence: 0.8 }),
    );
    const app = makeApp(fetchFn as unknown as typeof fetch);

    const res = await request(app).post('/api/v1/public/refine-field').send(VALID);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggestedValue).toContain('Ordenar');
    expect(res.body.data.confidence).toBe(0.8);

    // Forwarded to the ai-service chain endpoint with the internal token + no-PII body.
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://ai:8001/api/v1/ai/refine-field');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit & { headers: Record<string, string> }).headers['X-Internal-Token']).toBe('tok-123');
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.field).toBe('whatToMove');
  });

  it('maps an upstream non-200 to 500 (frontend falls back)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, false, 503));
    const app = makeApp(fetchFn as unknown as typeof fetch);

    const res = await request(app).post('/api/v1/public/refine-field').send(VALID);
    expect(res.status).toBe(500);
  });

  it('maps an upstream network error to 500', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const app = makeApp(fetchFn as unknown as typeof fetch);

    const res = await request(app).post('/api/v1/public/refine-field').send(VALID);
    expect(res.status).toBe(500);
  });

  it('rejects an empty field → 400', async () => {
    const fetchFn = vi.fn();
    const app = makeApp(fetchFn as unknown as typeof fetch);

    const res = await request(app).post('/api/v1/public/refine-field').send({ field: '', currentValue: 'x' });
    expect(res.status).toBe(400);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
