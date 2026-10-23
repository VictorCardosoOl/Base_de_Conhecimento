'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Pencil, Reply, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateMessage';
import { useToast } from '@/components/ui/Toast';
import type { ClientSessionSummary } from '@/features/auth/use-session-summary';
import {
  type Comment,
  contentErrorMessage,
  deleteComment,
  editComment,
  fetchComments,
  postComment,
} from '@/features/content/content-client';
import { CommentComposer } from './CommentComposer';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(iso: string): string {
  try {
    return dateFormat.format(new Date(iso));
  } catch {
    return iso;
  }
}

function roleLabel(role: string): string | null {
  if (role === 'admin') return 'Administração';
  if (role === 'editor') return 'Equipe editorial';
  return null;
}

/** Aplica uma mudança a um comentário (raiz ou resposta) pelo id. */
function updateTree(items: Comment[], id: string, change: (comment: Comment) => Comment | null): Comment[] {
  const next: Comment[] = [];
  for (const item of items) {
    if (item.id === id) {
      const changed = change(item);
      if (changed) next.push(changed);
      continue;
    }
    next.push({ ...item, replies: updateTree(item.replies, id, change) });
  }
  return next;
}

/**
 * Comentários do artigo: leitura pública; publicar, responder, editar e remover com
 * sessão, conforme as permissões que o servidor devolve em cada comentário.
 */
