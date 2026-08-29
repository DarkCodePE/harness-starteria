/**
 * E2E: máquina de estados del reto (ADR-030 / MVP-P1-01) — API-level, real stack.
 *
 * Lo que verifica contra Postgres real, no contra un mock:
 *   1. Activar → pausar → reanudar sobrevive a una LECTURA NUEVA (persiste, no es estado local).
 *   2. Reanudar devuelve al estado del que se pausó, no a un default inventado.
 *   3. Una transición ilegal se rechaza con 409 EN EL SERVIDOR. Este es el agujero que
 *      motivó el ADR: `updateChallenge` hacía `data: input as any`, así que un `curl`
 *      podía llevar un reto de `cerrado` a `draft`.
 *   4. Un reto pausado o cerrado no admite iniciativas nuevas.
 *
 * Usa un usuario PROPIO promovido vía el endpoint de admin (PBA-08) en vez del portfolio
 * lead del seed: `portfolio-copilot-create-front.spec.ts` degrada ese usuario compartido a
 * `mentor` en un beforeEach y nunca lo restaura, así que cualquier spec que dependa de él
 * hereda un 403 según el orden de ejecución.
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'portfolio-admin.e2e@starteria.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD || 'demo123';

function extractToken(body: any): string {
  return (
    body?.data?.tokens?.accessToken ??
    body?.data?.accessToken ??
    body?.tokens?.accessToken ??
    body?.accessToken ??
    ''
  );
}

async function login(api: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(res.status(), `login ${email}: ${await res.text()}`).toBe(200);
  const token = extractToken(await res.json());
  expect(token, `sin access token para ${email}`).toBeTruthy();
  return token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('ADR-030 · estados del reto contra el stack real', () => {
  let api: APIRequestContext;
  let leadToken: string;
  let frontId = '';

  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-states-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';

  test.beforeAll(async () => {
    api = await pwRequest.newContext({ baseURL: BASE });
    const adminToken = await login(api, ADMIN_EMAIL, ADMIN_PASSWORD);

    const reg = await api.post('/api/v1/auth/register', {
      data: { email, password, name: `E2E states ${stamp}`, role: 'participante' },
      failOnStatusCode: false,
    });
    expect([200, 201, 409], `register: ${reg.status()}`).toContain(reg.status());

    const list = await api.get('/api/v1/users', { headers: auth(adminToken), failOnStatusCode: false });
    expect(list.status(), `listar usuarios: ${await list.text()}`).toBe(200);
    const userId = ((await list.json())?.data ?? []).find((u: any) => u.email === email)?.id ?? '';
    expect(userId, `no se encontró ${email} en el padrón de admin`).toBeTruthy();

    const patch = await api.patch(`/api/v1/users/${userId}/role`, {
      headers: auth(adminToken),
      data: { roles: ['participante', 'portfolio_lead'] },
      failOnStatusCode: false,
    });
    expect(patch.status(), `conceder portfolio_lead: ${await patch.text()}`).toBeLessThan(300);

    leadToken = await login(api, email, password);

    const front = await api.post('/api/v1/portfolio/strategic-fronts', {
      headers: auth(leadToken),
      data: { name: `Frente estados ${stamp}`, description: 'ADR-030 e2e' },
      failOnStatusCode: false,
    });
    expect(front.status(), `crear frente: ${await front.text()}`).toBeLessThan(300);
    frontId = (await front.json())?.data?.id;
    expect(frontId).toBeTruthy();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  /** Crea un reto y lo deja en el estado pedido recorriendo transiciones legales. */
  async function makeChallenge(title: string, path: string[] = []): Promise<string> {
    const res = await api.post(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(leadToken),
      data: { title },
      failOnStatusCode: false,
    });
    expect(res.status(), `crear reto: ${await res.text()}`).toBeLessThan(300);
    const id = (await res.json())?.data?.id;
    expect(id).toBeTruthy();

    for (const status of path) {
      const step = await api.patch(`/api/v1/portfolio/challenges/${id}`, {
        headers: auth(leadToken),
        data: { status },
        failOnStatusCode: false,
      });
      expect(step.status(), `→ ${status}: ${await step.text()}`).toBeLessThan(300);
    }
    return id;
  }

  /**
   * Relee el reto en una petición NUEVA: si el estado no persistió, aquí se cae.
   * No hay `GET /challenges/:id` en el router, así que se relee por el listado del frente.
   */
  async function readStatus(id: string): Promise<{ status: string; pausedFromStatus: string | null }> {
    const res = await api.get(`/api/v1/portfolio/strategic-fronts/${frontId}/challenges`, {
      headers: auth(leadToken),
      failOnStatusCode: false,
    });
    expect(res.status(), `listar retos: ${await res.text()}`).toBe(200);
    const row = ((await res.json())?.data ?? []).find((c: any) => c.id === id);
    expect(row, `el reto ${id} no aparece en el listado`).toBeTruthy();
    return { status: row.status, pausedFromStatus: row.pausedFromStatus ?? null };
  }

  test('activar → pausar → reanudar sobrevive a una lectura nueva', async () => {
    const id = await makeChallenge(`Ciclo ${stamp}`, ['listo_para_activar', 'activo_interno', 'recibiendo_iniciativas']);
    expect((await readStatus(id)).status).toBe('recibiendo_iniciativas');

    const pause = await api.patch(`/api/v1/portfolio/challenges/${id}`, {
      headers: auth(leadToken),
      data: { status: 'pausado' },
      failOnStatusCode: false,
    });
    expect(pause.status(), `pausar: ${await pause.text()}`).toBeLessThan(300);

    // La prueba de que persiste: petición nueva, no el objeto que devolvió el PATCH.
    const paused = await readStatus(id);
    expect(paused.status).toBe('pausado');
    expect(paused.pausedFromStatus, 'la pausa no recordó de dónde vino').toBe('recibiendo_iniciativas');

    const resume = await api.patch(`/api/v1/portfolio/challenges/${id}`, {
      headers: auth(leadToken),
      data: { status: 'recibiendo_iniciativas' },
      failOnStatusCode: false,
    });
    expect(resume.status(), `reanudar: ${await resume.text()}`).toBeLessThan(300);

    const resumed = await readStatus(id);
    expect(resumed.status).toBe('recibiendo_iniciativas');
    expect(resumed.pausedFromStatus, 'la memoria de la pausa debía limpiarse').toBeNull();
  });

  test('reanudar a un estado distinto del que se pausó se rechaza con 409', async () => {
    const id = await makeChallenge(`Reanudar mal ${stamp}`, ['listo_para_activar', 'activo_interno', 'pausado']);

    const res = await api.patch(`/api/v1/portfolio/challenges/${id}`, {
      headers: auth(leadToken),
      data: { status: 'publicado' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(409);
    expect((await readStatus(id)).status, 'el estado no debía moverse').toBe('pausado');
  });

  test('cerrado es terminal: el servidor rechaza cerrado → draft con 409', async () => {
    const id = await makeChallenge(`Terminal ${stamp}`, ['cerrado']);

    const res = await api.patch(`/api/v1/portfolio/challenges/${id}`, {
      headers: auth(leadToken),
      data: { status: 'draft' },
      failOnStatusCode: false,
    });
    // Antes de ADR-030 esto devolvía 200 y resucitaba el reto.
    expect(res.status(), `cerrado → draft: ${await res.text()}`).toBe(409);
    expect((await readStatus(id)).status).toBe('cerrado');
  });

  test('un reto pausado no admite iniciativas nuevas', async () => {
    const id = await makeChallenge(`Sin altas ${stamp}`, ['listo_para_activar', 'activo_interno', 'pausado']);

    const res = await api.post('/api/v1/projects', {
      headers: auth(leadToken),
      data: {
        name: `Iniciativa bloqueada ${stamp}`,
        description: 'No debería existir',
        challengeLink: { challengeId: id },
      },
      failOnStatusCode: false,
    });
    expect(res.status(), `crear iniciativa sobre reto pausado: ${await res.text()}`).toBe(409);
  });
});
