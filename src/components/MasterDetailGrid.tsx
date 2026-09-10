import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, X, Plus, Check, ArrowLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { FAQItem } from '../types/index';
import { useArticleContent } from '../hooks/useArticleContent';
import { ArticleContent } from './ArticleContent';
import { ArticleSkeleton } from './ArticleSkeleton';

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

export const ContentModal = ({ isOpen, onClose, layoutId, item }: { isOpen: boolean, onClose: () => void, layoutId: string, item: FAQItem }) => {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scopedLenisRef = useRef<Lenis | null>(null);

  // Barra de progresso de leitura
  const { scrollYProgress } = useScroll({
    container: modalContainerRef
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const timer = setTimeout(() => {
        if (modalContainerRef.current && modalContentRef.current) {
            const scopedLenis = new Lenis({
                wrapper: modalContainerRef.current,
                content: modalContentRef.current,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                touchMultiplier: 2,
            });
            scopedLenisRef.current = scopedLenis;
            
            function raf(time: number) {
                scopedLenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      scopedLenisRef.current?.destroy();
    }
    return () => {
       document.body.style.overflow = '';
       scopedLenisRef.current?.destroy();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            onClick={onClose} 
            className="fixed inset-0 bg-black/90 z-[50]" 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            exit={{opacity:0}} 
          />
          
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`modal-title-${item.id}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "2%", opacity: 1, transition: { type: "spring", damping: 25, stiffness: 200, mass: 0.8 } }}
            exit={{ y: "5%", opacity: 0, transition: { duration: 0.2, ease: "easeOut" } }}
            className="fixed inset-0 z-[60] bg-bg-main rounded-t-[2rem] h-[98vh] border border-border overflow-hidden shadow-2xl"
          >
            <div ref={modalContainerRef} className="h-full w-full overflow-y-auto no-scrollbar pb-20">
               <div ref={modalContentRef}>
                  {/* Header Section inside the Modal (No image placeholder) */}
                  <nav className="sticky top-0 z-50 w-full bg-bg-main/90 backdrop-blur-md border-b border-border no-print transition-all duration-300">
                    {/* Magnetic Reading Progress Bar */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main origin-left z-50"
                      style={{ scaleX }}
                    />
                    <div className="w-full px-6 md:px-8 h-16 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
                        <button
                          onClick={onClose}
                          aria-label="Voltar para a página anterior"
                          className="hover:text-blue-600 transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px]"
                        >
                          <ArrowLeft size={14} />
                          <span className="hidden sm:inline">Voltar</span>
                        </button>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <button onClick={onClose} className="hover:text-blue-600 transition-colors">Início</button>
                        <ChevronRight size={12} className="text-gray-400" />
                        <span className="uppercase tracking-wide opacity-80">{item.category}</span>
                        <ChevronRight size={12} className="text-gray-400 hidden sm:block" />
                        <span className="font-semibold text-text-main truncate max-w-[150px] sm:max-w-xs hidden sm:block">
                          {item.question}
                        </span>
                      </div>
                      
                      {/* Botão X para fechar */}
                      <button 
                        onClick={onClose} 
                        aria-label="Fechar artigo"
                        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors rounded-full text-text-muted hover:text-text-main min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </nav>

                  <div className="w-full pt-12 pb-6 px-6 md:px-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.h1 
                          layoutId={`title-${item.id}`} 
                          className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-text-main leading-tight mb-8"
                        >
                          {item.question}
                        </motion.h1>
                        
                        <p className="text-xl md:text-2xl font-serif font-bold text-text-main leading-relaxed mb-8 max-w-3xl mx-auto">
                            {item.answer}
                        </p>
                    </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="p-6 md:p-12"
                  >
                    <ModalArticleContent article={item} />
                  </motion.div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

import { useReadingQueue } from '../hooks/useReadingQueue';

export const CardItem = ({ item, onClick, isInQueue, onToggleQueue }: { item: FAQItem, onClick: () => void, isInQueue: boolean, onToggleQueue: (e: React.MouseEvent) => void }) => {
  return (
    <div onClick={onClick} className="group cursor-pointer relative py-6 border-b border-border transition-all duration-700 lg:hover:pl-4 flex flex-col justify-center">
      {/* Indicador de Hover Lateral */}
      <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-text-main scale-y-0 lg:group-hover:scale-y-100 transition-transform duration-700 origin-top z-10" />

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
              className={`p-1.5 rounded-full transition-all duration-500 z-20 ${isInQueue ? 'text-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/30' : 'text-stone-500 hover:text-text-main hover:bg-stone-100 dark:hover:bg-white/5'
                }`}
            >
              {isInQueue ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <motion.div className="max-w-4xl space-y-2 bg-transparent">
            <motion.h3 layoutId={`title-${item.id}`} className="text-2xl md:text-3xl lg:text-4xl font-serif font-light leading-tight text-text-main transition-transform duration-700 group-hover:translate-x-1">
              {item.question}
            </motion.h3>

            <p className="text-stone-700 dark:text-stone-300 font-light leading-relaxed line-clamp-2 transition-colors duration-500 group-hover:text-text-main text-lg md:text-xl max-w-3xl">
              {item.answer}
            </p>
          </motion.div>

          <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 dark:text-stone-300 opacity-0 lg:group-hover:opacity-100 transition-all duration-700 translate-y-1 lg:group-hover:translate-y-0" aria-hidden="true">
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
      <div className="flex flex-col">
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
