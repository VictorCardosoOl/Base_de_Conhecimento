"use client";
import React, { useState } from 'react';
import { requestEditorAccess, type RoleRequestResult } from '@/features/auth/client';
import { hardNavigate } from '@/lib/navigation';

export type EditorRequestState =
  | { kind: 'none' }
  | { kind: 'pending'; since: string }
  | { kind: 'rejected'; decidedAt: string | null }
  | { kind: 'unavailable' };

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });

type Failed = Exclude<RoleRequestResult, { ok: true }>;

function messageFor(result: Failed): string {
  switch (result.reason) {
    case 'already_pending':
      return 'Você já tem um pedido pendente.';
    case 'not_eligible':
      return 'Sua conta já tem acesso de editor ou superior. Entre novamente para atualizar.';
    case 'unauthenticated':
      return 'Sua sessão terminou. Entre novamente.';
    case 'unavailable':
      return 'Serviço de autenticação indisponível. Tente novamente em instantes.';
  }
}

/**
 * Leitor pede acesso de editor. Não muda o papel: um administrador ou editor decide
 * em /admin/solicitacoes.
 */
export function EditorAccessRequest({ initial }: { initial: EditorRequestState }) {
  const [state, setState] = useState<EditorRequestState>(initial);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const send = async () => {
    setIsSending(true);
    setError('');
    const result = await requestEditorAccess();
    setIsSending(false);
    if (result.ok) {
      setState({ kind: 'pending', since: new Date().toISOString() });
      return;
    }
    if (result.reason === 'unauthenticated') {
      hardNavigate('/login?next=%2Fconta');
      return;
    }
    if (result.reason === 'already_pending') setState({ kind: 'pending', since: '' });
    setError(messageFor(result));
  };

  return (
    <section aria-labelledby="editor-access-title" className="space-y-3">
      <h2 id="editor-access-title" className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        Acesso de editor
      </h2>
      {state.kind === 'pending' ? (
        <p role="status" className="text-sm text-text-main">
          Pedido enviado{state.since ? ` em ${DATE_FORMAT.format(new Date(state.since))}` : ''}. Um
          administrador ou editor vai analisar; depois da aprovação, entre novamente.
        </p>
      ) : state.kind === 'unavailable' ? (
        <p className="text-sm text-text-muted">
          Não foi possível consultar seu pedido agora. Tente novamente em instantes.
        </p>
      ) : (
        <>
          <p className="text-sm text-text-muted">
            {state.kind === 'rejected'
              ? `Seu pedido anterior foi recusado${
                  state.decidedAt ? ` em ${DATE_FORMAT.format(new Date(state.decidedAt))}` : ''
                }. Você pode pedir novamente.`
              : 'Sua conta tem acesso de leitura. Para criar e editar artigos, peça acesso de editor.'}
          </p>
          <button
            type="button"
            onClick={send}
            disabled={isSending}
            className="glass-button glass-button-primary w-full sm:w-auto disabled:opacity-60"
          >
            {isSending ? 'Enviando…' : 'Solicitar acesso de editor'}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
