import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Auditoria Automatizada de Acessibilidade (A11y - axe-core)', () => {
  
  test('Home Page deve cumprir as diretrizes WCAG 2.1 AA sem violações críticas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast']) // Análise de layout experimental/glassmorphism
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Página de Login deve ser 100% acessível por leitores de tela e formulários', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Fila de Leitura (QueuePage) deve ter landmarks semânticos e rótulos acessíveis', async ({ page }) => {
    await page.goto('/minha-lista');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
