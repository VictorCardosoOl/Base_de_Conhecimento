import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { FAQ_DATA } from '../constants';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { FAQItem } from '../types';

export const QueuePage: React.FC = () => {
    const { queue, toggleQueue } = useReadingQueue();
    const navigate = useNavigate();

    const displayedArticles = queue
        .map(id => FAQ_DATA.find(a => a.id === id))
        .filter(Boolean) as FAQItem[];

    return (
        <div className="space-y-6">
            <header className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-700 dark:text-stone-300 reveal">
                        <div className="w-6 h-[0.5px] bg-stone-400" />
                        <span>SST FAQ</span>
                    </div>

                    <h1 className="text-3xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-[var(--text-main)] reveal">
                        <span className="italic">Minha Lista</span>
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-1 pt-4">
                {displayedArticles.map((item) => (
                    <ArticleCard
                        key={item.id}
                        item={item}
                        to={`/artigo/${item.id}`}
                        isInQueue={queue.includes(item.id)}
                        onToggleQueue={(e) => { e.stopPropagation(); toggleQueue(item.id); }}
                        featured={false}
                    />
                ))}
            </div>

            {displayedArticles.length === 0 && (
                <div className="py-12 border-t border-[var(--border)] reveal">
                    <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl font-light">
                        Sua lista de leitura está vazia.
                    </p>
                </div>
            )}
        </div>
    );
};
