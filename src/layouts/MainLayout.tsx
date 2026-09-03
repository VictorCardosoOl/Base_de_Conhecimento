import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { CommandPalette } from '../components/CommandPalette';
import { Category, FAQItem } from '../types';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { SmoothScroll } from '../components/SmoothScroll';
import { Menu } from 'lucide-react';

export const MainLayout: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(true);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
            // In a real app we might have /category/:slug, but for now we filter in Home
            // Let's assume we pass this state via context or URL query params.
            // Ideally, URL: /?category=SST
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
            <div className="flex min-h-screen selection:bg-[var(--selection)] transition-colors duration-500 bg-[var(--bg-main)]">
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
                    isPinned={isSidebarPinned}
                    onPinToggle={() => setIsSidebarPinned(!isSidebarPinned)}
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

                <main className={`flex-1 transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)] px-5 sm:px-8 md:px-12 pt-8 pb-12 ${isSidebarPinned ? 'lg:pl-64' : 'lg:pl-28'} lg:pr-16 pt-[max(2rem,env(safe-area-inset-top))]`}>
                    <div className="max-w-5xl mx-auto">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed top-4 right-4 z-40 p-2.5 glass bg-[var(--bg-island)] border border-[var(--border)] rounded-full shadow-lg text-[var(--text-main)] mt-[env(safe-area-inset-top)]"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                        </button>
                        <Outlet context={{ currentCategory, setCurrentCategory }} />
                    </div>
                </main>
            </div>
        </SmoothScroll>
    );
};
