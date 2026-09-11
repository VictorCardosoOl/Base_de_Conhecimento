import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, X, Plus, Check, ArrowLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { FAQItem } from '../../types/index';
import { useArticleContent } from '../../hooks/useArticleContent';
import { useReadingQueue } from '../../hooks/useReadingQueue';
import { ArticleContent } from '../article/ArticleContent';
import { ArticleSkeleton } from '../article/ArticleSkeleton';

const ModalArticleContent = ({ article }: { article: FAQItem }) => {
  const { htmlContent, isLoading } = useArticleContent(article);

  // Tempo de leitura estimado baseado em 200 palavras por minuto (usando o tamanho aproximado)
  const readingTime = Math.max(1, Math.ceil((article.searchText?.length || 1000) / 1000));

  if (isLoading) {
    return <ArticleSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Main Article Content */}
      <div className="flex-1 min-w-0">
        <ArticleContent htmlContent={htmlContent} />
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

  // Barra de progresso de leitura
  const { scrollYProgress } = useScroll({
    container: modalContainerRef
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 350,
    damping: 35,
    restDelta: 0.001
  });

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
            className="fixed inset-x-0 bottom-0 z-[60] bg-bg-main rounded-t-2xl sm:rounded-t-[2.5rem] h-[96vh] top-[4vh] max-w-[2000px] 4xl:max-w-[2400px] mx-auto border-x border-t border-border overflow-hidden shadow-2xl transform-gpu will-change-[transform,opacity]"
          >
            <div ref={modalContainerRef} className="h-full w-full overflow-y-auto no-scrollbar pb-24">
               <div ref={modalContentRef}>
                  {/* Header Section inside the Modal (No image placeholder) */}
                  <nav className="sticky top-0 z-50 w-full bg-bg-main/90 backdrop-blur-md border-b border-border no-print transition-all duration-150 transform-gpu">
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
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <button onClick={onClose} className="hover:text-blue-600 transition-colors">Início</button>
                        <ChevronRight size={14} className="text-gray-400" />
                        <span className="uppercase tracking-wide opacity-80">{item.category}</span>
                        <ChevronRight size={14} className="text-gray-400 hidden sm:block" />
                        <span className="font-semibold text-text-main truncate max-w-[150px] sm:max-w-xs md:max-w-md hidden sm:block">
                          {item.question}
                        </span>
                      </div>
                      
                      {/* Botão X para fechar */}
                      <button 
                        onClick={onClose} 
                        aria-label="Fechar artigo"
                        className="p-2.5 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors rounded-full text-text-muted hover:text-text-main min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X size={22} />
                      </button>
                    </div>
                  </nav>

                  <div className="w-full pt-12 2xl:pt-20 pb-6 px-6 md:px-16 2xl:px-24">
                    <div className="max-w-5xl 2xl:max-w-6xl mx-auto text-center">
                        <h1 
                          className="text-3xl md:text-5xl lg:text-6xl 2xl:text-7xl font-serif font-medium text-text-main leading-tight mb-8 2xl:mb-12"
                        >
                          {item.question}
                        </h1>
                        
                        <p className="text-xl md:text-2xl 2xl:text-3xl font-serif font-bold text-text-main leading-relaxed mb-8 max-w-4xl mx-auto">
                            {item.answer}
                        </p>
                    </div>
                  </div>

                  <div className="p-6 md:p-12 2xl:p-16 max-w-4xl 2xl:max-w-5xl mx-auto">
                    <ModalArticleContent article={item} />
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
