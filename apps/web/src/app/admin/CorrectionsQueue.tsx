'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FilePenLine, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateMessage';
import { useToast } from '@/components/ui/Toast';
import { FAQ_DATA } from '@/features/articles/catalog';
import { formatDateTime } from '@/features/content/components/ArticleComments';
import {
  CORRECTION_KINDS,
  CORRECTION_STATUS_LABEL,
  type CorrectionForReview,
  type CorrectionStatus,
  contentErrorMessage,
  fetchCorrections,
  reviewCorrection,
} from '@/features/content/content-client';

const TITLES = new Map(FAQ_DATA.map((item) => [item.id, item.question]));
const KIND_LABEL = Object.fromEntries(CORRECTION_KINDS.map((kind) => [kind.value, kind.label.split(' (')[0]]));
const FILTERS: Array<{ value: CorrectionStatus | 'all'; label: string }> = [
  { value: 'open', label: 'Em revisão' },
  { value: 'resolved', label: 'Corrigidas' },
  { value: 'rejected', label: 'Não aplicadas' },
  { value: 'all', label: 'Todas' },
];
const STATUS_TONE: Record<CorrectionStatus, 'warning' | 'success' | 'info'> = {
  open: 'warning',
  resolved: 'success',
  rejected: 'info',
};

/**
 * Fila de revisão das sugestões de correção enviadas pelos leitores. Abertas primeiro
 * (as mais antigas no topo); cada decisão pede confirmação e aceita uma observação.
 */
export function CorrectionsQueue({ onOpenCountChange }: { onOpenCountChange?: (count: number) => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState<CorrectionStatus | 'all'>('open');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<CorrectionForReview[]>([]);
  const [total, setTotal] = useState(0);
  const [decision, setDecision] = useState<{ item: CorrectionForReview; status: 'resolved' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    const result = await fetchCorrections(filter);
    if (!result.ok) {
      setState('error');
      return;
    }
    setItems(result.data.items);
    setTotal(result.data.total);
    if (filter === 'open') onOpenCountChange?.(result.data.total);
    setState('ready');
  }, [filter, onOpenCountChange]);

  useEffect(() => {
    // Carregamento inicial e troca de filtro: busca no servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const decide = async () => {
    if (!decision) return;
    setSaving(true);
    const result = await reviewCorrection(decision.item.id, decision.status, note.trim());
    setSaving(false);
    if (!result.ok) {
      toast.show({ tone: 'danger', title: 'Revisão não registrada', message: contentErrorMessage(result, 'registrar a revisão') });
      setDecision(null);
      if (result.reason === 'conflict') void load();
      return;
    }
    toast.show({
      tone: 'success',
      title: decision.status === 'resolved' ? 'Marcada como corrigida' : 'Marcada como não aplicada',
    });
    setDecision(null);
    setNote('');
    if (filter === 'open') {
      setItems((list) => list.filter((item) => item.id !== decision.item.id));
      setTotal((value) => {
        onOpenCountChange?.(value - 1);
        return value - 1;
      });
    } else {
      void load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted max-w-2xl">
          Enviadas pelos leitores em “Sugerir correção”. Corrija o Markdown do artigo e marque como corrigida; quem enviou acompanha em Minha conta.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="ui-label">Situação</span>
          <select className="ui-input !min-h-9 !w-auto !py-1" value={filter} onChange={(event) => setFilter(event.target.value as CorrectionStatus | 'all')}>
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div aria-live="polite" aria-busy={state === 'loading'}>
        {state === 'loading' && (
          <div className="grid gap-3" role="status" aria-label="Carregando sugestões">
            <Skeleton className="h-28 w-full !rounded-3xl" />
            <Skeleton className="h-28 w-full !rounded-3xl" />
          </div>
        )}
        {state === 'error' && (
          <ErrorState title="Não foi possível carregar as sugestões" action={<Button size="sm" onClick={() => void load()}>Tentar novamente</Button>}>
            Verifique se o serviço de contas está no ar.
          </ErrorState>
        )}
        {state === 'ready' && items.length === 0 && (
          <EmptyState title={filter === 'open' ? 'Nenhuma sugestão aguardando revisão' : 'Nada por aqui'} icon={<FilePenLine size={20} aria-hidden="true" />}>
            {filter === 'open' ? 'Quando um leitor sugerir uma correção, ela aparece aqui.' : 'Troque o filtro para ver outras situações.'}
          </EmptyState>
        )}
        {state === 'ready' && items.length > 0 && (
          <>
            <p className="sr-only">{total} sugestões</p>
            <ul className="grid gap-3">
              {items.map((item) => (
                <li key={item.id} className="glass-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ui-badge" data-tone={STATUS_TONE[item.status]}>
                          {CORRECTION_STATUS_LABEL[item.status]}
                        </span>
                        <span className="ui-badge">{KIND_LABEL[item.kind] ?? item.kind}</span>
                      </div>
                      <Link href={`/artigo/${item.article_id}`} className="ui-link mt-2 inline-block font-semibold">
                        {TITLES.get(item.article_id) ?? item.article_id}
                      </Link>
                    </div>
                    <p className="text-xs text-text-muted text-right">
                      {item.author_display_name ?? 'Conta removida'}
                      {item.author_username && <> · @{item.author_username}</>}
                      <br />
                      <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-text-body whitespace-pre-line break-words">{item.description}</p>
                  {item.excerpt && (
                    <blockquote className="mt-3 border-l-2 border-[color:var(--mesh-1)] pl-3 text-sm italic text-text-muted whitespace-pre-line break-words">
                      {item.excerpt}
                    </blockquote>
                  )}
                  {item.status !== 'open' && (
                    <p className="mt-3 text-xs text-text-muted">
                      Revisada por {item.resolver_display_name ?? '—'}
                      {item.resolved_at && <> em {formatDateTime(item.resolved_at)}</>}
                      {item.resolution_note && <> · “{item.resolution_note}”</>}
                    </p>
                  )}
                  {item.status === 'open' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="primary" onClick={() => { setNote(''); setDecision({ item, status: 'resolved' }); }}>
                        <CheckCircle2 size={15} aria-hidden="true" /> Marcar como corrigida
                      </Button>
                      <Button size="sm" onClick={() => { setNote(''); setDecision({ item, status: 'rejected' }); }}>
                        <XCircle size={15} aria-hidden="true" /> Não aplicar
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Dialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision?.status === 'resolved' ? 'Marcar como corrigida?' : 'Não aplicar a sugestão?'}
        description={
          decision?.status === 'resolved'
            ? 'Confirme depois de atualizar o artigo. Quem enviou verá a sugestão como corrigida.'
            : 'Explique, se possível, por que a sugestão não será aplicada. Quem enviou verá a observação.'
        }
        footer={
          <>
            <Button onClick={() => setDecision(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} loadingText="Salvando…" onClick={decide}>
              Confirmar
            </Button>
          </>
        }
      >
        <Field label="Observação (opcional)" hint={`${note.length}/500`}>
          {(control) => <textarea {...control} rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />}
        </Field>
      </Dialog>
    </div>
  );
}
