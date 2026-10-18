import { CONTENT_ROLES, requireRole } from '@/features/auth/session';
import { AdminDashboard } from './AdminDashboard';

// Sessão e configuração de autenticação só em tempo de requisição (nunca no build).
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Autorização no servidor, na própria página (não no layout): admin e editor; user → 403.
export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { user } = await requireRole(
    CONTENT_ROLES,
    '/admin',
    await searchParams
  );
  return <AdminDashboard canManageUsers={user.role === 'admin'} />;
}
