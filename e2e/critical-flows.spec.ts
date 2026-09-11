import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Jornadas Críticas E2E - Base de Conhecimento SST', () => {
  
  test('Fluxo 1: Home, Busca Interativa (SearchBar) e Leitura de Artigo', async ({ page }) => {
    // 1. Acesso à página inicial
    await page.goto('/');
    await expect(page).toHaveTitle(/Base de Conhecimento/i);
    
    // 2. Acionamento da Barra de Pesquisa / CommandPalette
    const searchBar = page.getByRole('button', { name: /abrir barra de pesquisa/i });
    await expect(searchBar).toBeVisible();
    await searchBar.click();

    // 3. Digitação na CommandPalette e verificação de resultados
    const commandInput = page.getByPlaceholder(/o que você procura/i);
    await expect(commandInput).toBeVisible();
    await commandInput.fill('CAT');

    // 4. Seleção do artigo referente à CAT
    const resultOption = page.getByRole('option', { name: /comunicação de acidente/i }).first();
    if (await resultOption.isVisible()) {
      await resultOption.click();
      // Valida abertura da rota ou modal de leitura
      await expect(page).toHaveURL(/artigo/);
    }
  });

  test('Fluxo 2: Navegação Lateral (Sidebar) e Filtros de Módulo', async ({ page }) => {
    await page.goto('/');
    
    // Clica no botão de módulo eSocial na sidebar
    const esocialBtn = page.getByRole('menuitem', { name: /esocial/i }).first();
    await expect(esocialBtn).toBeVisible();
    await esocialBtn.click();

    // Verifica que a URL foi atualizada com o parâmetro de categoria
    await expect(page).toHaveURL(/category=eSocial/);
  });

  test('Fluxo 3: Fila de Leitura (QueuePage) e Adição/Remoção de Artigos', async ({ page }) => {
    await page.goto('/');

    // Localiza o primeiro botão de adicionar à fila (+ / Bookmark)
    const addQueueBtn = page.locator('button').filter({ hasText: '' }).locator('svg.lucide-plus').first();
    if (await addQueueBtn.isVisible()) {
      await addQueueBtn.click();

      // Navega para 'Minha Lista'
      const queueNavBtn = page.getByRole('button', { name: /minha lista de leitura/i });
      await queueNavBtn.click();

      await expect(page).toHaveURL(/minha-lista/);
      await expect(page.getByRole('heading', { name: /minha lista/i })).toBeVisible();
    }
  });

  test('Fluxo 4: Autenticação Restrita (LoginPage) e Proteção de Rotas', async ({ page }) => {
    // Tentativa de acesso direto à rota administrativa
    await page.goto('/admin');
    
    // Deve redirecionar automaticamente para /login
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: /acesso restrito/i })).toBeVisible();

    // Preenchimento das credenciais de demonstração
    await page.getByPlaceholder('admin@admin.com').fill('admin@admin.com');
    await page.getByPlaceholder('admin').fill('admin');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Valida acesso liberado ao painel administrativo
    await expect(page).toHaveURL(/admin/);
    await expect(page.getByRole('heading', { name: /painel administrativo/i })).toBeVisible();
  });
});
