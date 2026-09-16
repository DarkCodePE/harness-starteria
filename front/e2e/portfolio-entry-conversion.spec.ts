import { expect, request as pwRequest, test, type APIRequestContext, type Frame, type Page, type TestInfo } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

type Scenario = {
  id: string;
  input: string;
  answer: string;
  expectedRouteText: RegExp;
  continueToPortfolio?: boolean;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'portfolio-first',
    input: 'Tengo 18 iniciativas y necesito decidir cuales continuar.',
    answer: 'Necesito comparar contribucion, evidencia y esfuerzo antes del proximo comite.',
    expectedRouteText: /Aclarar|Incorporar|Priorizar/i,
    continueToPortfolio: true,
  },
  {
    id: 'solution-first',
    input: 'Compramos un asistente de IA para ventas y no se si esta generando valor.',
    answer: 'Todavia no tenemos claro que resultado comercial deberia justificar la inversion.',
    expectedRouteText: /Reconectar|Revisar|Preparar decision/i,
  },
  {
    id: 'reporting-first',
    input: 'Tengo comite y necesito saber que iniciativas estan bloqueadas.',
    answer: 'El comite necesita ver bloqueos, pendientes y decisiones que destraben avance.',
    expectedRouteText: /Alinear|Conectar|Detectar|Decidir|Clarificar|Consolidar|Actualizar/i,
  },
  {
    id: 'strategy-first',
    input: 'Necesitamos reducir costes 15% y no sabemos que priorizar.',
    answer: 'Queremos entender que iniciativas pueden contribuir a la reduccion sin inventar evidencia.',
    expectedRouteText: /Aterrizar|Conectar|Seguir/i,
  },
];

function extractToken(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.tokens?.accessToken ?? body?.accessToken ?? '';
}

async function registerPortfolioUser(api: APIRequestContext) {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const email = `e2e-entry-portfolio-${stamp}@starteria.test`;
  const password = 'E2eTest!1234';
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, password, name: `E2E Portfolio Entry ${stamp}`, role: 'participante' },
    failOnStatusCode: false,
  });
  expect([200, 201, 409], `register ${email}: ${await reg.text()}`).toContain(reg.status());
  await prisma.user.update({
    where: { email },
    data: { role: 'portfolio_lead', roles: ['portfolio_lead'], isActive: true },
  });
  const login = await api.post('/api/v1/auth/login', { data: { email, password }, failOnStatusCode: false });
  expect(login.status(), `login ${email}: ${await login.text()}`).toBe(200);
  expect(extractToken(await login.json())).toBeTruthy();
  return { email, password };
}

async function loginThroughUi(page: Page, email: string, password: string) {
  await expect(page.getByRole('heading', { name: /Bienvenido de vuelta/i })).toBeVisible();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /^Entrar$/i }).click();
}

async function visible(locator: ReturnType<Page['getByText']>): Promise<boolean> {
  return locator.isVisible().catch(() => false);
}

async function canonicalCounts() {
  const [strategicFronts, challenges, projects, steps, initiativePortfolioMetas] = await Promise.all([
    prisma.strategicFront.count(),
    prisma.challenge.count(),
    prisma.project.count(),
    prisma.step.count(),
    prisma.initiativePortfolioMeta.count(),
  ]);
  return { strategicFronts, challenges, projects, steps, initiativePortfolioMetas };
}

function currentContinuationId(page: Page): string {
  const continuationId = new URL(page.url()).searchParams.get('portfolioEntryContinuationId');
  expect(continuationId).toBeTruthy();
  return continuationId ?? '';
}

function watchForbiddenPortfolioEntryNavigation(page: Page) {
  const forbiddenUrls: string[] = [];
  const forbiddenRoutes = [
    /^\/public\/draft\/[^/]+\/edit$/,
    /^\/projects\/[^/]+$/,
    /^\/projects\/[^/]+\/step\/0$/,
    /^\/step\/0$/,
  ];
  const onFrameNavigated = (frame: Frame) => {
    if (frame !== page.mainFrame()) return;
    try {
      const url = new URL(frame.url());
      if (forbiddenRoutes.some((route) => route.test(url.pathname))) {
        forbiddenUrls.push(url.pathname);
      }
    } catch {
      // Ignore transient about:blank or browser-internal URLs.
    }
  };
  page.on('framenavigated', onFrameNavigated);
  return {
    expectClean() {
      expect(forbiddenUrls, `Portfolio Entry navigated to legacy routes: ${forbiddenUrls.join(', ')}`).toEqual([]);
    },
    dispose() {
      page.off('framenavigated', onFrameNavigated);
    },
  };
}

