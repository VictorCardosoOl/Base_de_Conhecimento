import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@/features/articles/catalog', () => ({
  FAQ_DATA: [
    { id: 'esocial-s2220', question: 'Como enviar o S-2220?', answer: 'Resumo', category: 'eSocial', date: '15 Out 2024', tags: ['ASO'] },
  ],
}));

import { ToastProvider } from '@/components/ui/Toast';
import { SessionSummaryContext, type ClientSessionSummary } from '@/features/auth/use-session-summary';
import { ArticleInteractions } from '@/features/content/components/ArticleInteractions';
import { contentErrorMessage, countLinks } from '@/features/content/content-client';
import { validateComment } from '@/features/content/components/CommentComposer';

const ARTICLE = 'esocial-s2220';
const SIGNED_IN: ClientSessionSummary = {
  authenticated: true,
  email: 'ana@empresa.com',
  username: 'ana',
  displayName: 'Ana',
  role: 'user',
  mustChangePassword: false,
};

const summary = (overrides: Record<string, unknown> = {}) => ({
  article_id: ARTICLE,
  rating: { average: null, count: 0, distribution: [0, 0, 0, 0, 0] },
  my_rating: null,
  comment_count: 0,
  ...overrides,
});

const comment = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  article_id: ARTICLE,
  parent_id: null,
  body: 'Muito útil',
  author: { username: 'bia', display_name: 'Bia', role: 'editor' },
  created_at: '2026-10-10T10:00:00Z',
  edited_at: null,
  deleted: false,
  can_edit: false,
  can_delete: false,
  replies: [],
  ...overrides,
});

type Route = (url: string, init: RequestInit) => { status: number; body?: unknown } | undefined;

let routes: Route[];
let calls: Array<{ url: string; method: string; body: unknown }>;

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  routes = [];
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET';
      calls.push({ url: input, method, body: init.body ? JSON.parse(String(init.body)) : undefined });
      for (const route of routes) {
        const reply = route(input, init);
        if (reply) return json(reply.status, reply.body);
      }
      if (input.endsWith('/summary')) return json(200, summary());
      if (input.endsWith('/comments') && method === 'GET') return json(200, { items: [], total: 0 });
      return json(404, { error: { code: 'NOT_FOUND', message: 'x' } });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderInteractions(session: ClientSessionSummary | null = SIGNED_IN) {
  return render(
    <ToastProvider>
      <SessionSummaryContext.Provider value={session}>
        <ArticleInteractions articleId={ARTICLE} articleTitle="Como enviar o S-2220?" />
      </SessionSummaryContext.Provider>
    </ToastProvider>
  );
}

describe('regras do cliente', () => {
  it('valida comentários como o servidor', () => {
    expect(validateComment(' ')).toBe('Escreva um comentário.');
    expect(validateComment('a'.repeat(2001))).toContain('2000');
    expect(validateComment('https://a.com www.b.com http://c.com')).toContain('2 links');
    expect(validateComment('Tudo certo')).toBeNull();
    expect(countLinks('veja www.a.com e https://b.com')).toBe(2);
  });

  it('mensagens de erro sem detalhes técnicos', () => {
    const base = { ok: false as const, field: null, serverMessage: null, retryAfterSeconds: null };
    expect(contentErrorMessage({ ...base, reason: 'unauthenticated' })).toContain('Entre novamente');
    expect(contentErrorMessage({ ...base, reason: 'rate_limited', retryAfterSeconds: 120 })).toContain('2 min');
    expect(contentErrorMessage({ ...base, reason: 'conflict', field: 'body', serverMessage: 'Você já publicou este comentário.' })).toBe(
      'Você já publicou este comentário.'
    );
    expect(contentErrorMessage({ ...base, reason: 'unavailable' }, 'publicar')).toContain('Não foi possível publicar');
    expect(contentErrorMessage({ ...base, reason: 'password_change_required' })).toContain('senha temporária');
  });
});

