
import React from 'react';
import { Search, Command } from 'lucide-react';

interface SearchBarProps {
  onClick: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative w-full max-w-xl mx-auto cursor-pointer group text-left block focus:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2 rounded-full"
    aria-label="Abrir barra de pesquisa e comandos (Pressione Ctrl+K)"
  >
    {/* Glow sutil ao passar o cursor */}
    <div className="absolute -inset-1 bg-gradient-to-r from-stone-200/40 via-stone-300/30 to-stone-200/40 dark:from-white/5 dark:via-white/10 dark:to-white/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

    <div className="relative flex items-center justify-between px-5 py-3.5 bg-bg-island backdrop-blur-xl border border-border rounded-full shadow-sm hover:shadow-md transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-text-main/40 active:scale-[0.99] transform-gpu">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <Search
          size={18}
          strokeWidth={1.5}
          className="text-text-muted group-hover:text-text-main transition-colors duration-150 shrink-0"
        />
        <span className="text-sm sm:text-base font-serif font-light text-text-muted group-hover:text-text-main transition-colors duration-150 truncate tracking-tight">
          Ex: Como enviar o evento S-2240 ao eSocial?
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-semibold tracking-wider text-text-muted bg-stone-100/80 dark:bg-white/10 border border-border rounded-lg shadow-2xs uppercase select-none group-hover:border-text-main/30 group-hover:text-text-main transition-colors duration-150">
          <Command className="w-3 h-3" strokeWidth={1.75} />
          <span>K</span>
        </kbd>
      </div>
    </div>
  </button>
);
