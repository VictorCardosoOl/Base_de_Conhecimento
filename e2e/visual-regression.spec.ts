import { test, expect } from '@playwright/test';

test.describe('Testes de Regressão Visual - Layout & Tipografia', () => {
  
  test('Snapshot Visual da Home Page em Resolução Desktop (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot da seção Hero e Header
    const headerSection = page.locator('header').first();
    await expect(headerSection).toBeVisible();
    await expect(page).toHaveScreenshot('home-desktop-layout.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled'
    });
  });

  test('Snapshot Visual da Seção Introdução Artística (Fluid Typography)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Resolução Full HD / Cinema
    await page.goto('/?category=Introdução');
    await page.waitForLoadState('networkidle');

    const heroSection = page.locator('h1').filter({ hasText: /base de/i });
    await expect(heroSection).toBeVisible();
    await expect(page).toHaveScreenshot('introducao-cinema-layout.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled'
    });
  });
});
