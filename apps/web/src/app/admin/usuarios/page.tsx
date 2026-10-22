import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildLoginRedirect } from '@/features/auth/redirect';
import { USER_ADMIN_ROLES, loadSessionDeps, requireRole } from '@/features/auth/session';
import { listUsers } from '@/features/auth/users';
import { UsersManager } from './UsersManager';

// Sessão e configuração de autenticação só em tempo de requisição (nunca no build).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Usuários', robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 20;

function pageNumber(value: string | string[] | undefined): number {
  const n = typeof value === 'string' && /^\d{1,6}$/.test(value) ? Number(value) : 1;
  return n >= 1 ? n : 1;
}

/** Termo de busca da URL (?q=), limitado ao tamanho que o AuthService aceita. */
function searchTerm(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? '').trim().slice(0, 254);
}

// Somente admin. A lista vem do AuthService, consultado no servidor com o token do admin.
export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const deps = await loadSessionDeps();
  const { user, accessToken } = await requireRole(USER_ADMIN_ROLES, '/admin/usuarios', params, deps);

  const page = pageNumber(params.pagina);
  const query = searchTerm(params.q);
  const result = await listUsers(accessToken, deps.config, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    query,
  });
  if (!result.ok) {
    // Sessão encerrada entre a checagem e a consulta: login. Demais falhas: error.tsx do /admin.
    if (result.error === 'session_expired' || result.error === 'unauthenticated') {
      redirect(buildLoginRedirect('/admin/usuarios', params));
    }
    throw new Error(`Falha ao listar usuários (${result.error})`);
  }

  return (
    <UsersManager
      users={result.value.items}
      currentUserId={user.id}
      page={page}
      totalPages={Math.max(1, Math.ceil(result.value.total / PAGE_SIZE))}
      total={result.value.total}
      query={query}
    />
  );
}
