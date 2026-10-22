import { test, expect, type Page } from '@playwright/test';
import { fillStable } from './support';

/**
 * Login e cadastro social na interface. O provedor (Google/GitHub) e as rotas do
 * AuthService que gravariam algo são simulados: nenhuma conta é criada no banco local.
 * `state`, PKCE e a regra de vínculo estão cobertos em tests/test_oauth.py do AuthService.
 */

const SLOW = { timeout: 15_000 };
const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'github', name: 'GitHub' },
];

async function hydrated(page: Page) {
  await expect(page.getByTestId('account-menu')).toHaveAttribute(
    'data-session',
    'ready',
    SLOW
  );
}

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/oauth/providers', (route) =>
    route.fulfill({ json: { providers: PROVIDERS } })
  );
});

test('login: botões sociais em destaque, acima do formulário e separados por um divisor', async ({
  page,
}) => {
  await page.goto('/login?next=%2Fminha-lista');
  await hydrated(page);

  const google = page.getByRole('link', { name: 'Entrar com Google' });
  const github = page.getByRole('link', { name: 'Entrar com GitHub' });
  await expect(google).toBeVisible(SLOW);
  await expect(github).toBeVisible();
  await expect(google).toHaveAttribute(
    'href',
    '/auth/oauth/google/start?next=%2Fminha-lista'
  );
  await expect(
    page.getByRole('separator', { name: 'ou entre com email e senha' })
  ).toBeVisible();

  // Área de toque confortável e acima do formulário.
  const box = (await google.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  const emailBox = (await page.getByLabel('Email', { exact: true }).boundingBox())!;
  expect(box.y).toBeLessThan(emailBox.y);

  // Teclado: do Google para o GitHub e depois para o email.
  await google.focus();
  await page.keyboard.press('Tab');
  await expect(github).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
});

test('cadastro social: provedor → usuário, nome e termos → conta criada', async ({
  page,
}) => {
  let completed: Record<string, unknown> | null = null;
  // O AuthService redirecionaria ao Google e, na volta, a /cadastro/social.
  await page.route('**/auth/oauth/google/start**', (route) =>
    route.fulfill({ status: 303, headers: { location: '/cadastro/social' } })
  );
  await page.route('**/auth/oauth/pending', (route) =>
    route.fulfill({
      json: {
        provider: 'google',
        provider_name: 'Google',
        email: 'maria@exemplo.com.br',
        suggested_display_name: 'Maria Souza',
        suggested_username: 'maria.souza',
      },
    })
  );
  await page.route('**/auth/username-available**', (route) => {
    const username = new URL(route.request().url()).searchParams.get(
      'username'
    );
    return route.fulfill({ json: { username, available: true, reason: null } });
  });
  await page.route('**/auth/oauth/complete', async (route) => {
    completed = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        user: {
          id: 'x',
          email: 'maria@exemplo.com.br',
          username: 'maria.souza',
          display_name: 'Maria',
          role: 'user',
          must_change_password: false,
        },
        access_token_expires_at: new Date().toISOString(),
        next_path: '/minha-lista',
      },
    });
  });

  await page.goto('/cadastro');
  await hydrated(page);
  await expect(
    page.getByRole('separator', { name: 'ou cadastre-se com email' })
  ).toBeVisible(SLOW);
  await page.getByRole('link', { name: 'Cadastrar com Google' }).click();

  await expect(page).toHaveURL(/\/cadastro\/social$/, SLOW);
  await expect(
    page.getByRole('heading', { name: 'Concluir cadastro' })
  ).toBeVisible();
  await expect(page.getByTestId('social-email')).toHaveText(
    'maria@exemplo.com.br',
    SLOW
  );
  await expect(page.getByLabel('Usuário')).toHaveValue('maria.souza');
  await expect(page.getByTestId('username-status')).toHaveText(
    'Disponível.',
    SLOW
  );

  // Sem o aceite dos termos, nada é enviado.
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Corrija os campos' })
  ).toBeVisible();
  expect(completed).toBeNull();

  // Nome reservado: avisado na hora.
  await page.getByLabel('Usuário').fill('Suporte');
  await expect(page.getByTestId('username-status')).toHaveText(
    'Este nome é reservado. Escolha outro.'
  );
  await fillStable(page, [
    [page.getByLabel('Usuário'), 'maria.souza'],
    [page.getByLabel('Organização'), 'Clínica Exemplo'],
  ]);
  await page.getByLabel('Área de atuação').selectOption('saude_ocupacional');
  await page
    .getByRole('checkbox', { name: /Li e aceito os Termos de Uso/ })
    .check();
  await expect(page.getByTestId('username-status')).toHaveText(
    'Disponível.',
    SLOW
  );
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

  await expect(page).toHaveURL(/\/minha-lista$/, SLOW);
  expect(completed).toMatchObject({
    username: 'maria.souza',
    display_name: 'Maria Souza',
    accept_terms: true,
    terms_version: '2026-10-10',
    privacy_version: '2026-10-10',
    organization: 'Clínica Exemplo',
    professional_area: 'saude_ocupacional',
  });
});

test('cadastro social vencido: orienta a recomeçar', async ({ page }) => {
  await page.route('**/auth/oauth/pending', (route) =>
    route.fulfill({
      status: 400,
      json: { error: { code: 'INVALID_TOKEN', message: 'x' } },
    })
  );
  await page.goto('/cadastro/social');
  await expect(
    page.getByRole('alert').filter({ hasText: 'expirou ou já foi concluído' })
  ).toBeVisible(SLOW);
  await page.getByRole('link', { name: 'Voltar ao cadastro' }).click();
  await expect(page).toHaveURL(/\/cadastro$/);
});

test('retorno com erro do provedor: mensagem própria no login', async ({
  page,
}) => {
  await page.goto('/login?erro=oauth_link_requires_verification');
  await hydrated(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'ainda não foi confirmado' })
  ).toBeVisible(SLOW);
});

test('sem provedores configurados, a tela fica só com email e senha', async ({
  page,
}) => {
  await page.unroute('**/auth/oauth/providers');
  await page.route('**/auth/oauth/providers', (route) =>
    route.fulfill({ json: { providers: [] } })
  );
  await page.goto('/login');
  await hydrated(page);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible(SLOW);
  await expect(page.getByRole('separator')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Entrar com/ })).toHaveCount(0);
});
