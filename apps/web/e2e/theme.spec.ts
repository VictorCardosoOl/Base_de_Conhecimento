import { test, expect } from '@playwright/test';

/**
 * O tema é aplicado por um script inline antes da hidratação (app/layout.tsx), senão a
 * página "pisca" claro → escuro. O script precisa trazer a chave de verdade: se a
 * constante vier de um módulo 'use client', o servidor recebe uma referência de cliente e
 * o script quebra (regressão já ocorrida).
 */
test('script de tema pré-hidratação usa a chave real e aplica o tema salvo', async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Não depende do dispositivo');

  const html = await (await request.get('/')).text();
  expect(html).toContain("localStorage.getItem('isDarkMode')");

  // No navegador: tema escuro aplicado e nenhum erro de script (o script quebrado gerava
  // "SyntaxError ... appendChild").
  await page.addInitScript(() => localStorage.setItem('isDarkMode', 'true'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  expect(errors).toEqual([]);
});

test('cabeçalho: botão de tema alterna claro/escuro e lembra a escolha', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('theme-test')) {
      localStorage.setItem('isDarkMode', 'false');
      sessionStorage.setItem('theme-test', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('account-menu')).toHaveAttribute('data-session', 'ready', {
    timeout: 15_000,
  });
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/\bdark\b/);

  const escurecer = page.getByRole('button', { name: 'Ativar modo escuro' });
  await expect(escurecer).toBeInViewport(); // no cabeçalho, sem abrir o menu
  await escurecer.click();
  await expect(html).toHaveClass(/\bdark\b/);
  const clarear = page.getByRole('button', { name: 'Ativar modo claro' });
  await expect(clarear).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: 'Alertas' })).toBeInViewport();
});
