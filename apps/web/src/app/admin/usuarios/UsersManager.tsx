"use client";
import React, { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, UserPlus } from 'lucide-react';
import type { UserActionResult } from '@/features/auth/user-actions';
import type { ManagedUser } from '@/features/auth/users';
import type { Role } from '@/features/auth/session';
import { ACTION_MESSAGES, runAction } from '@/features/auth/action-feedback';
import { createUser, resetPassword, updateUser } from './actions';
import { TemporaryPasswordDialog } from './TemporaryPasswordDialog';
import { CreateUserDialog } from './CreateUserDialog';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'user', label: 'Leitor' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrador' },
];

const MESSAGES = ACTION_MESSAGES;

// Fuso fixo: o mesmo texto no servidor e no navegador (sem divergência de hidratação).
const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

const SELF_PATH = '/admin/usuarios';
const SEARCH_DEBOUNCE_MS = 350;

/** URL da lista com busca e página (página 1 e busca vazia ficam de fora). */
function listHref(query: string, page = 1): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (page > 1) params.set('pagina', String(page));
  const search = params.toString();
  return search ? `${SELF_PATH}?${search}` : SELF_PATH;
}

interface UsersManagerProps {
  users: ManagedUser[];
  currentUserId: string;
  page: number;
  totalPages: number;
  total: number;
  /** Termo de busca atual (?q=), já aplicado pelo servidor. */
  query: string;
}

type Revealed = { email: string; password: string; reason: 'created' | 'reset' };
type Pending = { id: string; kind: 'deactivate' | 'reset' } | null;

const runActionHere = (action: () => Promise<UserActionResult>) => runAction(action, SELF_PATH);

