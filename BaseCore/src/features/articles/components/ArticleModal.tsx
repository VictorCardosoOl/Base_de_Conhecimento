'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { FAQItem } from '@/features/articles/types';
import { useArticleContent } from '@/features/articles/use-article-content';
import { useReadingGoalTracker } from '@/features/reading/use-reading-goal-tracker';
import { useReadingProgress } from '@/features/reading/use-reading-progress';
import dynamic from 'next/dynamic';

const ArticleContent = dynamic(
  () => import('./ArticleContent').then((mod) => mod.ArticleContent),
  { ssr: false }
);
import { ArticleSkeleton } from './ArticleSkeleton';
import { ArticleActions } from './ArticleActions';
import { RelatedArticles } from './RelatedArticles';
import { LazyMount } from '@/components/ui/LazyMount';
// Avaliação, correção e comentários: código e requisições só perto do fim da leitura.
const ArticleInteractions = dynamic(() =>
  import('@/features/content/components/ArticleInteractions').then((mod) => mod.ArticleInteractions)
);
import { catalogTextOf, readingMinutes } from '@/features/articles/article-meta';
import { ArticleReadingControls } from './ArticleReadingControls';
import { TableOfContents } from './TableOfContents';
import { ArticleHero } from './ArticleHero';
import { ArticleNeighbors } from './ArticleNeighbors';
import {
  ReadingExperienceService,
  TypographyPreferences,
} from '@/features/reading/reading-experience-service';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { useFocusTrap } from '@/hooks/use-focus-trap';

