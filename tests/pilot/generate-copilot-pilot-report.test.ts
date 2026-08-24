import { describe, expect, it } from 'vitest';
import {
  buildCopilotPilotReport,
  getPilotReportDatabaseUrl,
  parseReportArgs,
  renderReport,
} from '../../front/scripts/pilot/generate-copilot-pilot-report';

describe('generate-copilot-pilot-report', () => {
  it('counts low-cardinality Copilot pilot metrics without conversation text', () => {
    const report = buildCopilotPilotReport({
      args: {
        from: new Date('2026-07-01T00:00:00.000Z'),
        to: new Date('2026-07-31T23:59:59.999Z'),
        format: 'json',
        environment: 'pilot',
        pilotCaseId: 'case-01',
      },
      audits: [
        { action: 'copilot.conversation.created', createdAt: new Date(), details: {} },
        { action: 'copilot.message.saved', createdAt: new Date(), details: { analyticsEvent: 'copilot_message_sent' } },
        { action: 'copilot.action.edited', createdAt: new Date(), details: { analyticsEvent: 'copilot_action_edited' } },
        { action: 'copilot.action.approved', createdAt: new Date(), details: { analyticsEvent: 'copilot_action_approved' } },
        { action: 'copilot.execution.idempotent_replay', createdAt: new Date(), details: {} },
      ],
      executions: [
        {
          status: 'completed',
          createdAt: new Date(),
          startedAt: new Date('2026-07-10T10:00:00.000Z'),
          completedAt: new Date('2026-07-10T10:00:02.000Z'),
          createdObjectReferences: [{ type: 'StrategicFront', id: 'front-1' }],
          projectionLinks: [{ href: '/portfolio/frentes-estrategicos' }],
        },
      ],
    });

    expect(report.metrics.conversations).toBe(1);
    expect(report.metrics.edits).toBe(1);
    expect(report.metrics.approvals).toBe(1);
    expect(report.metrics.replays).toBe(1);
    expect(report.metrics.strategicFrontsCreated).toBe(1);
    expect(report.latencyMs.executionAverage).toBe(2000);
    expect(JSON.stringify(report)).not.toContain('Crea un frente');
  });

  it('renders missing instrumentation as sin datos in markdown', () => {
    const report = buildCopilotPilotReport({
      args: {
        from: new Date('2026-07-01T00:00:00.000Z'),
        to: new Date('2026-07-31T23:59:59.999Z'),
        format: 'markdown',
      },
      audits: [],
      executions: [],
    });

    expect(renderReport(report, 'markdown')).toContain('| actionPlanViewed | sin datos |');
  });

  it('parses CLI arguments', () => {
    expect(parseReportArgs(['--from=2026-07-01', '--to=2026-07-31', '--format=csv']).format).toBe('csv');
  });

  it('requires an explicit pilot report database URL', () => {
    expect(() => getPilotReportDatabaseUrl({})).toThrow(/PILOT_REPORT_DATABASE_URL is required/);
  });

  it('blocks starteria_db by default for pilot report reads', () => {
    expect(() => getPilotReportDatabaseUrl({
      PILOT_REPORT_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/starteria_db',
    })).toThrow(/starteria_db/);
  });
});