describe('avaliação', () => {
  it('visitante vê a média e o convite para entrar', async () => {
    routes.push((url) =>
      url.endsWith('/summary')
        ? { status: 200, body: summary({ rating: { average: 4.5, count: 2, distribution: [0, 0, 0, 1, 1] } }) }
        : undefined
    );
    renderInteractions({ authenticated: false });
    expect(await screen.findByText('Média 4,5 de 5, com 2 avaliações.')).toBeTruthy();
    const login = screen.getByRole('link', { name: 'Entrar para avaliar' });
    expect(login.getAttribute('href')).toBe(`/login?next=%2Fartigo%2F${ARTICLE}`);
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('com sessão, escolher a nota grava no servidor e mostra a média nova', async () => {
    routes.push((url, init) =>
      url.endsWith('/rating') && init.method === 'PUT'
        ? { status: 200, body: summary({ rating: { average: 4, count: 1, distribution: [0, 0, 0, 1, 0] }, my_rating: 4 }) }
        : undefined
    );
    renderInteractions();
    const four = await screen.findByRole('radio', { name: '4 de 5 — Ajudou' });
    fireEvent.click(four);
    await waitFor(() => expect(screen.getByText('Média 4,0 de 5, com 1 avaliação.')).toBeTruthy());
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({ value: 4 });
    expect((screen.getByRole('radio', { name: '4 de 5 — Ajudou' }) as HTMLInputElement).checked).toBe(true);
    expect(await screen.findByText('Avaliação registrada')).toBeTruthy();
  });

  it('falha ao carregar o resumo: mensagem e tentar de novo', async () => {
    let fail = true;
    routes.push((url) => (url.endsWith('/summary') && fail ? { status: 503 } : undefined));
    renderInteractions();
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' });
    fail = false;
    fireEvent.click(retry);
    expect(await screen.findByText('Ainda sem avaliações. A sua pode ser a primeira.')).toBeTruthy();
  });
});

describe('sugerir correção', () => {
  it('valida, envia com o artigo identificado e confirma', async () => {
    routes.push((url, init) =>
      url.endsWith('/corrections') && init.method === 'POST'
        ? { status: 201, body: { id: 'k1', status: 'open' } }
        : undefined
    );
    renderInteractions();
    fireEvent.click(await screen.findByRole('button', { name: 'Sugerir correção' }));
    const dialog = screen.getByRole('dialog', { name: 'Sugerir correção' });
    expect(within(dialog).getByText('Como enviar o S-2220?')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar sugestão' }));
    expect(await within(dialog).findByText(/pelo menos 10 caracteres/)).toBeTruthy();
    expect(calls.some((call) => call.url.endsWith('/corrections'))).toBe(false);

    fireEvent.change(within(dialog).getByLabelText('O que precisa ser corrigido? (obrigatório)'), {
      target: { value: 'O prazo mudou para o dia 15.' },
    });
    fireEvent.change(within(dialog).getByLabelText('Tipo de problema'), { target: { value: 'desatualizado' } });
    fireEvent.change(within(dialog).getByLabelText('Trecho afetado (opcional)'), { target: { value: 'até o dia 7' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar sugestão' }));

    expect(await screen.findByRole('dialog', { name: 'Sugestão enviada' })).toBeTruthy();
    expect(calls.find((call) => call.url.endsWith('/corrections'))).toMatchObject({
      url: `/content/articles/${ARTICLE}/corrections`,
      body: { kind: 'desatualizado', description: 'O prazo mudou para o dia 15.', excerpt: 'até o dia 7' },
    });
  });

  it('sugestão repetida: mostra o motivo do servidor no campo', async () => {
    routes.push((url, init) =>
      url.endsWith('/corrections') && init.method === 'POST'
        ? {
            status: 409,
            body: { error: { code: 'CONFLICT', message: 'Você já enviou esta sugestão; ela está em revisão.', details: [{ field: 'description' }] } },
          }
        : undefined
    );
    renderInteractions();
    fireEvent.click(await screen.findByRole('button', { name: 'Sugerir correção' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('O que precisa ser corrigido? (obrigatório)'), {
      target: { value: 'Texto suficiente aqui.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar sugestão' }));
    expect(await within(dialog).findByText('Você já enviou esta sugestão; ela está em revisão.')).toBeTruthy();
  });

  it('visitante é levado ao login', async () => {
    renderInteractions({ authenticated: false });
    expect((await screen.findByRole('link', { name: 'Entrar para sugerir correção' })).getAttribute('href')).toContain('/login?next=');
  });
});

describe('comentários', () => {
  it('lista vazia, publica e mostra na hora (sem envio duplo)', async () => {
    routes.push((url, init) => {
      if (url.endsWith('/comments') && init.method === 'POST') {
        return { status: 201, body: comment({ id: 'novo', body: 'Primeiro!', author: { username: 'ana', display_name: 'Ana', role: 'user' }, can_edit: true, can_delete: true }) };
      }
      return undefined;
    });
    renderInteractions();
    expect(await screen.findByText('Nenhum comentário ainda')).toBeTruthy();

    const box = screen.getByLabelText('Seu comentário');
    fireEvent.change(box, { target: { value: '  Primeiro!  ' } });
    const publish = screen.getByRole('button', { name: 'Publicar' });
    await act(async () => {
      fireEvent.click(publish);
      fireEvent.click(publish);
    });
    expect(await screen.findByText('Primeiro!')).toBeTruthy();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ body: 'Primeiro!' });
    expect((box as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByRole('button', { name: /Editar/ })).toBeTruthy();
  });

  it('respeita as permissões do servidor e remove com confirmação', async () => {
    routes.push((url, init) => {
      if (url.endsWith('/comments') && (init.method ?? 'GET') === 'GET') {
        return {
          status: 200,
          body: {
            total: 2,
            items: [
              comment({ id: 'meu', body: 'Meu comentário', can_edit: true, can_delete: true, author: { username: 'ana', display_name: 'Ana', role: 'user' } }),
              comment({ id: 'outro', body: 'De outra pessoa' }),
            ],
          },
        };
      }
      if (url.endsWith('/comments/meu') && init.method === 'DELETE') return { status: 204 };
      return undefined;
    });
    renderInteractions();
    const mine = await screen.findByRole('article', { name: 'Comentário de Ana' });
    const other = screen.getByRole('article', { name: 'Comentário de Bia' });
    expect(within(other).queryByRole('button', { name: /Editar|Remover/ })).toBeNull();
    expect(within(other).getByText('Equipe editorial')).toBeTruthy();

    fireEvent.click(within(mine).getByRole('button', { name: /Remover/ }));
    const confirm = screen.getByRole('dialog', { name: 'Remover comentário?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remover comentário' }));
    await waitFor(() => expect(screen.queryByText('Meu comentário')).toBeNull());
    expect(calls.some((call) => call.method === 'DELETE' && call.url === '/content/comments/meu')).toBe(true);
  });

  it('erro ao carregar: estado de falha com tentar de novo', async () => {
    routes.push((url, init) => (url.endsWith('/comments') && (init.method ?? 'GET') === 'GET' ? { status: 500 } : undefined));
    renderInteractions({ authenticated: false });
    expect(await screen.findByText('Não foi possível carregar os comentários')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Entrar para comentar' })).toBeTruthy();
  });

  it('limite de envio: avisa quando tentar de novo', async () => {
    routes.push((url, init) =>
      url.endsWith('/comments') && init.method === 'POST'
        ? { status: 429, body: { error: { code: 'RATE_LIMITED', message: 'x' } } }
        : undefined
    );
    renderInteractions();
    fireEvent.change(await screen.findByLabelText('Seu comentário'), { target: { value: 'Mais um comentário' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByText(/Muitas ações seguidas/)).toBeTruthy();
  });
});
