'use client';

import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/features/navigation/components/Sidebar';
import { Footer } from '@/features/navigation/components/Footer';
import { useConsent } from '@/features/consent/ConsentContext';
import { useReadingQueue } from '@/features/reading/use-reading-queue';
import { initTelemetry, stopTelemetry } from '@/features/analytics/telemetry';
import { SessionSummaryContext, useSessionSummary } from '@/features/auth/use-session-summary';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Category, FAQItem } from '@/features/articles/types';
import { useThemePreference } from '../use-theme-preference';
import { useCommandPaletteShortcuts } from '../use-command-palette-shortcuts';
import { LiquidGlassEffects } from './LiquidGlassEffects';
import { ToastProvider } from '@/components/ui/Toast';

// Lazy loaded components para melhorar o tempo de carregamento inicial
const CommandPalette = lazy(() =>
  import('@/features/search/components/CommandPalette').then((m) => ({
    default: m.CommandPalette,
  }))
);
const BackToTopButton = lazy(() =>
  import('./BackToTopButton').then((m) => ({ default: m.BackToTopButton }))
);
const CookieBanner = lazy(() =>
  import('@/features/consent/components/CookieBanner').then((m) => ({ default: m.CookieBanner }))
);

const MAIN_LAYOUT_PADDING_CLASS = 'pt-24 md:pt-32 px-6 md:px-12 2xl:px-16';
const SOBRE_CATEGORY = 'Sobre' as Category;

/** Notificações (toasts) disponíveis para todas as páginas e para a navegação. */
export function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </ToastProvider>
  );
}

function ClientLayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isDarkMode, setIsDarkMode } = useThemePreference();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { queue } = useReadingQueue();
  const { hasConsented } = useConsent();
  // Uma consulta por carregamento, compartilhada pela navegação (só UX, não autorização).
  const session = useSessionSummary();

  const isArticleRoute = pathname?.startsWith('/artigo/');

  // Consentimento é revogável a qualquer momento: sem ele, o monitoramento para na hora.
  useEffect(() => {
    if (hasConsented) initTelemetry();
    else stopTelemetry();
  }, [hasConsented]);

  useCommandPaletteShortcuts(setIsCommandPaletteOpen, isArticleRoute);

  const handleCategorySelect = (cat: Category | null) => {
    setCurrentCategory(cat);
    if (cat === SOBRE_CATEGORY) {
      router.push('/sobre');
    } else if (cat) {
      router.push(`/?category=${encodeURIComponent(cat)}`);
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    if (pathname === '/sobre') {
      setCurrentCategory(SOBRE_CATEGORY);
    } else if (pathname === '/minha-lista') {
      setCurrentCategory(null);
    }
  }, [pathname]);

  const toggleDark = () => setIsDarkMode((prev) => !prev);
  const goToQueue = (close?: () => void) => {
    router.push('/minha-lista');
    close?.();
  };
  const closePalette = () => setIsCommandPaletteOpen(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Transição entre páginas: o conteúdo assenta (só transform e opacity, curta). Abrir ou
  // fechar um artigo não anima o fundo: o artigo vem por cima (modal) e o resto fica parado.
  const previousPath = useRef(pathname);
  useGSAP(() => {
    const from = previousPath.current;
    previousPath.current = pathname;
    if (!containerRef.current || from === pathname) return;
    if (from?.startsWith('/artigo/') || pathname?.startsWith('/artigo/')) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'expo.out', overwrite: 'auto', clearProps: 'transform,opacity' }
      );
    });
    return () => mm.revert();
  }, [pathname]);

  const sidebar = (
    <Sidebar
      currentCat={currentCategory}
      onSelect={handleCategorySelect}
      isDarkMode={isDarkMode}
      toggleDark={toggleDark}
      onSelectQueue={() => goToQueue()}
      queueCount={queue.length}
      onLogoClick={() => setCurrentCategory(null)}
      session={session}
    />
  );

  const commandPalette = isCommandPaletteOpen && (
    <Suspense fallback={null}>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closePalette}
        onSelectArticle={(a: FAQItem) => {
          router.push(`/artigo/${a.id}`, { scroll: false });
          closePalette();
        }}
        onToggleTheme={toggleDark}
        isDarkMode={isDarkMode}
        onSelectCategory={(cat: Category | null) => {
          handleCategorySelect(cat);
          closePalette();
        }}
        onSelectQueue={() => goToQueue(closePalette)}
      />
    </Suspense>
  );

  return (
    <SessionSummaryContext.Provider value={session}>
      <LiquidGlassEffects />
      {/* Conteúdo acima do fundo (z-10). */}
      <div className="relative z-10 flex min-h-screen selection:bg-selection">
        {sidebar}
        {commandPalette}

        <main
          className="flex-1 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative"
        >
          <div
            className={`max-w-[2000px] 4xl:max-w-[2400px] mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 max-lg:pt-24 max-lg:pb-12 lg:pt-28 lg:pb-12 2xl:pb-16 3xl:pb-24
                        ${MAIN_LAYOUT_PADDING_CLASS}
                    `}
          >
            <div ref={containerRef} className="w-full transform-gpu">
              {children}
            </div>
          </div>
        </main>
      </div>

      <Footer />

      <Suspense fallback={null}>
        <BackToTopButton />
        <CookieBanner />
      </Suspense>
    </SessionSummaryContext.Provider>
  );
}
