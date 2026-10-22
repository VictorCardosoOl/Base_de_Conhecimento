import { test, expect } from '@playwright/test';

test.describe('Testes de Regressão Visual - Layout & Tipografia', () => {
  test('Snapshot Visual da Home Page em Resolução Desktop (1280x720)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot da seção Hero e Header
    const headerSection = page.locator('header').first();
    await expect(headerSection).toBeVisible();
    await expect(page).toHaveScreenshot('home-desktop-layout.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});
