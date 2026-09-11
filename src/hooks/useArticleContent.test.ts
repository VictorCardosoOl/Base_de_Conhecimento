import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useArticleContent } from './useArticleContent';
import { FAQItem, Category } from '../types/index';

const createMockArticle = (contentVal: any): FAQItem => ({
  id: 'test-article',
  question: 'Pergunta Teste',
  answer: 'Resposta de Fallback',
  category: Category.INTRODUCAO,
  date: '11 Set 2026',
  content: contentVal,
});

describe('useArticleContent Hook (Markdown Parse & Sanitization)', () => {
  it('deve carregar e renderizar Markdown com segurança a partir de string estática', async () => {
    const article = createMockArticle('## Subtítulo do Artigo\n\nTexto explicativo com **negrito**.');
    const { result } = renderHook(() => useArticleContent(article));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.htmlContent).toContain('<h2>Subtítulo do Artigo</h2>');
    expect(result.current.htmlContent).toContain('<strong>negrito</strong>');
  });

  it('deve carregar conteúdo dinâmico via função assíncrona (lazy import)', async () => {
    const asyncArticle = createMockArticle(async () => ({
      default: '# Título Importado Dinamicamente'
    }));

    const { result } = renderHook(() => useArticleContent(asyncArticle));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.htmlContent).toContain('<h1>Título Importado Dinamicamente</h1>');
  });

  it('deve neutralizar e sanitizar scripts maliciosos (XSS Prevention)', async () => {
    const maliciousArticle = createMockArticle('<script>alert("xss")</script><img src="x" onerror="alert(1)">');
    const { result } = renderHook(() => useArticleContent(maliciousArticle));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // DOMPurify deve ter removido as tags perigosas
    expect(result.current.htmlContent).not.toContain('<script>');
    expect(result.current.htmlContent).not.toContain('onerror');
  });

  it('deve aplicar fallback para answer quando o carregamento falhar', async () => {
    const failingArticle = createMockArticle(async () => {
      throw new Error('Falha de rede ao carregar chunk');
    });

    const { result } = renderHook(() => useArticleContent(failingArticle));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.htmlContent).toContain('Resposta de Fallback');
  });
});
