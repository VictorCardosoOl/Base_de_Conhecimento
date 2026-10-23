'use client';
import React from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, RefreshCcw, UserCheck, UserRound } from 'lucide-react';
import type { FAQItem } from '@/features/articles/types';

/** O suficiente de um artigo do catálogo (FAQItem) ou lido do Markdown (ArticleFile). */
type HeroArticle = Pick<FAQItem, 'question' | 'answer' | 'lastReviewed' | 'validityMonths' | 'verifiedBy'> & {
  id?: string;
  category: string;
  date?: string;
  author?: string;
};

/**
 * Cabeçalho do artigo: módulo, título, resposta curta (subtítulo) e metadados reais da
 * publicação. Só mostra autoria e revisão quando o artigo as declara (frontmatter
 * `author`, `verifiedBy`, `lastReviewed`): nada inventado. Editorial limpo, sem caixa ao redor.
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
  minutes?: number | null;
  actions?: React.ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const reviewed = article.lastReviewed && article.lastReviewed !== article.date ? article.lastReviewed : null;
  const meta = 'inline-flex items-center gap-1.5';

  return (
    <header
      className="article-hero relative isolate w-full border-b border-border pb-10 sm:pb-14 transition-colors"
      data-testid="article-hero"
    >
      <div className="relative w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/?category=${encodeURIComponent(article.category)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bg-main bg-text-main hover:opacity-90 transition-opacity rounded-full"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-bg-main opacity-90" aria-hidden="true" />
              <span>{article.category}</span>
            </Link>
            <span className="text-[11px] uppercase tracking-widest text-text-muted font-mono font-medium">Documento Oficial</span>
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
          className="font-serif font-normal text-text-main text-[clamp(2.4rem,2rem+3.5vw,4.5rem)] leading-[1.06] tracking-[-0.035em] max-w-5xl"
        >
          {article.question}
        </Heading>

        <p className="mt-6 sm:mt-8 text-[clamp(1.15rem,1.05rem+0.5vw,1.45rem)] leading-relaxed text-text-muted max-w-4xl font-serif italic font-normal">
          {article.answer}
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs sm:text-sm text-text-muted border-t border-border/60 pt-6">
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

        {actions && <div className="mt-6 pt-6 border-t border-border/60">{actions}</div>}
      </div>
    </header>
  );
}
