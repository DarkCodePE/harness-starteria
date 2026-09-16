import { test, expect } from '@playwright/test';

test.describe('anonymous /public/start access (Portfolio Entry)', () => {
  test('stays on /public/start and renders the Phase 6F entry experience', async ({ page }) => {
    await page.goto('/public/start');

    await expect(page.getByRole('heading', {
      name: /Convierte tus iniciativas en decisiones conectadas al negocio/i,
    })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Analizar mi situaci[oó]n/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Arrastra un PDF/i })).toHaveCount(0);

    expect(new URL(page.url()).pathname).toBe('/public/start');
  });

  test('a hard reload on /public/start keeps the anonymous visitor on the public route', async ({ page }) => {
    await page.goto('/public/start');
    await page.reload();

    await expect(page.getByRole('button', { name: /Analizar mi situaci[oó]n/i })).toBeVisible({
      timeout: 15_000,
    });
    expect(new URL(page.url()).pathname).toBe('/public/start');
  });
});
