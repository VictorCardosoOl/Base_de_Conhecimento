"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import type { PendingRoleRequest } from '@/features/auth/users';
import { ACTION_MESSAGES, runAction } from '@/features/auth/action-feedback';
import { decideRoleRequest } from './actions';

const SELF_PATH = '/admin/solicitacoes';

// Fuso fixo: o mesmo texto no servidor e no navegador (sem divergência de hidratação).
const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

interface RoleRequestsManagerProps {
  requests: PendingRoleRequest[];
  total: number;
  canManageUsers: boolean;
}

export function RoleRequestsManager({ requests, total, canManageUsers }: RoleRequestsManagerProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const decide = async (request: PendingRoleRequest, decision: 'approve' | 'reject') => {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await runAction(() => decideRoleRequest(request.id, decision), SELF_PATH);
      if (!result) return;
      if (result.ok) {
        setFeedback({
          kind: 'success',
          text:
            decision === 'approve'
              ? `${request.email} agora é editor. A pessoa precisa entrar novamente.`
              : `Pedido de ${request.email} recusado.`,
        });
      } else {
        setFeedback({ kind: 'error', text: ACTION_MESSAGES[result.error] });
      }
    } catch {
      setFeedback({ kind: 'error', text: ACTION_MESSAGES.unavailable });
    } finally {
      setBusy(false);
    }
  };

  const button =
    'px-3 py-1.5 text-xs rounded-lg border border-border text-text-main hover:bg-selection transition-colors disabled:opacity-50';

  return (
    <div className="max-w-screen-lg mx-auto space-y-8 p-4 2xl:p-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-text-main">Solicitações de acesso</h1>
          <p className="text-text-muted mt-1">
            Leitores que pediram acesso de editor. Aprovar dá acesso ao painel e ao editor de artigos.
          </p>
        </div>
        <nav aria-label="Navegação do painel" className="flex gap-3 text-sm">
          <Link href="/admin" className="underline text-text-main">Painel</Link>
          {canManageUsers && <Link href="/admin/usuarios" className="underline text-text-main">Usuários</Link>}
          <Link href="/conta" className="underline text-text-main">Minha conta</Link>
        </nav>
      </header>

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

      {requests.length === 0 ? (
        <p className="text-text-muted">Nenhum pedido pendente.</p>
      ) : (
        <section aria-labelledby="requests-title" className="space-y-3">
          <h2 id="requests-title" className="text-lg font-medium text-text-main">
            Pendentes ({total})
          </h2>
          <ul className="glass-card divide-y divide-border overflow-hidden">
            {requests.map((request) => (
              <li key={request.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-text-main">
                    {request.displayName}{' '}
                    <span className="text-text-muted">@{request.username}</span>
                  </p>
                  <p className="text-sm text-text-muted break-all">{request.email}</p>
                  <p className="text-xs text-text-muted">
                    Pediu acesso de editor em {DATE_FORMAT.format(new Date(request.createdAt))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    aria-label={`Aprovar ${request.email} como editor`}
                    onClick={() => void decide(request, 'approve')}
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    aria-label={`Recusar pedido de ${request.email}`}
                    onClick={() => void decide(request, 'reject')}
                  >
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
