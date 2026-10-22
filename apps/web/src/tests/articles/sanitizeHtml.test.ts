import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import { sanitizeArticleHtml } from '@/features/articles/sanitize-html';

const renderMarkdown = async (md: string) => sanitizeArticleHtml(await marked.parse(md));

describe('sanitizeArticleHtml (XSS)', () => {
  it('remove handlers de evento em <img>', () => {
    const out = sanitizeArticleHtml('<img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/onerror/i);
    expect(out).toMatch(/<img src="x" ?\/?>/);
  });

  it('remove links javascript:', async () => {
    const out = await renderMarkdown('[clique](javascript:alert(1))');
    expect(out).not.toMatch(/javascript:/i);
  });

  it('remove <svg onload>', () => {
    const out = sanitizeArticleHtml('<svg onload=alert(1)><circle r="1"></circle></svg>');
    expect(out).not.toMatch(/<svg|onload/i);
  });

  it('remove <iframe>', () => {
    const out = sanitizeArticleHtml('<p>a</p><iframe src="https://evil.example"></iframe>');
    expect(out).not.toMatch(/<iframe/i);
    expect(out).toContain('<p>a</p>');
  });

  it('remove <script> e atributos style', () => {
    const out = sanitizeArticleHtml('<script>alert(1)</script><p style="position:fixed">t</p>');
    expect(out).not.toMatch(/<script|style=/i);
  });

  it('neutraliza HTML cru dentro do Markdown', async () => {
    const out = await renderMarkdown('# Título\n\n<img src=x onerror=alert(1)>\n\n<a href="javascript:alert(1)">x</a>');
    expect(out).toContain('<h1>Título</h1>');
    expect(out).not.toMatch(/onerror|javascript:/i);
  });

  it('preserva o conteúdo legítimo dos artigos', async () => {
    const out = await renderMarkdown('**negrito** e [link](https://www.gov.br/esocial)\n\n| A | B |\n|---|---|\n| 1 | 2 |');
    expect(out).toContain('<strong>negrito</strong>');
    expect(out).toContain('href="https://www.gov.br/esocial"');
    expect(out).toContain('<table>');
  });

  it('preserva imagens base64, <mark> e data-tooltip do glossário', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const out = sanitizeArticleHtml(
      `<img src="${png}"><mark class="sst-highlight-amber">x</mark><span class="glossary-term" data-tooltip="def">t</span>`
    );
    expect(out).toContain(`src="${png}"`);
    expect(out).toContain('<mark class="sst-highlight-amber">x</mark>');
    expect(out).toContain('data-tooltip="def"');
  });
});
