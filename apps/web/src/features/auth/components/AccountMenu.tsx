'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  UserCircle,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import type { ClientSessionSummary } from '@/features/auth/use-session-summary';
import {
  authEntryLinks,
  initialsFromEmail,
  roleLabel,
} from '@/features/auth/presentation';
import { LogoutButton } from './LogoutButton';

const CONTENT_ROLES = ['admin', 'editor'];
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-main/50';

/**
 * Conta no cabeçalho da navegação. Visitante: "Entrar" e "Criar conta". Com sessão:
 * nome, @usuário e email, papel, atalhos e "Sair". É só navegação: as páginas
 * protegidas conferem a sessão no servidor.
 *
 * `data-testid="account-menu"` com `data-session="ready"` indica que a página já
 * hidratou e consultou a sessão; os testes ponta a ponta esperam por esse sinal.
 */
export function AccountMenu({
  session,
}: {
  session: ClientSessionSummary | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label =
    session === null
      ? 'Conta'
      : session.authenticated
        ? `Conta de ${session.email} (${roleLabel(session.role)})`
        : 'Entrar ou criar conta';

  return (
    <div ref={containerRef} className="group relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="account-menu"
        data-session={session === null ? 'loading' : 'ready'}
        onClick={() => setOpen((value) => !value)}
        className={`nav-icon-button ${FOCUS_RING}`}
      >
        {session?.authenticated ? (
          <Avatar email={session.email} size="sm" />
        ) : (
          <UserRound size={20} strokeWidth={1.6} aria-hidden="true" />
        )}
      </button>
      {!open && (
        <span
          aria-hidden="true"
          className="nav-tooltip"
        >
          {session?.authenticated ? 'Minha conta' : 'Entrar / Cadastrar'}
        </span>
      )}

      {open && (
        <div
          id={panelId}
          className="glass-strong glass-chroma absolute top-[calc(100%+0.9rem)] right-0 z-[100] w-72 !rounded-[1.75rem] p-2 text-left normal-case tracking-normal animate-fade-in-up"
        >
          <AccountPanel session={session} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function Avatar({ email, size = 'md' }: { email: string; size?: 'sm' | 'md' }) {
  const dimensions =
    size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-10 h-10 text-xs';
  return (
    <span
      aria-hidden="true"
      className={`${dimensions} shrink-0 rounded-full text-white font-bold flex items-center justify-center bg-[linear-gradient(135deg,var(--mesh-1),var(--mesh-3))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}
    >
      {initialsFromEmail(email)}
    </span>
  );
}

function AccountPanel({
  session,
  onNavigate,
}: {
  session: ClientSessionSummary | null;
  onNavigate: () => void;
}) {
  const links = authEntryLinks(usePathname());
  const primary = `glass-button glass-button-primary w-full ${FOCUS_RING}`;
  const secondary = `glass-button w-full ${FOCUS_RING}`;
  const rowLink = `flex items-center gap-2.5 px-3 py-2 rounded-2xl text-sm text-text-main hover:bg-[var(--glass-bg-hover)] hover:translate-x-0.5 transition-[background-color,transform] duration-300 ease-[var(--ease-elastic)] ${FOCUS_RING}`;

  if (session === null) {
    return (
      <p role="status" className="text-xs text-text-muted px-2 py-3">
        Verificando sua sessão…
      </p>
    );
  }

  if (!session.authenticated) {
    return (
      <div className="p-2 space-y-3">
        <div>
          <p className="text-sm font-semibold text-text-main">Acesse sua conta</p>
          <p className="text-xs text-text-muted mt-0.5">
            Entre ou crie um cadastro para acompanhar seu acesso.
          </p>
        </div>
        <Link href={links.login} onClick={onNavigate} className={primary}>
          <LogIn size={16} strokeWidth={1.75} aria-hidden="true" /> Entrar
        </Link>
        <Link href={links.register} onClick={onNavigate} className={secondary}>
          <UserPlus size={16} strokeWidth={1.75} aria-hidden="true" /> Criar
          conta
        </Link>
      </div>
    );
  }

  const canUsePanel = CONTENT_ROLES.includes(session.role);
  return (
    <div className="p-2 space-y-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar email={session.email} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-main break-words leading-snug">
            {session.displayName}
          </p>
          <p className="text-xs text-text-muted break-all leading-snug">
            @{session.username} · {session.email}
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-text-main text-bg-main">
            {roleLabel(session.role)}
          </span>
        </div>
      </div>
      <nav aria-label="Atalhos da conta" className="space-y-0.5">
        <Link href="/conta" onClick={onNavigate} className={rowLink}>
          <UserCircle size={16} strokeWidth={1.75} aria-hidden="true" /> Minha
          conta
        </Link>
        {canUsePanel && (
          <Link href="/admin" onClick={onNavigate} className={rowLink}>
            <LayoutDashboard size={16} strokeWidth={1.75} aria-hidden="true" />{' '}
            Painel
          </Link>
        )}
        {session.role === 'admin' && (
          <Link href="/admin/usuarios" onClick={onNavigate} className={rowLink}>
            <Users size={16} strokeWidth={1.75} aria-hidden="true" /> Usuários
          </Link>
        )}
      </nav>
      <LogoutButton className={secondary}>Sair</LogoutButton>
    </div>
  );
}
