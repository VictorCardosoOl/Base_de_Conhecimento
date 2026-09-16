"use client";
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, X, Plus, Check, ArrowLeft, ChevronRight, Printer, ShieldCheck, Calendar, Bell, Share2, Award } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { FAQItem } from '../../types/index';
import { useArticleContent } from '../../hooks/use-article-content';
import { useReadingQueue } from '../../hooks/use-reading-queue';
import { useReadingGoalTracker } from '../../hooks/use-reading-goal-tracker';
import { ArticleContent } from '../article/ArticleContent';
import { ArticleSkeleton } from '../article/ArticleSkeleton';
import { ArticleFeedback } from '../article/ArticleFeedback';
import { ArticleReadingControls } from '../article/ArticleReadingControls';
import { TableOfContents } from '../article/TableOfContents';
import { ReadingExperienceService, TypographyPreferences } from '../../services/reading-experience-service';
import { ArticleModal } from './ArticleModal';

interface CardItemProps {
  item: FAQItem;
  onClick: () => void;
  isInQueue: boolean;
  onToggleQueue: (e?: React.MouseEvent) => void;
}

export const CardItem: React.FC<CardItemProps & { index?: number }> = ({ item, onClick, isInQueue, onToggleQueue, index = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.38, 
        delay: Math.min(0.2, index * 0.025), 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileTap={{ scale: 0.99, opacity: 0.9 }}
      onClick={onClick} 
      className="group cursor-pointer relative py-6 border-b border-border transition-colors duration-150 transform-gpu lg:hover:pl-3 flex flex-col justify-between h-full"
    >
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
              aria-label={isInQueue ? "Remover da lista de leitura" : "Salvar na lista de leitura"}
              className={`p-1.5 rounded-full transition-all duration-200 z-20 hover:scale-110 active:scale-95 ${isInQueue ? 'text-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/30' : 'text-stone-500 hover:text-text-main hover:bg-stone-100 dark:hover:bg-white/5'
                }`}
            >
              {isInQueue ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="w-full space-y-2 bg-transparent overflow-hidden">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-light leading-tight text-text-main transition-transform duration-200 ease-out transform-gpu group-hover:translate-x-1.5">
              {item.question}
            </h3>

            <p className="text-stone-700 dark:text-stone-300 font-light leading-relaxed line-clamp-2 transition-colors duration-150 group-hover:text-text-main text-base sm:text-lg">
              {item.answer}
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 dark:text-stone-300 opacity-0 lg:group-hover:opacity-100 transition-all duration-200 ease-out translate-y-1 lg:group-hover:translate-y-0 transform-gpu" aria-hidden="true">
            Explorar Diretriz <ArrowUpRight size={12} strokeWidth={1.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ArticleGrid = ({ items, onModalStateChange }: { items: FAQItem[], onModalStateChange?: (isOpen: boolean) => void }) => {
  const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null);
  const { queue, toggleQueue } = useReadingQueue();
  const location = usePathname();

  const handleSetSelected = (item: FAQItem | null) => {
    setSelectedItem(item);
    onModalStateChange?.(!!item);
  };

  // Se a URL mudar (ex: usuário clicou no Home da Sidebar), o modal deve ser fechado
  useEffect(() => {
    if (selectedItem) {
      handleSetSelected(null);
    }
  }, [location]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-x-8 lg:gap-x-12 2xl:gap-x-16 3xl:gap-x-20 gap-y-4 2xl:gap-y-6">
        {items.map((item, idx) => (
          <CardItem 
            key={item.id} 
            item={item} 
            index={idx}
            onClick={() => handleSetSelected(item)}
            isInQueue={queue.includes(item.id)}
            onToggleQueue={() => toggleQueue(item.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ArticleModal 
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
