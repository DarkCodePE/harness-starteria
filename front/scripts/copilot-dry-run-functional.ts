import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const baseUrl = process.env.COPILOT_DRY_RUN_BASE_URL
  ?? process.env.COPILOT_SMOKE_BASE_URL
  ?? 'http://127.0.0.1:4200/api/v1';
const databaseUrl = process.env.DATABASE_URL ?? '';
const password = process.env.COPILOT_DRY_RUN_PASSWORD ?? process.env.COPILOT_SMOKE_PASSWORD ?? 'demo123';
const allowAnyDb = process.env.PILOT_DRY_RUN_ALLOW_ANY_DB === 'true';
const runId = `dry-run-${Date.now()}`;
const prisma = new PrismaClient();

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
type Session = { label: string; email: string; token: string; userId?: string; role?: string; organizationId?: string | null };
type ProposedAction = {
  id: string;
  version: number;
  status: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  proposedPayload: Record<string, unknown>;
};
type ActionPlan = { id: string; version: number; status: string; proposedActions: ProposedAction[] };
type Conversation = { id: string; status: string; organizationId?: string };
type Execution = {
  id: string;
  status: string;
  correlationId?: string | null;
  createdObjectReferences: Array<{ id: string; type: string; label?: string }>;
  projectionLinks: Array<{ href: string; label: string; objectId?: string }>;
};
type CaseEvidence = {
  caseId: string;
  status: 'passed' | 'failed' | 'not_executed';
  automated: boolean;
  manual: boolean;
  summary: string;
  ids?: Record<string, unknown>;
  findings?: string[];
};

const evidence: {
  runId: string;
  timestamp: string;
  baseUrl: string;
  database: string;
  cases: CaseEvidence[];
} = {
  runId,
  timestamp: new Date().toISOString(),
  baseUrl,
  database: safeDbName(databaseUrl),
  cases: [],
};

function safeDbName(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '[invalid]';
  }
}

