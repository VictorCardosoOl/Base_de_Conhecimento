'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bookmark, ChevronRight, Info, ShieldCheck } from 'lucide-react';
import { FAQ_DATA } from '@/features/articles/catalog';
import { Category, type FAQItem } from '@/features/articles/types';
import { useState, useCallback } from 'react';

/** Artigos por módulo, calculado uma vez (o catálogo é estático). */
const BY_MODULE: ReadonlyMap<Category, readonly FAQItem[]> = (() => {
  const map = new Map<Category, FAQItem[]>();
  for (const item of FAQ_DATA) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
})();

const MODULES = Object.values(Category).filter((cat) => cat !== Category.SOBRE);
const PREVIEW = 8;

export interface NavDrawerProps {
  id: string;
  open: boolean;
  currentCategory: Category | null;
  queueCount: number;
  onSelectCategory: (category: Category | null) => void;
  onSelectQueue: () => void;
  onOpenAbout: () => void;
  /** Abre os documentos institucionais (entrada: Termos de Uso). */
  onOpenPrivacy: () => void;
  onClose: () => void;
}

/**
 * Menu lateral: navegação pelos módulos e pelos artigos de cada um.
 *
 * - "Filtrar por módulo X" filtra a página inicial; a seta ao lado abre os artigos do
 *   módulo ali mesmo (até 8, mais "ver todos").
 * - Ao passar o mouse sobre o módulo (ou seus subitens), o menu de artigos expande; ao sair, recolhe.
 * - Abrindo um artigo, o módulo dele já aparece aberto e o artigo marcado.
 * - Fechado, sai do Tab e dos leitores de tela (inert). Movimento só em CSS.
 */
export function NavDrawer({
  id,
  open,
  currentCategory,
  queueCount,
  onSelectCategory,
  onSelectQueue,
  onOpenAbout,
  onOpenPrivacy,
  onClose,
}: NavDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory =
    pathname === '/' ? (searchParams?.get('category') as Category | null) ?? null : currentCategory;
  const currentArticleId = pathname?.startsWith('/artigo/')
    ? decodeURIComponent(pathname.slice('/artigo/'.length))
    : null;
  const currentArticleModule = useMemo(
    () => (currentArticleId ? FAQ_DATA.find((a) => a.id === currentArticleId)?.category ?? null : null),
    [currentArticleId]
  );

  const [expandedModules, setExpandedModules] = useState<Partial<Record<Category, boolean>>>({});

  const isExpanded = useCallback(
    (cat: Category) => expandedModules[cat] ?? cat === currentArticleModule,
    [expandedModules, currentArticleModule]
  );

  const toggleModule = useCallback(
    (cat: Category) => {
      setExpandedModules((prev) => ({
        ...prev,
        [cat]: !(prev[cat] ?? cat === currentArticleModule),
      }));
    },
    [currentArticleModule]
  );

  // Ao abrir, o foco vai para o primeiro item (o botão do cabeçalho devolve no fechar).
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const timerId = window.setTimeout(() => firstRef.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(timerId);
  }, [open]);

  let staggerIndex = 0;
  const stagger = () => ({ 'data-stagger': '', style: { ['--i' as string]: staggerIndex++ } });

  return (
    <>
      <div className="nav-scrim" data-open={open || undefined} onClick={onClose} aria-hidden="true" />
      <nav
        id={id}
        className="nav-drawer"
        data-open={open || undefined}
        aria-label="Menu principal"
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="nav-drawer-scroll">
          <p className="nav-section-title" {...stagger()}>
            Módulos
          </p>
          <ul className="space-y-0.5">
            {MODULES.map((cat, index) => {
              const articles = BY_MODULE.get(cat) ?? [];
              const active = selectedCategory === cat || currentArticleModule === cat;
              const listId = `${id}-${index}`;
              const isOpen = isExpanded(cat);
              const hasArticles = articles.length > 0;
              return (
                <li
                  key={cat}
                  {...stagger()}
                >
                  <div className="nav-module" data-active={active || undefined}>
                    <button
                      ref={index === 0 ? firstRef : undefined}
                      type="button"
                      className="nav-module-main"
                      aria-label={`Filtrar por módulo ${cat}`}
                      aria-current={selectedCategory === cat ? 'page' : undefined}
                      onClick={() => onSelectCategory(cat)}
                    >
                      <span className="truncate">{cat}</span>
                      <span className="nav-count" aria-hidden="true">
                        {articles.length}
                      </span>
                    </button>
                    {hasArticles && (
                      <button
                        type="button"
                        className="nav-module-expand"
                        aria-expanded={isOpen}
                        aria-controls={listId}
                        aria-label={`${isOpen ? 'Ocultar' : 'Ver'} artigos de ${cat}`}
                        onClick={() => toggleModule(cat)}
                      >
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {hasArticles && (
                    <div id={listId} className="nav-articles" data-expanded={isOpen || undefined}>
                      <div>
                        {/* Recolhido: fora do Tab também (a altura 0 não basta). */}
                        <ul inert={!isOpen ? true : undefined}>
                          {articles.slice(0, PREVIEW).map((article) => (
                            <li key={article.id}>
                              <Link
                                href={`/artigo/${article.id}`}
                                scroll={false}
                                prefetch={false}
                                className="nav-link line-clamp-2"
                                aria-current={article.id === currentArticleId ? 'page' : undefined}
                                onClick={onClose}
                              >
                                {article.question}
                              </Link>
                            </li>
                          ))}
                          {articles.length > PREVIEW && (
                            <li>
                              <button
                                type="button"
                                className="nav-link nav-link-more"
                                onClick={() => onSelectCategory(cat)}
                              >
                                Ver todos os {articles.length} artigos
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="nav-section-title mt-5" {...stagger()}>
            Atalhos
          </p>
          <ul className="space-y-0.5">
            <li {...stagger()}>
              <button type="button" className="nav-shortcut" onClick={onSelectQueue}>
                <Bookmark size={17} aria-hidden="true" />
                <span className="flex-1">Minha Lista</span>
                {queueCount > 0 && <span className="nav-count">{queueCount}</span>}
              </button>
            </li>
            <li {...stagger()}>
              <button type="button" className="nav-shortcut" onClick={onOpenAbout}>
                <Info size={17} aria-hidden="true" />
                Sobre o Projeto
              </button>
            </li>
            <li {...stagger()}>
              <button type="button" className="nav-shortcut" onClick={onOpenPrivacy}>
                <ShieldCheck size={17} aria-hidden="true" />
                LGPD e privacidade
              </button>
            </li>
          </ul>
        </div>
        <p className="nav-drawer-footer">
          <kbd className="font-sans">Ctrl</kbd> + <kbd className="font-sans">K</kbd> abre a busca completa ·{' '}
          <kbd className="font-sans">Esc</kbd> fecha
        </p>
      </nav>
    </>
  );
}
