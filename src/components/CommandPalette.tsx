import React, { useEffect, useState, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, Hash, Sun, Moon, Archive, Bookmark, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQItem, Category } from '../types';
import { FAQ_DATA } from '../constants';
import { useSearch } from '../hooks/useSearch';

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

  // Reset input and focus when opening
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      // Small delay to ensure animation validation and DOM presence
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl relative shadow-2xl shadow-stone-900/40 dark:shadow-black/50 rounded-2xl overflow-hidden"
          >
            <Command
              className="w-full bg-gradient-to-b from-stone-900/95 via-stone-900/90 to-stone-900/80 backdrop-blur-3xl border-[1px] border-white/10 rounded-2xl overflow-hidden"
              loop
              shouldFilter={false} // We handle filtering manually via useSearch
            >
              <div className="flex items-center border-b border-white/10 px-5 relative">
                <Search className="w-5 h-5 text-white/50 mr-3 shrink-0" strokeWidth={2.5} />
                <Command.Input
                  ref={inputRef}
                  value={inputValue}
                  onValueChange={setInputValue}
                  placeholder="O que você procura?"
                  className="flex-1 h-16 bg-transparent outline-none text-lg text-white placeholder:text-white/30 font-medium font-serif"
                />
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/10">
                  <span className="text-xs">ESC</span> para fechar
                </div>
                <button onClick={onClose} className="sm:hidden p-2 text-stone-400">
                  <X size={20} />
                </button>
              </div>

              <Command.List
                className="max-h-[60vh] overflow-y-auto p-3 scroll-py-3"
                data-lenis-prevent // Impede que o Lenis sequestre o scroll desta área
              >
                <Command.Empty className="py-12 text-center text-stone-500 dark:text-stone-400">
                  <p className="font-serif italic text-lg">Nenhum resultado encontrado.</p>
                </Command.Empty>

                {!inputValue && (
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600 mb-1">
                    Sugestões Rápidas
                  </div>
                )}

                {(showLibrary || showQueue) && (
                  <Command.Group heading="Navegação">
                    {showLibrary && (
                      <Command.Item
                        onSelect={() => { onSelectCategory(null); onClose(); }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 cursor-pointer text-white/90 transition-colors group aria-selected:bg-white/15"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform duration-300">
                          <Archive size={20} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">Biblioteca Completa</span>
                          <span className="text-xs text-white/50">Visualizar todos os documentos</span>
                        </div>
                      </Command.Item>
                    )}

                    {showQueue && (
                      <Command.Item
                        onSelect={() => { onSelectQueue(); onClose(); }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 cursor-pointer text-white/90 transition-colors group aria-selected:bg-white/15"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform duration-300">
                          <Bookmark size={20} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">Minha Lista de Leitura</span>
                          <span className="text-xs text-white/50">Acessar seus artigos salvos</span>
                        </div>
                      </Command.Item>
                    )}
                  </Command.Group>
                )}

                {filteredArticles.length > 0 && (
                  <Command.Group heading="Artigos e Conhecimento" className="mt-4">
                    {filteredArticles.map((item) => (
                      <Command.Item
                        key={item.id}
                        onSelect={() => {
                          onSelectArticle(item);
                          onClose();
                        }}
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/10 cursor-pointer text-white/90 transition-colors group aria-selected:bg-white/15"
                      >
                        <div className="mt-1 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/40 group-hover:border-white/60 group-hover:text-white transition-colors shrink-0">
                          <Hash size={14} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif text-lg leading-tight group-hover:underline decoration-white/30 underline-offset-4 decoration-1">{item.question}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider font-bold opacity-50 bg-white/10 px-1.5 py-0.5 rounded">{item.category}</span>
                            <span className="text-[10px] opacity-40 truncate max-w-[200px]">{item.answer.substring(0, 60)}...</span>
                          </div>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 self-center">
                          <ArrowRight size={16} className="text-white/60" />
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {showTheme && (
                  <Command.Group heading="Sistema" className="mt-4 border-t border-white/10 pt-2">
                    <Command.Item
                      onSelect={() => { onToggleTheme(); onClose(); }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer text-white/60 hover:text-white aria-selected:bg-white/15"
                    >
                      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      <span className="text-xs font-bold uppercase tracking-widest">Alternar para Modo {isDarkMode ? 'Claro' : 'Escuro'}</span>
                    </Command.Item>
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
