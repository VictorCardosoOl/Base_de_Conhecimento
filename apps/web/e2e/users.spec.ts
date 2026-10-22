import { test, expect, type Page } from '@playwright/test';
import { fillStable } from './support';

/**
 * Gestão de usuários ponta a ponta (Next + AuthService + PostgreSQL).
 * Requer E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD. Cria uma conta `e2e-<n>@exemplo.com.br`, apagada
 * ao fim da execução pelo global-teardown (comando delete-e2e-users do AuthService).
 *
 * Um único teste encadeado: o limite do AuthService é de 5 logins/min por email+IP,
 * então o admin entra uma vez e a conta nova faz no máximo 4 tentativas.
 */

const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const SLOW = { timeout: 15_000 }; // login + navegação completa + /auth/me no servidor

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Fluxo de sessão não depende do dispositivo');
  test.skip(!admin.email || !admin.password, 'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD');
});

async function login(page: Page, email: string, password: string) {
  await fillStable(page, [
    [page.getByLabel('Email'), email],
    [page.getByLabel('Senha', { exact: true }), password],
  ]);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

async function readTemporaryPassword(page: Page, title: string): Promise<string> {
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible(SLOW);
  // Oculta por padrão.
  await expect(dialog.getByTestId('temporary-password')).toHaveText('••••-••••-••••-••••');
  await dialog.getByRole('button', { name: 'Mostrar senha' }).click();
  const password = (await dialog.getByTestId('temporary-password').textContent())!.trim();
  expect(password).toMatch(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);

  // Nunca no storage do navegador; fora da página depois de fechar.
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toContain(password);
  await dialog.getByRole('button', { name: 'Concluído' }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.content()).not.toContain(password);
  return password;
}

const row = (page: Page, email: string) => page.getByRole('row').filter({ hasText: email });

/**
 * Espera a hidratação: o botão de conta do menu só marca data-session="ready" depois
 * dela (e da consulta à sessão). Preencher antes disso deixaria o React zerar os campos.
 */
async function hydrated(page: Page) {
  await expect(page.getByTestId('account-menu')).toHaveAttribute('data-session', 'ready', SLOW);
}

test('ciclo de vida de uma conta criada pelo admin', async ({ page: adminPage, browser }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `e2e-${stamp}@exemplo.com.br`;
  const finalPassword = `senha-escolhida-${stamp}`;
  const username = `e2e.${stamp}`;
  // Nome não é único: o carimbo evita achar contas de execuções anteriores na busca.
  const displayName = `Pessoa E2E ${stamp}`;

  // ── Admin entra e cria um editor ─────────────────────────────────────────
  await adminPage.goto('/admin/usuarios');
  await login(adminPage, admin.email!, admin.password!);
  await expect(adminPage).toHaveURL(/\/admin\/usuarios$/, SLOW);
  await expect(adminPage.getByRole('heading', { name: 'Usuários', level: 1 })).toBeVisible();
  // Só interage depois da hidratação; antes dela, o React zeraria o campo preenchido.
  await hydrated(adminPage);

  // Cadastro em modal, em duas etapas: email e papel; depois usuário e nome.
  await adminPage.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  const modal = adminPage.getByRole('dialog', { name: 'Cadastrar usuário' });
  await fillStable(adminPage, [[modal.getByLabel('Email'), email]]);
  await modal.getByLabel('Papel', { exact: true }).selectOption('editor');
  await modal.getByRole('button', { name: 'Continuar' }).click();
  const identity = adminPage.getByRole('dialog', { name: 'Como a pessoa será chamada?' });
  await fillStable(adminPage, [
    [identity.getByLabel('Usuário'), username],
    [identity.getByLabel('Nome', { exact: true }), displayName],
  ]);
  await expect(identity.getByTestId('username-status')).toHaveText('Disponível.', SLOW);
  await identity.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  const temporary = await readTemporaryPassword(adminPage, 'Usuário criado');
  await expect(row(adminPage, email)).toContainText('Troca de senha pendente', SLOW);
  await expect(row(adminPage, email)).toContainText(username);

  // A busca acha a conta pelo usuário, pelo nome e pelo email.
  const search = adminPage.getByRole('searchbox', { name: 'Buscar usuários' });
  for (const term of [username, displayName, email]) {
    await search.fill(term);
    await expect.poll(() => new URL(adminPage.url()).searchParams.get('q'), SLOW).toBe(term);
    await expect(row(adminPage, email)).toBeVisible(SLOW);
    await expect(adminPage.getByRole('row')).toHaveCount(2); // cabeçalho + a conta
  }
  await search.fill('');
  await expect(adminPage).toHaveURL(/\/admin\/usuarios$/, SLOW);
  // Recarregar a lista não traz a senha de volta.
  await adminPage.reload();
  await hydrated(adminPage);
  expect(await adminPage.content()).not.toContain(temporary);

  // ── Primeiro acesso: troca obrigatória, sem atalhos ──────────────────────
  const personContext = await browser.newContext();
  const person = await personContext.newPage();
  await person.goto('/admin');
  await login(person, email, temporary);
  await expect(person).toHaveURL(/\/conta\/senha\?next=%2Fadmin$/, SLOW);
  await expect(person.getByRole('heading', { name: 'Defina uma nova senha' })).toBeVisible();

  for (const [path, next] of [
    ['/admin/editor', '%2Fadmin%2Feditor'],
    ['/admin/usuarios', '%2Fadmin%2Fusuarios'],
    ['/conta', '%2Fconta'],
  ]) {
    await person.goto(path);
    await expect(person).toHaveURL(new RegExp(`/conta/senha\\?next=${next}$`), SLOW);
  }

  await person.goto('/conta/senha?next=%2Fadmin');
  await hydrated(person);
  await fillStable(person, [
    [person.getByLabel('Senha atual'), temporary],
    [person.getByLabel('Nova senha', { exact: true }), finalPassword],
    [person.getByLabel('Confirme a nova senha'), finalPassword],
  ]);
  await person.getByRole('button', { name: 'Salvar nova senha' }).click();
  // Se o formulário recusar, a mensagem aparece no erro do teste (diagnóstico).
  await expect(person.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(0);

  // ── Editor: painel e editor sim; usuários não ────────────────────────────
  await expect(person).toHaveURL(/\/admin$/, SLOW);
  await expect(person.getByRole('heading', { name: /governança do conteúdo/i })).toBeVisible();
  await expect(person.getByRole('link', { name: 'Minha conta' }).first()).toBeVisible();
  await expect(person.getByRole('link', { name: 'Usuários' })).toHaveCount(0);
  await person.goto('/admin/editor');
  await expect(person.getByRole('heading', { name: /rascunho em markdown/i })).toBeVisible(SLOW);
  await person.goto('/admin/usuarios');
  await expect(person.getByText('Sua conta não tem permissão')).toBeVisible(SLOW);

  // ── Admin rebaixa para user: sessões da pessoa caem; depois, 403 ─────────
  await adminPage.goto('/admin/usuarios');
  await hydrated(adminPage);
  await row(adminPage, email).getByLabel(`Papel de ${email}`).selectOption('user');
  await expect(adminPage.getByRole('status').filter({ hasText: 'sessões dessa pessoa foram encerradas' })).toBeVisible(SLOW);

  await person.goto('/admin');
  await expect(person).toHaveURL(/\/login\?next=%2Fadmin$/, SLOW);
  await login(person, email, finalPassword);
  await expect(person.getByText('Sua conta não tem permissão')).toBeVisible(SLOW);
  await person.goto('/conta');
  await expect(person.locator('main').getByText('Leitor')).toBeVisible(SLOW);

  // ── Desativada: perde o acesso na hora e não entra de novo ───────────────
  await row(adminPage, email).getByRole('button', { name: `Desativar ${email}` }).click();
  await row(adminPage, email).getByRole('button', { name: 'Confirmar' }).click();
  await expect(row(adminPage, email)).toContainText('Desativado', SLOW);

  await person.goto('/conta');
  await expect(person).toHaveURL(/\/login\?next=%2Fconta$/, SLOW);
  await login(person, email, finalPassword);
  await expect(person.getByRole('alert').filter({ hasText: /\S/ })).toHaveText('Email ou senha inválidos.', SLOW);

  // ── Reativada e com senha redefinida: troca obrigatória de novo ──────────
  await row(adminPage, email).getByRole('button', { name: `Reativar ${email}` }).click();
  await expect(row(adminPage, email)).toContainText('Ativo', SLOW);
  await row(adminPage, email).getByRole('button', { name: `Redefinir senha de ${email}` }).click();
  await row(adminPage, email).getByRole('button', { name: 'Confirmar' }).click();
  const reset = await readTemporaryPassword(adminPage, 'Senha redefinida');

  await person.goto('/login?next=%2Fconta');
  await login(person, email, reset);
  await expect(person).toHaveURL(/\/conta\/senha\?next=%2Fconta$/, SLOW);

  // Admin não consegue mexer na própria conta pela gestão (achada pela busca).
  await adminPage.goto(`/admin/usuarios?${new URLSearchParams({ q: admin.email! })}`);
  await hydrated(adminPage);
  await expect(row(adminPage, admin.email!).getByLabel(`Papel de ${admin.email}`)).toBeDisabled();
  await personContext.close();
});
