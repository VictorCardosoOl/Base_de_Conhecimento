import React from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, RefreshCcw, UserCheck, UserRound } from 'lucide-react';
import type { FAQItem } from '@/features/articles/types';

/** O suficiente de um artigo do catálogo (FAQItem) ou lido do Markdown (ArticleFile). */
type HeroArticle = Pick<FAQItem, 'question' | 'answer' | 'lastReviewed' | 'validityMonths' | 'verifiedBy'> & {
  category: string;
  date?: string;
  author?: string;
};

/**
 * Cabeçalho do artigo: módulo, título, resposta curta (subtítulo) e metadados reais da
 * publicação. Só mostra autoria e revisão quando o artigo as declara (frontmatter
 * `author`, `verifiedBy`, `lastReviewed`): nada inventado. Fundo estático, sem desfoque.
 */
export function ArticleHero({
  article,
  titleId,
  headingLevel = 1,
  minutes,
  actions,
}: {
  article: HeroArticle;
  titleId?: string;
  headingLevel?: 1 | 2;
  /** Tempo estimado de leitura. */
  minutes?: number | null;
  /** Ações do artigo (salvar, compartilhar...), abaixo dos metadados. */
  actions?: React.ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const reviewed = article.lastReviewed && article.lastReviewed !== article.date ? article.lastReviewed : null;
  const meta = 'inline-flex items-center gap-1.5';

  return (
    <header className="article-hero relative isolate overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14 lg:px-16" data-testid="article-hero">
      <div className="relative max-w-3xl mx-auto">
        <Link
          href={`/?category=${encodeURIComponent(article.category)}`}
          className="ui-badge !text-[11px] hover:!text-text-main glass-focus"
          data-tone="info"
        >
          {article.category}
        </Link>

        <Heading
          id={titleId}
          className="mt-5 font-serif font-medium text-text-main text-[clamp(2rem,1.3rem+3vw,3.5rem)] leading-[1.08] tracking-[-0.02em]"
        >
          {article.question}
        </Heading>

        <p className="mt-5 font-serif text-[clamp(1.1rem,1rem+0.5vw,1.375rem)] leading-relaxed text-text-body">
          {article.answer}
        </p>

        <dl className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
          {article.author && (
            <div className={meta}>
              <dt className="sr-only">Autoria</dt>
              <UserRound size={15} aria-hidden="true" />
              <dd>{article.author}</dd>
            </div>
          )}
          {article.date && (
            <div className={meta}>
              <dt className="sr-only">Publicado em</dt>
              <CalendarDays size={15} aria-hidden="true" />
              <dd>Publicado em {article.date}</dd>
            </div>
          )}
          {reviewed && (
            <div className={meta}>
              <dt className="sr-only">Atualizado em</dt>
              <RefreshCcw size={14} aria-hidden="true" />
              <dd>Atualizado em {reviewed}</dd>
            </div>
          )}
          {article.verifiedBy && (
            <div className={meta}>
              <dt className="sr-only">Revisão técnica</dt>
              <UserCheck size={15} aria-hidden="true" />
              <dd>Revisado por {article.verifiedBy}</dd>
            </div>
          )}
          {minutes ? (
            <div className={meta}>
              <dt className="sr-only">Tempo de leitura</dt>
              <Clock size={15} aria-hidden="true" />
              <dd>{minutes} min de leitura</dd>
            </div>
          ) : null}
        </dl>

        {actions && <div className="mt-6">{actions}</div>}
      </div>
    </header>
  );
}
