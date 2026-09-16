import { describe, expect, it } from 'vitest';
import { fingerprintIdempotencyKey, redactCopilotValue } from '../observability/copilot-redaction';
import { TestCopilotMetrics } from '../observability/copilot-metrics';

describe('Copilot observability helpers', () => {
  it('redacta headers y payloads sensibles de logs', () => {
    const redacted = redactCopilotValue({
      authorization: 'Bearer secret',
      cookie: 'sid=secret',
      content: 'mensaje completo',
      nested: {
        proposedPayload: { sponsor: 'Gerencia' },
        safe: 'ok',
      },
    });

    expect(redacted).toEqual({
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      content: '[REDACTED]',
      nested: {
        proposedPayload: '[REDACTED]',
        safe: 'ok',
      },
    });
  });

  it('fingerprint de idempotency key evita registrar el valor completo', () => {
    expect(fingerprintIdempotencyKey('portfolio-copilot:action:key-123456')).toBe('portfo...123456');
  });

  it('metrics de test registra incrementos, observaciones y gauges', () => {
    const metrics = new TestCopilotMetrics();

    metrics.increment('copilot.execution.started', { status: 'executing' });
    metrics.observe('copilot.execution.duration_ms', 12);
    metrics.gauge('copilot.executions.stale', 1);

    expect(metrics.events).toHaveLength(3);
  });
});
