import React, { useState } from 'react';
import { Category } from '@/types/index';
import { useConsent } from '@/contexts/ConsentContext';
import StaggeredMenu from './StaggeredMenu';

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
  position: 'left' | 'right' | 'top' | 'bottom';
  onPositionChange: (pos: 'left' | 'right' | 'top' | 'bottom') => void;
  isArticleOpen?: boolean;
  isSobreRoute?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCat,
  onSelect,
  isDarkMode,
  toggleDark,
  isOpen,
  onClose,
  isQueueView,
  onSelectQueue,
  queueCount = 0,
  position,
  onPositionChange,
  isArticleOpen,
  isSobreRoute,
  onLogoClick,
}) => {
  const { setOpenLegalModal, setActiveLegalTab } = useConsent();
  const [toastMsg, setToastMsg] = useState<{title: string, msg: string} | null>(null);

  const showToast = (title: string, msg: string) => {
    setToastMsg({ title, msg });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Mapeia categorias e opções para o StaggeredMenu
  const menuItems = [
    ...Object.values(Category).map((cat) => ({
      label: cat,
      ariaLabel: `Filtrar por módulo ${cat}`,
      isActive: currentCat === cat,
      onClick: () => {
        onSelect(cat);
      },
    })),

  ];

  const handleAlertClick = async () => {
    if (!('Notification' in window)) {
      showToast('Aviso', 'Seu navegador não possui suporte nativo a Web Push Notifications.');
      return;
    }
    if (Notification.permission === 'granted') {
      showToast('SST FAQ Atualizações', 'Notificações corporativas já estão ativadas! Você receberá comunicados urgentes.');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('SST FAQ Conectado', 'Notificações ativadas com sucesso.');
      }
    }
  };

  const socialItems = [
    {
      label: 'Sobre o Projeto',
      onClick: () => {
        window.location.href = '/sobre';
      },
    },
    {
      label: 'Alertas',
      onClick: handleAlertClick,
    },
    {
      label: 'LGPD',
      onClick: () => {
        setActiveLegalTab('privacy');
        setOpenLegalModal(true);
      },
    },
    {
      label: isDarkMode ? 'Modo Claro' : 'Modo Escuro',
      onClick: toggleDark,
    },
  ];

  return (
    <>
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[200] bg-stone-900 dark:bg-white text-white dark:text-black p-4 rounded-xl shadow-2xl max-w-sm animate-in fade-in slide-in-from-top-5">
          <p className="font-bold text-sm">{toastMsg.title}</p>
          <p className="text-xs mt-1 opacity-90">{toastMsg.msg}</p>
        </div>
      )}
      <StaggeredMenu
        isFixed={true}
        position="left"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        onLogoClick={onLogoClick}
      />
    </>
  );
};
