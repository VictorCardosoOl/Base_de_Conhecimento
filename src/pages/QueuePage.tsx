import React from 'react';
import { MasterDetailGrid } from '../components/MasterDetailGrid';
import { FAQ_DATA } from '../constants/index';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { FAQItem } from '../types/index';
import { useOutletContext } from 'react-router-dom';

export const QueuePage: React.FC = () => {
    const { queue } = useReadingQueue();
    const { setIsArticleOpen } = useOutletContext<{ setIsArticleOpen: (isOpen: boolean) => void }>();

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

                    <h1 className="text-3xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-text-main reveal">
                        <span className="italic">Minha Lista</span>
                    </h1>
                </div>
            </header>

            <div className="pt-4 max-w-6xl mx-auto">
                <MasterDetailGrid items={displayedArticles} onModalStateChange={setIsArticleOpen} />
            </div>

            {displayedArticles.length === 0 && (
                <div className="py-12 border-t border-border reveal">
                    <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl font-light">
                        Sua lista de leitura esta vazia.
                    </p>
                </div>
            )}
        </div>
    );
};
