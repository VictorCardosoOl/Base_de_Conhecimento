'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
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
import { FAQItem } from '../../types/index';
import { useArticleContent } from '../../hooks/use-article-content';
import { useReadingGoalTracker } from '../../hooks/use-reading-goal-tracker';
import { useScopedLenis } from '../../hooks/use-scoped-lenis';
import {
  sheetVariants,
  fadeVariants,
  readingProgressSpring,
} from '@/lib/animations';
import { ArticleContent } from '../article/ArticleContent';
import { ArticleSkeleton } from '../article/ArticleSkeleton';
import { ArticleFeedback } from '../article/ArticleFeedback';
import { ArticleReadingControls } from '../article/ArticleReadingControls';
import { TableOfContents } from '../article/TableOfContents';
import {
  ReadingExperienceService,
  TypographyPreferences,
} from '../../services/reading-experience-service';

const ModalArticleContent = ({
  article,
  typography,
}: {
  article: FAQItem;
  typography?: any;
}) => {
  const { htmlContent, isLoading } = useArticleContent(article);

  if (isLoading) {
    return <ArticleSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Main Article Content */}
      <div className="flex-1 min-w-0">
        <ArticleContent
          htmlContent={htmlContent}
          articleId={article.id}
          typography={typography}
        />
        <ArticleFeedback articleId={article.id} question={article.question} />
      </div>
    </div>
  );
};

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId: string;
  item: FAQItem;
}

