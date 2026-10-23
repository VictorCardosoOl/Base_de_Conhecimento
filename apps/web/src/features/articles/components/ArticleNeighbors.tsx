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

  return (
    <nav aria-label="Continue lendo" className="below-fold border-t border-border pt-10 sm:pt-14 mt-12 sm:mt-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
        {previous ? (
          <Link
            href={`/artigo/${previous.id}`}
            replace={replace}
            scroll={false}
            className="group flex flex-col gap-2.5 py-2 text-left"
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted font-mono">
              <ArrowLeft size={13} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1" />
              Anterior
            </span>
            <span className="font-serif text-xl sm:text-2xl leading-snug text-text-main line-clamp-2 group-hover:underline underline-offset-4 decoration-1">
              {previous.question}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={`/artigo/${next.id}`}
            replace={replace}
            scroll={false}
            className="group flex flex-col gap-2.5 py-2 sm:text-right sm:items-end"
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted font-mono">
              Próximo
              <ArrowRight size={13} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
            <span className="font-serif text-xl sm:text-2xl leading-snug text-text-main line-clamp-2 group-hover:underline underline-offset-4 decoration-1">
              {next.question}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
