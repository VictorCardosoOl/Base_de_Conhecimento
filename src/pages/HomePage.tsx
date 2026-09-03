import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { ArticleCard } from '../components/ArticleCard';
import { FAQ_DATA } from '../constants';
import { Category, FAQItem } from '../types';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { useOutletContext } from 'react-router-dom';

export const HomePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const [searchQuery, setSearchQuery] = useState('');

    const { queue, toggleQueue } = useReadingQueue();
    const navigate = useNavigate();

    // Sync context if needed, but we rely on URL params mostly
    const { setCurrentCategory } = useOutletContext<{ setCurrentCategory: (c: Category | null) => void }>();

    useEffect(() => {
        if (categoryParam && Object.values(Category).includes(categoryParam as Category)) {
            setCurrentCategory(categoryParam as Category);
        } else {
            setCurrentCategory(null);
        }
    }, [categoryParam, setCurrentCategory]);

    const displayedArticles = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return FAQ_DATA.filter(item => {
            const matchesCat = !categoryParam || item.category === categoryParam;
            const matchesSearch = !query ||
                item.question.toLowerCase().includes(query) ||
                item.tags.some(t => t.toLowerCase().includes(query));
            return matchesCat && matchesSearch;
        });
    }, [categoryParam, searchQuery]);

    return (
        <div className="space-y-6">
            <header className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-700 dark:text-stone-300 reveal">
                        <div className="w-6 h-[0.5px] bg-stone-400" />
                        <span>Arquivos 2026</span>
                    </div>

                    <h1 className="text-3xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-[var(--text-main)] reveal">
                        {categoryParam ? (
                            <span>{categoryParam}</span>
                        ) : (
                            <>Base de Conhecimento SST</>
                        )}
                    </h1>
                </div>

                <div className="reveal" style={{ animationDelay: '100ms' }}>
                    <SearchBar
                        onClick={() => { }} // Command palette trigger moved to layout or keep here if we want direct focus? 
                        // Actually, the original onClick opened command palette. Let's keep it simple for now or implement local search.
                        // The SearchBar component UI suggests a simple input. Let's use it as local filter.
                        query={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-1 pt-4">
                {displayedArticles.map((item, i) => (
                    <ArticleCard
                        key={item.id}
                        item={item}
                        to={`/artigo/${item.id}`}
                        isInQueue={queue.includes(item.id)}
                        onToggleQueue={(e) => { e.stopPropagation(); toggleQueue(item.id); }}
                        featured={i === 0 && !categoryParam && !searchQuery}
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
