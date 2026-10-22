import { test, expect, type Page } from '@playwright/test';

/** O botão de conta do menu só fica "ready" depois da hidratação e da consulta à sessão. */
async function waitHydration(page: Page) {
  await expect(page.getByTestId('account-menu')).toHaveAttribute(
    'data-session',
    'ready',
    { timeout: 15_000 }
  );
}

/** Abre o menu (painel com os módulos) pelo botão do cabeçalho. */
async function openMenu(page: Page) {
  const toggle = page.getByRole('button', { name: 'Abrir menu' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
  return page.locator('#nav-drawer');
}

test.describe('Jornadas Críticas E2E - Base de Conhecimento SST', () => {
  test('Fluxo 1: Home, busca no cabeçalho e leitura de artigo', async ({
    page,
  }) => {
    // 1. Acesso à página inicial
    await page.goto('/');
    await waitHydration(page);
    await expect(page).toHaveTitle(/Base de Conhecimento/i);

    // 2. Busca no cabeçalho: a lupa expande o campo, já com o foco nele
    const lupa = page.getByRole('button', { name: 'Pesquisar artigos' });
    await expect(lupa).toBeVisible();
    await lupa.click();
    const campo = page.getByRole('combobox', { name: 'Pesquisar artigos' });
    await expect(campo).toBeFocused();

    // 3. Resultados imediatos enquanto digita
    await campo.fill('atendimento');
    const resultados = page.getByRole('listbox', { name: 'Artigos encontrados' });
    await expect(resultados.getByRole('option').first()).toBeVisible();

    // 4. Setas + Enter abrem o artigo; Esc recolhe a busca
    await campo.press('ArrowDown');
    await campo.press('ArrowUp');
    await campo.press('Enter');
    await expect(page).toHaveURL(/artigo/);
  });

  test('Busca no cabeçalho: Esc e "×" recolhem o campo', async ({ page }) => {
    await page.goto('/');
    await waitHydration(page);
    await page.getByRole('button', { name: 'Pesquisar artigos' }).click();
    const campo = page.getByRole('combobox', { name: 'Pesquisar artigos' });
    await campo.fill('esocial');
    await campo.press('Escape'); // 1º Esc limpa o termo
    await expect(campo).toHaveValue('');
    await campo.press('Escape'); // 2º Esc recolhe e devolve o foco à lupa
    const lupa = page.getByRole('button', { name: 'Pesquisar artigos' });
    await expect(lupa).toBeFocused();
    await lupa.click();
    await page.getByRole('button', { name: 'Fechar pesquisa' }).click();
    await expect(page.getByRole('combobox', { name: 'Pesquisar artigos' })).toHaveCount(0);
  });

  test('Fluxo 2: Navegação Lateral (Sidebar) e Filtros de Módulo', async ({
    page,
  }) => {
    await page.goto('/');
    await waitHydration(page);
    const panel = await openMenu(page);

    const esocial = panel.getByRole('button', { name: 'Filtrar por módulo eSocial' });
    await expect(esocial).toBeVisible();
    await esocial.click();

    // A URL recebe o filtro e o módulo passa a ser o item atual do menu.
    await expect(page).toHaveURL(/category=eSocial/);
    await openMenu(page);
    await expect(esocial).toHaveAttribute('aria-current', 'page');
  });

  test('Fluxo 3: Fila de Leitura (QueuePage) e Adição/Remoção de Artigos', async ({
    page,
  }) => {
    await page.goto('/');
    await waitHydration(page);

    // Salva o primeiro artigo (o botão é visível também no toque e no foco do teclado).
    const save = page
      .getByRole('button', { name: /^Salvar ".+" na lista de leitura$/ })
      .first();
    await expect(save).toBeVisible();
    const title = (await save.getAttribute('aria-label'))!.match(
      /^Salvar "(.+)" na lista de leitura$/
    )![1];
    await save.click();
    await expect(
      page.getByRole('button', {
        name: `Remover "${title}" da lista de leitura`,
      })
    ).toHaveAttribute('aria-pressed', 'true');

    // O contador "Minha Lista" do cabeçalho atualiza na hora, sem recarregar.
    // O cabeçalho some ao descer a página: volta ao topo antes de usar o atalho.
    await page.evaluate(() => window.scrollTo(0, 0));
    const queueNav = page.getByRole('link', { name: 'Minha Lista (1 item salvo)' });
    await expect(queueNav).toBeVisible();
    await queueNav.click();

    await expect(page).toHaveURL(/minha-lista/);
    // A aba de salvos abre por padrão.
    await expect(page.getByRole('tab', { name: /Salvos\s*1/ })).toHaveAttribute('aria-selected', 'true');
    // Na página (o menu lateral, fechado, também lista os artigos de cada módulo).
    await expect(page.locator('main').getByText(title).first()).toBeVisible();
  });

  test('Fluxo 4: Autenticação Restrita (LoginPage) e Proteção de Rotas', async ({
    page,
  }) => {
    // Requer o AuthService rodando e uma conta admin de teste (nada embutido no código).
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(
      !email || !password,
      'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD'
    );

    // Tentativa de acesso direto à rota administrativa
    await page.goto('/admin');

    // Deve redirecionar automaticamente para /login, preservando o destino
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();

    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Senha').fill(password!);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    // Valida acesso liberado ao painel administrativo
    // /admin/ sozinho também casaria com /login?next=%2Fadmin
    // Login + navegação completa + JWKS e /auth/me no servidor: folga para CI/carga.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /governança do conteúdo/i })
    ).toBeVisible();
  });
});
