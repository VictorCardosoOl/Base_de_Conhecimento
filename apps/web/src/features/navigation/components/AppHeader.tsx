'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/ui/Logo';
import { Bell, Bookmark, Moon, Sun } from 'lucide-react';
import { HeaderSearch } from '@/features/search/components/HeaderSearch';

export interface AppHeaderProps {
  drawerId: string;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  toggleRef: React.RefObject<HTMLButtonElement | null>;
  queueCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onAlerts: () => void;
  onHome: () => void;
  accountSlot: React.ReactNode;
}

/** Ícone com dica de vidro (mesmo padrão para todas as ações do cabeçalho). */
function HeaderAction({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <span className="nav-tooltip" aria-hidden="true">
        {tip}
      </span>
    </div>
  );
}

/**
 * Cabeçalho flutuante de vidro.
 *
 * Rolar para baixo esconde (só transform); para cima, volta. Depois de 24px o vidro
 * fica mais denso (opacidade de uma camada, sem trocar o desfoque). Não some com o
 * menu aberto, com a busca aberta ou com o foco dentro dele. Um listener passivo, um
 * quadro por vez, e o DOM só é tocado quando o estado muda.
 */
export function AppHeader({
  drawerId,
  drawerOpen,
  onToggleDrawer,
  toggleRef,
  queueCount,
  isDarkMode,
  onToggleTheme,
  onAlerts,
  onHome,
  accountSlot,
}: AppHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const drawerOpenRef = useRef(drawerOpen);
  useEffect(() => {
    drawerOpenRef.current = drawerOpen;
    if (drawerOpen) headerRef.current?.removeAttribute('data-hidden');
  }, [drawerOpen]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let lastY = window.scrollY;
    let frame = 0;
    let scrolled = false;
    let hidden = false;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const nextScrolled = y > 24;
      const pinned =
        drawerOpenRef.current ||
        header.contains(document.activeElement) ||
        header.querySelector('.header-search[data-open]') !== null;
      let nextHidden = hidden;
      if (pinned || y < 80) nextHidden = false;
      else if (y > lastY + 4) nextHidden = true;
      else if (y < lastY - 4) nextHidden = false;
      lastY = y;

      if (nextScrolled !== scrolled) {
        scrolled = nextScrolled;
        header.toggleAttribute('data-scrolled', scrolled);
      }
      if (nextHidden !== hidden) {
        hidden = nextHidden;
        header.toggleAttribute('data-hidden', hidden);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const queueLabel = `Minha Lista (${queueCount} ${queueCount === 1 ? 'item salvo' : 'itens salvos'})`;

  return (
    <header ref={headerRef} className="app-header" aria-label="Cabeçalho de navegação">
      <button
        ref={toggleRef}
        type="button"
        className="nav-toggle"
        aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={drawerOpen}
        aria-controls={drawerId}
        onClick={onToggleDrawer}
      >
        <span className="nav-toggle-icon" aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="nav-toggle-label" aria-hidden="true">
          {drawerOpen ? 'Fechar' : 'Menu'}
        </span>
      </button>

      <Link href="/" className="app-header-brand" aria-label="Início" onClick={onHome}>
        <LogoMark size={26} className="app-header-brand-mark" />
        <span className="app-header-brand-text" aria-hidden="true">
          Base <span className="app-header-brand-accent">SST</span>
        </span>
      </Link>

      <div className="app-header-actions">
        <HeaderSearch />
        <HeaderAction tip="Alertas">
          <button type="button" className="nav-icon-button" aria-label="Alertas" onClick={onAlerts}>
            <Bell size={19} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </HeaderAction>
        <HeaderAction tip={isDarkMode ? 'Modo claro' : 'Modo escuro'}>
          <button
            type="button"
            className="nav-icon-button nav-theme-toggle"
            aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            aria-pressed={isDarkMode}
            data-dark={isDarkMode || undefined}
            onClick={onToggleTheme}
          >
            <Sun size={19} strokeWidth={1.6} aria-hidden="true" className="nav-theme-sun" />
            <Moon size={18} strokeWidth={1.6} aria-hidden="true" className="nav-theme-moon" />
          </button>
        </HeaderAction>
        <HeaderAction tip="Minha Lista">
          <Link href="/minha-lista" aria-label={queueLabel} className="nav-icon-button">
            <Bookmark size={19} strokeWidth={1.6} aria-hidden="true" />
            {queueCount > 0 && (
              <span className="nav-badge" aria-hidden="true">
                {queueCount}
              </span>
            )}
          </Link>
        </HeaderAction>
        {accountSlot}
      </div>
    </header>
  );
}
