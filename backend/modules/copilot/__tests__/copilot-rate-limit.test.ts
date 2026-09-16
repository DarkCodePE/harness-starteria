import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createCopilotRateLimiter } from '../copilot-rate-limit';
import { errorHandler } from '../../../shared/errors/error-handler';

describe('Copilot rate limiting', () => {
  it('devuelve 429 y Retry-After al superar el limite por usuario', async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = { id: 'user-rate', email: 'rate@starteria.test', role: 'mentor' };
      next();
    });
    app.post('/', createCopilotRateLimiter({ windowMs: 60_000, maxRequests: 1, scope: 'test' }), (_req, res) => {
      res.json({ success: true });
    });
    app.use(errorHandler);

    const first = await request(app).post('/');
    const second = await request(app).post('/');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers['retry-after']).toBeDefined();
    expect(second.body.error.code).toBe('AUTH_RATE_LIMITED');
  });
});
