'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePenLine } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateMessage';
import { Button } from '@/components/ui/Button';
import { FAQ_DATA } from '@/features/articles/catalog';
import { formatDateTime } from '@/features/content/components/ArticleComments';
import { CORRECTION_STATUS_LABEL, type Correction, fetchMyCorrections } from '@/features/content/content-client';

const TITLES = new Map(FAQ_DATA.map((item) => [item.id, item.question]));
const TONE = { open: 'warning', resolved: 'success', rejected: 'info' } as const;

/** Andamento das sugestões de correção enviadas por quem está na conta. */
export function MyCorrections() {
  const [items, setItems] = useState<Correction[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    fetchMyCorrections().then((result) => {
      if (!active) return;
      if (result.ok) {
        setItems(result.data);
        setFailed(false);
      } else {
        setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [reload]);

  return (
    <section aria-labelledby="my-corrections" className="glass-card p-6 h-full">
      <h2 id="my-corrections" className="flex items-center gap-2 text-base font-semibold text-text-main">
        <FilePenLine size={17} aria-hidden="true" className="text-[color:var(--mesh-1)]" /> Minhas sugestões de correção
      </h2>
      <div className="mt-4" aria-live="polite">
        {failed ? (
          <ErrorState title="Não foi possível carregar suas sugestões" className="!py-6" action={<Button size="sm" onClick={() => setReload((n) => n + 1)}>Tentar novamente</Button>} />
        ) : items === null ? (
          <div className="space-y-2" role="status" aria-label="Carregando sugestões">
            <Skeleton className="h-12 w-full !rounded-2xl" />
            <Skeleton className="h-12 w-full !rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma sugestão enviada" className="!py-6">
            Viu algo errado num artigo? Use “Sugerir correção” no fim da leitura.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)]">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/artigo/${item.article_id}`} className="ui-link text-sm font-medium">
                    {TITLES.get(item.article_id) ?? item.article_id}
                  </Link>
                  <span className="ui-badge" data-tone={TONE[item.status]}>{CORRECTION_STATUS_LABEL[item.status]}</span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{item.description}</p>
                <p className="text-xs text-text-muted">
                  Enviada em <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
                  {item.resolution_note && <> · Resposta: “{item.resolution_note}”</>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
