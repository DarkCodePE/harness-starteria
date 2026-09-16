import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const databaseUrl = process.env.PILOT_DRY_RUN_DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:55433/starteria_pilot_dry_run?schema=public';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? databaseUrl;

const { PrismaClient } = await import('@prisma/client');

const prisma = new PrismaClient();
const isWindows = process.platform === 'win32';
const nodeCmd = process.execPath;
const initialBackendPort = Number.parseInt(process.env.PILOT_DRY_RUN_BACKEND_PORT ?? '4200', 10);
const initialFrontendPort = Number.parseInt(process.env.PILOT_DRY_RUN_FRONTEND_PORT ?? '5186', 10);
let backendPort = String(initialBackendPort);
let frontendPort = String(initialFrontendPort);
let apiBaseUrl = process.env.COPILOT_DRY_RUN_BASE_URL ?? `http://127.0.0.1:${backendPort}/api/v1`;
let healthUrl = `http://127.0.0.1:${backendPort}/api/health`;
let readinessUrl = `http://127.0.0.1:${backendPort}/api/readiness/copilot`;
let frontendUrl = `http://127.0.0.1:${frontendPort}`;
const password = process.env.COPILOT_DRY_RUN_PASSWORD ?? process.env.COPILOT_SMOKE_PASSWORD ?? 'demo123';
const runId = `resilience-${Date.now()}`;
const selectedCases = process.argv
  .filter((arg) => arg.startsWith('--case='))
  .map((arg) => arg.slice('--case='.length).toUpperCase());
const pauseForManual = process.argv.includes('--pause-for-manual');
const allCases = ['DR-11', 'DR-12', 'DR-13', 'DR-14', 'DR-15', 'DR-16'];
const casesToRun = selectedCases.length > 0 ? selectedCases : allCases;

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
type Session = { token: string; userId?: string; role?: string; organizationId?: string | null };
type Conversation = { id: string; status: string };
type ProposedAction = { id: string; version: number; status: string; proposedPayload: Record<string, unknown> };
type ActionPlan = { id: string; version: number; status: string; proposedActions: ProposedAction[] };
type Execution = {
  id: string;
  status: string;
  correlationId?: string | null;
  error?: { code: string; message: string; retryable: boolean } | null;
  createdObjectReferences: Array<{ type: string; id: string; label?: string }>;
  projectionLinks: Array<{ href: string; label: string; objectId?: string }>;
};
type CaseResult = {
  caseId: string;
  status: 'passed' | 'failed' | 'blocked';
  automatedEvidence: boolean;
  manualEvidence: boolean;
  summary: string;
  ids?: Record<string, unknown>;
  flags?: Record<string, string>;
  findings?: string[];
};

const evidence: {
  runId: string;
  timestamp: string;
  database: string;
  backend: string;
  frontend: string;
  cases: CaseResult[];
} = {
  runId,
  timestamp: new Date().toISOString(),
  database: safeDbName(databaseUrl),
  backend: '[per-case]',
  frontend: '[per-case]',
  cases: [],
};

let children: ChildProcess[] = [];
let shuttingDown = false;

function safeDbName(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '[invalid]';
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function redactKey(key: string): string {
  return `${key.slice(0, 18)}...[redacted]`;
}

function baseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...overrides,
    DATABASE_URL: databaseUrl,
    PILOT_REPORT_DATABASE_URL: process.env.PILOT_REPORT_DATABASE_URL ?? databaseUrl,
    NODE_ENV: overrides.NODE_ENV ?? process.env.PILOT_DRY_RUN_NODE_ENV ?? 'development',
    PORT: backendPort,
    CORS_ORIGIN: frontendUrl,
    COPILOT_ENABLED: overrides.COPILOT_ENABLED ?? 'true',
    COPILOT_WRITE_ENABLED: overrides.COPILOT_WRITE_ENABLED ?? 'true',
    COPILOT_CREATE_STRATEGIC_FRONT_ENABLED: overrides.COPILOT_CREATE_STRATEGIC_FRONT_ENABLED ?? 'true',
    COPILOT_ALLOWED_ORGANIZATION_IDS: overrides.COPILOT_ALLOWED_ORGANIZATION_IDS ?? 'org-pilot-dry-run',
    COPILOT_ASSESSMENT_ADAPTER: overrides.COPILOT_ASSESSMENT_ADAPTER ?? 'deterministic',
    AUTH_RATE_LIMIT_DISABLED: 'true',
    VITE_API_URL: apiBaseUrl,
    VITE_PORTFOLIO_COPILOT_ENABLED: overrides.VITE_PORTFOLIO_COPILOT_ENABLED ?? 'true',
    COPILOT_SMOKE_BASE_URL: apiBaseUrl,
    COPILOT_SMOKE_EMAIL: 'pilot.portfolio@starteria.test',
    COPILOT_SMOKE_PASSWORD: password,
    COPILOT_SMOKE_ORGANIZATION: 'org-pilot-dry-run',
  };
}

