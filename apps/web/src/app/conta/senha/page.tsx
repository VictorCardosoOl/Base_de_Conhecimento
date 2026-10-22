import type { Metadata } from 'next';
import { sanitizeNextPath } from '@/features/auth/redirect';
import { requireSession } from '@/features/auth/session';
import { ChangePasswordForm } from './ChangePasswordForm';

// Sessão e configuração de autenticação só em tempo de requisição (nunca no build).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Trocar senha', robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Única área protegida que abre com a troca de senha pendente.
export default async function ChangePasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { user } = await requireSession('/conta/senha', params, {
    allowPendingPasswordChange: true,
  });
  return (
    <ChangePasswordForm
      required={user.mustChangePassword}
      next={sanitizeNextPath(params.next, '/conta')}
    />
  );
}
