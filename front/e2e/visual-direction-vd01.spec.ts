import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/design-system/visual-direction-vd01');

const routes = [
  { path: '/public/start', name: 'public-start' },
  { path: '/portfolio/inicio', name: 'portfolio-inicio' },
  { path: '/portfolio/retos?challengeId=challenge-invite', name: 'portfolio-retos' },
];

const viewports = [
  { width: 1440, height: 1100, name: 'desktop-1440' },
  { width: 390, height: 1100, name: 'mobile-390' },
  { width: 375, height: 1100, name: 'mobile-375' },
  { width: 1024, height: 1100, name: 'tablet-1024' },
  { width: 320, height: 1100, name: 'mobile-320' },
];

test.describe('VD-01 visual direction screenshots', () => {
  for (const route of routes) {
    for (const viewport of viewports) {
      test(`${route.name} ${viewport.name}`, async ({ page }) => {
        test.skip(route.path !== '/public/start' && viewport.name === 'mobile-320', '320px validation is only required for public start when practical.');

        if (route.path.startsWith('/portfolio')) {
          await mockPortfolioLeadSession(page);
        }

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path, { waitUntil: 'networkidle' });
        await expect(page.locator('body')).toBeVisible();

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);

        await page.screenshot({
          path: path.join(OUTPUT_DIR, `${route.name}-${viewport.name}.png`),
          fullPage: true,
        });
      });
    }
  }
});

async function mockPortfolioLeadSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('starteria.demo.enabled', 'true');
  });

  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { accessToken: 'vd01-visual-token' } }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'vd01-portfolio-lead',
          name: 'Ana Portfolio',
          email: 'ana@starteria.test',
          role: 'portfolio_lead',
          roles: ['portfolio_lead'],
          permissions: ['portfolio:read', 'portfolio:write'],
          initials: 'AP',
        },
      }),
    });
  });

  await page.route('**/api/v1/projects**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
}
