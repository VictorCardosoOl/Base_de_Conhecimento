"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "@/lib/animations";
import { Sidebar } from "@/components/layout/Sidebar";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Menu } from "lucide-react";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { LegalModal } from "@/components/ui/LegalModal";
import { useConsent } from "@/contexts/ConsentContext";
import { useReadingQueue } from "@/hooks/use-reading-queue";
import { initTelemetry } from "@/lib/telemetry";

const CommandPalette = lazy(() => 
    import("@/components/ui/CommandPalette").then(m => ({ default: m.CommandPalette }))
);

export function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem("isDarkMode");
        if (saved !== null) {
            setIsDarkMode(saved === "true");
        } else {
            setIsDarkMode(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("isDarkMode", String(isDarkMode));
        document.documentElement.classList.toggle("dark", isDarkMode);
        document.body.classList.toggle("dark", isDarkMode);
        document.documentElement.style.colorScheme = isDarkMode ?'dark' : 'light';
    }, [isDarkMode, isMounted]);

    type SidebarPosition = "left" | "right" | "top" | "bottom";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarPos, setSidebarPos] = useState<SidebarPosition>("left");
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<any>(null);

    useEffect(() => {
        setSidebarPos((localStorage.getItem("sidebarPos") as any) || "left");
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("sidebarPos", sidebarPos);
    }, [sidebarPos, isMounted]);

    const pathname = usePathname();
    const router = useRouter();
    const { queue } = useReadingQueue();
    const { hasConsented } = useConsent();

    const isQueueView = pathname === "/minha-lista";
    const isArticleRoute = pathname?.startsWith("/artigo/");
    const isSobreRoute = pathname === "/sobre";

    useEffect(() => {
        if (hasConsented) initTelemetry();
    }, [hasConsented]);

    useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isEditing = activeTag === "input" || activeTag === "textarea";

            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            } else if (e.key === "/" && !isEditing && !isArticleRoute) {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            } else if (e.key === "Escape" && isCommandPaletteOpen) {
                setIsCommandPaletteOpen(false);
            }
        };
        window.addEventListener("keydown", handleGlobalKeys);
        return () => window.removeEventListener("keydown", handleGlobalKeys);
    }, [isCommandPaletteOpen, isArticleRoute]);

    const handleCategorySelect = (cat: any) => {
        setCurrentCategory(cat);
        if (cat === "Sobre") {
            router.push("/sobre");
        } else if (cat) {
            router.push(`/?category=${encodeURIComponent(cat)}`);
        } else {
            router.push("/");
        }
        setIsSidebarOpen(false);
    };

    // Auto-select category based on pathname on load or path change
    useEffect(() => {
        if (pathname === "/sobre") {
            setCurrentCategory("Sobre");
        } else if (pathname === "/minha-lista") {
            setCurrentCategory(null);
        } else if (pathname === "/") {
            // Keep currentCategory if it's already set (handled by Home component via query params)
        }
    }, [pathname]);

    const getSidebarPaddingClass = (pos: "left" | "right" | "top" | "bottom") => {
        switch (pos) {
            case "right": return "lg:pr-[140px] 2xl:lg:pr-[160px] 3xl:lg:pr-[180px]";
            case "top": return "lg:pt-[140px] 2xl:lg:pt-[160px] 3xl:lg:pt-[180px]";
            case "bottom": return "lg:pb-[140px] 2xl:lg:pb-[160px] 3xl:lg:pb-[180px]";
            case "left":
            default: return "lg:pl-[140px] 2xl:lg:pl-[160px] 3xl:lg:pl-[180px]";
        }
    };
    const sidebarPaddingClass = getSidebarPaddingClass(sidebarPos);

    const getMainLayoutPaddingClass = (pos: SidebarPosition) => {
        switch (pos) {
            case "right": return "lg:pr-[140px] 2xl:pr-[160px] 3xl:pr-[180px] lg:pl-12 2xl:pl-16 3xl:pl-24";
            case "top": return "lg:pt-[140px] 2xl:pt-[160px] 3xl:pt-[180px] lg:px-12 2xl:px-16 3xl:px-24";
            case "bottom": return "lg:pb-[140px] 2xl:pb-[160px] 3xl:pb-[180px] lg:px-12 2xl:px-16 3xl:px-24";
            case "left":
            default: return "lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] lg:pr-12 2xl:pr-16 3xl:pr-24";
        }
    };
    const mainLayoutPaddingClass = getMainLayoutPaddingClass(sidebarPos);

    if (isSobreRoute) {
        return (
            <SmoothScroll>
                <div className="min-h-screen selection:bg-selection">
                    <Sidebar
                        currentCat={currentCategory as any}
                        onSelect={handleCategorySelect}
                        isDarkMode={isDarkMode}
                        toggleDark={() => setIsDarkMode(!isDarkMode)}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        isQueueView={isQueueView}
                        onSelectQueue={() => { router.push("/minha-lista"); setIsSidebarOpen(false); }}
                        queueCount={queue.length}
                        onLogoClick={() => { handleCategorySelect(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        position={sidebarPos}
                        onPositionChange={setSidebarPos}
                        isArticleOpen={isArticleRoute}
                    />

                    {isCommandPaletteOpen && (
                        <Suspense fallback={null}>
                            <CommandPalette
                                isOpen={isCommandPaletteOpen}
                                onClose={() => setIsCommandPaletteOpen(false)}
                                onSelectArticle={(a: any) => { router.push(`/artigo/${a.id}`); setIsCommandPaletteOpen(false); }}
                                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                                isDarkMode={isDarkMode}
                                onSelectCategory={(cat: any) => { handleCategorySelect(cat); setIsCommandPaletteOpen(false); }}
                                onSelectQueue={() => { router.push("/minha-lista"); setIsCommandPaletteOpen(false); }}
                            />
                        </Suspense>
                    )}

                    <main className="w-full relative">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed top-4 right-4 z-40 p-2.5 bg-bg-island border border-border rounded-full shadow-lg text-text-main mt-[env(safe-area-inset-top)]"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                        </button>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                variants={pageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-full transform-gpu"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    <CookieBanner />
                    <LegalModal />
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
                    onSelectQueue={() => { router.push("/minha-lista"); setIsSidebarOpen(false); }}
                    queueCount={queue.length}
                    onLogoClick={() => { handleCategorySelect(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    position={sidebarPos}
                    onPositionChange={setSidebarPos}
                    isArticleOpen={isArticleRoute}
                />

                {isCommandPaletteOpen && (
                    <Suspense fallback={null}>
                        <CommandPalette
                            isOpen={isCommandPaletteOpen}
                            onClose={() => setIsCommandPaletteOpen(false)}
                            onSelectArticle={(a: any) => { router.push(`/artigo/${a.id}`); setIsCommandPaletteOpen(false); }}
                            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                            isDarkMode={isDarkMode}
                            onSelectCategory={(cat: any) => { handleCategorySelect(cat); setIsCommandPaletteOpen(false); }}
                            onSelectQueue={() => { router.push("/minha-lista"); setIsCommandPaletteOpen(false); }}
                        />
                    </Suspense>
                )}

                <main className={`flex-1 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${isArticleRoute ?"z-50" : ""}`}>
                    <div className={`max-w-[2000px] 4xl:max-w-[2400px] mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 max-lg:pt-24 max-lg:pb-12 lg:py-12 2xl:py-16 3xl:py-24
                        ${mainLayoutPaddingClass}
                    `}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed top-4 right-4 z-40 p-2.5  bg-bg-island border border-border rounded-full shadow-lg text-text-main mt-[env(safe-area-inset-top)]"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                        </button>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                variants={pageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-full transform-gpu"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                <BackToTopButton />
                <CookieBanner />
                <LegalModal />
            </div>
        </SmoothScroll>
    );
}