function configurePorts(caseIndex: number): void {
  backendPort = String(initialBackendPort + caseIndex);
  frontendPort = String(initialFrontendPort + caseIndex);
  refreshUrls();
}

function offsetPorts(offset: number): void {
  backendPort = String(Number.parseInt(backendPort, 10) + offset);
  frontendPort = String(Number.parseInt(frontendPort, 10) + offset);
  refreshUrls();
}

function refreshUrls(): void {
  apiBaseUrl = `http://127.0.0.1:${backendPort}/api/v1`;
  healthUrl = `http://127.0.0.1:${backendPort}/api/health`;
  readinessUrl = `http://127.0.0.1:${backendPort}/api/readiness/copilot`;
  frontendUrl = `http://127.0.0.1:${frontendPort}`;
}

function spawnService(label: string, command: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'ignore',
    shell: isWindows && command !== nodeCmd,
  });
  children.push(child);
  child.on('error', (error) => console.error(`[dry-run:resilience] ${label} error: ${error.message}`));
  child.on('close', () => {
    const index = children.indexOf(child);
    if (index >= 0) children.splice(index, 1);
  });
  return child;
}

async function processExists(pid: number): Promise<boolean> {
  if (!isWindows) {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
  return new Promise((resolve) => {
    const child = spawn('tasklist.exe', ['/FI', `PID eq ${pid}`, '/NH'], { stdio: 'pipe' });
    let output = '';
    child.stdout?.on('data', (chunk) => { output += String(chunk); });
    child.on('close', () => resolve(output.includes(String(pid))));
    child.on('error', () => resolve(false));
  });
}

function waitForClose(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.off('close', onClose);
      resolve(false);
    }, timeoutMs);
    const onClose = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    child.once('close', onClose);
  });
}

async function cleanup(): Promise<void> {
  shuttingDown = true;
  for (const child of [...children].reverse()) {
    if (!child.pid || child.killed || child.exitCode !== null || child.signalCode !== null) continue;
    if (!await processExists(child.pid)) continue;
    if (isWindows) {
      await new Promise<void>((resolve, reject) => {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'pipe' });
        let output = '';
        killer.stdout?.on('data', (chunk) => { output += String(chunk); });
        killer.stderr?.on('data', (chunk) => { output += String(chunk); });
        killer.on('close', (code) => {
          if (code && !/not found|no encontrado/i.test(output)) {
            reject(new Error(`taskkill pid=${child.pid} exit=${code}: ${output.trim()}`));
            return;
          }
          resolve();
        });
        killer.on('error', reject);
      });
      await waitForClose(child, 2_000);
    } else {
      child.kill('SIGTERM');
      if (await waitForClose(child, 2_000)) continue;
      child.kill('SIGKILL');
    }
  }
  children = [];
  await waitForEndpointDown(healthUrl, 'backend health');
  await waitForEndpointDown(frontendUrl, 'frontend');
}

async function waitForEndpointDown(url: string, label: string, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
    } catch {
      return;
    }
    await delay(250);
  }
  console.warn(`[dry-run:resilience] ${label} still responds after cleanup at ${url}`);
}

async function waitFor(url: string, label: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await delay(500);
  }
  throw new Error(`${label} not ready at ${url}: ${last}`);
}

