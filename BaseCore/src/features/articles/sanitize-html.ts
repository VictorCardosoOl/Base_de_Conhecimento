import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizador único do HTML gerado a partir do Markdown dos artigos.
 *
 * Usa `sanitize-html` (JavaScript puro): roda igual no servidor (SSR) e no
 * navegador, sem depender de jsdom. A mesma biblioteca será usada pela
 * Knowledge API quando a renderização migrar para o backend.
 *
 * Allowlist explícita: qualquer tag ou atributo fora dela é descartado, o que
 * remove <script>, <iframe>, <svg>, handlers on* e atributos style.
 * Imagens `data:` continuam permitidas: há artigos com imagens base64 embutidas.
 */
const ARTICLE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup', 'small', 'abbr', 'kbd',
    'code', 'pre', 'span', 'div',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'name'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['align', 'colspan', 'rowspan'],
    td: ['align', 'colspan', 'rowspan'],
    code: ['class'],
    span: ['class', 'data-tooltip'],
    mark: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
};

export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, ARTICLE_SANITIZE_OPTIONS);
}
