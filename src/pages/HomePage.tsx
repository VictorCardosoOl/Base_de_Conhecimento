import React, { useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/ui/SearchBar';
import { MasterDetailGrid } from '../components/layout/MasterDetailGrid';
import { IntroducaoHero } from '../components/article/IntroducaoHero';
import { FAQ_DATA } from '../constants/index';
import { Category, FAQItem } from '../types/index';
import { useOutletContext } from 'react-router-dom';
import { ReadingExperienceService } from '../services/readingExperienceService';
import { KineticText } from '../components/ui/KineticText';

export const HomePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');

    const [recentSearches, setRecentSearches] = useState<string[]>(() => ReadingExperienceService.getRecentSearches());
    const [recentArticles, setRecentArticles] = useState<FAQItem[]>(() => {
        const ids = ReadingExperienceService.getRecentArticles();
        return ids.map(id => FAQ_DATA.find(a => a.id === id)).filter(Boolean) as FAQItem[];
    });

    const { setCurrentCategory, openCommandPalette, setIsArticleOpen } = useOutletContext<{ 
        setCurrentCategory: (c: Category | null) => void,
        openCommandPalette: () => void,
        setIsArticleOpen: (isOpen: boolean) => void
    }>();

    useEffect(() => {
        if (categoryParam && Object.values(Category).includes(categoryParam as Category)) {
            setCurrentCategory(categoryParam as Category);
        } else {
            setCurrentCategory(null);
        }
    }, [categoryParam, setCurrentCategory]);

    // Busca centralizada de arquivos, apenas filtra por categoria ativa aqui na Home
    const displayedArticles = useMemo(() => {
        return FAQ_DATA.filter(item => {
            return !categoryParam || item.category === categoryParam;
        });
    }, [categoryParam]);

    const isIntroducaoCategory = categoryParam === Category.INTRODUCAO;

    return (
        <div className={isIntroducaoCategory ? "space-y-4 lg:space-y-6 2xl:space-y-8" : "space-y-12 2xl:space-y-16 3xl:space-y-20"}>
            {/* Header com Arquivos 2026, Título da Categoria e Barra de Pesquisa */}
            <header className={isIntroducaoCategory ? "space-y-2 text-center max-w-lg 2xl:max-w-xl mx-auto" : "space-y-6 2xl:space-y-8 text-center max-w-3xl 2xl:max-w-4xl mx-auto"}>
                <div className={isIntroducaoCategory ? "space-y-0.5" : "space-y-2 2xl:space-y-3"}>
                    <div className="flex items-center justify-center gap-3 text-[9px] 2xl:text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted reveal">
                        <div className="w-6 2xl:w-10 h-[1px] bg-stone-300 dark:bg-stone-700" />
                        <span>Arquivos 2026</span>
                        <div className="w-6 2xl:w-10 h-[1px] bg-stone-300 dark:bg-stone-700" />
                    </div>

                    <div className={isIntroducaoCategory ? "text-xl sm:text-2xl 2xl:text-3xl font-serif font-light leading-tight tracking-tight text-text-main" : "title-sculptural font-serif font-light text-text-main"}>
                        {categoryParam ? (
                            <KineticText as="h1" delay={0.05}>
                                {categoryParam}
                            </KineticText>
                        ) : (
                            <KineticText as="h1" delay={0.05}>
                                Base de Conhecimento SST
                            </KineticText>
                        )}
                    </div>
                </div>

                <div className="reveal flex flex-col items-center gap-3" style={{ animationDelay: '80ms' }}>
                    <div className={isIntroducaoCategory ? "w-full max-w-sm 2xl:max-w-md scale-90" : "w-full max-w-xl 2xl:max-w-2xl"}>
                        <SearchBar
                            onClick={() => openCommandPalette?.()} 
                        />
                    </div>

                    {/* Acesso Rápido: Últimas Buscas e Artigos Recentes */}
                    {!isIntroducaoCategory && (
                        <div className="w-full max-w-xl 2xl:max-w-2xl flex flex-wrap items-center justify-center gap-2 pt-1">
                            {/* Buscas Recentes */}
                            {recentSearches.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center gap-1.5">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted opacity-70">
                                        Buscas:
                                    </span>
                                    {recentSearches.slice(0, 4).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => openCommandPalette?.()}
                                            className="px-2.5 py-0.5 text-xs rounded-full border border-border bg-bg-island/80 text-text-muted hover:text-text-main hover:border-text-main/40 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Artigos Recentes */}
                            {recentArticles.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 sm:mt-0">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted opacity-70">
                                        Lidos:
                                    </span>
                                    {recentArticles.slice(0, 3).map((art) => (
                                        <button
                                            key={art.id}
                                            onClick={() => {
                                                // Abre via URL do artigo
                                                window.location.hash = '';
                                                window.history.pushState(null, '', `/artigo/${art.id}`);
                                                window.dispatchEvent(new PopStateEvent('popstate'));
                                            }}
                                            title={art.question}
                                            className="px-2.5 py-0.5 text-xs rounded-full border border-border bg-bg-island/80 text-text-main hover:border-text-main transition-colors max-w-[140px] truncate"
                                        >
                                            {art.question}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {isIntroducaoCategory ? (
                <div className="space-y-4">
                    {/* Renderização Artística Especial para a Seção de Introdução (sem scroll na página) */}
                    <IntroducaoHero />
                </div>
            ) : (
                <>
                    <div className="pt-4 w-full max-w-screen-2xl 3xl:max-w-[2100px] mx-auto">
                        <MasterDetailGrid items={displayedArticles} onModalStateChange={setIsArticleOpen} />
                    </div>

                    {displayedArticles.length === 0 && (
                        <div className="py-12 2xl:py-20 border-t border-border reveal">
                            <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl 2xl:text-2xl font-light">
                                Nenhum documento encontrado.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
