'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Check, Clock, GraduationCap, RotateCcw, Target } from 'lucide-react';
import { ArticleGrid } from '@/features/articles/components/ArticleGrid';
import { FAQ_DATA } from '@/features/articles/catalog';
import { DEFAULT_LEARNING_TRACKS, type LearningTrack } from '@/features/reading/learning-tracks';
import { useReadingQueue } from '@/features/reading/use-reading-queue';
import { useBrowserSnapshot } from '@/hooks/use-browser-snapshot';
import type { FAQItem } from '@/features/articles/types';
import { AnalyticsService } from '@/features/analytics/analytics-service';
import { READING_EVENTS, ReadingExperienceService, type ReadingGoal } from '@/features/reading/reading-experience-service';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/StateMessage';
import { Tabs, tabPanelProps } from '@/components/ui/Tabs';

const NO_COMPLETED: string[] = [];
// Mesmo padrão do ReadingExperienceService quando não há meta salva.
const DEFAULT_READING_GOAL: ReadingGoal = { targetMinutes: 60, elapsedSeconds: 0, completedNotified: false };
const readCompletedArticles = () => AnalyticsService.getCompletedArticles();
const readReadingGoal = () => ReadingExperienceService.getReadingGoal();
const byId = (ids: string[]) => ids.map((id) => FAQ_DATA.find((a) => a.id === id)).filter(Boolean) as FAQItem[];

type View = 'queue' | 'tracks';

/**
 * Minha Lista: artigos salvos (o uso mais comum, aberto por padrão), trilhas sugeridas com
 * progresso e a meta de tempo de leitura. Tudo fica neste navegador (localStorage).
 */
