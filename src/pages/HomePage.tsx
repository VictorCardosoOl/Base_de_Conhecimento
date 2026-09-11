import React, { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/ui/SearchBar';
import { MasterDetailGrid } from '../components/layout/MasterDetailGrid';
import { IntroducaoHero } from '../components/article/IntroducaoHero';
import { FAQ_DATA } from '../constants/index';
import { Category } from '../types/index';
import { useOutletContext } from 'react-router-dom';

export const HomePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');

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

                    <h1 className={isIntroducaoCategory ? "text-xl sm:text-2xl 2xl:text-3xl font-serif font-light leading-tight tracking-tight text-text-main reveal" : "text-4xl lg:text-5xl 2xl:text-6xl 3xl:text-7xl font-serif font-light leading-tight tracking-tight text-text-main reveal"}>
                        {categoryParam ? (
                            <span>{categoryParam}</span>
                        ) : (
                            <>Base de Conhecimento SST</>
                        )}
                    </h1>
                </div>

                <div className="reveal flex justify-center" style={{ animationDelay: '80ms' }}>
                    <div className={isIntroducaoCategory ? "w-full max-w-sm 2xl:max-w-md scale-90" : "w-full max-w-xl 2xl:max-w-2xl"}>
                        <SearchBar
                            onClick={() => openCommandPalette?.()} 
                        />
                    </div>
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
