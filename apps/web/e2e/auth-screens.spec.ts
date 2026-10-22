import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Telas de acesso: responsividade (a imagem some no celular, sem rolagem lateral) e
 * acessibilidade (axe) das telas novas. Só leitura: nenhuma rota que grava é chamada.
 */

const SLOW = { timeout: 15_000 };

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/oauth/providers', (route) =>
    route.fulfill({
      json: {
        providers: [
          { id: 'google', name: 'Google' },
          { id: 'github', name: 'GitHub' },
        ],
      },
    })
  );
  await page.route('**/auth/oauth/pending', (route) =>
    route.fulfill({
      json: {
        provider: 'github',
        provider_name: 'GitHub',
        email: 'pessoa@exemplo.com.br',
        suggested_display_name: 'Pessoa',
        suggested_username: 'pessoa',
      },
    })
  );
});

for (const path of [
  '/login',
  '/cadastro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/cadastro/social',
]) {
  test(`${path}: imagem só em tela larga e sem rolagem lateral`, async ({
    page,
  }, testInfo) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(SLOW);
    const visual = page.getByTestId('auth-visual');
    if (testInfo.project.name === 'mobile-chrome') {
      await expect(visual).toBeHidden();
    } else {
      await expect(visual).toBeVisible();
    }
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

for (const path of [
  '/login',
  '/cadastro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/cadastro/social',
  '/termos',
  '/privacidade',
  '/cookies',
  '/sobre',
]) {
  test(`${path}: sem violações WCAG 2.1 AA (axe)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(SLOW);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1_000); // animações de entrada e transição de tema
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('etapa 2 do cadastro: perfil opcional e termos acessíveis', async ({
  page,
}) => {
  await page.goto('/cadastro');
  await expect(page.getByTestId('account-menu')).toHaveAttribute(
    'data-session',
    'ready',
    SLOW
  );
  await page.getByLabel('Email', { exact: true }).fill('pessoa@exemplo.com.br');
  await page.getByLabel('Senha', { exact: true }).fill('uma-senha-bem-longa');
  await page.getByLabel('Confirme a senha').fill('uma-senha-bem-longa');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();

  await expect(
    page.getByRole('group', { name: 'Perfil (opcional)' })
  ).toBeVisible(SLOW);
  const terms = page.getByRole('checkbox', {
    name: /Li e aceito os Termos de Uso/,
  });
  await expect(terms).not.toBeChecked();
  await expect(
    page.getByRole('link', { name: /Termos de Uso/ })
  ).toHaveAttribute('target', '_blank');
  // O espaço aciona o checkbox pelo teclado.
  await terms.focus();
  await page.keyboard.press('Space');
  await expect(terms).toBeChecked();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
