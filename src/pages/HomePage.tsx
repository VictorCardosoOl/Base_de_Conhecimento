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
        <div className={isIntroducaoCategory ? "space-y-4 lg:space-y-6" : "space-y-12"}>
            {/* Header com Arquivos 2026, Título da Categoria e Barra de Pesquisa */}
            <header className={isIntroducaoCategory ? "space-y-2 text-center max-w-lg mx-auto" : "space-y-6 text-center max-w-2xl mx-auto"}>
                <div className={isIntroducaoCategory ? "space-y-0.5" : "space-y-2"}>
                    <div className="flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted reveal">
                        <div className="w-6 h-[1px] bg-stone-300 dark:bg-stone-700" />
                        <span>Arquivos 2026</span>
                        <div className="w-6 h-[1px] bg-stone-300 dark:bg-stone-700" />
                    </div>

                    <h1 className={isIntroducaoCategory ? "text-xl sm:text-2xl font-serif font-light leading-tight tracking-tight text-text-main reveal" : "text-4xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-text-main reveal"}>
                        {categoryParam ? (
                            <span>{categoryParam}</span>
                        ) : (
                            <>Base de Conhecimento SST</>
                        )}
                    </h1>
                </div>

                <div className="reveal flex justify-center" style={{ animationDelay: '80ms' }}>
                    <div className={isIntroducaoCategory ? "w-full max-w-sm scale-90" : "w-full max-w-xl"}>
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
                    <div className="pt-4 max-w-6xl mx-auto">
                        <MasterDetailGrid items={displayedArticles} onModalStateChange={setIsArticleOpen} />
                    </div>

                    {displayedArticles.length === 0 && (
                        <div className="py-12 border-t border-border reveal">
                            <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl font-light">
                                Nenhum documento encontrado.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
