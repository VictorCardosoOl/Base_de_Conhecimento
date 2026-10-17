'use server';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Category } from '@/types/index';
import { isAdminSession } from '@/actions/auth-actions';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'artigos');
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_BYTES = 200 * 1024; // 200 KB
const ALLOWED_CATEGORIES = new Set<string>(Object.values(Category));

export async function saveArticle(formData: FormData) {
  // Server Actions são endpoints públicos: a autorização precisa ocorrer aqui.
  if (!(await isAdminSession())) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const content = String(formData.get('content') ?? '');

  if (!title || !category || !content.trim()) {
    return { success: false, error: 'Preencha todos os campos.' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { success: false, error: `O título deve ter até ${MAX_TITLE_LENGTH} caracteres.` };
  }
  if (Buffer.byteLength(content, 'utf-8') > MAX_CONTENT_BYTES) {
    return { success: false, error: 'O conteúdo excede o limite de 200 KB.' };
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return { success: false, error: 'Categoria inválida.' };
  }

  try {
    const fileId = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!fileId) {
      return { success: false, error: 'O título precisa conter letras ou números.' };
    }

    const filePath = path.join(CONTENT_DIR, `${fileId}.md`);
    // Defesa em profundidade contra path traversal
    if (path.dirname(filePath) !== CONTENT_DIR) {
      return { success: false, error: 'Nome de arquivo inválido.' };
    }

    const frontmatter = {
      id: fileId,
      title,
      category,
      question: title,
    };

    const fileContent = matter.stringify(content, frontmatter);

    await fs.promises.mkdir(CONTENT_DIR, { recursive: true });
    await fs.promises.writeFile(filePath, fileContent, 'utf-8');

    return { success: true, id: fileId };
  } catch (e) {
    console.error('Failed to save article', e);
    return {
      success: false,
      error: 'Não foi possível salvar o arquivo. Verifique as permissões de escrita do servidor e tente novamente.',
    };
  }
}
