import { CONTENT_ROLES, requireRole } from '@/features/auth/session';
import { ArticleEditor } from './ArticleEditor';

// Sessão e configuração de autenticação só em tempo de requisição (nunca no build).
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Autorização no servidor, na própria página (não no layout): admin e editor; user → 403.
export default async function EditorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  await requireRole(CONTENT_ROLES, '/admin/editor', params);
  // ?artigo=<id>: revisão de um artigo publicado (o editor só aceita ids do catálogo).
  const articleId = typeof params.artigo === 'string' ? params.artigo : undefined;
  return <ArticleEditor key={articleId ?? 'novo'} articleId={articleId} />;
}
