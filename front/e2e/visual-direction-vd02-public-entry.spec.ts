import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/design-system/visual-direction-vd02');

const viewports = [
  { width: 1440, height: 1100, name: 'desktop-1440' },
  { width: 390, height: 1100, name: 'mobile-390' },
];

test.describe('VD-02 public entry reset screenshots', () => {
  for (const viewport of viewports) {
    test(`landing ${viewport.name}`, async ({ page }) => {
      await mockPublicShell(page);
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.getByLabel(/necesitas conseguir/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /analizar mi situaci/i })).toBeVisible();
      await expect(page.getByText(/starteria reading|ejemplo de lectura starteria/i)).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `landing-${viewport.name}.png`), fullPage: true });
    });

    test(`public-start initial workspace ${viewport.name}`, async ({ page }) => {
      await mockPublicShell(page);
      await page.setViewportSize(viewport);
      await page.goto('/public/start', { waitUntil: 'networkidle' });

      await expect(page.getByText(/aclaremos lo necesario/i)).toBeVisible();
      await expect(page.getByLabel(/necesitas conseguir/i)).toBeVisible();
      await expect(page.getByText(/ejemplo de lectura starteria/i)).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `public-start-initial-${viewport.name}.png`), fullPage: true });
    });

    test(`handoff result ${viewport.name}`, async ({ page }) => {
      await mockPublicShell(page);
      await mockHandoffSession(page);
      await page.setViewportSize(viewport);
      await page.goto('/public/start', { waitUntil: 'networkidle' });

      await expect(page.getByText(/lectura inicial lista/i)).toBeVisible();
      await expect(page.getByText(/continua con starteria/i)).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `handoff-result-${viewport.name}.png`), fullPage: true });
    });
  }
});

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function mockPublicShell(page: Page) {
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'anonymous' }) });
  });
}

async function mockHandoffSession(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('starteria.portfolioEntry.current', JSON.stringify({
      sessionId: 'vd02-session',
      credential: 'vd02-token',
    }));
  });

  await page.route('**/api/v1/public/portfolio-entry/sessions/vd02-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: handoffSession() }),
    });
  });
}

function handoffSession() {
  return {
    id: 'vd02-session',
    lifecycleStatus: 'HANDOFF_READY',
    executionStatus: 'ACTIVE',
    revision: 3,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ownership: { state: 'ANONYMOUS' },
    conversation: [],
    clarification: {
      interactionMode: 'quick_clarification',
      quickQuestionBudget: 3,
      quickQuestionsAsked: 1,
      explorationRound: 0,
      questionsAskedCurrentRound: 1,
      previousQuestions: [],
      answeredGaps: [],
    },
    semanticProjection: { currentFrame: 'portfolio_first', initialEntryState: 'portfolio_first', primaryIntent: 'portfolio_alignment' },
    nextAction: 'review_handoff',
    handoff: {
      id: 'handoff-vd02',
      version: 1,
      status: 'ready_with_uncertainty',
      reviewDisposition: 'UNREVIEWED',
      createdAt: new Date().toISOString(),
      handoff: {
        understanding: {
          value: 'El usuario necesita ordenar varias iniciativas antes de preparar una decision de portafolio.',
          provenance: { origin: 'AI_INFERRED' },
          review_disposition: 'UNREVIEWED',
        },
        desired_outcome: {
          value: 'Llegar con una lectura clara de prioridades, gaps y decisiones pendientes.',
          provenance: { origin: 'AI_INFERRED' },
          review_disposition: 'UNREVIEWED',
        },
        decision_to_enable: {
          value: 'Decidir que iniciativas requieren continuidad, ajuste o pausa.',
          provenance: { origin: 'AI_INFERRED' },
          review_disposition: 'UNREVIEWED',
        },
        recommended_approach: {
          description: 'Separar prioridad, retos, iniciativas y evidencia antes de continuar.',
          origin: 'AI_SUGGESTED',
          review_disposition: 'UNREVIEWED',
        },
        alternative_approaches: [],
        known_context: [
          { value: 'Existen varias iniciativas activas y una decision proxima.', provenance: { origin: 'USER_DECLARED' } },
        ],
        unresolved_context: [
          { gap_id: 'gap-1', description: 'Falta confirmar que prioridad de negocio gobierna la decision.' },
        ],
        evidence_or_clarity_needed: [
          { value: 'Senales de impacto o criterios de comparacion entre iniciativas.' },
        ],
        starteria_path: [],
        recommended_cta: 'Continuar hacia un espacio Portfolio para revisar la lectura con mas contexto.',
        provenance_summary: [{ origin: 'AI_INFERRED' }],
        handoff_status: 'ready_with_uncertainty',
      },
    },
  };
}
