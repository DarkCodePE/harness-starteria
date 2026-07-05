/**
 * E2E: anonymous access to /public/start — regression for public-anonymous-pdf-flow.
 *
 * Root cause (fixed): a global provider (PortfolioLeadProvider) mounted on every route
 * fired an authenticated GET on mount; on the public landing that 401'd, the axios
 * response interceptor tried a silent refresh, it failed (anonymous), and the interceptor
 * did `window.location.href = '/auth'` — bouncing the visitor off the public page.
 *
 * This fast, deterministic spec pins the fix WITHOUT the AI-extraction dependency of
 * public-pdf-autofill.spec.ts: loading /public/start with no session must STAY on
 * /public/start and render the PDF dropzone upload affordance.
 *
 * Requires: docker compose up (frontend build must include the interceptor + provider fix).
 *   docker compose up -d && npm run test:e2e -- public-start-access
 */
import { test, expect } from '@playwright/test';

test.describe('anonymous /public/start access (real stack)', () => {
  test('stays on /public/start (no bounce to /auth) and shows the upload button', async ({ page }) => {
    await page.goto('/public/start');

    // The dropzone upload affordance renders (flag VITE_FEATURE_PDF_AUTOFILL on in docker).
    await expect(page.getByRole('button', { name: /Arrastra un PDF/i })).toBeVisible({
      timeout: 15_000,
    });

    // And we did NOT get redirected to the login page.
    await expect(page).toHaveURL(/\/public\/start$/);
    expect(new URL(page.url()).pathname).toBe('/public/start');
  });

  test('a hard reload on /public/start does not bounce to /auth', async ({ page }) => {
    await page.goto('/public/start');
    await page.reload();
    await expect(page.getByRole('button', { name: /Arrastra un PDF/i })).toBeVisible({
      timeout: 15_000,
    });
    expect(new URL(page.url()).pathname).toBe('/public/start');
  });
});
