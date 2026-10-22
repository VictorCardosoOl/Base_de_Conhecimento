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
    <header
      className="article-hero relative isolate overflow-hidden rounded-[20px] border border-border px-6 py-10 sm:px-12 sm:py-14 lg:px-16 bg-bg-island shadow-[var(--glass-shadow-1)]"
      data-testid="article-hero"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5 mb-8">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/?category=${encodeURIComponent(article.category)}`}
              className="inline-flex items-center gap-1.5 rounded-[20px] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-bg-main bg-text-main shadow-xs hover:opacity-90 transition-opacity glass-focus"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-bg-main opacity-90" aria-hidden="true" />
              {article.category}
            </Link>
            <span className="text-xs uppercase tracking-widest text-text-muted font-mono font-medium">Documento Oficial</span>
          </div>

          {minutes ? (
            <div className={`${meta} text-xs font-mono uppercase tracking-wider text-text-muted`}>
              <Clock size={14} aria-hidden="true" />
              <span>{minutes} min de leitura</span>
            </div>
          ) : null}
        </div>

        <Heading
          id={titleId}
          className="font-serif font-normal text-text-main text-[clamp(2.1rem,1.6rem+3vw,3.5rem)] leading-[1.08] tracking-[-0.03em]"
        >
          {article.question}
        </Heading>

        <p className="mt-6 text-[clamp(1.1rem,1rem+0.4vw,1.3rem)] leading-relaxed text-text-muted max-w-3xl font-sans font-light">
          {article.answer}
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-xs sm:text-sm text-text-muted border-t border-border pt-6">
          {article.author && (
            <div className={meta}>
              <dt className="sr-only">Autoria</dt>
              <UserRound size={15} aria-hidden="true" />
              <dd className="font-medium text-text-main">{article.author}</dd>
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
        </dl>

        {actions && <div className="mt-8 pt-6 border-t border-border">{actions}</div>}
      </div>
    </header>
  );
}