export function UsersManager({ users, currentUserId, page, totalPages, total, query }: UsersManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [isSearching, startSearch] = useTransition();
  const [creating, setCreating] = useState(false);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const perform = async (
    action: () => Promise<UserActionResult>,
    onSuccess: (result: Extract<UserActionResult, { ok: true }>) => void
  ) => {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await runActionHere(action);
      if (!result) return;
      if (result.ok) onSuccess(result);
      else setFeedback({ kind: 'error', text: MESSAGES[result.error] });
    } catch {
      setFeedback({ kind: 'error', text: MESSAGES.unavailable });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  // Busca enquanto digita (com pausa): a URL muda e o servidor devolve a lista filtrada.
  const lastApplied = useRef(query);
  useEffect(() => {
    const term = search.trim();
    if (term === lastApplied.current) return;
    const timer = setTimeout(() => {
      lastApplied.current = term;
      startSearch(() => router.replace(listHref(term)));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim();
    lastApplied.current = term;
    startSearch(() => router.replace(listHref(term)));
  };

  const closeCreate = () => {
    setCreating(false);
    requestAnimationFrame(() => createButtonRef.current?.focus());
  };

  const changeRole = (user: ManagedUser, next: Role) =>
    perform(
      () => updateUser(user.id, { role: next }),
      () => setFeedback({ kind: 'success', text: `Papel de ${user.email} alterado. As sessões dessa pessoa foram encerradas.` })
    );

  const setActive = (user: ManagedUser, isActive: boolean) =>
    perform(
      () => updateUser(user.id, { isActive }),
      () =>
        setFeedback({
          kind: 'success',
          text: isActive ? `${user.email} foi reativado.` : `${user.email} foi desativado e desconectado.`,
        })
    );

  const reset = (user: ManagedUser) =>
    perform(
      () => resetPassword(user.id),
      (result) => {
        if (result.temporaryPassword) {
          setRevealed({ email: user.email, password: result.temporaryPassword, reason: 'reset' });
        }
      }
    );

  const inputClass =
    'bg-transparent border border-border rounded-lg p-2.5 text-text-main focus:outline-none focus:border-text-main transition-colors';
  const smallButton =
    'px-2.5 py-1.5 text-xs rounded-lg border border-border text-text-main hover:bg-selection transition-colors disabled:opacity-50';

  return (
    <div className="max-w-screen-xl mx-auto space-y-8 p-4 2xl:p-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-text-main">Usuários</h1>
          <p className="text-text-muted mt-1">
            Leitores podem se cadastrar sozinhos; aqui você busca contas e cadastra usuários com
            qualquer papel e senha temporária.
          </p>
        </div>
        <nav aria-label="Navegação do painel" className="flex gap-3 text-sm">
          <Link href="/admin" className="underline text-text-main">Painel</Link>
          <Link href="/conta" className="underline text-text-main">Minha conta</Link>
        </nav>
      </header>

      <section aria-label="Buscar e cadastrar" className="flex flex-col md:flex-row gap-3 md:items-end">
        <form role="search" onSubmit={handleSearchSubmit} className="flex flex-col gap-1 flex-1">
          <label htmlFor="user-search" className="ui-label">
            Buscar usuários
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              id="user-search"
              type="search"
              autoComplete="off"
              maxLength={254}
              placeholder="Usuário, nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-describedby="user-search-status"
              className={`${inputClass} w-full pl-9`}
            />
          </div>
        </form>
        <button
          ref={createButtonRef}
          type="button"
          onClick={() => setCreating(true)}
          className="glass-button glass-button-primary"
        >
          <UserPlus size={16} aria-hidden="true" />
          Cadastrar
        </button>
      </section>
      <p id="user-search-status" role="status" className="text-sm text-text-muted -mt-4">
        {isSearching
          ? 'Buscando…'
          : query
            ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para “${query}”.`
            : ''}
      </p>

      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={`p-3 rounded-lg text-sm border ${
            feedback.kind === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <section aria-labelledby="users-list-title" className="space-y-3">
        <h2 id="users-list-title" className="sr-only">Lista de usuários</h2>
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-selection text-left text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className="p-3">Pessoa</th>
                <th scope="col" className="p-3">Papel</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Último acesso</th>
                <th scope="col" className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isPending = pending?.id === user.id;
                return (
                  <tr key={user.id} className="border-t border-border align-top">
                    {/* Nome, usuário e email juntos: cabem em telas estreitas sem quebrar letra a letra. */}
                    <td className="p-3 min-w-[12rem]">
                      <p className="text-text-main break-words" data-testid="user-display-name">
                        {user.displayName}
                        {isSelf && <span className="ml-1 text-text-muted">(você)</span>}
                      </p>
                      <p className="font-mono text-xs text-text-muted break-all">@{user.username}</p>
                      <p className="text-xs text-text-muted break-all">{user.email}</p>
                    </td>
                    <td className="p-3">
                      <select
                        aria-label={`Papel de ${user.email}`}
                        value={user.role}
                        disabled={busy || isSelf}
                        onChange={(e) => void changeRole(user, e.target.value as Role)}
                        className={inputClass}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-text-main">
                      {user.isActive ? 'Ativo' : 'Desativado'}
                      {user.mustChangePassword && (
                        <span className="block text-xs text-amber-600 dark:text-amber-400">Troca de senha pendente</span>
                      )}
                    </td>
                    <td className="p-3 text-text-muted">
                      {user.lastLoginAt ? DATE_FORMAT.format(new Date(user.lastLoginAt)) : 'Nunca'}
                    </td>
                    <td className="p-3">
                      {isSelf ? (
                        <Link href="/conta/senha?next=%2Fadmin%2Fusuarios" className="text-xs underline text-text-main">
                          Trocar minha senha
                        </Link>
                      ) : isPending ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-text-main">
                            {pending?.kind === 'reset' ? 'Redefinir a senha?' : 'Desativar e desconectar?'}
                          </span>
                          <button
                            type="button"
                            className={smallButton}
                            disabled={busy}
                            onClick={() => void (pending?.kind === 'reset' ? reset(user) : setActive(user, false))}
                          >
                            Confirmar
                          </button>
                          <button type="button" className={smallButton} onClick={() => setPending(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.isActive ? (
                            <button
                              type="button"
                              className={smallButton}
                              disabled={busy}
                              aria-label={`Desativar ${user.email}`}
                              onClick={() => setPending({ id: user.id, kind: 'deactivate' })}
                            >
                              Desativar
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={smallButton}
                              disabled={busy}
                              aria-label={`Reativar ${user.email}`}
                              onClick={() => void setActive(user, true)}
                            >
                              Reativar
                            </button>
                          )}
                          <button
                            type="button"
                            className={smallButton}
                            disabled={busy}
                            aria-label={`Redefinir senha de ${user.email}`}
                            onClick={() => setPending({ id: user.id, kind: 'reset' })}
                          >
                            Redefinir senha
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={5} className="p-6 text-center text-text-muted">
                    {query ? `Nenhum usuário encontrado para “${query}”.` : 'Nenhum usuário.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Paginação" className="flex items-center justify-between text-sm">
            {page > 1 ? (
              <Link href={listHref(query, page - 1)} className="underline text-text-main">Anterior</Link>
            ) : (
              <span />
            )}
            <span className="text-text-muted">Página {page} de {totalPages}</span>
            {page < totalPages ? (
              <Link href={listHref(query, page + 1)} className="underline text-text-main">Próxima</Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>

      {creating && (
        <CreateUserDialog
          onSubmit={(input) => runActionHere(() => createUser(input))}
          onCreated={(email, password) => {
            setCreating(false);
            setRevealed({ email, password, reason: 'created' });
          }}
          onClose={closeCreate}
        />
      )}

      {revealed && (
        <TemporaryPasswordDialog
          email={revealed.email}
          password={revealed.password}
          reason={revealed.reason}
          onClose={() => setRevealed(null)}
        />
      )}
    </div>
  );
}
