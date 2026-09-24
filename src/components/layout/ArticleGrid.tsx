"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cardVariants } from '@/lib/animations';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { FAQItem } from '../../types/index';
import { useReadingQueue } from '../../hooks/use-reading-queue';
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
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.38, delay: Math.min(0.18, index * 0.022), ease: [0.16, 1, 0.3, 1] } },
        hover: { y: -1.5, transition: { type: 'spring', stiffness: 450, damping: 32, mass: 0.6 } },
        tap: { scale: 0.985, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } }
      }}
      onClick={onClick} 
      className="group cursor-pointer relative py-6 border-b border-border hover:border-transparent flex flex-col justify-between h-full transform-gpu transition-colors duration-300"
    >
      {/* Background mais delicado: footprint menor (bordas menores) e raio mais suave */}
      <div className="absolute -inset-y-1 -inset-x-2 sm:-inset-x-3 rounded-lg bg-stone-50/80 dark:bg-white/[0.02] shadow-md shadow-stone-200/10 dark:shadow-black/10 opacity-0 group-hover:opacity-100 transition-all duration-[400ms] ease-out -z-10" />

      {/* Indicador Lateral mais contido e delicado */}
      <div className="absolute left-0 top-8 bottom-8 w-[1.5px] bg-text-main scale-y-0 lg:group-hover:scale-y-100 transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-top z-10 transform-gpu" />

      {/* Container interno: movimento reduzido para ser uma 'sugestão' e não um pulo brusco */}
      <motion.div 
        variants={{
          visible: { x: 0 },
          hover: { x: 4, transition: { type: 'spring', stiffness: 450, damping: 32, mass: 0.6 } },
          tap: { x: 2 }
        }}
        className="space-y-3 w-full transform-gpu"
      >
        
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted transition-colors duration-300 lg:group-hover:text-text-main">
                {item.category}
              </span>
              <div className="w-5 h-[0.5px] bg-border transition-colors duration-300 lg:group-hover:bg-text-main/50" />
              <span className="text-[10px] font-medium text-text-muted tracking-widest">
                {item.date}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleQueue(e);
              }}
              aria-label={isInQueue ? "Remover da lista de leitura" : "Salvar na lista de leitura"}
              className={`p-1.5 rounded-full transition-all duration-[300ms] ease-out z-20 hover:scale-110 active:scale-90 ${
                isInQueue 
                  ? 'text-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/30' 
                  : 'text-text-muted hover:text-text-main hover:bg-bg-island dark:hover:bg-white/5 opacity-0 group-hover:opacity-100'
              }`}
            >
              {isInQueue ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="w-full space-y-2 bg-transparent overflow-hidden">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-light leading-tight text-text-main transition-colors duration-300">
              {item.question}
            </h3>
            <p className="text-text-muted font-light leading-relaxed line-clamp-2 transition-colors duration-300 lg:group-hover:text-text-main text-base sm:text-lg">
              {item.answer}
            </p>
          </div>

          {/* Botão explorar animado via spring */}
          <motion.div 
            variants={{
              visible: { opacity: 0, y: 6 },
              hover: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25, delay: 0.05 } }
            }}
            className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-text-main transform-gpu pt-1" 
            aria-hidden="true"
          >
            Explorar Diretriz 
            <motion.div
              variants={{
                visible: { x: -4, y: 4 },
                hover: { x: 0, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25, delay: 0.08 } }
              }}
            >
              <ArrowUpRight size={14} strokeWidth={2} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
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
