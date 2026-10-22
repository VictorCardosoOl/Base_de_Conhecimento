import { test, expect, type Page } from '@playwright/test';
import { fillStable } from './support';

/**
 * Esqueci a senha, nova senha e confirmação de email, ponta a ponta no navegador.
 * As rotas do AuthService que gravariam algo são simuladas (page.route): nenhum token,
 * senha ou conta é criado no banco local. As regras do servidor estão nos testes do
 * AuthService (tests/test_password_reset.py e tests/test_email_verification.py).
 */

const SLOW = { timeout: 15_000 };
const TOKEN = 'T'.repeat(43);

async function hydrated(page: Page) {
  await expect(page.getByTestId('account-menu')).toHaveAttribute(
    'data-session',
    'ready',
    SLOW
  );
}

test('login → "Esqueceu a senha?" → resposta neutra', async ({ page }) => {
  let sent: unknown = null;
  await page.route('**/auth/password/forgot', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 202, json: { message: 'ok' } });
  });

  await page.goto('/login?next=%2Fminha-lista');
  await hydrated(page);
  await page.getByRole('link', { name: 'Esqueceu a senha?' }).click();
  await expect(page).toHaveURL(/\/esqueci-senha\?next=%2Fminha-lista$/);
  await expect(
    page.getByRole('heading', { name: 'Esqueceu a senha?' })
  ).toBeVisible();

  await fillStable(page, [[page.getByLabel('Email', { exact: true }), 'pessoa@exemplo.com.br']]);
  await page.getByRole('button', { name: 'Enviar link' }).click();

  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Se houver uma conta com este email' })
  ).toBeVisible(SLOW);
  expect(sent).toEqual({ email: 'pessoa@exemplo.com.br' });
  await page.getByRole('link', { name: 'Voltar para o login' }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fminha-lista$/);
});

test('email inválido é barrado antes do envio', async ({ page }) => {
  let calls = 0;
  await page.route('**/auth/password/forgot', async (route) => {
    calls += 1;
    await route.fulfill({ status: 202, json: { message: 'ok' } });
  });
  await page.goto('/esqueci-senha');
  await hydrated(page);
  await fillStable(page, [[page.getByLabel('Email', { exact: true }), 'sem-arroba']]);
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'email válido' })
  ).toBeVisible();
  expect(calls).toBe(0);
});

test('link do email → nova senha → login com aviso', async ({ page }) => {
  let sent: { token?: string; new_password?: string } | null = null;
  await page.route('**/auth/password/reset', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 204 });
  });

  await page.goto(`/redefinir-senha#token=${TOKEN}`);
  await hydrated(page);
  // O token sai da barra de endereço assim que a página o lê.
  await expect(page).toHaveURL(/\/redefinir-senha$/);

  await fillStable(page, [
    [page.getByLabel('Nova senha', { exact: true }), 'curta'],
    [page.getByLabel('Confirme a nova senha'), 'curta'],
  ]);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'entre 12 e 256' })
  ).toBeVisible();

  await fillStable(page, [
    [page.getByLabel('Nova senha', { exact: true }), 'uma-senha-nova-e-longa'],
    [page.getByLabel('Confirme a nova senha'), 'uma-senha-nova-e-longa'],
  ]);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();

  await expect(page).toHaveURL(/\/login\?aviso=senha-redefinida$/, SLOW);
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Senha redefinida. Entre com a nova senha.' })
  ).toBeVisible(SLOW);
  expect(sent).toEqual({
    token: TOKEN,
    new_password: 'uma-senha-nova-e-longa',
  });
});

test('link usado ou vencido: oferece um novo', async ({ page }) => {
  await page.route('**/auth/password/reset', (route) =>
    route.fulfill({
      status: 400,
      json: { error: { code: 'INVALID_TOKEN', message: 'x' } },
    })
  );
  await page.goto(`/redefinir-senha#token=${TOKEN}`);
  await hydrated(page);
  await fillStable(page, [
    [page.getByLabel('Nova senha', { exact: true }), 'uma-senha-nova-e-longa'],
    [page.getByLabel('Confirme a nova senha'), 'uma-senha-nova-e-longa'],
  ]);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'já foi usado ou expirou' })
  ).toBeVisible(SLOW);
  await page.getByRole('link', { name: 'Pedir um novo link' }).click();
  await expect(page).toHaveURL(/\/esqueci-senha$/);
});

test('página aberta sem o link: orienta a usar o email', async ({ page }) => {
  await page.goto('/redefinir-senha');
  await expect(
    page.getByRole('alert').filter({ hasText: 'link enviado ao seu email' })
  ).toBeVisible(SLOW);
});

test('confirmação de email pelo link', async ({ page }) => {
  let sent: unknown = null;
  await page.route('**/auth/email/verify', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 204 });
  });
  await page.goto(`/verificar-email#token=${TOKEN}`);
  await expect(
    page.getByRole('status').filter({ hasText: 'Email confirmado' })
  ).toBeVisible(SLOW);
  await expect(page).toHaveURL(/\/verificar-email$/);
  expect(sent).toEqual({ token: TOKEN });
});
