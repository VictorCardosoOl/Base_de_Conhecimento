'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Category } from '@/features/articles/types';
import type { ClientSessionSummary } from '@/features/auth/use-session-summary';
import { AccountMenu } from '@/features/auth/components/AccountMenu';
import { useToast } from '@/components/ui/Toast';
import { AppHeader } from './AppHeader';
import { NavDrawer } from './NavDrawer';
import './nav.css';

const DRAWER_ID = 'nav-drawer';

interface SidebarProps {
  currentCat: Category | null;
  onSelect: (cat: Category | null) => void;
  isDarkMode: boolean;
  toggleDark: () => void;
  onSelectQueue: () => void;
  queueCount?: number;
  onLogoClick?: () => void;
  /** Estado da sessão só para a navegação (null enquanto carrega). Não é autorização. */
  session?: ClientSessionSummary | null;
}

/**
 * Navegação do site: cabeçalho (AppHeader) e menu lateral (NavDrawer) com um estado só.
 * Esc fecha o menu e devolve o foco ao botão; trocar de página também fecha.
 */
export function Sidebar({
  currentCat,
  onSelect,
  isDarkMode,
  toggleDark,
  onSelectQueue,
  queueCount = 0,
  onLogoClick,
  session = null,
}: SidebarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const pathname = usePathname();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // Trocou de página (ex.: abriu um artigo pelo menu): fecha.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleAlertClick = async () => {
    if (!('Notification' in window)) {
      toast.show({ title: 'Alertas indisponíveis', message: 'Este navegador não possui suporte a notificações.' });
      return;
    }
    if (Notification.permission === 'granted') {
      toast.show({ tone: 'success', title: 'Alertas ativos', message: 'As notificações já estão permitidas neste navegador.' });
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.show({ tone: 'success', title: 'Alertas ativados', message: 'Você será avisado neste navegador.' });
      } else {
        toast.show({ title: 'Alertas não ativados', message: 'A permissão de notificações foi negada no navegador.' });
      }
    }
  };

  return (
    <>
      <AppHeader
        drawerId={DRAWER_ID}
        drawerOpen={open}
        onToggleDrawer={() => setOpen((value) => !value)}
        toggleRef={toggleRef}
        queueCount={queueCount}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleDark}
        onAlerts={handleAlertClick}
        onHome={() => {
          close();
          onLogoClick?.();
        }}
        accountSlot={<AccountMenu session={session} />}
      />
      {/* useSearchParams: só o menu espera a URL no cliente, não a página inteira. */}
      <Suspense fallback={null}>
      <NavDrawer
        id={DRAWER_ID}
        open={open}
        currentCategory={currentCat}
        queueCount={queueCount}
        onSelectCategory={(cat) => {
          onSelect(cat);
          close();
        }}
        onSelectQueue={() => {
          onSelectQueue();
          close();
        }}
        onOpenAbout={() => {
          onSelect(Category.SOBRE);
          close();
        }}
        onOpenPrivacy={() => {
          // Entrada dos documentos institucionais: Termos → Privacidade → Cookies.
          router.push('/termos');
          close();
        }}
        onClose={() => close()}
      />
      </Suspense>
    </>
  );
}
