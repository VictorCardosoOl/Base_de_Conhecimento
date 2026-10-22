import { expect, test, type Page } from '@playwright/test';

// Fluxos de avaliação, sugestão de correção e comentários com a rede simulada
// (page.route): nada é gravado no banco local.
const ARTICLE = 'pgr';

async function asSignedIn(page: Page) {
  await page.addInitScript(() => localStorage.setItem('sst_user_cookie_consent', 'denied'));
  await page.route('**/api/session', (route) =>
    route.fulfill({
      json: { authenticated: true, email: 'ana@teste.local', username: 'ana', displayName: 'Ana', role: 'user', mustChangePassword: false },
    })
  );
}

const summary = (rating: number | null, count = 0) => ({
  article_id: ARTICLE,
  rating: { average: rating, count, distribution: rating ? [0, 0, 0, count, 0] : [0, 0, 0, 0, 0] },
  my_rating: rating ? 4 : null,
  comment_count: 0,
});

test('avaliar, sugerir correção e comentar num artigo', async ({ page }) => {
  await asSignedIn(page);
  const posted: Record<string, unknown> = {};
  await page.route(`**/content/articles/${ARTICLE}/summary`, (route) => route.fulfill({ json: summary(null) }));
  await page.route(`**/content/articles/${ARTICLE}/rating`, async (route) => {
    posted.rating = route.request().postDataJSON();
    await route.fulfill({ json: summary(4, 1) });
  });
  await page.route(`**/content/articles/${ARTICLE}/corrections`, async (route) => {
    posted.correction = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { id: 'k1', status: 'open' } });
  });
  await page.route(`**/content/articles/${ARTICLE}/comments`, async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { items: [], total: 0 } });
    posted.comment = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        id: 'c1', article_id: ARTICLE, parent_id: null, body: 'Conteúdo muito claro.',
        author: { username: 'ana', display_name: 'Ana', role: 'user' },
        created_at: new Date().toISOString(), edited_at: null, deleted: false, can_edit: true, can_delete: true, replies: [],
      },
    });
  });

  await page.goto(`/artigo/${ARTICLE}`);
  // Avaliação e comentários montam perto do fim da leitura (ou quando a página fica ociosa).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const feedback = page.getByRole('region', { name: 'Avalie e contribua' });
  await expect(feedback).toBeVisible();

  await feedback.getByText('Escolha de 1 a 5 estrelas.').waitFor();
  await feedback.locator('label').filter({ has: page.getByRole('radio', { name: '4 de 5 — Ajudou' }) }).click();
  await expect(feedback.getByText('Média 4,0 de 5, com 1 avaliação.')).toBeAttached();
  expect(posted.rating).toEqual({ value: 4 });

  await feedback.getByRole('button', { name: 'Sugerir correção' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sugerir correção' });
  await dialog.getByLabel('O que precisa ser corrigido? (obrigatório)').fill('A NR-01 foi atualizada em 2025.');
  await dialog.getByRole('button', { name: 'Enviar sugestão' }).click();
  await expect(page.getByRole('dialog', { name: 'Sugestão enviada' })).toBeVisible();
  expect(posted.correction).toMatchObject({ kind: 'erro', description: 'A NR-01 foi atualizada em 2025.' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const comments = page.getByRole('region', { name: /Comentários/ });
  await comments.getByLabel('Seu comentário').fill('Conteúdo muito claro.');
  await comments.getByRole('button', { name: 'Publicar' }).click();
  await expect(comments.getByRole('article', { name: 'Comentário de Ana' })).toBeVisible();
  expect(posted.comment).toEqual({ body: 'Conteúdo muito claro.' });
});

test('visitante: leitura pública e convites para entrar', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sst_user_cookie_consent', 'denied'));
  await page.goto(`/artigo/${ARTICLE}`);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('link', { name: 'Entrar para avaliar' })).toHaveAttribute('href', `/login?next=%2Fartigo%2F${ARTICLE}`);
  await expect(page.getByRole('link', { name: 'Entrar para comentar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar para sugerir correção' })).toBeVisible();
  await expect(page.getByText(/Sugerir evolução/i)).toHaveCount(0);
});
