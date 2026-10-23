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
import { useZenMode } from '../hooks/use-zen-mode';
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
    <div className="w-full flex flex-col gap-8">
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
  const { isZenMode, toggleZenMode } = useZenMode(isOpen, onClose);
  const [typography, setTypography] = useState<TypographyPreferences>(() =>
    ReadingExperienceService.getTypography()
  );

  // Hook modular para meta de leitura
  const { goalReachedBanner, dismissBanner } = useReadingGoalTracker({
    articleId: item?.id || '',
    isActive: isOpen,
  });

  // Handle open/close animations: spring-like entrance from bottom and smooth tween exit
  useGSAP(() => {
    if (isOpen) {
      setMounted(true);
    } else if (mounted) {
      // Animate out: ágil e suave
      dialogRef.current?.setAttribute('data-animating', '');
      const tl = gsap.timeline({
        onComplete: () => setMounted(false)
      });
      if (backdropRef.current) tl.to(backdropRef.current, { opacity: 0, duration: 0.22, ease: 'power2.out' }, 0);
      if (dialogRef.current) tl.to(dialogRef.current, { y: '100%', duration: 0.26, ease: 'power3.inOut' }, 0);
    }
  }, { dependencies: [isOpen, mounted] });

  useGSAP(() => {
    if (mounted && isOpen) {
      // Animate in: entrada veloz e responsiva
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (backdropRef.current) gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.28, ease: 'power2.out' });
      const sheet = dialogRef.current;
      if (sheet) {
        sheet.setAttribute('data-animating', '');
        gsap.fromTo(
          sheet,
          { y: reduced ? '0%' : '100%', opacity: reduced ? 1 : 0.85 },
          {
            y: '0%',
            opacity: 1,
            duration: reduced ? 0 : 0.42,
            ease: 'power4.out',
            clearProps: 'transform,opacity',
            onComplete: () => sheet.removeAttribute('data-animating'),
          }
        );
      }
    }
  }, [mounted]);



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
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[50] will-change-[opacity]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${item?.id || ''}`}
        className={`article-sheet fixed inset-x-0 bottom-0 z-[60] rounded-t-[20px] h-[96vh] top-[4vh] ${
          isZenMode ? 'max-w-4xl' : 'max-w-[2000px] 4xl:max-w-[2400px]'
        } mx-auto overflow-hidden transform-gpu will-change-[transform,opacity] transition-[max-width] duration-300 border-t border-x border-border`}
      >
        <div
          ref={modalContainerRef}
          className="h-full w-full overflow-y-auto no-scrollbar pb-24"
        >
          <div ref={modalContentRef}>
            {/* Grab / Drag handle no topo para feedback visual de fechar arrastando */}
            <div className="w-full flex justify-center pt-2.5 pb-1 no-print">
              <span className="w-12 h-1 rounded-[20px] bg-text-main/20 hover:bg-text-main transition-colors cursor-grab active:cursor-grabbing" aria-hidden="true" />
            </div>

            {/* Header Section inside the Modal (Zen Mode minimiza distrações) */}
            <nav
              aria-label="Ações do artigo"
              className="sticky top-0 z-50 px-4 sm:px-8 2xl:px-12 py-3 bg-bg-main/90 backdrop-blur-md border-b border-border transition-colors no-print"
            >
              <div className="w-full flex items-center justify-between">
                <div
                  ref={progressRef}
                  aria-hidden="true"
                  data-testid="reading-progress"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main origin-left z-50 pointer-events-none"
                  style={{ transform: 'scaleX(0)' }}
                />
                <div className={`w-full flex items-center justify-between ${isZenMode ? 'h-10' : 'h-12'}`}>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <button
                      onClick={onClose}
                      aria-label="Voltar para a página anterior"
                      className="hover:text-text-main transition-colors flex items-center gap-2 py-1.5"
                    >
                      <ArrowLeft size={16} strokeWidth={1.5} />
                      <span className="hidden sm:inline font-mono uppercase text-[11px] tracking-[0.2em]">Voltar</span>
                    </button>
                    
                    {!isZenMode && (
                      <>
                        <div className="w-[1px] h-4 bg-border hidden sm:block mx-3" />
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-mono opacity-80">
                          <button onClick={onClose} className="hover:text-text-main transition-colors">INÍCIO</button>
                          <span className="text-border">/</span>
                          <span className="text-text-main font-semibold">{item?.category}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Ações do Artigo: Zen Mode, Tipografia, Compartilhar, PDF & Fechar */}
                  <div className="flex items-center gap-1">
                    <ArticleReadingControls
                      isZenMode={isZenMode}
                      onToggleZenMode={toggleZenMode}
                      typography={typography}
                      onTypographyChange={setTypography}
                    />

                    <div className="w-[1px] h-4 bg-border mx-2" />

                    <button
                      onClick={onClose}
                      aria-label="Fechar Modal de Artigo"
                      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors transform-gpu active:scale-95"
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

                <div className="w-full pt-8 pb-4 px-4 sm:px-8 md:px-12 2xl:px-16 mx-auto">
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
                <div className="px-4 sm:px-8 md:px-12 2xl:px-16 py-6 md:py-10 mx-auto w-full">
                  <div
                    className={`grid grid-cols-1 ${!isZenMode ? 'xl:grid-cols-[1fr_260px] 2xl:grid-cols-[1fr_300px]' : ''} gap-8 xl:gap-14 items-start w-full`}
                  >
                    {/* Corpo do texto: fluido, minimalista, editorial */}
                    <div ref={bodyRef} className="min-w-0 w-full">
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
                    <div className="flex flex-col">
                      <ArticleNeighbors articleId={item.id} replace />
                      <RelatedArticles articleId={item.id} replace />
                    </div>
                  )}
                  {/* Avaliar, sugerir correção e comentar: no fim da leitura */}
                  {item && (
                    <div>
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
