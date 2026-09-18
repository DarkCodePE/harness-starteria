import { describe, expect, it } from 'vitest';
import { runIsolatedValidation } from './isolated-validation';

describe('Portfolio Entry v0.2 isolated validation adapter', () => {
  it('runs candidate conformance separately from hypotheses and keeps promotion blocked', async () => {
    const report = await runIsolatedValidation();
    expect(report.promotion_status).toBe('BLOCKED_PENDING_VALIDATION');
    expect(report.contract_conformance.length).toBeGreaterThan(0);
    expect(report.hypothesis_validation.every((result) => result.hypothesis_result === 'INCONCLUSIVE')).toBe(true);
    expect(report.contract_conformance.every((result) => result.contract_result === 'PASS')).toBe(true);
    expect(report.results.find((result) => result.case_id === 'PE1-REG-01')?.contract_result).toBe('PASS');
    expect(report.results.find((result) => result.case_id === 'PE1-REG-02')?.contract_result).toBe('PASS');
  });

  it('preserves the v0.1 critical entry baseline as isolated regression evidence', async () => {
    const report = await runIsolatedValidation();
    const late = report.results.find((result) => result.case_id === 'PE2-ST-CF-01');
    expect(late?.observations.initial_entry_state).toBe('problem_first');
    expect(late?.observations.current_frame).toBe('initiative_first');
    expect(report.results.find((result) => result.case_id === 'PE2-MT-GE-01')?.contract_result).toBe('PASS');
  });
});
