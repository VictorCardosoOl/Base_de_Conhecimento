import React, { useEffect, useState, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, Hash, Sun, Moon, Archive, Bookmark, X, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FAQItem, Category } from '../../types/index';
import { FAQ_DATA } from '../../constants/index';
import { useSearch } from '../../hooks/useSearch';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: FAQItem) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onSelectCategory: (cat: Category | null) => void;
  onSelectQueue: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen, onClose, onSelectArticle, onToggleTheme, isDarkMode, onSelectCategory, onSelectQueue
}) => {
  const [inputValue, setInputValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fuzzy Search for Articles
  const filteredArticles = useSearch(FAQ_DATA, inputValue, {
    keys: ['question', 'tags', 'answer', 'category', 'searchText'],
    threshold: 0.4
  });

  // Manual filter helpers for static items
  const isMatch = (text: string) => text.toLowerCase().includes(inputValue.toLowerCase());
  const showLibrary = !inputValue || isMatch("Biblioteca Completa") || isMatch("Todos os documentos");
  const showQueue = !inputValue || isMatch("Minha Lista de Leitura") || isMatch("Artigos salvos");
  const showTheme = !inputValue || isMatch("Alternar para Modo") || isMatch("Tema") || isMatch("Claro") || isMatch("Escuro");

  // Reset input when opening
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      const tl = gsap.timeline({
        onComplete: () => {
          inputRef.current?.focus();
        }
      });
      tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "power2.out" })
        .fromTo(modalRef.current, { opacity: 0, scale: 0.985, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: 0.15, ease: "power3.out" }, "-=0.08");
    }
  }, { dependencies: [isOpen], scope: containerRef });

  // Lock Body Scroll & Handle ESC
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-stone-900/40 dark:bg-black/80 backdrop-blur-md opacity-0"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="w-full max-w-2xl relative shadow-2xl shadow-stone-900/20 dark:shadow-black/60 rounded-3xl overflow-hidden opacity-0 border border-border bg-bg-island backdrop-blur-2xl"
      >
        <Command
          className="w-full bg-transparent overflow-hidden"
          loop
          shouldFilter={false} // We handle filtering manually via useSearch
        >
          {/* Campo de Busca Superior */}
          <div className="flex items-center border-b border-border px-5 py-1 relative">
            <Search className="w-5 h-5 text-text-muted mr-3.5 shrink-0" strokeWidth={1.5} />
            <Command.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="O que você procura?"
              className="flex-1 h-14 bg-transparent outline-none text-base sm:text-lg text-text-main placeholder:text-text-muted font-serif font-light"
            />
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-text-muted bg-stone-100 dark:bg-white/10 px-2 py-1 rounded-md border border-border">
              <span className="font-bold">ESC</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar busca"
              className="sm:hidden p-2 text-text-muted hover:text-text-main transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Lista de Resultados */}
          <Command.List
            className="max-h-[60vh] overflow-y-auto p-3 scroll-py-2 no-scrollbar"
            data-lenis-prevent
          >
            <Command.Empty className="py-12 text-center text-text-muted">
              <p className="font-serif italic text-base">Nenhum resultado encontrado para sua busca.</p>
            </Command.Empty>

            {!inputValue && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-70">
                Navegação & Atalhos
              </div>
            )}

            {(showLibrary || showQueue) && (
              <Command.Group heading="" className="space-y-1">
                {showLibrary && (
                  <Command.Item
                    onSelect={() => { onSelectCategory(null); onClose(); }}
                    className="flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer text-text-main hover:bg-stone-100/80 dark:hover:bg-white/10 transition-colors duration-150 group aria-selected:bg-stone-100/90 dark:aria-selected:bg-white/10"
                  >
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/10 border border-border flex items-center justify-center text-text-main group-hover:scale-105 transition-transform duration-150 shrink-0">
                      <Archive size={17} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm text-text-main">Biblioteca Completa</span>
                      <span className="text-xs text-text-muted truncate">Visualizar todos os documentos e diretrizes</span>
                    </div>
                  </Command.Item>
                )}

                {showQueue && (
                  <Command.Item
                    onSelect={() => { onSelectQueue(); onClose(); }}
                    className="flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer text-text-main hover:bg-stone-100/80 dark:hover:bg-white/10 transition-colors duration-150 group aria-selected:bg-stone-100/90 dark:aria-selected:bg-white/10"
                  >
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/10 border border-border flex items-center justify-center text-text-main group-hover:scale-105 transition-transform duration-150 shrink-0">
                      <Bookmark size={17} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm text-text-main">Minha Lista de Leitura</span>
                      <span className="text-xs text-text-muted truncate">Acessar seus artigos e tópicos salvos</span>
                    </div>
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {filteredArticles.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-70">
                  Artigos e Conhecimento
                </div>
                {/* Limita a renderização aos 15 primeiros para garantir resposta 120Hz sem quebra de frame */}
                {filteredArticles.slice(0, 15).map((item) => (
                  <Command.Item
                    key={item.id}
                    onSelect={() => {
                      onSelectArticle(item);
                      onClose();
                    }}
                    className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-stone-100/80 dark:hover:bg-white/10 cursor-pointer text-text-main transition-colors duration-150 group aria-selected:bg-stone-100/90 dark:aria-selected:bg-white/10"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="mt-0.5 w-7 h-7 rounded-lg border border-border bg-stone-50 dark:bg-white/5 flex items-center justify-center text-text-muted group-hover:text-text-main group-hover:border-text-main/30 transition-colors shrink-0">
                        <Hash size={13} strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-serif text-base font-normal leading-snug text-text-main group-hover:text-text-main transition-colors truncate">
                          {item.question}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted bg-stone-100 dark:bg-white/10 border border-border px-1.5 py-0.5 rounded shrink-0">
                            {item.category}
                          </span>
                          <span className="text-xs text-text-muted truncate opacity-80">
                            {item.answer.substring(0, 65)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 shrink-0 text-text-muted group-hover:text-text-main">
                      <ArrowRight size={15} strokeWidth={1.5} />
                    </div>
                  </Command.Item>
                ))}
              </div>
            )}

            {showTheme && (
              <div className="mt-3 border-t border-border pt-2">
                <Command.Item
                  onSelect={() => { onToggleTheme(); onClose(); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100/80 dark:hover:bg-white/10 cursor-pointer text-text-muted hover:text-text-main transition-colors duration-150 aria-selected:bg-stone-100/90 dark:aria-selected:bg-white/10"
                >
                  {isDarkMode ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
                  <span className="text-xs font-medium uppercase tracking-wider">Alternar para Modo {isDarkMode ? 'Claro' : 'Escuro'}</span>
                </Command.Item>
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
