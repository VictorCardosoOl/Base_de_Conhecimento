import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Leitura dos artigos .md direto do disco, no servidor (build e SSR de /artigo/[id]).
 *
 * O restante do site usa o catálogo pré-gerado (scripts/generate-catalog.js → src/data).
 * Os dois caminhos repetem a varredura e o cálculo de id/resumo, com pequenas diferenças
 * no texto puro (ver docs/ARQUITETURA.md, "Problemas conhecidos").
 */
const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'artigos');

/** Artigo como lido do arquivo (não é o FAQItem do catálogo: `category` é texto livre). */
export interface ArticleFile {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  date?: string;
  lastReviewed?: string;
  validityMonths?: number;
  verifiedBy?: string;
  author?: string;
  content?: string;
  excerpt?: string;
  searchText?: string;
}

function getFiles(dir: string, filesList: string[] = []) {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, filesList);
    } else if (name.endsWith('.md')) {
      filesList.push(name);
    }
  }
  return filesList;
}

let cachedCatalog: ArticleFile[] | null = null;
let cachedById: Map<string, ArticleFile> | null = null;
const SHOULD_CACHE = process.env.NODE_ENV === 'production';

/** Em produção o conteúdo é imutável após o build: lê o disco apenas uma vez. */
export function getAllArticles(): ArticleFile[] {
  if (SHOULD_CACHE && cachedCatalog) return cachedCatalog;
  const catalog = readCatalogFromDisk();
  if (SHOULD_CACHE) {
    cachedCatalog = catalog;
    cachedById = new Map(catalog.map((a) => [a.id, a]));
  }
  return catalog;
}

function readCatalogFromDisk(): ArticleFile[] {
  const files = getFiles(CONTENT_DIR);
  const catalog: ArticleFile[] = [];

  files.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent.trimStart());

    const fileId = data.id || path.basename(filePath, '.md');
    const question =
      data.question || data.title || path.basename(filePath, '.md');

    const plainText = content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*`_~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const sanitizedId = path.basename(fileId).replace(/[^a-zA-Z0-9_-]/g, '');
    const excerpt =
      plainText.substring(0, 160).trim() +
      (plainText.length > 160 ? '...' : '');

    catalog.push({
      ...data,
      id: sanitizedId,
      question,
      content,
      excerpt,
      searchText: plainText,
      answer: data.answer || excerpt,
      category: data.category || 'Geral',
    } as ArticleFile);
  });

  return catalog;
}

export function getArticleById(id: string): ArticleFile | null {
  const articles = getAllArticles();
  if (cachedById) return cachedById.get(id) ?? null;
  return articles.find((a) => a.id === id) ?? null;
}
