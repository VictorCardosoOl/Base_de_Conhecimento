'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Command, CornerDownLeft } from 'lucide-react';
import { FAQ_DATA } from '@/features/articles/catalog';
import { useSearch } from '@/features/search/use-search';

const MAX_RESULTS = 6;
const SEARCH_KEYS = ['question', 'tags', 'answer', 'category', 'searchText'];

/** Abre a paleta de comandos (busca completa), o mesmo atalho do Ctrl+K. */
function openCommandPalette() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
}

/**
 * Busca no cabeçalho: um botão com lupa que se expande num campo de vidro com resultados
 * imediatos (padrão combobox da WAI-ARIA: setas, Enter, Esc). Recolhe com Esc, no "×", ao
 * clicar fora ou ao trocar de página. No celular, o campo ocupa o cabeçalho inteiro.
 */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const optionId = (index: number) => `${listId}-opt-${index}`;

  const matches = useSearch(FAQ_DATA, query, { keys: SEARCH_KEYS, threshold: 0.4 });
  const results = query.trim() ? matches.slice(0, MAX_RESULTS) : [];
  const activeIndex = results.length ? Math.min(active, results.length - 1) : -1;

  // A lupa só volta a existir depois do recolhimento: o foco vai para ela no efeito.
  const focusLupaOnClose = useRef(false);
  const close = (restoreFocus = false) => {
    focusLupaOnClose.current = restoreFocus;
    setOpen(false);
    setActive(0);
  };

  // Aberto: foco no campo (depois da expansão começar). Recolhido: foco de volta à lupa.
  useEffect(() => {
    if (!open) {
      if (focusLupaOnClose.current) buttonRef.current?.focus();
      focusLupaOnClose.current = false;
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  // Clique fora recolhe.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Trocou de página: recolhe e limpa.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setOpen(false);
    setQuery('');
  }, [pathname]);

  const goTo = (id: string) => {
    router.push(`/artigo/${id}`, { scroll: false });
    setQuery('');
    close();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation(); // não fecha outros diálogos por engano
      if (query) setQuery('');
      else close(true);
    } else if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActive((activeIndex + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActive((activeIndex - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) goTo(String(results[activeIndex].id));
      else if (query.trim()) openCommandPalette();
    }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="header-search" data-open={open || undefined}>
      {!open && (
        <div className="group relative">
          <button
            ref={buttonRef}
            type="button"
            className="nav-icon-button"
            aria-label="Pesquisar artigos"
            aria-expanded={false}
            aria-controls={`${listId}-field`}
            onClick={() => setOpen(true)}
          >
            <Search size={20} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <span className="nav-tooltip" aria-hidden="true">
            Pesquisar
          </span>
        </div>
      )}

      {open && (
        <div id={`${listId}-field`} className="header-search-field" role="search">
          <Search size={18} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label="Pesquisar artigos"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            placeholder="Ex.: Como enviar o S-2240"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="flex-1 min-w-0 bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            className="header-search-close"
            aria-label="Fechar pesquisa"
            onClick={() => close(true)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {showPanel && (
        <div className="header-search-panel">
          {results.length ? (
            <ul id={listId} role="listbox" aria-label="Artigos encontrados" className="space-y-0.5">
              {results.map((item, index) => (
                <li
                  key={item.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerDown={(event) => event.preventDefault()} // mantém o foco no campo
                  onClick={() => goTo(String(item.id))}
                  onPointerEnter={() => setActive(index)}
                  className="header-search-option"
                >
                  <span className="block text-sm font-medium text-text-main line-clamp-1">{item.question}</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-text-muted">{item.category}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="px-3 py-3 text-sm text-text-muted">
              Nenhum artigo encontrado para “{query.trim()}”.
            </p>
          )}
          <div className="mt-1.5 pt-2 border-t border-border flex items-center justify-between gap-3 px-2 text-[11px] text-text-muted">
            <span className="hidden sm:inline-flex items-center gap-1">
              <CornerDownLeft size={12} aria-hidden="true" /> abrir · Esc fecha
            </span>
            <button
              type="button"
              onClick={() => {
                close();
                openCommandPalette();
              }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:text-text-main hover:bg-[var(--glass-bg-hover)] transition-colors glass-focus"
            >
              Busca completa <Command size={11} aria-hidden="true" />K
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
