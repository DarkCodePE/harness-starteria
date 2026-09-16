import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/design-system/visual-direction-vd03');

const viewports = [
  { width: 1440, height: 1100, name: 'desktop-1440' },
  { width: 390, height: 1100, name: 'mobile-390' },
];

test.describe('VD-03 landing narrative screenshots', () => {
  for (const viewport of viewports) {
    test(`landing hero ${viewport.name}`, async ({ page }) => {
      await mockPublicShell(page);
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.getByRole('heading', { name: /iniciativas dispersas/i })).toBeVisible();
      await expect(page.getByLabel(/necesitas conseguir/i)).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `landing-hero-${viewport.name}.png`),
        fullPage: false,
      });
    });

    test(`landing scroll narrative ${viewport.name}`, async ({ page }) => {
      await mockPublicShell(page);
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });

      await page.locator('#problema').scrollIntoViewIfNeeded();
      await expect(page.getByRole('heading', { name: /merece atencion/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /lectura guiada/i })).toBeVisible();
      await expect(page.getByText(/por que confiar/i)).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `landing-sections-${viewport.name}.png`),
        fullPage: true,
      });
    });
  }
});

async function mockPublicShell(page: Page) {
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'anonymous' }) });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