export default function QueuePage() {
  const { queue } = useReadingQueue();
  const [view, setView] = useState<View>('queue');
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack>(DEFAULT_LEARNING_TRACKS[0]);
  // Valores do navegador lidos de forma segura para a hidratação (o servidor não tem
  // localStorage). Alterações feitas nesta página ficam no estado local.
  const storedCompleted = useBrowserSnapshot(readCompletedArticles, NO_COMPLETED);
  const [completedOverride, setCompletedArticles] = useState<string[] | null>(null);
  const completed = completedOverride ?? storedCompleted;
  const storedGoal = useBrowserSnapshot(readReadingGoal, DEFAULT_READING_GOAL);
  const [goalOverride, setReadingGoal] = useState<ReadingGoal | null>(null);
  const goal = goalOverride ?? storedGoal;

  useEffect(() => {
    const onGoal = (e: Event) => {
      const detail = (e as CustomEvent<ReadingGoal | undefined>).detail;
      setReadingGoal(detail ?? ReadingExperienceService.getReadingGoal());
    };
    window.addEventListener(READING_EVENTS.readingGoalUpdated, onGoal);
    return () => window.removeEventListener(READING_EVENTS.readingGoalUpdated, onGoal);
  }, []);

  const saved = byId(queue);
  const trackArticles = byId(selectedTrack.articleIds);
  const doneIn = (track: LearningTrack) => track.articleIds.filter((id) => completed.includes(id)).length;
  const goalPct = Math.min(100, Math.round((goal.elapsedSeconds / (goal.targetMinutes * 60)) * 100));

  const toggleDone = (articleId: string) => {
    AnalyticsService.toggleArticleCompletion(articleId);
    setCompletedArticles(AnalyticsService.getCompletedArticles());
  };
  const chooseGoal = (minutes: number) => {
    ReadingExperienceService.setReadingGoalTarget(minutes);
    setReadingGoal(ReadingExperienceService.getReadingGoal());
  };
  const resetGoal = () => {
    ReadingExperienceService.resetReadingGoal();
    setReadingGoal(ReadingExperienceService.getReadingGoal());
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="ui-eyebrow">Sua leitura</p>
          <h1 className="ui-page-title mt-2">Minha Lista</h1>
          <p className="mt-2 text-text-muted max-w-xl">
            Artigos salvos para ler depois e trilhas recomendadas. Fica guardado neste navegador.
          </p>
        </div>

        <section aria-labelledby="goal-title" className="glass-card p-5 w-full lg:max-w-md">
          <div className="flex items-center justify-between gap-3">
            <h2 id="goal-title" className="flex items-center gap-2 text-sm font-semibold text-text-main">
              <Target size={16} aria-hidden="true" className="text-[color:var(--mesh-1)]" /> Meta de leitura
            </h2>
            <div className="flex items-center gap-1" role="group" aria-label="Duração da meta">
              {[60, 120, 180].map((minutes) => (
                <Button key={minutes} size="sm" variant={goal.targetMinutes === minutes ? 'primary' : 'ghost'} aria-pressed={goal.targetMinutes === minutes} onClick={() => chooseGoal(minutes)}>
                  {minutes} min
                </Button>
              ))}
              <Button size="sm" variant="ghost" icon aria-label="Reiniciar meta de leitura" onClick={resetGoal}>
                <RotateCcw size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)] overflow-hidden" role="progressbar" aria-label="Progresso da meta" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[color:var(--mesh-1)] origin-left transition-transform duration-500" style={{ transform: `scaleX(${goalPct / 100})` }} />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {goalPct}% de {goal.targetMinutes} min{goal.completedNotified ? ' · meta atingida' : ''} · conta só o tempo lendo artigos.
          </p>
        </section>
      </header>

      <Tabs<View>
        label="Minha Lista"
        idPrefix="lista"
        value={view}
        onChange={setView}
        items={[
          { id: 'queue', label: <><Bookmark size={14} aria-hidden="true" /> Salvos</>, count: saved.length },
          { id: 'tracks', label: <><GraduationCap size={14} aria-hidden="true" /> Trilhas</>, count: DEFAULT_LEARNING_TRACKS.length },
        ]}
      />

      {view === 'queue' && (
        <div {...tabPanelProps('lista', 'queue')}>
          {saved.length > 0 ? (
            <ArticleGrid items={saved} />
          ) : (
            <EmptyState
              className="glass-card"
              title="Nenhum artigo salvo ainda"
              icon={<Bookmark size={20} aria-hidden="true" />}
              action={<ButtonLink href="/" variant="primary" size="sm">Explorar artigos</ButtonLink>}
            >
              Use o botão de salvar nos cards ou “Salvar” dentro do artigo para montar sua lista.
            </EmptyState>
          )}
        </div>
      )}

      {view === 'tracks' && (
        <div {...tabPanelProps('lista', 'tracks')} className="space-y-8">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_LEARNING_TRACKS.map((track) => {
              const current = selectedTrack.id === track.id;
              const done = doneIn(track);
              const pct = Math.round((done / track.articleIds.length) * 100);
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTrack(track)}
                    aria-pressed={current}
                    className={`glass-card glass-interactive w-full h-full p-6 text-left flex flex-col justify-between gap-5 ${current ? 'ring-2 ring-[color:var(--mesh-1)]' : ''}`}
                  >
                    <span className="space-y-2">
                      <span className="flex items-center justify-between gap-2">
                        <span className="ui-badge" data-tone="info">{track.badge}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={12} aria-hidden="true" /> {track.estimatedMinutes} min
                        </span>
                      </span>
                      <span className="block font-serif text-lg leading-snug text-text-main">{track.title}</span>
                      <span className="block text-sm text-text-muted leading-relaxed">{track.description}</span>
                    </span>
                    <span className="block">
                      <span className="flex justify-between text-xs text-text-muted">
                        <span>Concluído</span>
                        <span className="tabular-nums">{done}/{track.articleIds.length}</span>
                      </span>
                      <span className="mt-1.5 block h-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)] overflow-hidden" aria-hidden="true">
                        <span className="block h-full rounded-full bg-[color:var(--mesh-1)] origin-left" style={{ transform: `scaleX(${pct / 100})` }} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="track-title" className="glass-card p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="track-title" className="text-2xl font-serif text-text-main">{selectedTrack.title}</h2>
              <span className="text-sm text-text-muted">
                {doneIn(selectedTrack)} de {selectedTrack.articleIds.length} lidos
              </span>
            </div>
            <ol className="mt-4 divide-y divide-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)]">
              {trackArticles.map((article, index) => {
                const isDone = completed.includes(article.id);
                return (
                  <li key={article.id} className="py-3 flex items-center justify-between gap-4">
                    <span className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-xs text-text-muted w-6 shrink-0">{String(index + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <Link href={`/artigo/${article.id}`} className={`ui-link text-sm font-medium ${isDone ? 'text-text-muted line-through' : ''}`}>
                          {article.question}
                        </Link>
                        <span className="block text-xs text-text-muted">{article.category}</span>
                      </span>
                    </span>
                    <Button size="sm" variant={isDone ? 'primary' : 'secondary'} aria-pressed={isDone} onClick={() => toggleDone(article.id)} aria-label={`${isDone ? 'Desmarcar' : 'Marcar'} “${article.question}” como lido`}>
                      <Check size={14} aria-hidden="true" /> {isDone ? 'Lido' : 'Marcar como lido'}
                    </Button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
