import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildLoginRedirect } from '@/features/auth/redirect';
import { CONTENT_ROLES, loadSessionDeps, requireRole } from '@/features/auth/session';
import { listRoleRequests } from '@/features/auth/users';
import { RoleRequestsManager } from './RoleRequestsManager';

// Sessão e configuração de autenticação só em tempo de requisição (nunca no build).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Solicitações', robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Admin e editor decidem pedidos de acesso de editor. A lista vem do AuthService, no servidor.
export default async function RoleRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const deps = await loadSessionDeps();
  const { user, accessToken } = await requireRole(CONTENT_ROLES, '/admin/solicitacoes', params, deps);

  const result = await listRoleRequests(accessToken, deps.config, { limit: 100, offset: 0 });
  if (!result.ok) {
    if (result.error === 'session_expired' || result.error === 'unauthenticated') {
      redirect(buildLoginRedirect('/admin/solicitacoes', params));
    }
    throw new Error(`Falha ao listar solicitações (${result.error})`);
  }

  return (
    <RoleRequestsManager
      requests={result.value.items}
      total={result.value.total}
      canManageUsers={user.role === 'admin'}
    />
  );
}