async function bootstrapStateForContinuation(continuationId: string) {
  const sessions = await (prisma as any).portfolioBootstrapSession.findMany({
    where: { sourceContinuationId: continuationId },
    include: {
      anchor: true,
      workItems: { orderBy: { createdAt: 'asc' } },
      analysisRuns: { orderBy: { createdAt: 'asc' } },
      proposedMutations: { orderBy: { createdAt: 'asc' } },
      strategicConnections: true,
      advancementConditions: true,
      readings: { orderBy: { version: 'asc' } },
      importBatches: { orderBy: { createdAt: 'asc' } },
    },
  });
  return { sessions, session: sessions[0] ?? null };
}

async function expectOneBootstrapSession(continuationId: string) {
  await expect.poll(async () => {
    const state = await bootstrapStateForContinuation(continuationId);
    return state.sessions.length;
  }).toBe(1);
  const state = await bootstrapStateForContinuation(continuationId);
  expect(state.session?.anchor).toBeTruthy();
  return state;
}

async function reachHandoff(page: Page, scenario: Scenario, testInfo: TestInfo) {
  await page.goto('/public/start');
  await page.evaluate(() => window.sessionStorage.clear());
  await page.goto('/public/start');

  if (scenario.id === 'portfolio-first') {
    await page.screenshot({ path: testInfo.outputPath('portfolio-entry-landing.png'), fullPage: true });
  }

  await page.getByLabel(/necesitas conseguir/i).fill(scenario.input);
  await page.getByRole('button', { name: /Analizar mi situaci[oó]n/i }).click();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await visible(page.getByText(/TU LECTURA INICIAL/i))) return;

    const seeReading = page.getByRole('button', { name: /Ver mi lectura/i });
    if (await seeReading.isVisible().catch(() => false)) {
      await seeReading.click();
      await page.waitForTimeout(500);
      continue;
    }

    const answer = page.getByLabel(/Tu respuesta/i);
    if (await answer.isVisible().catch(() => false)) {
      if (!(await answer.isEnabled().catch(() => false))) {
        await page.waitForTimeout(500);
        continue;
      }
      if (scenario.id === 'portfolio-first' && attempt === 0) {
        await page.screenshot({ path: testInfo.outputPath('portfolio-entry-clarification.png'), fullPage: true });
      }
      await answer.fill(scenario.answer);
      await page.getByRole('button', { name: /Enviar respuesta/i }).click();
      await page.waitForTimeout(800);
      continue;
    }

    await page.waitForTimeout(1000);
  }

  await expect(page.getByText(/TU LECTURA INICIAL/i)).toBeVisible({ timeout: 30_000 });
}