async function startServices(env: NodeJS.ProcessEnv): Promise<void> {
  shuttingDown = false;
  spawnService('backend', nodeCmd, ['--import', 'tsx', '../backend/server.ts'], {
    ...env,
    NODE_PATH: './node_modules',
  });
  await waitFor(healthUrl, 'backend health');
  await waitFor(readinessUrl, 'copilot readiness');
  spawnService('frontend', nodeCmd, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', frontendPort], env);
  await waitFor(frontendUrl, 'frontend');
}

async function api<T>(pathName: string, init: RequestInit = {}, token?: string) {
  const response = await fetch(`${apiBaseUrl}${pathName}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const correlationId = response.headers.get('x-correlation-id') ?? response.headers.get('x-request-id');
  const text = await response.text();
  let body: ApiEnvelope<T> | undefined;
  try {
    body = text ? JSON.parse(text) as ApiEnvelope<T> : undefined;
  } catch {
    return { status: response.status, error: text.slice(0, 200), correlationId };
  }
  if (!response.ok || body?.success === false) {
    const error = body?.success === false ? `${body.error.code}: ${body.error.message}` : `HTTP ${response.status}`;
    return { status: response.status, error, correlationId };
  }
  return { status: response.status, data: body?.data, correlationId };
}

async function must<T>(result: ReturnType<typeof api<T>>, label: string): Promise<T> {
  const response = await result;
  if (response.status < 200 || response.status >= 300 || response.data === undefined) {
    throw new Error(`${label}: HTTP ${response.status} ${response.error ?? ''}`);
  }
  return response.data;
}

async function login(email = 'pilot.portfolio@starteria.test'): Promise<Session> {
  const auth = await must<{ accessToken: string; user?: { id: string; role: string; organizationId?: string | null } }>(
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    `login ${email}`,
  );
  return {
    token: auth.accessToken,
    userId: auth.user?.id,
    role: auth.user?.role,
    organizationId: auth.user?.organizationId,
  };
}

function completeMessage(name: string): string {
  return `Crea un frente llamado ${name}. Su objetivo es reducir el retrabajo en procesos internos. El KPI principal sera horas de retrabajo al mes, con baseline 500, meta 300, horizonte de 6 meses, prioridad alta y sponsor Gerencia de Operaciones.`;
}

async function createPlan(session: Session, name: string) {
  const conversation = await must<Conversation>(api('/copilot/conversations', { method: 'POST', body: '{}' }, session.token), 'create conversation');
  const message = await must<{ assessment?: { id: string }; actionPlan: ActionPlan | null }>(
    api(`/copilot/conversations/${conversation.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: completeMessage(name) }),
    }, session.token),
    'send complete message',
  );
  assert(message.actionPlan?.proposedActions[0], 'expected Action Plan and ProposedAction');
  return {
    conversation,
    assessmentId: message.assessment?.id,
    plan: message.actionPlan,
    action: message.actionPlan.proposedActions[0],
  };
}

