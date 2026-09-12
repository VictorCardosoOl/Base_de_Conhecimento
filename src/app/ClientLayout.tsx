"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Menu } from "lucide-react";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { LegalModal } from "@/components/ui/LegalModal";
import { useConsent } from "@/contexts/ConsentContext";
import { useReadingQueue } from "@/hooks/useReadingQueue";
import { initTelemetry } from "@/lib/telemetry";

const CommandPalette = lazy(() => 
    import("@/components/ui/CommandPalette").then(m => ({ default: m.CommandPalette }))
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem("isDarkMode");
        if (saved !== null) {
            setIsDarkMode(saved === "true");
        } else {
            setIsDarkMode(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("isDarkMode", String(isDarkMode));
        document.documentElement.classList.toggle("dark", isDarkMode);
        document.body.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarPos, setSidebarPos] = useState<"left"|"right"|"top"|"bottom">("left");
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<string | null>(null);

    useEffect(() => {
        setSidebarPos((localStorage.getItem("sidebarPos") as any) || "left");
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebarPos", sidebarPos);
    }, [sidebarPos]);

    const pathname = usePathname();
    const router = useRouter();
    const { queue } = useReadingQueue();
    const { hasConsented } = useConsent();

    const isQueueView = pathname === "/minha-lista";
    const isArticleRoute = pathname?.startsWith("/artigo/");

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

    const handleCategorySelect = (cat: string | null) => {
        setCurrentCategory(cat);
        if (cat) {
            router.push(`/?category=${encodeURIComponent(cat)}`);
        } else {
            router.push("/");
        }
        setIsSidebarOpen(false);
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

                <main className={`flex-1 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${isArticleRoute ? "z-50" : ""}`}>
                    <div className={`max-w-[2000px] 4xl:max-w-[2400px] mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                        px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 max-lg:pt-24 max-lg:pb-12 lg:py-12 2xl:py-16 3xl:py-24
                        ${sidebarPos === "left" ? "lg:pl-[140px] 2xl:lg:pl-[160px] 3xl:lg:pl-[180px] lg:pr-12 2xl:lg:pr-16 3xl:lg:pr-24" : 
                          sidebarPos === "right" ? "lg:pr-[140px] 2xl:lg:pr-[160px] 3xl:lg:pr-[180px] lg:pl-12 2xl:lg:pl-16 3xl:lg:pl-24" : 
                          sidebarPos === "top" ? "lg:pt-[140px] 2xl:lg:pt-[160px] 3xl:lg:pt-[180px] lg:px-12 2xl:lg:px-16 3xl:lg:px-24" : 
                          "lg:pb-[140px] 2xl:lg:pb-[160px] 3xl:lg:pb-[180px] lg:px-12 2xl:lg:px-16 3xl:lg:px-24"}
                    `}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed top-4 right-4 z-40 p-2.5 glass bg-bg-island border border-border rounded-full shadow-lg text-text-main mt-[env(safe-area-inset-top)]"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                        </button>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
                                exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] } }}
                                className="w-full will-change-[transform,opacity,filter]"
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
