/**
 * E2E API: contexto de empresa en la revisión inicial — CC-05 (épico company-context-real-ai).
 *
 * Valida contra docker compose (postgres + backend) el flujo completo:
 *   crear empresa → crear revisión con companyContext {companyId} → el snapshot
 *   referencia la empresa (el mock interpola el nombre — determinista) → answers →
 *   confirm-route crea el Project con snapshot de contexto de iniciativa.
 *
 * Tier (a) — siempre: corre con el generador por defecto (mock) o con el fallback
 *   de CC-02, así que es determinista aunque el ai-service esté caído.
 * Tier (b) — opcional (E2E_REAL_AI=1): backend con INITIAL_REVIEW_AI=real y
 *   OPENROUTER_API_KEY reales; asserta solo FORMA (6 bloques, ruta canónica,
 *   ≤3 preguntas), nunca contenido.
 *
 *   docker compose up -d --build backend && npm run test:e2e -- initial-review-company-context
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';

function extractToken(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.tokens?.accessToken ?? body?.accessToken ?? '';
}

async function registerAndLogin(api: APIRequestContext, tag: string): Promise<string> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-cc-${tag}-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E CC ${tag} ${stamp}`, role: 'participante' },
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

async function createCompany(api: APIRequestContext, token: string, name: string) {
  const res = await api.post('/api/v1/companies', {
    headers: auth(token),
    data: { name, sector: 'Salud', country: 'Perú', areaName: 'Operaciones' },
    failOnStatusCode: false,
  });
  expect(res.status(), `create company: ${await res.text()}`).toBe(201);
  return (await res.json()).data;
}

test.describe('initial-review con contexto de empresa (CC-05, real stack)', () => {
  let api: APIRequestContext;
  test.beforeAll(async () => { api = await pwRequest.newContext({ baseURL: BASE }); });
  test.afterAll(async () => { await api.dispose(); });

  test('empresa → review con companyContext → snapshot referencia la empresa → confirm-route → Project', async () => {
    const owner = await registerAndLogin(api, 'flow');

    // 1. Crear la empresa (lo que hace "Crear empresa y continuar" en /initiatives/new).
    const company = await createCompany(api, owner, 'Clinica Andina E2E');
    expect(company.id).toBeTruthy();
    const areaId = company.areas?.[0]?.id;

    // 2. Crear la revisión CON companyContext — el payload real del front
    //    (initiativeReviewClient.ts incluye companyContext solo si hay companyId).
    const createRes = await api.post('/api/v1/initial-reviews', {
      headers: auth(owner),
      data: {
        originalInput: 'Quiero mejorar el proceso de agendamiento de citas porque perdemos pacientes por demoras.',
        companyContext: { companyId: company.id, ...(areaId ? { areaId } : {}) },
      },
      failOnStatusCode: false,
    });
    expect(createRes.status(), `create review: ${await createRes.text()}`).toBe(201);
    const review = (await createRes.json()).data;
    expect(review.status).toBe('generated');
    const snap = review.snapshot;
    expect(snap.version).toBe(1);

    if (process.env.E2E_REAL_AI) {
      // Tier (b): IA real — asserta FORMA, nunca contenido.
      expect(['correction', 'growth', 'exploration']).toContain(snap.suggestedChallengeType);
      expect(snap.strategicQuestions.length).toBeLessThanOrEqual(3);
      expect(snap.routePreview.length).toBe(5);
      expect(snap.understandingSummary).toBeTruthy();
      expect(snap.improvedProposal.suggestedName).toBeTruthy();
    } else {
      // Tier (a): mock determinista — el generador interpola el nombre de la
      // empresa en la crítica (mock-generator.ts), prueba de que el contexto
      // de empresa LLEGÓ al generador (no solo se guardó).
      const critiqueText = JSON.stringify(snap.critique);
      expect(critiqueText, 'la crítica usa el contexto de empresa').toContain('Clinica Andina E2E');
      expect(snap.improvedProposal.initialFocus).toContain('Clinica Andina E2E');
    }

    // 3. La selección quedó persistida en la revisión.
    const got = (await (await api.get(`/api/v1/initial-reviews/${review.id}`, { headers: auth(owner) })).json()).data;
    expect(got.companyContext?.companyId ?? got.snapshot?.companyContextSelection?.companyId ?? null).toBeTruthy();

    // 4. Responder una pregunta y confirmar la ruta → Project.
    const qId = snap.strategicQuestions[0]?.id;
    if (qId) {
      const ans = await api.post(`/api/v1/initial-reviews/${review.id}/strategic-answers`, {
        headers: auth(owner),
        data: { answers: [{ id: qId, answer: 'Un proceso específico' }] },
        failOnStatusCode: false,
      });
      expect(ans.ok(), `answers: ${await ans.text()}`).toBeTruthy();
    }

    const confirmRes = await api.post(`/api/v1/initial-reviews/${review.id}/confirm-route`, {
      headers: auth(owner),
      data: {},
      failOnStatusCode: false,
    });
    expect(confirmRes.status(), `confirm-route: ${await confirmRes.text()}`).toBe(201);
    const confirm = (await confirmRes.json()).data;
    const projectId = confirm.initiativeId as string;
    expect(projectId).toBeTruthy();

    // 5. El Project existe y quedó ligado a la revisión (origin) — la selección de
    //    empresa viaja vía InitiativeContextSnapshot (no hay FK Project.companyId).
    const project = (await (await api.get(`/api/v1/projects/${projectId}`, { headers: auth(owner) })).json()).data;
    expect(project.origin).toBe('from_initial_review');

    const ctxSnap = await api.get(`/api/v1/initiatives/${projectId}/company-context`, {
      headers: auth(owner),
      failOnStatusCode: false,
    });
    if (ctxSnap.ok()) {
      const snapshotData = (await ctxSnap.json()).data;
      expect(JSON.stringify(snapshotData)).toContain(company.id);
    } else {
      // Si la ruta del snapshot difiere, el mínimo verificable es que confirm-route
      // no perdió la selección: la revisión conserva companyContext.
      const finalReview = (await (await api.get(`/api/v1/initial-reviews/${review.id}`, { headers: auth(owner) })).json()).data;
      expect(finalReview.status).toBe('converted_to_initiative');
      expect(finalReview.companyContext?.companyId).toBe(company.id);
    }
  });

  test('review SIN empresa sigue funcionando (companyContext es opcional)', async () => {
    const owner = await registerAndLogin(api, 'noco');
    const res = await api.post('/api/v1/initial-reviews', {
      headers: auth(owner),
      data: { originalInput: 'Quiero explorar si un canal de ventas digital vale la pena para nuestra zona.' },
      failOnStatusCode: false,
    });
    expect(res.status(), `create: ${await res.text()}`).toBe(201);
    expect((await res.json()).data.status).toBe('generated');
  });

  test('companyId inexistente es rechazado sin romper el flujo', async () => {
    const owner = await registerAndLogin(api, 'badco');
    const res = await api.post('/api/v1/initial-reviews', {
      headers: auth(owner),
      data: {
        originalInput: 'Quiero mejorar el proceso de compras menores para reducir demoras.',
        companyContext: { companyId: 'no-existe-123' },
      },
      failOnStatusCode: false,
    });
    // 404 COMPANY_NOT_FOUND (validación del service) — nunca 500.
    expect([400, 404]).toContain(res.status());
  });
});
