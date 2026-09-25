import { expect, request as pwRequest, test, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function tokenOf(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.accessToken ?? '';
}

async function login(api: APIRequestContext) {
  const email = process.env.E2E_USER_EMAIL ?? 'portfolio.e2e@starteria.test';
  const password = process.env.E2E_USER_PASSWORD ?? 'demo123';
  const response = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  const token = tokenOf(body);
  expect(token).toBeTruthy();
  return { token, user: body.data.user };
}

async function registerContinuationUser(api: APIRequestContext) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `sf3e-public-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const response = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `SF-3E Public ${stamp}`, role: 'participante' },
    failOnStatusCode: false,
  });
  expect(response.status(), await response.text()).toBe(201);
  const body = await response.json();
  return { email, password, userId: body.data.user.id };
}

async function loginInBrowser(page: Page) {
  const email = process.env.E2E_USER_EMAIL ?? 'portfolio.e2e@starteria.test';
  const password = process.env.E2E_USER_PASSWORD ?? 'demo123';
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /Bienvenido de vuelta/i })).toBeVisible();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /^Entrar$/i }).click();
  await expect(page).toHaveURL(/\/portfolio\/inicio|\/dashboard/, { timeout: 30_000 });
}

async function canonicalCounts() {
  const db = prisma as any;
  const [strategicFronts, challenges, projects, steps, initiativePortfolioMetas, invitations] = await Promise.all([
    db.strategicFront.count(),
    db.challenge.count(),
    db.project.count(),
    db.step.count(),
    db.initiativePortfolioMeta.count(),
    db.challengeInvitation.count(),
  ]);
  return { strategicFronts, challenges, projects, steps, initiativePortfolioMetas, invitations };
}

function authHeaders(token: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

async function reachDeterministicEntryHandoff(page: Page) {
  await page.goto('/public/start');
  await page.evaluate(() => window.sessionStorage.clear());
  await page.goto('/public/start');
  await page.getByLabel(/necesitas conseguir/i).fill('Necesito decidir qué iniciativas pueden desbloquear el crecimiento.');
  await page.getByRole('button', { name: /Analizar mi situaci[oó]n/i }).click();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (await page.getByText('Esto estoy entendiendo', { exact: true }).isVisible().catch(() => false)) return;
    const proposal = page.getByRole('button', { name: /Ver mi propuesta de abordaje/i });
    if (await proposal.isVisible().catch(() => false)) {
      await proposal.click();
      continue;
    }
    const activeQuestion = page.getByTestId('portfolio-entry-active-question');
    if (await activeQuestion.isVisible().catch(() => false)) {
      await page.getByLabel(/Tu respuesta/i).fill('Necesito una lectura comparable antes del próximo comité.');
      await page.getByRole('button', { name: /Enviar respuesta/i }).click();
      continue;
    }
    await page.waitForTimeout(250);
  }
  await expect(page.getByText('Esto estoy entendiendo', { exact: true })).toBeVisible({ timeout: 30_000 });
}

async function bootstrapForContinuation(continuationId: string) {
  const db = prisma as any;
  const sessions = await db.portfolioBootstrapSession.findMany({
    where: { sourceContinuationId: continuationId },
    include: { anchor: true, workItems: true, readings: { orderBy: { version: 'asc' } } },
  });
  return { sessions, session: sessions[0] ?? null };
}

test.describe('SF-3E Strategic Framing boundary', () => {
  test.afterAll(async () => prisma.$disconnect());

  test('public entry is gated by Bootstrap first reading and reuses one provisional state', async ({ page }) => {
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const copilotRequests: string[] = [];
    page.on('request', request => { if (/\/api\/v1\/copilot(?:\/|$)/.test(request.url())) copilotRequests.push(request.url()); });
    await reachDeterministicEntryHandoff(page);
    await expect(page.getByRole('button', { name: /Crear mi portafolio/i })).toBeVisible();

    await page.getByRole('button', { name: /Crear mi portafolio/i }).click();
    await expect(page.getByText(/Esta lectura esta lista para continuar/i)).toBeVisible();
    await page.getByRole('button', { name: /Crear cuenta y conservar lectura/i }).click();
    const user = await registerContinuationUser(api);
    await loginInBrowserWithCredentials(page, user.email, user.password);
    await expect(page.getByText(/Tu sesion quedo guardada/i)).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/public\/start/);
    await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();
    await expect(page).toHaveURL(/\/portfolio\/inicio\?portfolioEntryContinuationId=/, { timeout: 30_000 });

    const continuationId = new URL(page.url()).searchParams.get('portfolioEntryContinuationId');
    expect(continuationId).toBeTruthy();
    await expect(page.getByText(/Portfolio Bootstrap|Ya tenemos un punto de partida/i)).toBeVisible();
    const initialBootstrap = await bootstrapForContinuation(continuationId!);
    expect(initialBootstrap.sessions).toHaveLength(1);
    const bootstrapSessionId = initialBootstrap.session.id;
    expect(page.getByRole('button', { name: 'Continuar a Strategic Framing' })).toHaveCount(0);
    expect(page).not.toHaveURL(/\/portfolio\/framing\//);

    const confirmAnchor = page.getByRole('button', { name: /Confirmar punto de partida/i });
    if (await confirmAnchor.isVisible().catch(() => false)) await confirmAnchor.dblclick();
    await page.getByRole('button', { name: /Incorporar trabajo existente/i }).click();
    await page.getByLabel(/Pega nombres de iniciativas/i).fill('Programa de crecimiento\nReducir fricción comercial\nMejorar retención\nResolver bloqueos');
    await page.getByRole('button', { name: /Agregar trabajo/i }).dblclick();
    await expect(page.getByText(/4 elementos detectados/i)).toBeVisible();
    await page.getByRole('button', { name: /Analizar trabajo detectado/i }).dblclick();
    await expect(page.getByTestId('portfolio-bootstrap-proposed-structure')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /Revisar propuesta/i }).click();
    const review = page.getByTestId('portfolio-bootstrap-material-review');
    await expect(review).toBeVisible();
    await review.getByRole('button', { name: /^Confirmar$/i }).first().dblclick();
    const reject = review.locator('button[data-review-action="reject"]:not([disabled])').first();
    if (await reject.isVisible().catch(() => false)) await reject.click();
    const leavePending = review.locator('button[data-review-action="leave-pending"]:not([disabled])').first();
    if (await leavePending.isVisible().catch(() => false)) await leavePending.click();
    await page.getByRole('button', { name: /Dejar pendientes restantes/i }).click();
    await page.getByRole('button', { name: /Generar primera lectura del portafolio/i }).dblclick();
    await expect(page.getByTestId('portfolio-first-reading')).toBeVisible({ timeout: 30_000 });
    const published = await bootstrapForContinuation(continuationId!);
    expect(published.session.id).toBe(bootstrapSessionId);
    expect(published.session.readings).toHaveLength(1);
    expect(published.session.readings[0].homeState).toMatch(/HOME_D|HOME_E/);
    await expect(page.getByTestId('portfolio-reading-provenance')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuar a Strategic Framing' })).toBeVisible();

    const beforeCanonical = await canonicalCounts();
    await page.getByRole('button', { name: 'Continuar a Strategic Framing' }).click();
    await expect(page).toHaveURL(/\/portfolio\/framing\/[^/]+$/);
    const firstStateId = new URL(page.url()).pathname.split('/').pop();
    expect(firstStateId).toBeTruthy();
    const db = prisma as any;
    const firstState = await db.strategicFramingProvisionalState.findUniqueOrThrow({ where: { id: firstStateId } });
    expect(firstState.sourceMode).toBe('public_entry');
    expect(firstState.sourceRefs).toEqual(expect.arrayContaining([expect.stringContaining('bootstrap')]));
    expect(firstState.provenance).toEqual(expect.arrayContaining([expect.objectContaining({ kind: expect.any(String) })]));
    expect(firstState).not.toHaveProperty('ownerCandidate');
    expect(firstState).not.toHaveProperty('ownerId');
    expect(copilotRequests).toEqual([]);
    expect(await canonicalCounts()).toEqual(beforeCanonical);

    await page.reload();
    expect(new URL(page.url()).pathname.split('/').pop()).toBe(firstStateId);
    await page.getByLabel(/Por qu[eé] importa/i).fill('Corrección humana después de la lectura gobernada.');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText(/Versi[oó]n 2/i)).toBeVisible();
    const history = await db.strategicFramingProvisionalStateHistory.findMany({ where: { stateId: firstStateId } });
    expect(history.length).toBeGreaterThanOrEqual(1);
    await page.reload();
    await expect(page.getByLabel(/Por qu[eé] importa/i)).toHaveValue('Corrección humana después de la lectura gobernada.');

    await page.goto(`/portfolio/inicio?portfolioEntryContinuationId=${continuationId}`);
    await expect(page.getByRole('button', { name: 'Continuar a Strategic Framing' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar a Strategic Framing' }).click();
    await expect(page).toHaveURL(`/portfolio/framing/${firstStateId}`);
    const sameModeStates = await db.strategicFramingProvisionalState.findMany({ where: { userId: user.userId, sourceMode: 'public_entry' } });
    expect(sameModeStates).toHaveLength(1);
    expect(await canonicalCounts()).toEqual(beforeCanonical);
    await api.dispose();
  });

  test('enterprise direct converges on one provisional workspace without canonicalization', async ({ page }) => {
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const copilotRequests: string[] = [];
    page.on('request', request => { if (/\/api\/v1\/copilot(?:\/|$)/.test(request.url())) copilotRequests.push(request.url()); });
    const { token } = await login(api);
    const before = await canonicalCounts();
    const key = `sf3e-direct-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const source = {
      sourceMode: 'enterprise_direct',
      intendedMovement: 'Resolver el bloqueo de adopción del nuevo proceso',
      whyItMatters: null,
      movementSignalValue: null,
      decisionToEnable: null,
    };

    const first = await api.post('/api/v1/strategic-framing/states/from-source', {
      data: source,
      headers: authHeaders(token, { 'Idempotency-Key': key }),
    });
    expect(first.status(), await first.text()).toBe(200);
    const firstBody = await first.json();
    const state = firstBody.data.state;
    expect(firstBody.data).toMatchObject({ sourceMode: 'enterprise_direct', reused: false });
    expect(state).toMatchObject({ sourceMode: 'enterprise_direct', subjectLevel: 'challenge_like', parentStatus: 'unresolved', version: 1 });
    expect(state.provenance).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'user_declared' })]));
    expect(state.scopeAssessment.canonicalized).toBe(false);

    const retry = await api.post('/api/v1/strategic-framing/states/from-source', {
      data: source,
      headers: authHeaders(token, { 'Idempotency-Key': key }),
    });
    expect(retry.status()).toBe(200);
    expect((await retry.json()).data).toMatchObject({ reused: true, state: { id: state.id, version: 1 } });
    expect(await canonicalCounts()).toEqual(before);

    await loginInBrowser(page);
    await page.goto(`/portfolio/framing/${state.id}`);
    await expect(page.getByText('Provisional', { exact: true })).toBeVisible();
    await expect(page.getByText(/Entrada corporativa/i)).toBeVisible();
    await expect(page.getByText(/Crear frente|Crear reto|Copilot/i)).toHaveCount(0);
    await page.getByLabel('Por qué importa').fill('El equipo necesita resolver la fricción sin inventar un frente canónico.');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText(/Versión 2/i)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Por qué importa')).toHaveValue('El equipo necesita resolver la fricción sin inventar un frente canónico.');
    expect(copilotRequests).toEqual([]);
    expect(await canonicalCounts()).toEqual(before);

    await api.dispose();
  });

  test('stale write is rejected and explicit reload obtains the latest version', async () => {
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const { token } = await login(api);
    const key = `sf3e-stale-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const created = await api.post('/api/v1/strategic-framing/states/from-source', {
      data: { sourceMode: 'enterprise_direct', intendedMovement: 'Actualizar el contexto de stale write', whyItMatters: 'Control concurrente', movementSignalValue: null, decisionToEnable: null },
      headers: authHeaders(token, { 'Idempotency-Key': key }),
    });
    const state = (await created.json()).data.state;
    const update = { expectedVersion: 1, intendedMovement: 'Versión autorizada del servidor', whyItMatters: 'Actualización concurrente', movementSignalValue: null, decisionToEnable: null, subjectLevel: state.subjectLevel, parentStatus: 'unresolved', parentLabel: null };
    const winning = await api.patch(`/api/v1/strategic-framing/states/${state.id}`, { data: update, headers: authHeaders(token) });
    expect(winning.status()).toBe(200);
    expect((await winning.json()).data.version).toBe(2);
    const stale = await api.patch(`/api/v1/strategic-framing/states/${state.id}`, { data: { ...update, intendedMovement: 'Sobrescritura no permitida' }, headers: authHeaders(token) });
    expect(stale.status()).toBe(409);
    expect((await stale.json()).error.code).toBe('SF_PROVISIONAL_STATE_STALE');
    const latest = await api.get(`/api/v1/strategic-framing/states/${state.id}`, { headers: authHeaders(token) });
    expect((await latest.json()).data).toMatchObject({ version: 2, intendedMovement: 'Versión autorizada del servidor' });
    await api.dispose();
  });

  test('existing strategic front is read into provisional framing and remains unchanged', async () => {
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const { token, user } = await login(api);
    const front = await prisma.strategicFront.findUniqueOrThrow({ where: { id: 'front-e2e-existing' }, select: { id: true, name: true, strategicObjective: true, mainKpi: true, organizationId: true } });
    expect(front.organizationId).toBe(user.organizationId);
    const before = await canonicalCounts();
    const source = { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: front.id };
    const first = await api.post('/api/v1/strategic-framing/states/from-source', { data: source, headers: authHeaders(token) });
    expect(first.status(), await first.text()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.data.state).toMatchObject({ sourceMode: 'existing_portfolio', parentStatus: 'known' });
    expect(firstBody.data.state.sourceRefs).toContain(`strategic_front:${front.id}`);
    const retry = await api.post('/api/v1/strategic-framing/states/from-source', { data: source, headers: authHeaders(token) });
    expect((await retry.json()).data).toMatchObject({ reused: true, state: { id: firstBody.data.state.id } });
    expect(await canonicalCounts()).toEqual(before);
    const unchanged = await prisma.strategicFront.findUniqueOrThrow({ where: { id: front.id }, select: { name: true, strategicObjective: true, mainKpi: true } });
    expect(unchanged).toEqual({ name: front.name, strategicObjective: front.strategicObjective, mainKpi: front.mainKpi });
    await api.dispose();
  });

  test('cross-org existing Portfolio source is denied', async () => {
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const ownerApi = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const { token } = await login(api);
    const otherEmail = process.env.E2E_OTHER_ORG_USER_EMAIL ?? 'other-org.e2e@starteria.test';
    const otherPassword = process.env.E2E_USER_PASSWORD ?? 'demo123';
    const otherLogin = await ownerApi.post('/api/v1/auth/login', { data: { email: otherEmail, password: otherPassword }, failOnStatusCode: false });
    expect(otherLogin.status()).toBe(200);
    const otherToken = tokenOf(await otherLogin.json());
    const response = await ownerApi.post('/api/v1/strategic-framing/states/from-source', { data: { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: 'front-e2e-existing' }, headers: authHeaders(otherToken) });
    expect(response.status()).toBe(403);
    expect((await response.json()).error.code).toBe('SF3D_SOURCE_FORBIDDEN');
    expect(token).toBeTruthy();
    await api.dispose();
    await ownerApi.dispose();
  });

  test('independent initiative is rejected and is not attached', async () => {
    const db = prisma as any;
    const independent = await db.initiativePortfolioMeta.findFirst({ where: { challengeId: null }, select: { id: true, projectId: true } });
    test.skip(!independent, 'E2E seed does not contain an independent InitiativePortfolioMeta fixture');
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const { token } = await login(api);
    const response = await api.post('/api/v1/strategic-framing/states/from-source', { data: { sourceMode: 'existing_portfolio', sourceType: 'initiative', sourceId: independent.id }, headers: authHeaders(token) });
    expect(response.status()).toBe(409);
    expect((await response.json()).error.code).toBe('SF3D_INDEPENDENT_INITIATIVE_UNSUPPORTED');
    await api.dispose();
  });
});

async function loginInBrowserWithCredentials(page: Page, email: string, password: string) {
  await expect(page.getByRole('heading', { name: /Bienvenido de vuelta/i })).toBeVisible();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /^Entrar$/i }).click();
}