function redactKey(key: string): string {
  return `${key.slice(0, 18)}...[redacted]`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function api<T>(pathName: string, init: RequestInit = {}, token?: string): Promise<{ status: number; data?: T; error?: string; correlationId?: string | null }> {
  const response = await fetch(`${baseUrl}${pathName}`, {
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
    return { status: response.status, error: text.slice(0, 300), correlationId };
  }
  if (!response.ok || body?.success === false) {
    const error = body?.success === false ? `${body.error.code}: ${body.error.message}` : `HTTP ${response.status}`;
    return { status: response.status, error, correlationId };
  }
  return { status: response.status, data: body?.data, correlationId };
}

async function must<T>(result: Promise<{ status: number; data?: T; error?: string }>, message: string): Promise<T> {
  const response = await result;
  if (response.status < 200 || response.status >= 300 || response.data === undefined) {
    throw new Error(`${message}: HTTP ${response.status} ${response.error ?? ''}`.trim());
  }
  return response.data;
}

async function login(label: string, email: string): Promise<Session> {
  const auth = await must<{ accessToken: string; user?: { id: string; role: string; organizationId?: string | null } }>(
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    `login ${label}`,
  );
  return {
    label,
    email,
    token: auth.accessToken,
    userId: auth.user?.id,
    role: auth.user?.role,
    organizationId: auth.user?.organizationId,
  };
}

async function createConversation(session: Session): Promise<Conversation> {
  return must(api<Conversation>('/copilot/conversations', { method: 'POST', body: '{}' }, session.token), `create conversation ${session.label}`);
}

async function send(session: Session, conversationId: string, content: string) {
  return must<{
    userMessage: { id: string };
    assessment?: { id: string; missingInformation?: string[] };
    actionPlan?: ActionPlan | null;
    missingInformation?: string[];
  }>(
    api(`/copilot/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, session.token),
    `send message ${session.label}`,
  );
}

async function getPlan(session: Session, conversationId: string): Promise<ActionPlan | null> {
  const response = await api<ActionPlan | null>(`/copilot/conversations/${conversationId}/action-plan`, {}, session.token);
  if (response.status === 404) return null;
  if (response.status < 200 || response.status >= 300) throw new Error(`get plan failed: HTTP ${response.status} ${response.error ?? ''}`);
  return response.data ?? null;
}

async function edit(session: Session, action: ProposedAction, payload: Record<string, unknown>): Promise<ProposedAction> {
  return must(api<ProposedAction>(
    `/copilot/actions/${action.id}`,
    { method: 'PATCH', body: JSON.stringify({ expectedVersion: action.version, proposedPayload: payload }) },
    session.token,
  ), 'edit action');
}

async function approve(session: Session, action: ProposedAction): Promise<ProposedAction> {
  return must(api<ProposedAction>(
    `/copilot/actions/${action.id}/approve`,
    { method: 'POST', body: JSON.stringify({ expectedVersion: action.version }) },
    session.token,
  ), 'approve action');
}

async function reject(session: Session, action: ProposedAction, reason = 'Dry run rejection') {
  return must(api<ProposedAction>(
    `/copilot/actions/${action.id}/reject`,
    { method: 'POST', body: JSON.stringify({ expectedVersion: action.version, reason }) },
    session.token,
  ), 'reject action');
}

async function execute(session: Session, action: ProposedAction, idempotencyKey: string): Promise<Execution> {
  return must(api<Execution>(
    `/copilot/actions/${action.id}/execute`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion: action.version }),
    },
    session.token,
  ), 'execute action');
}

async function executeRaw(session: Session, action: ProposedAction, idempotencyKey: string) {
  return api<Execution>(
    `/copilot/actions/${action.id}/execute`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion: action.version }),
    },
    session.token,
  );
}

async function frontCount(name: string): Promise<number> {
  return prisma.strategicFront.count({ where: { name } });
}

async function auditActions(resourceIds: string[]): Promise<string[]> {
  if (resourceIds.length === 0) return [];
  const rows = await prisma.auditLog.findMany({
    where: { resourceId: { in: resourceIds } },
    select: { action: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => row.action);
}

function completeMessage(name: string) {
  return `Crea un frente llamado ${name}. Su objetivo es reducir retrabajo interno. El KPI principal sera horas de retrabajo al mes, con baseline 500, meta 300, horizonte de 6 meses, prioridad alta y sponsor Gerencia de Operaciones.`;
}

async function createPlan(session: Session, name: string): Promise<{ conversation: Conversation; action: ProposedAction; plan: ActionPlan; assessmentId?: string }> {
  const conversation = await createConversation(session);
  const response = await send(session, conversation.id, completeMessage(name));
  const plan = response.actionPlan;
  assert(plan, 'expected action plan');
  const action = plan.proposedActions[0];
  assert(action, 'expected proposed action');
  return { conversation, action, plan, assessmentId: response.assessment?.id };
}

async function record(caseId: string, fn: () => Promise<CaseEvidence>) {
  try {
    evidence.cases.push(await fn());
    console.log(`[dry-run:functional] ${caseId} passed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    evidence.cases.push({ caseId, status: 'failed', automated: true, manual: false, summary: message, findings: [`DRY-${caseId}-FAIL`] });
    console.error(`[dry-run:functional] ${caseId} failed: ${message}`);
  }
}

async function main() {
  const dbName = safeDbName(databaseUrl);
  if (!allowAnyDb && dbName !== 'starteria_pilot_dry_run') {
    throw new Error(`Refusing functional dry run against database ${dbName}. Set PILOT_DRY_RUN_ALLOW_ANY_DB=true only for an explicitly disposable DB.`);
  }

  const health = await fetch(baseUrl.replace(/\/api\/v1\/?$/, '/api/health'));
  assert(health.ok, `health failed HTTP ${health.status}`);

  const lead = await login('portfolio-lead', process.env.COPILOT_DRY_RUN_LEAD_EMAIL ?? 'pilot.portfolio@starteria.test');
  const viewer = await login('viewer', process.env.COPILOT_DRY_RUN_VIEWER_EMAIL ?? 'pilot.viewer@starteria.test');
  const other = await login('other-org', process.env.COPILOT_DRY_RUN_OTHER_ORG_EMAIL ?? 'pilot.other-org@starteria.test');

  await record('DR-01', async () => {
    const name = `${runId} complete`;
    const { conversation, plan, action, assessmentId } = await createPlan(lead, name);
    assert(action.requiresConfirmation === true, 'action must require confirmation');
    assert(await frontCount(name) === 0, 'front was created before approval/execution');
    const approved = await approve(lead, action);
    const key = `${runId}:dr01`;
    const execution = await execute(lead, approved, key);
    assert(execution.status === 'completed', `unexpected execution status ${execution.status}`);
    assert(await frontCount(name) === 1, 'expected exactly one front after execution');
    const audits = await auditActions([conversation.id, plan.id, action.id, execution.id]);
    return {
      caseId: 'DR-01',
      status: 'passed',
      automated: true,
      manual: false,
      summary: 'Complete request generated, approved and executed one StrategicFront.',
      ids: { conversationId: conversation.id, intentAssessmentId: assessmentId, actionPlanId: plan.id, proposedActionId: action.id, actionExecutionId: execution.id, strategicFrontId: execution.createdObjectReferences[0]?.id, idempotencyKey: redactKey(key), correlationId: execution.correlationId, auditActions: audits },
    };
  });

  await record('DR-02', async () => {
    const conversation = await createConversation(lead);
    const first = await send(lead, conversation.id, 'Quiero crear un frente de eficiencia operativa.');
    assert(!first.actionPlan, 'incomplete request should not create an action plan');
    assert((first.missingInformation ?? first.assessment?.missingInformation ?? []).length > 0, 'missing information should be visible');
    const second = await send(lead, conversation.id, completeMessage(`${runId} incomplete completed`));
    assert(second.actionPlan?.proposedActions[0], 'completed clarification should create action plan');
    return {
      caseId: 'DR-02',
      status: 'passed',
      automated: true,
      manual: false,
      summary: 'Incomplete request produced missing information; additional context generated an Action Plan.',
      ids: { conversationId: conversation.id, intentAssessmentId: second.assessment?.id, actionPlanId: second.actionPlan?.id },
    };
  });

  await record('DR-03', async () => {
    const name = `${runId} edited`;
    const { conversation, action } = await createPlan(lead, `${runId} edit before`);
    const payload = { ...action.proposedPayload, name, mainKpi: 'costo de retrabajo mensual', priority: 'Media' };
    const edited = await edit(lead, action, payload);
    assert(edited.version === action.version + 1, 'edit should increment version');
    const approved = await approve(lead, edited);
    const execution = await execute(lead, approved, `${runId}:dr03`);
    assert(await frontCount(name) === 1, 'created front should match edited payload');
    return { caseId: 'DR-03', status: 'passed', automated: true, manual: false, summary: 'Edit before approval incremented version and execution used edited payload.', ids: { conversationId: conversation.id, proposedActionId: action.id, actionExecutionId: execution.id } };
  });

  await record('DR-04', async () => {
    const { action } = await createPlan(lead, `${runId} post approval`);
    const approved = await approve(lead, action);
    const edited = await edit(lead, approved, { ...approved.proposedPayload, name: `${runId} post approval edited` });
    assert(edited.version === approved.version + 1, 'post-approval edit should increment version');
    assert(!edited.approvedAt && !edited.approvedBy, 'post-approval edit should invalidate approval');
    const denied = await executeRaw(lead, edited, `${runId}:dr04-denied`);
    assert(denied.status >= 400, 'execution should be disabled until reapproval');
    const reapproved = await approve(lead, edited);
    const execution = await execute(lead, reapproved, `${runId}:dr04`);
    return { caseId: 'DR-04', status: 'passed', automated: true, manual: false, summary: 'Edit after approval invalidated approval and required a new approval.', ids: { proposedActionId: action.id, actionExecutionId: execution.id } };
  });

  await record('DR-05', async () => {
    const name = `${runId} rejected`;
    const { conversation, action } = await createPlan(lead, name);
    const rejected = await reject(lead, action);
    assert(rejected.status === 'rejected', 'action should be rejected');
    const denied = await executeRaw(lead, rejected, `${runId}:dr05`);
    assert(denied.status >= 400, 'rejected action must not execute');
    assert(await frontCount(name) === 0, 'rejected action must not create a front');
    return { caseId: 'DR-05', status: 'passed', automated: true, manual: false, summary: 'Rejected proposal stayed traceable and could not execute.', ids: { conversationId: conversation.id, proposedActionId: action.id } };
  });

  await record('DR-06', async () => {
    const name = `${runId} no permission`;
    const start = await api<Conversation>('/copilot/conversations', { method: 'POST', body: '{}' }, viewer.token);
    if (start.status === 403 || start.status === 401) {
      assert(await frontCount(name) === 0, 'unauthorized user must not create a front');
      return {
        caseId: 'DR-06',
        status: 'passed',
        automated: true,
        manual: false,
        summary: 'Viewer authenticated but was blocked before conversation mutation; no StrategicFront was created.',
        ids: { correlationId: start.correlationId, denialStatus: start.status },
      };
    }
    assert(start.data, `unexpected conversation response HTTP ${start.status}`);
    const response = await send(viewer, start.data.id, completeMessage(name));
    const action = response.actionPlan?.proposedActions[0];
    assert(action, 'viewer flow did not produce an action to check approval denial');
    const denied = await api(`/copilot/actions/${action.id}/approve`, { method: 'POST', body: JSON.stringify({ expectedVersion: action.version }) }, viewer.token);
    assert(denied.status === 403 || denied.status === 401, `expected permission denial, got HTTP ${denied.status}`);
    assert(await frontCount(name) === 0, 'unauthorized user must not create a front');
    return { caseId: 'DR-06', status: 'passed', automated: true, manual: false, summary: 'Viewer can authenticate but cannot approve or execute CreateStrategicFront.', ids: { conversationId: start.data.id, proposedActionId: action.id, correlationId: denied.correlationId } };
  });

  await record('DR-07', async () => {
    const { conversation, action } = await createPlan(lead, `${runId} org isolation`);
    const conversationRead = await api(`/copilot/conversations/${conversation.id}`, {}, other.token);
    const planRead = await api(`/copilot/conversations/${conversation.id}/action-plan`, {}, other.token);
    const approval = await api(`/copilot/actions/${action.id}/approve`, { method: 'POST', body: JSON.stringify({ expectedVersion: action.version }) }, other.token);
    assert(conversationRead.status >= 400, 'other organization should not read conversation');
    assert(planRead.status >= 400, 'other organization should not read plan');
    assert(approval.status >= 400, 'other organization should not approve action');
    return { caseId: 'DR-07', status: 'passed', automated: true, manual: false, summary: 'Other organization was denied access to conversation, plan and approval.', ids: { conversationId: conversation.id, proposedActionId: action.id, correlationIds: [conversationRead.correlationId, planRead.correlationId, approval.correlationId] } };
  });

  await record('DR-08', async () => {
    const { conversation, action } = await createPlan(lead, `${runId} recovery`);
    const beforeApproval = await getPlan(lead, conversation.id);
    const approved = await approve(lead, action);
    const afterApproval = await getPlan(lead, conversation.id);
    const execution = await execute(lead, approved, `${runId}:dr08`);
    const afterExecution = await getPlan(lead, conversation.id);
    assert(beforeApproval?.proposedActions[0]?.id === action.id, 'recovery before approval lost action');
    assert(afterApproval?.proposedActions[0]?.status === 'approved', 'recovery after approval lost status');
    assert(afterExecution?.proposedActions[0]?.status === 'completed', 'recovery after execution lost completion');
    return { caseId: 'DR-08', status: 'passed', automated: true, manual: false, summary: 'API re-read recovered conversation and plan states after approval and completion.', ids: { conversationId: conversation.id, proposedActionId: action.id, actionExecutionId: execution.id } };
  });

  await record('DR-09', async () => {
    const name = `${runId} replay`;
    const { action } = await createPlan(lead, name);
    const approved = await approve(lead, action);
    const key = `${runId}:dr09`;
    const first = await execute(lead, approved, key);
    const replay = await execute(lead, approved, key);
    assert(['completed', 'idempotent_replay'].includes(replay.status), `unexpected replay status ${replay.status}`);
    assert(await frontCount(name) === 1, 'replay created a duplicate StrategicFront');
    return { caseId: 'DR-09', status: 'passed', automated: true, manual: false, summary: 'Replay with the same idempotency key did not duplicate StrategicFront.', ids: { actionExecutionId: first.id, replayExecutionId: replay.id, idempotencyKey: redactKey(key) } };
  });

  await record('DR-10', async () => {
    const name = `${runId} double click`;
    const { action } = await createPlan(lead, name);
    const approved = await approve(lead, action);
    const key = `${runId}:dr10`;
    const [first, second] = await Promise.allSettled([executeRaw(lead, approved, key), executeRaw(lead, approved, key)]);
    const responses = [first, second].map((item) => item.status === 'fulfilled' ? item.value.status : 0);
    assert(responses.some((status) => status >= 200 && status < 300), `no successful execution responses: ${responses.join(',')}`);
    assert(await frontCount(name) === 1, 'double click created a duplicate StrategicFront');
    return { caseId: 'DR-10', status: 'passed', automated: true, manual: false, summary: 'Concurrent execute requests with one idempotency key produced one StrategicFront.', ids: { responseStatuses: responses, idempotencyKey: redactKey(key) } };
  });

  evidence.cases.push(
    { caseId: 'DR-11', status: 'not_executed', automated: false, manual: false, summary: 'Requires backend restart with COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false and UI/read verification.' },
    { caseId: 'DR-12', status: 'not_executed', automated: false, manual: false, summary: 'Requires backend restart with COPILOT_WRITE_ENABLED=false and read/write verification.' },
    { caseId: 'DR-13', status: 'not_executed', automated: false, manual: false, summary: 'Requires backend restart with COPILOT_ENABLED=false and UI/backend verification.' },
    { caseId: 'DR-14', status: 'not_executed', automated: false, manual: false, summary: 'No approved failure-injection mechanism was found for PortfolioService in this run.' },
    { caseId: 'DR-15', status: 'not_executed', automated: false, manual: false, summary: 'Requires observed UI/network projection refresh failure; no product bypass was added.' },
    { caseId: 'DR-16', status: 'not_executed', automated: false, manual: false, summary: 'Support exercise requires operator walkthrough against runbook using captured IDs.' },
  );

  const outDir = path.resolve(process.cwd(), '.pilot-dry-run');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${runId}.json`);
  await writeFile(outPath, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`[dry-run:functional] evidence=${outPath}`);
  const failed = evidence.cases.filter((item) => item.status === 'failed');
  if (failed.length > 0) {
    throw new Error(`Functional dry run has failed cases: ${failed.map((item) => item.caseId).join(', ')}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
