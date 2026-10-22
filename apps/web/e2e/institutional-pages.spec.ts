import { expect, test } from '@playwright/test';

// Páginas institucionais: rotas diretas, links do rodapé, navegação contextual e
// preferências de cookie aplicadas de verdade (localStorage). Nada é gravado no banco.
const PAGES = [
  { path: '/termos', title: 'Termos de Uso' },
  { path: '/privacidade', title: 'Política de Privacidade' },
  { path: '/cookies', title: 'Preferências de Cookie' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-consent-set')) {
      localStorage.setItem('sst_user_cookie_consent', 'denied');
      sessionStorage.setItem('e2e-consent-set', '1');
    }
  });
});

for (const { path, title } of PAGES) {
  test(`${path}: acesso direto pela URL, sem transbordar no celular`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('rodapé leva às três páginas', async ({ page }) => {
  await page.goto('/');
  const legal = page.getByRole('navigation', { name: 'Documentos legais' });
  for (const [label, path, title] of [
    ['Termos de uso', '/termos', 'Termos de Uso'],
    ['Privacidade', '/privacidade', 'Política de Privacidade'],
    ['Preferências de cookie', '/cookies', 'Preferências de Cookie'],
  ]) {
    await legal.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }
});

test('navegação contextual: Termos → Privacidade → Cookies → Privacidade → Termos → Home', async ({ page }) => {
  const pager = () => page.getByRole('navigation', { name: 'Navegação entre documentos' });
  await page.goto('/termos');
  await expect(pager().getByRole('link', { name: /Página anterior/ })).toHaveCount(0);
  await pager().getByRole('link', { name: /Próxima página/ }).click();
  await expect(page).toHaveURL(/\/privacidade$/);
  await pager().getByRole('link', { name: /Próxima página/ }).click();
  await expect(page).toHaveURL(/\/cookies$/);
  await expect(pager().getByRole('link', { name: /Próxima página/ })).toHaveCount(0);
  await pager().getByRole('link', { name: /Página anterior/ }).click();
  await expect(page).toHaveURL(/\/privacidade$/);
  await pager().getByRole('link', { name: /Página anterior/ }).click();
  await expect(page).toHaveURL(/\/termos$/);
  await pager().getByRole('link', { name: 'Voltar para a Home' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('preferências de cookie: a escolha é gravada e "apagar" traz o aviso de volta', async ({ page }) => {
  await page.goto('/cookies');
  await expect(page.getByText('Não permitido', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: /^Permitir/ }).check();
  await page.getByRole('button', { name: 'Salvar preferências' }).click();
  await expect(page.getByText('Permitido', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sst_user_cookie_consent'))).toBe('granted');

  await page.getByRole('button', { name: 'Apagar minha escolha' }).click();
  expect(await page.evaluate(() => localStorage.getItem('sst_user_cookie_consent'))).toBeNull();
  await expect(page.getByRole('region', { name: /cookies e privacidade/i })).toBeVisible();
});

test('teclado: o índice leva à seção e o foco é visível', async ({ page }) => {
  await page.goto('/privacidade');
  const toc = page.getByRole('navigation', { name: 'Nesta página' });
  const link = toc.getByRole('link', { name: '7. Seus direitos' });
  await link.focus();
  const outline = await link.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#direitos$/);
  await expect(page.getByRole('heading', { level: 2, name: '7. Seus direitos' })).toBeInViewport();
});

test('menu "LGPD e privacidade" abre os Termos de Uso (entrada dos documentos)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'LGPD e privacidade' }).click();
  await expect(page).toHaveURL(/\/termos$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Termos de Uso' })).toBeVisible();
});

for (const width of [1366, 820, 360]) {
  test(`navegação do fim da página em coluna centralizada (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/privacidade');
    const nav = page.getByRole('navigation', { name: 'Navegação entre documentos' });
    await nav.scrollIntoViewIfNeeded();
    const boxes = await nav.getByRole('link').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { name: el.getAttribute('aria-label') ?? el.textContent, top: r.top, center: r.left + r.width / 2 };
      })
    );
    expect(boxes.map((b) => b.name?.replace(/\s+/g, ' ').trim())).toEqual([
      'Página anterior Termos de Uso',
      'Voltar para a Home',
      'Próxima página Preferências de Cookie',
    ]);
    // Uma por linha, de cima para baixo, todas no mesmo eixo central.
    expect(boxes[0].top).toBeLessThan(boxes[1].top);
    expect(boxes[1].top).toBeLessThan(boxes[2].top);
    for (const b of boxes) expect(Math.abs(b.center - boxes[1].center)).toBeLessThan(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('Sobre: acesso pelo menu, âncora interna e sem transbordar em 360/820/1366', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Sobre o Projeto' }).click();
  await expect(page).toHaveURL(/\/sobre$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Base SST' })).toBeVisible();
  await page.getByRole('link', { name: 'Como o conteúdo é mantido' }).first().click();
  await expect(page.getByRole('heading', { level: 2, name: 'Como o conteúdo é mantido' })).toBeInViewport();
  for (const width of [360, 820, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
});
