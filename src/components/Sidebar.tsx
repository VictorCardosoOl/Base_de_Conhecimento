import React, { useState } from 'react';
import { Archive, Hash, Bookmark, Sun, Moon, Layout, Home, List, BookOpen, Shield, FileText, Info, Users, Calendar, Circle } from 'lucide-react';
import { Category } from '../types/index';

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
  position: 'left'|'right'|'top'|'bottom';
  onPositionChange: (pos: 'left'|'right'|'top'|'bottom') => void;
}

import { getCategoryIcon } from '../constants/navigation';

export const Sidebar: React.FC<SidebarProps> = ({
  currentCat, onSelect, isDarkMode, toggleDark, isOpen, onClose, isQueueView, onSelectQueue, queueCount = 0, onLogoClick, position, onPositionChange
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // No mobile, hover rules
  const isExpanded = isHovered || isOpen;
  const isHorizontal = position === 'top' || position === 'bottom';

  const cyclePosition = () => {
    const posList: ('left'|'right'|'top'|'bottom')[] = ['left', 'top', 'right', 'bottom'];
    const idx = posList.indexOf(position);
    onPositionChange(posList[(idx + 1) % 4]);
  };

  const TooltipLabel = ({ text }: { text: string }) => {
    if (!isHorizontal) return null;
    return (
      <span className={`hidden lg:block absolute ${position === 'top' ? 'top-[calc(100%+0.5rem)]' : 'bottom-[calc(100%+0.5rem)]'} left-1/2 -translate-x-1/2 px-3 py-1.5 glass bg-[var(--text-main)] text-[var(--bg-main)] text-[11px] font-medium tracking-wide rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-500 ease-out whitespace-nowrap z-[100] shadow-sm transform group-hover:translate-y-0 ${position === 'top' ? '-translate-y-1' : 'translate-y-1'}`}>
        {text}
      </span>
    );
  };

  const getBtnClass = (isActive: boolean) => `
    flex items-center text-sm rounded-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative group
    ${isHorizontal ? 'justify-center p-3 lg:hover:scale-[1.15] lg:hover:-translate-y-1 shrink-0' : 'w-full py-3 px-3 ' + (isExpanded ? '' : 'justify-center')}
    ${isActive
      ? 'text-text-main font-semibold'
      : 'text-text-muted hover:text-text-main font-medium'}
  `;

  // Desktop positioning logic (ensuring true centering)
  const desktopPosClass = isHorizontal 
    ? `lg:left-1/2 lg:-translate-x-1/2 ${position === 'top' ? 'lg:top-6' : 'lg:bottom-6'} lg:flex-row lg:h-[4.5rem] lg:w-auto lg:px-6 lg:py-2`
    : `lg:top-1/2 lg:-translate-y-1/2 ${position === 'left' ? 'lg:left-6' : 'lg:right-6'} lg:flex-col lg:h-auto lg:py-8 lg:px-3 ${isExpanded ? 'lg:w-[17rem]' : 'lg:w-20'}`;

  // Mobile drawer logic (always left drawer)
  const mobilePosClass = `max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:w-[85vw] max-lg:max-w-[280px] max-lg:flex-col max-lg:py-6 max-lg:px-4 max-lg:border-r ${isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-[150%]'}`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-[70] glass bg-bg-island border-border shadow-xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:lg:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:border lg:rounded-[2.5rem] flex
          ${desktopPosClass}
          ${mobilePosClass}
        `}
      >
        <div className={`flex items-center justify-between shrink-0 ${isHorizontal ? 'max-lg:mb-6 max-lg:w-full lg:pr-6 lg:mr-3 lg:border-r lg:border-border' : 'mb-8 px-2 ' + (isExpanded ? '' : 'lg:justify-center')}`}>
          <div
            onClick={onLogoClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onLogoClick?.();
              }
            }}
            className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity"
            role="button"
            aria-label="Ir para a página inicial"
            tabIndex={0}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--text-main)] shrink-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-bg-main rounded-full" />
            </div>
            <span className={`text-[13px] font-bold uppercase tracking-[0.3em] text-text-main transition-all duration-500 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:translate-x-0' : 'lg:opacity-0 lg:hidden'}`}>
              SST FAQ
            </span>
          </div>

          <button
            onClick={cyclePosition}
            aria-label="Alterar posição do menu"
            className={`hidden lg:block text-text-muted hover:text-text-main transition-all duration-500 ${(!isHorizontal && isExpanded) ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute pointer-events-none'}`}
          >
            <Layout size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <nav className={`flex-1 flex max-lg:flex-col max-lg:space-y-8 max-lg:overflow-y-auto no-scrollbar lg:overflow-visible ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-3' : 'lg:flex-col lg:space-y-8 lg:overflow-y-auto'}`} aria-label="Navegação principal">
          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-2' : 'lg:flex-col lg:space-y-1'}`}>
            <p className={`text-[9px] uppercase tracking-[0.3em] text-text-muted font-bold px-3 transition-opacity duration-500 max-lg:block max-lg:mb-3 ${(!isHorizontal && isExpanded) ? 'lg:opacity-100 lg:h-auto lg:mb-3' : 'lg:opacity-0 lg:h-0 lg:hidden'}`} aria-hidden="true">Navegação</p>
            <div className={`flex max-lg:flex-col max-lg:space-y-1 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-2' : 'lg:flex-col lg:space-y-1 lg:items-center xl:items-stretch'}`}>
              <button
                onClick={() => { onSelect(null); }}
                aria-label="Ver acervo completo"
                aria-current={currentCat === null && !isQueueView ? 'page' : undefined}
                className={getBtnClass(currentCat === null && !isQueueView)}
              >
                <div className="flex items-center gap-4">
                  <Home size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  <span className={`transition-all duration-500 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>Acervo</span>
                  {!isHorizontal && isExpanded && currentCat === null && !isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50" />}
                  <TooltipLabel text="Acervo" />
                </div>
              </button>

              <button
                onClick={() => { onSelectQueue?.(); }}
                aria-label={`Ver minha lista de leitura com ${queueCount} itens salvos`}
                aria-current={isQueueView ? 'page' : undefined}
                className={getBtnClass(isQueueView === true)}
              >
                <div className="flex items-center gap-4">
                  <Bookmark size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  <div className={`flex items-center gap-2 transition-all duration-500 whitespace-nowrap max-lg:flex ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                    <span>Minha Lista</span>
                    {queueCount > 0 && (
                      <span className="text-[9px] font-black bg-[var(--text-main)] text-[var(--bg-main)] px-1.5 py-0.5 rounded-full ml-1" aria-label={`${queueCount} itens`}>
                        {queueCount}
                      </span>
                    )}
                  </div>
                  {!isHorizontal && isExpanded && isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50" />}
                  <TooltipLabel text={`Minha Lista${queueCount > 0 ? ` (${queueCount})` : ''}`} />
                </div>
              </button>
            </div>
          </div>

          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-2 lg:ml-2 lg:pl-5 lg:border-l lg:border-border' : 'lg:flex-col lg:space-y-1'}`}>
            <p className={`text-[9px] uppercase tracking-[0.3em] text-text-muted font-bold px-3 transition-opacity duration-500 max-lg:block max-lg:mb-3 ${(!isHorizontal && isExpanded) ? 'lg:opacity-100 lg:h-auto lg:mb-3' : 'lg:opacity-0 lg:h-0 lg:hidden'}`} aria-hidden="true">Módulos</p>
            <div className={`flex max-lg:flex-col max-lg:space-y-1 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-2' : 'lg:flex-col lg:space-y-1 lg:items-center xl:items-stretch'}`} role="menu">
              {Object.values(Category).map(cat => {
                const Icon = getCategoryIcon(cat);
                const isActive = currentCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { onSelect(cat); }}
                    aria-label={`Filtrar por módulo ${cat}`}
                    aria-current={isActive ? 'page' : undefined}
                    role="menuitem"
                    className={getBtnClass(isActive)}
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                      <span className={`transition-all duration-500 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>{cat}</span>
                      {!isHorizontal && isExpanded && isActive && <Circle size={4} fill="currentColor" className="ml-auto opacity-50" />}
                      <TooltipLabel text={cat} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className={`shrink-0 flex items-center max-lg:mt-auto max-lg:pt-6 max-lg:border-t max-lg:border-border max-lg:px-3 ${isHorizontal ? 'lg:pl-6 lg:ml-3 lg:border-l lg:border-border' : 'lg:pt-6 lg:mt-4 lg:border-t lg:border-border lg:px-2 lg:flex-col lg:items-stretch'}`}>
          <button
            onClick={toggleDark}
            aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            className={`flex items-center py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors max-lg:w-full max-lg:justify-between group relative ${isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full' : 'lg:justify-center lg:w-full')}`}
          >
            <div className="flex items-center gap-4">
              {isDarkMode ? <Sun size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:rotate-45 transition-transform duration-500" /> : <Moon size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:-rotate-12 transition-transform duration-500" />}
              <span className={`transition-all duration-500 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                {isDarkMode ? 'Claro' : 'Escuro'}
              </span>
              <TooltipLabel text={isDarkMode ? 'Modo Claro' : 'Modo Escuro'} />
            </div>
          </button>
          
          {isHorizontal && (
            <button
              onClick={cyclePosition}
              aria-label="Alterar posição do menu"
              className="ml-4 text-text-muted hover:text-text-main transition-all duration-500 hidden lg:block p-3 group relative lg:hover:scale-110 lg:hover:-translate-y-1"
            >
              <Layout size={20} strokeWidth={1.5} aria-hidden="true" />
              <TooltipLabel text="Mudar Posição" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