export function ArticleComments({
  articleId,
  session,
  loginHref,
  onCountChange,
}: {
  articleId: string;
  session: ClientSessionSummary | null;
  loginHref: string;
  onCountChange?: (count: number) => void;
}) {
  const toast = useToast();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const signedIn = session?.authenticated === true;

  useEffect(() => {
    let active = true;
    fetchComments(articleId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setItems(result.data.items);
        setTotal(result.data.total);
        setState('ready');
      } else {
        setState('error');
      }
    });
    return () => {
      active = false;
    };
    // A sessão muda as permissões (can_edit/can_delete): recarrega quando ela chega.
  }, [articleId, signedIn, reloadKey]);

  const changeTotal = useCallback(
    (delta: number) => {
      const next = Math.max(0, total + delta);
      setTotal(next);
      onCountChange?.(next);
    },
    [total, onCountChange]
  );

  const publish = async (body: string, parentId: string | null): Promise<string | null> => {
    const result = await postComment(articleId, body, parentId);
    if (!result.ok) return contentErrorMessage(result, 'publicar o comentário');
    if (parentId) {
      setItems((list) => updateTree(list, parentId, (parent) => ({ ...parent, replies: [...parent.replies, result.data] })));
      setReplyTo(null);
    } else {
      setItems((list) => [result.data, ...list]);
    }
    changeTotal(1);
    toast.show({ tone: 'success', title: parentId ? 'Resposta publicada' : 'Comentário publicado' });
    return null;
  };

  const saveEdit = async (comment: Comment, body: string): Promise<string | null> => {
    const result = await editComment(comment.id, body);
    if (!result.ok) return contentErrorMessage(result, 'salvar a edição');
    setItems((list) => updateTree(list, comment.id, (old) => ({ ...result.data, replies: old.replies })));
    setEditing(null);
    toast.show({ tone: 'success', title: 'Comentário atualizado' });
    return null;
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await deleteComment(pendingDelete.id);
    setDeleting(false);
    if (!result.ok) {
      toast.show({ tone: 'danger', title: 'Comentário não removido', message: contentErrorMessage(result, 'remover') });
      setPendingDelete(null);
      return;
    }
    const target = pendingDelete;
    setItems((list) =>
      updateTree(list, target.id, (old) =>
        // Com respostas, fica o lugar (como o servidor devolve); sem respostas, some.
        old.replies.length
          ? { ...old, body: null, author: null, deleted: true, can_edit: false, can_delete: false }
          : null
      )
    );
    changeTotal(-1);
    setPendingDelete(null);
    toast.show({ title: 'Comentário removido' });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editing === comment.id;
    const badge = comment.author ? roleLabel(comment.author.role) : null;
    return (
      <li key={comment.id} className={isReply ? 'pl-4 sm:pl-6 border-l-2 border-[color:color-mix(in_srgb,var(--text-main)_10%,transparent)]' : ''}>
        <article aria-label={comment.deleted ? 'Comentário removido' : `Comentário de ${comment.author?.display_name}`} className="py-4">
          {comment.deleted ? (
            <p className="text-sm italic text-text-muted">Comentário removido.</p>
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white bg-[color:var(--mesh-1)]"
                >
                  {comment.author?.display_name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-text-main">{comment.author?.display_name}</span>
                <span className="text-xs text-text-muted">@{comment.author?.username}</span>
                {badge && (
                  <span className="ui-badge" data-tone="info">
                    {badge}
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  · <time dateTime={comment.created_at}>{formatDateTime(comment.created_at)}</time>
                  {comment.edited_at && <span title={`Editado em ${formatDateTime(comment.edited_at)}`}> · editado</span>}
                </span>
              </header>
              {isEditing ? (
                <div className="mt-3">
                  <CommentComposer
                    label="Editar comentário"
                    submitLabel="Salvar"
                    initialValue={comment.body ?? ''}
                    autoFocus
                    onSubmit={(body) => saveEdit(comment, body)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <p className="mt-2 text-[15px] leading-relaxed text-text-body whitespace-pre-line break-words">{comment.body}</p>
              )}
              {!isEditing && (signedIn || comment.can_edit || comment.can_delete) && (
                <div className="mt-2 flex flex-wrap gap-1 -ml-2">
                  {signedIn && !isReply && (
                    <Button size="sm" variant="ghost" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} aria-expanded={replyTo === comment.id}>
                      <Reply size={14} aria-hidden="true" /> Responder
                    </Button>
                  )}
                  {comment.can_edit && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(comment.id)}>
                      <Pencil size={14} aria-hidden="true" /> Editar
                    </Button>
                  )}
                  {comment.can_delete && (
                    <Button size="sm" variant="ghost" onClick={() => setPendingDelete(comment)}>
                      <Trash2 size={14} aria-hidden="true" /> Remover
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </article>
        {replyTo === comment.id && (
          <div className="pl-4 sm:pl-6 pb-4">
            <CommentComposer
              label={`Responder a ${comment.author?.display_name ?? 'comentário'}`}
              submitLabel="Responder"
              compact
              autoFocus
              onSubmit={(body) => publish(body, comment.id)}
              onCancel={() => setReplyTo(null)}
            />
          </div>
        )}
        {comment.replies.length > 0 && <ul className="mb-2">{comment.replies.map((reply) => renderComment(reply, true))}</ul>}
      </li>
    );
  };

  return (
    <section aria-labelledby={`comments-${articleId}`} className="below-fold border-t border-border pt-10 sm:pt-14">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
        <h2 id={`comments-${articleId}`} className="text-xl font-serif text-text-main flex items-center gap-2.5">
          <MessageSquare size={20} aria-hidden="true" className="text-text-muted" />
          Comentários
          {state === 'ready' && <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-text-main/10 text-text-main font-normal">{total}</span>}
        </h2>
      </div>

      <div className="mt-5">
        {session === null ? (
          <Skeleton className="h-24 w-full !rounded-2xl" />
        ) : signedIn ? (
          <CommentComposer label="Seu comentário" submitLabel="Publicar" onSubmit={(body) => publish(body, null)} />
        ) : (
          <div className="glass-flat p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">Entre na sua conta para comentar e responder.</p>
            <Link href={loginHref} className="ui-btn ui-btn--sm ui-btn--primary">
              Entrar para comentar
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4" aria-live="polite" aria-busy={state === 'loading'}>
        {state === 'loading' && (
          <div className="space-y-4 py-4" aria-label="Carregando comentários" role="status">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        {state === 'error' && (
          <ErrorState
            title="Não foi possível carregar os comentários"
            action={
              <Button size="sm" onClick={() => { setState('loading'); setReloadKey((k) => k + 1); }}>
                Tentar novamente
              </Button>
            }
          >
            O artigo continua disponível; tente de novo em instantes.
          </ErrorState>
        )}
        {state === 'ready' && items.length === 0 && (
          <EmptyState title="Nenhum comentário ainda" icon={<MessageSquare size={20} aria-hidden="true" />}>
            {signedIn ? 'Seja a primeira pessoa a comentar.' : 'Entre na sua conta para iniciar a conversa.'}
          </EmptyState>
        )}
        {state === 'ready' && items.length > 0 && (
          <ul className="divide-y divide-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)]">
            {items.map((comment) => renderComment(comment))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        danger
        title="Remover comentário?"
        description={
          pendingDelete?.can_edit
            ? 'O comentário sai do artigo para todos. As respostas continuam visíveis.'
            : 'Você está removendo o comentário de outra pessoa (moderação). A ação fica registrada.'
        }
        confirmLabel="Remover comentário"
      />
    </section>
  );
}
