import React from 'react';
import Link from 'next/link';
import { relatedArticles } from '@/features/articles/article-meta';
import { neighborsOf } from './ArticleNeighbors';

/** "Veja também": até 3 artigos com tags em comum (fora anterior/próximo). */
export function RelatedArticles({ articleId, replace = false }: { articleId: string; replace?: boolean }) {
  const { previous, next } = neighborsOf(articleId);
  const items = relatedArticles(articleId, [previous?.id, next?.id].filter(Boolean) as string[]);
  if (!items.length) return null;
  return (
    <section aria-labelledby={`related-${articleId}`} className="below-fold border-t border-border pt-10 sm:pt-14 mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 id={`related-${articleId}`} className="text-xs uppercase tracking-[0.2em] font-mono font-semibold text-text-muted">
          Veja também
        </h2>
        <span className="text-xs font-mono text-text-muted">{items.length} leituras relacionadas</span>
      </div>
      <ul className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {items.map((item, index) => (
          <li key={item.id} className={index > 0 ? 'pt-6 sm:pt-0 sm:pl-8' : 'pt-6 sm:pt-0'}>
            <Link
              href={`/artigo/${item.id}`}
              replace={replace}
              scroll={false}
              className="group flex h-full flex-col gap-2.5 transition-colors"
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-medium">{item.category}</span>
              <span className="font-serif text-lg sm:text-xl leading-snug text-text-main line-clamp-3 group-hover:underline underline-offset-4 decoration-1">
                {item.question}
              </span>
              <span className="text-xs sm:text-sm text-text-muted line-clamp-2 font-light leading-relaxed mt-1">
                {item.answer}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
