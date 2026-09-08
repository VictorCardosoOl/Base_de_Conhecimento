import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { CommandPalette } from '../components/CommandPalette';
import { Category, FAQItem } from '../types/index';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { SmoothScroll } from '../components/SmoothScroll';
import { Menu } from 'lucide-react';

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

    const { queue } = useReadingQueue();
    const navigate = useNavigate();
    const location = useLocation();

    const isQueueView = location.pathname === '/minha-lista';

    useEffect(() => {
        document.body.classList.toggle('dark', isDarkMode);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDarkMode ? '#000000' : '#ffffff');
        }
    }, [isDarkMode]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, []);

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

                <main className="flex-1 w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative">
                    <div className={`max-w-[1600px] mx-auto w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 max-lg:pt-24 max-lg:pb-12 lg:py-12
                        ${sidebarPos === 'left' ? 'lg:pl-[140px] lg:pr-12' : 
                          sidebarPos === 'right' ? 'lg:pr-[140px] lg:pl-12' : 
                          sidebarPos === 'top' ? 'lg:pt-[140px] lg:px-12' : 
                          'lg:pb-[140px] lg:px-12'}
                    `}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed top-4 right-4 z-40 p-2.5 glass bg-bg-island border border-border rounded-full shadow-lg text-text-main mt-[env(safe-area-inset-top)]"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                        </button>
                        <Outlet context={{ currentCategory, setCurrentCategory, openCommandPalette: () => setIsCommandPaletteOpen(true) }} />
                    </div>
                </main>
            </div>
        </SmoothScroll>
    );
};
