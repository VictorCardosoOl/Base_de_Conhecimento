import React, { useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArticleView } from '../components/ArticleView';
import { FAQ_DATA } from '../constants';
import { Category, FAQItem } from '../types';

export const ArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentCategory } = useOutletContext<{ currentCategory: Category | null }>();

    const article = useMemo(() => FAQ_DATA.find(a => a.id === id), [id]);

    const nav = useMemo(() => {
        if (!article) return { prev: null, next: null };

        // Filter by category if one is selected, otherwise use all
        const articles = currentCategory
            ? FAQ_DATA.filter(a => a.category === currentCategory)
            : FAQ_DATA;

        const idx = articles.findIndex(a => a.id === article.id);
        return {
            prev: idx > 0 ? articles[idx - 1] : null,
            next: idx < articles.length - 1 ? articles[idx + 1] : null
        };
    }, [article, currentCategory]);

    if (!article) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-2xl font-serif text-[var(--text-main)]">Artigo não encontrado</h2>
                <button onClick={() => navigate('/')} className="mt-4 text-sm underline text-[var(--text-muted)]">
                    Voltar ao início
                </button>
            </div>
        );
    }

    return (
        <ArticleView
            article={article}
            onBack={() => navigate(-1)}
            onNavigate={(nextArticle) => {
                if (nextArticle) navigate(`/artigo/${nextArticle.id}`);
            }}
            nav={nav}
        />
    );
};
