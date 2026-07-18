/**
 * E2E: conversación del asistente sobre la revisión inicial — ADR-026 (IRC-07).
 *
 * Valida contra el stack real (postgres + backend) el flujo conversacional a nivel API,
 * que es la fuente de verdad del chat del front:
 *   crear revisión → GET rehidrata chatEvents:[] → strategic-answers persiste evento
 *   'answer' y changedSections → add-context persiste 'context' + 'diff_announcement' con
 *   changedSections no vacío → GET rehidrata el historial en orden → confirm-route → Project.
 *
 * Tier (a) determinista (mock/fallback). No requiere IA real: asserta forma y persistencia
 * de eventos, nunca contenido del LLM.
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const GEN_TIMEOUT = process.env.E2E_REAL_AI ? 90_000 : 15_000;

function extractToken(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.tokens?.accessToken ?? body?.accessToken ?? '';
}

// El backend de e2e corre con AUTH_DISABLE_WAITLIST=true (docker-compose.override.yml), así
// que register → login obtiene token igual que el resto de specs. Sin workarounds por-spec.
async function registerAndLogin(api: APIRequestContext, tag: string): Promise<string> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-irc-${tag}-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E IRC ${tag} ${stamp}`, role: 'participante' },
    failOnStatusCode: false,
  });
  expect([200, 201, 409], `register: ${reg.status()}`).toContain(reg.status());
  const res = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(res.status(), `login: ${await res.text()}`).toBe(200);
  const token = extractToken(await res.json());
  expect(token).toBeTruthy();
  return token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('initial-review chat events (ADR-026 IRC-07, real stack)', () => {
  let api: APIRequestContext;
  test.beforeAll(async () => { api = await pwRequest.newContext({ baseURL: BASE }); });
  test.afterAll(async () => { await api.dispose(); });

  test('answer + add-context persisten chatEvents y changedSections; confirm-route crea Project', async () => {
    const owner = await registerAndLogin(api, 'flow');

    // 1. Crear la revisión.
    const createRes = await api.post('/api/v1/initial-reviews', {
      headers: auth(owner),
      data: { originalInput: 'Quiero reducir el retrabajo en el refinamiento de historias de usuario con BDD y un LLM.' },
      failOnStatusCode: false,
      timeout: GEN_TIMEOUT,
    });
    expect(createRes.status(), `create: ${await createRes.text()}`).toBe(201);
    const review = (await createRes.json()).data;
    expect(review.snapshot.version).toBe(1);

    // 2. GET recién creado → historial vacío (rehidratación IRC-01).
    const fresh = (await (await api.get(`/api/v1/initial-reviews/${review.id}`, { headers: auth(owner) })).json()).data;
    expect(Array.isArray(fresh.chatEvents)).toBeTruthy();
    expect(fresh.chatEvents.length).toBe(0);

    // 3. Responder una pregunta estratégica → evento 'answer' + changedSections.
    const qId = review.snapshot.strategicQuestions[0]?.id;
    if (qId) {
      const ansRes = await api.post(`/api/v1/initial-reviews/${review.id}/strategic-answers`, {
        headers: auth(owner),
        data: { answers: [{ id: qId, answer: 'Empezar por un solo squad piloto.' }] },
        failOnStatusCode: false,
      });
      expect(ansRes.status(), `answers: ${await ansRes.text()}`).toBe(200);
      const ans = (await ansRes.json()).data;
      expect(ans.changedSections, 'strategic-answers devuelve changedSections').toContain('questions');
    }

    // 4. Agregar contexto → nueva versión + evento 'context' + 'diff_announcement'.
    const ctxRes = await api.post(`/api/v1/initial-reviews/${review.id}/add-context`, {
      headers: auth(owner),
      data: { context: 'Validamos con el CTO: usaremos un LLM on-premise y tenemos 2 devs por 6 semanas.' },
      failOnStatusCode: false,
      timeout: GEN_TIMEOUT,
    });
    expect(ctxRes.status(), `add-context: ${await ctxRes.text()}`).toBe(200);
    const ctx = (await ctxRes.json()).data;
    expect(ctx.snapshot.version).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(ctx.changedSections), 'add-context devuelve changedSections').toBeTruthy();
    expect(ctx.changedSections.length, 'una regeneración cambia al menos una sección').toBeGreaterThan(0);

    // 5. GET rehidrata el historial en orden cronológico con los kinds esperados.
    const withHistory = (await (await api.get(`/api/v1/initial-reviews/${review.id}`, { headers: auth(owner) })).json()).data;
    const kinds = withHistory.chatEvents.map((e: any) => e.kind);
    expect(kinds, 'historial incluye contexto del usuario').toContain('context');
    expect(kinds, 'historial incluye anuncio del asistente').toContain('diff_announcement');
    if (qId) expect(kinds, 'historial incluye la respuesta').toContain('answer');
    // el anuncio transporta las secciones cambiadas
    const announce = withHistory.chatEvents.find((e: any) => e.kind === 'diff_announcement');
    expect(Array.isArray(announce.payload.changedSections)).toBeTruthy();
    // orden cronológico no decreciente
    const times = withHistory.chatEvents.map((e: any) => new Date(e.createdAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));

    // 6. Confirmar la ruta → Project (flujo ADR-025 intacto).
    const confirmRes = await api.post(`/api/v1/initial-reviews/${review.id}/confirm-route`, {
      headers: auth(owner),
      data: {},
      failOnStatusCode: false,
    });
    expect(confirmRes.status(), `confirm-route: ${await confirmRes.text()}`).toBe(201);
    const projectId = (await confirmRes.json()).data.initiativeId as string;
    expect(projectId).toBeTruthy();

    const finalReview = (await (await api.get(`/api/v1/initial-reviews/${review.id}`, { headers: auth(owner) })).json()).data;
    expect(finalReview.status).toBe('converted_to_initiative');
  });
});
