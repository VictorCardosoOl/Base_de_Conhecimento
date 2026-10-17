import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'artigos');
const DATA_DIR = path.join(process.cwd(), 'src', 'data');

async function ensureDir(dir) {
  try {
    await fs.promises.access(dir);
  } catch {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}

async function getFiles(dir, filesList = []) {
  try {
    await fs.promises.access(dir);
  } catch {
    return filesList;
  }
  
  const files = await fs.promises.readdir(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    const stat = await fs.promises.stat(name);
    if (stat.isDirectory()) {
      await getFiles(name, filesList);
    } else if (name.endsWith('.md')) {
      filesList.push(name);
    }
  }
  return filesList;
}

async function generateCatalog() {
  await ensureDir(DATA_DIR);
  
  const files = await getFiles(CONTENT_DIR);
  const catalog = [];
  const mappingLines = [
    'export const ARTICLE_CONTENT_MAP: Record<string, any> = {};',
  ];
  const seenIds = new Map();

  for (const filePath of files) {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent.trimStart());

    const fileId = data.id || path.basename(filePath, '.md');
    const question =
      data.question || data.title || path.basename(filePath, '.md');

    // Blocos de código saem primeiro para não serem parcialmente consumidos pelos regex inline
    const plainText = content
      .replaceAll(/`{3}[\s\S]*?`{3}/g, '')
      .replaceAll(/!\[.*?\]\(.*?\)/g, '')
      .replaceAll(/\[([^\]]+)\]\(.*?\)/g, '$1')
      .replaceAll(/#{1,6}\s+/g, '')
      .replaceAll(/(\*\*|__)(.*?)\1/g, '$2')
      .replaceAll(/(\*|_)(.*?)\1/g, '$2')
      .replaceAll(/`(.+?)`/g, '$1')
      .replaceAll(/\s+/g, ' ')
      .trim();
    const sanitizedId = path.basename(fileId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (seenIds.has(sanitizedId)) {
      console.warn(
        `[generate-catalog] ID duplicado "${sanitizedId}": ${filePath} sobrescreve ${seenIds.get(sanitizedId)}`
      );
    }
    seenIds.set(sanitizedId, filePath);
    const excerpt =
      plainText.substring(0, 160).trim() + (plainText.length > 160 ? '...' : '');

    catalog.push({
      ...data,
      id: sanitizedId,
      question,
      excerpt,
      searchText: plainText,
      answer: data.answer || excerpt,
      category: data.category || 'Geral',
    });

    mappingLines.push(
      `ARTICLE_CONTENT_MAP["${sanitizedId}"] = () => Promise.resolve({ default: { content: ${JSON.stringify(content)} } });`
    );
  }

  await fs.promises.writeFile(
    path.join(DATA_DIR, 'catalog.json'),
    JSON.stringify(catalog, null, 2)
  );
  await fs.promises.writeFile(path.join(DATA_DIR, 'mapping.ts'), mappingLines.join('\n'));
}

generateCatalog()
  .then(() => console.log('Catalog regenerated for client!'))
  .catch((err) => {
    console.error('Error generating catalog:', err);
    process.exit(1);
  });
