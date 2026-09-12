import React, { useState } from 'react';
import { Archive, Bookmark, Sun, Moon, Layout, Circle, Home, Bell } from 'lucide-react';
import { Category } from '../../types/index';
import { getCategoryIcon } from '../../constants/navigation';
import { Magnetic } from '../ui/MagneticButton';

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
  isArticleOpen?: boolean;
}
 
interface TooltipLabelProps {
  text: string;
  position: 'left' | 'right' | 'top' | 'bottom';
  isHorizontal: boolean;
  isArticleOpen?: boolean;
}

const TooltipLabel: React.FC<TooltipLabelProps> = ({ text, position, isHorizontal, isArticleOpen }) => {
  if (!isHorizontal && !isArticleOpen) return null;
  return (
    <span className={`hidden lg:block absolute ${position === 'top' || (isArticleOpen && !isHorizontal) ? 'top-[calc(100%+0.5rem)]' : 'bottom-[calc(100%+0.5rem)]'} ${isArticleOpen && !isHorizontal ? 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2' : 'left-1/2 -translate-x-1/2'} px-3 py-1.5 glass bg-[var(--text-main)] text-[var(--bg-main)] text-[11px] font-medium tracking-wide rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 ease-out whitespace-nowrap z-[100] shadow-sm transform-gpu group-hover:translate-y-0`}>
      {text}
    </span>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentCat, onSelect, isDarkMode, toggleDark, isOpen, onClose, isQueueView, onSelectQueue, queueCount = 0, onLogoClick, position, onPositionChange, isArticleOpen
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // No mobile, hover rules
  const isExpanded = (isHovered || isOpen) && !isArticleOpen;
  const isHorizontal = position === 'top' || position === 'bottom';

  const cyclePosition = () => {
    const posList: ('left'|'right'|'top'|'bottom')[] = ['left', 'top', 'right', 'bottom'];
    const idx = posList.indexOf(position);
    onPositionChange(posList[(idx + 1) % 4]);
  };

  const getBtnClass = (isActive: boolean) => `
    flex items-center text-sm rounded-xl transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu relative group
    ${isHorizontal || isArticleOpen ? 'justify-center p-2.5 lg:hover:scale-[1.12] lg:hover:-translate-y-0.5 shrink-0' : 'w-full py-2.5 px-3 ' + (isExpanded ? '' : 'justify-center')}
    ${isActive
      ? 'text-text-main font-semibold bg-stone-100 dark:bg-white/10 shadow-sm'
      : 'text-text-muted hover:text-text-main hover:bg-stone-50 dark:hover:bg-white/5 font-medium'}
  `;

  // Desktop positioning logic (ensuring true centering e largura adequada sem corte)
  const desktopPosClass = isHorizontal 
    ? `lg:left-1/2 lg:-translate-x-1/2 ${position === 'top' ? 'lg:top-6' : 'lg:bottom-6'} lg:flex-row lg:h-[4rem] lg:w-auto lg:px-6 lg:py-2`
    : `lg:top-1/2 lg:-translate-y-1/2 ${position === 'left' ? (isArticleOpen ? 'lg:left-2' : 'lg:left-6') : (isArticleOpen ? 'lg:right-2' : 'lg:right-6')} lg:flex-col lg:h-auto lg:py-6 lg:px-3 ${isExpanded ? 'lg:w-[15rem]' : (isArticleOpen ? 'lg:w-14 lg:py-4 scale-90' : 'lg:w-16')}`;

  // Mobile drawer logic (always left drawer)
  const mobilePosClass = `max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:w-[85vw] max-lg:max-w-[290px] max-lg:flex-col max-lg:py-6 max-lg:px-4 max-lg:border-r ${isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-[150%]'}`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-[70] glass bg-bg-island border-border shadow-xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:lg:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu
          lg:border lg:rounded-[2rem] flex
          ${desktopPosClass}
          ${mobilePosClass}
        `}
      >

        <nav className={`flex-1 flex max-lg:flex-col max-lg:space-y-8 max-lg:overflow-y-auto no-scrollbar lg:overflow-visible ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-3' : 'lg:flex-col lg:space-y-4 lg:overflow-y-auto'}`} aria-label="Navegação principal">
          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-2' : 'lg:flex-col lg:space-y-1'}`}>
            <p className={`text-[9px] uppercase tracking-[0.3em] text-text-muted font-bold px-3 transition-opacity duration-250 max-lg:block max-lg:mb-3 ${(!isHorizontal && isExpanded) ? 'lg:opacity-100 lg:h-auto lg:mb-3' : 'lg:opacity-0 lg:h-0 lg:hidden'}`} aria-hidden="true">Navegação</p>
            <div className={`flex max-lg:flex-col max-lg:space-y-0.5 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-2' : 'lg:flex-col lg:space-y-0.5 lg:items-center xl:items-stretch'}`}>
              <button
                onClick={() => { onSelect(null); }}
                aria-label="Ver acervo completo"
                aria-current={currentCat === null && !isQueueView ? 'page' : undefined}
                className={getBtnClass(currentCat === null && !isQueueView)}
              >
                <div className="flex items-center gap-4">
                  <Home size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  <span className={`transition-all duration-250 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>Acervo</span>
                  {!isHorizontal && isExpanded && currentCat === null && !isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50" />}
                  <TooltipLabel text="Acervo" position={position} isHorizontal={isHorizontal} isArticleOpen={isArticleOpen} />
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
                  <div className={`flex items-center gap-2 transition-all duration-250 whitespace-nowrap max-lg:flex ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                    <span>Minha Lista</span>
                    {queueCount > 0 && (
                      <span className="text-[9px] font-black bg-[var(--text-main)] text-[var(--bg-main)] px-1.5 py-0.5 rounded-full ml-1" aria-label={`${queueCount} itens`}>
                        {queueCount}
                      </span>
                    )}
                  </div>
                  {!isHorizontal && isExpanded && isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50" />}
                  <TooltipLabel text={`Minha Lista${queueCount > 0 ? ` (${queueCount})` : ''}`} position={position} isHorizontal={isHorizontal} isArticleOpen={isArticleOpen} />
                </div>
              </button>
            </div>
          </div>

          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-2 lg:ml-2 lg:pl-5 lg:border-l lg:border-border' : 'lg:flex-col lg:space-y-1'}`}>
            <p className={`text-[9px] uppercase tracking-[0.3em] text-text-muted font-bold px-3 transition-opacity duration-250 max-lg:block max-lg:mb-3 ${(!isHorizontal && isExpanded) ? 'lg:opacity-100 lg:h-auto lg:mb-3' : 'lg:opacity-0 lg:h-0 lg:hidden'}`} aria-hidden="true">Módulos</p>
            <div className={`flex max-lg:flex-col max-lg:space-y-0.5 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-2' : 'lg:flex-col lg:space-y-0.5 lg:items-center xl:items-stretch'}`} role="menu">
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
                      <span className={`transition-all duration-250 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>{cat}</span>
                      {!isHorizontal && isExpanded && isActive && <Circle size={4} fill="currentColor" className="ml-auto opacity-50" />}
                      <TooltipLabel text={cat} position={position} isHorizontal={isHorizontal} isArticleOpen={isArticleOpen} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className={`shrink-0 flex items-center max-lg:mt-auto max-lg:pt-6 max-lg:border-t max-lg:border-border max-lg:px-3 ${isHorizontal ? 'lg:pl-6 lg:ml-3 lg:border-l lg:border-border' : 'lg:pt-4 lg:mt-2 lg:border-t lg:border-border lg:px-2 lg:flex-col lg:items-stretch'}`}>
          {/* Notificações Push PWA */}
          <Magnetic strength={0.3} className="w-full">
            <button
              onClick={async () => {
                if (!('Notification' in window)) {
                  alert('Seu navegador não possui suporte nativo a Web Push Notifications.');
                  return;
                }
                if (Notification.permission === 'granted') {
                  new Notification('SST FAQ Atualizações', {
                    body: 'Notificações corporativas ativadas! Você receberá comunicados urgentes de normas e eSocial.',
                    icon: '/pwa-192x192.png'
                  });
                } else {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    new Notification('SST FAQ Conectado', {
                      body: 'Notificações ativadas com sucesso.',
                      icon: '/pwa-192x192.png'
                    });
                  }
                }
              }}
              aria-label="Ativar Notificações Push do PWA"
              className={`flex items-center py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors duration-150 max-lg:w-full max-lg:justify-between group relative ${isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full' : 'lg:justify-center lg:w-full')}`}
            >
              <div className="flex items-center gap-4">
                <Bell size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:scale-110 transition-transform duration-150" />
                <span className={`transition-all duration-150 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                  Alertas
                </span>
                <TooltipLabel text="Notificações Push (PWA)" position={position} isHorizontal={isHorizontal} isArticleOpen={isArticleOpen} />
              </div>
            </button>
          </Magnetic>

          <Magnetic strength={0.3} className="w-full">
            <button
              onClick={toggleDark}
              aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
              className={`flex items-center py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors duration-150 max-lg:w-full max-lg:justify-between group relative ${isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full' : 'lg:justify-center lg:w-full')}`}
            >
              <div className="flex items-center gap-4">
                {isDarkMode ? <Sun size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:rotate-45 transition-transform duration-150 transform-gpu" /> : <Moon size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:-rotate-12 transition-transform duration-150 transform-gpu" />}
                <span className={`transition-all duration-150 whitespace-nowrap max-lg:block ${(isExpanded && !isHorizontal) ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                  {isDarkMode ? 'Claro' : 'Escuro'}
                </span>
                <TooltipLabel text={isDarkMode ? 'Modo Claro' : 'Modo Escuro'} position={position} isHorizontal={isHorizontal} isArticleOpen={isArticleOpen} />
              </div>
            </button>
          </Magnetic>
          
          {isHorizontal && (
            <button
              onClick={cyclePosition}
              aria-label="Alterar posição do menu"
              className="ml-4 text-text-muted hover:text-text-main transition-all duration-150 hidden lg:block p-3 group relative lg:hover:scale-110 lg:hover:-translate-y-0.5 transform-gpu"
            >
              <Layout size={20} strokeWidth={1.5} aria-hidden="true" />
              <TooltipLabel text="Mudar Posição" position={position} isHorizontal={isHorizontal} isArticleOpen={isArticleOpen} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
