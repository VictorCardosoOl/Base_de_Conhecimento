import { test, expect, type Page } from '@playwright/test';

/**
 * Login no mobile com o banner de cookies ainda pendente (primeira visita).
 * O banner não pode cobrir o formulário; o menu mobile precisa de nome acessível.
 */

const banner = (page: Page) => page.getByRole('region', { name: /cookies e privacidade/i });

/** O botão de conta do menu só fica "ready" depois da hidratação: antes, toques se perdem. */
async function hydrated(page: Page) {
  await expect(page.getByTestId('account-menu')).toHaveAttribute('data-session', 'ready', { timeout: 15_000 });
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Cenário de viewport mobile');
});

for (const path of ['/login', '/login?next=%2Fadmin']) {
  test(`${path}: banner visível não bloqueia o botão Entrar (toque)`, async ({ page }) => {
    await page.goto(path);
    await hydrated(page);
    await expect(banner(page)).toBeVisible();

    // O banner cabe na viewport (poll: a animação de entrada o desloca 16 px por um instante).
    const viewport = page.viewportSize()!;
    await expect
      .poll(async () => {
        const box = (await banner(page).boundingBox())!;
        return box.x >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height;
      })
      .toBe(true);

    // Entrar recebe o toque (falharia se o banner interceptasse o evento).
    const entrar = page.getByRole('button', { name: 'Entrar', exact: true });
    // E-mail único: o limite de 5 tentativas/min é por e-mail+IP.
    await page.getByLabel('Email').fill(`ninguem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.invalid`);
    await page.getByLabel('Senha').fill('senha-errada');
    await entrar.tap();
    // Folga: Argon2 no AuthService + npm run dev compilando sob demanda.
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveText('Email ou senha inválidos.', {
      timeout: 15_000,
    });
    await expect(banner(page)).toBeVisible();
  });
}

test('teclado: Tab até Entrar deixa o botão visível acima do banner', async ({ page }) => {
  await page.goto('/login?next=%2Fadmin');
  await hydrated(page);
  await expect(banner(page)).toBeVisible();

  await page.getByLabel('Email', { exact: true }).focus();
  await page.keyboard.press('Tab'); // senha
  await page.keyboard.press('Tab'); // "Esqueceu a senha?"
  await page.keyboard.press('Tab');
  const entrar = page.getByRole('button', { name: 'Entrar', exact: true });
  await expect(entrar).toBeFocused();

  await expect
    .poll(async () => {
      const button = (await entrar.boundingBox())!;
      const bannerBox = (await banner(page).boundingBox())!;
      return button.y + button.height <= bannerBox.y;
    })
    .toBe(true);
});

test('a escolha do banner continua persistida', async ({ page }) => {
  await page.goto('/login');
  await hydrated(page);
  await page.getByRole('button', { name: 'Recusar', exact: true }).tap();
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Senha')).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sst_user_cookie_consent'))).toBe('denied');
});

test('botão de menu tem nome acessível que alterna entre abrir e fechar', async ({ page }) => {
  await page.goto('/login');
  await hydrated(page);
  const toggle = page.locator('[aria-controls="nav-drawer"]');
  await expect(toggle).toHaveAccessibleName('Abrir menu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.tap();
  await expect(toggle).toHaveAccessibleName('Fechar menu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-drawer')).toBeInViewport();

  // Por teclado o mesmo botão fecha o menu.
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAccessibleName('Abrir menu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('conta visível no topo, sem abrir o menu', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const conta = page.getByRole('button', { name: 'Entrar ou criar conta' });
  await expect(conta).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  await conta.tap();
  const panel = page.locator(`[id="${await conta.getAttribute('aria-controls')}"]`);
  await panel.getByRole('link', { name: 'Entrar' }).tap();
  await expect(page).toHaveURL(/\/login\?next=%2Fconta$/);
});

test('menu e conta: Esc fecha e devolve o foco', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Recusar', exact: true }).tap().catch(() => undefined);

  // Menu de módulos: abre pelo botão; Esc fecha e o foco volta para ele.
  const toggle = page.locator('[aria-controls="nav-drawer"]');
  await toggle.tap();
  await expect(page.locator('#nav-drawer')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();

  // Conta: "Entrar" e "Criar conta"; Esc fecha e o foco volta ao botão.
  const conta = page.getByRole('button', { name: 'Entrar ou criar conta' });
  await conta.tap();
  const panel = page.locator(`[id="${await conta.getAttribute('aria-controls')}"]`);
  await expect(panel.getByRole('link', { name: 'Entrar' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Criar conta' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(conta).toHaveAttribute('aria-expanded', 'false');
  await expect(conta).toBeFocused();
});
