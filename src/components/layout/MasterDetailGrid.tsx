import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, X, Plus, Check, ArrowLeft, ChevronRight, Printer, ShieldCheck, Calendar, Bell, Share2, Award } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { FAQItem } from '../../types/index';
import { useArticleContent } from '../../hooks/useArticleContent';
import { useReadingQueue } from '../../hooks/useReadingQueue';
import { ArticleContent } from '../article/ArticleContent';
import { ArticleSkeleton } from '../article/ArticleSkeleton';
import { ArticleFeedback } from '../article/ArticleFeedback';
import { ArticleReadingControls } from '../article/ArticleReadingControls';
import { TableOfContents } from '../article/TableOfContents';
import { ReadingExperienceService, TypographyPreferences } from '../../services/readingExperienceService';

const ModalArticleContent = ({ article, typography }: { article: FAQItem; typography?: any }) => {
  const { htmlContent, isLoading } = useArticleContent(article);

  if (isLoading) {
    return <ArticleSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Main Article Content */}
      <div className="flex-1 min-w-0">
        <ArticleContent htmlContent={htmlContent} articleId={article.id} typography={typography} />
        <ArticleFeedback articleId={article.id} question={article.question} />
      </div>
    </div>
  );
};

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId: string;
  item: FAQItem;
}