async function approve(session: Session, action: ProposedAction): Promise<ProposedAction> {
  return must(api<ProposedAction>(`/copilot/actions/${action.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion: action.version }),
  }, session.token), 'approve action');
}

async function execute(session: Session, action: ProposedAction, idempotencyKey: string): Promise<Execution> {
  return must(api<Execution>(`/copilot/actions/${action.id}/execute`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ expectedVersion: action.version }),
  }, session.token), 'execute action');
}

async function frontCount(name: string): Promise<number> {
  return prisma.strategicFront.count({ where: { name } });
}

async function auditActions(resourceIds: Array<string | undefined | null>): Promise<string[]> {
  const ids = resourceIds.filter(Boolean) as string[];
  if (ids.length === 0) return [];
  const rows = await prisma.auditLog.findMany({
    where: { resourceId: { in: ids } },
    select: { action: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => row.action);
}

async function createApprovedPlanInNormalMode(name: string) {
  await startServices(baseEnv());
  try {
    const session = await login();
    const graph = await createPlan(session, name);
    const approved = await approve(session, graph.action);
    return { session, ...graph, action: approved };
  } finally {
    await cleanup();
  }
}

async function withServices<T>(env: NodeJS.ProcessEnv, fn: () => Promise<T>): Promise<T> {
  await startServices(env);
  try {
    return await fn();
  } finally {
    await cleanup();
  }
}

async function optionallyPause(caseId: string): Promise<void> {
  if (!pauseForManual) return;
  console.log(`[dry-run:resilience] ${caseId}: services are ready for manual review at ${frontendUrl}. Press Enter to continue.`);
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });
}

async function runCase(caseId: string): Promise<CaseResult> {
  const name = `${runId} ${caseId}`;
  if (caseId === 'DR-11') {
    return withServices(baseEnv({ COPILOT_CREATE_STRATEGIC_FRONT_ENABLED: 'false' }), async () => {
      const session = await login();
      const graph = await createPlan(session, name);
      const approval = await api(`/copilot/actions/${graph.action.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ expectedVersion: graph.action.version }),
      }, session.token);
      await optionallyPause(caseId);
      assert(approval.status === 403, `expected capability denial, got HTTP ${approval.status}`);
      assert(await frontCount(name) === 0, 'capability disabled created a StrategicFront');
      const audits = await auditActions([graph.action.id]);
      assert(audits.includes('copilot.feature_flag.denied.approve_action'), 'missing capability disabled audit event');
      return {
        caseId,
        status: 'passed',
        automatedEvidence: true,
        manualEvidence: false,
        summary: 'CreateStrategicFront disabled preserved plan/action and blocked approval/execution path before PortfolioService.',
        flags: { COPILOT_CREATE_STRATEGIC_FRONT_ENABLED: 'false' },
        ids: { conversationId: graph.conversation.id, actionPlanId: graph.plan.id, proposedActionId: graph.action.id, correlationId: approval.correlationId, auditActions: audits },
      };
    });
  }

  if (caseId === 'DR-12') {
    const graph = await createApprovedPlanInNormalMode(name);
    offsetPorts(100);
    return withServices(baseEnv({ COPILOT_WRITE_ENABLED: 'false' }), async () => {
      const session = await login();
      const readConversation = await api(`/copilot/conversations/${graph.conversation.id}`, {}, session.token);
      const readPlan = await api(`/copilot/conversations/${graph.conversation.id}/action-plan`, {}, session.token);
      const create = await api('/copilot/conversations', { method: 'POST', body: '{}' }, session.token);
      const send = await api(`/copilot/conversations/${graph.conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ content: completeMessage(`${name} blocked`) }) }, session.token);
      const edit = await api(`/copilot/actions/${graph.action.id}`, { method: 'PATCH', body: JSON.stringify({ expectedVersion: graph.action.version, proposedPayload: graph.action.proposedPayload }) }, session.token);
      const approval = await api(`/copilot/actions/${graph.action.id}/approve`, { method: 'POST', body: JSON.stringify({ expectedVersion: graph.action.version }) }, session.token);
      const rejection = await api(`/copilot/actions/${graph.action.id}/reject`, { method: 'POST', body: JSON.stringify({ expectedVersion: graph.action.version, reason: 'write disabled' }) }, session.token);
      const execution = await api(`/copilot/actions/${graph.action.id}/execute`, { method: 'POST', headers: { 'Idempotency-Key': `${runId}:dr12` }, body: JSON.stringify({ expectedVersion: graph.action.version }) }, session.token);
      await optionallyPause(caseId);
      assert(readConversation.status === 200 && readPlan.status === 200, 'write kill switch blocked reads');
      for (const [label, response] of Object.entries({ create, send, edit, approval, rejection, execution })) {
        assert(response.status === 403, `${label} was not blocked by write kill switch: HTTP ${response.status}`);
      }
      const audits = await auditActions([graph.conversation.id, graph.action.id]);
      assert(audits.some((action) => action.startsWith('copilot.feature_flag.denied')), 'missing write kill switch audit event');
      return {
        caseId,
        status: 'passed',
        automatedEvidence: true,
        manualEvidence: false,
        summary: 'Write kill switch preserved reads and blocked all Copilot mutations.',
        flags: { COPILOT_WRITE_ENABLED: 'false' },
        ids: { conversationId: graph.conversation.id, actionPlanId: graph.plan.id, proposedActionId: graph.action.id, correlationIds: [create.correlationId, send.correlationId, edit.correlationId, approval.correlationId, rejection.correlationId, execution.correlationId], auditActions: audits },
      };
    });
  }

  if (caseId === 'DR-13') {
    const graph = await createApprovedPlanInNormalMode(name);
    offsetPorts(100);
    const disabled = await withServices(baseEnv({ COPILOT_ENABLED: 'false', VITE_PORTFOLIO_COPILOT_ENABLED: 'false' }), async () => {
      const session = await login();
      const read = await api(`/copilot/conversations/${graph.conversation.id}`, {}, session.token);
      const create = await api('/copilot/conversations', { method: 'POST', body: '{}' }, session.token);
      const portfolio = await api('/portfolio/strategic-fronts', {}, session.token);
      await optionallyPause(caseId);
      assert(read.status === 403 && create.status === 403, 'total kill switch did not block Copilot');
      assert(portfolio.status === 200, 'total kill switch broke Portfolio read path');
      return { read, create };
    });
    offsetPorts(100);
    return withServices(baseEnv(), async () => {
      const session = await login();
      const recovered = await api(`/copilot/conversations/${graph.conversation.id}/action-plan`, {}, session.token);
      assert(recovered.status === 200, 'Copilot data did not recover after reactivation');
      return {
        caseId,
        status: 'passed',
        automatedEvidence: true,
        manualEvidence: false,
        summary: 'Total kill switch blocked Copilot operations, preserved Portfolio, and recovered existing plan after reactivation.',
        flags: { COPILOT_ENABLED: 'false' },
        ids: { conversationId: graph.conversation.id, actionPlanId: graph.plan.id, proposedActionId: graph.action.id, correlationIds: [disabled.read.correlationId, disabled.create.correlationId, recovered.correlationId] },
      };
    });
  }

  if (caseId === 'DR-14') {
    return withServices(baseEnv({
      COPILOT_DRY_RUN_FAILURE_INJECTION_ENABLED: 'true',
      COPILOT_DRY_RUN_PORTFOLIO_FAILURE_MODE: 'before_create',
    }), async () => {
      const session = await login();
      const graph = await createPlan(session, name);
      const approved = await approve(session, graph.action);
      const execution = await execute(session, approved, `${runId}:dr14`);
      await optionallyPause(caseId);
      assert(execution.status === 'failed', `expected failed execution, got ${execution.status}`);
      assert(await frontCount(name) === 0, 'before_create failure created a StrategicFront');
      const audits = await auditActions([execution.id, graph.action.id]);
      assert(audits.includes('copilot.execution.failed'), 'missing execution failed audit event');
      return {
        caseId,
        status: 'passed',
        automatedEvidence: true,
        manualEvidence: false,
        summary: 'Failure injection before Portfolio create failed safely with no StrategicFront and failed ledger.',
        flags: { COPILOT_DRY_RUN_PORTFOLIO_FAILURE_MODE: 'before_create' },
        ids: { conversationId: graph.conversation.id, actionPlanId: graph.plan.id, proposedActionId: graph.action.id, actionExecutionId: execution.id, correlationId: execution.correlationId, error: execution.error?.code, auditActions: audits },
      };
    });
  }

  if (caseId === 'DR-15') {
    const created = await withServices(baseEnv(), async () => {
      const session = await login();
      const graph = await createPlan(session, name);
      const approved = await approve(session, graph.action);
      const key = `${runId}:dr15`;
      const execution = await execute(session, approved, key);
      assert(execution.status === 'completed', `expected completed execution, got ${execution.status}`);
      assert(await frontCount(name) === 1, 'expected one StrategicFront after command');
      return { session, graph, approved, execution, key };
    });
    offsetPorts(100);
    const failedRead = await withServices(baseEnv({
      COPILOT_DRY_RUN_FAILURE_INJECTION_ENABLED: 'true',
      COPILOT_DRY_RUN_PROJECTION_FAILURE_MODE: 'strategic_fronts_read',
    }), async () => {
      const session = await login();
      const read = await api('/portfolio/strategic-fronts', {}, session.token);
      const replay = await execute(session, created.approved, created.key);
      await optionallyPause(caseId);
      assert(read.status === 503, `expected projection read failure, got HTTP ${read.status}`);
      assert(['completed', 'idempotent_replay'].includes(replay.status), `unexpected replay status ${replay.status}`);
      assert(await frontCount(name) === 1, 'projection read failure caused duplicate StrategicFront');
      return { read, replay };
    });
    offsetPorts(100);
    return withServices(baseEnv(), async () => {
      const session = await login();
      const restored = await api<Array<{ name: string }>>('/portfolio/strategic-fronts', {}, session.token);
      assert(restored.status === 200, 'projection read did not recover after restoring failure injection');
      assert((restored.data ?? []).filter((front) => front.name === name).length === 1, 'restored map did not show exactly one front');
      return {
        caseId,
        status: 'passed',
        automatedEvidence: true,
        manualEvidence: false,
        summary: 'Projection read failure after successful command did not reexecute or duplicate; restored read showed the front.',
        flags: { COPILOT_DRY_RUN_PROJECTION_FAILURE_MODE: 'strategic_fronts_read' },
        ids: { conversationId: created.graph.conversation.id, actionPlanId: created.graph.plan.id, proposedActionId: created.approved.id, actionExecutionId: created.execution.id, strategicFrontId: created.execution.createdObjectReferences[0]?.id, idempotencyKey: redactKey(created.key), correlationIds: [failedRead.read.correlationId, failedRead.replay.correlationId, restored.correlationId] },
      };
    });
  }

  if (caseId === 'DR-16') {
    const created = await withServices(baseEnv(), async () => {
      const session = await login();
      const graph = await createPlan(session, name);
      const approved = await approve(session, graph.action);
      const execution = await execute(session, approved, `${runId}:dr16`);
      return { graph, approved, execution };
    });
    const [conversation, plan, action, execution, audits] = await Promise.all([
      prisma.copilotConversation.findUnique({ where: { id: created.graph.conversation.id }, select: { id: true, status: true } }),
      prisma.actionPlan.findUnique({ where: { id: created.graph.plan.id }, select: { id: true, status: true, version: true } }),
      prisma.proposedAction.findUnique({ where: { id: created.approved.id }, select: { id: true, status: true, version: true, approvedAt: true } }),
      prisma.actionExecution.findUnique({ where: { id: created.execution.id }, select: { id: true, status: true, createdObjectReferences: true, projectionLinks: true } }),
      prisma.auditLog.findMany({ where: { resourceId: { in: [created.graph.conversation.id, created.graph.plan.id, created.approved.id, created.execution.id] } }, select: { action: true }, orderBy: { createdAt: 'asc' } }),
    ]);
    assert(conversation && plan && action && execution, 'support reconstruction missing core records');
    assert(action.approvedAt && execution.status === 'completed', 'support could not establish approval and completion');
    assert(Array.isArray(execution.createdObjectReferences) && execution.createdObjectReferences.length === 1, 'support could not establish created front reference');
    return {
      caseId,
      status: 'passed',
      automatedEvidence: true,
      manualEvidence: false,
      summary: 'Automated support reconstruction confirmed approval version, execution completion, front reference and audit trail; human support simulation remains pending.',
      ids: { conversationId: conversation.id, actionPlanId: plan.id, proposedActionId: action.id, approvedVersion: action.version, actionExecutionId: execution.id, auditActions: audits.map((row) => row.action) },
      findings: ['finding-6d-001'],
    };
  }

  return {
    caseId,
    status: 'blocked',
    automatedEvidence: false,
    manualEvidence: false,
    summary: `Unknown case ${caseId}.`,
  };
}

async function main(): Promise<void> {
  if (safeDbName(databaseUrl) !== 'starteria_pilot_dry_run') {
    throw new Error(`Refusing resilience dry run against ${safeDbName(databaseUrl)}.`);
  }
  for (const [index, caseId] of casesToRun.entries()) {
    configurePorts(index);
    try {
      console.log(`[dry-run:resilience] ${caseId} start backend=${backendPort} frontend=${frontendPort}`);
      const result = await runCase(caseId);
      evidence.cases.push(result);
      console.log(`[dry-run:resilience] ${caseId} ${result.status}`);
    } catch (error) {
      await cleanup();
      const message = error instanceof Error ? error.message : String(error);
      evidence.cases.push({
        caseId,
        status: 'failed',
        automatedEvidence: true,
        manualEvidence: false,
        summary: message,
        findings: [`finding-6d-${caseId.toLowerCase()}-failed`],
      });
      console.error(`[dry-run:resilience] ${caseId} failed: ${message}`);
    }
  }
  const outDir = path.resolve(process.cwd(), '.pilot-dry-run');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${runId}.json`);
  await writeFile(outPath, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`[dry-run:resilience] evidence=${outPath}`);
  const failed = evidence.cases.filter((item) => item.status === 'failed');
  if (failed.length > 0) {
    throw new Error(`Resilience dry run failed: ${failed.map((item) => item.caseId).join(', ')}`);
  }
}

process.on('SIGINT', () => cleanup().finally(() => process.exit(130)));
process.on('SIGTERM', () => cleanup().finally(() => process.exit(143)));

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
    if (shuttingDown) process.exit(process.exitCode ?? 0);
  });
