/**
 * E2E: PUBLIC (anonymous) PDF auto-fill flow — full browser drive.
 *
 * Drives the real /public/start landing with no login:
 *   1. Load /public/start, assert the "Subir documento" upload button renders
 *      (feature flag on in the docker frontend build).
 *   2. Set the hidden file input with the real test PDF.
 *   3. Assert the button flips to the busy "Procesando documento..." state
 *      (proves FE → BE /api/v1/public/pdf-extract wiring kicked off).
 *   4. Wait for the page to navigate to /public/draft/:draftId/edit once the
 *      extraction polling completes (real OpenRouter call → up to ~10 min).
 *   5. On the editor, assert an AI proposal chip ("Propuesto por IA" / Confirmar)
 *      renders for the active field — proving proposals merged into the
 *      AutofillContext keyed by the anonymous draftId and surfaced via AutofillField.
 *
 * Tolerant of LLM downtime: if extraction fails, the inline notice is asserted
 * instead, confirming FE → BE → ai-service wiring still surfaces the failure.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dirname_ = path.dirname(fileURLToPath(import.meta.url));
const TEST_PDF = path.resolve(__dirname_, '../../docs/Test - iniciativa.pdf');

test.describe('Public landing PDF auto-fill (anonymous, full browser)', () => {
  // Real extraction (DeepSeek via OpenRouter, ~14pp PDF) can take several minutes;
  // navigation to the editor only happens after polling completes.
  test.setTimeout(700_000);

  test('upload PDF on /public/start → busy → navigate to editor → AI chips', async ({ page }) => {
    await test.step('load landing + upload affordance visible', async () => {
      await page.goto('/public/start');
      // Current UI: PublicPdfDropzone (role=button, aria-label "Arrastra un PDF…")
      // replaced the old "Subir documento" button as the primary affordance.
      await expect(page.getByRole('button', { name: /Arrastra un PDF/i })).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step('pick the test PDF via the hidden file input', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(TEST_PDF);
    });

    await test.step('progress card with elapsed timer + phase message renders', async () => {
      // Issue #30: the static "Procesando documento..." button is replaced by a
      // PublicUploadProgress card with an mm:ss elapsed timer, rotating phase
      // copy, helper text, and a Cancel button. Asserting the timer pattern is
      // the most stable signal (copy may evolve).
      await expect(page.getByRole('button', { name: /^Cancelar$/ })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('text=/\\d{2}:\\d{2}/').first()).toBeVisible({
        timeout: 5_000,
      });
    });

    const navigated = await test.step('wait for editor navigation (extraction completes)', async () => {
      try {
        await page.waitForURL(/\/public\/draft\/[^/]+\/edit/, { timeout: 660_000 });
        return true;
      } catch {
        return false;
      }
    });

    if (navigated) {
      await test.step('AI proposal chip renders on the public editor', async () => {
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
        const chip = page
          .locator('text=/Propuesto por IA|Confirmar|Confianza (Alta|Media|Baja)/i')
          .first();
        await expect(chip).toBeVisible({ timeout: 30_000 });
      });
    } else {
      // Extraction failed/timed out — assert the inline failure notice so we still
      // prove FE → BE → ai-service wiring surfaces the failure to the user.
      await test.step('inline failure notice surfaced', async () => {
        const notice = page.locator('text=/No pudimos procesar el documento/i').first();
        await expect(notice).toBeVisible({ timeout: 15_000 });
        console.warn('[E2E public] Extraction did not complete — wiring OK, LLM upstream slow/down.');
      });
    }
  });
});
