import React, { useState } from 'react';
import { Archive, Bookmark, Sun, Moon, Layout, Circle, Home, Bell, ShieldCheck } from 'lucide-react';
import { Category } from '../../types/index';
import { getCategoryIcon } from '../../config/navigation';
import { useConsent } from '../../contexts/ConsentContext';

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
  isExpanded: boolean;
}

const TooltipLabel: React.FC<TooltipLabelProps> = ({ text, position, isExpanded }) => {
  // Hide tooltip on desktop if the sidebar is already expanded (unless horizontal)
  const isHorizontal = position === 'top' || position === 'bottom';
  if (isExpanded && !isHorizontal) return null;

  let posClasses = '';
  if (position === 'top') posClasses = 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
  else if (position === 'bottom') posClasses = 'bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
  else if (position === 'left') posClasses = 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2';
  else posClasses = 'right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2';

  return (
    <span className={`hidden lg:block absolute ${posClasses} px-2.5 py-1 glass bg-text-main text-bg-main text-[10px] font-medium tracking-wide rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 ease-out whitespace-nowrap z-[100] shadow-sm transform-gpu translate-y-1 group-hover:translate-y-0`}>
      {text}
    </span>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentCat, onSelect, isDarkMode, toggleDark, isOpen, onClose, isQueueView, onSelectQueue, queueCount = 0, onLogoClick, position, onPositionChange, isArticleOpen
}) => {
  const { setOpenLegalModal, setActiveLegalTab } = useConsent();
  const [isHovered, setIsHovered] = useState(false);
  
  const isHorizontal = position === 'top' || position === 'bottom';
  const isExpanded = (isHovered || isOpen) && !isArticleOpen;

  const cyclePosition = () => {
    const posList: ('left'|'right'|'top'|'bottom')[] = ['left', 'top', 'right', 'bottom'];
    const idx = posList.indexOf(position);
    onPositionChange(posList[(idx + 1) % 4]);
  };

  const getBtnClass = (isActive: boolean) => `
    flex items-center text-xs rounded-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu relative group
    max-lg:w-full max-lg:py-2.5 max-lg:px-3
    ${isHorizontal || isArticleOpen ? 'lg:justify-center lg:p-2 lg:hover:scale-[1.12] lg:hover:-translate-y-0.5 shrink-0' : 'w-full py-2 px-2 ' + (isExpanded ? '' : 'lg:justify-center')}
    ${isActive
      ? 'text-text-main font-semibold bg-bg-main shadow-sm border border-border'
      : 'text-text-muted hover:text-text-main hover:bg-bg-main font-medium'}
  `;

  // Animação super fluida: Sincronizada com o container e adicionado um leve "slide-in" (-translate-x)
  const textClass = `transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap overflow-hidden transform-gpu ${
    (isExpanded && !isHorizontal) ? 'max-w-[100px] opacity-100 translate-x-0 ml-2.5 lg:ml-3' : 'max-w-0 opacity-0 -translate-x-2 ml-0 max-lg:max-w-full max-lg:opacity-100 max-lg:translate-x-0 max-lg:ml-3'
  }`;
  
  const sectionTitleClass = `text-[8px] uppercase tracking-[0.3em] text-text-muted font-bold px-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden whitespace-nowrap transform-gpu max-lg:mb-3 max-lg:max-w-full max-lg:opacity-100 max-lg:translate-x-0 ${
    (!isHorizontal && isExpanded) ? 'max-w-[100px] opacity-100 translate-x-0 mb-2' : 'max-w-0 opacity-0 -translate-x-2 h-0 mb-0'
  }`;

  // Slim ainda mais compacto e delicado (w-40 expandido, w-14 colapsado)
  const desktopPosClass = isHorizontal 
    ? `lg:left-1/2 lg:-translate-x-1/2 ${position === 'top' ? 'lg:top-4' : 'lg:bottom-4'} lg:flex-row lg:h-[3.5rem] lg:w-auto lg:px-4 lg:py-1.5`
    : `lg:top-1/2 lg:-translate-y-1/2 ${position === 'left' ? 'lg:left-4' : 'lg:right-4'} lg:flex-col lg:h-auto lg:py-4 lg:px-2 ${isExpanded ? 'lg:w-40' : 'lg:w-14'}`;

  // Mobile drawer 
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
        className={`fixed z-[70] glass bg-bg-island border-border shadow-xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:lg:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu
          lg:border lg:rounded-3xl flex
          ${desktopPosClass}
          ${mobilePosClass}
        `}
      >
        <nav className={`flex-1 flex max-lg:flex-col max-lg:space-y-8 max-lg:overflow-y-auto no-scrollbar lg:overflow-visible ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-2' : 'lg:flex-col lg:space-y-3 lg:overflow-y-auto'}`} aria-label="Navegação principal">
          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-1.5' : 'lg:flex-col lg:space-y-1'}`}>
            <div className={`flex max-lg:flex-col max-lg:space-y-0.5 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-1.5' : 'lg:flex-col lg:space-y-0.5 lg:items-center xl:items-stretch'}`}>
              <button
                onClick={() => { onSelect(null); onClose(); }}
                aria-label="Ver acervo completo"
                aria-current={currentCat === null && !isQueueView ? 'page' : undefined}
                className={getBtnClass(currentCat === null && !isQueueView)}
              >
                <div className="flex items-center">
                  <Home size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  <span className={textClass}>Acervo</span>
                  {!isHorizontal && isExpanded && currentCat === null && !isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50 shrink-0" />}
                  <TooltipLabel text="Acervo" position={position} isExpanded={isExpanded} />
                </div>
              </button>

              <button
                onClick={() => { onSelectQueue?.(); onClose(); }}
                aria-label={`Ver minha lista de leitura com ${queueCount} itens salvos`}
                aria-current={isQueueView ? 'page' : undefined}
                className={getBtnClass(isQueueView === true)}
              >
                <div className="flex items-center">
                  <Bookmark size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  <div className={`flex items-center ${textClass}`}>
                    <span>Minha Lista</span>
                    {queueCount > 0 && (
                      <span className="text-[8px] font-black bg-text-main text-bg-main px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                        {queueCount}
                      </span>
                    )}
                  </div>
                  {!isHorizontal && isExpanded && isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50 shrink-0" />}
                  <TooltipLabel text={`Minha Lista${queueCount > 0 ? ` (${queueCount})` : ''}`} position={position} isExpanded={isExpanded} />
                </div>
              </button>
            </div>
          </div>

          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-1.5 lg:ml-1.5 lg:pl-4 lg:border-l lg:border-border' : 'lg:flex-col lg:space-y-1'}`}>
            <p className={sectionTitleClass} aria-hidden="true">Módulos</p>
            <div className={`flex max-lg:flex-col max-lg:space-y-0.5 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-1.5' : 'lg:flex-col lg:space-y-0.5 lg:items-center xl:items-stretch'}`} role="menu">
              {Object.values(Category).map(cat => {
                const Icon = getCategoryIcon(cat);
                const isActive = currentCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { onSelect(cat); onClose(); }}
                    aria-label={`Filtrar por módulo ${cat}`}
                    aria-current={isActive ? 'page' : undefined}
                    role="menuitem"
                    className={getBtnClass(isActive)}
                  >
                    <div className="flex items-center">
                      <Icon size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                      <span className={textClass}>{cat}</span>
                      {!isHorizontal && isExpanded && isActive && <Circle size={4} fill="currentColor" className="ml-auto opacity-50 shrink-0" />}
                      <TooltipLabel text={cat} position={position} isExpanded={isExpanded} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className={`shrink-0 flex items-center max-lg:mt-auto max-lg:pt-6 max-lg:border-t max-lg:border-border max-lg:px-3 ${isHorizontal ? 'lg:pl-4 lg:ml-2 lg:border-l lg:border-border' : 'lg:pt-3 lg:mt-2 lg:border-t lg:border-border lg:px-1 lg:flex-col lg:items-stretch'}`}>
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
            aria-label="Ativar Notificações Push"
            className={`flex items-center py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors duration-150 max-lg:w-full max-lg:justify-between group relative ${isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full lg:px-2' : 'lg:justify-center lg:w-full')}`}
          >
            <div className="flex items-center">
              <Bell size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:scale-110 transition-transform duration-150" />
              <span className={textClass}>Alertas</span>
              <TooltipLabel text="Notificações Push" position={position} isExpanded={isExpanded} />
            </div>
          </button>

          <button
            onClick={() => {
              setActiveLegalTab('privacy');
              setOpenLegalModal(true);
            }}
            aria-label="LGPD e Termos"
            className={`flex items-center py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors duration-150 max-lg:w-full max-lg:justify-between group relative ${isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full lg:px-2' : 'lg:justify-center lg:w-full')}`}
          >
            <div className="flex items-center">
              <ShieldCheck size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:scale-110 transition-transform duration-150 text-text-main" />
              <span className={textClass}>LGPD</span>
              <TooltipLabel text="Termos & LGPD" position={position} isExpanded={isExpanded} />
            </div>
          </button>

          <button
            onClick={toggleDark}
            aria-label="Alternar Tema"
            className={`flex items-center py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors duration-150 max-lg:w-full max-lg:justify-between group relative ${isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full lg:px-2' : 'lg:justify-center lg:w-full')}`}
          >
            <div className="flex items-center">
              {isDarkMode ? <Sun size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:rotate-45 transition-transform duration-150 transform-gpu" /> : <Moon size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 lg:group-hover:-rotate-12 transition-transform duration-150 transform-gpu" />}
              <span className={textClass}>{isDarkMode ? 'Claro' : 'Escuro'}</span>
              <TooltipLabel text={isDarkMode ? 'Modo Claro' : 'Modo Escuro'} position={position} isExpanded={isExpanded} />
            </div>
          </button>
          
          {isHorizontal && (
            <button
              onClick={cyclePosition}
              aria-label="Alterar posição do menu"
              className="ml-3 text-text-muted hover:text-text-main transition-all duration-150 hidden lg:block p-2 group relative lg:hover:scale-110 lg:hover:-translate-y-0.5 transform-gpu shrink-0"
            >
              <Layout size={18} strokeWidth={1.5} aria-hidden="true" />
              <TooltipLabel text="Mudar Posição" position={position} isExpanded={isExpanded} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
