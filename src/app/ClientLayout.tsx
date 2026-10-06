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
import { FAQItem } from '@/types/index';

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
const ArticleModal = lazy(() =>
  import('@/components/article/ArticleModal').then((m) => ({ default: m.ArticleModal }))
);

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

  type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarPos, setSidebarPos] = useState<SidebarPosition>('left');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  useEffect(() => {
    setSidebarPos((localStorage.getItem('sidebarPos') as any) || 'left');
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
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isCommandPaletteOpen, isArticleRoute]);

  const handleCategorySelect = (cat: string | null) => {
    setCurrentCategory(cat);
    if (cat === 'Sobre') {
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
      setCurrentCategory('Sobre');
    } else if (pathname === '/minha-lista') {
      setCurrentCategory(null);
    }
  }, [pathname]);

  const getMainLayoutPaddingClass = (pos: SidebarPosition) => {
    return 'pt-24 md:pt-32 px-6 md:px-12 2xl:px-16';
  };
  const mainLayoutPaddingClass = getMainLayoutPaddingClass(sidebarPos);

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
          <Sidebar
            currentCat={currentCategory as any}
            onSelect={handleCategorySelect}
            isDarkMode={isDarkMode}
            toggleDark={() => setIsDarkMode(!isDarkMode)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isQueueView={isQueueView}
            onSelectQueue={() => {
              router.push('/minha-lista');
              setIsSidebarOpen(false);
            }}
            queueCount={queue.length}
            onLogoClick={() => {
              handleCategorySelect(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            position={sidebarPos}
            onPositionChange={setSidebarPos}
            isArticleOpen={isArticleRoute}
            isSobreRoute={true}
          />

          {isCommandPaletteOpen && (
            <Suspense fallback={null}>
              <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                onSelectArticle={(a: FAQItem) => {
                  router.push(`/artigo/${a.id}`, { scroll: false });
                  setIsCommandPaletteOpen(false);
                }}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                isDarkMode={isDarkMode}
                onSelectCategory={(cat: string) => {
                  handleCategorySelect(cat);
                  setIsCommandPaletteOpen(false);
                }}
                onSelectQueue={() => {
                  router.push('/minha-lista');
                  setIsCommandPaletteOpen(false);
                }}
              />
            </Suspense>
          )}



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
        <Sidebar
          currentCat={currentCategory as any}
          onSelect={handleCategorySelect}
          isDarkMode={isDarkMode}
          toggleDark={() => setIsDarkMode(!isDarkMode)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isQueueView={isQueueView}
          onSelectQueue={() => {
            router.push('/minha-lista');
            setIsSidebarOpen(false);
          }}
          queueCount={queue.length}
          onLogoClick={() => {
            handleCategorySelect(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          position={sidebarPos}
          onPositionChange={setSidebarPos}
          isArticleOpen={isArticleRoute}
        />

        {isCommandPaletteOpen && (
          <Suspense fallback={null}>
            <CommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              onSelectArticle={(a: FAQItem) => {
                router.push(`/artigo/${a.id}`, { scroll: false });
                setIsCommandPaletteOpen(false);
              }}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              isDarkMode={isDarkMode}
              onSelectCategory={(cat: string) => {
                handleCategorySelect(cat);
                setIsCommandPaletteOpen(false);
              }}
              onSelectQueue={() => {
                router.push('/minha-lista');
                setIsCommandPaletteOpen(false);
              }}
            />
          </Suspense>
        )}



        <main
          className={`flex-1 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${isArticleRoute ? 'z-50' : ''}`}
        >
          <div
            className={`max-w-[2000px] 4xl:max-w-[2400px] mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 max-lg:pt-24 max-lg:pb-12 lg:py-12 2xl:py-16 3xl:py-24
                        ${mainLayoutPaddingClass}
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

