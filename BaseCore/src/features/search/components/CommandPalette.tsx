import React, { useEffect, useState, useRef } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Hash,
  Sun,
  Moon,
  Archive,
  Bookmark,
  Mic,
  ArrowRight,
} from 'lucide-react';
import { FAQItem, Category } from '@/types/index';
import { FAQ_DATA } from '@/config/index';
import { useSearch } from '@/hooks/use-search';
import { AnalyticsService } from '@/services/analytics-service';
import { ReadingExperienceService } from '@/services/reading-experience-service';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useDebounce } from '@/hooks/use-debounce';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const PALETTE_STRINGS = {
  LIBRARY: ['Biblioteca Completa', 'Todos os documentos'],
  QUEUE: ['Minha Lista de Leitura', 'Artigos salvos'],
  THEME: ['Alternar para Modo', 'Tema', 'Claro', 'Escuro'],
};

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
  isOpen,
  onClose,
  onSelectArticle,
  onToggleTheme,
  isDarkMode,
  onSelectCategory,
  onSelectQueue,
}) => {
  const [inputValue, setInputValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [mounted, setMounted] = useState(false);

  // Handle open/close animations
  useGSAP(() => {
    if (isOpen) {
      setMounted(true);
    } else if (mounted) {
      // Animate out
      const tl = gsap.timeline({
        onComplete: () => setMounted(false)
      });
      if (backdropRef.current) tl.to(backdropRef.current, { opacity: 0, duration: 0.22, ease: 'power3.in' }, 0);
      if (modalRef.current) tl.to(modalRef.current, { opacity: 0, scale: 0.97, y: 6, duration: 0.22, ease: 'power3.in' }, 0);
    }
  }, [isOpen]);

  useGSAP(() => {
    if (mounted && isOpen) {
      // Animate in
      if (backdropRef.current) gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power4.out' });
      if (modalRef.current) gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.96, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power4.out', delay: 0.05 });
    }
  }, [mounted]);

  useFocusTrap(modalRef, isOpen);

  // Fuzzy Search for Articles
  const filteredArticles = useSearch(FAQ_DATA, inputValue, {
    keys: ['question', 'tags', 'answer', 'category', 'searchText'],
    threshold: 0.4,
  });

  // Manual filter helpers for static items
  const isMatch = (text: string) =>
    text.toLowerCase().includes(inputValue.toLowerCase());
  
  const showLibrary = !inputValue || PALETTE_STRINGS.LIBRARY.some(isMatch);
  const showQueue = !inputValue || PALETTE_STRINGS.QUEUE.some(isMatch);
  const showTheme = !inputValue || PALETTE_STRINGS.THEME.some(isMatch);

  // Reset input when opening
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      // Delay autoFocus to match animation timing
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const debouncedInput = useDebounce(inputValue, 600);

  // Telemetria de buscas via background scheduling
  useEffect(() => {
    if (!debouncedInput || debouncedInput.trim().length < 2) return;
    
    const safeInput = debouncedInput.trim().slice(0, 100); // Sanitização básica de tamanho

    const logSearchTask = () => {
      AnalyticsService.logSearch(safeInput, filteredArticles.length);
      ReadingExperienceService.addRecentSearch(safeInput);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(logSearchTask);
    } else {
      setTimeout(logSearchTask, 0);
    }
  }, [debouncedInput, filteredArticles.length]);

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

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-stone-900/40 dark:bg-black/80 will-change-[opacity]"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Comandos e Busca"
        className="w-full max-w-2xl relative will-change-[transform,opacity] transform-gpu"
      >
        <Command
          className="w-full bg-transparent outline-none flex flex-col gap-4"
          loop
          shouldFilter={false} // We handle filtering manually via useSearch
        >
          {/* Campo de Busca Superior */}
          <div className="flex items-center px-6 py-3.5 bg-white dark:bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-200/50 relative">
            <Search
              className="w-5 h-5 text-stone-400 mr-3 shrink-0"
              strokeWidth={2}
            />
            <Command.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Lorem"
              className="flex-1 bg-transparent outline-none text-base sm:text-lg text-stone-800 placeholder:text-stone-300 font-sans font-light"
            />
          </div>

          {/* Lista de Resultados */}
          <div className="bg-white dark:bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-200/50 overflow-hidden">
            <Command.List
              className="max-h-[50vh] overflow-y-auto p-4 scroll-py-2 no-scrollbar"
              data-lenis-prevent
              aria-live="polite"
              aria-atomic="true"
            >
              <Command.Empty className="py-12 px-6 flex flex-col items-center text-center">
                <p className="font-serif text-lg text-stone-800 mb-2">
                  Nenhum resultado para "{inputValue}"
                </p>
                <p className="text-sm text-stone-500 mb-6 max-w-sm">
                  Não encontrou o que procurava? Sugira este tópico para que possamos adicioná-lo à nossa base de conhecimento.
                </p>
                <button 
                  onClick={() => {
                    window.location.href = `mailto:suporte@exemplo.com?subject=Sugestão de Artigo: ${encodeURIComponent(inputValue)}`;
                  }}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Solicitar artigo sobre "{inputValue.substring(0, 20)}{inputValue.length > 20 ? '...' : ''}"
                </button>
              </Command.Empty>

              {!inputValue && (
                <div className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Navegação & Atalhos
                </div>
              )}

              {(showLibrary || showQueue) && (
                <Command.Group heading="" className="space-y-1">
                  {showLibrary && (
                    <Command.Item
                      onSelect={() => {
                        onSelectCategory(null);
                        onClose();
                      }}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer text-stone-800 hover:bg-stone-50 transition-colors duration-150 group aria-selected:bg-stone-50"
                    >
                      <Search className="w-4 h-4 text-stone-400 shrink-0 group-hover:text-stone-600 transition-colors" strokeWidth={2} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-sans text-base font-normal text-stone-400">
                          {inputValue ? <><span className="text-stone-400">{inputValue}</span> <span className="text-stone-800">em Biblioteca Completa</span></> : <span className="text-stone-800">Biblioteca Completa</span>}
                        </span>
                      </div>
                    </Command.Item>
                  )}

                  {showQueue && (
                    <Command.Item
                      onSelect={() => {
                        onSelectQueue();
                        onClose();
                      }}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer text-stone-800 hover:bg-stone-50 transition-colors duration-150 group aria-selected:bg-stone-50"
                    >
                      <Search className="w-4 h-4 text-stone-400 shrink-0 group-hover:text-stone-600 transition-colors" strokeWidth={2} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-sans text-base font-normal text-stone-400">
                           {inputValue ? <><span className="text-stone-400">{inputValue}</span> <span className="text-stone-800">na Minha Lista</span></> : <span className="text-stone-800">Minha Lista de Leitura</span>}
                        </span>
                      </div>
                    </Command.Item>
                  )}
                </Command.Group>
              )}

              {filteredArticles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Sugestões
                  </div>
                  {filteredArticles.slice(0, 15).map((item) => (
                    <Command.Item
                      key={item.id}
                      onSelect={() => {
                        onSelectArticle(item);
                        onClose();
                      }}
                      className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl hover:bg-stone-50 cursor-pointer text-stone-800 transition-colors duration-150 group aria-selected:bg-stone-50"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Search className="w-4 h-4 text-stone-400 shrink-0 group-hover:text-stone-600 transition-colors" strokeWidth={2} />
                        <span className="font-sans text-base font-normal truncate">
                           {inputValue ? (
                             <>
                               <span className="text-stone-400">{inputValue}</span>
                               <span className="text-stone-800 ml-1">
                                 {item.question.toLowerCase().startsWith(inputValue.toLowerCase()) 
                                   ? item.question.substring(inputValue.length) 
                                   : item.question}
                               </span>
                             </>
                           ) : (
                             <span className="text-stone-800">{item.question}</span>
                           )}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </div>
              )}

              {showTheme && (
                <div className="mt-2 border-t border-stone-100 pt-2 space-y-1">
                  <Command.Item
                    onSelect={() => {
                      onToggleTheme();
                      onClose();
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-stone-50 cursor-pointer transition-colors duration-150 aria-selected:bg-stone-50 group"
                  >
                    <Search className="w-4 h-4 text-stone-400 shrink-0 group-hover:text-stone-600 transition-colors" strokeWidth={2} />
                    <span className="font-sans text-base font-normal text-stone-800">
                      Alternar para Modo {isDarkMode ? 'Claro' : 'Escuro'}
                    </span>
                  </Command.Item>
                </div>
              )}
            </Command.List>
          </div>
        </Command>
      </div>
    </div>
  );
};
