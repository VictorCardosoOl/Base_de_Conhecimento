'use client';

import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/features/navigation/components/Sidebar';
import { Footer } from '@/features/navigation/components/Footer';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { useConsent } from '@/contexts/ConsentContext';
import { useReadingQueue } from '@/hooks/use-reading-queue';
import { initTelemetry } from '@/lib/telemetry';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Category, FAQItem } from '@/types/index';

// Lazy loaded components para melhorar o tempo de carregamento inicial
const CommandPalette = lazy(() =>
  import('@/features/search/components/CommandPalette').then((m) => ({
    default: m.CommandPalette,
  }))
);
const BackToTopButton = lazy(() =>
  import('@/components/ui/BackToTopButton').then((m) => ({ default: m.BackToTopButton }))
);
const CookieBanner = lazy(() =>
  import('@/components/ui/CookieBanner').then((m) => ({ default: m.CookieBanner }))
);
const LegalModal = lazy(() =>
  import('@/components/ui/LegalModal').then((m) => ({ default: m.LegalModal }))
);

type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';
const SIDEBAR_POSITIONS: SidebarPosition[] = ['left', 'right', 'top', 'bottom'];
const MAIN_LAYOUT_PADDING_CLASS = 'pt-24 md:pt-32 px-6 md:px-12 2xl:px-16';
const SOBRE_CATEGORY = 'Sobre' as Category;

export function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) {
      setIsDarkMode(saved === 'true');
    } else {
      setIsDarkMode(
        window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('isDarkMode', String(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode, isMounted]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarPos, setSidebarPos] = useState<SidebarPosition>('left');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarPos') as SidebarPosition | null;
    setSidebarPos(saved && SIDEBAR_POSITIONS.includes(saved) ? saved : 'left');
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('sidebarPos', sidebarPos);
  }, [sidebarPos, isMounted]);

  const pathname = usePathname();
  const router = useRouter();
  const { queue } = useReadingQueue();
  const { hasConsented } = useConsent();

  const isQueueView = pathname === '/minha-lista';
  const isArticleRoute = pathname?.startsWith('/artigo/');
  const isSobreRoute = pathname === '/sobre';

  useEffect(() => {
    if (hasConsented) initTelemetry();
  }, [hasConsented]);

  // Atalhos globais. O ESC com a palette aberta é tratado pela própria CommandPalette.
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditing = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !isEditing && !isArticleRoute) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isArticleRoute]);

  const handleCategorySelect = (cat: Category | null) => {
    setCurrentCategory(cat);
    if (cat === SOBRE_CATEGORY) {
      router.push('/sobre');
    } else if (cat) {
      router.push(`/?category=${encodeURIComponent(cat)}`);
    } else {
      router.push('/');
    }
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (pathname === '/sobre') {
      setCurrentCategory(SOBRE_CATEGORY);
    } else if (pathname === '/minha-lista') {
      setCurrentCategory(null);
    }
  }, [pathname]);

  const toggleDark = () => setIsDarkMode((prev) => !prev);
  const goToQueue = (close: () => void) => {
    router.push('/minha-lista');
    close();
  };
  const closeSidebar = () => setIsSidebarOpen(false);
  const closePalette = () => setIsCommandPaletteOpen(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Page transition with GSAP
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power4.out', overwrite: 'auto' }
    );
  }, [pathname]);

  const sidebar = (
    <Sidebar
      currentCat={currentCategory}
      onSelect={handleCategorySelect}
      isDarkMode={isDarkMode}
      toggleDark={toggleDark}
      isOpen={isSidebarOpen}
      onClose={closeSidebar}
      isQueueView={isQueueView}
      onSelectQueue={() => goToQueue(closeSidebar)}
      queueCount={queue.length}
      onLogoClick={() => {
        handleCategorySelect(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      position={sidebarPos}
      onPositionChange={setSidebarPos}
      isArticleOpen={isArticleRoute}
      {...(isSobreRoute ? { isSobreRoute: true } : {})}
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

  if (isSobreRoute) {
    return (
      <SmoothScroll>
        <div className="min-h-screen selection:bg-selection bg-[#EBE9E1]">
          <style>{`
            footer, .staggered-menu-panel, .sm-prelayer {
              background-color: #EBE9E1 !important;
            }
            .staggered-menu-wrapper, footer {
              --bg-main: #EBE9E1 !important;
              --bg-island: #EBE9E1 !important;
              --text-main: #1a1a1a !important;
              --text-muted: rgba(26,26,26,0.6) !important;
              --text-body: #1a1a1a !important;
              --border: rgba(26,26,26,0.1) !important;
            }
            .staggered-menu-header {
              background-color: transparent !important;
            }
          `}</style>
          {sidebar}
          {commandPalette}

          <main className="w-full relative">
            <div ref={containerRef} className="w-full transform-gpu">
              {children}
            </div>
          </main>

          <Footer />

          <Suspense fallback={null}>
            <CookieBanner />
            <LegalModal />
          </Suspense>
        </div>
      </SmoothScroll>
    );
  }

  return (
    <SmoothScroll>
      <div className="flex min-h-screen selection:bg-selection transition-colors duration-500 bg-bg-main">
        {sidebar}
        {commandPalette}

        <main
          className={`flex-1 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${isArticleRoute ? 'z-50' : ''}`}
        >
          <div
            className={`max-w-[2000px] 4xl:max-w-[2400px] mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 max-lg:pt-24 max-lg:pb-12 lg:py-12 2xl:py-16 3xl:py-24
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
        <LegalModal />
      </Suspense>
    </SmoothScroll>
  );
}
