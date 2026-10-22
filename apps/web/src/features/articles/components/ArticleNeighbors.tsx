import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FAQ_DATA } from '@/features/articles/catalog';

/** Anterior/próximo dentro do mesmo módulo (a ordem é a do catálogo). */
export function neighborsOf(id: string) {
  const current = FAQ_DATA.find((item) => item.id === id);
  if (!current) return { previous: null, next: null };
  const sameModule = FAQ_DATA.filter((item) => item.category === current.category);
  const index = sameModule.findIndex((item) => item.id === id);
  return {
    previous: index > 0 ? sameModule[index - 1] : null,
    next: index >= 0 && index < sameModule.length - 1 ? sameModule[index + 1] : null,
  };
}

/**
 * Continuação da leitura: artigo anterior e próximo do módulo. No modal, `replace`
 * troca o artigo sem empilhar histórico (voltar fecha o modal, como esperado).
 */
export function ArticleNeighbors({ articleId, replace = false }: { articleId: string; replace?: boolean }) {
  const { previous, next } = neighborsOf(articleId);
  if (!previous && !next) return null;

  const card =
    'glass-card glass-interactive glass-focus group flex flex-col gap-2 p-5 sm:p-6 min-h-[7.5rem] justify-between';

  return (
    <nav aria-label="Continue lendo" className="below-fold grid grid-cols-1 sm:grid-cols-2 gap-4">
      {previous ? (
        <Link href={`/artigo/${previous.id}`} replace={replace} scroll={false} className={card}>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Anterior
          </span>
          <span className="font-serif text-lg leading-snug text-text-main line-clamp-2">{previous.question}</span>
        </Link>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
      {next && (
        <Link href={`/artigo/${next.id}`} replace={replace} scroll={false} className={`${card} sm:text-right`}>
          <span className="inline-flex items-center gap-1.5 sm:justify-end text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Próximo
            <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
          <span className="font-serif text-lg leading-snug text-text-main line-clamp-2">{next.question}</span>
        </Link>
      )}
    </nav>
  );
}
