import React, { useState } from 'react';
import { Archive, Hash, Bookmark, Sun, Moon, Circle, Pin, PinOff } from 'lucide-react';
import { Category } from '../types';

interface SidebarProps {
  currentCat: Category | null;
  onSelect: (cat: Category | null) => void;
  isDarkMode: boolean;
  toggleDark: () => void;
  isOpen: boolean;
  onClose: () => void;
  isQueueView?: boolean;
  onSelectQueue?: () => void;
  queueCount?: number;
  onLogoClick?: () => void;
  isPinned: boolean;
  onPinToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCat, onSelect, isDarkMode, toggleDark, isOpen, onClose, isQueueView, onSelectQueue, queueCount = 0, onLogoClick, isPinned, onPinToggle
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isPinned || isHovered || isOpen;

  const getBtnClass = (isActive: boolean) => `
    flex items-center justify-between w-full text-sm py-2.5 px-3 rounded-lg transition-all duration-300
    ${isActive
      ? 'bg-stone-900/10 dark:bg-white/15 text-[var(--text-main)] font-black'
      : 'text-[var(--text-muted)] dark:text-stone-300 hover:text-[var(--text-main)] hover:bg-stone-900/5 dark:hover:bg-white/5 font-semibold'}
  `;

  const getHeadingClass = (isVisible: boolean) => `
    text-[10px] uppercase tracking-[0.25em] text-[var(--text-main)] font-black mb-4 px-3 transition-opacity duration-500
    ${isVisible ? 'opacity-100' : 'opacity-0'}
  `;

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 bottom-0 glass bg-[var(--bg-island)] border-r border-[var(--border)] z-[70] flex flex-col py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isExpanded ? 'w-[85vw] max-w-[300px] lg:w-64 px-4' : 'w-20 px-3'}`}
      >
        <div className="mb-8 flex items-center justify-between px-2 overflow-hidden">
          <div
            onClick={onLogoClick}
            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-[var(--text-main)] shrink-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[var(--bg-main)] rounded-full" />
            </div>
            <span className={`text-sm font-bold uppercase tracking-[0.4em] text-[var(--text-main)] transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              SST FAQ
            </span>
          </div>

          <button
            onClick={onPinToggle}
            className={`hidden lg:block text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all duration-300 ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
          >
            {isPinned ? <Pin size={16} strokeWidth={2.5} /> : <PinOff size={16} strokeWidth={2.5} />}
          </button>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <p className={getHeadingClass(isExpanded)}>Navegação</p>
            <div className="space-y-0.5">
              <button
                onClick={() => { onSelect(null); }}
                className={getBtnClass(currentCat === null && !isQueueView)}
              >
                <div className="flex items-center gap-3">
                  <Archive size={18} strokeWidth={currentCat === null && !isQueueView ? 2.5 : 2} />
                  <span className={`transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Acervo</span>
                </div>
                {isExpanded && currentCat === null && !isQueueView && <Circle size={4} fill="currentColor" />}
              </button>

              <button
                onClick={() => { onSelectQueue?.(); }}
                className={getBtnClass(isQueueView === true)}
              >
                <div className="flex items-center gap-3">
                  <Bookmark size={18} strokeWidth={isQueueView ? 2.5 : 2} />
                  <div className={`flex items-center gap-2 transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    <span>Minha Lista</span>
                    {queueCount > 0 && (
                      <span className="text-[9px] font-black bg-[var(--text-main)] text-[var(--bg-main)] px-1.5 py-0.5 rounded-full ml-1">
                        {queueCount}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded && isQueueView && <Circle size={4} fill="currentColor" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className={getHeadingClass(isExpanded)}>Módulos</p>
            <div className="space-y-0.5">
              {Object.values(Category).map(cat => (
                <button
                  key={cat}
                  onClick={() => { onSelect(cat); }}
                  className={getBtnClass(currentCat === cat)}
                >
                  <div className="flex items-center gap-3">
                    <Hash size={18} strokeWidth={currentCat === cat ? 2.5 : 2} />
                    <span className={`transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{cat}</span>
                  </div>
                  {isExpanded && currentCat === cat && <div className="w-1 h-3 bg-[var(--text-main)] rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="pt-4 border-t border-[var(--border)] px-2">
          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-between py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {isDarkMode ? 'Claro' : 'Escuro'}
              </span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};