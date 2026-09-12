import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Category, FAQItem } from '../types/index';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { SmoothScroll } from '../components/ui/SmoothScroll';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Menu } from 'lucide-react';
import { OfflineIndicator } from '../components/ui/OfflineIndicator';
import { BackToTopButton } from '../components/ui/BackToTopButton';

export const MainLayout: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('isDarkMode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    useEffect(() => {
        localStorage.setItem('isDarkMode', String(isDarkMode));
    }, [isDarkMode]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarPos, setSidebarPos] = useState<'left'|'right'|'top'|'bottom'>(() => {
        return (localStorage.getItem('sidebarPos') as 'left'|'right'|'top'|'bottom') || 'left';
    });
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebarPos', sidebarPos);
    }, [sidebarPos]);

    // State for sidebar selection (can be synced with URL in pages, but kept here for visual state)
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [isArticleOpen, setIsArticleOpen] = useState(false);

    const { queue } = useReadingQueue();
    const navigate = useNavigate();
    const location = useLocation();

    const isQueueView = location.pathname === '/minha-lista';

    // Se estiver na página de artigo (via CommandPalette), também consideramos "aberto"
    const isArticleRoute = location.pathname.startsWith('/artigo/');
    const effectivelyArticleOpen = isArticleOpen || isArticleRoute;

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.body.classList.toggle('dark', isDarkMode);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDarkMode ? '#000000' : '#ffffff');
        }
    }, [isDarkMode]);

    // Global keyboard shortcuts (Ctrl+K, '/', Esc)
    useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            // Não intercepta se o usuário estiver digitando em um input ou textarea comum
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isEditing = activeTag === 'input' || activeTag === 'textarea';

            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            } else if (e.key === '/' && !isEditing && !effectivelyArticleOpen) {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            } else if (e.key === 'Escape' && isCommandPaletteOpen) {
                setIsCommandPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isCommandPaletteOpen, effectivelyArticleOpen]);

    const handleCategorySelect = (cat: Category | null) => {
        setCurrentCategory(cat);
        if (cat) {
            navigate(`/?category=${encodeURIComponent(cat)}`);
        } else {
            navigate('/');
        }
        setIsSidebarOpen(false);
    };

    const handleQueueSelect = () => {
        navigate('/minha-lista');
        setIsSidebarOpen(false);
    };

    const handleReset = () => {
        setCurrentCategory(null);
        navigate('/');
        setIsSidebarOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <SmoothScroll>
            <div className="flex min-h-screen selection:bg-selection transition-colors duration-500 bg-bg-main">
                <Sidebar
                    currentCat={currentCategory}
                    onSelect={handleCategorySelect}
                    isDarkMode={isDarkMode}
                    toggleDark={() => setIsDarkMode(!isDarkMode)}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isQueueView={isQueueView}
                    onSelectQueue={handleQueueSelect}
                    queueCount={queue.length}
                    onLogoClick={handleReset}
                    position={sidebarPos}
                    onPositionChange={setSidebarPos}
                    isArticleOpen={effectivelyArticleOpen}
                />

                <CommandPalette
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    onSelectArticle={(a) => { navigate(`/artigo/${a.id}`); setIsCommandPaletteOpen(false); }}
                    onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                    isDarkMode={isDarkMode}
                    onSelectCategory={(cat) => { handleCategorySelect(cat); setIsCommandPaletteOpen(false); }}
                    onSelectQueue={() => { handleQueueSelect(); setIsCommandPaletteOpen(false); }}
                />

                <main className={`flex-1 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${effectivelyArticleOpen ? 'z-50' : ''}`}>
                    <div className={`max-w-[2000px] 4xl:max-w-[2400px] mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 max-lg:pt-24 max-lg:pb-12 lg:py-12 2xl:py-16 3xl:py-24
                        ${sidebarPos === 'left' ? 'lg:pl-[140px] 2xl:lg:pl-[160px] 3xl:lg:pl-[180px] lg:pr-12 2xl:lg:pr-16 3xl:lg:pr-24' : 
                          sidebarPos === 'right' ? 'lg:pr-[140px] 2xl:lg:pr-[160px] 3xl:lg:pr-[180px] lg:pl-12 2xl:lg:pl-16 3xl:lg:pl-24' : 
                          sidebarPos === 'top' ? 'lg:pt-[140px] 2xl:lg:pt-[160px] 3xl:lg:pt-[180px] lg:px-12 2xl:lg:px-16 3xl:lg:px-24' : 
                          'lg:pb-[140px] 2xl:lg:pb-[160px] 3xl:lg:pb-[180px] lg:px-12 2xl:lg:px-16 3xl:lg:px-24'}
                    `}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed top-4 right-4 z-40 p-2.5 glass bg-bg-island border border-border rounded-full shadow-lg text-text-main mt-[env(safe-area-inset-top)]"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                        </button>

                        {/* Transição Cinematográfica de Roteamento Awwwards (Otimizada para 120Hz) */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ 
                                    duration: 0.22, 
                                    ease: [0.16, 1, 0.3, 1] 
                                }}
                                className="w-full will-change-[transform,opacity]"
                            >
                                <Outlet context={{ currentCategory, setCurrentCategory, openCommandPalette: () => setIsCommandPaletteOpen(true), setIsArticleOpen }} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Vercel Real-Time Analytics & Core Web Vitals */}
                <Analytics />
                <SpeedInsights />

                {/* Utilitários PWA e Acessibilidade */}
                <OfflineIndicator />
                <BackToTopButton />
            </div>
        </SmoothScroll>
    );
};
