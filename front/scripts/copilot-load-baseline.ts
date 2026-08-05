const baseUrl = process.env.COPILOT_LOAD_BASE_URL ?? 'http://127.0.0.1:3001/api/v1';
const token = process.env.COPILOT_LOAD_TOKEN;
const iterations = Number.parseInt(process.env.COPILOT_LOAD_ITERATIONS ?? '5', 10);

if (!token) {
  throw new Error('COPILOT_LOAD_TOKEN is required. Use a non-production test user.');
}
if (/starteria\.com|prod/i.test(baseUrl) && process.env.COPILOT_LOAD_ALLOW_PRODUCTION !== 'true') {
  throw new Error('Refusing to run Copilot load against production-like URL without COPILOT_LOAD_ALLOW_PRODUCTION=true.');
}

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
type Sample = { name: string; durationMs: number; ok: boolean };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
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

async function sample<T>(name: string, fn: () => Promise<T>, samples: Sample[]): Promise<T> {
  const started = performance.now();
  try {
    const result = await fn();
    samples.push({ name, durationMs: performance.now() - started, ok: true });
    return result;
  } catch (err) {
    samples.push({ name, durationMs: performance.now() - started, ok: false });
    throw err;
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function runOne(index: number, samples: Sample[]) {
  const conversation = await sample('create_conversation', () =>
    api<{ id: string }>('/copilot/conversations', { method: 'POST', body: '{}' }), samples);
  const message = await sample('send_message', () =>
    api<{ actionPlan: { id: string; proposedActions: Array<{ id: string; version: number }> } }>(
      `/copilot/conversations/${conversation.id}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          content: `Crea un frente llamado Load Copilot ${index}. Su objetivo es validar carga. El KPI principal sera tiempo de ciclo, con baseline 10, meta 5, horizonte de 1 mes, prioridad alta y sponsor Equipo interno.`,
        }),
      },
    ), samples);
  await sample('get_plan', () => api(`/copilot/action-plans/${message.actionPlan.id}`), samples);
  const action = message.actionPlan.proposedActions[0];
  const approved = await sample('approve', () =>
    api<{ version: number }>(`/copilot/actions/${action.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion: action.version }),
    }), samples);
  const execution = await sample('execute', () =>
    api<{ id: string }>(`/copilot/actions/${action.id}/execute`, {
      method: 'POST',
      headers: { 'Idempotency-Key': `copilot-load:${conversation.id}` },
      body: JSON.stringify({ expectedVersion: approved.version }),
    }), samples);
  await sample('get_execution', () => api(`/copilot/executions/${execution.id}`), samples);
}

async function main() {
  const samples: Sample[] = [];
  for (let i = 0; i < iterations; i += 1) {
    await runOne(i + 1, samples);
  }

  const grouped = new Map<string, Sample[]>();
  for (const item of samples) {
    grouped.set(item.name, [...(grouped.get(item.name) ?? []), item]);
  }
  for (const [name, group] of grouped) {
    const ok = group.filter((item) => item.ok);
    const durations = ok.map((item) => item.durationMs);
    console.log(`${name}: count=${group.length} errors=${group.length - ok.length} p50=${percentile(durations, 50).toFixed(1)}ms p95=${percentile(durations, 95).toFixed(1)}ms`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
