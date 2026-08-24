import { describe, expect, it } from 'vitest';
import { LOG_REDACT_PATHS } from '../logger';

describe('shared/utils/logger redaction', () => {
  it('redacts request and response credentials from structured logs', () => {
    expect(LOG_REDACT_PATHS).toEqual(expect.arrayContaining([
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-internal-token"]',
      'req.headers["idempotency-key"]',
      'res.headers["set-cookie"]',
      '*.password',
      '*.accessToken',
      '*.refreshToken',
      '*.token',
    ]));
  });
});
