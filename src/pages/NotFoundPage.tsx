import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center reveal">
            <h1 className="text-6xl md:text-8xl font-serif mb-4 text-[var(--text-main)]">404</h1>
            <h2 className="text-2xl md:text-3xl font-light mb-6 text-[var(--text-body)]">
                Página não encontrada
            </h2>
            <p className="text-[var(--text-muted)] max-w-md mb-10 mx-auto leading-relaxed">
                Desculpe, não conseguimos encontrar a página que você está procurando. 
                Ela pode ter sido movida ou não existe mais.
            </p>
            
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--bg-main)] rounded-full hover:opacity-90 transition-opacity font-medium tracking-wide"
            >
                <Home size={18} strokeWidth={1.5} />
                <span>Voltar ao Início</span>
            </button>
        </div>
    );
};
