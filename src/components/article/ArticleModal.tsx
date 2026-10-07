'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Printer,
  ShieldCheck,
  Share2,
  Award,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { FAQItem } from '@/types/index';
import { useArticleContent } from '@/hooks/use-article-content';
import { useReadingGoalTracker } from '@/hooks/use-reading-goal-tracker';
import { useScopedLenis } from '@/hooks/use-scoped-lenis';
import { useShare } from '@/hooks/use-share';
import dynamic from 'next/dynamic';

const ArticleContent = dynamic(
  () => import('./ArticleContent').then((mod) => mod.ArticleContent),
  { ssr: false }
);
import { ArticleSkeleton } from './ArticleSkeleton';
import { ArticleFeedback } from './ArticleFeedback';
import { ArticleReadingControls } from './ArticleReadingControls';
import { TableOfContents } from './TableOfContents';
import {
  ReadingExperienceService,
  TypographyPreferences,
} from '@/services/reading-experience-service';
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
  const [scrollProgress, setScrollProgress] = useState(0);

  useFocusTrap(dialogRef, isOpen);

  // Lenis scoped — gerenciado pelo hook centralizado (use-scoped-lenis.ts)
  useScopedLenis(modalContainerRef, modalContentRef, isOpen);

  // Estados da nova experiência de leitura
  const [isZenMode, setIsZenMode] = useState(false);
  const [typography, setTypography] = useState<TypographyPreferences>(() =>
    ReadingExperienceService.getTypography()
  );
  const { shareContent, shareFeedback } = useShare();

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
      const tl = gsap.timeline({
        onComplete: () => setMounted(false)
      });
      if (backdropRef.current) tl.to(backdropRef.current, { opacity: 0, duration: 0.22, ease: 'power3.in' }, 0);
      if (dialogRef.current) tl.to(dialogRef.current, { y: '100vh', duration: 0.5, ease: 'power3.in' }, 0);
    }
  }, { dependencies: [isOpen, mounted] });

  useGSAP(() => {
    if (mounted && isOpen) {
      // Animate in
      if (backdropRef.current) gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.38, ease: 'power4.out' });
      if (dialogRef.current) gsap.fromTo(dialogRef.current, { y: '100vh' }, { y: 0, duration: 0.6, ease: 'power4.out', delay: 0.05 });
    }
  }, [mounted]);

  // Handle Scroll Progress
  useEffect(() => {
    const container = modalContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollable = scrollHeight - clientHeight;
      const progress = scrollable > 0 ? scrollTop / scrollable : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
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

  // Compartilhamento nativo via Web Share API
  const handleShare = () => {
    if (item) {
      shareContent(item.question, item.answer, window.location.href);
    }
  };

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
        className="fixed inset-0 bg-black/80 z-[50] will-change-[opacity]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${item?.id || ''}`}
        className={`fixed inset-x-0 bottom-0 z-[60] bg-bg-main rounded-t-2xl sm:rounded-t-[2.5rem] h-[96vh] top-[4vh] ${
          isZenMode ? 'max-w-4xl' : 'max-w-[2000px] 4xl:max-w-[2400px]'
        } mx-auto border-x border-t border-border overflow-hidden shadow-2xl transform-gpu will-change-[transform,opacity] transition-colors transition-[max-width] duration-300`}
      >
        <div
          ref={modalContainerRef}
          className="h-full w-full overflow-y-auto no-scrollbar pb-24"
        >
          <div ref={modalContentRef}>
            {/* Header Section inside the Modal (Zen Mode minimiza distrações) */}
            <nav
              className={`sticky top-0 z-50 w-full bg-bg-main border-b border-border no-print transition-all duration-150 transform-gpu ${
                isZenMode ? 'py-1' : ''
              }`}
            >
              {/* Magnetic Reading Progress Bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main origin-left z-50 transition-transform duration-[120ms] ease-out"
                style={{ transform: `scaleX(${scrollProgress})` }}
              />
                  <div className="w-full h-16 2xl:h-20 flex items-center justify-between px-6 md:px-10 lg:px-16">
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

                      <div className="w-[1px] h-4 bg-border mx-2 hidden sm:block" />

                      {/* Impressão Dinâmica (PDF) */}
                      <button
                        onClick={() => window.print()}
                        aria-label="Gerar PDF do Artigo"
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors flex items-center"
                      >
                        <Printer size={16} />
                      </button>

                      {/* Compartilhar Nativo / Área de Transferência */}
                      <button
                        onClick={handleShare}
                        aria-label="Compartilhar"
                        className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                          shareFeedback
                            ? 'text-green-600'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        <Share2 size={16} />
                      </button>

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

                <div className="w-full pt-10 pb-6 px-6 md:px-16 2xl:px-24">
                  <div className="max-w-4xl mx-auto text-center space-y-6">
                    {/* Selo Editorial de Gestão de Validade e Auditoria */}
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-text-muted font-medium mb-6">
                      <span className="flex items-center gap-2 text-text-main">
                        <ShieldCheck
                          size={16}
                          className="text-text-main stroke-[1.5]"
                        />
                        <span>Auditado: {item?.lastReviewed || item?.date}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>Ciclo: {item?.validityMonths || 12}M</span>
                      <span className="w-1 h-1 rounded-full bg-border hidden sm:inline" />
                      <span className="hidden sm:inline">
                        {item?.verifiedBy || 'Eng. SST / Jurídico'}
                      </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-text-main leading-tight mb-8">
                      {item?.question}
                    </h1>

                    <p className="text-xl md:text-2xl font-serif font-bold text-text-main leading-relaxed mb-8 max-w-3xl mx-auto">
                      {item?.answer}
                    </p>
                  </div>
                </div>

                {/* Grid de Conteúdo Principal + Índice Dinâmico (ToC) */}
                <div className="p-6 md:p-12 2xl:p-16 max-w-6xl mx-auto">
                  <div
                    className={`grid grid-cols-1 ${!isZenMode ? 'xl:grid-cols-[1fr_260px]' : ''} gap-12 items-start`}
                  >
                    <div className="min-w-0">
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
                        <TableOfContents containerRef={modalContainerRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* Feedback centralizado na tela toda (abaixo do grid) */}
                  {item && (
                    <div className="mt-12 col-span-full">
                      <ArticleFeedback articleId={item.id} question={item.question} />
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
