import { useMemo } from 'react';
import { FAQItem } from '../types/index';
import { FAQ_DATA } from '../constants/index';

export const useRelatedArticles = (article: FAQItem) => {
    return useMemo(() => {
        if (!article.tags || article.tags.length === 0) return [];

        return FAQ_DATA
            .filter(item => item.id !== article.id)
            .map(item => ({
                item,
                score: item.tags.filter(tag => article.tags.includes(tag)).length
            }))
            .filter(match => match.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(match => match.item);
    }, [article]);
};

