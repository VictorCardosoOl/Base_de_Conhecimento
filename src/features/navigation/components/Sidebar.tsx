import React from 'react';
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
      alert('Seu navegador não possui suporte nativo a Web Push Notifications.');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('SST FAQ Atualizações', {
        body: 'Notificações corporativas ativadas! Você receberá comunicados urgentes de normas e eSocial.',
        icon: '/pwa-192x192.png',
      });
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('SST FAQ Conectado', {
          body: 'Notificações ativadas com sucesso.',
          icon: '/pwa-192x192.png',
        });
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
    <StaggeredMenu
      isFixed={true}
      position="left"
      items={menuItems}
      socialItems={socialItems}
      displaySocials={true}
      displayItemNumbering={true}
      onLogoClick={onLogoClick}
    />
  );
};