test.describe('Portfolio Entry visible UX and Portfolio continuation', () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('renders quick clarification as a guided pre-handoff state', async ({ page }, testInfo) => {
    await page.goto('/public/start');
    await page.evaluate(() => window.sessionStorage.clear());
    await page.goto('/public/start');

    await page.getByLabel(/necesitas conseguir/i).fill('Necesito ordenar mis iniciativas ya.');
    await page.getByRole('button', { name: /Analizar mi situaci[oó]n/i }).click();

    await expect(page.getByText(/Esto entendi hasta ahora/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Hasta 3 preguntas/i)).toBeVisible();
    await expect(page.getByLabel(/Tu respuesta/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /No lo se todavia/i })).toBeVisible();
    await expect(page.getByText(/TU LECTURA INICIAL/i)).toHaveCount(0);

    await page.screenshot({ path: testInfo.outputPath('portfolio-entry-clarification.png'), fullPage: true });
  });

  for (const scenario of SCENARIOS) {
    test(`${scenario.id} reaches adaptive handoff without Project/Steps language`, async ({ page }, testInfo) => {
      const legacyNavigation = watchForbiddenPortfolioEntryNavigation(page);
      await reachHandoff(page, scenario, testInfo);

      await expect(page.getByText(/Lectura inicial lista/i)).toBeVisible();
      await expect(page.getByText(scenario.expectedRouteText).first()).toBeVisible();
      await expect(page.getByText(/Early Access/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Continuar con mi portafolio/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Ajustar lectura/i })).toBeVisible();
      await expect(page.getByText(/Crear iniciativa y continuar/i)).toHaveCount(0);
      await expect(page.getByText(/Step 0/i)).toHaveCount(0);
      await expect(page.getByText(/Initiative Overview/i)).toHaveCount(0);

      if (scenario.id === 'portfolio-first') {
        await page.screenshot({ path: testInfo.outputPath('portfolio-entry-handoff-desktop.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 900 });
        await page.screenshot({ path: testInfo.outputPath('portfolio-entry-handoff-mobile.png'), fullPage: true });
        await page.setViewportSize({ width: 1280, height: 900 });

        await page.getByRole('button', { name: /Ajustar lectura/i }).click();
        await expect(page.getByRole('heading', { name: /^Correcciones$/i })).toBeVisible();
        await page.getByRole('button', { name: /Cancelar/i }).click();
      }

      if (!scenario.continueToPortfolio) {
        legacyNavigation.expectClean();
        legacyNavigation.dispose();
        return;
      }

      const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
      const user = await registerPortfolioUser(api);

      await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();
      await expect(page.getByText(/Esta lectura esta lista para continuar/i)).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('portfolio-entry-registration-transition.png'), fullPage: true });
      await page.getByRole('button', { name: /Crear cuenta y conservar lectura/i }).click();
      await loginThroughUi(page, user.email, user.password);

      await expect(page.getByText(/Tu sesion quedo guardada/i)).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(/\/public\/start/);
      await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();

      await expect(page).toHaveURL(/\/portfolio\/inicio\?portfolioEntryContinuationId=/, { timeout: 30_000 });
      const continuationId = currentContinuationId(page);
      await expect(page.getByText(/Portfolio Bootstrap|Ya tenemos un punto de partida/i)).toBeVisible();
      await expect(page.getByText(/Esto entendimos/i)).toBeVisible();
      await expect(page.getByText(/Todavia falta aclarar|Informacion conocida/i)).toBeVisible();
      let dbState = await expectOneBootstrapSession(continuationId);
      const bootstrapSessionId = dbState.session.id;
      const anchorId = dbState.session.anchor.id;
      const confirmAnchor = page.getByRole('button', { name: /Confirmar punto de partida/i });
      if (await confirmAnchor.isVisible().catch(() => false)) {
        await confirmAnchor.dblclick();
        await expect(page.getByText('Confirmado', { exact: true })).toBeVisible({ timeout: 15_000 });
      }
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.id).toBe(bootstrapSessionId);
      expect(dbState.session.anchor.id).toBe(anchorId);
      expect(dbState.session.anchor.status).toBe('anchor_confirmed');
      expect(dbState.session.workItems).toHaveLength(0);
      await page.reload();
      await expect(page.getByRole('button', { name: /Incorporar trabajo existente/i })).toBeVisible();
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.id).toBe(bootstrapSessionId);
      expect(dbState.session.anchor.id).toBe(anchorId);
      expect(dbState.session.workItems).toHaveLength(0);
      const beforeBootstrapIntake = await canonicalCounts();
      await expect(page.getByRole('button', { name: /Incorporar trabajo existente/i })).toBeVisible();
      await page.getByRole('button', { name: /Incorporar trabajo existente/i }).click();
      await expect(page.getByTestId('portfolio-bootstrap-work-intake')).toBeVisible();
      await page.getByLabel(/Pega nombres de iniciativas/i).fill([
        'Nuevo onboarding digital',
        'Chatbot de soporte',
        'Programa loyalty',
        'Migracion CRM',
      ].join('\n'));
      await page.getByRole('button', { name: /Agregar trabajo/i }).dblclick();
      await expect(page.getByText(/4 elementos detectados/i)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Nuevo onboarding digital')).toBeVisible();
      await expect(page.getByText('Chatbot de soporte')).toBeVisible();
      await expect(page.getByText('Programa loyalty')).toBeVisible();
      await expect(page.getByText('Migracion CRM')).toBeVisible();
      await expect(page.getByText(/Provisional - pegado por usuario/i).first()).toBeVisible();
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.workItems).toHaveLength(4);
      expect(dbState.session.workItems.map((item: any) => item.rawLabel)).toEqual([
        'Nuevo onboarding digital',
        'Chatbot de soporte',
        'Programa loyalty',
        'Migracion CRM',
      ]);
      await page.reload();
      await expect(page.getByText(/4 elementos detectados/i)).toBeVisible({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.id).toBe(bootstrapSessionId);
      expect(dbState.session.workItems).toHaveLength(4);
      await expect(page.getByRole('button', { name: /Analizar trabajo detectado/i })).toBeEnabled();
      await page.getByRole('button', { name: /Analizar trabajo detectado/i }).dblclick();
      await expect(page.getByText(/Starteria esta organizando esta primera lectura/i)).toBeVisible();
      await expect(page.getByTestId('portfolio-bootstrap-proposed-structure').getByText(/Pendiente de tu revision/i)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Primera lectura provisional/i)).toBeVisible();
      await expect(page.getByText(/AI_INFERRED|AI_SUGGESTED/i).first()).toBeVisible();
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.analysisRuns).toHaveLength(1);
      expect(dbState.session.proposedMutations.length).toBeGreaterThan(0);
      const proposedMutationCount = dbState.session.proposedMutations.length;
      await page.reload();
      await expect(page.getByTestId('portfolio-bootstrap-proposed-structure').getByText(/Pendiente de tu revision/i)).toBeVisible({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.analysisRuns).toHaveLength(1);
      expect(dbState.session.proposedMutations).toHaveLength(proposedMutationCount);
      await expect(page.getByRole('button', { name: /Revisar propuesta/i })).toBeEnabled();
      await page.getByRole('button', { name: /Revisar propuesta/i }).click();
      await expect(page.getByTestId('portfolio-bootstrap-material-review')).toBeVisible();
      await page.getByTestId('portfolio-bootstrap-material-review').getByRole('button', { name: /^Confirmar$/i }).first().dblclick();
      await expect(page.getByText(/1 confirmadas/i)).toBeVisible({ timeout: 15_000 });
      const correctedMutation = page.getByTestId('portfolio-bootstrap-material-review')
        .locator('[data-testid^="portfolio-bootstrap-mutation-"]')
        .filter({ hasText: /No hay owner organizacional confirmado/i })
        .first();
      await correctedMutation.getByRole('button', { name: /Corregir/i }).click();
      await page.getByLabel(/Correccion propuesta/i).selectOption('partial_alignment');
      await page.getByLabel(/Motivo de correccion/i).fill('Solo cubre una parte de la prioridad');
      await page.getByRole('button', { name: /Guardar correccion/i }).click();
      await expect(page.getByText(/Conserva propuesta original/i)).toBeVisible({ timeout: 15_000 });
      await correctedMutation.getByRole('button', { name: /^Confirmar$/i }).click();
      await expect(page.getByText(/2 confirmadas/i)).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('portfolio-bootstrap-material-review').locator('button[data-review-action="reject"]:not([disabled])').first().click();
      await expect(page.getByText(/1 rechazadas/i)).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('portfolio-bootstrap-material-review').locator('button[data-review-action="leave-pending"]:not([disabled])').first().click();
      await expect(page.getByTestId('portfolio-bootstrap-material-review').getByText(/\d+ pendientes/i)).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: /Dejar pendientes restantes/i }).click();
      await expect(page.getByRole('button', { name: /Generar primera lectura del portafolio/i })).toBeEnabled({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.status).toBe('awaiting_first_reading');
      expect(dbState.session.proposedMutations).toHaveLength(proposedMutationCount);
      expect(dbState.session.proposedMutations.some((mutation: any) => mutation.status === 'confirmed')).toBe(true);
      expect(dbState.session.proposedMutations.some((mutation: any) => mutation.status === 'rejected')).toBe(true);
      expect(dbState.session.proposedMutations.some((mutation: any) => mutation.status === 'reviewed')).toBe(true);
      await page.reload();
      await expect(page.getByRole('button', { name: /Generar primera lectura del portafolio/i })).toBeEnabled({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.status).toBe('awaiting_first_reading');
      const publishReading = page.getByRole('button', { name: /Generar primera lectura del portafolio/i });
      await expect(publishReading).toBeEnabled({ timeout: 15_000 });
      await publishReading.dblclick();
      await expect(page.getByText(/Starteria esta consolidando tu primera lectura del portafolio/i)).toBeVisible();
      await expect(page.getByTestId('portfolio-first-reading')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Primera lectura del portafolio/i)).toBeVisible();
      await expect(page.getByText(/Requiere atencion/i)).toBeVisible();
      await expect(page.getByTestId('portfolio-attention-item').first()).toBeVisible();
      await expect(page.getByTestId('portfolio-reading-provenance')).toBeVisible();
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.status).toBe('reading_published');
      expect(dbState.session.bootstrapPhase).toBe('B5_FIRST_READING');
      expect(dbState.session.readings).toHaveLength(1);
      expect(dbState.session.readings[0].homeState).toMatch(/HOME_D|HOME_E/);
      expect(await canonicalCounts()).toEqual(beforeBootstrapIntake);
      await expect(page.getByText(/Crear frente estrategico/i)).toHaveCount(0);
      await expect(page.getByText(/Crear reto/i)).toHaveCount(0);
      await expect(page.getByText(/Crear iniciativa y continuar/i)).toHaveCount(0);
      await expect(page.getByText(/Step 0/i)).toHaveCount(0);
      await expect(page.getByText(/HMW|Test Card|experiment|prototype/i)).toHaveCount(0);
      await expect(page).not.toHaveURL(/\/initiatives\/|\/overview|\/step\/0/);
      await page.screenshot({ path: testInfo.outputPath('portfolio-home-after-continuation.png'), fullPage: true });

      await page.reload();
      await expect(page.getByTestId('portfolio-first-reading')).toBeVisible();
      await expect(page.getByText(/Esto entendimos/i)).toBeVisible();
      await expect(page.getByText('Nuevo onboarding digital')).toBeVisible();
      await expect(page.getByText('Chatbot de soporte')).toBeVisible();
      await expect(page.getByText('Programa loyalty')).toBeVisible();
      await expect(page.getByText('Migracion CRM')).toBeVisible();
      await expect(page.getByText(/Primera lectura del portafolio/i)).toBeVisible();
      await expect(page.getByText(/Lectura versionada desde el Bootstrap revisado/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Generar primera lectura del portafolio/i })).toHaveCount(0);
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.id).toBe(bootstrapSessionId);
      expect(dbState.session.anchor.id).toBe(anchorId);
      expect(dbState.session.workItems).toHaveLength(4);
      expect(dbState.session.analysisRuns).toHaveLength(1);
      expect(dbState.session.proposedMutations).toHaveLength(proposedMutationCount);
      expect(dbState.session.readings).toHaveLength(1);
      expect(await canonicalCounts()).toEqual(beforeBootstrapIntake);
      if (await page.getByText('Confirmado', { exact: true }).isVisible().catch(() => false)) {
        await expect(page.getByText('Confirmado', { exact: true })).toBeVisible();
      }
      legacyNavigation.expectClean();
      legacyNavigation.dispose();
    });
  }

  test('portfolio-first can persist explicit no-existing-work state through reload', async ({ page }, testInfo) => {
    const legacyNavigation = watchForbiddenPortfolioEntryNavigation(page);
    const scenario = SCENARIOS[0];
    await reachHandoff(page, scenario, testInfo);
    const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
    const user = await registerPortfolioUser(api);

    await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();
    await expect(page.getByText(/Esta lectura esta lista para continuar/i)).toBeVisible();
    await page.getByRole('button', { name: /Crear cuenta y conservar lectura/i }).click();
    await loginThroughUi(page, user.email, user.password);
    await expect(page.getByText(/Tu sesion quedo guardada/i)).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();
    await expect(page).toHaveURL(/\/portfolio\/inicio\?portfolioEntryContinuationId=/, { timeout: 30_000 });

    const confirmAnchor = page.getByRole('button', { name: /Confirmar punto de partida/i });
    if (await confirmAnchor.isVisible().catch(() => false)) {
      await confirmAnchor.click();
      await expect(page.getByText('Confirmado', { exact: true })).toBeVisible({ timeout: 15_000 });
    }
    const beforeNoWork = await canonicalCounts();
    await page.getByRole('button', { name: /Incorporar trabajo existente/i }).click();
    await page.getByRole('button', { name: /Todavia no tenemos iniciativas/i }).click();
    await page.getByRole('button', { name: /Todavia no tenemos iniciativas activas/i }).click();

    await expect(page.getByText(/Perfecto. Starteria puede conservar este punto de partida/i)).toBeVisible({ timeout: 15_000 });
    expect(await canonicalCounts()).toEqual(beforeNoWork);

    await page.reload();
    await expect(page.getByTestId('portfolio-bootstrap-work-intake')).toBeVisible();
    await expect(page.getByText(/Perfecto. Starteria puede conservar este punto de partida/i)).toBeVisible();
    await expect(page.getByText(/Crear frente estrategico|Crear reto|Step 0|HMW|Test Card|experiment|prototype/i)).toHaveCount(0);
    legacyNavigation.expectClean();
    legacyNavigation.dispose();
  });

  for (const format of ['csv', 'xlsx'] as const) {
    test(`portfolio-first imports ${format.toUpperCase()} through B5 without canonical writes`, async ({ page }, testInfo) => {
      const legacyNavigation = watchForbiddenPortfolioEntryNavigation(page);
      const { continuationId, bootstrapSessionId, anchorId } = await startPortfolioBootstrapFromEntry(page, testInfo);
      const beforeImport = await canonicalCounts();
      const importFile = createPortfolioImportFixture(format, testInfo);

      await page.getByRole('button', { name: /Incorporar trabajo existente/i }).click();
      await page.getByRole('button', { name: /Subir Excel o CSV/i }).click();
      await page.getByLabel(/Subir Excel o CSV/i).setInputFiles(importFile);
      await expect(page.getByText(importFile.split(/[\\/]/).pop() ?? '')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Nuevo onboarding digital')).toBeVisible();

      let dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.importBatches).toHaveLength(1);
      expect(dbState.session.workItems).toHaveLength(0);
      expect(await canonicalCounts()).toEqual(beforeImport);

      await page.reload();
      await expect(page.getByRole('button', { name: /Incorporar trabajo existente/i })).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: /Incorporar trabajo existente/i }).click();
      await page.getByRole('button', { name: /Subir Excel o CSV/i }).click();
      await expect(page.getByText(importFile.split(/[\\/]/).pop() ?? '')).toBeVisible();
      await page.getByRole('button', { name: /Incorporar como trabajo provisional/i }).dblclick();
      await expect(page.getByText(/4 elementos detectados/i)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Provisional - importado desde archivo/i).first()).toBeVisible();

      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.id).toBe(bootstrapSessionId);
      expect(dbState.session.anchor.id).toBe(anchorId);
      expect(dbState.session.importBatches).toHaveLength(1);
      expect(dbState.session.importBatches[0].status).toBe('imported');
      expect(dbState.session.workItems).toHaveLength(4);
      expect(dbState.session.workItems[0].importBatchId).toBe(dbState.session.importBatches[0].id);
      expect(dbState.session.workItems[0].sourceRefs).toMatchObject({
        importBatchId: dbState.session.importBatches[0].id,
        rowNumber: 2,
        rawRow: { Initiative: 'Nuevo onboarding digital' },
      });
      expect(await canonicalCounts()).toEqual(beforeImport);

      await page.reload();
      await expect(page.getByText(/4 elementos detectados/i)).toBeVisible({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.workItems).toHaveLength(4);
      expect(dbState.session.importBatches).toHaveLength(1);
      expect(await canonicalCounts()).toEqual(beforeImport);

      await page.getByRole('button', { name: /Analizar trabajo detectado/i }).dblclick();
      await expect(page.getByTestId('portfolio-bootstrap-proposed-structure').getByText(/Pendiente de tu revision/i)).toBeVisible({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.analysisRuns).toHaveLength(1);
      expect(dbState.session.proposedMutations.length).toBeGreaterThan(0);
      const proposedMutationCount = dbState.session.proposedMutations.length;
      expect(await canonicalCounts()).toEqual(beforeImport);

      await page.getByRole('button', { name: /Revisar propuesta/i }).click();
      await expect(page.getByTestId('portfolio-bootstrap-material-review')).toBeVisible();
      await page.getByTestId('portfolio-bootstrap-material-review').getByRole('button', { name: /^Confirmar$/i }).first().dblclick();
      await expect(page.getByText(/1 confirmadas/i)).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: /Dejar pendientes restantes/i }).click();
      await expect(page.getByRole('button', { name: /Generar primera lectura del portafolio/i })).toBeEnabled({ timeout: 15_000 });
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.proposedMutations).toHaveLength(proposedMutationCount);
      expect(await canonicalCounts()).toEqual(beforeImport);

      await page.getByRole('button', { name: /Generar primera lectura del portafolio/i }).dblclick();
      await expect(page.getByTestId('portfolio-first-reading')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Nuevo onboarding digital')).toBeVisible();
      await expect(page.getByTestId('portfolio-reading-provenance')).toBeVisible();
      dbState = await expectOneBootstrapSession(continuationId);
      expect(dbState.session.status).toBe('reading_published');
      expect(dbState.session.bootstrapPhase).toBe('B5_FIRST_READING');
      expect(dbState.session.readings).toHaveLength(1);
      expect(dbState.session.workItems).toHaveLength(4);
      expect(await canonicalCounts()).toEqual(beforeImport);
      await expect(page.getByText(/Crear frente estrategico|Crear reto|Crear iniciativa y continuar|Step 0|HMW|Test Card|experiment|prototype/i)).toHaveCount(0);
      await expect(page).not.toHaveURL(/\/initiatives\/|\/overview|\/step\/0/);
      legacyNavigation.expectClean();
      legacyNavigation.dispose();
    });
  }
});

