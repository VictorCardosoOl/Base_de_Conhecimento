'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { ArticleGrid } from './ArticleGrid';
import { FAQ_DATA } from '@/features/articles/catalog';
import { articleTime as timeOf, recentArticles } from '@/features/articles/article-meta';
import { IntroHero } from './IntroHero';
import { Category } from '@/features/articles/types';
import { useSearch } from '@/features/search/use-search';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/StateMessage';

const MODULES = Object.values(Category).filter((cat) => cat !== Category.SOBRE);
const COUNTS: ReadonlyMap<string, number> = (() => {
  const map = new Map<string, number>();
  for (const item of FAQ_DATA) map.set(item.category, (map.get(item.category) ?? 0) + 1);
  return map;
})();
const SEARCH_KEYS = ['question', 'tags', 'answer', 'category', 'searchText'];
const SEARCH_OPTIONS = { keys: SEARCH_KEYS, threshold: 0.4 };

type Sort = 'relevance' | 'recent' | 'az';


/** Os mais recentes (publicados ou revisados), para o destaque da página inicial. */
const RECENT = recentArticles(3);

function chipClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-2 rounded-[20px] px-4 py-2 min-h-10 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 active:scale-95 glass-focus ${
    active
      ? 'text-bg-main bg-text-main shadow-[var(--glass-shadow-2)] ring-1 ring-text-main/20'
      : 'glass-flat !rounded-[20px] text-text-main/90 hover:text-text-main hover:bg-[var(--glass-bg-hover)] hover:shadow-xs'
  }`;
}

/**
 * Seleção de artigos: módulos em pílulas (filtro pela URL, para o menu e o voltar do
 * navegador concordarem), filtro por texto dentro da lista, ordenação e, na visão geral,
 * os atualizados recentemente.
 */
export function HomeGrid({ categoryParam }: { categoryParam: string | null }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('relevance');
  const inModule = useMemo(
    () => (categoryParam ? FAQ_DATA.filter((a) => a.category === categoryParam) : FAQ_DATA),
    [categoryParam]
  );
  const found = useSearch(inModule, query, SEARCH_OPTIONS);
  const articles = useMemo(() => {
    if (sort === 'recent') return [...found].sort((a, b) => timeOf(b) - timeOf(a));
    if (sort === 'az') return [...found].sort((a, b) => a.question.localeCompare(b.question, 'pt-BR'));
    return found;
  }, [found, sort]);

  if (categoryParam === Category.SOBRE) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <IntroHero />
      </div>
    );
  }

  const filtering = query.trim().length > 0;
  const countLabel = `${articles.length} ${articles.length === 1 ? 'artigo' : 'artigos'}${
    categoryParam ? ` em ${categoryParam}` : ''
  }${filtering ? ` para “${query.trim()}”` : ''}`;

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <div className="space-y-2">
          <p className="ui-eyebrow">Saúde e Segurança do Trabalho · eSocial</p>
          <h1 className="font-serif text-[clamp(2.2rem,1.4rem+3vw,3.75rem)] leading-[1.02] tracking-[-0.02em] text-text-main">
            Base de Conhecimento
          </h1>
          <p className="text-text-muted" aria-live="polite">
            {countLabel}
          </p>
        </div>

        <nav aria-label="Módulos" className="-mx-1 overflow-x-auto no-scrollbar">
          <ul className="flex gap-2 px-1 pb-1">
            <li>
              <Link href="/" scroll={false} className={chipClass(!categoryParam)} aria-current={!categoryParam ? 'page' : undefined}>
                Todos
                <span className="text-xs opacity-75 tabular-nums">{FAQ_DATA.length}</span>
              </Link>
            </li>
            {MODULES.filter((cat) => COUNTS.has(cat)).map((cat) => (
              <li key={cat}>
                <Link
                  href={`/?category=${encodeURIComponent(cat)}`}
                  scroll={false}
                  className={chipClass(categoryParam === cat)}
                  aria-current={categoryParam === cat ? 'page' : undefined}
                >
                  {cat}
                  <span className="text-xs opacity-75 tabular-nums">{COUNTS.get(cat)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col sm:flex-row gap-3" role="search">
          <label className="relative flex-1 max-w-xl">
            <span className="sr-only">Filtrar artigos{categoryParam ? ` de ${categoryParam}` : ''}</span>
            <Search size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={categoryParam ? `Filtrar em ${categoryParam}…` : 'Filtrar por título, tema ou palavra-chave…'}
              className="ui-input !pl-10"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="ui-label whitespace-nowrap">Ordenar</span>
            <select className="ui-input sm:!w-auto" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="relevance">{filtering ? 'Relevância' : 'Padrão'}</option>
              <option value="recent">Mais recentes</option>
              <option value="az">Título (A–Z)</option>
            </select>
          </label>
        </div>
      </header>

      {!categoryParam && !filtering && RECENT.length > 0 && (
        <section aria-labelledby="recentes">
          <h2 id="recentes" className="ui-label mb-3">
            Atualizados recentemente
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {RECENT.map((item) => (
              <li key={item.id}>
                <Link href={`/artigo/${item.id}`} scroll={false} className="glass-card glass-interactive glass-focus flex h-full flex-col gap-1.5 p-5">
                  <span className="text-xs text-text-muted">
                    {item.category} · {item.lastReviewed || item.date}
                  </span>
                  <span className="font-serif text-lg leading-snug text-text-main line-clamp-2">{item.question}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* key: trocar de módulo refaz a entrada em cascata (CSS) */}
      {articles.length ? (
        <ArticleGrid key={categoryParam ?? 'todos'} items={articles} />
      ) : filtering ? (
        <EmptyState
          className="glass-card"
          icon={<Search size={20} aria-hidden="true" />}
          title={`Nada encontrado para “${query.trim()}”`}
          action={
            <Button size="sm" onClick={() => setQuery('')}>
              <X size={14} aria-hidden="true" /> Limpar filtro
            </Button>
          }
        >
          Tente outro termo, um sinônimo ou procure em todos os módulos.
        </EmptyState>
      ) : (
        <EmptyState className="glass-card" title="Nenhum artigo neste módulo ainda." />
      )}
    </div>
  );
}
