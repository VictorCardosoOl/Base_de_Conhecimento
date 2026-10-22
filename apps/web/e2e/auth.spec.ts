import { test, expect, type Page } from '@playwright/test';
import { fillStable } from './support';

/**
 * Autenticação ponta a ponta: Next (proxy /auth/*) + AuthService + PostgreSQL.
 *
 * Requer o AuthService rodando e contas de teste informadas por ambiente
 * (nada embutido no código):
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD  — papel admin
 *   E2E_USER_EMAIL  / E2E_USER_PASSWORD   — papel user
 *
 * O AuthService limita 5 tentativas de login por minuto por e-mail+IP (sucessos
 * contam). Por isso cada teste faz no máximo um login e a suíte roda só no projeto
 * chromium: o comportamento de sessão não depende do dispositivo.
 */

const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const user = { email: process.env.E2E_USER_EMAIL, password: process.env.E2E_USER_PASSWORD };
// Login + navegação completa + JWKS e /auth/me no servidor: folga para CI/carga.
const POST_LOGIN_TIMEOUT = 15_000;
const ACCESS_COOKIE = process.env.AUTH_ACCESS_COOKIE_NAME ?? /kb_at$/;

test.describe.configure({ mode: 'serial' });

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Sessão não depende do dispositivo');
});

async function loginWithForm(page: Page, email: string, password: string) {
  await fillStable(page, [
    [page.getByLabel('Email'), email],
    [page.getByLabel('Senha'), password],
  ]);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('sem sessão: /admin/editor leva ao login preservando o destino', async ({ page }) => {
  await page.goto('/admin/editor?id=e2e');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Feditor%3Fid%3De2e$/);
  // O formulário aparece depois da hidratação e da checagem de sessão (lenta sob carga).
  await expect(page.getByLabel('Senha')).toBeVisible({ timeout: POST_LOGIN_TIMEOUT });
});

test('credenciais inválidas: mensagem própria, senha limpa, continua no login', async ({ page }) => {
  await page.goto('/login?next=%2Fadmin');
  // E-mail único: o limite de 5 tentativas/min é por e-mail+IP.
  await loginWithForm(page, `ninguem-${Date.now()}@e2e.invalid`, 'senha-errada');
  // O Next também tem um role=alert (anunciador de rota); filtramos pelo texto.
  await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveText('Email ou senha inválidos.', {
    timeout: POST_LOGIN_TIMEOUT,
  });
  await expect(page.getByLabel('Senha')).toHaveValue('');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
});

test('admin: login, cookies inacessíveis ao JS, renovação silenciosa e logout', async ({ page, context }) => {
  test.skip(!admin.email || !admin.password, 'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD');

  await page.goto('/admin/editor?id=e2e');
  await loginWithForm(page, admin.email!, admin.password!);
  await expect(page).toHaveURL(/\/admin\/editor\?id=e2e$/, { timeout: POST_LOGIN_TIMEOUT });
  await expect(page.getByRole('heading', { name: /rascunho em markdown/i })).toBeVisible();

  // Tokens só em cookies HttpOnly: nada legível pelo JavaScript nem no storage.
  const exposed = await page.evaluate(() => ({
    cookie: document.cookie,
    storage: JSON.stringify({ ...localStorage, ...sessionStorage }),
  }));
  expect(exposed.cookie).not.toMatch(/kb_(at|rt)/);
  expect(exposed.storage).not.toMatch(/eyJ[\w-]+\.[\w-]+\./);

  // Access expirado/ausente com refresh válido: volta ao destino sem pedir senha.
  await context.clearCookies({ name: ACCESS_COOKIE });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: /governança do conteúdo/i })).toBeVisible();

  // Logout revoga a sessão no AuthService: o /admin volta a exigir login.
  // Clique único, depois que a página hidratou (o botão de conta do menu sinaliza).
  await expect(page.getByTestId('account-menu')).toHaveAttribute('data-session', 'ready', {
    timeout: POST_LOGIN_TIMEOUT,
  });
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: POST_LOGIN_TIMEOUT });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
  await expect(page.getByLabel('Senha')).toBeVisible();
});

test('user: 403 no /admin e troca de conta pela página de acesso negado', async ({ page }) => {
  test.skip(!user.email || !user.password, 'Defina E2E_USER_EMAIL e E2E_USER_PASSWORD');

  await page.goto('/admin');
  await loginWithForm(page, user.email!, user.password!);
  await expect(page).toHaveURL(/\/admin$/, { timeout: POST_LOGIN_TIMEOUT });
  await expect(page.getByRole('heading', { name: /acesso restrito/i })).toBeVisible();
  await expect(page.getByText('Sua conta não tem permissão')).toBeVisible();

  await page.getByRole('button', { name: 'Sair e entrar com outra conta' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
});

test('visitante acha "Entrar / Cadastrar" no menu, chega ao login vazio e depois à conta', async ({ page }) => {
  test.skip(!user.email || !user.password, 'Defina E2E_USER_EMAIL e E2E_USER_PASSWORD');

  await page.goto('/');
  // Área de conta do menu lateral: botão em destaque que abre "Entrar" e "Criar conta".
  const account = page.getByTestId('account-menu');
  await expect(account).toHaveAttribute('data-session', 'ready', { timeout: POST_LOGIN_TIMEOUT });
  await expect(account).toHaveAccessibleName('Entrar ou criar conta');
  await account.click();
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator(`[id="${await account.getAttribute('aria-controls')}"]`);
  await expect(panel.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro?next=%2Fconta');
  await panel.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fconta$/);

  // Tela de login sem dados pré-preenchidos.
  await expect(page.getByLabel('Email')).toHaveValue('', { timeout: POST_LOGIN_TIMEOUT });
  await expect(page.getByLabel('Senha')).toHaveValue('');
  await expect(page.getByRole('main').getByRole('link', { name: 'Criar conta' })).toBeVisible();

  await loginWithForm(page, user.email!, user.password!);
  await expect(page).toHaveURL(/\/conta$/, { timeout: POST_LOGIN_TIMEOUT });
  await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible();
  // Com sessão, o menu mostra a identificação e o papel; "Usuários" é só para admin.
  await expect(account).toHaveAccessibleName(`Conta de ${user.email} (Leitor)`, { timeout: POST_LOGIN_TIMEOUT });
  await account.click();
  await expect(panel.getByRole('button', { name: 'Sair' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Usuários' })).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'Entrar' })).toHaveCount(0);
});
