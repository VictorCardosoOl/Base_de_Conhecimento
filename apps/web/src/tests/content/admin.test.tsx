import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@/features/articles/catalog', () => ({
  FAQ_DATA: [
    {
      id: 'esocial-s2220',
      question: 'Como enviar o S-2220?',
      answer: 'Resumo curto',
      category: 'eSocial',
      date: '15 Out 2024',
      tags: ['ASO', 'Exames'],
      validityMonths: 12,
      content: () => Promise.resolve({ default: { content: '\n## Passo a passo\n\nTexto.\n' } }),
    },
    { id: 'aso-guia', question: 'Guia do ASO', answer: 'ASO', category: 'GRO', date: '04 Sep 2026', tags: ['aso'] },
    { id: 'sem-relacao', question: 'Outro assunto', answer: 'x', category: 'Coletivo', date: '2026-09-01', tags: [] },
  ],
}));

import { ToastProvider } from '@/components/ui/Toast';
import { Tabs } from '@/components/ui/Tabs';
import { CorrectionsQueue } from '@/app/admin/CorrectionsQueue';
import { ArticleEditor } from '@/app/admin/editor/ArticleEditor';
import { parseArticleDate, readingMinutes, relatedArticles, validityOf } from '@/features/articles/article-meta';

const correction = {
  id: 'k1',
  article_id: 'esocial-s2220',
  kind: 'desatualizado',
  description: 'O prazo mudou.',
  excerpt: 'até o dia 7',
  status: 'open',
  created_at: '2026-10-10T10:00:00Z',
  resolved_at: null,
  resolution_note: null,
  author_username: 'ana',
  author_display_name: 'Ana Leitora',
  resolver_display_name: null,
};

let calls: Array<{ url: string; method: string; body: unknown }>;

beforeEach(() => {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET';
      calls.push({ url, method, body: init.body ? JSON.parse(String(init.body)) : undefined });
      if (url.startsWith('/content/corrections?')) {
        return new Response(JSON.stringify({ items: [correction], total: 1, limit: 50, offset: 0 }), { status: 200 });
      }
      if (url === '/content/corrections/k1/review') {
        return new Response(JSON.stringify({ ...correction, status: 'resolved' }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    })
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('metadados do artigo', () => {
  it('datas em português, inglês e ISO; inválida vira null', () => {
    expect(parseArticleDate('15 Out 2024')?.toISOString().slice(0, 10)).toBe('2024-10-15');
    expect(parseArticleDate('04 Sep 2026')?.toISOString().slice(0, 10)).toBe('2026-09-04');
    expect(parseArticleDate('2026-09-01')?.getUTCFullYear()).toBe(2026);
    expect(parseArticleDate('ontem')).toBeNull();
  });

  it('validade pelo ciclo de revisão', () => {
    const now = new Date(Date.UTC(2026, 9, 10));
    expect(validityOf({ date: '15 Out 2024', validityMonths: 12 }, now)?.state).toBe('expired');
    expect(validityOf({ date: '10 Jan 2026', validityMonths: 12 }, now)?.state).toBe('expiring');
    expect(validityOf({ date: '04 Sep 2026' }, now)?.state).toBe('ok');
    expect(validityOf({ date: 'sem data' }, now)).toBeNull();
  });

  it('tempo de leitura e relacionados por tag', () => {
    expect(readingMinutes('palavra '.repeat(450))).toBe(2);
    expect(readingMinutes('')).toBeNull();
    expect(relatedArticles('esocial-s2220').map((item) => item.id)).toEqual(['aso-guia']);
  });
});

describe('fila de sugestões de correção', () => {
  it('lista com autor e trecho; marcar como corrigida pede confirmação e sai da fila', async () => {
    const onCount = vi.fn();
    render(
      <ToastProvider>
        <CorrectionsQueue onOpenCountChange={onCount} />
      </ToastProvider>
    );
    expect(await screen.findByRole('link', { name: 'Como enviar o S-2220?' })).toBeTruthy();
    expect(screen.getByText(/Ana Leitora/)).toBeTruthy();
    expect(screen.getByText('até o dia 7')).toBeTruthy();
    expect(onCount).toHaveBeenLastCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /Marcar como corrigida/ }));
    const dialog = screen.getByRole('dialog', { name: 'Marcar como corrigida?' });
    fireEvent.change(within(dialog).getByLabelText('Observação (opcional)'), { target: { value: 'Atualizado.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Como enviar o S-2220?' })).toBeNull());
    expect(calls.find((call) => call.method === 'POST')).toMatchObject({
      url: '/content/corrections/k1/review',
      body: { status: 'resolved', note: 'Atualizado.' },
    });
    expect(onCount).toHaveBeenLastCalledWith(0);
    expect(await screen.findByText('Nenhuma sugestão aguardando revisão')).toBeTruthy();
  });
});

describe('editor de rascunho', () => {
  it('revisão de artigo: carrega o Markdown publicado e gera o arquivo com frontmatter', async () => {
    render(
      <ToastProvider>
        <ArticleEditor articleId="esocial-s2220" />
      </ToastProvider>
    );
    await waitFor(() => expect((screen.getByLabelText('Conteúdo (Markdown)') as HTMLTextAreaElement).value).toContain('## Passo a passo'));
    const file = screen.getByRole('region', { name: 'Arquivo gerado' });
    expect(within(file).getByText('src/content/artigos/eSocial/esocial-s2220.md')).toBeTruthy();
    const markdown = file.querySelector('pre')!.textContent!;
    expect(markdown).toMatch(/^---\ntitle: Como enviar o S-2220\?|^---\ntitle: "Como enviar o S-2220\?"/);
    expect(markdown).toContain('category: eSocial');
    expect(markdown).toContain('lastReviewed:');
    expect(markdown).toContain('tags: [ASO, Exames]');
  });

  it('novo rascunho: botões travados até preencher; barra de formatação age na seleção', () => {
    render(
      <ToastProvider>
        <ArticleEditor />
      </ToastProvider>
    );
    expect((screen.getByRole('button', { name: /Baixar .md/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Prazo do S-2240' } });
    fireEvent.change(screen.getByLabelText('Resposta curta'), { target: { value: 'Até o dia 15.' } });
    const body = screen.getByLabelText('Conteúdo (Markdown)') as HTMLTextAreaElement;
    fireEvent.change(body, { target: { value: 'importante' } });
    body.setSelectionRange(0, 10);
    fireEvent.click(screen.getByRole('button', { name: 'Negrito' }));
    expect(body.value).toBe('**importante**');
    expect((screen.getByRole('button', { name: /Baixar .md/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(within(screen.getByRole('region', { name: 'Arquivo gerado' })).getByText('src/content/artigos/eSocial/prazo-do-s-2240.md')).toBeTruthy();
  });
});

describe('abas', () => {
  it('setas trocam de aba e só a ativa fica no Tab', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        label="Seções"
        idPrefix="t"
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B', count: 3 },
        ]}
      />
    );
    const [a, b] = screen.getAllByRole('tab');
    expect(a.getAttribute('tabindex')).toBe('0');
    expect(b.getAttribute('tabindex')).toBe('-1');
    expect(b.textContent).toContain('3');
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
    fireEvent.keyDown(a, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('b');
  });
});
