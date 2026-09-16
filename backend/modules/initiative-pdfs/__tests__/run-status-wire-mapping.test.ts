import { describe, expect, it } from 'vitest';

import { toWireStatus } from '../pdf.service';
import type { ExtractionRunStatusValue } from '../pdf.types';

/**
 * Regression guard for BUG-001.
 *
 * The authenticated run-status DTO (GET /initiatives/:id/pdfs/runs/:runId) must
 * expose the LOWERCASE wire status the web client compares against
 * (`usePdfAutofill.ts`: `runStatus === 'completed'` …). The DB enum is UPPERCASE;
 * before the fix `toRunDTO` returned it raw, so the client never matched
 * 'completed' and polled until timeout. If anyone reverts the mapping, these
 * tests fail loudly (the previous integration test mocked lowercase and passed
 * anyway — a wishful-thinking test that hid the bug).
 */
describe('toWireStatus — DB enum → lowercase wire status (BUG-001 guard)', () => {
  it('maps COMPLETED → completed', () => {
    expect(toWireStatus('COMPLETED')).toBe('completed');
  });

  it('maps RUNNING → running', () => {
    expect(toWireStatus('RUNNING')).toBe('running');
  });

  it('maps PENDING → queued (client keeps polling)', () => {
    expect(toWireStatus('PENDING')).toBe('queued');
  });

  it('maps FAILED → failed', () => {
    expect(toWireStatus('FAILED')).toBe('failed');
  });

  it('collapses COST_CAPPED → failed (client has no cost-cap state)', () => {
    expect(toWireStatus('COST_CAPPED')).toBe('failed');
  });

  it('never returns an UPPERCASE value for any DB enum member', () => {
    const all: ExtractionRunStatusValue[] = [
      'PENDING',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'COST_CAPPED',
    ];
    for (const status of all) {
      const wire = toWireStatus(status);
      expect(wire).toBe(wire.toLowerCase());
    }
  });
});
