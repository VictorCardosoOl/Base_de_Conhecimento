import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContentModal } from '../components/layout/MasterDetailGrid';
import { FAQ_DATA } from '../constants/index';

export const ArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const article = useMemo(() => FAQ_DATA.find(a => a.id === id), [id]);

    if (!article) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-2xl font-serif text-text-main">Artigo não encontrado</h2>
                <button onClick={() => navigate('/')} className="mt-4 text-sm underline text-text-muted">
                    Voltar ao início
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
           <ContentModal isOpen={true} onClose={() => navigate(-1)} layoutId={article.id} item={article} />
        </div>
    );
};
