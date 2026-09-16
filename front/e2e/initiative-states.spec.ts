/**
 * E2E: estados de la iniciativa (ADR-030 / MVP-P1-02) — API-level, real stack.
 *
 * Verifica contra Postgres real la regla que pide la Fase 1 del plan: **pausar ⇒ solo
 * lectura**, comprobado EN EL SERVIDOR. Y las dos correcciones de la reconciliación:
 *
 *   1. `paused` congela las escrituras de step; `bloqueada` NO (es un impedimento
 *      reversible — trabajar en ella es como se desbloquea). Antes ambos conceptos se
 *      mapeaban al mismo valor, así que pausar no congelaba nada.
 *   2. `cerrada` y `closed` son el mismo estado: el alias legacy congela igual, no abre
 *      una puerta trasera.
 *
 * Usa un usuario propio promovido vía el endpoint de admin, no el portfolio lead del seed:
 * `portfolio-copilot-create-front.spec.ts` degrada ese usuario compartido a `mentor` en un
 * `beforeEach` y nunca lo restaura.
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'portfolio-admin.e2e@starteria.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD || 'demo123';

function extractToken(body: any): string {
  return (
    body?.data?.tokens?.accessToken ?? body?.data?.accessToken ??
    body?.tokens?.accessToken ?? body?.accessToken ?? ''
  );
}

async function login(api: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(res.status(), `login ${email}: ${await res.text()}`).toBe(200);
  const token = extractToken(await res.json());
  expect(token).toBeTruthy();
  return token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('ADR-030 · estados de la iniciativa contra el stack real', () => {
  let api: APIRequestContext;
  let token = '';
  let frontId = '';
  let challengeId = '';

  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-initstates-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';

  test.beforeAll(async () => {
    api = await pwRequest.newContext({ baseURL: BASE });
    const adminToken = await login(api, ADMIN_EMAIL, ADMIN_PASSWORD);

    const reg = await api.post('/api/v1/auth/register', {
      data: { email, password, name: `E2E init states ${stamp}`, role: 'participante' },
      failOnStatusCode: false,
    });
    expect([200, 201, 409]).toContain(reg.status());

    const list = await api.get('/api/v1/users', { headers: auth(adminToken), failOnStatusCode: false });
    expect(list.status()).toBe(200);
    const userId = ((await list.json())?.data ?? []).find((u: any) => u.email === email)?.id ?? '';
    expect(userId).toBeTruthy();

    const patch = await api.patch(`/api/v1/users/${userId}/role`, {
      headers: auth(adminToken),
      data: { roles: ['participante', 'portfolio_lead'] },
      failOnStatusCode: false,
    });
    expect(patch.status(), `conceder rol: ${await patch.text()}`).toBeLessThan(300);

    token = await login(api, email, password);

    const front = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(token),
      data: { name: `Frente init-states ${stamp}`, description: 'ADR-030 e2e' },
      failOnStatusCode: false,
    });
    expect(front.status(), `crear frente: ${await front.text()}`).toBeLessThan(300);
    frontId = (await front.json())?.data?.id;

    const ch = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(token),
      data: { title: `Reto init-states ${stamp}` },
      failOnStatusCode: false,
    });
    expect(ch.status(), `crear reto: ${await ch.text()}`).toBeLessThan(300);
    challengeId = (await ch.json())?.data?.id;
    expect(challengeId).toBeTruthy();
  });

  test.afterAll(async () => { await api.dispose(); });

  /** Crea una iniciativa vinculada al reto y le fija el estado de portafolio pedido. */
  async function makeInitiative(name: string, status?: string): Promise<string> {
    const res = await api.post('/api/v1/projects', {
      headers: auth(token),
      data: { name, description: 'ADR-030 e2e', challengeLink: { challengeId } },
      failOnStatusCode: false,
    });
    expect(res.status(), `crear iniciativa: ${await res.text()}`).toBeLessThan(300);
    const projectId = (await res.json())?.data?.id;
    expect(projectId).toBeTruthy();

    if (status) {
      const meta = await api.put(`/api/v1/portfolio/initiatives/${projectId}/meta`, {
        headers: auth(token),
        data: { challengeId, status },
        failOnStatusCode: false,
      });
      expect(meta.status(), `fijar status=${status}: ${await meta.text()}`).toBeLessThan(300);
    }
    return projectId;
  }

  const writeStep0 = (projectId: string) =>
    api.patch(`/api/v1/projects/${projectId}/step0`, {
      headers: auth(token),
      data: { data: { initiativeTitle: `editado ${stamp}` } },
      failOnStatusCode: false,
    });

  test('una iniciativa pausada rechaza la escritura de Step 0 con 409', async () => {
    const projectId = await makeInitiative(`Pausada ${stamp}`, 'paused');

    const res = await writeStep0(projectId);

    expect(res.status(), `escribir sobre pausada: ${await res.text()}`).toBe(409);
  });

  test('y sigue rechazándola tras una lectura nueva (el estado persistió)', async () => {
    const projectId = await makeInitiative(`Pausada persiste ${stamp}`, 'paused');

    // Petición nueva: si el estado no hubiera persistido, esto pasaría.
    const again = await writeStep0(projectId);
    expect(again.status()).toBe(409);
  });

  test('`bloqueada` NO congela: trabajar en ella es como se desbloquea', async () => {
    const projectId = await makeInitiative(`Bloqueada ${stamp}`, 'bloqueada');

    const res = await writeStep0(projectId);

    expect(res.status(), `escribir sobre bloqueada: ${await res.text()}`).toBeLessThan(300);
  });

  test('una iniciativa en curso escribe con normalidad', async () => {
    const projectId = await makeInitiative(`En curso ${stamp}`);

    const res = await writeStep0(projectId);

    expect(res.status(), `escribir sobre en curso: ${await res.text()}`).toBeLessThan(300);
  });

  test('cerrada es terminal: el servidor rechaza reabrirla con 409', async () => {
    const projectId = await makeInitiative(`Cerrada ${stamp}`, 'closed');

    const res = await api.put(`/api/v1/portfolio/initiatives/${projectId}/meta`, {
      headers: auth(token),
      data: { challengeId, status: 'en_step_1' },
      failOnStatusCode: false,
    });

    expect(res.status(), `reabrir cerrada: ${await res.text()}`).toBe(409);
  });
});
