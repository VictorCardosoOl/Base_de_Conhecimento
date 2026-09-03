
import React from 'react';
import { Search, Command, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onClick: () => void;
  query?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClick, query = "" }) => (
  <div
    className="relative w-full max-w-xl mx-auto cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-center justify-between border-b border-[var(--border)] py-1 md:py-1.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-[var(--text-main)]">
      <div className="flex items-center gap-4 md:gap-5 flex-1 overflow-hidden">
        <Search size={18} strokeWidth={1} className="text-stone-500 group-hover:text-[var(--text-main)] transition-colors shrink-0" />
        <span className="text-base font-light text-stone-600 dark:text-stone-300 tracking-tight truncate group-hover:text-[var(--text-main)] transition-colors">
          Buscar conhecimento na biblioteca...
        </span>
      </div>
      <div className="flex items-center gap-3 md:gap-4 ml-2">
        <div className="hidden sm:flex items-center gap-1.5 px-1.5 py-0.5 border border-stone-300 dark:border-stone-700 rounded text-[9px] md:text-[11px] font-bold text-stone-600 dark:text-stone-300">
          <Command size={10} md:size={12} strokeWidth={1.5} /> K
        </div>

      </div>
    </div>
  </div>
);
