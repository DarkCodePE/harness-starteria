import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateHardChecks } from '../evaluator/hard-checks';
import { loadFixtures } from '../fixtures';
import { runPortfolioEntryHarness } from '../runner';
import { writeReport } from '../report';
import type { PortfolioEntryAgentAdapter, PortfolioEntryAnalysis } from '../types';

const baseAnalysis: PortfolioEntryAnalysis = {
  entry_id: 'entry-test',
  analysis_version: 'test',
  analysis_status: 'ready',
  primary_intent: 'initiative_governance',
  secondary_intents: [],
  entry_state: 'solution_first',
  extracted_context: { solution: 'chatbot para ventas' },
  ambiguities: [],
  contradictions: [],
  missing_critical_context: ['business_intent'],
  reverse_alignment_required: true,
  reverse_alignment_gap: {
    subject_type: 'solution',
    subject: 'chatbot para ventas',
    connection_state: 'required',
    present_links: ['subject'],
    missing_links: ['expected_change', 'metric_signal', 'business_intent'],
    suggested_focus: 'Conectar la solución con un cambio de negocio observable.',
  },
  question_plan: [
    {
      id: 'q1',
      question: 'Si funciona, ¿qué debería cambiar?',
      reason_to_ask: 'Falta cambio esperado.',
      resolves: ['expected_change'],
      priority: 1,
      expected_answer_type: 'free_text',
    },
  ],
  provenance: [{ path: 'extracted_context.solution', origin: 'EXTRACTED_FROM_USER_TEXT', review_disposition: 'UNREVIEWED' }],
  prohibited_actions: [],
  agent_trace_summary: { skills_executed: ['entry-01-intent-detection'], provider: 'test', model: null },
  ux_summary: 'Parece que partes desde una solución; falta conectar el cambio esperado.',
};

describe('portfolio entry AI harness', () => {
  it('loads and validates all fixtures', () => {
    const fixtures = loadFixtures();
    expect(fixtures).toHaveLength(32);
    expect(fixtures.map((fixture) => fixture.case_id)).toContain('PE-B03');
  });

  it('detects question limit violations', () => {
    const fixture = loadFixtures().find((item) => item.case_id === 'PE-B03')!;
    const output = {
      ...baseAnalysis,
      question_plan: [baseAnalysis.question_plan[0], baseAnalysis.question_plan[0], baseAnalysis.question_plan[0], baseAnalysis.question_plan[0]],
    };
    expect(evaluateHardChecks(fixture, output).find((check) => check.id === 'HC-01')?.passed).toBe(false);
  });

  it('detects invalid taxonomy through schema validation', () => {
    const fixture = loadFixtures().find((item) => item.case_id === 'PE-B03')!;
    const output = { ...baseAnalysis, entry_state: 'bad_state' };
    expect(evaluateHardChecks(fixture, output).find((check) => check.id === 'HC-10')?.passed).toBe(false);
  });

  it('detects USER_CONFIRMED emitted by the agent', () => {
    const fixture = loadFixtures().find((item) => item.case_id === 'PE-B03')!;
    const output = { ...baseAnalysis, provenance: [{ ...baseAnalysis.provenance[0], review_disposition: 'USER_CONFIRMED' }] };
    expect(evaluateHardChecks(fixture, output).find((check) => check.id === 'HC-05')?.passed).toBe(false);
  });

  it('detects canonical object creation', () => {
    const fixture = loadFixtures().find((item) => item.case_id === 'PE-B03')!;
    const output = { ...baseAnalysis, prohibited_actions: ['create_initiative'] };
    expect(evaluateHardChecks(fixture, output).find((check) => check.id === 'HC-06')?.passed).toBe(false);
  });

  it('detects invalid structured output', () => {
    const fixture = loadFixtures().find((item) => item.case_id === 'PE-B03')!;
    expect(evaluateHardChecks(fixture, { entry_id: 'missing-fields' }).find((check) => check.id === 'HC-10')?.passed).toBe(false);
  });

  it('generates a report', () => {
    const outputDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-portfolio-entry-report-'));
    try {
      const report = writeReport(
        {
          run_id: 'test-run',
          timestamp: '2026-09-09T00:00:00.000Z',
          cases: ['PE-B03'],
          repeat_count: 1,
          agent_implementation_version: 'test',
          model: null,
        },
        [{
          case_id: 'PE-B03',
          run_index: 1,
          result: 'PASS',
          hard_fail: false,
          hard_checks: [],
          automatic_score: 14,
          human_review_required: false,
          failure_codes: [],
          notes: [],
        }],
        outputDir,
      );
      expect(report).toContain('PORTFOLIO ENTRY HARNESS RUN');
      expect(fs.existsSync(path.join(outputDir, 'REPORT.md'))).toBe(true);
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it('runs repeat mode deterministically with a fake adapter', async () => {
    const adapter: PortfolioEntryAgentAdapter = {
      async analyze(input) {
        return { ...baseAnalysis, entry_id: input.entryId };
      },
    };
    const result = await runPortfolioEntryHarness({ caseId: 'PE-B03', repeat: 3 }, adapter);
    try {
      expect(result.rawResults).toHaveLength(3);
      expect(result.evaluatedResults.map((item) => item.run_index)).toEqual([1, 2, 3]);
      expect(fs.existsSync(path.join(result.outputDir, 'raw-results.jsonl'))).toBe(true);
    } finally {
      fs.rmSync(result.outputDir, { recursive: true, force: true });
    }
  });
});
