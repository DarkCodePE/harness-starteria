import { PrismaClient } from '@prisma/client';

export type ReportFormat = 'json' | 'markdown' | 'csv';

export interface ReportArgs {
  from: Date;
  to: Date;
  format: ReportFormat;
  environment?: string;
  pilotCaseId?: string;
}

export interface CopilotPilotReport {
  generatedAt: string;
  range: { from: string; to: string };
  filters: { environment: string | null; pilotCaseId: string | null };
  metrics: Record<string, number | null>;
  latencyMs: Record<string, number | null>;
  notes: string[];
}

type AuditRow = { action: string; createdAt: Date; details: unknown };
type ExecutionRow = {
  status: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdObjectReferences: unknown;
  projectionLinks: unknown;
};

const REQUIRED_TABLES = [
  '_prisma_migrations',
  'AuditLog',
  'CopilotConversation',
  'IntentAssessment',
  'ActionPlan',
  'ProposedAction',
  'ActionExecution',
  'StrategicFront',
] as const;

const COPILOT_ACTIONS = [
  'copilot.conversation.created',
  'copilot.message.saved',
  'copilot.intent.assessed',
  'copilot.missing_information.requested',
  'copilot.action_plan.generated',
  'copilot.plan.resumed',
  'copilot.action.edited',
  'copilot.action.approved',
  'copilot.action.rejected',
  'copilot.execution.created',
  'copilot.execution.started',
  'copilot.execution.completed',
  'copilot.execution.failed',
  'copilot.execution.idempotent_replay',
  'copilot.execution.manual_review_required',
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function countAudit(rows: AuditRow[], action: string): number {
  return rows.filter((row) => row.action === action).length;
}

function countByAnalytics(rows: AuditRow[], analyticsEvent: string): number {
  return rows.filter((row) => asRecord(row.details).analyticsEvent === analyticsEvent).length;
}

function countCreatedFronts(executions: ExecutionRow[]): number {
  return executions.reduce((total, execution) => {
    const refs = Array.isArray(execution.createdObjectReferences) ? execution.createdObjectReferences : [];
    return total + refs.filter((ref) => asRecord(ref).type === 'StrategicFront').length;
  }, 0);
}

function countProjectionLinks(executions: ExecutionRow[]): number {
  return executions.reduce((total, execution) => {
    const links = Array.isArray(execution.projectionLinks) ? execution.projectionLinks : [];
    return total + links.length;
  }, 0);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildCopilotPilotReport(input: {
  args: ReportArgs;
  audits: AuditRow[];
  executions: ExecutionRow[];
}): CopilotPilotReport {
  const { args, audits, executions } = input;
  const completedExecutions = executions.filter((execution) => execution.status === 'completed');
  const executionDurations = completedExecutions
    .filter((execution) => execution.startedAt && execution.completedAt)
    .map((execution) => execution.completedAt!.getTime() - execution.startedAt!.getTime());

  return {
    generatedAt: new Date().toISOString(),
    range: { from: args.from.toISOString(), to: args.to.toISOString() },
    filters: {
      environment: args.environment ?? null,
      pilotCaseId: args.pilotCaseId ?? null,
    },
    metrics: {
      conversations: countAudit(audits, 'copilot.conversation.created'),
      messages: countAudit(audits, 'copilot.message.saved'),
      assessments: countAudit(audits, 'copilot.intent.assessed'),
      actionPlans: countAudit(audits, 'copilot.action_plan.generated'),
      clarifications: countAudit(audits, 'copilot.missing_information.requested'),
      edits: countByAnalytics(audits, 'copilot_action_edited'),
      approvals: countByAnalytics(audits, 'copilot_action_approved'),
      rejections: countByAnalytics(audits, 'copilot_action_rejected'),
      executionRequests: countByAnalytics(audits, 'copilot_execution_requested'),
      executionCompleted: completedExecutions.length,
      executionFailed: executions.filter((execution) => execution.status === 'failed').length,
      manualReviewRequired: executions.filter((execution) => execution.status === 'manual_review_required').length,
      replays: countAudit(audits, 'copilot.execution.idempotent_replay'),
      strategicFrontsCreated: countCreatedFronts(executions),
      projectionLinks: countProjectionLinks(executions),
      actionPlanViewed: null,
      portfolioCopilotViewed: null,
      projectionOpened: null,
    },
    latencyMs: {
      executionAverage: average(executionDurations),
      timeToActionPlanAverage: null,
      timeToApprovalAverage: null,
      timeToFrontCreatedAverage: average(executionDurations),
    },
    notes: [
      'Report reads AuditLog and ActionExecution only; it does not export full conversation text.',
      'Null metrics require additional frontend analytics or observation data.',
      'Use pilotCaseId and environment only when those low-cardinality values are present in AuditLog.details.',
    ],
  };
}

export function parseReportArgs(argv: string[]): ReportArgs {
  const values = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, value = ''] = arg.slice(2).split('=');
    values.set(key, value);
  }
  const from = values.get('from');
  const to = values.get('to');
  const format = values.get('format') ?? 'markdown';
  if (values.has('preflight')) {
    return {
      from: new Date('1970-01-01T00:00:00.000Z'),
      to: new Date('1970-01-01T00:00:00.000Z'),
      format: 'json',
    };
  }
  if (!from || !to) {
    throw new Error('Usage: npm run pilot:report -- --from=YYYY-MM-DD --to=YYYY-MM-DD [--format=markdown|json|csv]');
  }
  if (!['json', 'markdown', 'csv'].includes(format)) {
    throw new Error('Invalid --format. Use markdown, json or csv.');
  }
  return {
    from: new Date(`${from}T00:00:00.000Z`),
    to: new Date(`${to}T23:59:59.999Z`),
    format: format as ReportFormat,
    environment: values.get('environment') || undefined,
    pilotCaseId: values.get('case') || values.get('pilotCaseId') || undefined,
  };
}