export const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, layoutId, item }) => {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scopedLenisRef = useRef<Lenis | null>(null);

  // Estados da nova experiência de leitura
  const [isZenMode, setIsZenMode] = useState(false);
  const [typography, setTypography] = useState<TypographyPreferences>(() => ReadingExperienceService.getTypography());
  const [goalReachedBanner, setGoalReachedBanner] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Barra de progresso de leitura
  const { scrollYProgress } = useScroll({
    container: modalContainerRef
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 350,
    damping: 35,
    restDelta: 0.001
  });

  // 1. Rastreamento Silencioso da Meta de Leitura (apenas dentro do artigo)
  useEffect(() => {
    if (!isOpen) return;

    // Registra artigo lido recentemente
    ReadingExperienceService.addRecentArticle(item.id);

    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(() => {
      // Contabiliza apenas se a aba estiver visível e focada
      if (document.visibilityState === 'visible') {
        const { completedNow } = ReadingExperienceService.addReadingTime(1);
        if (completedNow) {
          setGoalReachedBanner(true);
        }
      }
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, item.id]);

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

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
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
        alert('Link copiado para a área de transferência!');
      }
    }
  };

  useEffect(() => {
    let rafId: number | null = null;
    let timer: NodeJS.Timeout | null = null;
    let destroyed = false;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      timer = setTimeout(() => {
        if (!destroyed && modalContainerRef.current && modalContentRef.current) {
          const scopedLenis = new Lenis({
            wrapper: modalContainerRef.current,
            content: modalContentRef.current,
            duration: 0.5,
            easing: (t) => 1 - Math.pow(1 - t, 4),
            orientation: 'vertical',
            touchMultiplier: 1.5,
          });
          scopedLenisRef.current = scopedLenis;
          
          function raf(time: number) {
            if (destroyed) return;
            scopedLenis.raf(time);
            rafId = requestAnimationFrame(raf);
          }
          rafId = requestAnimationFrame(raf);
        }
      }, 30);
    } else {
      document.body.style.overflow = '';
      if (rafId) cancelAnimationFrame(rafId);
      scopedLenisRef.current?.destroy();
      scopedLenisRef.current = null;
    }

    return () => {
      destroyed = true;
      document.body.style.overflow = '';
      if (timer) clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      scopedLenisRef.current?.destroy();
      scopedLenisRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            onClick={onClose} 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[50] will-change-[opacity]" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, transition: { duration: 0.12 } }} 
            exit={{ opacity: 0, transition: { duration: 0.10 } }} 
          />
          
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`modal-title-${item.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.10, ease: [0.2, 0, 0, 1] } }}
            className={`fixed inset-x-0 bottom-0 z-[60] bg-bg-main rounded-t-2xl sm:rounded-t-[2.5rem] h-[96vh] top-[4vh] ${
              isZenMode ? 'max-w-4xl' : 'max-w-[2000px] 4xl:max-w-[2400px]'
            } mx-auto border-x border-t border-border overflow-hidden shadow-2xl transform-gpu will-change-[transform,opacity] transition-all duration-300`}
          >
            <div ref={modalContainerRef} className="h-full w-full overflow-y-auto no-scrollbar pb-24">
               <div ref={modalContentRef}>
                  {/* Header Section inside the Modal (Zen Mode minimiza distrações) */}
                  <nav className={`sticky top-0 z-50 w-full bg-bg-main/90 backdrop-blur-md border-b border-border no-print transition-all duration-150 transform-gpu ${
                    isZenMode ? 'py-1' : ''
                  }`}>
                    {/* Magnetic Reading Progress Bar */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main origin-left z-50"
                      style={{ scaleX }}
                    />
                    <div className="w-full px-6 md:px-12 2xl:px-16 h-16 2xl:h-20 flex items-center justify-between">
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
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <button onClick={onClose} className="hover:text-blue-600 transition-colors">Início</button>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="uppercase tracking-wide opacity-80">{item.category}</span>
                            <ChevronRight size={14} className="text-gray-400 hidden sm:block" />
                            <span className="font-semibold text-text-main truncate max-w-[150px] sm:max-w-xs md:max-w-md hidden sm:block">
                              {item.question}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Ações do Artigo: Zen Mode, Tipografia, Compartilhar, PDF & Fechar */}
                      <div className="flex items-center gap-2">
                        {/* Controles de Leitura e Modo Foco */}
                        <ArticleReadingControls
                          isZenMode={isZenMode}
                          onToggleZenMode={() => setIsZenMode(!isZenMode)}
                          onTypographyChange={setTypography}
                        />

                        {/* Botão de Compartilhamento Nativo */}
                        <button
                          onClick={handleShare}
                          title="Compartilhar Artigo"
                          aria-label="Compartilhar Artigo"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <Share2 size={14} />
                          <span className="hidden sm:inline">{shareFeedback ? 'Copiado!' : 'Compartilhar'}</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          title="Exportar Procedimento em PDF / Imprimir"
                          aria-label="Exportar Procedimento em PDF ou Imprimir"
                          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <Printer size={14} />
                          <span className="hidden sm:inline">PDF</span>
                        </button>

                        <button 
                          onClick={onClose} 
                          aria-label="Fechar artigo"
                          className="p-2.5 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors rounded-full text-text-muted hover:text-text-main min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <X size={22} />
                        </button>
                      </div>
                    </div>
                  </nav>

                  {/* Banner Elegante de Meta de Leitura Atingida */}
                  {goalReachedBanner && (
                    <div className="bg-text-main text-bg-main px-6 py-3 border-b border-border flex items-center justify-between animate-fade-in-up">
                      <div className="flex items-center gap-2.5 text-xs font-medium">
                        <Award size={16} className="text-amber-400 shrink-0" />
                        <span>Parabéns! Você alcançou sua <strong>Meta de Leitura</strong> programada na lista.</span>
                      </div>
                      <button
                        onClick={() => setGoalReachedBanner(false)}
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
                        <h2 className="text-xl font-bold uppercase tracking-wider">Base Corporativa de Conhecimento SST</h2>
                        <p className="text-xs text-stone-600">Diretoria de Governança, Saúde e Segurança do Trabalho</p>
                      </div>
                      <div className="text-right text-xs text-stone-500">
                        <p>Documento Rastreável</p>
                        <p>Impresso em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full pt-10 pb-6 px-6 md:px-16 2xl:px-24">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        {/* Selo Editorial de Gestão de Validade e Auditoria */}
                        <div className="inline-flex items-center gap-3 py-1 px-3 border-y border-border text-[11px] uppercase tracking-[0.18em] text-text-muted">
                          <span className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
                            <span>Auditado: <span className="font-semibold text-text-main">{item.lastReviewed || item.date}</span></span>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>Ciclo: <span className="font-semibold text-text-main">{item.validityMonths || 12}M</span></span>
                          <span className="w-1 h-1 rounded-full bg-border hidden sm:inline" />
                          <span className="opacity-75 hidden sm:inline">{item.verifiedBy || 'Engenharia de SST'}</span>
                        </div>

                        <h1 
                          className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium text-text-main leading-tight mb-8"
                        >
                          {item.question}
                        </h1>
                        
                        <p className="text-xl md:text-2xl font-serif font-bold text-text-main leading-relaxed mb-8 max-w-3xl mx-auto">
                            {item.answer}
                        </p>
                    </div>
                  </div>

                  {/* Grid de Conteúdo Principal + Índice Dinâmico (ToC) */}
                  <div className="p-6 md:p-12 2xl:p-16 max-w-6xl mx-auto">
                    <div className={`grid grid-cols-1 ${!isZenMode ? 'xl:grid-cols-[1fr_260px]' : ''} gap-12 items-start`}>
                      <div className="min-w-0">
                        <ModalArticleContent article={item} typography={typography} />
                      </div>

                      {/* Índice Dinâmico à Direita (oculto no Modo Zen) */}
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

interface CardItemProps {
  item: FAQItem;
  onClick: () => void;
  isInQueue: boolean;
  onToggleQueue: (e?: React.MouseEvent) => void;
}

export const CardItem: React.FC<CardItemProps> = ({ item, onClick, isInQueue, onToggleQueue }) => {
  return (
    <div onClick={onClick} className="group cursor-pointer relative py-6 border-b border-border transition-all duration-150 ease-out transform-gpu active:scale-[0.99] active:opacity-90 lg:hover:pl-3 flex flex-col justify-between h-full">
      {/* Indicador de Hover Lateral */}
      <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-text-main scale-y-0 lg:group-hover:scale-y-100 transition-transform duration-150 ease-out origin-top z-10 transform-gpu" />

      <div className="space-y-3 w-full">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700 dark:text-stone-300">
                {item.category}
              </span>
              <div className="w-5 h-[0.5px] bg-stone-400 dark:bg-stone-600" />
              <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400 tracking-widest">
                {item.date}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleQueue(e);
              }}
              className={`p-1.5 rounded-full transition-colors duration-150 z-20 ${isInQueue ? 'text-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/30' : 'text-stone-500 hover:text-text-main hover:bg-stone-100 dark:hover:bg-white/5'
                }`}
            >
              {isInQueue ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="w-full space-y-2 bg-transparent">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-light leading-tight text-text-main transition-transform duration-150 ease-out transform-gpu group-hover:translate-x-1">
              {item.question}
            </h3>

            <p className="text-stone-700 dark:text-stone-300 font-light leading-relaxed line-clamp-2 transition-colors duration-150 group-hover:text-text-main text-base sm:text-lg">
              {item.answer}
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 dark:text-stone-300 opacity-0 lg:group-hover:opacity-100 transition-all duration-150 ease-out translate-y-1 lg:group-hover:translate-y-0 transform-gpu" aria-hidden="true">
            Explorar Diretriz <ArrowUpRight size={12} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MasterDetailGrid = ({ items, onModalStateChange }: { items: FAQItem[], onModalStateChange?: (isOpen: boolean) => void }) => {
  const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null);
  const { queue, toggleQueue } = useReadingQueue();
  const location = useLocation();

  const handleSetSelected = (item: FAQItem | null) => {
    setSelectedItem(item);
    onModalStateChange?.(!!item);
  };

  // Se a URL mudar (ex: usuário clicou no Home da Sidebar), o modal deve ser fechado
  useEffect(() => {
    if (selectedItem) {
      handleSetSelected(null);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-x-8 lg:gap-x-12 2xl:gap-x-16 3xl:gap-x-20 gap-y-4 2xl:gap-y-6">
        {items.map(item => (
          <CardItem 
            key={item.id} 
            item={item} 
            onClick={() => handleSetSelected(item)}
            isInQueue={queue.includes(item.id)}
            onToggleQueue={() => toggleQueue(item.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ContentModal 
            key="content-modal"
            isOpen={!!selectedItem} 
            onClose={() => handleSetSelected(null)} 
            layoutId={selectedItem.id}
            item={selectedItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
