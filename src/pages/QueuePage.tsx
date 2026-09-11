import React, { useState, useEffect } from 'react';
import { MasterDetailGrid } from '../components/layout/MasterDetailGrid';
import { FAQ_DATA, DEFAULT_LEARNING_TRACKS } from '../constants/index';
import { useReadingQueue } from '../hooks/useReadingQueue';
import { FAQItem, LearningTrack } from '../types/index';
import { useOutletContext } from 'react-router-dom';
import { AnalyticsService } from '../services/analyticsService';
import { ReadingExperienceService, ReadingGoal } from '../services/readingExperienceService';
import { BookOpen, CheckCircle, GraduationCap, Clock, Check, Target, RotateCcw } from 'lucide-react';

export const QueuePage: React.FC = () => {
    const { queue } = useReadingQueue();
    const { setIsArticleOpen } = useOutletContext<{ setIsArticleOpen: (isOpen: boolean) => void }>();
    const [viewMode, setViewMode] = useState<'queue' | 'tracks'>('tracks');
    const [selectedTrack, setSelectedTrack] = useState<LearningTrack>(DEFAULT_LEARNING_TRACKS[0]);
    const [completedArticles, setCompletedArticles] = useState<string[]>(() => AnalyticsService.getCompletedArticles());
    const [readingGoal, setReadingGoal] = useState<ReadingGoal>(() => ReadingExperienceService.getReadingGoal());

    useEffect(() => {
        const handleGoalUpdate = (e: any) => {
            if (e.detail) setReadingGoal(e.detail);
            else setReadingGoal(ReadingExperienceService.getReadingGoal());
        };
        window.addEventListener('sst_reading_goal_updated', handleGoalUpdate);
        return () => window.removeEventListener('sst_reading_goal_updated', handleGoalUpdate);
    }, []);

    const handleSelectGoal = (minutes: number) => {
        ReadingExperienceService.setReadingGoalTarget(minutes);
        setReadingGoal(ReadingExperienceService.getReadingGoal());
    };

    const handleResetGoal = () => {
        ReadingExperienceService.resetReadingGoal();
        setReadingGoal(ReadingExperienceService.getReadingGoal());
    };

    const displayedQueueArticles = queue
        .map(id => FAQ_DATA.find(a => a.id === id))
        .filter(Boolean) as FAQItem[];

    const trackArticles = selectedTrack.articleIds
        .map(id => FAQ_DATA.find(a => a.id === id))
        .filter(Boolean) as FAQItem[];

    const handleToggleComplete = (articleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        AnalyticsService.toggleArticleCompletion(articleId);
        setCompletedArticles(AnalyticsService.getCompletedArticles());
    };

    const trackProgress = Math.round(
        (selectedTrack.articleIds.filter(id => completedArticles.includes(id)).length / selectedTrack.articleIds.length) * 100
    );

    const goalProgressPct = Math.min(100, Math.round((readingGoal.elapsedSeconds / (readingGoal.targetMinutes * 60)) * 100));

    return (
        <div className="space-y-8">
            <header className="space-y-4 2xl:space-y-6 max-w-5xl">
                <div className="space-y-1 2xl:space-y-2">
                    <div className="flex items-center gap-3 text-[10px] 2xl:text-xs font-bold uppercase tracking-[0.2em] text-stone-700 dark:text-stone-300 reveal">
                        <div className="w-6 2xl:w-10 h-[0.5px] bg-stone-400" />
                        <span>Educação Corporativa & Gestão do Conhecimento</span>
                    </div>

                    <h1 className="text-3xl lg:text-5xl 2xl:text-6xl font-serif font-light leading-tight tracking-tight text-text-main reveal">
                        <span>Trilhas & Lista de Leitura</span>
                    </h1>
                </div>

                {/* Card Editorial de Meta de Leitura Direta na Lista */}
                <div className="p-4 sm:p-5 border border-border bg-bg-island/50 backdrop-blur-sm rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg border border-border bg-bg-main flex items-center justify-center text-text-main">
                                <Target size={15} />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-text-main uppercase tracking-wider block">
                                    Meta de Leitura Ativa
                                </span>
                                <span className="text-[11px] text-text-muted">
                                    Tempo contabilizado silenciosamente apenas durante a leitura interna dos artigos
                                </span>
                            </div>
                        </div>

                        {/* Seletor direto: 60m, 120m, 180m */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            {[60, 120, 180].map((mins) => (
                                <button
                                    key={mins}
                                    onClick={() => handleSelectGoal(mins)}
                                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                                        readingGoal.targetMinutes === mins
                                            ? 'bg-text-main text-bg-main border-text-main shadow-sm'
                                            : 'border-border text-text-muted hover:text-text-main hover:bg-stone-100 dark:hover:bg-stone-800'
                                    }`}
                                >
                                    {mins} min
                                </button>
                            ))}
                            <button
                                onClick={handleResetGoal}
                                title="Reiniciar ciclo da meta"
                                aria-label="Reiniciar meta de leitura"
                                className="p-1.5 text-text-muted hover:text-text-main transition-colors ml-1"
                            >
                                <RotateCcw size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Progresso Silencioso da Meta */}
                    <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-text-muted">
                            <span>Progresso do Ciclo</span>
                            <span>{goalProgressPct}% {readingGoal.completedNotified ? '(Meta Atingida)' : ''}</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-text-main transition-all duration-500 rounded-full"
                                style={{ width: `${goalProgressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Seleção entre Trilhas de Onboarding e Fila Individual */}
                <div className="flex items-center gap-6 pt-2 border-b border-border">
                    <button
                        onClick={() => setViewMode('tracks')}
                        className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${viewMode === 'tracks' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <GraduationCap size={15} />
                        <span>Trilhas de Onboarding</span>
                        {viewMode === 'tracks' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main" />}
                    </button>
                    <button
                        onClick={() => setViewMode('queue')}
                        className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${viewMode === 'queue' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <BookOpen size={15} />
                        <span>Minha Lista ({displayedQueueArticles.length})</span>
                        {viewMode === 'queue' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main" />}
                    </button>
                </div>
            </header>

            {/* MODO 1: TRILHAS DE APRENDIZAGEM CURADAS */}
            {viewMode === 'tracks' && (
                <div className="space-y-10">
                    {/* Seletor de Trilhas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {DEFAULT_LEARNING_TRACKS.map(track => {
                            const isCurrent = selectedTrack.id === track.id;
                            const completedCount = track.articleIds.filter(id => completedArticles.includes(id)).length;
                            const pct = Math.round((completedCount / track.articleIds.length) * 100);

                            return (
                                <div
                                    key={track.id}
                                    onClick={() => setSelectedTrack(track)}
                                    className={`p-6 border cursor-pointer transition-all duration-150 flex flex-col justify-between relative ${isCurrent ? 'border-text-main bg-bg-island/80 shadow-sm' : 'border-border bg-bg-main hover:border-text-muted'}`}
                                >
                                    {isCurrent && <div className="absolute top-0 left-0 right-0 h-[2px] bg-text-main" />}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-text-muted">
                                                {track.badge}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] text-text-muted">
                                                <Clock size={12} /> {track.estimatedMinutes} min
                                            </span>
                                        </div>
                                        <h3 className="font-serif font-light text-text-main text-lg leading-snug">{track.title}</h3>
                                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{track.description}</p>
                                    </div>

                                    {/* Barra de Progresso Minimalista */}
                                    <div className="space-y-2 pt-4 border-t border-border/60">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                            <span>Conclusão</span>
                                            <span>{completedCount}/{track.articleIds.length} ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-[3px] bg-border overflow-hidden">
                                            <div
                                                className="h-full bg-text-main transition-all duration-300"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detalhes da Trilha Ativa */}
                    <div className="border border-border p-8 bg-bg-island/40 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border pb-4">
                            <div>
                                <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-muted mb-1">Trilha Selecionada</div>
                                <h2 className="text-2xl font-serif font-light text-text-main">{selectedTrack.title}</h2>
                            </div>
                            <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                                Status: <strong className="text-text-main">{trackProgress === 100 ? '100% Concluído' : `${trackProgress}% Lido`}</strong>
                            </span>
                        </div>

                        {/* Lista de Procedimentos da Trilha */}
                        <div className="divide-y divide-border">
                            {trackArticles.map((article, idx) => {
                                const isDone = completedArticles.includes(article.id);

                                return (
                                    <div
                                        key={article.id}
                                        className="py-4 flex items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span className="font-mono text-xs text-text-muted w-6">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className={`text-sm font-medium transition-colors ${isDone ? 'line-through text-text-muted' : 'text-text-main group-hover:text-accent'}`}>
                                                    {article.question}
                                                </h4>
                                                <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted">{article.category}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => handleToggleComplete(article.id, e)}
                                            className={`flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold transition-colors shrink-0 ${isDone ? 'border border-text-main text-text-main bg-selection' : 'border border-border text-text-muted hover:text-text-main'}`}
                                        >
                                            <Check size={12} className={isDone ? 'opacity-100' : 'opacity-30'} />
                                            <span>{isDone ? 'Concluído' : 'Confirmar'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2">
                        <MasterDetailGrid items={trackArticles} onModalStateChange={setIsArticleOpen} />
                    </div>
                </div>
            )}

            {/* MODO 2: LISTA DE LEITURA INDIVIDUAL */}
            {viewMode === 'queue' && (
                <div className="space-y-4">
                    <div className="pt-2 w-full max-w-screen-2xl 3xl:max-w-[2100px] mx-auto">
                        <MasterDetailGrid items={displayedQueueArticles} onModalStateChange={setIsArticleOpen} />
                    </div>

                    {displayedQueueArticles.length === 0 && (
                        <div className="py-12 2xl:py-20 border-t border-border reveal">
                            <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl 2xl:text-2xl font-light">
                                Sua lista de leitura pessoal está vazia. Salve artigos clicando no ícone de favoritos nos cards.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

