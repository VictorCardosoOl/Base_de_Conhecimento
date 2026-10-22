import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { roleLabel } from '@/features/auth/presentation';
import { CONTENT_ROLES, loadSessionDeps, requireSession } from '@/features/auth/session';
import { getOwnRoleRequest } from '@/features/auth/users';
import { EditorAccessRequest, type EditorRequestState } from './EditorAccessRequest';
import { EmailVerificationStatus } from './EmailVerificationStatus';
import { ReadingQueueTile } from './ReadingQueueTile';
import { MyCorrections } from './MyCorrections';
import { GlassPreferenceControl } from '@/features/shell/components/GlassPreferenceControl';
import { RingGauge } from '@/components/ui/glass/GlassMetrics';

// Sessão e configuração de autenticação só em tempo de requisição (nunca no build).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Minha conta', robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Qualquer usuário autenticado; com a troca de senha pendente, vai antes para /conta/senha.
export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const deps = await loadSessionDeps();
  const { user, accessToken } = await requireSession('/conta', await searchParams, {}, deps);

  // Só leitores pedem acesso de editor; a situação vem do AuthService, no servidor.
  let editorRequest: EditorRequestState | null = null;
  if (user.role === 'user') {
    const result = await getOwnRoleRequest(accessToken, deps.config);
    const own = result.ok ? result.value : null;
    editorRequest = !result.ok
      ? { kind: 'unavailable' }
      : own?.status === 'pending'
        ? { kind: 'pending', since: own.createdAt }
        : own?.status === 'rejected'
          ? { kind: 'rejected', decidedAt: own.decidedAt }
          : { kind: 'none' };
  }
  const linkClass =
    'group inline-flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-text-main glass-flat glass-interactive glass-focus';

  // Proteção da conta: o que dá para conferir daqui (email confirmado e senha definida).
  const checks = [
    { label: 'Email confirmado', ok: user.emailVerified },
    { label: 'Senha definida', ok: user.hasPassword },
  ].filter((check): check is { label: string; ok: boolean } => check.ok !== undefined);
  const protection = checks.length
    ? Math.round((checks.filter((check) => check.ok).length / checks.length) * 100)
    : null;
  const initials = user.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      <div data-reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <p className="ui-eyebrow">Sua conta</p>
          <h1 className="ui-page-title mt-2">Minha conta</h1>
        </div>
        <LogoutButton className="ui-btn self-start sm:self-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 lg:gap-5 auto-rows-[minmax(0,auto)]">
        {/* Identidade */}
        <section
          data-reveal
          aria-labelledby="account-identity"
          className="glass-card glass-chroma md:col-span-4 p-6 sm:p-8 overflow-hidden"
        >
          <h2 id="account-identity" className="sr-only">Identificação</h2>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <span
              aria-hidden="true"
              className="w-20 h-20 shrink-0 rounded-[1.75rem] flex items-center justify-center text-2xl font-semibold text-white bg-[linear-gradient(135deg,var(--mesh-1),var(--mesh-3))] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_40px_-12px_var(--mesh-1)]"
            >
              {initials || '?'}
            </span>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm flex-1 min-w-0">
              <div>
                <dt className="ui-label">Nome</dt>
                <dd className="text-text-main text-lg font-medium break-words">{user.displayName}</dd>
              </div>
              <div>
                <dt className="ui-label">Usuário</dt>
                <dd className="text-text-main font-mono break-all">{user.username}</dd>
              </div>
              <div>
                <dt className="ui-label">Email</dt>
                <dd className="text-text-main break-all">{user.email}</dd>
                {user.emailVerified !== undefined && (
                  <dd className="mt-1">
                    <EmailVerificationStatus verified={user.emailVerified} />
                  </dd>
                )}
              </div>
              <div>
                <dt className="ui-label">Papel</dt>
                <dd>
                  <span className="inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-semibold text-text-main glass-flat !rounded-full">
                    {roleLabel(user.role)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Proteção da conta */}
        <section
          data-reveal
          style={{ ['--reveal-index' as string]: 1 }}
          aria-labelledby="account-protection"
          className="glass-card md:col-span-2 p-6 flex flex-col items-center justify-center gap-4 text-center"
        >
          <h2 id="account-protection" className="ui-label">
            Proteção da conta
          </h2>
          {protection !== null ? (
            <RingGauge value={protection} label="Proteção da conta">
              <span className="text-2xl font-semibold text-text-main tabular-nums">{protection}%</span>
            </RingGauge>
          ) : null}
          <ul className="space-y-1 text-xs text-text-muted">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center justify-center gap-1.5">
                <span aria-hidden="true" className={check.ok ? 'text-[color:var(--tone-success)]' : 'text-[color:var(--tone-warning)]'}>
                  {check.ok ? '●' : '○'}
                </span>
                {check.label}: {check.ok ? 'sim' : 'pendente'}
              </li>
            ))}
          </ul>
        </section>

        {/* Lista de leitura */}
        <div data-reveal style={{ ['--reveal-index' as string]: 2 }} className="md:col-span-2">
          <ReadingQueueTile />
        </div>

        {/* Atalhos */}
        <nav
          data-reveal
          style={{ ['--reveal-index' as string]: 3 }}
          aria-label="Ações da conta"
          className="glass-card md:col-span-4 p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start"
        >
          {user.hasPassword === false ? (
            // Conta de login social sem senha: cria uma pelo link enviado ao email.
            <Link href="/esqueci-senha?next=%2Fconta" className={linkClass}>
              Criar uma senha
            </Link>
          ) : (
            <Link href="/conta/senha?next=%2Fconta" className={linkClass}>
              Trocar senha
            </Link>
          )}
          {CONTENT_ROLES.includes(user.role) && (
            <Link href="/admin" className={linkClass}>
              Painel administrativo
            </Link>
          )}
          {CONTENT_ROLES.includes(user.role) && (
            <Link href="/admin/solicitacoes" className={linkClass}>
              Solicitações de acesso
            </Link>
          )}
          {user.role === 'admin' && (
            <Link href="/admin/usuarios" className={linkClass}>
              Usuários
            </Link>
          )}
          <Link href="/" className={linkClass}>
            Voltar para a Base de Conhecimento
          </Link>
          {/* Encerra também as sessões de outros navegadores (ex.: suspeita de acesso indevido). */}
          <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row sm:items-center gap-2.5 border-t border-border pt-4">
            <p className="text-sm text-text-muted flex-1">
              Entrou em outro computador ou suspeita de acesso indevido? Encerre a sessão em todos os dispositivos.
              Limpar só parte dos dados do site no navegador não encerra a sessão: para sair, use Sair.
            </p>
            <LogoutButton scope="all" className="ui-btn self-start sm:self-auto">
              Sair de todos os dispositivos
            </LogoutButton>
          </div>
        </nav>

        <div data-reveal className="md:col-span-4">
          <MyCorrections />
        </div>

        <section data-reveal aria-labelledby="account-preferences" className="glass-card md:col-span-2 p-6">
          <h2 id="account-preferences" className="text-base font-semibold text-text-main mb-4">Preferências</h2>
          <GlassPreferenceControl className="[&_.grid]:!grid-cols-1" />
        </section>

        {editorRequest && (
          <div data-reveal className="glass-card md:col-span-6 p-6">
            <EditorAccessRequest initial={editorRequest} />
          </div>
        )}
      </div>
    </div>
  );
}