import { useFocusTrap } from '../../hooks/use-focus-trap';

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  layoutId,
  item,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);

  // Lenis scoped â€” gerenciado pelo hook centralizado (use-scoped-lenis.ts)
  useScopedLenis(modalContainerRef, modalContentRef, isOpen);

  // Estados da nova experiÃªncia de leitura
  const [isZenMode, setIsZenMode] = useState(false);
  const [typography, setTypography] = useState<TypographyPreferences>(() =>
    ReadingExperienceService.getTypography()
  );
  const [shareFeedback, setShareFeedback] = useState(false);

  // Hook modular para meta de leitura
  const { goalReachedBanner, dismissBanner } = useReadingGoalTracker({
    articleId: item.id,
    isActive: isOpen,
  });

  // Barra de progresso de leitura â€” spring preset centralizado em animations.ts
  const { scrollYProgress } = useScroll({
    container: modalContainerRef,
  });
  const scaleX = useSpring(scrollYProgress, readingProgressSpring);

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
  const handleShare = async () => {
    const shareData = {
      title: item.question,
      text: item.answer,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Erro ao compartilhar:', err);
        }
      }
    } else {
      // Fallback: Copiar URL para o clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      } catch {
        alert('Link copiado para a Ã¡rea de transferÃªncia!');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // PrevenÃ§Ã£o do Layout Shift (FOUC Scrollbar)
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            onClick={onClose}
            className="fixed inset-0 bg-black/80  z-[50] will-change-[opacity]"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`modal-title-${item.id}`}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed inset-x-0 bottom-0 z-[60] bg-bg-main rounded-t-2xl sm:rounded-t-[2.5rem] h-[96vh] top-[4vh] ${
              isZenMode ? 'max-w-4xl' : 'max-w-[2000px] 4xl:max-w-[2400px]'
            } mx-auto border-x border-t border-border overflow-hidden shadow-2xl transform-gpu will-change-[transform,opacity] transition-colors transition-[max-width] duration-300`}
          >
            <div
              ref={modalContainerRef}
              className="h-full w-full overflow-y-auto no-scrollbar pb-24"
            >
              <div ref={modalContentRef}>
                {/* Header Section inside the Modal (Zen Mode minimiza distraÃ§Ãµes) */}
                <nav
                  className={`sticky top-0 z-50 w-full bg-bg-main  border-b border-border no-print transition-all duration-150 transform-gpu ${
                    isZenMode ? 'py-1' : ''
                  }`}
                >
                  {/* Magnetic Reading Progress Bar */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main origin-left z-50"
                    style={{ scaleX }}
                  />
                  <div
                    className={`w-full h-16 2xl:h-20 flex items-center justify-between px-6 md:pr-12 2xl:pr-16 ${!isZenMode ? 'lg:pl-52 xl:pl-64' : 'md:pl-12 2xl:pl-16'}`}
                  >
                    <div className="flex items-center gap-4 text-xs 2xl:text-sm font-medium text-text-muted">
                      <button
                        onClick={onClose}
                        aria-label="Voltar para a página anterior"
                        className="hover:text-blue-600 transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px]"
                      >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Voltar</span>
                      </button>
                      {!isZenMode && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700">
                            |
                          </span>
                          <button
                            onClick={onClose}
                            className="hover:text-blue-600 transition-colors"
                          >
                            Início
                          </button>
                          <ChevronRight size={14} className="text-gray-400" />
                          <span className="uppercase tracking-wide opacity-80">
                            {item.category}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-gray-400 hidden sm:block"
                          />
                          <span className="font-semibold text-text-main truncate max-w-[150px] sm:max-w-xs md:max-w-md hidden sm:block">
                            {item.question}
                          </span>
                        </>
                      )}
                    </div>

                    {/* AÃ§Ãµes do Artigo: Zen Mode, Tipografia, Compartilhar, PDF & Fechar */}
                    <div className="flex items-center gap-2">
                      {/* Controles de Leitura e Modo Foco */}
                      <ArticleReadingControls
                        isZenMode={isZenMode}
                        onToggleZenMode={() => setIsZenMode(!isZenMode)}
                        typography={typography}
                        onTypographyChange={setTypography}
                      />

                      {/* ImpressÃ£o DinÃ¢mica (PDF) */}
                      <button
                        onClick={() => window.print()}
                        aria-label="Gerar PDF do Artigo"
                        className="p-2 sm:p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors flex items-center gap-2"
                      >
                        <Printer size={18} />
                        <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
                          PDF
                        </span>
                      </button>

                      {/* Compartilhar Nativo / Ãrea de TransferÃªncia */}
                      <button
                        onClick={handleShare}
                        aria-label="Compartilhar"
                        className={`p-2 sm:p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                          shareFeedback
                            ? 'text-green-600'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        <Share2 size={18} />
                      </button>

                      <div className="w-px h-6 bg-border mx-1 md:mx-2" />

                      <button
                        onClick={onClose}
                        aria-label="Fechar Modal de Artigo"
                        className="p-2 sm:p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 text-text-muted transition-colors transform-gpu active:scale-95"
                      >
                        <X size={20} />
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
                        ParabÃ©ns! VocÃª alcanÃ§ou sua{' '}
                        <strong>Meta de Leitura</strong> programada na lista.
                      </span>
                    </div>
                    <button
                      onClick={dismissBanner}
                      className="text-bg-main/80 hover:text-bg-main p-1"
                      aria-label="Fechar notificaÃ§Ã£o de meta"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* CabeÃ§alho oficial visÃ­vel apenas na impressÃ£o/PDF */}
                <div className="hidden print:block p-8 border-b-2 border-stone-800 text-stone-900 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-wider">
                        Base Corporativa de Conhecimento SST
                      </h2>
                      <p className="text-xs text-stone-600">
                        Diretoria de GovernanÃ§a, SaÃºde e SeguranÃ§a do
                        Trabalho
                      </p>
                    </div>
                    <div className="text-right text-xs text-stone-500">
                      <p>Documento RastreÃ¡vel</p>
                      <p>
                        Impresso em: {new Date().toLocaleDateString('pt-BR')}{' '}
                        Ã s {new Date().toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-10 pb-6 px-6 md:px-16 2xl:px-24">
                  <div className="max-w-4xl mx-auto text-center space-y-6">
                    {/* Selo Editorial de GestÃ£o de Validade e Auditoria */}
                    <div className="inline-flex items-center gap-3 py-1 px-3 border-y border-border text-[11px] uppercase tracking-[0.18em] text-text-muted">
                      <span className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck
                          size={13}
                          className="text-emerald-600 dark:text-emerald-400 stroke-[1.75]"
                        />
                        <span>
                          Auditado:{' '}
                          <span className="font-semibold text-text-main">
                            {item.lastReviewed || item.date}
                          </span>
                        </span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>
                        Ciclo:{' '}
                        <span className="font-semibold text-text-main">
                          {item.validityMonths || 12}M
                        </span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border hidden sm:inline" />
                      <span className="opacity-75 hidden sm:inline">
                        {item.verifiedBy || 'Engenharia de SST'}
                      </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium text-text-main leading-tight mb-8">
                      {item.question}
                    </h1>

                    <p className="text-xl md:text-2xl font-serif font-bold text-text-main leading-relaxed mb-8 max-w-3xl mx-auto">
                      {item.answer}
                    </p>
                  </div>
                </div>

                {/* Grid de ConteÃºdo Principal + Ãndice DinÃ¢mico (ToC) */}
                <div className="p-6 md:p-12 2xl:p-16 max-w-6xl mx-auto">
                  <div
                    className={`grid grid-cols-1 ${!isZenMode ? 'xl:grid-cols-[1fr_260px]' : ''} gap-12 items-start`}
                  >
                    <div className="min-w-0">
                      <ModalArticleContent
                        article={item}
                        typography={typography}
                      />
                    </div>

                    {/* Ãndice DinÃ¢mico Ã  Direita (oculto no Modo Zen) */}
                    {!isZenMode && (
                      <div className="hidden xl:block">
                        <TableOfContents containerRef={modalContainerRef} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
