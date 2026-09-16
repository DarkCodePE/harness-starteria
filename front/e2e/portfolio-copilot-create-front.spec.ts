import { test, expect, request as pwRequest, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient, Role } from '@prisma/client';

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const E2E_EMAIL = process.env.E2E_USER_EMAIL || 'portfolio.e2e@starteria.test';
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD || 'demo123';
const E2E_ORGANIZATION_ID = process.env.E2E_ORGANIZATION_ID || 'org-e2e-portfolio-copilot';
const prisma = new PrismaClient();

async function ensurePortfolioLeadOrganization() {
  const user = await prisma.user.update({
    where: { email: E2E_EMAIL },
    data: { role: Role.mentor, isActive: true },
  });
  const organization = await prisma.organization.upsert({
    where: { id: E2E_ORGANIZATION_ID },
    update: { name: 'Starteria E2E Portfolio', slug: 'starteria-e2e-portfolio' },
    create: {
      id: 'org-e2e-portfolio-copilot',
      name: 'Starteria E2E Portfolio',
      slug: 'starteria-e2e-portfolio',
      seatLimit: 5,
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: organization.id },
  });
  await prisma.organizationMember.createMany({
    data: [{ organizationId: organization.id, userId: user.id, role: 'admin' }],
    skipDuplicates: true,
  });
  return { userId: user.id, organizationId: organization.id };
}

async function uiLogin(page: Page) {
  await page.goto('/auth');
  await page.locator('input[type="email"]').fill(E2E_EMAIL);
  await page.locator('input[type="password"]').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/(dashboard|portfolio\/inicio)/i, { timeout: 20_000 });
}

async function loginApi(api: APIRequestContext): Promise<string> {
  const response = await api.post('/api/v1/auth/login', {
    data: { email: E2E_EMAIL, password: E2E_PASSWORD },
    failOnStatusCode: false,
  });
  if (response.status() !== 200) throw new Error(`login failed: ${response.status()} ${await response.text()}`);
  const body = await response.json() as { data?: { accessToken?: string } };
  const token = body.data?.accessToken;
  if (!token) throw new Error('missing access token');
  return token;
}

test.describe('Portfolio Copilot CreateStrategicFront vertical', () => {
  test.beforeEach(async () => {
    const { organizationId, userId } = await ensurePortfolioLeadOrganization();
    await prisma.strategicFront.deleteMany({
      where: {
        organizationId,
        ownerId: userId,
        name: { startsWith: 'E2E Copilot Eficiencia' },
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('crea frente por conversación, aprueba, ejecuta, recupera y no duplica en replay', async ({ page }) => {
    const uniqueName = `E2E Copilot Eficiencia ${Date.now()}`;
    const api = await pwRequest.newContext({ baseURL: BASE });
    const token = await loginApi(api);

    await uiLogin(page);
    await expect(page.getByRole('region', { name: 'Portfolio Copilot' })).toBeVisible();

    const message =
      `Crea un frente llamado ${uniqueName}. ` +
      'Su objetivo es reducir el retrabajo en procesos internos. ' +
      'El KPI principal sera horas de retrabajo al mes, con baseline 500, meta 300, horizonte de 6 meses, prioridad alta y sponsor Gerencia de Operaciones.';

    await page.getByLabel('Mensaje para Portfolio Copilot').fill(message);
    await page.getByRole('button', { name: /Enviar/i }).click();
    await expect(page.getByLabel('Action Plan')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Crear frente estratégico')).toBeVisible();

    const adjustedName = `${uniqueName} Ajustado`;
    await page.getByLabel('Nombre').fill(adjustedName);
    await page.getByRole('button', { name: /Guardar cambios/i }).click();
    await expect(page.getByText(/v2/i).first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Aprobar/i }).click();
    await expect(page.getByRole('button', { name: /Ejecutar/i })).toBeEnabled({ timeout: 10_000 });
    await page.getByRole('button', { name: /Ejecutar/i }).click();

    await expect(page.getByText(/Frente estratégico creado/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: adjustedName })).toBeVisible();

    const frontsAfterCreate = await prisma.strategicFront.findMany({
      where: { name: adjustedName },
      select: { id: true },
    });
    expect(frontsAfterCreate).toHaveLength(1);

    await page.reload();
    await expect(page.getByText(/Frente estratégico creado/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: adjustedName })).toBeVisible();

    const conversationId = await page.evaluate(() => window.sessionStorage.getItem('starteria.portfolioCopilot.conversationId'));
    expect(conversationId).toBeTruthy();
    const planResponse = await api.get(`/api/v1/copilot/conversations/${conversationId}/action-plan`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(planResponse.ok()).toBeTruthy();
    const planBody = await planResponse.json() as { data: { proposedActions: Array<{ id: string; version: number }> } };
    const action = planBody.data.proposedActions[0];
    const executionRecord = await prisma.actionExecution.findFirst({
      where: { proposedActionId: action.id },
      orderBy: { createdAt: 'desc' },
      select: { idempotencyKey: true },
    });
    const replayKey = executionRecord?.idempotencyKey;
    expect(replayKey).toBeTruthy();
    const replay = await api.post(`/api/v1/copilot/actions/${action.id}/execute`, {
      data: { expectedVersion: action.version },
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': replayKey,
      },
      failOnStatusCode: false,
    });
    expect(replay.status()).toBe(200);

    const frontsAfterReplay = await prisma.strategicFront.findMany({
      where: { name: adjustedName },
      select: { id: true },
    });
    expect(frontsAfterReplay).toHaveLength(1);
    await api.dispose();
  });
});
