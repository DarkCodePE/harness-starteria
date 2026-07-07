/**
 * E2E API: revisión inicial guiada — IR-B2 (ADR-025, PRD §21) — stack real.
 *
 * Valida contra docker compose (postgres + backend) el flujo del service:
 *   crear revisión (mock generator determinista) → snapshot con los 6 bloques y tipo
 *   de reto CANÓNICO (inglés) → add-context versiona (v2) → strategic-answers persiste →
 *   snapshot recuperable. Y que la revisión es PRIVADA del creador (otro usuario → 403).
 *
 * La creación de iniciativa NO ocurre aquí (RB-IR-001/002; eso es IR-B4).
 *
 * Requiere: docker compose up + backend reconstruido con el módulo initial-review.
 *   docker compose up -d --build backend && npm run test:e2e -- initial-review-api
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';

function extractToken(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.tokens?.accessToken ?? body?.accessToken ?? '';
}

async function registerAndLogin(api: APIRequestContext, tag: string): Promise<string> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-ir-${tag}-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E IR ${tag} ${stamp}`, role: 'participante' },
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

test.describe('initial-review API (IR-B2, real stack)', () => {
  let api: APIRequestContext;
  test.beforeAll(async () => { api = await pwRequest.newContext({ baseURL: BASE }); });
  test.afterAll(async () => { await api.dispose(); });

  test('crea → snapshot canónico → add-context versiona → answers → privacidad', async () => {
    const owner = await registerAndLogin(api, 'owner');

    // 1. Crear la revisión.
    const createRes = await api.post('/api/v1/initial-reviews', {
      headers: auth(owner),
      data: { originalInput: 'Quiero mejorar el proceso de aprobación de compras menores para reducir demoras y perdida de seguimiento.' },
      failOnStatusCode: false,
    });
    expect(createRes.status(), `create: ${await createRes.text()}`).toBe(201);
    const review = (await createRes.json()).data;
    expect(review.status).toBe('generated');
    const reviewId = review.id as string;

    // Snapshot con los 6 bloques + tipo de reto CANÓNICO (inglés).
    const snap = review.snapshot;
    expect(snap).toBeTruthy();
    expect(snap.version).toBe(1);
    expect(['correction', 'growth', 'exploration']).toContain(snap.suggestedChallengeType);
    expect(snap.understandingSummary).toBeTruthy();
    expect(snap.challengeTypeReason).toBeTruthy();
    expect(Array.isArray(snap.strategicQuestions)).toBe(true);
    expect(snap.strategicQuestions.length).toBeLessThanOrEqual(3); // PRD §11: máx 3 preguntas
    expect(snap.improvedProposal.suggestedName).toBeTruthy();
    expect(snap.routePreview.length).toBe(5); // Step 0–4
    // Guardrail §25: no inventa evidencia.
    expect(snap.critique.missingEvidence ?? []).toEqual([]);

    // 2. GET recupera la revisión.
    const getRes = await api.get(`/api/v1/initial-reviews/${reviewId}`, { headers: auth(owner) });
    expect(getRes.ok()).toBeTruthy();
    expect((await getRes.json()).data.snapshot.version).toBe(1);

    // 3. add-context genera una NUEVA versión.
    const ctxRes = await api.post(`/api/v1/initial-reviews/${reviewId}/add-context`, {
      headers: auth(owner),
      data: { context: 'El proceso hoy se hace por correo entre 3 áreas.' },
      failOnStatusCode: false,
    });
    expect(ctxRes.ok(), `add-context: ${await ctxRes.text()}`).toBeTruthy();
    const afterCtx = (await ctxRes.json()).data;
    expect(afterCtx.status).toBe('updated');
    expect(afterCtx.snapshot.version).toBe(2);

    // 4. strategic-answers persiste en el snapshot vigente.
    const qId = afterCtx.snapshot.strategicQuestions[0].id;
    const ansRes = await api.post(`/api/v1/initial-reviews/${reviewId}/strategic-answers`, {
      headers: auth(owner),
      data: { answers: [{ id: qId, answer: 'Un proceso específico' }] },
      failOnStatusCode: false,
    });
    expect(ansRes.ok(), `answers: ${await ansRes.text()}`).toBeTruthy();

    const snapRes = await api.get(`/api/v1/initial-reviews/${reviewId}/snapshot`, { headers: auth(owner) });
    expect(snapRes.ok()).toBeTruthy();
    const finalSnap = (await snapRes.json()).data;
    const answered = (finalSnap.strategicQuestions as any[]).find((q) => q.id === qId);
    expect(answered.status).toBe('answered');
    expect(answered.answer).toBe('Un proceso específico');

    // 5. Privacidad (PRD §24): otro participante NO puede leer la revisión.
    const stranger = await registerAndLogin(api, 'stranger');
    const forbidden = await api.get(`/api/v1/initial-reviews/${reviewId}`, { headers: auth(stranger), failOnStatusCode: false });
    expect(forbidden.status(), 'un tercero recibe 403').toBe(403);
  });

  test('confirm-route crea UN Project navegable (reusa #7) + prefill Step 0; idempotente', async () => {
    const owner = await registerAndLogin(api, 'confirm');

    // Crear la revisión.
    const review = (await (await api.post('/api/v1/initial-reviews', {
      headers: auth(owner),
      data: { originalInput: 'Quiero validar si una oportunidad comercial nueva vale la pena antes de invertir.' },
      failOnStatusCode: false,
    })).json()).data;

    // Confirmar la ruta → crea la iniciativa.
    const confirmRes = await api.post(`/api/v1/initial-reviews/${review.id}/confirm-route`, { headers: auth(owner), data: {}, failOnStatusCode: false });
    expect(confirmRes.status(), `confirm-route: ${await confirmRes.text()}`).toBe(201);
    const confirm = (await confirmRes.json()).data;
    expect(confirm.initiativeId).toBeTruthy();
    expect(confirm.overviewUrl).toBe(`/initiatives/${confirm.initiativeId}/overview`);
    const projectId = confirm.initiativeId as string;

    // El Project es real y navegable (Steps 1–4 materializados por createProject / #7).
    const projRes = await api.get(`/api/v1/projects/${projectId}`, { headers: auth(owner) });
    expect(projRes.ok(), `get project: ${await projRes.text()}`).toBeTruthy();
    const project = (await projRes.json()).data;
    expect(project.currentStep).toBe(1);
    expect(project.step0Status).toBe('NOT_STARTED'); // Step 0 NO aprobado (RB-IR-005)
    const s1 = (project.steps as any[]).find((s) => s.number === 1);
    expect(s1.status).toBe('NOT_STARTED');
    // Prefill de Step 0 desde el snapshot (PRD §13).
    expect(project.origin).toBe('from_initial_review');
    expect(project.step0Data?.source).toBe('initial_review');
    expect(project.step0Data?.challengeType).toBeTruthy();

    // Idempotencia (RB-IR-018): confirmar de nuevo → MISMO projectId.
    const again = await api.post(`/api/v1/initial-reviews/${review.id}/confirm-route`, { headers: auth(owner), data: {}, failOnStatusCode: false });
    expect(again.ok()).toBeTruthy();
    expect((await again.json()).data.initiativeId).toBe(projectId);

    // La revisión quedó convertida.
    const afterReview = (await (await api.get(`/api/v1/initial-reviews/${review.id}`, { headers: auth(owner) })).json()).data;
    expect(afterReview.status).toBe('converted_to_initiative');
  });

  test('input demasiado corto es rechazado (validación §Pantalla 1)', async () => {
    const owner = await registerAndLogin(api, 'short');
    const res = await api.post('/api/v1/initial-reviews', { headers: auth(owner), data: { originalInput: 'corto' }, failOnStatusCode: false });
    expect(res.status()).toBe(400);
  });
});
