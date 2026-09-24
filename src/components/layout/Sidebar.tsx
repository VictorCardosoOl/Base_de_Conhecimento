import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, Bookmark, Sun, Moon, Layout, Circle, Home, Bell, ShieldCheck } from 'lucide-react';
import { Category } from '../../types/index';
import { getCategoryIcon } from '../../config/navigation';
import { useConsent } from '../../contexts/ConsentContext';

// ?? Spring para a Sidebar ?
// Sensação física de 120Hz: entrada rápida com overshoot suave, sem bounce visível.
// Usado no width do container E nas labels de texto.
const sidebarSpring = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 30,
  mass: 0.6,
};

// Spring mais leve para micro-interações das labels (stagger natural via delay)
const labelSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.5,
};

// ?? Easing do tooltip ?
// CSS spring-like easing para o tooltip (não precisa de Framer Motion)
const SPRING_EASE = 'cubic-bezier(0.34,1.26,0.64,1)';

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

  // tooltip: apenas transform+opacity ? zero reflow
  return (
    <span
      className={`hidden lg:block absolute ${posClasses} px-2.5 py-1  bg-text-main text-bg-main text-[10px] font-medium tracking-wide rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-[transform,opacity] duration-[180ms] ease-[${SPRING_EASE}] whitespace-nowrap z-[100] shadow-sm transform-gpu translate-y-1.5 group-hover:translate-y-0`}
    >
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

  // ?? Classes dos botões de navegação ?
  // transition-all ?  apenas propriedades específicas (sem reflow)
  const getBtnClass = (isActive: boolean) => `
    flex items-center text-xs rounded-xl
    transition-[background-color,color,box-shadow,transform,padding] duration-[160ms] ease-[${SPRING_EASE}]
    transform-gpu relative group
    max-lg:w-full max-lg:py-2.5 max-lg:px-3
    ${isHorizontal || isArticleOpen
      ? 'lg:justify-center lg:p-2 lg:hover:scale-[1.08] lg:hover:-translate-y-0.5 shrink-0'
      : 'w-full py-2 px-2 ' + (isExpanded ? '' : 'lg:justify-center')
    }
    ${isActive
      ? 'text-text-main font-semibold bg-bg-main shadow-sm border border-border'
      : 'text-text-muted hover:text-text-main hover:bg-bg-main font-medium'}
  `;

  // ?? Label de texto animada com Framer Motion ?
  // Usa spring para dar sensação fluida ao revelar/ocultar o texto.
  // No mobile (max-lg), as classes CSS sobrescrevem o Framer Motion via !important.
  // O overflow:hidden no wrapper impede que o texto ocupe espaço ao entrar.
  const AnimatedLabel: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
    <span className="overflow-hidden whitespace-nowrap">
      <motion.span
        animate={
          isExpanded && !isHorizontal
            ? { opacity: 1, x: 0, maxWidth: 120, marginLeft: 10 }
            : { opacity: 0, x: -6, maxWidth: 0, marginLeft: 0 }
        }
        transition={{ ...labelSpring, delay: isExpanded ? delay : 0 }}
        className="inline-flex items-center whitespace-nowrap max-lg:!opacity-100 max-lg:!translate-x-0 max-lg:!max-w-none max-lg:ml-3"
      >
        {children}
      </motion.span>
    </span>
  );

  // Section title (Módulos)
  const AnimatedSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.p
      animate={
        !isHorizontal && isExpanded
          ? { opacity: 1, x: 0, maxWidth: 120, marginBottom: 8, height: 'auto' }
          : { opacity: 0, x: -6, maxWidth: 0, marginBottom: 0, height: 0 }
      }
      transition={labelSpring}
      className="text-[8px] uppercase tracking-[0.3em] text-text-muted font-bold px-2 overflow-hidden whitespace-nowrap transform-gpu max-lg:!opacity-100 max-lg:!translate-x-0 max-lg:!max-w-none max-lg:mb-3"
      aria-hidden="true"
    >
      {children}
    </motion.p>
  );

  const SidebarBottomAction: React.FC<{
    onClick: () => void;
    ariaLabel: string;
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    isHorizontal: boolean;
    isExpanded: boolean;
    position: 'left' | 'right' | 'top' | 'bottom';
  }> = ({ onClick, ariaLabel, icon, label, tooltip, isHorizontal, isExpanded, position }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex items-center py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors duration-150 max-lg:w-full max-lg:justify-between group relative ${
        isHorizontal ? 'lg:justify-center' : (isExpanded ? 'lg:justify-between lg:w-full lg:px-2' : 'lg:justify-center lg:w-full')
      }`}
    >
      <div className="flex items-center">
        {icon}
        <AnimatedLabel>{label}</AnimatedLabel>
        <TooltipLabel text={tooltip} position={position} isExpanded={isExpanded} />
      </div>
    </button>
  );

  // ?? Posicionamento desktop ?
  const desktopPosClass = isHorizontal 
    ? `lg:left-1/2 lg:-translate-x-1/2 ${position === 'top' ? 'lg:top-4' : 'lg:bottom-4'} lg:flex-row lg:h-[3.5rem] lg:w-auto lg:px-4 lg:py-1.5`
    // width removida ? controlada pelo Framer Motion motion.aside abaixo
    : `lg:top-1/2 lg:-translate-y-1/2 ${position === 'left' ? 'lg:left-4' : 'lg:right-4'} lg:flex-col lg:h-auto lg:py-4 lg:px-2`;

  // ?? Posicionamento mobile (CSS puro, sem Framer Motion) ?
  const mobilePosClass = `max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:w-[85vw] max-lg:max-w-[290px] max-lg:flex-col max-lg:py-6 max-lg:px-4 max-lg:border-r ${isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-[150%]'}`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/80  z-[60] lg:hidden transition-opacity duration-150 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/*
        motion.aside ? anima o width com spring para desktop vertical.
        O mobile usa CSS transition-[transform] separada (translateX do drawer).
        O isHorizontal usa width:auto via Framer Motion sem animar (instante).
      */}
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // width apenas para desktop vertical ? horizontal e mobile ficam com CSS
        animate={
          !isHorizontal
            ? { width: isExpanded ? 160 : 56 }
            : { width: 'auto' }
        }
        transition={sidebarSpring}
        className={`fixed z-[70]  bg-bg-island border-border shadow-xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:lg:shadow-[0_8px_30px_rgb(255,255,255,0.02)]
          transition-[transform,background-color,box-shadow] duration-[380ms] ease-[${SPRING_EASE}] transform-gpu
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
                  <AnimatedLabel>Acervo</AnimatedLabel>
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
                  <AnimatedLabel>
                    <span>Minha Lista</span>
                    {queueCount > 0 && (
                      <span className="text-[8px] font-black bg-text-main text-bg-main px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                        {queueCount}
                      </span>
                    )}
                  </AnimatedLabel>
                  {!isHorizontal && isExpanded && isQueueView && <Circle size={4} fill="currentColor" className="ml-auto opacity-50 shrink-0" />}
                  <TooltipLabel text={`Minha Lista${queueCount > 0 ? ` (${queueCount})` : ''}`} position={position} isExpanded={isExpanded} />
                </div>
              </button>
            </div>
          </div>

          <div className={`flex max-lg:flex-col max-lg:space-y-2 ${isHorizontal ? 'lg:flex-row lg:items-center lg:gap-1.5 lg:ml-1.5 lg:pl-4 lg:border-l lg:border-border' : 'lg:flex-col lg:space-y-1'}`}>
            <AnimatedSectionTitle>Módulos</AnimatedSectionTitle>
            <div className={`flex max-lg:flex-col max-lg:space-y-0.5 max-lg:items-stretch ${isHorizontal ? 'lg:flex-row lg:gap-1.5' : 'lg:flex-col lg:space-y-0.5 lg:items-center xl:items-stretch'}`} role="menu">
              {Object.values(Category).map((cat, catIdx) => {
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
                      {/* Delay escalonado por índice ? stagger natural sem JS */}
                      <AnimatedLabel delay={catIdx * 0.018}>
                        {cat}
                      </AnimatedLabel>
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
          
          <SidebarBottomAction
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
            ariaLabel="Ativar Notificações Push"
            icon={<Bell size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 transition-transform duration-[160ms] ease-[cubic-bezier(0.34,1.26,0.64,1)] lg:group-hover:scale-[1.18]" />}
            label="Alertas"
            tooltip="Notificações Push"
            isHorizontal={isHorizontal}
            isExpanded={isExpanded}
            position={position}
          />

          <SidebarBottomAction
            onClick={() => {
              setActiveLegalTab('privacy');
              setOpenLegalModal(true);
            }}
            ariaLabel="LGPD e Termos"
            icon={<ShieldCheck size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 transition-transform duration-[160ms] ease-[cubic-bezier(0.34,1.26,0.64,1)] lg:group-hover:scale-[1.18] text-text-main" />}
            label="LGPD"
            tooltip="Termos & LGPD"
            isHorizontal={isHorizontal}
            isExpanded={isExpanded}
            position={position}
          />

          <SidebarBottomAction
            onClick={toggleDark}
            ariaLabel="Alternar Tema"
            icon={isDarkMode 
              ? <Sun size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 transition-transform duration-[220ms] ease-[cubic-bezier(0.34,1.26,0.64,1)] transform-gpu lg:group-hover:rotate-[42deg]" />
              : <Moon size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 transition-transform duration-[220ms] ease-[cubic-bezier(0.34,1.26,0.64,1)] transform-gpu lg:group-hover:-rotate-[18deg]" />
            }
            label={isDarkMode ? 'Claro' : 'Escuro'}
            tooltip={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            isHorizontal={isHorizontal}
            isExpanded={isExpanded}
            position={position}
          />
          
          {isHorizontal && (
            <button
              onClick={cyclePosition}
              aria-label="Alterar posição do menu"
              className={`ml-3 text-text-muted hover:text-text-main hidden lg:block p-2 group relative transform-gpu shrink-0 transition-[transform,color] duration-[180ms] ease-[cubic-bezier(0.34,1.26,0.64,1)] lg:hover:scale-[1.12] lg:hover:-translate-y-0.5`}
            >
              <Layout size={18} strokeWidth={1.5} aria-hidden="true" />
              <TooltipLabel text="Mudar Posição" position={position} isExpanded={isExpanded} />
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
};

