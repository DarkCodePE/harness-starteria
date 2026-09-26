import { PrismaClient } from '@prisma/client';
import { test, expect, request as pwRequest, type APIRequestContext, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost';
const EMAIL = process.env.E2E_USER_EMAIL || 'portfolio.e2e@starteria.test';
const PASSWORD = process.env.E2E_USER_PASSWORD || 'demo123';
const FRONT_ID = 'front-e2e-existing';
const prisma = new PrismaClient();

type Fixture = { stateId: string; statement: string; title: string };

function tokenFrom(body: any): string {
  return body?.data?.tokens?.accessToken ?? body?.data?.accessToken ?? body?.tokens?.accessToken ?? body?.accessToken ?? '';
}

async function login(api: APIRequestContext): Promise<string> {
  const response = await api.post('/api/v1/auth/login', { data: { email: EMAIL, password: PASSWORD } });
  expect(response.status(), await response.text()).toBe(200);
  const token = tokenFrom(await response.json());
  expect(token).toBeTruthy();
  return token;
}

async function createFixture(label: string, withCanonicalFront = true): Promise<Fixture> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const stateId = `sf6d-e2e-${label}-${suffix}`;
  const statement = `SF-6D candidate ${suffix}`;
  const title = `SF-6D Challenge ${suffix}`;
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  if (!user.organizationId) throw new Error('SF-6D E2E user must belong to an organization');

  await prisma.organizationPortfolioAccessGrant.upsert({
    where: { userId_organizationId_capability: { userId: user.id, organizationId: user.organizationId, capability: 'portfolio:write' } },
    update: {},
    create: { userId: user.id, organizationId: user.organizationId, capability: 'portfolio:write', grantedByUserId: user.id },
  });

  await prisma.strategicFramingProvisionalState.create({ data: {
    id: stateId,
    userId: user.id,
    organizationId: user.organizationId,
    sourceMode: 'enterprise_direct',
    logicalContextKey: stateId,
    sourceRefs: [`e2e:sf6d:${label}`],
    provenance: [],
    intendedMovement: 'Mejorar la conversión',
    whyItMatters: 'La conversión necesita una decisión estratégica verificable.',
    subjectLevel: 'challenge_like',
    scopeAssessment: { level: 'challenge_like', confidence: 'medium', rationale: ['E2E fixture'], provenance: [] },
    parentStatus: withCanonicalFront ? 'known' : 'unresolved',
    parentContext: withCanonicalFront ? { label: 'E2E Existing Strategic Front', sourceRefs: [`strategic_front:${FRONT_ID}`] } : { sourceRefs: [] },
    sufficiencyStatus: 'sufficient',
    blockers: [],
    softGaps: [],
    optionalContext: [],
    version: 1,
    prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: null, focusRationale: null, candidates: [{ candidateId: 'gap-1', kind: 'gap', statementSnapshot: statement, sourceRefs: [`e2e:sf6d:${label}`], humanDisposition: 'undecided' }] },
    challengeStructuringState: { schemaVersion: 1, nonCanonical: true, candidates: [] },
  } as any });
  return { stateId, statement, title };
}

async function cleanupFixture(fixture: Fixture) {
  const promotions = await prisma.strategicFramingPromotion.findMany({ where: { stateId: fixture.stateId }, select: { challengeId: true } });
  await prisma.strategicFramingPromotion.deleteMany({ where: { stateId: fixture.stateId } });
  if (promotions.length) await prisma.challenge.deleteMany({ where: { id: { in: promotions.map(item => item.challengeId) } } });
  await prisma.strategicFramingProvisionalState.deleteMany({ where: { id: fixture.stateId } });
}

async function uiLogin(page: Page) {
  await page.goto('/auth');
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/(dashboard|portfolio\/inicio)/i, { timeout: 20_000 });
}

test.describe('SF-6D guided Challenge workspace', () => {
  test.afterAll(async () => { await prisma.$disconnect(); });

  test('completes the guided Challenge path and is idempotent after reload', async ({ page }) => {
    const fixture = await createFixture('happy');
    try {
      await uiLogin(page);
      await page.goto(`/portfolio/framing/${fixture.stateId}`);
      await expect(page.getByText(fixture.statement, { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'address_now' }).click();
      await expect(page.getByText('address_now', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Aceptar estructura propuesta' }).click();
      await expect(page.getByText(fixture.statement, { exact: true }).last()).toBeVisible();

      await page.getByLabel('Frente estratégico', { exact: true }).selectOption(FRONT_ID);
      await page.getByLabel(/Título confirmado/).fill(fixture.title);
      await page.getByLabel(/Confirmo Front, título, declaración y tipo/).check();
      await page.getByRole('button', { name: 'Promover Challenge' }).click();

      await expect(page.getByText('Challenge creado', { exact: true })).toBeVisible();
      await expect(page.getByText('Estado: Draft', { exact: true })).toBeVisible();
      await expect(page.getByText('Frente: E2E Existing Strategic Front', { exact: true })).toBeVisible();
      await expect(page.getByText('Iniciativas creadas: 0', { exact: true })).toBeVisible();

      await page.reload();
      await expect(page.getByText('Promovido:', { exact: false })).toBeVisible();
      const [promotionCount, challengeCount] = await Promise.all([
        prisma.strategicFramingPromotion.count({ where: { stateId: fixture.stateId } }),
        prisma.challenge.count({ where: { title: fixture.title, strategicFrontId: FRONT_ID } }),
      ]);
      expect(promotionCount).toBe(1);
      expect(challengeCount).toBe(1);
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('blocks promotion when the human has not selected a canonical Front', async ({ page }) => {
    const fixture = await createFixture('no-front', false);
    try {
      await uiLogin(page);
      await page.goto(`/portfolio/framing/${fixture.stateId}`);
      await page.getByRole('button', { name: 'address_now' }).click();
      await page.getByRole('button', { name: 'Aceptar estructura propuesta' }).click();
      const promotionRequests: string[] = [];
      page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/strategic-framing/states/') && request.url().endsWith('/promotions')) promotionRequests.push(request.url()); });
      await page.getByRole('button', { name: 'Promover Challenge' }).click();
      await expect(page.getByRole('alert')).toContainText('Strategic Front canónico');
      expect(promotionRequests).toHaveLength(0);
      expect(await prisma.strategicFramingPromotion.count({ where: { stateId: fixture.stateId } })).toBe(0);
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('shows an explicit reload affordance on a stale local save', async ({ page }) => {
    const fixture = await createFixture('stale');
    const api = await pwRequest.newContext({ baseURL: BASE });
    try {
      const token = await login(api);
      await uiLogin(page);
      await page.goto(`/portfolio/framing/${fixture.stateId}`);
      await page.getByLabel('Movimiento intencionado').fill('Cambio local que no debe sobrescribirse automáticamente');

      const remote = await api.patch(`/api/v1/strategic-framing/states/${fixture.stateId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { expectedVersion: 1, intendedMovement: 'Cambio remoto de versión N+1' },
      });
      expect(remote.status(), await remote.text()).toBe(200);

      await page.getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(page.getByRole('alert')).toContainText('actualizado en otra sesión');
      await expect(page.getByRole('button', { name: 'Recargar versión' })).toBeVisible();
      await expect(page.getByLabel('Movimiento intencionado')).toHaveValue('Cambio local que no debe sobrescribirse automáticamente');
    } finally {
      await api.dispose();
      await cleanupFixture(fixture);
    }
  });
});
