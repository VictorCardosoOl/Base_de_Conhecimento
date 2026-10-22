import { test, expect, type Page } from '@playwright/test';
import { fillStable } from './support';

/**
 * Cadastro público e pedido de acesso de editor, ponta a ponta (Next + AuthService + banco).
 * Requer o AuthService com PUBLIC_REGISTRATION_ENABLED=true e a conta de editor de teste
 * (E2E_EDITOR_EMAIL / E2E_EDITOR_PASSWORD, criada por seed-dev-users).
 * Cria uma conta `cadastro-<n>@exemplo.com.br`, apagada ao fim da execução pelo
 * global-teardown (comando delete-e2e-users do AuthService).
 */

const editor = { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD };
const SLOW = { timeout: 15_000 };

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Fluxo de sessão não depende do dispositivo');
  test.skip(!editor.email || !editor.password, 'Defina E2E_EDITOR_EMAIL e E2E_EDITOR_PASSWORD');
});

/**
 * Espera a hidratação: o botão de conta do menu só marca data-session="ready" depois
 * dela (e da consulta à sessão). Preencher antes disso deixaria o React zerar os campos.
 */
async function hydrated(page: Page) {
  await expect(page.getByTestId('account-menu')).toHaveAttribute('data-session', 'ready', SLOW);
}

/** Etapa 2 do cadastro: usuário (com a prévia de disponibilidade), nome e o aceite dos termos. */
async function fillIdentity(page: Page, username: string, displayName: string) {
  await fillStable(page, [
    [page.getByLabel('Usuário'), username],
    [page.getByLabel('Nome', { exact: true }), displayName],
  ]);
  await expect(page.getByTestId('username-status')).toHaveText('Disponível.', SLOW);
  await page.getByRole('checkbox', { name: /Li e aceito os Termos de Uso/ }).check();
}

async function login(page: Page, email: string, password: string) {
  await fillStable(page, [
    [page.getByLabel('Email'), email],
    [page.getByLabel('Senha', { exact: true }), password],
  ]);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('visitante se cadastra como leitor, pede acesso e um editor aprova', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `cadastro-${stamp}@exemplo.com.br`;
  const password = `senha-do-cadastro-${stamp}`;
  const username = `cadastro.${stamp}`;

  // ── Da área de conta do menu até o cadastro ──────────────────────────────
  await page.goto('/');
  await hydrated(page);
  const account = page.getByTestId('account-menu');
  await account.click();
  await page
    .locator(`[id="${await account.getAttribute('aria-controls')}"]`)
    .getByRole('link', { name: 'Criar conta' })
    .click(SLOW);
  await expect(page).toHaveURL(/\/cadastro\?next=%2Fconta$/);
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue('');
  await expect(page.getByRole('combobox')).toHaveCount(0); // não se escolhe papel

  await fillStable(page, [
    [page.getByLabel('Email'), email],
    [page.getByLabel('Senha', { exact: true }), password],
    [page.getByLabel('Confirme a senha'), password],
  ]);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();

  // ── Etapa 2: como quer ser chamado (usuário único e nome) ────────────────
  await expect(page.getByRole('heading', { name: 'Como você quer ser chamado?' })).toBeVisible();
  // Nome reservado: avisado na hora, sem consultar o AuthService.
  await page.getByLabel('Usuário').fill('ADMIN');
  await expect(page.getByTestId('username-status')).toHaveText('Este nome é reservado. Escolha outro.');
  // Sem o aceite dos termos, a conta não é criada.
  await fillStable(page, [
    [page.getByLabel('Usuário'), username],
    [page.getByLabel('Nome', { exact: true }), 'Pessoa do Cadastro'],
  ]);
  await expect(page.getByTestId('username-status')).toHaveText('Disponível.', SLOW);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Corrija os campos' })).toBeVisible();
  await expect(page).toHaveURL(/\/cadastro/);
  await fillIdentity(page, username, 'Pessoa do Cadastro');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

  // ── Já entra como leitor: sem painel ─────────────────────────────────────
  await expect(page).toHaveURL(/\/conta$/, SLOW);
  await expect(page.locator('main').getByText('Leitor')).toBeVisible();
  await expect(page.locator('main').getByText('Pessoa do Cadastro')).toBeVisible();
  await expect(page.locator('main').getByText(username, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Painel administrativo' })).toHaveCount(0);
  await page.goto('/admin');
  await expect(page.getByText('Sua conta não tem permissão')).toBeVisible(SLOW);

  // ── Pede acesso de editor (não muda nada por si só) ──────────────────────
  await page.goto('/conta');
  await hydrated(page);
  await page.getByRole('button', { name: 'Solicitar acesso de editor' }).click(SLOW);
  await expect(page.getByRole('status').filter({ hasText: 'Pedido enviado' })).toBeVisible(SLOW);
  await page.reload();
  await expect(page.getByText(/Pedido enviado/)).toBeVisible(SLOW);
  await expect(page.getByRole('button', { name: 'Solicitar acesso de editor' })).toHaveCount(0);

  // ── Um editor aprova em /admin/solicitacoes ──────────────────────────────
  const editorContext = await browser.newContext();
  const decider = await editorContext.newPage();
  await decider.goto('/admin/solicitacoes');
  await login(decider, editor.email!, editor.password!);
  await expect(decider.getByRole('heading', { name: 'Solicitações de acesso' })).toBeVisible(SLOW);
  await decider.getByRole('button', { name: `Aprovar ${email} como editor` }).click();
  await expect(decider.getByRole('status').filter({ hasText: 'agora é editor' })).toBeVisible(SLOW);
  await expect(decider.getByRole('button', { name: `Aprovar ${email} como editor` })).toHaveCount(0, SLOW);
  // O editor não gerencia usuários.
  await decider.goto('/admin/usuarios');
  await expect(decider.getByText('Sua conta não tem permissão')).toBeVisible(SLOW);
  await editorContext.close();

  // ── A sessão antiga caiu; ao entrar de novo, é editor ────────────────────
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/, SLOW);
  await login(page, email, password);
  await expect(page).toHaveURL(/\/admin$/, SLOW);
  await expect(page.getByRole('heading', { name: /governança do conteúdo/i })).toBeVisible();

  // ── Email já cadastrado: mensagem própria ────────────────────────────────
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  await visitor.goto('/cadastro');
  await hydrated(visitor);
  await fillStable(visitor, [
    [visitor.getByLabel('Email'), email],
    [visitor.getByLabel('Senha', { exact: true }), password],
    [visitor.getByLabel('Confirme a senha'), password],
  ]);
  await visitor.getByRole('button', { name: 'Continuar', exact: true }).click();
  // Usuário que já existe (o criado acima, em outra caixa): avisado em tempo real.
  await visitor.getByLabel('Usuário').fill(username.toUpperCase());
  await expect(visitor.getByTestId('username-status')).toHaveText(/já está em uso/, SLOW);
  await fillIdentity(visitor, `outro.${stamp}`, 'Outra Pessoa');
  await visitor.getByRole('button', { name: 'Criar conta', exact: true }).click();
  // O email é da etapa 1: volta para ela, com a mensagem própria.
  await expect(visitor.getByRole('alert').filter({ hasText: /\S/ })).toContainText('Já existe uma conta', SLOW);
  await expect(visitor.getByLabel('Email')).toHaveValue(email);
  await visitorContext.close();
});