const ModalArticleContent = ({
  article,
  typography,
}: {
  article: FAQItem;
  typography?: TypographyPreferences;
}) => {
  const { htmlContent, isLoading } = useArticleContent(article);

  if (isLoading) {
    return <ArticleSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex-1 min-w-0">
        <ArticleContent
          htmlContent={htmlContent}
          articleId={article.id}
          typography={typography}
        />
      </div>
    </div>
  );
};

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FAQItem;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);

  // Rolagem nativa (no compositor) e progresso escrito direto no DOM: ler o artigo não
  // re-renderiza o modal.
  useReadingProgress(progressRef, { container: modalContainerRef, active: mounted });

  // Próximo/anterior troca o artigo no mesmo modal: volta ao topo.
  useEffect(() => {
    modalContainerRef.current?.scrollTo({ top: 0 });
  }, [item?.id]);

  // Estados da nova experiência de leitura
  const [isZenMode, setIsZenMode] = useState(false);
  const [typography, setTypography] = useState<TypographyPreferences>(() =>
    ReadingExperienceService.getTypography()
  );

  // Hook modular para meta de leitura
  const { goalReachedBanner, dismissBanner } = useReadingGoalTracker({
    articleId: item?.id || '',
    isActive: isOpen,
  });

  // Handle open/close animations
  useGSAP(() => {
    if (isOpen) {
      setMounted(true);
    } else if (mounted) {
      // Animate out
      // Enquanto a folha se move, o vidro dela fica sem desfoque (glass.css, [data-animating]).
      dialogRef.current?.setAttribute('data-animating', '');
      const tl = gsap.timeline({
        onComplete: () => setMounted(false)
      });
      if (backdropRef.current) tl.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
      if (dialogRef.current) tl.to(dialogRef.current, { yPercent: 104, duration: 0.3, ease: 'power3.in' }, 0);
    }
  }, { dependencies: [isOpen, mounted] });

  useGSAP(() => {
    if (mounted && isOpen) {
      // Animate in
      // Entrada curta: a folha sobe e assenta (só transform/opacity).
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (backdropRef.current) gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.24, ease: 'power2.out' });
      const sheet = dialogRef.current;
      if (sheet) {
        // Vidro desfocado não se move: sem desfoque durante a entrada, volta ao assentar.
        sheet.setAttribute('data-animating', '');
        gsap.fromTo(
          sheet,
          { yPercent: reduced ? 0 : 8, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: reduced ? 0 : 0.42,
            ease: 'expo.out',
            clearProps: 'transform',
            onComplete: () => sheet.removeAttribute('data-animating'),
          }
        );
      }
    }
  }, [mounted]);

  // Escuta tecla ESC para sair do Zen Mode ou fechar modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZenMode) {
          setIsZenMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isZenMode, onClose]);

  // Trava o scroll do body enquanto aberto e sempre restaura no fechamento/desmontagem
  useEffect(() => {
    if (!isOpen) return;
    // Prevenção do Layout Shift (FOUC Scrollbar)
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Pull to close / Overscroll to close
  useEffect(() => {
    const container = modalContainerRef.current;
    if (!container || !isOpen) return;

    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= 0) {
        startY = e.touches[0].clientY;
      } else {
        startY = 0;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (startY > 0 && e.touches[0].clientY > startY + 80) {
        onClose();
        startY = 0; // Previne múltiplos triggers
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (container.scrollTop <= 0 && e.deltaY < -80) {
        onClose();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(10,8,24,0.55)] z-[50] will-change-[opacity]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${item?.id || ''}`}
        className={`article-sheet fixed inset-x-0 bottom-0 z-[60] rounded-t-[2rem] sm:rounded-t-[2.75rem] h-[96vh] top-[4vh] ${
          isZenMode ? 'max-w-4xl' : 'max-w-[2000px] 4xl:max-w-[2400px]'
        } mx-auto overflow-hidden transform-gpu will-change-[transform,opacity] transition-[max-width] duration-300`}
      >
        <div
          ref={modalContainerRef}
          className="h-full w-full overflow-y-auto no-scrollbar pb-24"
        >
          <div ref={modalContentRef}>
            {/* Header Section inside the Modal (Zen Mode minimiza distrações) */}
            {/* Barra de ações flutuante de vidro, com o progresso de leitura na borda */}
            <nav
              aria-label="Ações do artigo"
              className="sticky top-3 z-50 px-3 sm:px-5 no-print"
            >
              <div className="glass-strong glass-chroma !rounded-full overflow-hidden max-w-6xl mx-auto">
              <div
                ref={progressRef}
                aria-hidden="true"
                data-testid="reading-progress"
                className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full bg-[linear-gradient(90deg,var(--mesh-1),var(--mesh-2))] origin-left z-50"
                style={{ transform: 'scaleX(0)' }}
              />
                  <div className={`w-full flex items-center justify-between px-4 sm:px-6 ${isZenMode ? 'h-12' : 'h-14 2xl:h-16'}`}>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <button
                        onClick={onClose}
                        aria-label="Voltar para a página anterior"
                        className="hover:text-text-main transition-colors flex items-center gap-2 py-2"
                      >
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span className="hidden sm:inline font-medium uppercase text-[10px] tracking-[0.2em]">Voltar</span>
                      </button>
                      
                      {!isZenMode && (
                        <>
                          <div className="w-[1px] h-4 bg-border hidden sm:block mx-3" />
                          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium opacity-80">
                            <button onClick={onClose} className="hover:text-text-main transition-colors">INÍCIO</button>
                            <span className="text-border">/</span>
                            <span className="text-text-main">{item?.category}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Ações do Artigo: Zen Mode, Tipografia, Compartilhar, PDF & Fechar */}
                    <div className="flex items-center gap-1">
                      {/* Controles de Leitura e Modo Foco */}
                      <ArticleReadingControls
                        isZenMode={isZenMode}
                        onToggleZenMode={() => setIsZenMode(!isZenMode)}
                        typography={typography}
                        onTypographyChange={setTypography}
                      />

                      <div className="w-[1px] h-4 bg-border mx-2" />

                      <button
                        onClick={onClose}
                        aria-label="Fechar Modal de Artigo"
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 text-text-muted transition-colors transform-gpu active:scale-95"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
              </div>
                </nav>

                {/* Banner de Meta de Leitura */}
                {goalReachedBanner && (
                  <div className="bg-text-main text-bg-main px-4 py-3 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <Award size={16} className="text-amber-400 shrink-0" />
                      <span>
                        Parabéns! Você alcançou sua{' '}
                        <strong>Meta de Leitura</strong> programada na lista.
                      </span>
                    </div>
                    <button
                      onClick={dismissBanner}
                      className="text-bg-main/80 hover:text-bg-main p-1"
                      aria-label="Fechar notificação de meta"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Cabeçalho oficial visível apenas na impressão/PDF */}
                <div className="hidden print:block p-8 border-b-2 border-stone-800 text-stone-900 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-wider">
                        Base Corporativa de Conhecimento SST
                      </h2>
                      <p className="text-xs text-stone-600">
                        Diretoria de Governança, Saúde e Segurança do
                        Trabalho
                      </p>
                    </div>
                    <div className="text-right text-xs text-stone-500">
                      <p>Documento Rastreável</p>
                      <p>
                        Impresso em: {new Date().toLocaleDateString('pt-BR')}{' '}
                        às {new Date().toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-6 pb-2 px-3 sm:px-6 md:px-10 2xl:px-16 max-w-6xl mx-auto">
                  {item && (
                    <ArticleHero
                      article={item}
                      titleId={`modal-title-${item.id}`}
                      minutes={readingMinutes(catalogTextOf(item.id))}
                      actions={<ArticleActions articleId={item.id} title={item.question} summary={item.answer} />}
                    />
                  )}
                </div>

                {/* Grid de Conteúdo Principal + Índice Dinâmico (ToC) */}
                <div className="px-3 sm:px-6 md:px-10 2xl:px-16 py-6 md:py-8 max-w-6xl mx-auto">
                  <div
                    className={`grid grid-cols-1 ${!isZenMode ? 'xl:grid-cols-[1fr_260px]' : ''} gap-6 xl:gap-8 items-start`}
                  >
                    {/* Corpo do texto: superfície quase opaca, contraste garantido */}
                    <div ref={bodyRef} className="min-w-0 reading-surface px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
                      {item && (
                        <ModalArticleContent
                          article={item}
                          typography={typography}
                        />
                      )}
                    </div>

                    {/* Índice Dinâmico à Direita (oculto no Modo Zen) */}
                    {!isZenMode && (
                      <div className="hidden xl:block">
                        <TableOfContents containerRef={modalContainerRef} contentRef={bodyRef} />
                      </div>
                    )}
                  </div>
                  
                  {item && !isZenMode && (
                    <div className="mt-8 flex flex-col gap-8">
                      <ArticleNeighbors articleId={item.id} replace />
                      <RelatedArticles articleId={item.id} replace />
                    </div>
                  )}
                  {/* Avaliar, sugerir correção e comentar: no fim da leitura */}
                  {item && (
                    <div className="mt-8">
                      <LazyMount>
                        <ArticleInteractions articleId={item.id} articleTitle={item.question} contentRef={bodyRef} />
                      </LazyMount>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
    ,
    document.body
  );
};
