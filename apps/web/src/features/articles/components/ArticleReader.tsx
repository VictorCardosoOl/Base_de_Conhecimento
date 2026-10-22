'use client';
import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUp, Check, Printer, Share2 } from 'lucide-react';
import { useShare } from '@/hooks/use-share';
import { TableOfContents } from './TableOfContents';
import { ArticleNeighbors } from './ArticleNeighbors';
import { RelatedArticles } from './RelatedArticles';
import { LazyMount } from '@/components/ui/LazyMount';
// Avaliação, correção e comentários: código e requisições só perto do fim da leitura.
const ArticleInteractions = dynamic(() =>
  import('@/features/content/components/ArticleInteractions').then((mod) => mod.ArticleInteractions)
);
import { useReadingProgress } from '@/features/reading/use-reading-progress';

const ArticleContent = dynamic(
  () => import('./ArticleContent').then((mod) => mod.ArticleContent),
  { loading: () => <div className="ui-skeleton h-32 !rounded-2xl" /> }
);

/**
 * Leitura na página do artigo: corpo em superfície quase opaca (contraste AA), índice de
 * vidro flutuante, barra de progresso no topo e ações (compartilhar, PDF, topo) num dock
 * de vidro. O conteúdo já chega sanitizado pelo servidor.
 */
export function ArticleReader({
  htmlContent,
  articleId,
  title,
  summary,
}: {
  htmlContent: string;
  articleId: string;
  title: string;
  summary: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [showDock, setShowDock] = useState(false);
  const { shareContent, shareFeedback } = useShare();

  // Progresso escrito direto no DOM; o dock só re-renderiza quando aparece/some.
  useReadingProgress(barRef, { target: bodyRef });
  useEffect(() => {
    let frame = 0;
    let shown = false;
    const update = () => {
      frame = 0;
      const next = window.scrollY > 240;
      if (next !== shown) {
        shown = next;
        setShowDock(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const dockButton =
    'w-11 h-11 rounded-full flex items-center justify-center text-text-main hover:bg-[var(--glass-bg-hover)] transition-[transform,background-color] duration-300 ease-[var(--ease-elastic)] active:scale-90 glass-focus';

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[70] h-[2px] no-print pointer-events-none"
      >
        <div
          ref={barRef}
          data-testid="reading-progress"
          className="h-full origin-left bg-text-main"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6 xl:gap-8 items-start">
        <div
          ref={bodyRef}
          data-reveal
          className="min-w-0 reading-surface rounded-[20px] border border-border px-6 py-8 sm:px-12 sm:py-12 lg:px-16 shadow-[var(--glass-shadow-1)]"
        >
          <div className="prose dark:prose-invert max-w-none">
            <ArticleContent htmlContent={htmlContent} articleId={articleId} />
          </div>
        </div>
        <div className="hidden xl:block">
          <TableOfContents containerRef={bodyRef} scrollRoot="viewport" />
        </div>
      </div>

      <ArticleNeighbors articleId={articleId} />
      <RelatedArticles articleId={articleId} />
      <LazyMount>
        <ArticleInteractions articleId={articleId} articleTitle={title} contentRef={bodyRef} />
      </LazyMount>

      {/* Dock de ações flutuante */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[45] no-print transition-opacity duration-300 ${
          showDock ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div role="toolbar" aria-label="Ações do artigo" className="glass-strong !bg-bg-island !rounded-[20px] border border-border flex items-center gap-1 p-1.5 shadow-[var(--glass-shadow-2)]">
          <button
            type="button"
            onClick={() => shareContent(title, summary, window.location.href)}
            aria-label={shareFeedback ? 'Link copiado' : 'Compartilhar'}
            className={dockButton}
            tabIndex={showDock ? 0 : -1}
          >
            {shareFeedback ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Gerar PDF do Artigo"
            className={dockButton}
            tabIndex={showDock ? 0 : -1}
          >
            <Printer size={18} aria-hidden="true" />
          </button>
          <span aria-hidden="true" className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Voltar ao início do artigo"
            className={dockButton}
            tabIndex={showDock ? 0 : -1}
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
