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
    <section aria-labelledby={`related-${articleId}`} className="below-fold">
      <h2 id={`related-${articleId}`} className="ui-label mb-3">
        Veja também
      </h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/artigo/${item.id}`}
              replace={replace}
              scroll={false}
              className="glass-card glass-interactive glass-focus flex h-full flex-col gap-2 p-5"
            >
              <span className="ui-badge self-start">{item.category}</span>
              <span className="font-serif text-lg leading-snug text-text-main line-clamp-3">{item.question}</span>
              <span className="text-sm text-text-muted line-clamp-2">{item.answer}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
