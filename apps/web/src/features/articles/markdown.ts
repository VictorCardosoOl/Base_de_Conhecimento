import { marked } from 'marked';
import { sanitizeArticleHtml } from './sanitize-html';

/**
 * Converte Markdown para HTML sanitizado com padrão seguro de produção.
 * Ponto único da verdade (SSOT) para renderização de artigos no SSR e no cliente.
 */
export async function renderMarkdownToSafeHtml(markdown: string): Promise<string> {
  if (!markdown || !markdown.trim()) return '';
  const rawHtml = await marked.parse(markdown);
  return sanitizeArticleHtml(rawHtml);
}
