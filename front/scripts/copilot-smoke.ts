const baseUrl = process.env.COPILOT_SMOKE_BASE_URL ?? 'http://127.0.0.1:3001/api/v1';
const email = process.env.COPILOT_SMOKE_EMAIL;
const password = process.env.COPILOT_SMOKE_PASSWORD;
const organization = process.env.COPILOT_SMOKE_ORGANIZATION;
const allowProduction = process.env.COPILOT_SMOKE_ALLOW_PRODUCTION === 'true';

if (!allowProduction && /starteria\.com|prod/i.test(baseUrl)) {
  throw new Error('Refusing to run Copilot smoke against a production-like URL without COPILOT_SMOKE_ALLOW_PRODUCTION=true.');
}
if (!email || !password) {
  throw new Error('COPILOT_SMOKE_EMAIL and COPILOT_SMOKE_PASSWORD are required.');
}

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

function rootUrl(path: string): string {
  const api = new URL(baseUrl);
  const prefix = api.pathname.replace(/\/api\/v1\/?$/, '');
  api.pathname = `${prefix}${path}`;
  api.search = '';
  return api.toString();
}

async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json() as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    const error = body.success === false ? body.error : { code: 'HTTP_ERROR', message: `HTTP ${res.status}` };
    throw new Error(`${path} failed: ${error.code} ${error.message}`);
  }
  return body.data;
}

async function checkRoot(path: string) {
  const res = await fetch(rootUrl(path));
  if (!res.ok) {
    throw new Error(`${path} failed: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  await checkRoot('/api/health');
  const readiness = await checkRoot('/api/readiness/copilot') as { data?: { status?: string; checks?: Record<string, string> } };
  if (readiness.data?.status !== 'ready') {
    throw new Error(`Copilot readiness is not ready: ${JSON.stringify(readiness.data ?? readiness)}`);
  }
  if (readiness.data.checks?.featureFlags !== 'ok') {
    throw new Error(`Copilot feature flags are not enabled for smoke: ${JSON.stringify(readiness.data.checks)}`);
  }
  if (organization) {
    console.log(`Copilot smoke organization=${organization}`);
  }

  const auth = await api<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const uniqueName = `Smoke Copilot ${Date.now()}`;
  const conversation = await api<{ id: string }>('/copilot/conversations', { method: 'POST', body: '{}' }, auth.accessToken);
  const message = await api<{ actionPlan: { proposedActions: Array<{ id: string; version: number }> } }> (
    `/copilot/conversations/${conversation.id}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: `Crea un frente llamado ${uniqueName}. Su objetivo es validar despliegue. El KPI principal sera tiempo de ciclo, con baseline 10, meta 5, horizonte de 1 mes, prioridad alta y sponsor Equipo interno.`,
      }),
    },
    auth.accessToken,
  );
  const action = message.actionPlan.proposedActions[0];
  if (!action) throw new Error('Smoke did not receive a ProposedAction.');

  await api(`/copilot/conversations/${conversation.id}/action-plan`, {}, auth.accessToken);

  const approved = await api<{ id: string; version: number }> (
    `/copilot/actions/${action.id}/approve`,
    { method: 'POST', body: JSON.stringify({ expectedVersion: action.version }) },
    auth.accessToken,
  );
  const idempotencyKey = `copilot-smoke:${conversation.id}`;
  const execution = await api<{ id: string; status: string; createdObjectReferences: unknown[] }> (
    `/copilot/actions/${action.id}/execute`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion: approved.version }),
    },
    auth.accessToken,
  );
  if (execution.status !== 'completed' && execution.status !== 'idempotent_replay') {
    throw new Error(`Smoke execution ended with ${execution.status}.`);
  }
  if (execution.createdObjectReferences.length !== 1) {
    throw new Error('Smoke expected exactly one StrategicFront reference.');
  }

  const replay = await api<{ id: string; status: string; createdObjectReferences: unknown[] }> (
    `/copilot/actions/${action.id}/execute`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion: approved.version }),
    },
    auth.accessToken,
  );
  if (replay.status !== 'idempotent_replay' && replay.status !== 'completed') {
    throw new Error(`Smoke replay ended with ${replay.status}.`);
  }

  await api(`/copilot/executions/${execution.id}`, {}, auth.accessToken);
  await api(`/copilot/conversations/${conversation.id}/action-plan`, {}, auth.accessToken);
  const fronts = await api<Array<{ name: string }>>('/portfolio/strategic-fronts', {}, auth.accessToken);
  const matching = fronts.filter((front) => front.name === uniqueName);
  if (matching.length !== 1) {
    throw new Error(`Smoke expected exactly one StrategicFront named ${uniqueName}, got ${matching.length}.`);
  }
  console.log(`Copilot smoke OK: conversation=${conversation.id} execution=${execution.id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
