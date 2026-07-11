/**
 * Auditoria automatica PRD: revision inicial guiada + Overview post-confirmacion.
 *
 * Requiere stack real:
 *   docker compose up -d --build
 *   npm run test:e2e -- initial-review-prd-audit
 */
import { test, expect, APIRequestContext, Page } from '@playwright/test';

const VALID_IDEA =
  'Quiero reducir demoras en el proceso de aprobacion de compras menores porque hoy se pierde seguimiento por correo y las areas no saben quien debe aprobar.';
const API_BASE = process.env.E2E_API_URL ?? '';

function apiPath(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function extractData(body: any) {
  return body?.data ?? body;
}

function extractAccessToken(body: any): string {
  return body?.data?.accessToken ?? body?.data?.tokens?.accessToken ?? body?.accessToken ?? '';
}

async function registerOwner(page: Page): Promise<string> {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-prd-ir-${stamp}@starteria.test`;
  const res = await page.request.post(apiPath('/api/v1/auth/register'), {
    data: {
      email,
      password: 'E2eTest!1234',
      name: `E2E PRD IR ${stamp}`,
      role: 'participante',
    },
    failOnStatusCode: false,
  });
  expect(res.status(), `register: ${await res.text()}`).toBe(201);
  const token = extractAccessToken(await res.json());
  expect(token).toBeTruthy();
  return token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function listProjects(api: APIRequestContext, token: string): Promise<any[]> {
  const res = await api.get(apiPath('/api/v1/projects'), { headers: auth(token), failOnStatusCode: false });
  expect(res.ok(), `projects list: ${await res.text()}`).toBeTruthy();
  const data = extractData(await res.json());
  return Array.isArray(data) ? data : data?.projects ?? [];
}

async function getProject(api: APIRequestContext, token: string, projectId: string): Promise<any> {
  const res = await api.get(apiPath(`/api/v1/projects/${projectId}`), { headers: auth(token), failOnStatusCode: false });
  expect(res.ok(), `project ${projectId}: ${await res.text()}`).toBeTruthy();
  return extractData(await res.json());
}

test.describe('PRD initial-review guided flow audit', () => {
  test('P0 completo: dashboard -> revision -> confirm-route -> overview -> Step 0 precargado', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer = [];
    });
    const token = await registerOwner(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    const createCta = page.getByRole('button', { name: /Crear iniciativa|Crear proyecto/i }).first();
    await expect(createCta).toBeVisible();
    await createCta.click();
    await expect(page).toHaveURL(/\/initiatives\/new$/);
    expect(new URL(page.url()).pathname).not.toBe('/projects/new');

    await expect(page.getByRole('heading', { name: /Qué iniciativa quieres ordenar/i })).toBeVisible();
    const input = page.getByLabel(/Describe tu iniciativa/i);
    await expect(input).toBeVisible();
    await expect(page.getByText(/información sensible|confidencial/i)).toBeVisible();
    const submit = page.getByRole('button', { name: /Revisar mi propuesta/i });
    await expect(submit).toBeDisabled();

    await input.fill('Quiero mejorar');
    await expect(submit).toBeDisabled();
    expect(await listProjects(page.request, token)).toHaveLength(0);

    await input.fill(VALID_IDEA);
    await page.getByLabel(/Contexto adicional opcional/i).fill('El equipo disponible es operaciones y compras; legal solo revisa excepciones.');

    const createReviewResponse = page.waitForResponse((response) => {
      const request = response.request();
      return request.method() === 'POST'
        && response.url().includes('/api/v1/initial-reviews')
        && !response.url().includes('/confirm-route')
        && !response.url().includes('/strategic-answers')
        && !response.url().includes('/add-context');
    });
    await submit.click();
    const reviewPayload = extractData(await (await createReviewResponse).json());
    const reviewId = reviewPayload.id as string;
    expect(reviewId).toBeTruthy();
    expect(reviewPayload.snapshot?.id).toBeTruthy();

    await expect(page).toHaveURL(new RegExp(`/initiatives/review/${reviewId}$`));
    expect(await listProjects(page.request, token)).toHaveLength(0);

    await expect(page.getByRole('heading', { name: /Revisemos tu iniciativa antes de empezar/i })).toBeVisible();
    for (const testId of ['card-understanding', 'card-challenge-type', 'card-critique', 'card-questions', 'card-proposal', 'card-route']) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }
    await expect(page.getByTestId('card-route')).toContainText('Step 0');
    await expect(page.getByTestId('card-route')).toContainText('Step 4');
    await expect(page.getByTestId('card-route')).toContainText(/Qué pasará/i);
    await expect(page.getByTestId('card-route')).toContainText(/Output esperado/i);

    const visibleQuestions = await page.getByTestId('card-questions').locator('li').count();
    expect(visibleQuestions).toBeGreaterThan(0);
    expect(visibleQuestions).toBeLessThanOrEqual(3);

    const firstOption = page.getByTestId('card-questions').getByRole('button').first();
    await firstOption.click();
    await expect(page.getByTestId('card-questions')).toContainText(/Respondida|No lo sé aún|Marcada/i);

    await page.getByLabel(/Agregar contexto antes de confirmar/i).fill('La aprobacion debe resolverse en menos de cinco dias.');
    const contextResponse = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes(`/api/v1/initial-reviews/${reviewId}/add-context`),
    );
    await page.getByRole('button', { name: /Actualizar revisión/i }).click();
    const contextPayload = extractData(await (await contextResponse).json());
    expect(contextPayload.snapshot.version).toBeGreaterThan(1);

    expect(await listProjects(page.request, token)).toHaveLength(0);

    const confirmResponse = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes(`/api/v1/initial-reviews/${reviewId}/confirm-route`),
    );
    await page.getByRole('button', { name: /Estoy de acuerdo con esta ruta/i }).click();
    const confirmPayload = extractData(await (await confirmResponse).json());
    const projectId = confirmPayload.initiativeId as string;
    expect(projectId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/initiatives/${projectId}/overview$`));
    expect(new URL(page.url()).pathname).not.toBe(`/projects/${projectId}/step/0`);

    const project = await getProject(page.request, token, projectId);
    expect(project.origin).toBe('from_initial_review');
    expect(project.initialReviewSnapshotId).toBeTruthy();
    expect(project.step0Data?.source).toBe('initial_review');
    expect(project.step0Data?.suggestedName).toBeTruthy();
    expect(project.step0Data?.contextInitial).toBeTruthy();
    expect(project.step0Data?.challengeType).toBeTruthy();
    expect(project.step0Data?.initialFocus).toBeTruthy();
    expect(project.step0Data?.expectedImpact).toBeTruthy();
    expect(project.step0Data?.mainRisk).toBeTruthy();
    expect(Array.isArray(project.step0Data?.pendingQuestions)).toBe(true);
    expect(project.step0Status).toBe('NOT_STARTED');
    expect((project.steps ?? []).every((step: any) => step.status !== 'APPROVED')).toBe(true);

    const idempotent = await page.request.post(apiPath(`/api/v1/initial-reviews/${reviewId}/confirm-route`), {
      headers: auth(token),
      data: {},
      failOnStatusCode: false,
    });
    expect(idempotent.ok(), `confirm-route idempotent: ${await idempotent.text()}`).toBeTruthy();
    expect(extractData(await idempotent.json()).initiativeId).toBe(projectId);

    await expect(page.getByText(/Estado: Draft/i)).toBeVisible();
    await expect(page.getByText(/Ruta Step 0/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Ver revisión inicial/i })).toBeVisible();
    await page.getByRole('button', { name: /Ver revisión inicial/i }).click();
    await expect(page.getByText(/Nombre sugerido/i)).toBeVisible();

    await page.getByRole('button', { name: /Empezar Step 0/i }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/step/0$`));

    const afterStep0Open = await getProject(page.request, token, projectId);
    expect(afterStep0Open.step0Status).not.toBe('COMPLETED');
    expect(afterStep0Open.step0Status).not.toBe('APPROVED');

    const events = await page.evaluate(() =>
      ((window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? []).map((item) => item.event),
    );
    for (const eventName of [
      'initial_review_started',
      'initial_review_generated',
      'route_preview_viewed',
      'route_confirmed',
      'initiative_created_from_route',
      'initiative_overview_opened',
      'step0_started_from_overview',
    ]) {
      expect(events).toContain(eventName);
    }
  });

  test('negativo: abandonar revision antes de confirmar no crea Project huerfano', async ({ page }) => {
    const token = await registerOwner(page);
    const res = await page.request.post(apiPath('/api/v1/initial-reviews'), {
      headers: auth(token),
      data: { originalInput: VALID_IDEA },
      failOnStatusCode: false,
    });
    expect(res.status(), `create review: ${await res.text()}`).toBe(201);
    expect(await listProjects(page.request, token)).toHaveLength(0);
  });
});
