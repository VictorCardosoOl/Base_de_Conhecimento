'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateMessage';
import { useToast } from '@/components/ui/Toast';
import { FAQ_DATA } from '@/features/articles/catalog';
import { formatDateTime } from '@/features/content/components/ArticleComments';
import {
  type ModerationComment,
  contentErrorMessage,
  deleteComment,
  fetchRecentComments,
} from '@/features/content/content-client';

const TITLES = new Map(FAQ_DATA.map((item) => [item.id, item.question]));

/** Comentários recentes de todos os artigos, com remoção (moderação registrada). */
export function CommentsModeration({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const toast = useToast();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<ModerationComment[]>([]);
  const [total, setTotal] = useState(0);
  const [target, setTarget] = useState<ModerationComment | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    const result = await fetchRecentComments();
    if (!result.ok) {
      setState('error');
      return;
    }
    setItems(result.data.items);
    setTotal(result.data.total);
    onCountChange?.(result.data.total);
    setState('ready');
  }, [onCountChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    const result = await deleteComment(target.id);
    setBusy(false);
    if (!result.ok) {
      toast.show({ tone: 'danger', title: 'Comentário não removido', message: contentErrorMessage(result, 'remover') });
    } else {
      setItems((list) => list.filter((item) => item.id !== target.id));
      setTotal((value) => {
        onCountChange?.(value - 1);
        return value - 1;
      });
      toast.show({ title: 'Comentário removido' });
    }
    setTarget(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted max-w-2xl">
        Os comentários aparecem na hora para os leitores. Remova o que for spam, ofensivo ou expuser dados pessoais; a remoção fica registrada com o seu usuário.
      </p>
      <div aria-live="polite" aria-busy={state === 'loading'}>
        {state === 'loading' && (
          <div className="grid gap-3" role="status" aria-label="Carregando comentários">
            <Skeleton className="h-20 w-full !rounded-3xl" />
            <Skeleton className="h-20 w-full !rounded-3xl" />
          </div>
        )}
        {state === 'error' && (
          <ErrorState title="Não foi possível carregar os comentários" action={<Button size="sm" onClick={() => void load()}>Tentar novamente</Button>} />
        )}
        {state === 'ready' && items.length === 0 && (
          <EmptyState title="Nenhum comentário publicado" icon={<MessageSquare size={20} aria-hidden="true" />} />
        )}
        {state === 'ready' && items.length > 0 && (
          <ul className="grid gap-3" aria-label={`${total} comentários`}>
            {items.map((item) => (
              <li key={item.id} className="glass-card p-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">
                    <strong className="text-text-main">{item.author.display_name}</strong> @{item.author.username} ·{' '}
                    <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
                    {item.parent_id && ' · resposta'}
                    {item.edited_at && ' · editado'}
                  </p>
                  <Link href={`/artigo/${item.article_id}`} className="ui-link text-sm font-semibold">
                    {TITLES.get(item.article_id) ?? item.article_id}
                  </Link>
                  <p className="mt-2 text-sm text-text-body whitespace-pre-line break-words">{item.body}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setTarget(item)} aria-label={`Remover comentário de ${item.author.display_name}`}>
                  <Trash2 size={15} aria-hidden="true" /> Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={target !== null}
        onCancel={() => setTarget(null)}
        onConfirm={remove}
        busy={busy}
        danger
        title="Remover este comentário?"
        description="Ele deixa de aparecer no artigo para todos. Respostas a ele continuam visíveis."
        confirmLabel="Remover comentário"
      />
    </div>
  );
}