async function startPortfolioBootstrapFromEntry(page: Page, testInfo: TestInfo) {
  const scenario = SCENARIOS[0];
  await reachHandoff(page, scenario, testInfo);
  const api = await pwRequest.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5176' });
  const user = await registerPortfolioUser(api);

  await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();
  await expect(page.getByText(/Esta lectura esta lista para continuar/i)).toBeVisible();
  await page.getByRole('button', { name: /Crear cuenta y conservar lectura/i }).click();
  await loginThroughUi(page, user.email, user.password);
  await expect(page.getByText(/Tu sesion quedo guardada/i)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Continuar con mi portafolio/i }).click();
  await expect(page).toHaveURL(/\/portfolio\/inicio\?portfolioEntryContinuationId=/, { timeout: 30_000 });

  const continuationId = currentContinuationId(page);
  let dbState = await expectOneBootstrapSession(continuationId);
  const bootstrapSessionId = dbState.session.id;
  const anchorId = dbState.session.anchor.id;
  const confirmAnchor = page.getByRole('button', { name: /Confirmar punto de partida/i });
  if (await confirmAnchor.isVisible().catch(() => false)) {
    await confirmAnchor.click();
    await expect(page.getByText('Confirmado', { exact: true })).toBeVisible({ timeout: 15_000 });
  }
  await page.reload();
  await expect(page.getByRole('button', { name: /Incorporar trabajo existente/i })).toBeVisible({ timeout: 15_000 });
  dbState = await expectOneBootstrapSession(continuationId);
  expect(dbState.session.id).toBe(bootstrapSessionId);
  expect(dbState.session.anchor.id).toBe(anchorId);
  return { continuationId, bootstrapSessionId, anchorId };
}

function createPortfolioImportFixture(format: 'csv' | 'xlsx', testInfo: TestInfo): string {
  const rows = [
    ['Initiative', 'Owner', 'Status', 'Objective', 'KPI', 'Notes'],
    ['Nuevo onboarding digital', 'Ana', 'Active', 'Reducir abandono', 'Activation rate', 'solution-first'],
    ['Chatbot de soporte', '', 'Paused', 'Reducir tickets repetitivos', '', 'missing owner and KPI'],
    ['Programa loyalty', 'Bruno', 'Candidate', 'Aumentar recurrencia', 'Repeat purchase', 'ambiguous KPI'],
    ['Migracion CRM', 'Carla', 'Idea', 'Unificar datos comerciales', 'Data quality', ''],
  ];
  const path = testInfo.outputPath(`portfolio-bootstrap-import.${format}`);
  if (format === 'csv') {
    fs.writeFileSync(path, rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n'));
    return path;
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Portfolio');
  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  fs.writeFileSync(path, bytes);
  return path;
}
