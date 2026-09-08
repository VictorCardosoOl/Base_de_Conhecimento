import React, { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { ArticleCard } from '../components/ArticleCard';
import { FAQ_DATA } from '../constants/index';
import { Category } from '../types/index';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { useOutletContext } from 'react-router-dom';

export const HomePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');

    const { queue, toggleQueue } = useReadingQueue();

    // Context for CommandPalette trigger and Category sync
    const { setCurrentCategory, openCommandPalette } = useOutletContext<{ 
        setCurrentCategory: (c: Category | null) => void,
        openCommandPalette: () => void 
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

    return (
        <div className="space-y-12">
            <header className="space-y-6 text-center max-w-2xl mx-auto">
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] reveal">
                        <div className="w-8 h-[1px] bg-stone-300 dark:bg-stone-700" />
                        <span>Arquivos 2026</span>
                        <div className="w-8 h-[1px] bg-stone-300 dark:bg-stone-700" />
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-[var(--text-main)] reveal">
                        {categoryParam ? (
                            <span>{categoryParam}</span>
                        ) : (
                            <>Base de Conhecimento SST</>
                        )}
                    </h1>
                </div>

                <div className="reveal flex justify-center" style={{ animationDelay: '100ms' }}>
                    <div className="w-full max-w-xl">
                        <SearchBar
                            onClick={() => openCommandPalette?.()} 
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6 pt-4 max-w-6xl mx-auto">
                {displayedArticles.map((item, i) => (
                    <ArticleCard
                        key={item.id}
                        item={item}
                        to={`/artigo/${item.id}`}
                        isInQueue={queue.includes(item.id)}
                        onToggleQueue={(e) => { e.stopPropagation(); toggleQueue(item.id); }}
                        featured={i === 0 && !categoryParam}
                    />
                ))}
            </div>

            {displayedArticles.length === 0 && (
                <div className="py-12 border-t border-[var(--border)] reveal">
                    <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl font-light">
                        Nenhum documento encontrado.
                    </p>
                </div>
            )}
        </div>
    );
};