export function getPilotReportDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.PILOT_REPORT_DATABASE_URL;
  if (!url) {
    throw new Error('PILOT_REPORT_DATABASE_URL is required. Refusing to fall back to DATABASE_URL.');
  }
  if (/starteria_db(?:\?|$)/.test(url) && env.PILOT_REPORT_ALLOW_STARTERIA_DB !== 'true') {
    throw new Error('PILOT_REPORT_DATABASE_URL points to starteria_db. Set a pilot/dry-run DB or explicitly allow after review.');
  }
  return url;
}

export async function preflightPilotReportDatabase(databaseUrl: string): Promise<{ ok: true; appliedMigrations: number; tables: string[] }> {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const tableNames = tables.map((table) => table.table_name);
    const missing = REQUIRED_TABLES.filter((table) => !tableNames.includes(table));
    if (missing.length > 0) {
      throw new Error(`Pilot report database is missing required tables: ${missing.join(', ')}`);
    }
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;
    if (migrations.length === 0) {
      throw new Error('Pilot report database has no applied Prisma migrations.');
    }
    return { ok: true, appliedMigrations: migrations.length, tables: tableNames.sort() };
  } finally {
    await prisma.$disconnect();
  }
}

export function renderReport(report: CopilotPilotReport, format: ReportFormat): string {
  if (format === 'json') return JSON.stringify(report, null, 2);
  if (format === 'csv') {
    const lines = ['section,key,value'];
    for (const [key, value] of Object.entries(report.metrics)) lines.push(`metrics,${key},${value ?? ''}`);
    for (const [key, value] of Object.entries(report.latencyMs)) lines.push(`latencyMs,${key},${value ?? ''}`);
    return lines.join('\n');
  }
  const metricLines = Object.entries(report.metrics).map(([key, value]) => `| ${key} | ${value ?? 'sin datos'} |`);
  const latencyLines = Object.entries(report.latencyMs).map(([key, value]) => `| ${key} | ${value ?? 'sin datos'} |`);
  return [
    '# Copilot Pilot Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Range: ${report.range.from} to ${report.range.to}`,
    `Environment: ${report.filters.environment ?? 'sin filtro'}`,
    `Pilot case: ${report.filters.pilotCaseId ?? 'sin filtro'}`,
    '',
    '## Metrics',
    '| Metric | Value |',
    '| --- | --- |',
    ...metricLines,
    '',
    '## Latency',
    '| Metric | Value ms |',
    '| --- | --- |',
    ...latencyLines,
    '',
    '## Notes',
    ...report.notes.map((note) => `- ${note}`),
    '',
  ].join('\n');
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseReportArgs(argv);
  const databaseUrl = getPilotReportDatabaseUrl();
  const preflight = await preflightPilotReportDatabase(databaseUrl);
  if (argv.includes('--preflight')) {
    console.log(JSON.stringify(preflight, null, 2));
    return;
  }
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const audits = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: args.from, lte: args.to },
        action: { in: [...COPILOT_ACTIONS] },
      },
      select: { action: true, createdAt: true, details: true },
      orderBy: { createdAt: 'asc' },
    });
    const executions = await prisma.actionExecution.findMany({
      where: { createdAt: { gte: args.from, lte: args.to } },
      select: {
        status: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        createdObjectReferences: true,
        projectionLinks: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(renderReport(buildCopilotPilotReport({ args, audits, executions }), args.format));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith('generate-copilot-pilot-report.ts')) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
